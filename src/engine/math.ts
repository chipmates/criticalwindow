/**
 * Exact math for the engine. Everything here must produce bit-identical
 * results on every JS engine, which is why only IEEE-754-exact operations
 * appear: integer add/sub/mul (within 2^53), compare, trunc/floor/abs.
 * Curve *shapes* (diminishing returns, growth) live as piecewise-linear
 * tables in /data, keeping every curve sourceable and this file transcendental-free.
 */

/** Largest integer magnitude we allow in intermediate products. */
const SAFE_LIMIT = 2 ** 52;

export function assertInt(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new EngineMathError(`${label} must be an integer, got ${value}`);
  }
  if (Math.abs(value) > SAFE_LIMIT) {
    throw new EngineMathError(`${label} exceeds safe integer range: ${value}`);
  }
}

export class EngineMathError extends Error {}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * Exact rounded integer division, round-half-away-from-zero.
 * Uses only integer arithmetic, so the result is deterministic everywhere.
 */
export function divRound(numerator: number, denominator: number): number {
  assertInt(numerator, 'numerator');
  assertInt(denominator, 'denominator');
  if (denominator === 0) {
    throw new EngineMathError('division by zero');
  }
  // + 0 normalizes Math.trunc's -0 (negative zero must never enter state).
  const quotient = Math.trunc(numerator / denominator) + 0;
  const remainder = numerator - quotient * denominator;
  if (remainder === 0) {
    return quotient;
  }
  const sign = (numerator < 0 ? -1 : 1) * (denominator < 0 ? -1 : 1);
  if (2 * Math.abs(remainder) >= Math.abs(denominator)) {
    return quotient + sign;
  }
  return quotient;
}

/** Exact linear scale: value * num / den, rounded half away from zero. */
export function mulDiv(value: number, num: number, den: number): number {
  assertInt(value, 'value');
  assertInt(num, 'num');
  const product = value * num;
  assertInt(product, 'value*num');
  return divRound(product, den);
}

// ---------------------------------------------------------------------------
// Piecewise-linear curves
// ---------------------------------------------------------------------------

/**
 * Shape of a curve table as it appears in /data (the schema wraps it with
 * sourceIds; the engine only needs the knots).
 */
export interface CurvePoints {
  x: number[];
  y: number[];
}

/**
 * Evaluate a piecewise-linear curve at `x` with exact integer interpolation.
 * Clamps outside the knot range (flat extension), exact at knots.
 */
export function evalCurve(curve: CurvePoints, x: number): number {
  const { x: xs, y: ys } = curve;
  if (xs.length < 2 || xs.length !== ys.length) {
    throw new EngineMathError(`curve needs >=2 matching knots, got ${xs.length}/${ys.length}`);
  }
  assertInt(x, 'x');

  const first = xs[0]!;
  const last = xs[xs.length - 1]!;
  if (x <= first) {
    return ys[0]!;
  }
  if (x >= last) {
    return ys[ys.length - 1]!;
  }

  // Find the segment via linear scan; knot counts are tiny (< 20).
  for (let i = 1; i < xs.length; i += 1) {
    const x1 = xs[i]!;
    if (x <= x1) {
      const x0 = xs[i - 1]!;
      const y0 = ys[i - 1]!;
      const y1 = ys[i]!;
      if (x1 === x0) {
        throw new EngineMathError(`curve has duplicate x knot at index ${i}`);
      }
      return y0 + divRound((y1 - y0) * (x - x0), x1 - x0);
    }
  }
  // Unreachable: x < last guarantees a segment above.
  throw new EngineMathError('curve evaluation fell through');
}
