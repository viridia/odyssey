import { Vector3 } from 'three';
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

  public fromStateVector(pos: Vector3, vel: Vector3, _t: number, m1: number, m2: number = 0) {
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

    let argPe = Math.acos(n.dot(ev) / Math.sqrt(n.lengthSq() * ev.lengthSq()));
    if (ev.z < 0) {
      argPe = Math.PI * 2 - argPe;
    }

    let v = Math.acos(ev.dot(pos) / Math.sqrt(ev.lengthSq() * pos.lengthSq()));
    if (pos.dot(vel) < 0) {
      v = Math.PI * 2 - v;
    }

    // if (e < 1) {
    //   let a = p / (1 - Math.pow(e, 2));
    //   let E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(ν / 2));
    //   // let T0 = t - Math.sqrt(Math.pow(a, 3) / GM) * (E - e * Math.sin(E));

    //   // return [a, e, i, Ω, ω, T0];
    // } else if (e > 1) {
    //   let a = p / (Math.pow(e, 2) - 1);
    //   let H = 2 * Math.atanh(Math.sqrt((1 - e) / (1 + e)) * Math.tan(ν / 2));
    //   // let T0 = t + Math.sqrt(Math.pow(a, 3) / GM) * (H - e * Math.sinh(H));

    //   // return [a, e, i, Ω, ω, T0];
    // } else {
    //   let T0 =
    //     t -
    //     0.5 *
    //       Math.sqrt(Math.pow(p, 3) / GM) *
    //       (Math.tan(ν / 2) + (1 / 3) * Math.pow(Math.tan(ν / 2), 3));

    //   // return [p, e, i, Ω, ω, T0];
    // }

    this.a = a;
    this.e = e;
    this.i = i;
    this.raan = raan;
    this.ap = argPe;
    this.v = v;
  }

  public trueAnomalyFromEccentric(E: number) {
    return (
      2 *
      Math.atan2(Math.sqrt(1 + this.e) * Math.sin(E / 2), Math.sqrt(1 - this.e) * Math.cos(E / 2))
    );
  }
}
