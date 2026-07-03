/**
 * Seeded RNG: xoshiro128** with named, independent sub-streams.
 *
 * Why streams: an added ticker draw must never shift an event draw, or a
 * content patch would silently change every replay within a dataVersion.
 * Each subsystem (events, hiddenDice, rival, ticker) gets its own generator,
 * seeded from hash(masterSeed, streamName).
 *
 * Everything here is exact integer arithmetic (imul, shifts, xor), so
 * sequences are bit-identical across JS engines. The generator state is a
 * plain 4-tuple of uint32 living inside GameState; functions take a state
 * and return [value, nextState]. Nothing mutates.
 *
 * API frozen at Block B2. The engine builds on: initRngState, nextU32,
 * nextInt, weightedIndex.
 */
import type { RngState, RngStreamName } from './types';
import { RNG_STREAM_NAMES } from './types';

export type RngStreamState = readonly [number, number, number, number];

export class RngError extends Error {}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** cyrb128: string -> 4 well-mixed uint32 words (seeding only). */
export function cyrb128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i += 1) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

/** splitmix32 scramble step, used to decorrelate seed words. */
function splitmix32(seed: number): [number, number] {
  const z = (seed + 0x9e3779b9) >>> 0;
  let x = z;
  x ^= x >>> 16;
  x = Math.imul(x, 0x21f0aaad) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x735a2d97) >>> 0;
  x ^= x >>> 15;
  return [x >>> 0, z];
}

/** Derive one stream's initial xoshiro state from (masterSeed, streamName). */
export function initStream(masterSeed: string, streamName: string): RngStreamState {
  const h = cyrb128(`${masterSeed}::${streamName}`);
  const out: number[] = [];
  let carry = h[3];
  for (let i = 0; i < 4; i += 1) {
    const [word, nextCarry] = splitmix32((carry ^ h[i]!) >>> 0);
    out.push(word);
    carry = nextCarry;
  }
  // xoshiro must never start all-zero; unreachable in practice, cheap to guard.
  if (out.every((w) => w === 0)) {
    out[0] = 1;
  }
  return [out[0]!, out[1]!, out[2]!, out[3]!];
}

/** All named streams for a run. */
export function initRngState(masterSeed: string): RngState {
  const state = {} as Record<RngStreamName, [number, number, number, number]>;
  for (const name of RNG_STREAM_NAMES) {
    state[name] = [...initStream(masterSeed, name)] as [number, number, number, number];
  }
  return state;
}

/** xoshiro128**: one draw. Returns the uint32 and the successor state. */
export function nextU32(state: RngStreamState): [number, RngStreamState] {
  const [s0, s1, s2, s3] = state;
  const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const t = (s1 << 9) >>> 0;
  let n2 = (s2 ^ s0) >>> 0;
  let n3 = (s3 ^ s1) >>> 0;
  const n1 = (s1 ^ n2) >>> 0;
  const n0 = (s0 ^ n3) >>> 0;
  n2 = (n2 ^ t) >>> 0;
  n3 = rotl(n3, 11);
  return [result, [n0, n1, n2, n3]];
}

/**
 * Unbiased integer in [0, bound). Rejection sampling: modulo alone would
 * skew small bounds, and skew is a balance bug you cannot see in a diff.
 */
export function nextInt(state: RngStreamState, bound: number): [number, RngStreamState] {
  if (!Number.isInteger(bound) || bound <= 0 || bound > 0x100000000) {
    throw new RngError(`nextInt bound must be a positive integer <= 2^32, got ${bound}`);
  }
  if (bound === 1) {
    // Zero entropy needed; consuming none keeps draw counts intentional.
    return [0, state];
  }
  const limit = 0x100000000 - (0x100000000 % bound);
  let current = state;
  for (;;) {
    const [value, next] = nextU32(current);
    current = next;
    if (value < limit) {
      return [value % bound, current];
    }
  }
}

/** Integer in [min, max], both inclusive. */
export function nextIntInRange(
  state: RngStreamState,
  min: number,
  max: number,
): [number, RngStreamState] {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RngError(`bad range [${min}, ${max}]`);
  }
  const [offset, next] = nextInt(state, max - min + 1);
  return [min + offset, next];
}

/**
 * Weighted pick: returns an index i with probability weights[i]/sum(weights).
 * Integer weights only (event card weights are small integers by schema).
 */
export function weightedIndex(
  state: RngStreamState,
  weights: readonly number[],
): [number, RngStreamState] {
  let total = 0;
  for (const w of weights) {
    if (!Number.isInteger(w) || w < 0) {
      throw new RngError(`weights must be non-negative integers, got ${w}`);
    }
    total += w;
  }
  if (total <= 0) {
    throw new RngError('weightedIndex needs a positive total weight');
  }
  const [roll, next] = nextInt(state, total);
  let cumulative = 0;
  for (let i = 0; i < weights.length; i += 1) {
    cumulative += weights[i]!;
    if (roll < cumulative) {
      return [i, next];
    }
  }
  // Unreachable: roll < total and cumulative reaches total.
  throw new RngError('weightedIndex fell through');
}

/** Draw from one named stream inside a full RngState; siblings untouched. */
export function drawFromStream(
  rng: RngState,
  stream: RngStreamName,
  bound: number,
): [number, RngState] {
  const [value, nextStream] = nextInt(rng[stream], bound);
  return [value, { ...rng, [stream]: [...nextStream] as [number, number, number, number] }];
}
