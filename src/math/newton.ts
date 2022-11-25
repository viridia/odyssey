// Copied from https://github.com/scijs/newton-raphson-method
// Converted to TypeScript and ES6

interface INewtonRaphsonOptions {
  tolerance?: number;
  epsilon?: number;
  maxIterations?: number;
  h?: number;
  verbose?: boolean;
}

export function newtonRaphson(
  f: (n: number) => number,
  fp: (n: number) => number,
  x0: number,
  options?: INewtonRaphsonOptions
): number;
export function newtonRaphson(
  f: (n: number) => number,
  x0: number,
  options?: INewtonRaphsonOptions
): number;
export function newtonRaphson(
  f: (n: number) => number,
  fp: number | ((n: number) => number),
  x0?: number | INewtonRaphsonOptions,
  options?: INewtonRaphsonOptions
): number {
  // Iterpret variadic forms:
  const fnp = typeof fp === 'function' ? fp : null;

  const {
    tolerance: tol = 1e-7,
    epsilon: eps = 2.220446049250313e-16,
    maxIterations: maxIter = 20,
    h = 1e-4,
    verbose = false,
  } = (fnp ? (options as INewtonRaphsonOptions) : (x0 as INewtonRaphsonOptions)) ?? {};

  const hr = 1 / h;
  let x = (fnp ? x0 : fp) as number;

  let iter = 0;
  while (iter++ < maxIter) {
    // Compute the value of the function:
    let y = f(x);
    let yp, yph, ymh, yp2h, ym2h;

    if (fnp) {
      yp = fnp(x);
    } else {
      // Needs numerical derivatives:
      yph = f(x + h);
      ymh = f(x - h);
      yp2h = f(x + 2 * h);
      ym2h = f(x - 2 * h);

      yp = ((ym2h - yp2h + 8 * (yph - ymh)) * hr) / 12;
    }

    // Check for badly conditioned update (extremely small first deriv relative to function):
    if (Math.abs(yp) <= eps * Math.abs(y)) {
      throw new Error(`Newton-Raphson: failed to converged due to nearly zero first derivative.`);
    }

    // Update the guess:
    let x1 = x - y / yp;

    // Check for convergence:
    if (Math.abs(x1 - x) <= tol * Math.abs(x1)) {
      if (verbose) {
        console.log('Newton-Raphson: converged to x = ' + x1 + ' after ' + iter + ' iterations');
      }
      return x1;
    }

    // Transfer update to the new guess:
    x = x1;
  }

  throw new Error('Newton-Raphson: Maximum iterations reached (' + maxIter + ')');
}
