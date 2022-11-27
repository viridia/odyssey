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
import { createLabel, TextLabel } from '../overlays/Label';
import { TranslucentDiscMarker } from '../overlays/TranslucentDiscMarker';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';

const MARKER_COLOR = new Color(0, 0.6, 0).convertSRGBToLinear();
const MARKER_SELECTED_COLOR = new Color(0.3, 0.8, 0.3).convertSRGBToLinear();

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
  private label: TextLabel;

  constructor(public readonly name: string, parent: Object3D) {
    parent.add(this.group);

    this.material = new MeshStandardMaterial({
      color: new Color(0, 0, 1).convertSRGBToLinear(),
      emissive: new Color(0, 0, 0.5).convertSRGBToLinear(),
      depthTest: false,
    });
    const sphere = new SphereGeometry(200, 64, 32);
    const mesh = new Mesh(sphere, this.material);
    this.group.add(mesh);

    // Small LOD sphere to display when planet gets very small.
    this.marker = new TranslucentDiscMarker(this.group, {
      radius: 0.0035,
      color: MARKER_COLOR,
      nominalDistance: 1e6,
      minDistance: 1e5,
    });

    this.label = createLabel(name);
    this.group.add(this.label);
  }

  public dispose() {
    // TODO: dispose geometry.
    this.material.dispose();
    this.marker.dispose();
    this.label.removeFromParent();
    this.label.dispose();
  }

  public setPrimary(primary: CelestialBody) {
    if (this.primary !== primary) {
      this.primary = primary;
    }
  }

  /** Copy world position to output vector. */
  public getWorldPosition(out: Vector3) {
    this.group.getWorldPosition(out);
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
    const sim = getSimulator();
    const selected = this === sim.selection.picked || this === sim.selection.selected;
    this.group.position.copy(this.position);
    const distToCamera = sim.camera.position.distanceTo(this.position);
    this.label.quaternion.copy(sim.camera.quaternion);
    this.label.scale.setScalar(distToCamera / 2e7);
    this.label.visible = selected;
    this.marker.setColor(selected ? MARKER_SELECTED_COLOR : MARKER_COLOR);
    this.path.animate();
  }
}

const r = new Vector3();
const rDot = new Vector3();
