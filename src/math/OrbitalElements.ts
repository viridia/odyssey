import { MathUtils, Matrix4, Vector3 } from 'three';
import { G } from './constants';
import { eccentricAnomalyFromMeanElliptic, eccentricAnomalyFromMeanHyperbolic } from './kepler';

/** @file
    References:
    * http://control.asu.edu/Classes/MAE462/462Lecture05.pdf
    * https://orbital-mechanics.space/time-since-periapsis-and-keplers-equation/hyperbolic-trajectories.html
    * https://en.wikipedia.org/wiki/Orbit_determination#Orbit_Determination_from_a_State_Vector
    * https://en.wikipedia.org/wiki/True_anomaly
    * https://space.stackexchange.com/questions/20085/calculate-true-anomaly-at-future-point-in-time-with-hyperbolic-orbits
    * https://space.stackexchange.com/questions/54414/how-to-calculate-the-velocity-vector-in-the-case-of-a-hyperbolic-orbit
    * https://space.stackexchange.com/questions/24646/finding-x-y-z-vx-vy-vz-from-hyperbolic-orbital-elements
 */

const SMALL_NUMBER = 1e-15;

export class OrbitalElements {
  /** Semi-major axis */
  public a: number = 0;
  /** Eccentricity */
  public e: number = 0;
  /** Inclination */
  public i: number = 0;
  /** Longitude of ascending node */
  public raan: number = 0;
  /** Argument of periapsis */
  public ap: number = 0;
  /** True anomaly */
  public v: number = 0;
  /** Mean anomaly */
  public ma: number = 0;

  private h = new Vector3();
  private n = new Vector3();
  private ev = new Vector3();

  // Matrix used to transform from perifocal to inertial coordinates (relative to primary).
  private matrix = new Matrix4();
  private matrixNeedsUpdate = true;

  public fromStateVector(pos: Vector3, vel: Vector3, m1: number, m2: number = 0) {
    const mu = G * (m1 + m2);

    // let h = vector.cross(pos, vel);
    const h = this.h;
    h.copy(pos).cross(vel);

    // Cross product of [0, 0, 1] with h
    const n = this.n;
    n.x = -1 * h.y;
    n.y = 1 * h.x;
    n.z = 0;

    // ev = 1 / mu * ((norm(v) ** 2 - mu / norm(r)) * r - dot(r, v) * v)
    const ev = this.ev;
    ev.copy(pos)
      .multiplyScalar(vel.lengthSq() - mu / pos.length())
      .addScaledVector(vel, -pos.dot(vel))
      .divideScalar(mu);
    const e = ev.length();

    // Semi-latus rectum
    const p = h.lengthSq() / mu;
    let a = Math.abs(e - 1) > SMALL_NUMBER ? p / (1 - e ** 2) : 0;

    // Orbital inclication
    let i = Math.atan2(Math.hypot(h.x, h.y), h.z);

    // Right ascension
    let raan = Math.atan2(h.x, -h.y);
    // let raan = Math.acos(n.x / n.length());
    if (n.y < 0) {
      raan = Math.PI * 2 - raan;
    }

    let argPe = angleBetween(n, ev);
    if (ev.z < 0) {
      argPe = Math.PI * 2 - argPe;
    }

    let v: number;
    if (Math.abs(e) < SMALL_NUMBER) {
      if (Math.abs(i) < SMALL_NUMBER) {
        v = Math.acos(pos.x / pos.lengthSq());
        if (vel.x > 0) {
          v = Math.PI * 2 - v;
        }
      } else {
        v = angleBetween(n, pos);
        if (n.dot(vel) > 0) {
          v = 2 * Math.PI - v;
        }
      }
    } else {
      if (ev.z < 0) {
        argPe = 2 * Math.PI - argPe;
      }
      v = angleBetween(ev, pos);
      if (pos.dot(vel) < 0) {
        v = Math.PI * 2 - v;
      }
    }
    // console.log(v);

    this.a = a;
    this.e = e;
    this.i = i;
    this.raan = raan;
    this.ap = argPe;
    this.v = v;

    this.matrixNeedsUpdate = true;
  }

  /** Compute the orbital position at a given true anomaly.
   * @param ta The true anomaly
   * @param out Position in perifocal coordinates.
   * @returns True if the position is valid (which can be false for hyperbolic orbits
   *    when the true anomaly is out of range)
   */
  public toPerifocal(out: Vector3, ta?: number): boolean {
    const { e, a, v } = this;
    const f = ta ?? v;
    const p = a * (1 - e ** 2);
    const m = p / (1 + e * Math.cos(f));
    if (m <= 0) {
      return false;
    }
    const x = Math.cos(f) * m;
    const y = Math.sin(f) * m;
    out.set(x, y, 0);
    return true;
  }

  /** Compute the orbital position, in rectilinear coordinates, at true anomaly ta. */
  public toInertial(out: Vector3, ta?: number): boolean {
    if (!this.toPerifocal(out, ta ?? this.v)) {
      return false;
    }
    if (this.matrixNeedsUpdate) {
      this.updateMatrix();
    }
    out.applyMatrix4(this.matrix);
    return true;
  }

  public meanMotion(m1: number, m2: number = 0) {
    const mu = G * (m1 + m2);
    return Math.sqrt(mu / Math.abs(this.a ** 3));
  }

  public trueAnomalyFromEccentric(E: number) {
    const e = this.e;

    // Hyperbolic
    if (e > 1) {
      const e2 = Math.sqrt((e + 1) / (e - 1));
      return MathUtils.euclideanModulo(2 * Math.atan(e2 * Math.tanh(E / 2)), Math.PI * 2);
    }

    const B = e / (1 + Math.sqrt(1 - e ** 2));
    return E + 2 * Math.atan2(B * Math.sin(E), 1 - B * Math.cos(E));
  }

  public eccentricAnomalyFromTrue(ta: number) {
    const e = this.e;

    // Hyperbolic
    if (e > 1) {
      return 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(ta / 2));
    }

    // Elliptical or circular
    let E = Math.atan2(Math.sqrt(1 - e ** 2) * Math.sin(ta), e + Math.cos(ta));
    return MathUtils.euclideanModulo(E, Math.PI * 2);
  }

  public meanAnomalyFromEccentric(E: number) {
    const { e } = this;
    if (e >= 1) {
      return e * Math.sinh(E) - E;
    }
    return E - e * Math.sin(E);
  }

  /** Convert mean anomaly to eccentric anomaly. */
  public eccentricAnomalyFromMean(M: number, tolerance: number = 1e-14): number {
    const { e } = this;
    if (e > 1) {
      return eccentricAnomalyFromMeanHyperbolic(e, M, tolerance);
    }
    return eccentricAnomalyFromMeanElliptic(e, M, tolerance);
  }

  public trueAnomalyFromMean(m: number, tolerance: number = 1e-14): number {
    const E = this.eccentricAnomalyFromMean(m, tolerance);
    return this.trueAnomalyFromEccentric(E);
  }

  public meanAnomalyFromTrue(ta: number): number {
    const E = this.eccentricAnomalyFromTrue(ta);
    return this.meanAnomalyFromEccentric(E);
  }

  public updateMatrix() {
    this.matrix.makeRotationZ(this.ap);
    this.matrix.premultiply(mTemp.makeRotationX(this.i));
    this.matrix.premultiply(mTemp.makeRotationZ(this.raan));
    this.matrixNeedsUpdate = false;
  }
}
const mTemp = new Matrix4();

function angleBetween(a: Vector3, b: Vector3): number {
  const denominator = Math.sqrt(a.lengthSq() * b.lengthSq());
  if (denominator === 0) return Math.PI / 2;
  const theta = a.dot(b) / denominator;
  return Math.acos(MathUtils.clamp(theta, -1, 1));
}
