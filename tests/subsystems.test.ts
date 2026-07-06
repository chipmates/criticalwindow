import { describe, expect, test } from 'vitest';
import { BOT_IDS, runBot } from '../src/engine/bots';
import { chinaDecide } from '../src/engine/china-policy';
import { scoreRun } from '../src/engine/score';
import type { Action } from '../src/engine/types';
import { initGame } from '../src/engine/init';
import { step } from '../src/engine/step';
import type { GameState } from '../src/engine/types';
import { loadRealData } from './helpers/load-real-data';

const data = loadRealData();

/** One full turn: USA plays `allocation`, China plays its scripted window. */
function turnTo(state: GameState, allocation: [number, number, number]): GameState {
  let s = state;
  if (s.phase === 'allocate' && s.actingSeat === 'usa') {
    s = step(data, s, {
      type: 'allocate',
      capability: allocation[0],
      safety: allocation[1],
      diffusion: allocation[2],
    });
  }
  if (s.phase === 'policy' && s.actingSeat === 'usa') {
    s = step(data, s, { type: 'skipPolicy' });
  }
  while (s.phase === 'event' && s.actingSeat === 'usa') {
    s = step(data, s, {
      type: 'resolveEventChoice',
      eventId: s.seats.usa.pendingEvents[0]!.eventId,
      choiceIndex: 0,
    });
  }
  while (s.phase !== 'ended' && s.phase !== 'report' && s.actingSeat === 'china') {
    s = step(data, s, chinaDecide(data, s));
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
    state.seats.usa.hidden.trueAlignment = trueAlignment;
    state.seats.usa.resources.safetyInsight = insight;
    return state;
  }

  test('a badly aligned world reads better than it is when insight is low', () => {
    // truth 100, insight 0: rawLift = 200, counter = 0, jitter >= -100.
    const state = turnTo(withHidden('deception-check', 100, 0), [34, 33, 33]);
    const usa = state.seats.usa;
    const report = usa.evalHistory[usa.evalHistory.length - 1]!;
    // Truth drifted during the turn; compare against the recorded final truth.
    expect(divCenter(report)).toBeGreaterThan(usa.hidden.trueAlignment);
  });

  test('safety insight shrinks the lie', () => {
    const blind = turnTo(withHidden('deception-insight', 100, 0), [34, 33, 33]);
    const probed = turnTo(withHidden('deception-insight', 100, 1000), [34, 33, 33]);
    const liftBlind =
      divCenter(blind.seats.usa.evalHistory[0]!) - blind.seats.usa.hidden.trueAlignment;
    const liftProbed =
      divCenter(probed.seats.usa.evalHistory[0]!) - probed.seats.usa.hidden.trueAlignment;
    // insight 1000: counter (400) kills the max lift (250) entirely; band is
    // at the floor so jitter is tiny. insight 0: lift ~200 with jitter >= -100.
    expect(liftBlind).toBeGreaterThan(50);
    expect(Math.abs(liftProbed)).toBeLessThanOrEqual(25);
  });
});

function divCenter(report: { bandLow: number; bandHigh: number }): number {
  return Math.round((report.bandLow + report.bandHigh) / 2);
}

describe('wildcard targeting', () => {
  test('systemic wildcards self-target: no flat rival.* hits (review finding)', () => {
    for (const card of data.events) {
      if (card.kind !== 'wildcard') {
        continue;
      }
      const theft = (card.scaledEffects ?? []).some((s) => s.target.startsWith('rival.'));
      if (!theft) {
        for (const key of Object.keys(card.effects ?? {})) {
          expect(key.startsWith('rival.')).toBe(false);
        }
      }
    }
  });
});

describe('the chokepoint with teeth (substitution gate)', () => {
  test('under the export crackdown, low substitution slows China more than high', () => {
    const base = initGame(data, { seed: 'subst-check', presetId: 'consensus' });
    base.world.flags = ['exportCrackdown'];
    const low = structuredClone(base);
    low.seats.china.substitution = 250;
    const high = structuredClone(base);
    high.seats.china.substitution = 900;
    const lowAfter = turnTo(low, [50, 25, 25]);
    const highAfter = turnTo(high, [50, 25, 25]);
    expect(
      highAfter.seats.china.resources.capability - base.seats.china.resources.capability,
    ).toBeGreaterThan(
      lowAfter.seats.china.resources.capability - base.seats.china.resources.capability,
    );
  });

  test('china progress is identical for the same seed', () => {
    const a = turnTo(initGame(data, { seed: 'wobble-a', presetId: 'consensus' }), [50, 25, 25]);
    const b = turnTo(initGame(data, { seed: 'wobble-a', presetId: 'consensus' }), [50, 25, 25]);
    expect(a.seats.china.resources.capability).toBe(b.seats.china.resources.capability);
  });
});

describe('society equilibrium', () => {
  test('displacement drifts toward the curve level, not instantly', () => {
    let state = initGame(data, { seed: 'society-drift', presetId: 'skeptic' });
    const start = state.seats.usa.society.jobDisplacement;
    state = turnTo(state, [70, 10, 20]);
    const afterOne = state.seats.usa.society.jobDisplacement;
    // Capability 350+ growth: curve target is low but nonzero; drift is bounded.
    expect(Math.abs(afterOne - start)).toBeLessThanOrEqual(200);
  });
});

describe('agency erosion (hidden ending hook)', () => {
  test('accrues only at high capability, halved by diffusion, never logged', () => {
    const state = initGame(data, { seed: 'erosion-check', presetId: 'skeptic' });
    const low = turnTo(structuredClone(state), [50, 25, 25]);
    expect(low.seats.usa.hidden.agencyErosion).toBe(0);

    const high = structuredClone(state);
    high.seats.usa.resources.capability = 850;
    const noDiffusion = turnTo(structuredClone(high), [80, 10, 10]);
    const withDiffusion = turnTo(structuredClone(high), [40, 10, 50]);
    expect(noDiffusion.seats.usa.hidden.agencyErosion).toBeGreaterThan(0);
    expect(withDiffusion.seats.usa.hidden.agencyErosion).toBeLessThan(
      noDiffusion.seats.usa.hidden.agencyErosion,
    );
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
    process.stdout
      .write(`ending distribution (100 runs, counts overlap across bot personas): ${JSON.stringify(counts)}
`);
    // Guarded invariants, not a snapshot: the design thesis in numbers.
    // Racing pressure dominates (the trap is real), the treaty path stays
    // alive, flourishing stays reachable, and the planned sixth ending
    // must remain unreachable until it actually ships.
    expect(endings.size).toBeGreaterThanOrEqual(4);
    expect(counts['misalignedCatastrophe'] ?? 0).toBeGreaterThanOrEqual(40);
    expect(counts['negotiatedSlowdown'] ?? 0).toBeGreaterThanOrEqual(5);
    expect(counts['flourishing'] ?? 0).toBeGreaterThanOrEqual(1);
    expect(counts['gradualDisempowerment'] ?? 0).toBe(0);
  });

  test('every worldview preset completes runs', () => {
    for (const presetId of ['cautious', 'consensus', 'skeptic'] as const) {
      const initial = initGame(data, { seed: `preset-${presetId}`, presetId });
      const result = runBot(data, initial, 'hedger');
      expect(result.endingId).toBeTruthy();
    }
  });
});

describe('the reckoning (run score)', () => {
  test('deterministic, ending-dominated, catastrophe grade-capped', () => {
    let state = initGame(data, { seed: 'score-seed', presetId: 'consensus' });
    let guard = 0;
    while (state.phase !== 'ended' && guard < 800) {
      let action: Action;
      if (state.phase === 'report') {
        action = { type: 'advance' };
      } else if (state.actingSeat === 'china') {
        action = chinaDecide(data, state);
      } else if (state.phase === 'allocate') {
        action = state.seats.usa.flags.includes('forcedPause')
          ? { type: 'allocate', capability: 30, safety: 40, diffusion: 30 }
          : { type: 'allocate', capability: 80, safety: 10, diffusion: 10 };
      } else if (state.phase === 'policy') {
        action = { type: 'skipPolicy' };
      } else {
        action = {
          type: 'resolveEventChoice',
          eventId: state.seats.usa.pendingEvents[0]!.eventId,
          choiceIndex: 0,
        };
      }
      state = step(data, state, action);
      guard += 1;
    }
    expect(state.endingId).not.toBeNull();
    const a = scoreRun(state, true);
    const b = scoreRun(state, true);
    expect(a.total).toBe(b.total);
    expect(a.total).toBeGreaterThan(0);
    if (state.endingId === 'misalignedCatastrophe' || state.endingId === 'societalBreakdown') {
      expect(['D', 'F']).toContain(a.grade);
    }
    // warning-shot honesty moves the score
    const c = scoreRun(state, false);
    expect(c.total).toBeLessThanOrEqual(a.total);
  });
});
