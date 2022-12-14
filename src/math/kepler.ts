import { MathUtils } from 'three';
import { bisect } from './bisect';
import { newtonRaphson } from './newton';

export function eccentricAnomalyFromMeanElliptic(
  e: number,
  M: number,
  tolerance: number = 1e-14
): number {
  let E0 =
    M +
    ((-1 / 2) * e ** 3 + e + (e ** 2 + (3 / 2) * Math.cos(M) * e ** 3) * Math.cos(M)) * Math.sin(M);
  if (globalThis.isNaN(E0)) {
    console.error(`E0 is NaN: e = ${e}, M = ${M}`);
    throw new Error(`ecc: E0 NaN`);
  }

  try {
    const result = newtonRaphson(
      E => E - e * Math.sin(E) - M,
      E => 1 - e * Math.cos(E),
      E0,
      { tolerance, maxIterations: 20 }
    );
    return MathUtils.euclideanModulo(result, Math.PI * 2);
  } catch (ex) {
    // Fall back to using bisect if newton failed.
    return bisect(E => E - e * Math.sin(E) - M, 0, Math.PI * 2, {
      maxIterations: 200,
    });
    // console.error(
    //   `eccentricAnomalyFromMeanElliptic failed: e = ${e}, M = ${M}, E0 = ${E0} tolerance = ${tolerance}`
    // );
    // throw ex;
  }
}

export function eccentricAnomalyFromMeanHyperbolic(
  e: number,
  M: number,
  _tolerance: number = 1e-14
): number {
  // let F0 = M;

  try {
    // Using bisect because newton-raphson doesn't work for some reason.
    return bisect(F => e * Math.sinh(F) - F - M, 0, Math.PI * 2, {
      maxIterations: 200,
    });
  } catch (ex) {
    console.error(`eccentricAnomalyFromMeanHyperbolic failed: e = ${e}, M = ${M}`);
    throw ex;
  }

  // const result = newtonRaphson(
  //   F => e * Math.sinh(F) - F - M,
  //   F => e - Math.cosh(F) - 1,
  //   F0,
  //   { tolerance, maxIterations: 100 }
  // );

  // return MathUtils.euclideanModulo(result, Math.PI * 2);
}
