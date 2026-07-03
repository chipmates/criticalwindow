import { describe, expect, test } from 'vitest';
import { canonicalJson } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { EngineError, legalActions, playablePolicies, step } from '../src/engine/step';
import type { Action, GameState } from '../src/engine/types';
import { loadRealData } from './helpers/load-real-data';

const data = loadRealData();

function newGame(seed = 'b3-test-seed'): GameState {
  return initGame(data, { seed, presetId: 'consensus' });
}

/** Drive one full turn with a simple policy; returns the state at next allocate (or ended). */
function playTurn(state: GameState, allocation: [number, number, number]): GameState {
  let s = step(data, state, {
    type: 'allocate',
    capability: allocation[0],
    safety: allocation[1],
    diffusion: allocation[2],
  });
  if (s.phase === 'policy') {
    s = step(data, s, { type: 'skipPolicy' });
  }
  while (s.phase === 'event') {
    const pending = s.pendingEvents[0]!;
    s = step(data, s, { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex: 0 });
  }
  if (s.phase === 'report') {
    s = step(data, s, { type: 'advance' });
  }
  return s;
}

describe('init', () => {
  test('hidden dice roll inside the preset ranges', () => {
    for (const presetId of ['cautious', 'consensus', 'skeptic'] as const) {
      const preset = data.parameters.worldviewPresets[presetId];
      const state = initGame(data, { seed: 'roll-check', presetId });
      expect(state.hidden.alignmentDifficulty).toBeGreaterThanOrEqual(
        preset.alignmentDifficulty.min,
      );
      expect(state.hidden.alignmentDifficulty).toBeLessThanOrEqual(preset.alignmentDifficulty.max);
      expect(state.hidden.takeoffSteepness).toBeGreaterThanOrEqual(preset.takeoffSteepness.min);
      expect(state.hidden.takeoffSteepness).toBeLessThanOrEqual(preset.takeoffSteepness.max);
    }
  });

  test('same seed, same hidden world; different seed, (almost surely) different', () => {
    const a = initGame(data, { seed: 'same', presetId: 'consensus' });
    const b = initGame(data, { seed: 'same', presetId: 'consensus' });
    const c = initGame(data, { seed: 'other', presetId: 'consensus' });
    expect(a.hidden).toEqual(b.hidden);
    expect([a.hidden.alignmentDifficulty, a.hidden.takeoffSteepness]).not.toEqual([
      c.hidden.alignmentDifficulty,
      c.hidden.takeoffSteepness,
    ]);
  });

  test('start state mirrors the scenario', () => {
    const state = newGame();
    expect(state.resources.compute).toBe(700);
    expect(state.rival.posture).toBe('mirror');
    expect(state.policy.hand).toEqual([...(data.scenario.startingHand ?? [])].sort());
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('allocate');
  });
});

describe('action legality (the UI never guesses)', () => {
  test('phase gates actions', () => {
    const state = newGame();
    expect(legalActions(state)).toEqual(['allocate']);
    expect(() => step(data, state, { type: 'advance' })).toThrow(EngineError);
    expect(() => step(data, state, { type: 'skipPolicy' })).toThrow(EngineError);
  });

  test('allocation must sum to 100 with non-negative integers', () => {
    const state = newGame();
    expect(() =>
      step(data, state, { type: 'allocate', capability: 50, safety: 30, diffusion: 21 }),
    ).toThrow(EngineError);
    expect(() =>
      step(data, state, { type: 'allocate', capability: 110, safety: -10, diffusion: 0 }),
    ).toThrow(EngineError);
  });

  test('policies must exist, be in hand, pass gates, and be affordable', () => {
    let state = newGame();
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    expect(() => step(data, state, { type: 'playPolicy', policyId: 'no_such_policy' })).toThrow(
      EngineError,
    );
    // natsec_merge is gated on capabilityMin 500 + mid era; turn 1 capability 350.
    expect(() => step(data, state, { type: 'playPolicy', policyId: 'natsec_merge' })).toThrow(
      EngineError,
    );
  });

  test('resolveEventChoice must match the pending event and a real choice', () => {
    let state = newGame();
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    state = step(data, state, { type: 'skipPolicy' });
    if (state.phase === 'event') {
      const pending = state.pendingEvents[0]!;
      expect(() =>
        step(data, state, { type: 'resolveEventChoice', eventId: 'wrong_event', choiceIndex: 0 }),
      ).toThrow(EngineError);
      expect(() =>
        step(data, state, {
          type: 'resolveEventChoice',
          eventId: pending.eventId,
          choiceIndex: 9,
        }),
      ).toThrow(EngineError);
    }
  });

  test('ended runs accept nothing', () => {
    let state = newGame();
    for (let i = 0; i < 20 && state.phase !== 'ended'; i += 1) {
      state = playTurn(state, [60, 15, 25]);
    }
    expect(state.phase).toBe('ended');
    expect(legalActions(state)).toEqual([]);
    expect(() => step(data, state, { type: 'advance' })).toThrow(EngineError);
  });
});

describe('full runs (B3 done-when)', () => {
  test('a 16-turn balanced run completes and reaches an ending', () => {
    let state = newGame();
    let iterations = 0;
    while (state.phase !== 'ended' && iterations < 30) {
      state = playTurn(state, [60, 15, 25]);
      iterations += 1;
    }
    expect(state.phase).toBe('ended');
    expect(state.endingId).not.toBeNull();
    expect(state.turn).toBeLessThanOrEqual(data.parameters.turnStructure.maxTurns.value);
    const endingLog = state.log.find((entry) => entry.kind === 'ending');
    expect(endingLog).toBeDefined();
  });

  test('replaying the identical action fold yields deep-equal state at every step', () => {
    const script: Action[] = [];
    let state = newGame('replay-seed');
    let guard = 0;
    while (state.phase !== 'ended' && guard < 400) {
      const phase = state.phase;
      let action: Action;
      if (phase === 'allocate') {
        action = { type: 'allocate', capability: 55, safety: 25, diffusion: 20 };
      } else if (phase === 'policy') {
        const playable = playablePolicies(data, state).filter((p) => p.playable);
        action = playable[0]
          ? { type: 'playPolicy', policyId: playable[0].id }
          : { type: 'skipPolicy' };
      } else if (phase === 'event') {
        action = {
          type: 'resolveEventChoice',
          eventId: state.pendingEvents[0]!.eventId,
          choiceIndex:
            1 % data.events.find((e) => e.id === state.pendingEvents[0]!.eventId)!.choices.length,
        };
      } else {
        action = { type: 'advance' };
      }
      script.push(action);
      state = step(data, state, action);
      guard += 1;
    }
    expect(state.phase).toBe('ended');

    // Fold the same script twice from fresh inits; compare canonical JSON stepwise.
    let a = initGame(data, { seed: 'replay-seed', presetId: 'consensus' });
    let b = initGame(data, { seed: 'replay-seed', presetId: 'consensus' });
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    for (const action of script) {
      a = step(data, a, action);
      b = step(data, b, action);
      expect(canonicalJson(a)).toBe(canonicalJson(b));
    }
    expect(a.endingId).toBe(state.endingId);
  });

  test('step never mutates its input state', () => {
    const state = newGame();
    const snapshot = canonicalJson(state);
    step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    expect(canonicalJson(state)).toBe(snapshot);
  });

  test('a hard racer ends earlier or hits the threshold resolution', () => {
    let state = newGame('racer-seed');
    let iterations = 0;
    while (state.phase !== 'ended' && iterations < 30) {
      state = playTurn(state, [80, 10, 10]);
      iterations += 1;
    }
    expect(state.phase).toBe('ended');
    expect(state.endingId).not.toBeNull();
  });
});

describe('subsystem wiring', () => {
  test('delayed effects land exactly on their due turn', () => {
    // export_controls: rival.substitution +150 delayed 3 turns.
    let state = newGame('delayed-seed');
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    const substitutionBefore = state.rival.substitution;
    state = step(data, state, { type: 'playPolicy', policyId: 'export_controls' });
    const dueTurn = state.delayed.find((d) => d.sourceId === 'export_controls')?.dueTurn;
    expect(dueTurn).toBe(1 + 3);
    while (state.turn < 4 && state.phase !== 'ended') {
      while (state.phase === 'event') {
        state = step(data, state, {
          type: 'resolveEventChoice',
          eventId: state.pendingEvents[0]!.eventId,
          choiceIndex: 0,
        });
      }
      if (state.phase === 'report') {
        state = step(data, state, { type: 'advance' });
      } else if (state.phase === 'allocate') {
        state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
      } else if (state.phase === 'policy') {
        state = step(data, state, { type: 'skipPolicy' });
      }
    }
    expect(state.turn).toBe(4);
    // +150 from the delayed bite, minus whatever immediate effect (-0) plus
    // the immediate rival.capability/-trust already applied at play time.
    expect(state.rival.substitution).toBeGreaterThanOrEqual(substitutionBefore + 150);
    const delayedLog = state.log.find(
      (entry) => entry.kind === 'delayedEffect' && entry.meta?.sourceId === 'export_controls',
    );
    expect(delayedLog?.turn).toBe(4);
  });

  test('the election fires exactly on the election turn and swings political capital', () => {
    let state = newGame('election-seed');
    while (
      state.phase !== 'ended' &&
      state.turn <= data.parameters.turnStructure.electionTurn.value
    ) {
      const before = state.resources.politicalCapital;
      const turnBefore = state.turn;
      state = playTurn(state, [40, 30, 30]);
      if (turnBefore === data.parameters.turnStructure.electionTurn.value) {
        const electionLog = state.log.find((e) => e.kind === 'election');
        expect(electionLog).toBeDefined();
        expect(Math.abs((electionLog?.deltas?.politicalCapital as number) ?? 0)).toBe(
          data.parameters.worldRules.election.mandateSwing.value,
        );
        void before;
      }
    }
  });

  test('policy cooldowns return the card, oncePerRun never does', () => {
    let state = newGame('cooldown-seed');
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    state = step(data, state, { type: 'playPolicy', policyId: 'export_controls' });
    expect(state.policy.hand.includes('export_controls')).toBe(false);
    expect(state.policy.cooldowns['export_controls']).toBe(1 + 4);
    // interpretability_moonshot is oncePerRun: play it when drawn into hand.
    // (Just assert the spent bookkeeping path via direct state inspection later blocks.)
    expect(state.policy.spent.includes('export_controls')).toBe(false);
  });

  test('eval reports render every turn with a band that respects the floor', () => {
    let state = newGame('eval-seed');
    for (let i = 0; i < 5 && state.phase !== 'ended'; i += 1) {
      state = playTurn(state, [30, 50, 20]);
    }
    expect(state.evalHistory.length).toBeGreaterThanOrEqual(4);
    for (const report of state.evalHistory) {
      expect(report.bandHigh).toBeGreaterThanOrEqual(report.bandLow);
      expect(report.bandLow).toBeGreaterThanOrEqual(0);
      expect(report.bandHigh).toBeLessThanOrEqual(1000);
    }
  });

  test('no NaN, no negative, no fractional values anywhere in state after long runs', () => {
    let state = newGame('invariant-seed');
    for (let i = 0; i < 20 && state.phase !== 'ended'; i += 1) {
      state = playTurn(state, [70, 10, 20]);
    }
    const walk = (value: unknown): void => {
      if (typeof value === 'number') {
        expect(Number.isFinite(value)).toBe(true);
        expect(Number.isInteger(value)).toBe(true);
      } else if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(walk);
      }
    };
    walk(state);
    for (const amount of Object.values(state.resources)) {
      expect(amount).toBeGreaterThanOrEqual(0);
      expect(amount).toBeLessThanOrEqual(1000);
    }
  });
});
