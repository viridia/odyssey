import { Color, Group, Vector3 } from 'three';
import { OrbitalElements } from '../../math/OrbitalElements';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';
import { TranslucentLines } from './TranslucentLines';

const GREEN = new Color(0.2, 0.4, 0.0).convertSRGBToLinear();

export class FlightPathOverlay {
  private orbit: TranslucentLines;
  private group = new Group();

  constructor() {
    this.orbit = new TranslucentLines();
    this.orbit.setColor(GREEN);
    this.orbit.setOpacity(0.7, 0.1);
    this.orbit.setVisible(true);
    this.orbit.setParent(this.group);
    // this.orbit.setBlending(AdditiveBlending);

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
   * @param elements The orbital elements
   */
  public update(primary: CelestialBody, elements: OrbitalElements) {
    this.orbit.setParent(primary.group);
    const position: number[] = [];
    if (elements.e >= 1) {
      // TODO: Parabolic case. Which may not ever happen in actual operation.
      const safetyMargin = 1e-8;
      // True anomaly of the asymptote (and back off a bit)
      const taAsymptote = Math.acos(-1 / elements.e) * (1 - safetyMargin);

      // Hyperbolic or parabolic. Iterating over true anomaly is good enough for hyperbolics.
      const stepSize = taAsymptote / 32;
      for (let phi = -taAsymptote; phi < taAsymptote + safetyMargin; phi += stepSize) {
        if (elements.toInertial(v, phi)) {
          position.push(...v.toArray());
        }
      }
    } else {
      // Elliptical
      const steps = 128;
      for (let phi = 0; phi <= steps; phi++) {
        const angle = (phi * Math.PI * 2) / steps;
        const ta = elements.trueAnomalyFromEccentric(angle);
        elements.toInertial(v, ta);
        position.push(...v.toArray());
      }
    }
    this.orbit.updateGeometry(position);
  }

  public animate() {
    const sim = getSimulator();
    this.orbit.setVisible(!!sim.settings.showTrajectories);
  }
}

const v = new Vector3();
