import { describe, test, expect } from 'vitest';
import { newtonRaphson } from './newton';

describe('newton-raphson', function () {
  describe.skip('failure modes', function () {
    test('returns false if div by zero encountered', function () {
      var root = newtonRaphson(
        () => 7,
        () => 0,
        2
      );
      expect(root).toBe(false);
    });

    test('returns false if m = 0 encountered', function () {
      var root = newtonRaphson(
        () => 1,
        () => 1,
        2
      );
      expect(root).toBe(false);
    });

    test('returns false if max iterations encountered', function () {
      // Construct a function that's always changing so will never converge:
      var c = 0;
      var root = newtonRaphson(
        () => ++c,
        2
      );
      expect(root).toBe(false);
    });
  });

  describe('using provided derivative', function () {
    test('finds the positive zero of x^2 + x - 2', function () {
      var root = newtonRaphson(
        x => x * x + x - 2,
        x => 2 * x + 1,
        2
      );
      expect(root).toBeCloseTo(1);
    });

    test('finds the positive root of x^3 - 3 * x + 2', function () {
      var root = newtonRaphson(
        x => x * x * x - 3 * x + 2,
        x => 3 * x * x - 3,
        3,
        {maxIterations: 30}
      );
      expect(root).toBeCloseTo(1);
    });

    test('finds the zero of cos(x) + 1 at x = pi', function () {
      var root = newtonRaphson(
        x => Math.cos(x) + 1,
        x => -Math.sin(x),
        3
      );
      expect(root).toBeCloseTo(Math.PI);
    });

    test('finds the zero of sin(x) at x = pi', function () {
      var root = newtonRaphson(
        Math.sin,
        Math.cos,
        3
      );
      expect(root).toBeCloseTo(Math.PI);
    });

    test('finds the zero of sin(x) at x = 0 given a guess of x = 0.5', function () {
      var root = newtonRaphson(
        Math.sin,
        Math.cos,
        0.5
      );
      expect(root).toBeCloseTo(0);
    });

    test.skip('fails to find zeros of x^2 + 1', function () {
      var root = newtonRaphson(
        x => x * x + 1,
        x => 2 * x,
        2
      );
      expect(root).toBe(false);
    });

    test.skip('fails to find the zero of sin(x) at x = 0 given a guess of x = pi', function () {
      var root = newtonRaphson(
        Math.sin,
        Math.cos,
        Math.PI * 0.5
      );
      expect(root).toBe(false);
    });

    describe('finds the positive zero of (x + 2) * (x - 1)^m for:', function () {
      for (var mm = 1; mm <= 14; mm++) {
        (function (m) {
          test('m = ' + m, function () {
            var root = newtonRaphson(
              x => (x + 2) * Math.pow(x - 1, m),
              x => (x + 2) * m * Math.pow(x - 1, m - 1) + Math.pow(x - 1, m),
              3,
              {maxIterations: 200}
            );
            expect(root).toBeCloseTo(1, 1e-5);
          });
        }(mm));
      }
    });
  });

  describe('using numerical first derivative', function () {
    test('finds the negative zero of x^2 + x - 2', function () {
      var root = newtonRaphson(
        x => x * x + x - 2,
        -1
      );
      expect(root).toBeCloseTo(-2);
    });

    test('finds the zero of sin(x) at x = 0 given a guess of x = 0.5', function () {
      var root = newtonRaphson(
        Math.sin,
        0.5,
        {h: 1e-6}
      );
      expect(root).toBeCloseTo(0);
    });

    test('finds the positive zero of x^2 + x - 2', function () {
      var root = newtonRaphson(
        x => x * x + x - 2,
        2
      );
      expect(root).toBeCloseTo(1);
    });

    test('finds the zero of sin(x) at x = pi', function () {
      var root = newtonRaphson(
        Math.sin,
        3
      );
      expect(root).toBeCloseTo(Math.PI);
    });

    test('finds the zero of cos(x) + 1 at x = pi', function () {
      var root = newtonRaphson(
        x => Math.cos(x) + 1,
        3
      );
      expect(root).toBeCloseTo(Math.PI);
    });

    test.skip('fails to find the zero of sin(x) at x = 0 given a guess of x = pi', function () {
      var root = newtonRaphson(
        Math.sin,
        Math.PI * 0.5
      );
      expect(root).toBe(false);
    });

    describe('finds the positive zero of (x + 2) * (x - 1)^m for:', function () {
      for (var mm = 1; mm <= 14; mm++) {
        (function (m) {
          test('m = ' + m, function () {
            var root = newtonRaphson(
              x => (x + 2) * Math.pow(x - 1, m),
              3,
              {h: 1e-7, maxIterations: 200}
            );
            expect(root).toBeCloseTo(1, 5);
          });
        }(mm));
      }
    });
  });
});