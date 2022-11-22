import {
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  SphereGeometry,
} from 'three';
import { invariant } from '../../lib/invariant';
import { CoronaHaloMaterial } from './CoronaHaloMaterial';
import { IPrimary, ISatellite } from './types';

const WIDTH_SEGMENTS = 96;
const HEIGHT_SEGMENTS = 48;

interface IPlanetOptions {
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

export class Sun implements IPrimary {
  public mesh: Mesh<BufferGeometry, MeshBasicMaterial>;
  public geometry: BufferGeometry;
  public material: MeshBasicMaterial;
  public group = new Group();
  public satellites: ISatellite[] = [];
  private atmoMesh?: Mesh<BufferGeometry, Material>;
  private atmoMaterial?: CoronaHaloMaterial;

  constructor(public readonly name: string, radius: number, options: IPlanetOptions = {}) {
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
    // this.mesh.visible = false;
    this.group.add(this.mesh);

    if (options.atmosphereThickness) {
      this.atmoMaterial = new CoronaHaloMaterial({
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

  public setAxis(): this {
    return this;
  }

  public setRotationSpeed(): this {
    return this;
  }

  public update(delta: number) {
    this.satellites.forEach(sat => sat.update(delta));
  }
}
