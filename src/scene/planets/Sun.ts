import {
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  SphereGeometry,
  Vector3,
} from 'three';
import { invariant } from '../../lib/invariant';
import { CelestialBody } from './CelestialBody';
import { CoronalHaze } from './CoronalHaze';

const WIDTH_SEGMENTS = 96;
const HEIGHT_SEGMENTS = 48;

interface IPlanetOptions {
  mass?: number;
  oblateness?: number;
  // texture?: string;
  roughnessTexture?: string;
  atmosphereThickness?: number;
  atmosphereColor?: Color;
  atmosphereOpacity?: number;
  luminosity?: number;
  luminousColor?: Color;
  luminousDistance?: number;
}

// const loader = new TextureLoader();

export class Sun extends CelestialBody {
  public readonly type = 'star';
  public readonly velocity = new Vector3();
  public mesh: Mesh<BufferGeometry, MeshBasicMaterial>;
  public geometry: BufferGeometry;
  private material: MeshBasicMaterial;

  constructor(name: string, radius: number, options: IPlanetOptions = {}) {
    super(name, radius, options.mass ?? 1);
    this.material = new MeshBasicMaterial({
      // map: options.texture ? loader.load(options.texture) : undefined,
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
      new CoronalHaze(this.group, {
        radius,
        thickness: options.atmosphereThickness,
        color: options.atmosphereColor ?? new Color(1, 1, 1),
        opacity: options.atmosphereOpacity ?? 1,
      });
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

  public simulate(delta: number) {
    this.satellites.forEach(sat => sat.simulate(delta));
  }

  public animate(delta: number) {
    this.satellites.forEach(sat => sat.animate(delta));
  }
}
