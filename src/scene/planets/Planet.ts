import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { getSimulator } from '../Simulator';
import { AtmosphereHaloMaterial } from './AtmosphereHaloMaterial';
import { CelestialBody } from './CelestialBody';

const WIDTH_SEGMENTS = 96;
const HEIGHT_SEGMENTS = 48;
const XPOS = new Vector3(1, 0, 0);

interface IPlanetOptions {
  mass?: number;
  oblateness?: number;
  texture?: string;
  roughnessTexture?: string;
  atmosphereThickness?: number;
  atmosphereColor?: Color;
  atmosphereOpacity?: number;
  luminosity?: number;
  luminousColor?: Color;
  luminousDistance?: number;
}

const loader = new TextureLoader();

const axis = new Vector3(0, 1, 0);

export class Planet extends CelestialBody {
  public mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  public geometry: BufferGeometry;
  public material: MeshStandardMaterial;
  private atmoMesh?: Mesh<BufferGeometry, Material>;
  private atmoMaterial?: AtmosphereHaloMaterial;
  private sunlightDir = new Vector3();
  private timeOfDay = 0;
  private lpMaterial: MeshBasicMaterial;
  private lpMesh: Mesh<BufferGeometry, MeshBasicMaterial>;
  // private dayLength = 24 * 60 * 60;
  // private yearLength;

  // Need:
  // axis direction

  constructor(
    name: string,
    radius: number,
    options: IPlanetOptions = {}
  ) {
    super(name, radius, options.mass ?? 1);
    this.material = new MeshStandardMaterial({
      map: options.texture ? loader.load(options.texture) : undefined,
    });
    this.geometry = new SphereGeometry(radius, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
    // if (options.oblateness) {
    //   const position = this.geometry.getAttribute('position');
    //   invariant(position);
    //   for (let i = 0, ct = position.count; i < ct; i++) {
    //     const y = position.getY(i);
    //     position.setY(i, y * (1 - options.oblateness));
    //   }
    // }

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.scale.set(1, 1 + (options.oblateness ?? 0), 1);
    this.mesh.rotateOnAxis(XPOS, Math.PI * 0.5);
    this.mesh.rotateOnAxis(XPOS, 23 * Math.PI / 180);
    // this.mesh.castShadow = true;
    // this.mesh.visible = false;

    this.group.add(this.mesh);

    // Small LOD sphere to display when planet gets very small.
    const lpSphere = new SphereGeometry(radius, 16, 8);
    this.lpMaterial = new MeshBasicMaterial({
      color: options.luminousColor ?? new Color(1, 1, 1),
      depthWrite: false,
      depthTest: false,
      transparent: true,
      blending: AdditiveBlending,
    });
    this.lpMesh = new Mesh(lpSphere, this.lpMaterial);
    this.lpMesh.visible = false;
    this.lpMesh.material.opacity = 1;
    this.group.add(this.lpMesh);

    if (options.atmosphereThickness) {
      this.atmoMaterial = new AtmosphereHaloMaterial({
        color: options.atmosphereColor ?? new Color(1.0, 1.0, 1.0),
        thickness: options.atmosphereThickness / radius,
        opacity: options.atmosphereOpacity ?? 1,
      });
      this.atmoMesh = new Mesh(this.geometry, this.atmoMaterial);
      this.atmoMesh.scale.set(1, 1 + (options.oblateness ?? 0), 1);
      this.atmoMesh.rotateOnAxis(XPOS, Math.PI * 0.5);
      this.group.add(this.atmoMesh);
    }

    if (options.luminosity) {
      const light = new PointLight(
        options.luminousColor,
        options.luminosity ?? 1,
        options.luminousDistance ?? 1_000_000
      );
      this.group.add(light);
    }

    // const orbit = new TranslucentLines();
    // orbit.setColor(new Color(0.2, 0.4, 0.0));
    // orbit.setOpacity(0.7, 0.1);
    // orbit.setVisible(true);
    // orbit.setParent(this.group);
    // orbit.setBlending(AdditiveBlending);

    // const position: number[] = [];
    // for (let phi = 0; phi <= 64; phi++) {
    //   const angle = (phi * Math.PI * 2) / 64;
    //   v.set(radius * 2 * Math.sin(angle), 0, radius * 2 * Math.cos(angle));
    //   position.push(...v.toArray());
    // }
    // orbit.updateGeometry(position);
  }

  public setPrimary(primary: CelestialBody | null = null): this {
    if (primary) {
      primary.group.add(this.group);
      primary.satellites.push(this);
    } else {
      this.group.removeFromParent();
    }
    return this;
  }

  public setAxis(): this {
    return this;
  }

  public setRotationSpeed(): this {
    return this;
  }

  public update(delta: number) {
    const sim = getSimulator();
    this.timeOfDay += delta;
    this.mesh.rotateOnAxis(axis, delta);

    // Get position in ecliptic coordinates.
    const position = this.position;

    // Calculate sunlight direction for atmo haze
    if (this.atmoMaterial) {
      sim.planets.sol.getWorldPosition(sunPosition);
      this.sunlightDir.copy(position).sub(sunPosition).normalize();
      this.sunlightDir.applyAxisAngle(XPOS, -Math.PI * 0.5);
      this.atmoMaterial.setSunlight(this.sunlightDir);
    }

    // Calculate visibility of low-poly sphere
    const dist = sim.cameraPosition.distanceTo(position);
    const lodDistance = this.radius * 8000;
    const distRatio = Math.pow(dist / lodDistance, 0.5);
    if (distRatio < 1) {
      this.lpMaterial.opacity = Math.max(0, 1 - (1 - distRatio) * 2);
      this.lpMesh.visible = this.lpMaterial.opacity > 0.1;
      this.mesh.visible = true;
    } else {
      this.lpMaterial.opacity = 1 / distRatio;
      this.lpMesh.visible = true;
      this.mesh.visible = false;
    }
    this.lpMesh.scale.setScalar(dist / lodDistance);

    this.satellites.forEach(sat => sat.update(delta));
  }
}

const sunPosition = new Vector3();