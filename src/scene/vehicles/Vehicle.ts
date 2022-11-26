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
import { TranslucentDiscMarker } from '../overlays/TranslucentDiscMarker';
import { CelestialBody } from '../planets/CelestialBody';

export class Vehicle {
  // Position and velocity in ecliptic coords.
  public readonly position = new Vector3();
  public readonly velocity = new Vector3();

  // Position and velocity relative to current primary.
  public primary: CelestialBody | null = null;

  public readonly group = new Group();

  // TODO: Need multiple of these.
  private orbit = new OrbitalElements();

  // TODO:
  // array of orbital elements with time ranges.
  private path = new FlightPathOverlay();

  private material: MeshStandardMaterial;

  private marker: TranslucentDiscMarker;

  constructor(public readonly name: string, parent: Object3D) {
    parent.add(this.group);

    this.material = new MeshStandardMaterial({
      color: new Color(0, 0, 1).convertSRGBToLinear(),
      emissive: new Color(0, 0, 0.5).convertSRGBToLinear(),
      depthTest: false,
    });
    const sphere = new SphereGeometry(3e4, 64, 32);
    const mesh = new Mesh(sphere, this.material);
    this.group.add(mesh);

    // Small LOD sphere to display when planet gets very small.
    this.marker = new TranslucentDiscMarker(this.group, {
      radius: 0.0035,
      color: new Color(0, 0.6, 0).convertSRGBToLinear(),
      nominalDistance: 1e6,
      minDistance: 1e5,
    });
  }

  public dispose() {
    // TODO: dispose geometry.
    this.material.dispose();
    this.marker.dispose();
  }

  public setPrimary(primary: CelestialBody) {
    if (this.primary !== primary) {
      this.primary = primary;
    }
  }

  public calcOrbit() {
    if (this.primary) {
      r.copy(this.position).sub(this.primary.position);
      rDot.copy(this.velocity); //.sub(this.primary.velocity);
      this.orbit.fromStateVector(r, rDot, this.primary.mass);
      this.orbit.ma = -this.orbit.meanAnomalyFromTrue(this.orbit.v);

      this.path.update(this.primary, this.orbit);
    }
  }

  public simulate(delta: number) {
    this.group.position.copy(this.position);
    if (this.primary) {
      const n = this.orbit.meanMotion(this.primary.mass);
      const t = n * delta;
      if (this.orbit.e < 1) {
        // const m = this.orbit.meanAnomalyFromTrue(this.orbit.v);
        this.orbit.ma = MathUtils.euclideanModulo(this.orbit.ma + t, Math.PI * 2);
        // const phi = MathUtils.euclideanModulo(t + m, Math.PI * 2);
        const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
        this.orbit.toInertial(this.position, ta);
        this.position.add(this.primary.position);
      } else {
        // const m = this.orbit.meanAnomalyFromTrue(this.orbit.v);
        this.orbit.ma += t;
        const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
        this.orbit.toInertial(this.position, ta);
        this.position.add(this.primary.position);
      }

      // const distanceToPrimary = this.position.distanceTo(this.primary.position);
      // this.material.color = distanceToPrimary > this.primary.radius ? GREEN : RED;
    }
  }

  public animate() {
    this.group.position.copy(this.position);
    this.path.animate();
  }
}

const r = new Vector3();
const rDot = new Vector3();
