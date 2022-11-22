import { Color, Group, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from 'three';
import { IPrimary } from '../planets/types';

export class Vehicle {
  // Position and velocity in heliocentric coords.
  public readonly position = new Vector3();
  public readonly velocity = new Vector3();

  // Position and velocity relative to current primary.
  public primary: IPrimary | null = null;

  public readonly group = new Group();

  constructor(public readonly name: string, parent: Object3D) {
    parent.add(this.group);

    const material = new MeshStandardMaterial({
      color: new Color(0, 0, 1),
    });
    const sphere = new SphereGeometry(1e5, 64, 32);
    const mesh = new Mesh(sphere, material);
    this.group.add(mesh);
  }

  public setPrimary(primary: IPrimary) {
    if (this.primary !== primary) {
      this.primary = primary;
    }
  }

  public update(_deltaTime: number) {
    this.group.position.copy(this.position);
  }
}
