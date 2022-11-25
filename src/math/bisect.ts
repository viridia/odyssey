interface IBisectOptions {
  tolerance?: number;
  maxIterations?: number;
}

export function bisect(
  fn: (n: number) => number,
  lo: number,
  hi: number,
  options: IBisectOptions = {}
): number {
  const { tolerance = 1e-12, maxIterations = 100 } = options;

  let lv = fn(lo);
  if (Math.abs(lv) < tolerance) {
    return lo;
  }
  let hv = fn(hi);
  if (Math.abs(hv) < tolerance) {
    return hi;
  }
  let count = 0;
  for (;;) {
    const mid = (lo + hi) * 0.5;
    const mv = fn(mid);
    if (Math.abs(mv) < tolerance) {
      return mid;
    }
    if (count++ >= maxIterations) {
      console.error(`bisect failed to converge in ${count} iterations.`, { lo, hi, mid, mv });
      return mid;
    }
    if (mv > 0) {
      hi = mid;
      hv = mv;
    } else {
      lo = mid;
      lv = mv;
    }
  }
}
