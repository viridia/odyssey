import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { invariant } from '../../lib/invariant';
import { getEngine } from '../Engine';
import { FlightPathHelper } from '../overlays/FlightPathHelper';
import { AtmosphereHaloMaterial } from './AtmosphereHaloMaterial';
import { IPrimary, ISatellite } from './types';

const WIDTH_SEGMENTS = 96;
const HEIGHT_SEGMENTS = 48;

interface IPlanetOptions {
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

export class Planet implements IPrimary {
  public mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  public geometry: BufferGeometry;
  public material: MeshStandardMaterial;
  public group = new Group();
  public satellites: ISatellite[] = [];
  private atmoMesh?: Mesh<BufferGeometry, Material>;
  private atmoMaterial?: AtmosphereHaloMaterial;
  private sunlightDir = new Vector3();
  private timeOfDay = 0;
  // private dayLength = 24 * 60 * 60;
  // private yearLength;

  // Need:
  // axis direction

  constructor(public readonly name: string, radius: number, options: IPlanetOptions = {}) {
    this.material = new MeshStandardMaterial({
      map: options.texture ? loader.load(options.texture) : undefined,
    });
    this.geometry = new SphereGeometry(radius, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
    if (options.oblateness) {
      const position = this.geometry.getAttribute('position');
      invariant(position);
      for (let i = 0, ct = position.count; i < ct; i++) {
        const y = position.getY(i);
        position.setY(i, y * (1 - options.oblateness));
      }
    }

    this.mesh = new Mesh(this.geometry, this.material);
    // this.mesh.castShadow = true;
    // this.mesh.visible = false;
    this.group.add(this.mesh);

    if (options.atmosphereThickness) {
      this.atmoMaterial = new AtmosphereHaloMaterial({
        color: options.atmosphereColor ?? new Color(1.0, 1.0, 1.0),
        thickness: options.atmosphereThickness / radius,
        opacity: options.atmosphereOpacity ?? 1,
      });
      this.atmoMesh = new Mesh(this.geometry, this.atmoMaterial);
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

    const orbit = new FlightPathHelper();
    orbit.setColor(new Color(0.2, 0.4, 0.0));
    orbit.setOpacity(0.7, 0.1);
    orbit.setVisible(true);
    orbit.setParent(this.group);
    orbit.setBlending(AdditiveBlending);

    const position: number[] = [];
    for (let phi = 0; phi <= 64; phi++) {
      const angle = (phi * Math.PI * 2) / 64;
      v.set(radius * 2 * Math.sin(angle), 0, radius * 2 * Math.cos(angle));
      position.push(...v.toArray());
    }
    orbit.updateGeometry(position);
  }

  // public addToScene(scene: Object3D): this {
  //   scene.add(this.group);
  //   return this;
  // }

  public setPrimary(primary: IPrimary | null = null): this {
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

  public getWorldPosition(out: Vector3) {
    this.group.getWorldPosition(out);
  }

  public update(delta: number) {
    this.timeOfDay += delta;
    this.mesh.rotateOnAxis(axis, delta);
    if (this.atmoMaterial) {
      const engine = getEngine();
      engine.planets.sol.group.getWorldPosition(sunPosition);
      this.getWorldPosition(planetPosition);
      this.sunlightDir.copy(planetPosition).sub(sunPosition).normalize();
      this.atmoMaterial.setSunlight(this.sunlightDir);
    }
    this.satellites.forEach(sat => sat.update(delta));
  }
}

const sunPosition = new Vector3();
const planetPosition = new Vector3();

const v = new Vector3();
