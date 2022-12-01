import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three';
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
    * https://github.com/RazerM/orbital
    * https://www.bogan.ca/orbits/kepler/orbteqtn.html
    * https://www.orbiter-forum.com/threads/quaternions-rotations-and-orbital-elements.37264/
 */

const SMALL_NUMBER = 1e-15;

export class OrbitalElements {
  /** G * (m1 + m2) */
  public mu: number = 0;
  /** Semi-major axis */
  public a: number = 0;
  /** Eccentricity */
  public e: number = 0;
  /** Inclination */
  public i: number = 0;
  /** Longitude of ascending node (Upper-case Omega) */
  public raan: number = 0;
  /** Argument of periapsis (lower-case omega) */
  public ap: number = 0;
  /** True anomaly */
  public v: number = 0;
  /** Mean anomaly */
  public ma: number = 0;

  private h = new Vector3();
  private n = new Vector3();
  private ev = new Vector3();

  // Matrix used to transform from perifocal to inertial coordinates (relative to primary).
  public rotation = new Quaternion();

  constructor(m1: number, m2 = 0) {
    this.mu = G * (m1 + m2);
  }

  public setMasses(m1: number, m2: number = 0) {
    this.mu = G * (m1 + m2);
  }

  public setMu(mu: number) {
    this.mu = mu;
  }

  public fromStateVector(pos: Vector3, vel: Vector3) {
    const { mu } = this;

    // Vector of angular momentum, orthogonal to the plane of rotation.
    // let h = vector.cross(pos, vel);
    const h = this.h;
    h.copy(pos).cross(vel);
    const isFlat = Math.abs(h.x) + Math.abs(h.y) < SMALL_NUMBER;

    // Ascending node vector. This will be zero-length vector if orbit is in equatorial plane.
    // Cross product of [0, 0, 1] with h.
    const n = this.n;
    n.x = -h.y;
    n.y = h.x;
    n.z = 0;

    // Eccentricity vector, points in direction towards periapsis.
    // ev = 1 / mu * ((norm(v) ** 2 - mu / norm(r)) * r - dot(r, v) * v)
    const ev = this.ev;
    ev.copy(pos)
      .multiplyScalar(vel.lengthSq() - mu / pos.length())
      .addScaledVector(vel, -pos.dot(vel))
      .divideScalar(mu);
    const e = ev.length();

    // Build a quaternion from the basis vectors of the orbit. This is much more numerically
    // robust than fussing around with angles.
    en.copy(ev).normalize();
    hn.copy(h).normalize();
    an.copy(hn).cross(en);
    mTemp.set(
      en.x, an.x, hn.x, 0,
      en.y, an.y, hn.y, 0,
      en.z, an.z, hn.z, 0,
      0, 0, 0, 1);
    this.rotation.setFromRotationMatrix(mTemp);

    // Semi-latus rectum
    const p = h.lengthSq() / mu;

    // Apoapsis distance - undefined when trajectory is parabolic.
    let a = Math.abs(e - 1) > SMALL_NUMBER ? p / (1 - e ** 2) : 0;

    // Orbital inclication
    const i = Math.atan2(Math.sqrt(h.x ** 2 + h.y ** 2), h.z);

    // Right ascension
    let raan = 0;
    if (!isFlat) {
      // raan = Math.atan2(h.x, -h.y);
      raan = Math.acos(n.x / n.length());
      if (n.y < 0) {
        raan = Math.PI * 2 - raan;
      }
    }

    let argPe = -angleBetween(n, ev);
    if (isFlat) {
      argPe = Math.atan2(ev.y, ev.x);
    } else if (ev.z < 0) {
      // throw new Error('ev.z < 0');
      // argPe = Math.PI * 2 - argPe;
    }
    if (argPe < 0) {
      argPe += Math.PI * 2;
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
          v = Math.PI * 2 - v;
        }
      }
    } else {
      // if (ev.z < 0) {
      //   argPe = Math.PI * 2 - argPe;
      // }
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
  }

  public radialDistance(ta?: number) {
    const { e, a } = this;
    const E = this.eccentricAnomalyFromTrue(ta ?? this.v);
    // TODO: Handle parabolic case
    if (e < 1) {
      return a * (1 - e * Math.cos(E));
      // } else if (e === 1) {
      //   return a + f**2 / 2;
    } else {
      return a * (1 - e * Math.cosh(E));
    }
  }

  /** Compute the orbital position at a given true anomaly.
   * @param ta The true anomaly
   * @param outPosition Position in perifocal coordinates.
   * @param outVelocity Velocity in perifocal coordinates.
   * @returns True if the position is valid (which can be false for hyperbolic orbits
   *    when the true anomaly is out of range)
   */
  public toPerifocal(outPosition: Vector3, outVelocity?: Vector3, ta?: number): boolean {
    const { e, a, v, mu } = this;
    const f = ta ?? v; // True anomaly
    const p = a * (1 - e ** 2);
    const m = p / (1 + e * Math.cos(f));
    if (m <= 0) {
      return false;
    }
    const x = Math.cos(f) * m;
    const y = Math.sin(f) * m;
    outPosition.set(x, y, 0);
    if (outVelocity) {
      const E = this.eccentricAnomalyFromTrue(f);
      const dist = this.radialDistance(ta);
      if (e > 1) {
        const rho = Math.sqrt(-mu * a) / dist;
        outVelocity.x = -rho * Math.sinh(E);
        outVelocity.y = rho * Math.sqrt(e ** 2 - 1) * Math.cosh(E);
        outVelocity.z = 0;
      } else {
        const rho = Math.sqrt(mu * a) / dist;
        outVelocity.x = rho * -Math.sin(E);
        outVelocity.y = rho * Math.sqrt(1 - e ** 2) * Math.cos(E);
        outVelocity.z = 0;
      }
    }
    return true;
  }

  /** Compute the orbital position, in rectilinear coordinates, at true anomaly ta. */
  public toInertial(outPosition: Vector3, outVelocity?: Vector3, ta?: number): boolean {
    const f = ta ?? this.v;
    if (!this.toPerifocal(outPosition, outVelocity, f)) {
      return false;
    }
    outPosition.applyQuaternion(this.rotation);
    if (outVelocity) {
      outVelocity.applyQuaternion(this.rotation);
    }
    return true;
  }

  /**
   * Fill in the vectors representing the direction of travel and orientation.
   * @param uOut Radial unit vector
   * @param vOut Transversal (in-flight) direction unit vector
   * @param wOut Out-of-plane direction unit vector
   */
  // public getDirectionVectors(uOut: Vector3, vOut: Vector3, wOut: Vector3, f?: number) {
  //   const { ap, i, raan, v } = this;
  //   // def uvw_from_elements(i, raan, arg_pe, f):
  //   const u = ap + (f ?? v);

  //   const sinU = Math.sin(u);
  //   const cosU = Math.cos(u);
  //   const sinRaan = Math.sin(raan);
  //   const cosRaan = Math.cos(raan);
  //   const sinI = Math.sin(i);
  //   const cosI = Math.cos(i);

  //   uOut.set(
  //     cosU * cosRaan - sinU * sinRaan * cosI,
  //     cosU * sinRaan + sinU * cosRaan * cosI,
  //     sinU * sinI
  //   );

  //   vOut.set(
  //     -sinU * cosRaan - cosU * sinRaan * cosI,
  //     -sinU * sinRaan + cosU * cosRaan * cosI,
  //     cosU * sinI
  //   );

  //   wOut.set(sinRaan * sinI, -cosRaan * sinI, cosI);
  // }

  public meanMotion() {
    const { mu } = this;
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
    // Circular
    if (Math.abs(e) < SMALL_NUMBER) {
      return M;
    }
    // Hyperbolic
    if (e > 1) {
      return eccentricAnomalyFromMeanHyperbolic(e, M, tolerance);
    }
    // TODO: Parabolic.
    // Elliptical
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
}

const mTemp = new Matrix4();
const en = new Vector3();
const hn = new Vector3();
const an = new Vector3();

function angleBetween(a: Vector3, b: Vector3): number {
  const denominator = Math.sqrt(a.lengthSq() * b.lengthSq());
  if (denominator === 0) return Math.PI / 2;
  const theta = a.dot(b) / denominator;
  return Math.acos(MathUtils.clamp(theta, -1, 1));
}
