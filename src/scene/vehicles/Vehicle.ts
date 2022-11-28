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
import { G } from '../../math/constants';
import { OrbitalElements } from '../../math/OrbitalElements';
import { FlightPathOverlay } from '../overlays/FlightPathOverlay';
import { createLabel, TextLabel } from '../overlays/Label';
import { MarkerDisc } from '../overlays/MarkerDisc';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';

const MARKER_COLOR = new Color(0, 0.6, 0).convertSRGBToLinear();
const MARKER_SELECTED_COLOR = new Color(0.3, 0.8, 0.3).convertSRGBToLinear();

const gravity = new Vector3();
const r = new Vector3();
const rDot = new Vector3();
const drag = new Vector3();
// const directionTemp = new Vector3();

// const uDirection = new Vector3();
// const vDirection = new Vector3();
// const wDirection = new Vector3();

export class Vehicle {
  // Position and velocity in ecliptic coords.
  public readonly position = new Vector3();
  public readonly velocity = new Vector3();
  public readonly velocityPrev = new Vector3();

  // Position and velocity relative to current primary.
  public primary: CelestialBody | null = null;

  public readonly group = new Group();

  // TODO: Need multiple of these.
  private orbit = new OrbitalElements(0);
  private orbitChanged = true;

  // TODO:
  // array of orbital elements with time ranges.
  private path = new FlightPathOverlay();

  private material: MeshStandardMaterial;

  private marker: MarkerDisc;
  private label: TextLabel;

  // private distArrow = new ArrowHelper();
  // private uArrow = new ArrowHelper();
  // private vArrow = new ArrowHelper();
  // private wArrow = new ArrowHelper();

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
    this.marker = new MarkerDisc(this.group, {
      radius: 0.0035,
      color: MARKER_COLOR,
      nominalDistance: 1e5,
      minDistance: 1e3,
    });

    this.label = createLabel(name, {
      nominalDistance: 1e5,
      minDistance: 1e4,
    });
    this.group.add(this.label);

    // this.uArrow = new ArrowHelper();
    // this.vArrow = new ArrowHelper();
    // this.wArrow = new ArrowHelper();

    // this.distArrow.setLength(1e7);
    // this.uArrow.setLength(1e6);
    // this.vArrow.setLength(1e6);
    // this.wArrow.setLength(1e6);

    // this.group.add(this.distArrow);
    // this.group.add(this.uArrow);
    // this.group.add(this.vArrow);
    // this.group.add(this.wArrow);
  }

  public dispose() {
    // TODO: dispose geometry.
    this.group.removeFromParent();
    this.path.dispose();
    this.material.dispose();
    this.marker.dispose();
    this.label.removeFromParent();
    this.label.dispose();
  }

  public setPrimary(primary: CelestialBody) {
    if (this.primary !== primary) {
      this.primary = primary;
      // this.primary.group.add(this.distArrow);
    }
  }

  /** Copy world position to output vector. */
  public getWorldPosition(out: Vector3) {
    this.group.getWorldPosition(out);
  }

  public calcOrbit() {
    this.velocityPrev.copy(this.velocity);
    if (this.primary) {
      r.copy(this.position).sub(this.primary.position);
      rDot.copy(this.velocity); //.sub(this.primary.velocity);
      this.orbit.setMasses(this.primary.mass);
      this.orbit.fromStateVector(r, rDot);
      this.orbit.ma = -this.orbit.meanAnomalyFromTrue(-this.orbit.v);
      this.path.update(this.primary, this.orbit);
    }
  }

  public simulate(delta: number) {
    const sim = getSimulator();
    this.group.position.copy(this.position);
    if (this.primary) {
      let numerical = false;
      let atmoDensity = 0;

      // TODO: This doesn't take oblicity into account
      const altitude = this.primary.position.distanceTo(this.position) - this.primary.radius;
      if (altitude <= 0) {
        console.log('removing');
        this.velocity.set(0, 0, 0);
        this.velocityPrev.copy(this.velocity);
        sim.removeVehicle(this);
        return;
      } else {
        atmoDensity = this.primary.getAtmosphereDensity(altitude);
        if (atmoDensity > 0) {
          // console.log(atmoDensity);
          numerical = true;
        }
      }

      if (numerical) {
        // Leapfrog integration
        const steps = 32;
        const theta = delta / steps;
        for (let i = 0; i < steps; i++) {
          this.position.addScaledVector(this.velocityPrev, theta * 0.5);
          gravity.copy(this.primary.position).sub(this.position);
          const distance = gravity.length();
          gravity.multiplyScalar((G * this.primary.mass) / distance ** 3);
          this.velocity.addScaledVector(gravity, theta);
          this.position.addScaledVector(this.velocity, theta * 0.5);
          this.velocityPrev.copy(this.velocity);
        }

        drag.copy(this.velocity).multiplyScalar(delta * 0.0001);
        this.velocity.sub(drag);
        this.orbitChanged = true;
      } else {
        if (this.orbitChanged) {
          this.orbitChanged = false;
          this.calcOrbit();
        }
        const n = this.orbit.meanMotion();
        const t = n * delta;
        if (this.orbit.e < 1) {
          this.orbit.ma = MathUtils.euclideanModulo(this.orbit.ma + t, Math.PI * 2);
          const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
          this.orbit.v = ta;
          this.orbit.toInertial(this.position, this.velocity, ta);
          this.position.add(this.primary.position);
        } else {
          this.orbit.ma += t;
          const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
          this.orbit.v = ta;
          this.orbit.toInertial(this.position, this.velocity, ta);
          this.position.add(this.primary.position);
        }
      }

      // velocityCopy.copy(this.velocity).normalize();
      // this.uArrow.setDirection(velocityCopy);

      // const distanceToPrimary = this.position.distanceTo(this.primary.position);
      // this.material.color = distanceToPrimary > this.primary.radius ? GREEN : RED;
    }
  }

  public animate() {
    if (this.orbitChanged) {
      this.orbitChanged = false;
      this.calcOrbit();
    }
    const sim = getSimulator();
    const selected = this === sim.selection.picked || this === sim.selection.selected;
    this.group.position.copy(this.position);
    const distToCamera = sim.camera.position.distanceTo(this.position);
    this.label.scale.setScalar(distToCamera / 2e7);
    this.label.visible = selected;
    this.marker.setColor(selected ? MARKER_SELECTED_COLOR : MARKER_COLOR);
    this.path.animate();

    // const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
    // this.orbit.getDirectionVectors(uDirection, vDirection, wDirection, ta);

    // if (this.primary) {
      // directionTemp.copy(this.position).sub(this.primary?.position).normalize();
      // this.distArrow.setDirection(directionTemp);
      // const ta = this.orbit.trueAnomalyFromMean(this.orbit.ma);
      // this.distArrow.setLength(this.orbit.distanceToPrimary());
      // this.distArrow.updateMatrix();
    // }

    // this.uArrow.position.copy(this.position);
    // this.uArrow.updateMatrix();

    // // this.vArrow.position.copy(this.position);
    // this.vArrow.setDirection(vDirection);
    // this.vArrow.updateMatrix();

    // // this.wArrow.position.copy(this.position);
    // this.wArrow.setDirection(wDirection);
    // this.wArrow.updateMatrix();

    //     const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    // scene.add( arrowHelper );
  }
}
