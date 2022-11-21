import {
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TextureLoader,
} from 'three';
import { invariant } from '../../../lib/invariant';

const WIDTH_SEGMENTS = 96;
const HEIGHT_SEGMENTS = 48;

interface IPlanetOptions {
  oblateness?: number;
  texture?: string;
  atmosphereThickness?: number;
  atmosphhereColor?: Color;
}

const loader = new TextureLoader();

export class Planet {
  public mesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  public geometry: BufferGeometry;
  public material: MeshStandardMaterial;
  public group = new Group();

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
}
