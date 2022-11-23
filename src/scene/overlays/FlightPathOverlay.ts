import { AdditiveBlending, Color, Group, Vector3 } from 'three';
import { OrbitalElements } from '../../math/OrbitalElements';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';
import { TranslucentLines } from './TranslucentLines';

export class FlightPathOverlay {
  private orbit: TranslucentLines;
  private group = new Group();

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
   * @param elements The orbital elements
   */
  public update(primary: CelestialBody, elements: OrbitalElements) {
    this.orbit.setParent(primary.group);
    const position: number[] = [];
    const steps = 128;
    for (let phi = 0; phi <= steps; phi++) {
      const angle = (phi * Math.PI * 2) / steps;
      const ta = elements.trueAnomalyFromEccentric(angle);
      elements.toIntertial(v, ta);
      position.push(...v.toArray());
    }
    this.orbit.updateGeometry(position);
  }
}

const v = new Vector3();
