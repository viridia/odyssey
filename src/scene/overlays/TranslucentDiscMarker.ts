import { BufferGeometry, Color, Float32BufferAttribute, GreaterEqualDepth, LessDepth, Mesh, Object3D, Vector3 } from 'three';
import { DiscMaterial } from './DiscMaterial';

interface IOptions {
  radius: number;
  color: Color;
  nominalDistance: number;
  minDistance: number;
}

/** A circular marker which can be used to visualize a point in space.
    Displays translucently when behind objects.
 */
export class TranslucentDiscMarker {
  private material: DiscMaterial;
  private material2: DiscMaterial;
  private geometry = new BufferGeometry();
  private mesh: Mesh;
  private mesh2: Mesh;

  constructor(parent: Object3D, options: IOptions) {
    const positionBuffer = new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2);
    const uvBuffer = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.geometry.setAttribute('position', positionBuffer);
    this.geometry.setAttribute('uv', uvBuffer);
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);

    this.material = new DiscMaterial();
    this.material.depthWrite = false;
    this.material.depthTest = true;
    this.material.depthFunc = LessDepth;
    this.material.transparent = true;
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

    this.material2 = new DiscMaterial();
    this.material2.depthWrite = false;
    this.material2.depthTest = true;
    this.material2.depthFunc = GreaterEqualDepth;
    this.material2.transparent = true;
    this.material2.uniforms.scale.value = options.radius * 0.7;
    this.material2.uniforms.diffuse.value = options.color;
    this.material2.uniforms.nominalDistance.value = options.nominalDistance;
    this.material2.uniforms.minDistance.value = options.minDistance;
    this.material2.uniforms.opacity.value = 0.5;
    this.material2.needsUpdate = true;

    this.mesh2 = this.mesh.clone();
    this.mesh2.material = this.material2;
    this.mesh2.visible = true;

    parent.add(this.mesh2);
  }

  public setPosition(position: Vector3) {
    this.mesh.position.copy(position);
    this.mesh2.position.copy(position);
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.mesh2.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.material2.dispose();
  }
}
