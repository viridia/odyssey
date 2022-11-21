import {
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { invariant } from '../../../lib/invariant';
import { getEngine } from '../../Engine';
import { AtmosphereHaloMaterial } from './AtmosphereHaloMaterial';

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

export class Planet {
  public mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  public geometry: BufferGeometry;
  public material: MeshStandardMaterial;
  public group = new Group();
  private atmoMesh?: Mesh<BufferGeometry, Material>;
  private atmoMaterial?: AtmosphereHaloMaterial;
  private timeOfDay = 0;

  // Need:
  // axis direction

  constructor(radius: number, options: IPlanetOptions = {}) {
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
    this.mesh.castShadow = true;
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
  }

  public addToScene(scene: Object3D): this {
    scene.add(this.group);
    return this;
  }

  public setParent(parent: Planet | null = null): this {
    if (parent) {
      parent.group.add(this.group);
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
    this.timeOfDay += delta;
    this.mesh.rotateOnAxis(axis, delta);
    if (this.atmoMaterial) {
      const engine = getEngine();
      v.copy(engine.sunlight.target.position);
      v.sub(engine.sunlight.position);
      v.normalize();
      this.atmoMaterial.setSunlight(v);
    }
  }
}

const v = new Vector3();
