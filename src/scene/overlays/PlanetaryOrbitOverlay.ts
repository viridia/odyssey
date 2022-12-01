import { Color, Group, Vector3 } from 'three';
import { OrbitalElements } from '../../math/OrbitalElements';
import { CelestialBody } from '../planets/CelestialBody';
import { getSimulator } from '../Simulator';
import { TranslucentLines } from './TranslucentLines';

const COLOR = new Color(0.15, 0.15, 0.2).convertSRGBToLinear();

export class PlanetaryOrbitOverlay {
  private orbit: TranslucentLines;
  private group = new Group();

  constructor() {
    this.orbit = new TranslucentLines();
    this.orbit.setColor(COLOR);
    this.orbit.setOpacity(0.6, 0.1);
    this.orbit.setVisible(true);
    this.orbit.setParent(this.group);

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
    const steps = 4096;
    for (let phi = 0; phi <= steps; phi++) {
      const angle = (phi * Math.PI * 2) / steps;
      const ta = elements.trueAnomalyFromEccentric(angle);
      elements.toInertial(v, undefined, ta);
      position.push(...v.toArray());
    }
    this.orbit.updateGeometry(position);
  }

  public animate() {
    const sim = getSimulator();
    this.orbit.setVisible(!!sim.settings.showTrajectories);
  }
}

const v = new Vector3();
