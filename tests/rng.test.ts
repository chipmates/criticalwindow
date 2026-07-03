import { describe, expect, test } from 'vitest';
import {
  RngError,
  cyrb128,
  drawFromStream,
  initRngState,
  initStream,
  nextInt,
  nextIntInRange,
  nextU32,
  weightedIndex,
  type RngStreamState,
} from '../src/engine/rng';
import { RNG_STREAM_NAMES } from '../src/engine/types';

function drawMany(state: RngStreamState, n: number): { values: number[]; state: RngStreamState } {
  const values: number[] = [];
  let current = state;
  for (let i = 0; i < n; i += 1) {
    const [v, next] = nextU32(current);
    values.push(v);
    current = next;
  }
  return { values, state: current };
}

describe('determinism (the constitution)', () => {
  test('same seed, same stream, same sequence, always', () => {
    const a = drawMany(initStream('prototype-1', 'events'), 100);
    const b = drawMany(initStream('prototype-1', 'events'), 100);
    expect(a.values).toEqual(b.values);
  });

  test('sequences survive JSON serialization (replay resume)', () => {
    const { state: warmed } = drawMany(initStream('prototype-1', 'events'), 37);
    const thawed = JSON.parse(JSON.stringify([...warmed])) as [number, number, number, number];
    const fromWarm = drawMany(warmed, 20);
    const fromThawed = drawMany(thawed, 20);
    expect(fromThawed.values).toEqual(fromWarm.values);
  });

  test('known-answer: pinned first draws for the release seed derivation', () => {
    // Pinned 2026-07-03 (Block B2). If this test ever fails, the seed
    // derivation or generator changed and EVERY shared seed breaks:
    // that is a schemaVersion bump, not a test to update casually.
    const { values } = drawMany(initStream('kat-seed', 'events'), 4);
    expect(values).toEqual(KAT_EXPECTED);
  });

  test('all four uint32 words stay in range across many draws', () => {
    let state = initStream('range-check', 'rival');
    for (let i = 0; i < 1000; i += 1) {
      const [value, next] = nextU32(state);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
      for (const word of next) {
        expect(Number.isInteger(word)).toBe(true);
        expect(word).toBeGreaterThanOrEqual(0);
        expect(word).toBeLessThanOrEqual(0xffffffff);
      }
      state = next;
    }
  });
});

describe('named streams', () => {
  test('streams from one master seed are distinct', () => {
    const rng = initRngState('prototype-1');
    const sequences = RNG_STREAM_NAMES.map((name) => drawMany(rng[name], 8).values.join(','));
    expect(new Set(sequences).size).toBe(RNG_STREAM_NAMES.length);
  });

  test('drawing from one stream never shifts another', () => {
    const rng = initRngState('prototype-1');
    const rivalBefore = [...rng.rival];
    let current = rng;
    for (let i = 0; i < 50; i += 1) {
      const [, next] = drawFromStream(current, 'events', 6);
      current = next;
    }
    expect([...current.rival]).toEqual(rivalBefore);
    // And the untouched stream continues exactly as if nothing happened.
    const fromOriginal = drawMany(rng.rival, 10);
    const fromAfter = drawMany(current.rival, 10);
    expect(fromAfter.values).toEqual(fromOriginal.values);
  });

  test('different master seeds diverge', () => {
    const a = drawMany(initRngState('seed-a').events, 8);
    const b = drawMany(initRngState('seed-b').events, 8);
    expect(a.values).not.toEqual(b.values);
  });
});

describe('nextInt / nextIntInRange', () => {
  test('bounds are respected and bound 1 consumes no entropy', () => {
    let state = initStream('bounds', 'hiddenDice');
    for (let i = 0; i < 500; i += 1) {
      const [v, next] = nextInt(state, 7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
      state = next;
    }
    const [zero, same] = nextInt(state, 1);
    expect(zero).toBe(0);
    expect(same).toBe(state);
  });

  test('rejects bad bounds', () => {
    const state = initStream('bounds', 'hiddenDice');
    expect(() => nextInt(state, 0)).toThrow(RngError);
    expect(() => nextInt(state, -3)).toThrow(RngError);
    expect(() => nextInt(state, 2.5)).toThrow(RngError);
  });

  test('inclusive ranges hit both endpoints eventually', () => {
    let state = initStream('endpoints', 'hiddenDice');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const [v, next] = nextIntInRange(state, 3, 5);
      seen.add(v);
      state = next;
    }
    expect([...seen].sort()).toEqual([3, 4, 5]);
  });

  test('distribution sanity: 10k d10 draws stay near uniform', () => {
    let state = initStream('distribution', 'hiddenDice');
    const buckets = new Array<number>(10).fill(0);
    for (let i = 0; i < 10000; i += 1) {
      const [v, next] = nextInt(state, 10);
      buckets[v]! += 1;
      state = next;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });
});

describe('weightedIndex', () => {
  test('zero-weight entries never draw, proportions roughly hold', () => {
    let state = initStream('weights', 'events');
    const counts = [0, 0, 0];
    for (let i = 0; i < 4000; i += 1) {
      const [i3, next] = weightedIndex(state, [1, 0, 3]);
      counts[i3]! += 1;
      state = next;
    }
    expect(counts[1]).toBe(0);
    expect(counts[0]! + counts[2]!).toBe(4000);
    const ratio = counts[2]! / counts[0]!;
    expect(ratio).toBeGreaterThan(2.4);
    expect(ratio).toBeLessThan(3.6);
  });

  test('guards', () => {
    const state = initStream('weights', 'events');
    expect(() => weightedIndex(state, [0, 0])).toThrow(RngError);
    expect(() => weightedIndex(state, [1, -1])).toThrow(RngError);
    expect(() => weightedIndex(state, [1.5])).toThrow(RngError);
  });
});

describe('cyrb128', () => {
  test('stable and input-sensitive', () => {
    expect(cyrb128('race')).toEqual(cyrb128('race'));
    expect(cyrb128('race')).not.toEqual(cyrb128('rac e'));
    expect(cyrb128('')).toEqual(cyrb128(''));
  });
});

// Pinned by running the implementation once at B2; see the KAT test above.
const KAT_EXPECTED: number[] = [619356682, 296224538, 2180464607, 2546136650];
