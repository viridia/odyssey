import { MathUtils, Vector3 } from 'three';
import { describe, expect, test } from 'vitest';
import { OrbitalElements } from './OrbitalElements';

const MassEarth = 5.97219e24;
const Altitude = 6.378e6 * 2;

const range = (from: number, to: number, step: number = 1) =>
  [...Array(Math.floor((to - from) / step) + 1)].map((_, i) => from + i * step);

describe('OrbitalElements', () => {
  const elements = new OrbitalElements();

  describe('circular', () => {
    const elements = new OrbitalElements();
    elements.e = 0;
    elements.a = 1e5;

    test('fromStateVector', () => {
      // A nearly circular orbit
      elements.fromStateVector(new Vector3(6.378e6 * 2, 0, 0), new Vector3(0, 5590, 0), MassEarth);

      // These tests aren't very good, they are simply validating what's already there.
      expect(elements.e).toBeGreaterThan(0);
      expect(elements.e).toBeLessThan(0.1);
      expect(elements.a / Altitude).toBeCloseTo(1, 1);
      expect(elements.i).toBeCloseTo(0, 4);
      // expect(elements.raan).toBeCloseTo(0, 4);
      // expect(elements.ap).toBeCloseTo(0, 4);
      expect(elements.v).toBeCloseTo(0, 4);

      const pos = new Vector3();

      // Apoapsis
      elements.toPerifocal(pos, elements.v);
      expect(pos.x).toBeCloseTo(6.378e6 * 2);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      // Periapsis
      elements.toPerifocal(pos, elements.v + Math.PI);
      expect(pos.x).toBeCloseTo(-6.378e6 * 2, -4);
      expect(pos.y).toBeCloseTo(0);
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
    const elements = new OrbitalElements();
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
  });

  describe.todo('radial', () => {
    describe.todo('eccentric <-> true', () => {});
  });

  describe.todo('parabolic', () => {
    describe.todo('eccentric <-> true');
  });

  describe('hyperbolic', () => {
    test('fromStateVector', () => {
      elements.fromStateVector(new Vector3(6.378e6 * 2, 0, 0), new Vector3(0, 8590, 0), MassEarth);
      expect(elements.e).toBeGreaterThan(1);

      const pos = new Vector3();

      // At apoapsis, should be the same as initial position
      elements.toPerifocal(pos, elements.v);
      expect(pos.x).toBeCloseTo(6.378e6 * 2);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);
    });

    describe('eccentric <-> true', () => {
      const elements = new OrbitalElements();
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
      const elements = new OrbitalElements();
      elements.e = 1.2;
      elements.a = 1e5;

      test.each(range(0, 2.5, 0.25))('E %d', E => {
        const f = elements.meanAnomalyFromEccentric(E);
        expect(elements.eccentricAnomalyFromMean(f)).toBeCloseTo(E, 11);
      });
    });
  });
});
