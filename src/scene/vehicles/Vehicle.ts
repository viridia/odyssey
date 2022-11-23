import { Color, Group, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from 'three';
import { FlightPathOverlay } from '../overlays/FlightPathOverlay';
import { CelestialBody } from '../planets/CelestialBody';

export class Vehicle {
  // Position and velocity in ecliptic coords.
  public readonly position = new Vector3();
  public readonly velocity = new Vector3();

  // Position and velocity relative to current primary.
  public primary: CelestialBody | null = null;

  public readonly group = new Group();

  private path = new FlightPathOverlay();

  constructor(public readonly name: string, parent: Object3D) {
    parent.add(this.group);

    const material = new MeshStandardMaterial({
      color: new Color(0, 0, 1),
      emissive: new Color(0, 0, 0.5),
    });
    const sphere = new SphereGeometry(1e5, 64, 32);
    const mesh = new Mesh(sphere, material);
    this.group.add(mesh);
  }

  public setPrimary(primary: CelestialBody) {
    if (this.primary !== primary) {
      this.primary = primary;
    }
  }

  public calcOrbit() {
    if (this.primary) {
      this.path.calculateOrbit(this.primary, this.position, this.velocity);
    }
  }

  public update(_deltaTime: number) {
    this.group.position.copy(this.position);
  }
}
