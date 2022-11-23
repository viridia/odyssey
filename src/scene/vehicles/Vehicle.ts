import {
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import { OrbitalElements } from '../../math/OrbitalElements';
import { FlightPathOverlay } from '../overlays/FlightPathOverlay';
import { CelestialBody } from '../planets/CelestialBody';

export class Vehicle {
  // Position and velocity in ecliptic coords.
  public readonly position = new Vector3();
  public readonly velocity = new Vector3();
  public counter = 0;

  // Position and velocity relative to current primary.
  public primary: CelestialBody | null = null;

  public readonly group = new Group();

  // TODO: Need multiple of these.
  private orbit = new OrbitalElements();

  // TODO:
  // array of orbital elements with time ranges.
  private path = new FlightPathOverlay();

  constructor(public readonly name: string, parent: Object3D) {
    parent.add(this.group);

    const material = new MeshStandardMaterial({
      color: new Color(0, 0, 1),
      emissive: new Color(0, 0, 0.5),
      depthTest: false,
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
      // TODO: ACC: This is not correct, we want to know the position of the primary
      // at a given point in the future.
      r.copy(this.position).sub(this.primary.position);
      rDot.copy(this.velocity); //.sub(this.primary.velocity);
      this.orbit.fromStateVector(r, rDot, this.primary.mass);

      this.path.update(this.primary, this.orbit);
    }
  }

  public update(deltaTime: number) {
    this.group.position.copy(this.position);
    this.counter += deltaTime * 0.1;
    if (this.primary) {
      const phi = MathUtils.euclideanModulo(this.counter, Math.PI * 2);
      const ta = this.orbit.trueAnomalyFromMean(phi + this.orbit.v);
      this.orbit.toIntertial(this.position, ta);
      this.position.add(this.primary.position);
      this.group.position.copy(this.position);
    }
  }
}

const r = new Vector3();
const rDot = new Vector3();
