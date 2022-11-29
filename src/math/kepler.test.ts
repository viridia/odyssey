import { MathUtils } from 'three';
import { describe, test, expect } from 'vitest';
import { eccentricAnomalyFromMeanElliptic } from './kepler';

describe('kepler', function () {
  test.each([
    [0.99, 0],
    [0.99, 0.1],
    [0.99, 0.2],
    [0.99, Math.PI],
    [0.99, Math.PI * 2],
    [0.8, 0],
    [0.8, 0.1],
    [0.8, 0.2],
    [0.8, Math.PI],
    [0.5, 0],
    [0.5, 0.1],
    [0.5, 0.2],
    [0.1, 0.0],
    [0, 0.0],
    [0, 0.1],
    [0, Math.PI],
    [0, Math.PI * 2],
  ])('reference cases M -> E e=%d f=%d', (e, f) => {
    expect(eccentricAnomalyFromMeanElliptic(e, f)).toBeCloseTo(refEFromM(e, f), 8);
  });

  test.each([
    [0.9831724272587135, 0.0002891749156797019],
  ])('problematic cases M -> E e=%d f=%d', (e, f) => {
    expect(eccentricAnomalyFromMeanElliptic(e, f)).toBeCloseTo(refEFromM(e, f), 8);
  });
});

/** Convert mean anomaly to eccentric anomaly. (reference implementation)
    Implemented from [A Practical Method for Solving the Kepler Equation][1]
    by Marc A. Murison from the U.S. Naval Observatory
    [1]: http://murison.alpheratz.net/dynamics/twobody/KeplerIterations_summary.pdf
  */
export function refEFromM(e: number, M: number, tolerance: number = 1e-14): number {
  const Mnorm = MathUtils.euclideanModulo(M, 2 * Math.PI);
  let E0 =
    M +
    ((-1 / 2) * e ** 3 + e + (e ** 2 + (3 / 2) * Math.cos(M) * e ** 3) * Math.cos(M)) * Math.sin(M);
  let dE = tolerance + 1;
  let count = 0;
  let E = 0;
  while (dE > tolerance) {
    const t1 = Math.cos(E0);
    const t2 = -1 + e * t1;
    const t3 = Math.sin(E0);
    const t4 = e * t3;
    const t5 = -E0 + t4 + Mnorm;
    const t6 = t5 / (((1 / 2) * t5 * t4) / t2 + t2);
    E = E0 - t5 / (((1 / 2) * t3 - (1 / 6) * t1 * t6) * e * t6 + t2);
    dE = Math.abs(E - E0);
    E0 = E;
    count += 1;
    if (count >= 120) {
      console.error(e, M, E, dE);
      throw new Error(`Did not converge after ${count} iterations.`);
      // raise ConvergenceError('Did not converge after {n} iterations. (e={e!r}, M={M!r})'.format(n=MAX_ITERATIONS, e=e, M=M))
    }
  }
  return E;
}

// N / R failed: e = , M = 0.0002891749156797019, E0 = 0.001127829094786723 tolerance = 1e-14
