import { BufferGeometry, Color, Float32BufferAttribute, Mesh, Object3D } from 'three';
import { CoronalHazeMaterial } from './CoronalHazeMaterial';

interface IOptions {
  radius: number;
  thickness: number;
  color: Color;
  opacity: number;
}

/** An instantiation of a particle system. */
export class CoronalHaze {
  private material: CoronalHazeMaterial;
  private geometry = new BufferGeometry();
  private mesh: Mesh;

  constructor(parent: Object3D, options: IOptions) {
    const positionBuffer = new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2);
    const uvBuffer = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.geometry.setAttribute('position', positionBuffer);
    this.geometry.setAttribute('uv', uvBuffer);
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);

    this.material = new CoronalHazeMaterial();
    this.material.uniforms.scale.value = options.radius + options.thickness;
    this.material.uniforms.diffuse.value = options.color;
    this.material.uniforms.thickness.value =
      options.thickness / (options.radius + options.thickness);
    this.material.uniforms.opacity.value = options.opacity;
    this.material.needsUpdate = true;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.matrixAutoUpdate = true;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;

    parent.add(this.mesh);
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
