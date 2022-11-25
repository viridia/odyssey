import { BufferGeometry, Color, Float32BufferAttribute, Mesh, Object3D, Vector3 } from 'three';
import { DiscMaterial } from './DiscMaterial';

interface IOptions {
  radius: number;
  color: Color;
  nominalDistance: number;
  minDistance: number;
}

/** A circular marker which can be used to visualize a point in space. */
export class DiscMarker {
  private material: DiscMaterial;
  private geometry = new BufferGeometry();
  private mesh: Mesh;

  constructor(parent: Object3D, options: IOptions) {
    const positionBuffer = new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2);
    const uvBuffer = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.geometry.setAttribute('position', positionBuffer);
    this.geometry.setAttribute('uv', uvBuffer);
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);

    this.material = new DiscMaterial();
    this.material.uniforms.scale.value = options.radius;
    this.material.uniforms.diffuse.value = options.color;
    this.material.uniforms.nominalDistance.value = options.nominalDistance;
    this.material.uniforms.minDistance.value = options.minDistance;
    this.material.uniforms.opacity.value = 1;
    this.material.needsUpdate = true;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.matrixAutoUpdate = true;
    this.mesh.visible = true;
    this.mesh.frustumCulled = false;

    parent.add(this.mesh);
  }

  public setPosition(position: Vector3) {
    this.mesh.position.copy(position);
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
