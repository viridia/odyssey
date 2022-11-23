import { AdditiveBlending, Color, Group, Matrix4, Vector3 } from 'three';
import { OrbitalElements } from '../../math/OrbitalElements';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';
import { TranslucentLines } from './TranslucentLines';

const ma = new Matrix4();
const mt = new Matrix4();

export class FlightPathOverlay {
  private orbit: TranslucentLines;
  private group = new Group();
  private elements = new OrbitalElements();

  // Position and velocity relative to primary.
  private relativePosition = new Vector3();
  private relativeVelocity = new Vector3();

  constructor() {
    this.orbit = new TranslucentLines();
    this.orbit.setColor(new Color(0.2, 0.4, 0.0));
    this.orbit.setOpacity(0.7, 0.1);
    this.orbit.setVisible(true);
    this.orbit.setParent(this.group);
    this.orbit.setBlending(AdditiveBlending);

    const sim = getSimulator();
    this.orbit.setParent(sim.eclipticGroup);
  }

  public dispose() {
    this.group.removeFromParent();
    this.orbit.dispose();
  }

  /**
   * Calculate the conic orbit.
   * @param primary Mass we are orbiting around
   * @param position Position in ecliptic coordinates
   * @param velocity Velocity in ecliptic coordinates
   */
  public calculateOrbit(primary: CelestialBody, position: Vector3, velocity: Vector3) {
    // TODO: ACC: This is not correct, we want to know the position of the primary
    // at a given point in the future.
    this.relativePosition.copy(position).sub(primary.position);
    this.relativeVelocity.copy(velocity); //.sub(this.primary.ve);

    this.elements.fromStateVector(this.relativePosition, this.relativeVelocity, 0, primary.mass);
    this.orbit.setParent(primary.group);

    const pos: number[] = [];
    const p = this.elements.a * (1 - this.elements.e ** 2);

    ma.makeRotationZ(this.elements.ap);
    ma.premultiply(mt.makeRotationX(this.elements.i));
    ma.premultiply(mt.makeRotationZ(this.elements.raan));
    const steps = 128;

    for (let phi = 0; phi <= steps; phi++) {
      const angle = (phi * Math.PI * 2) / steps;
      const e = this.elements.trueAnomalyFromEccentric(angle);
      const m = p / (1 + this.elements.e * Math.cos(e));
      const x = Math.cos(e) * m;
      const y = Math.sin(e) * m;
      v.set(x, y, 0);
      v.applyMatrix4(ma);
      pos.push(...v.toArray());
    }
    this.orbit.updateGeometry(pos);
  }
}

const v = new Vector3();
