import { Vector3 } from 'three';
import { describe, test } from 'vitest';
import { OrbitalElements } from './OrbitalElements';

describe('OrbitalElements', () => {
  const elements = new OrbitalElements();

  test('basic', () => {
    elements.fromStateVector(new Vector3(1e6, 0, 0), new Vector3(0, 0, 1000), 0, 1e6);
    console.log(elements.a, elements.e, elements.i, elements.raan, elements.ap, elements.v);

    elements.fromStateVector(new Vector3(1e6, 0, 0), new Vector3(0, 10, 1000), 0, 1e6);
    console.log(elements.a, elements.e, elements.i, elements.raan, elements.ap, elements.v);

    // public a: number = 0;
    // /** Eccentricity */
    // public e: number = 0;
    // /** Inclination */
    // public i: number = 0;
    // /** Longitude of ascending node */
    // public raan: number = 0;
    // /** Argument of periapsis */
    // public argPe: number = 0;
    // /** True anomaly */
    // public v: number = 0;

  });
});
