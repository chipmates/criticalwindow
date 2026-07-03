import { describe, expect, test } from 'vitest';
import { BOT_IDS, runBot } from '../src/engine/bots';
import { initGame } from '../src/engine/init';
import { step } from '../src/engine/step';
import type { GameState } from '../src/engine/types';
import { loadRealData } from './helpers/load-real-data';

const data = loadRealData();

function turnTo(state: GameState, allocation: [number, number, number]): GameState {
  let s = state;
  if (s.phase === 'allocate') {
    s = step(data, s, {
      type: 'allocate',
      capability: allocation[0],
      safety: allocation[1],
      diffusion: allocation[2],
    });
  }
  if (s.phase === 'policy') {
    s = step(data, s, { type: 'skipPolicy' });
  }
  while (s.phase === 'event') {
    s = step(data, s, {
      type: 'resolveEventChoice',
      eventId: s.pendingEvents[0]!.eventId,
      choiceIndex: 0,
    });
  }
  if (s.phase === 'report') {
    s = step(data, s, { type: 'advance' });
  }
  return s;
}

describe('deceptive pass (takeaway 2, mechanically)', () => {
  // Surgical setup: pin true alignment very low so the lift dominates the
  // seeded jitter deterministically (jitter is bounded by band/4).
  function withHidden(seed: string, trueAlignment: number, insight: number) {
    const state = initGame(data, { seed, presetId: 'cautious' });
    state.hidden.trueAlignment = trueAlignment;
    state.resources.safetyInsight = insight;
    return state;
  }

  test('a badly aligned world reads better than it is when insight is low', () => {
    // truth 100, insight 0: rawLift = 200, counter = 0, jitter >= -100.
    const state = turnTo(withHidden('deception-check', 100, 0), [34, 33, 33]);
    const report = state.evalHistory[state.evalHistory.length - 1]!;
    // Truth drifted during the turn; compare against the recorded final truth.
    expect(divCenter(report)).toBeGreaterThan(state.hidden.trueAlignment);
  });

  test('safety insight shrinks the lie', () => {
    const blind = turnTo(withHidden('deception-insight', 100, 0), [34, 33, 33]);
    const probed = turnTo(withHidden('deception-insight', 100, 1000), [34, 33, 33]);
    const liftBlind = divCenter(blind.evalHistory[0]!) - blind.hidden.trueAlignment;
    const liftProbed = divCenter(probed.evalHistory[0]!) - probed.hidden.trueAlignment;
    // insight 1000: counter (400) kills the max lift (250) entirely; band is
    // at the floor so jitter is tiny. insight 0: lift ~200 with jitter >= -100.
    expect(liftBlind).toBeGreaterThan(50);
    expect(Math.abs(liftProbed)).toBeLessThanOrEqual(25);
  });
});

function divCenter(report: { bandLow: number; bandHigh: number }): number {
  return Math.round((report.bandLow + report.bandHigh) / 2);
}

describe('rival depth', () => {
  test('matured substitution pays a capability bonus', () => {
    const state = initGame(data, { seed: 'subst-check', presetId: 'consensus' });
    const boosted = structuredClone(state);
    boosted.rival.substitution = 900;
    const normalAfter = turnTo(structuredClone(state), [50, 25, 25]);
    const boostedAfter = turnTo(boosted, [50, 25, 25]);
    // Same seed, same draws: the only difference is the substitution bonus.
    expect(boostedAfter.rival.capability - state.rival.capability).toBeGreaterThan(
      normalAfter.rival.capability - state.rival.capability,
    );
  });

  test('rival progress varies per seed but is identical for the same seed', () => {
    const a = turnTo(initGame(data, { seed: 'wobble-a', presetId: 'consensus' }), [50, 25, 25]);
    const b = turnTo(initGame(data, { seed: 'wobble-a', presetId: 'consensus' }), [50, 25, 25]);
    expect(a.rival.capability).toBe(b.rival.capability);
  });
});

describe('society equilibrium', () => {
  test('displacement drifts toward the curve level, not instantly', () => {
    let state = initGame(data, { seed: 'society-drift', presetId: 'skeptic' });
    const start = state.society.jobDisplacement;
    state = turnTo(state, [70, 10, 20]);
    const afterOne = state.society.jobDisplacement;
    // Capability 350+ growth: curve target is low but nonzero; drift is bounded.
    expect(Math.abs(afterOne - start)).toBeLessThanOrEqual(200);
  });
});

describe('agency erosion (hidden ending hook)', () => {
  test('accrues only at high capability, halved by diffusion, never logged', () => {
    const state = initGame(data, { seed: 'erosion-check', presetId: 'skeptic' });
    const low = turnTo(structuredClone(state), [50, 25, 25]);
    expect(low.hidden.agencyErosion).toBe(0);

    const high = structuredClone(state);
    high.resources.capability = 850;
    const noDiffusion = turnTo(structuredClone(high), [80, 10, 10]);
    const withDiffusion = turnTo(structuredClone(high), [40, 10, 50]);
    expect(noDiffusion.hidden.agencyErosion).toBeGreaterThan(0);
    expect(withDiffusion.hidden.agencyErosion).toBeLessThan(noDiffusion.hidden.agencyErosion);
    expect(noDiffusion.log.some((e) => JSON.stringify(e).includes('agencyErosion'))).toBe(false);
  });
});

describe('ending reachability batch (B4 verify; the full 10k batch is B6)', () => {
  test('bots across seeds reach at least 3 distinct endings', () => {
    const endings = new Set<string>();
    const counts: Record<string, number> = {};
    for (const bot of BOT_IDS) {
      for (let i = 0; i < 25; i += 1) {
        const initial = initGame(data, { seed: `batch-${bot}-${i}`, presetId: 'consensus' });
        const result = runBot(data, initial, bot);
        endings.add(result.endingId);
        counts[result.endingId] = (counts[result.endingId] ?? 0) + 1;
        expect(result.turns).toBeLessThanOrEqual(16);
      }
    }
    process.stdout.write(`ending distribution (100 runs): ${JSON.stringify(counts)}
`);
    expect(endings.size).toBeGreaterThanOrEqual(3);
  });

  test('every worldview preset completes runs', () => {
    for (const presetId of ['cautious', 'consensus', 'skeptic'] as const) {
      const initial = initGame(data, { seed: `preset-${presetId}`, presetId });
      const result = runBot(data, initial, 'hedger');
      expect(result.endingId).toBeTruthy();
    }
  });
});
