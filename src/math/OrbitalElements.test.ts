import { MathUtils, Vector3 } from 'three';
import { describe, expect, test } from 'vitest';
import { OrbitalElements } from './OrbitalElements';

const MassEarth = 5.97219e24;
const Altitude = 6.378e6 * 2;

const range = (from: number, to: number, step: number = 1) =>
  [...Array(Math.floor((to - from) / step) + 1)].map((_, i) => from + i * step);

export function relativeAngle(from: number, to: number) {
  return MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
}

/** Note: These tests are far from comprehensive. This is somewhat due to the fact that
    the 6 elements represent a vast configuration space.
 */
describe('OrbitalElements', () => {
  const elements = new OrbitalElements(MassEarth);

  test('known correct (from orbital-mechanics.space (172))', () => {
    const r_vec = new Vector3(1_000, 5_000, 7_000);
    const v_vec = new Vector3(3.0, 4.0, 5.0);
    elements.setMu(3.986e5);
    elements.fromStateVector(r_vec, v_vec);

    // Check against known values in example
    expect(elements.e).toBeCloseTo(0.948, 3);
    expect(elements.raan).toBeCloseTo((190.62 * Math.PI) / 180, 3);
    expect(elements.i).toBeCloseTo((124.05 * Math.PI) / 180, 3);
    expect(elements.ap).toBeCloseTo((303.09 * Math.PI) / 180, 3);
    expect(elements.v).toBeCloseTo((159.61 * Math.PI) / 180, 3);

    const pos = new Vector3();
    const vel = new Vector3();
    elements.toPerifocal(pos, vel);
    expect(pos.x).toBeCloseTo(-8117.712, 4);
    expect(pos.y).toBeCloseTo(3017.0767, 4);
    expect(pos.z).toBe(0);

    expect(vel.x).toBeCloseTo(-7.068, 4);
    expect(vel.y).toBeCloseTo(0.2067, 4);
    expect(vel.z).toBe(0);

    elements.toInertial(pos, vel);
    expect(pos.x).toBeCloseTo(1000, 8);
    expect(pos.y).toBeCloseTo(5000, 8);
    expect(pos.z).toBeCloseTo(7000, 8);

    expect(vel.x).toBeCloseTo(3, 8);
    expect(vel.y).toBeCloseTo(4, 8);
    expect(vel.z).toBeCloseTo(5, 8);
  });

  describe('circular', () => {
    const elements = new OrbitalElements(MassEarth);
    elements.e = 0;
    elements.a = 1e5;

    test('fromStateVector', () => {
      // A nearly circular orbit
      elements.fromStateVector(new Vector3(Altitude, 0, 0), new Vector3(0, 5590, 0));

      expect(elements.e).toBeGreaterThan(0);
      expect(elements.e).toBeLessThan(0.1);
      expect(elements.a / Altitude).toBeCloseTo(1, 1);
      expect(elements.i).toBeCloseTo(0, 4);
      expect(elements.raan).toBeCloseTo(0, 4);
      expect(elements.ap).toBeCloseTo(0, 4);
      expect(elements.v).toBeCloseTo(0, 4);

      const pos = new Vector3();

      // Apoapsis
      elements.toPerifocal(pos, undefined, elements.v);
      expect(pos.x).toBeCloseTo(Altitude);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // Periapsis
      elements.toPerifocal(pos, undefined, elements.v + Math.PI);
      expect(pos.x).toBeCloseTo(-Altitude, -4);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // 90 degress
      elements.toPerifocal(pos, undefined, elements.v + Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(Altitude, -4);
      expect(pos.z).toBeCloseTo(0);

      // 249 degress
      elements.toPerifocal(pos, undefined, elements.v + 3 * Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(-Altitude, -4);
      expect(pos.z).toBeCloseTo(0);

      const e = elements.eccentricAnomalyFromMean(0);
      expect(elements.meanAnomalyFromEccentric(e)).toBe(0);
    });

    describe('eccentric <-> true', () => {
      test.each(range(0, 6, 0.25))('eccentric %d', ta => {
        const e = elements.eccentricAnomalyFromTrue(ta);
        expect(elements.trueAnomalyFromEccentric(e)).toBeCloseTo(ta, 5);
      });
    });

    describe('eccentric <-> mean', () => {
      test.each(range(0, 6, 0.25))('eccentric %d', ta => {
        const e = elements.eccentricAnomalyFromMean(ta);
        expect(elements.meanAnomalyFromEccentric(e)).toBeCloseTo(ta, 5);
      });
    });
  });

  describe('elliptical', () => {
    const elements = new OrbitalElements(MassEarth);
    elements.e = 0.9;
    elements.a = 1e5;

    describe('eccentric <-> true', () => {
      test.each(range(0, 6, 0.25))('eccentric %d', ta => {
        ta = MathUtils.euclideanModulo(ta, Math.PI * 2);
        const e = elements.eccentricAnomalyFromTrue(ta);
        expect(elements.trueAnomalyFromEccentric(e)).toBeCloseTo(ta, 5);
      });
    });

    describe('eccentric <-> mean', () => {
      test.each(range(0, 6, 0.25))('eccentric %d', ta => {
        const e = elements.eccentricAnomalyFromMean(ta);
        expect(elements.meanAnomalyFromEccentric(e)).toBeCloseTo(ta, 5);
      });
    });

    test('fromStateVector: at apo', () => {
      elements.fromStateVector(new Vector3(Altitude, 0, 0), new Vector3(0, 4590, 0));

      expect(elements.e).toBeCloseTo(0.325, 2);
      // expect(elements.a / Altitude).toBeCloseTo(1, 1);
      expect(elements.i).toBeCloseTo(0, 4);
      expect(elements.raan).toBeCloseTo(0, 4);
      // expect(elements.ap).toBeCloseTo(0, 4);
      expect(elements.v).toBeCloseTo(Math.PI, 4);

      const pos = new Vector3();

      // Apoapsis
      elements.toPerifocal(pos, undefined, elements.v);
      expect(pos.x).toBeCloseTo(-Altitude); // Reversed because apses are flipped (and below)
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // Periapsis
      elements.toPerifocal(pos, undefined, elements.v + Math.PI);
      expect(pos.x).toBeCloseTo(Altitude * 0.51, -5);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // 90 degress
      elements.toPerifocal(pos, undefined, elements.v + Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(-Altitude * 0.673, -5);
      expect(pos.z).toBeCloseTo(0);

      // 249 degress
      elements.toPerifocal(pos, undefined, elements.v + 3 * Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(Altitude * 0.673, -5);
      expect(pos.z).toBeCloseTo(0);

      // const e = elements.eccentricAnomalyFromMean(0);
      // expect(elements.meanAnomalyFromEccentric(e)).toBe(0);
    });

    test('fromStateVector: at peri', () => {
      elements.fromStateVector(new Vector3(Altitude, 0, 0), new Vector3(0, 6430, 0));

      expect(elements.e).toBeCloseTo(0.325, 2);
      // expect(elements.a / Altitude).toBeCloseTo(1, 1);
      expect(elements.v).toBeCloseTo(0, 4);

      const pos = new Vector3();
      const vel = new Vector3();

      // Apoapsis
      elements.toPerifocal(pos, undefined, elements.v);
      expect(pos.x).toBeCloseTo(Altitude);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // Periapsis
      elements.toPerifocal(pos, undefined, elements.v + Math.PI);
      expect(pos.x).toBeLessThan(-Altitude * 1.5);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // 90 degress
      elements.toPerifocal(pos, undefined, elements.v + Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(Altitude * 1.323, -4);
      expect(pos.z).toBeCloseTo(0);

      // 249 degress
      elements.toPerifocal(pos, undefined, elements.v + 3 * Math.PI * 0.5);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(-Altitude * 1.323, -4);
      expect(pos.z).toBeCloseTo(0);

      // Ensure that we can round-trip the elements.
      const e2 = new OrbitalElements(MassEarth);
      for (let ta = 0; ta < Math.PI * 2; ta += 0.1) {
        elements.toInertial(pos, vel, ta);
        e2.fromStateVector(pos, vel);
        expect(e2.e).toBeCloseTo(elements.e, 8);
        expect(e2.a).toBeCloseTo(elements.a, 5);
        expect(e2.raan).toBeCloseTo(elements.raan, 8);
        expect(e2.i).toBeCloseTo(elements.i, 8);
        expect(relativeAngle(e2.ap, elements.ap)).toBeCloseTo(0, 8);
        expect(e2.v).toBeCloseTo(ta, 8);
      }
    });

    test('fromStateVector: inclined', () => {
      elements.fromStateVector(new Vector3(Altitude, 100, 200), new Vector3(300, 3430, 100));

      expect(elements.e).toBeGreaterThan(0.1);
      expect(elements.e).toBeLessThan(1);
      expect(elements.i).toBeGreaterThanOrEqual(0);
      expect(elements.i).toBeLessThan(Math.PI * 2);
      expect(elements.raan).toBeGreaterThanOrEqual(0);
      expect(elements.raan).toBeLessThan(Math.PI * 2);
      expect(elements.ap).toBeGreaterThanOrEqual(0);
      expect(elements.ap).toBeLessThan(Math.PI * 2);

      // const pos = new Vector3();
      // const vel = new Vector3();

      // // Ensure that we can round-trip the elements.
      // const e2 = new OrbitalElements(MassEarth);
      // for (let ta = 0; ta < Math.PI * 2; ta += 0.1) {
      //   elements.toInertial(pos, vel, ta);
      //   e2.fromStateVector(pos, vel);
      //   expect(e2.e).toBeCloseTo(elements.e, 8);
      //   expect(e2.a).toBeCloseTo(elements.a, 5);
      //   expect(relativeAngle(e2.raan, elements.raan), `ta=${ta} raan`).toBeCloseTo(0, 8);
      //   expect(relativeAngle(e2.i, elements.i), `ta=${ta} i`).toBeCloseTo(0, 8);
      //   expect(relativeAngle(e2.ap, elements.ap), `ta=${ta} ap`).toBeCloseTo(0, 8);
      //   // expect(e2.ap).toBeCloseTo(elements.ap, 8);
      //   expect(e2.v).toBeCloseTo(ta, 8);
      // }
    });

    describe('round trip: e=0.7, a=1000', () => {
      test.skip('raan = 0.1, i = 0, ap = 0', () => {
        elements.a = 1000;
        elements.e = 0.7;
        elements.raan = 0.1;
        elements.i = 0.1;
        elements.ap = 0;
        elements.v = 0;

        const pos = new Vector3();
        const vel = new Vector3();
        const e2 = new OrbitalElements(MassEarth);
        for (let ta = 0; ta < Math.PI * 2; ta += 0.1) {
          elements.toInertial(pos, vel, ta);
          e2.fromStateVector(pos, vel);
          expect(e2.e).toBeCloseTo(elements.e, 8);
          expect(e2.a).toBeCloseTo(elements.a, 5);
          expect(relativeAngle(e2.raan, elements.raan), `ta=${ta} raan`).toBeCloseTo(0, 4);
          expect(relativeAngle(e2.i, elements.i), `ta=${ta} i`).toBeCloseTo(0, 8);
          expect(relativeAngle(e2.ap, elements.ap), `ta=${ta} ap`).toBeCloseTo(0, 7);
          // expect(e2.ap).toBeCloseTo(elements.ap, 8);
          expect(e2.v).toBeCloseTo(ta, 8);
        }
      });
    });
  });

  describe.todo('radial', () => {
    describe.todo('eccentric <-> true', () => {});
  });

  describe.todo('parabolic', () => {
    describe.todo('eccentric <-> true');
  });

  describe('hyperbolic', () => {
    test('fromStateVector', () => {
      elements.fromStateVector(new Vector3(Altitude, 0, 0), new Vector3(0, 8590, 0));
      expect(elements.e).toBeGreaterThan(1);

      const pos = new Vector3();

      // expect(elements.distanceToPrimary()).toBeCloseTo(Altitude);

      // At apoapsis, should be the same as initial position
      elements.toPerifocal(pos, undefined, elements.v);
      expect(pos.x).toBeCloseTo(Altitude);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);
    });

    describe('eccentric <-> true', () => {
      const elements = new OrbitalElements(MassEarth);
      elements.e = 1.2;
      elements.a = 1e5;

      test.each(range(0, 2.5, 0.25))('eccentric %d', ta => {
        ta = MathUtils.euclideanModulo(ta, Math.PI * 2);
        const e = elements.eccentricAnomalyFromTrue(ta);
        expect(e).not.toBeNaN();
        expect(elements.trueAnomalyFromEccentric(e)).toBeCloseTo(ta, 5);
      });
    });

    describe('eccentric <-> mean', () => {
      const elements = new OrbitalElements(MassEarth);
      elements.e = 1.2;
      elements.a = 1e5;

      test.each(range(0, 2.5, 0.25))('E %d', E => {
        const f = elements.meanAnomalyFromEccentric(E);
        expect(elements.eccentricAnomalyFromMean(f)).toBeCloseTo(E, 11);
      });
    });
  });
});
