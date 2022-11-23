import { MathUtils, Matrix4, Vector3 } from 'three';
import { G } from './constants';

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

  private h = new Vector3();
  private n = new Vector3();
  private ev = new Vector3();

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
    // let raan = Math.atan2(h.x, -h.y);
    let raan = Math.acos(n.x / n.length());
    if (n.y < 0) {
      raan = Math.PI * 2 - raan;
    }

    let argPe = Math.acos(n.dot(ev) / (n.length() * ev.length()));
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
        v = Math.acos(n.dot(pos) / (n.length() * pos.length()));
        if (n.dot(vel) > 0) {
          v = 2 * Math.PI - v;
        }
      }
    } else {
      if (ev.z < 0) {
        argPe = 2 * Math.PI - argPe;
      }
      const vCos = MathUtils.clamp(ev.dot(pos) / (ev.length() * pos.length()), -1, 1);
      v = Math.acos(vCos);
      if (pos.dot(vel) < 0) {
        v = Math.PI * 2 - v;
      }
    }

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
   */
  public toPerifocal(out: Vector3, ta?: number) {
    const v = ta ?? this.v;
    const p = this.a * (1 - this.e ** 2);
    const m = p / (1 + this.e * Math.cos(v));
    const x = Math.cos(v) * m;
    const y = Math.sin(v) * m;
    out.set(x, y, 0);
  }

  /** Compute the orbital position, in rectilinear coordinates, at true anomaly ta. */
  public toIntertial(out: Vector3, ta?: number) {
    this.toPerifocal(out, ta ?? this.v);
    if (this.matrixNeedsUpdate) {
      this.updateMatrix();
    }
    out.applyMatrix4(this.matrix);
  }

  public trueAnomalyFromEccentric(E: number) {
    return (
      2 *
      Math.atan2(Math.sqrt(1 + this.e) * Math.sin(E / 2), Math.sqrt(1 - this.e) * Math.cos(E / 2))
    );
  }

  /* Convert mean anomaly to eccentric anomaly.
  Implemented from [A Practical Method for Solving the Kepler Equation][1]
  by Marc A. Murison from the U.S. Naval Observatory
  [1]: http://murison.alpheratz.net/dynamics/twobody/KeplerIterations_summary.pdf
  */
  public eccentricAnomalyFromMean(M: number, tolerance: number = 1e-14): number {
    const e = this.e;
    const Mnorm = MathUtils.euclideanModulo(M, 2 * Math.PI);
    let E0 =
      M +
      ((-1 / 2) * e ** 3 + e + (e ** 2 + (3 / 2) * Math.cos(M) * e ** 3) * Math.cos(M)) *
        Math.sin(M);
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
      if (count >= 100) {
        // raise ConvergenceError('Did not converge after {n} iterations. (e={e!r}, M={M!r})'.format(n=MAX_ITERATIONS, e=e, M=M))
      }
    }
    return E;
  }

  public trueAnomalyFromMean(m: number, tolerance: number = 1e-14): number {
    const E = this.eccentricAnomalyFromMean(m, tolerance);
    return this.trueAnomalyFromEccentric(E);
  }

  public updateMatrix() {
    this.matrix.makeRotationZ(this.ap);
    this.matrix.premultiply(mTemp.makeRotationX(this.i));
    this.matrix.premultiply(mTemp.makeRotationZ(this.raan));
    this.matrixNeedsUpdate = false;
  }
}
const mTemp = new Matrix4();
