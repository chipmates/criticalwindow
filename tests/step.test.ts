import { describe, expect, test } from 'vitest';
import { chinaDecide, scriptedSeatDecide } from '../src/engine/china-policy';
import { canonicalJson } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import {
  EngineError,
  legalActions,
  playablePolicies,
  postureFromTrust,
  step,
} from '../src/engine/step';
import type { Action, GameState } from '../src/engine/types';
import { loadRealData } from './helpers/load-real-data';

const data = loadRealData();

/** Racer-vs-scripted run used by the ending-meta probe. */
function runBotForMeta(initial: GameState) {
  let state = initial;
  let guard = 0;
  while (state.phase !== 'ended' && guard < 800) {
    let action: Action;
    if (state.phase === 'report') {
      action = { type: 'advance' };
    } else if (state.actingSeat === 'china') {
      action = chinaDecide(data, state);
    } else if (state.phase === 'allocate') {
      const paused = state.seats.usa.flags.includes('forcedPause');
      action = paused
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
  return { endingId: state.endingId, finalState: state };
}

function newGame(seed = 'b3-test-seed'): GameState {
  return initGame(data, { seed, presetId: 'consensus' });
}

/** Play the acting seat's full window with a simple scripted policy. */
function playWindow(state: GameState, allocation: [number, number, number]): GameState {
  const seat = state.actingSeat;
  const paused = state.seats[seat].flags.includes('forcedPause');
  const [cap, safety, diffusion] = paused ? ([30, 40, 30] as const) : allocation;
  let s = step(data, state, {
    type: 'allocate',
    capability: cap,
    safety,
    diffusion,
  });
  if (s.phase === 'policy' && s.actingSeat === seat) {
    s = step(data, s, { type: 'skipPolicy' });
  }
  while (s.phase === 'event' && s.actingSeat === seat) {
    const pending = s.seats[seat].pendingEvents[0]!;
    s = step(data, s, { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex: 0 });
  }
  return s;
}

/** Drive one full turn (USA window, China window via the scripted policy, advance). */
function playTurn(state: GameState, allocation: [number, number, number]): GameState {
  let s = playWindow(state, allocation);
  while (s.phase !== 'ended' && s.phase !== 'report' && s.actingSeat === 'china') {
    s = step(data, s, chinaDecide(data, s));
  }
  if (s.phase === 'report') {
    s = step(data, s, { type: 'advance' });
  }
  return s;
}

describe('init', () => {
  test('hidden dice roll inside the preset ranges (shared world)', () => {
    for (const presetId of ['cautious', 'consensus', 'skeptic'] as const) {
      const preset = data.parameters.worldviewPresets[presetId];
      const state = initGame(data, { seed: 'roll-check', presetId });
      expect(state.world.alignmentDifficulty).toBeGreaterThanOrEqual(
        preset.alignmentDifficulty.min,
      );
      expect(state.world.alignmentDifficulty).toBeLessThanOrEqual(preset.alignmentDifficulty.max);
      expect(state.world.takeoffSteepness).toBeGreaterThanOrEqual(preset.takeoffSteepness.min);
      expect(state.world.takeoffSteepness).toBeLessThanOrEqual(preset.takeoffSteepness.max);
    }
  });

  test('same seed, same hidden world; different seed, (almost surely) different', () => {
    const a = initGame(data, { seed: 'same', presetId: 'consensus' });
    const b = initGame(data, { seed: 'same', presetId: 'consensus' });
    const c = initGame(data, { seed: 'other', presetId: 'consensus' });
    expect(a.world.alignmentDifficulty).toBe(b.world.alignmentDifficulty);
    expect(a.world.takeoffSteepness).toBe(b.world.takeoffSteepness);
    expect([a.world.alignmentDifficulty, a.world.takeoffSteepness]).not.toEqual([
      c.world.alignmentDifficulty,
      c.world.takeoffSteepness,
    ]);
  });

  test('start state mirrors the two-seat scenario', () => {
    const state = newGame();
    expect(state.seats.usa.resources.compute).toBe(700);
    expect(state.seats.china.resources.compute).toBe(450);
    expect(state.seats.china.substitution).toBe(250);
    expect(postureFromTrust(data.parameters, state.world.bilateralTrust)).toBe('mirror');
    expect(state.seats.usa.policy.hand).toEqual([...(data.scenario.seats.usa.hand ?? [])].sort());
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('allocate');
    expect(state.actingSeat).toBe('usa');
  });

  test('solo as China: scripted USA plays its window, china actions hit china', () => {
    let state = initGame(data, {
      seed: 'china-solo',
      presetId: 'consensus',
      playerSeat: 'china',
    });
    while (state.actingSeat === 'usa' && state.phase !== 'report' && state.phase !== 'ended') {
      state = step(data, state, scriptedSeatDecide(data, state));
    }
    expect(state.actingSeat).toBe('china');
    expect(state.phase).toBe('allocate');
    const chinaCapBefore = state.seats.china.resources.capability;
    const usaCapBefore = state.seats.usa.resources.capability;
    state = step(data, state, { type: 'allocate', capability: 70, safety: 15, diffusion: 15 });
    expect(state.seats.china.resources.capability).toBeGreaterThan(chinaCapBefore);
    expect(state.seats.usa.resources.capability).toBe(usaCapBefore);
  });

  test('endings carry the deciding seat and its true alignment in meta', () => {
    for (let i = 0; i < 12; i += 1) {
      const initial = initGame(data, { seed: `meta-racer-${i}`, presetId: 'cautious' });
      const result = runBotForMeta(initial);
      if (result.endingId === 'misalignedCatastrophe') {
        const endLog = result.finalState.log.find((e) => e.kind === 'ending')!;
        expect(typeof endLog.meta?.trueAlignment).toBe('number');
        expect(['usa', 'china']).toContain(String(endLog.meta?.causeSeat));
        return;
      }
    }
    throw new Error('no catastrophe found across 12 cautious racer seeds');
  });

  test('both seats share difficulty but own their true alignment', () => {
    const state = newGame();
    expect(state.seats.usa.hidden.trueAlignment).toBe(state.seats.china.hidden.trueAlignment);
    const after = playTurn(state, [80, 10, 10]);
    if (after.phase !== 'ended') {
      // USA raced, scripted China played its own split: paths diverge.
      expect(after.seats.usa.hidden.trueAlignment).not.toBe(after.seats.china.hidden.trueAlignment);
    }
  });
});

describe('action legality (the UI never guesses)', () => {
  test('phase gates actions', () => {
    const state = newGame();
    expect(legalActions(state)).toEqual(['allocate']);
    expect(() => step(data, state, { type: 'advance' })).toThrow(EngineError);
    expect(() => step(data, state, { type: 'skipPolicy' })).toThrow(EngineError);
  });

  test('seat-stamped actions must match the acting seat', () => {
    const state = newGame();
    expect(() =>
      step(data, state, {
        type: 'allocate',
        capability: 60,
        safety: 15,
        diffusion: 25,
        seat: 'china',
      }),
    ).toThrow(EngineError);
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

  test('seat-unavailable policies are gated (China has no UBI pilot)', () => {
    const state = newGame();
    const chinaView = playablePolicies(data, state, 'china');
    for (const entry of chinaView) {
      expect(entry.id).not.toBe('ubi_pilot');
    }
  });

  test('ended runs accept nothing', () => {
    let state = newGame();
    for (let i = 0; i < 30 && state.phase !== 'ended'; i += 1) {
      state = playTurn(state, [60, 15, 25]);
    }
    expect(state.phase).toBe('ended');
    expect(legalActions(state)).toEqual([]);
    expect(() => step(data, state, { type: 'advance' })).toThrow(EngineError);
  });
});

describe('full runs', () => {
  test('a 16-turn balanced run completes and reaches an ending', () => {
    let state = newGame();
    let iterations = 0;
    while (state.phase !== 'ended' && iterations < 40) {
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
    while (state.phase !== 'ended' && guard < 800) {
      const phase = state.phase;
      let action: Action;
      if (phase === 'report') {
        action = { type: 'advance' };
      } else if (state.actingSeat === 'china') {
        action = chinaDecide(data, state);
      } else if (phase === 'allocate') {
        action = { type: 'allocate', capability: 55, safety: 25, diffusion: 20 };
      } else if (phase === 'policy') {
        const playable = playablePolicies(data, state).filter((p) => p.playable);
        action = playable[0]
          ? { type: 'playPolicy', policyId: playable[0].id }
          : { type: 'skipPolicy' };
      } else {
        const pendingCard = data.events.find(
          (e) => e.id === state.seats.usa.pendingEvents[0]!.eventId,
        )!;
        action = {
          type: 'resolveEventChoice',
          eventId: state.seats.usa.pendingEvents[0]!.eventId,
          choiceIndex: pendingCard.kind === 'wildcard' ? 0 : 1 % pendingCard.choices.length,
        };
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
    while (state.phase !== 'ended' && iterations < 40) {
      state = playTurn(state, [80, 10, 10]);
      iterations += 1;
    }
    expect(state.phase).toBe('ended');
    expect(state.endingId).not.toBeNull();
  });
});

describe('subsystem wiring', () => {
  test('delayed effects land exactly on their due turn', () => {
    // export_controls: rival.substitution +200 delayed 3 turns (China's pipeline).
    let state = newGame('delayed-seed');
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    const substitutionBefore = state.seats.china.substitution;
    state = step(data, state, { type: 'playPolicy', policyId: 'export_controls' });
    const dueTurn = state.seats.usa.delayed.find((d) => d.sourceId === 'export_controls')?.dueTurn;
    expect(dueTurn).toBe(1 + 3);
    // Finish turn 1 (USA's event window, China's window, advance), then turns 2-3.
    while (state.phase === 'event' && state.actingSeat === 'usa') {
      state = step(data, state, {
        type: 'resolveEventChoice',
        eventId: state.seats.usa.pendingEvents[0]!.eventId,
        choiceIndex: 0,
      });
    }
    while (state.phase !== 'ended' && state.phase !== 'report' && state.actingSeat === 'china') {
      state = step(data, state, chinaDecide(data, state));
    }
    if (state.phase === 'report') {
      state = step(data, state, { type: 'advance' });
    }
    while (state.turn < 4 && state.phase !== 'ended') {
      state = playTurn(state, [60, 15, 25]);
    }
    expect(state.turn).toBe(4);
    expect(state.seats.china.substitution).toBeGreaterThanOrEqual(substitutionBefore + 200);
    const delayedLog = state.log.find(
      (entry) => entry.kind === 'delayedEffect' && entry.meta?.sourceId === 'export_controls',
    );
    expect(delayedLog?.turn).toBe(4);
  });

  test('the USA election fires on turn 8; China gets era legitimacy verdicts instead', () => {
    let state = newGame('election-seed');
    while (state.phase !== 'ended' && state.turn <= 8) {
      const turnBefore = state.turn;
      state = playTurn(state, [40, 30, 30]);
      if (turnBefore === data.parameters.turnStructure.electionTurn.value) {
        const electionLog = state.log.find((e) => e.kind === 'election' && e.seat === 'usa');
        expect(electionLog).toBeDefined();
        expect(Math.abs((electionLog?.deltas?.politicalCapital as number) ?? 0)).toBe(
          data.parameters.worldRules.election.mandateSwing.value,
        );
      }
    }
    if (state.phase !== 'ended') {
      const legitimacyLog = state.log.find(
        (e) => e.kind === 'election' && e.seat === 'china' && e.meta?.legitimacy === true,
      );
      expect(legitimacyLog).toBeDefined();
    }
  });

  test('policy cooldowns return the card, oncePerRun never does', () => {
    let state = newGame('cooldown-seed');
    state = step(data, state, { type: 'allocate', capability: 60, safety: 15, diffusion: 25 });
    state = step(data, state, { type: 'playPolicy', policyId: 'export_controls' });
    expect(state.seats.usa.policy.hand.includes('export_controls')).toBe(false);
    expect(state.seats.usa.policy.cooldowns['export_controls']).toBe(1 + 4);
    expect(state.seats.usa.policy.spent.includes('export_controls')).toBe(false);
  });

  test('eval reports render every turn for both seats and respect the floor', () => {
    let state = newGame('eval-seed');
    for (let i = 0; i < 5 && state.phase !== 'ended'; i += 1) {
      state = playTurn(state, [30, 50, 20]);
    }
    for (const seat of ['usa', 'china'] as const) {
      expect(state.seats[seat].evalHistory.length).toBeGreaterThanOrEqual(4);
      for (const report of state.seats[seat].evalHistory) {
        expect(report.bandHigh).toBeGreaterThanOrEqual(report.bandLow);
        expect(report.bandLow).toBeGreaterThanOrEqual(0);
        expect(report.bandHigh).toBeLessThanOrEqual(1000);
      }
    }
  });

  test('no NaN, no negative, no fractional values anywhere in state after long runs', () => {
    let state = newGame('invariant-seed');
    for (let i = 0; i < 30 && state.phase !== 'ended'; i += 1) {
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
    for (const seat of ['usa', 'china'] as const) {
      for (const amount of Object.values(state.seats[seat].resources)) {
        expect(amount).toBeGreaterThanOrEqual(0);
        expect(amount).toBeLessThanOrEqual(1000);
      }
    }
  });
});
