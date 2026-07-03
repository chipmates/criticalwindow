import { describe, expect, test } from 'vitest';
import { EngineMathError, clamp, divRound, evalCurve, mulDiv } from '../src/engine/math';

describe('divRound (exact integer division, half away from zero)', () => {
  test('exact divisions', () => {
    expect(divRound(4, 2)).toBe(2);
    expect(divRound(-4, 2)).toBe(-2);
    expect(divRound(0, 5)).toBe(0);
  });

  test('rounds half away from zero, both signs', () => {
    expect(divRound(7, 2)).toBe(4);
    expect(divRound(-7, 2)).toBe(-4);
    expect(divRound(500, 1000)).toBe(1);
    expect(divRound(-500, 1000)).toBe(-1);
    expect(divRound(499, 1000)).toBe(0);
    expect(divRound(-499, 1000)).toBe(0);
  });

  test('ordinary rounding', () => {
    expect(divRound(5, 3)).toBe(2);
    expect(divRound(-5, 3)).toBe(-2);
    expect(divRound(10, 4)).toBe(3);
    expect(divRound(1, 1000)).toBe(0);
  });

  test('negative denominators', () => {
    expect(divRound(7, -2)).toBe(-4);
    expect(divRound(-7, -2)).toBe(4);
  });

  test('guards', () => {
    expect(() => divRound(1.5, 2)).toThrow(EngineMathError);
    expect(() => divRound(1, 0)).toThrow(EngineMathError);
  });
});

describe('mulDiv', () => {
  test('scales exactly', () => {
    expect(mulDiv(300, 50, 100)).toBe(150);
    expect(mulDiv(333, 1, 3)).toBe(111);
    expect(mulDiv(1000, 999, 1000)).toBe(999);
  });
  test('rejects overflow products', () => {
    expect(() => mulDiv(2 ** 40, 2 ** 20, 1)).toThrow(EngineMathError);
  });
});

describe('clamp', () => {
  test('clamps both ends', () => {
    expect(clamp(-5, 0, 1000)).toBe(0);
    expect(clamp(1500, 0, 1000)).toBe(1000);
    expect(clamp(500, 0, 1000)).toBe(500);
  });
});

describe('evalCurve (piecewise linear, exact)', () => {
  const curve = { x: [0, 250, 500, 750, 1000], y: [0, 180, 380, 640, 1000] };

  test('exact at every knot', () => {
    for (let i = 0; i < curve.x.length; i += 1) {
      expect(evalCurve(curve, curve.x[i]!)).toBe(curve.y[i]!);
    }
  });

  test('midpoints interpolate with round-half-away-from-zero', () => {
    // Segment 0..250 -> 0..180: at 125 exactly 90.
    expect(evalCurve(curve, 125)).toBe(90);
    // Segment 250..500 -> 180..380: at 375 exactly 280.
    expect(evalCurve(curve, 375)).toBe(280);
    // Non-exact point: 100 on first segment = 180*100/250 = 72.
    expect(evalCurve(curve, 100)).toBe(72);
    // 1 on first segment = 180/250 = 0.72 -> rounds to 1.
    expect(evalCurve(curve, 1)).toBe(1);
  });

  test('clamps outside the knot range (flat extension)', () => {
    expect(evalCurve(curve, -100)).toBe(0);
    expect(evalCurve(curve, 2000)).toBe(1000);
  });

  test('handles negative slopes', () => {
    const declining = { x: [0, 100], y: [1000, 0] };
    expect(evalCurve(declining, 50)).toBe(500);
    expect(evalCurve(declining, 99)).toBe(10);
  });

  test('handles negative y values exactly', () => {
    const dipping = { x: [0, 100], y: [-500, 500] };
    expect(evalCurve(dipping, 25)).toBe(-250);
    expect(evalCurve(dipping, 50)).toBe(0);
  });

  test('rejects malformed curves', () => {
    expect(() => evalCurve({ x: [0], y: [0] }, 0)).toThrow(EngineMathError);
    expect(() => evalCurve({ x: [0, 1, 2], y: [0, 1] }, 0)).toThrow(EngineMathError);
    expect(() => evalCurve(curve, 0.5)).toThrow(EngineMathError);
  });
});
