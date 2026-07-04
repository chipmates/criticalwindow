/**
 * Debrief probes: pure functions over a finished run that find the moments
 * the debrief screen cites ("the treaty window was open on turn 7").
 *
 * Because the engine is a deterministic fold, a probe can replay the save
 * and inspect EVERY intermediate state exactly. Counterfactuals are exact
 * here, not heuristic.
 */
import type { EngineData } from './data';
import { initGame } from './init';
import { step } from './step';
import type { Action, GameMode, GameState, PlayableSeatId } from './types';

export interface ReplayOptions {
  seed: string;
  presetId: GameState['presetId'];
  mode: GameMode;
  playerSeat: PlayableSeatId;
}

export interface TurnSnapshot {
  turn: number;
  state: GameState;
}

/** Replay a run and keep the state at the END of each turn (report phase). */
export function replayTurns(
  data: EngineData,
  options: ReplayOptions,
  actions: Action[],
): TurnSnapshot[] {
  let state = initGame(data, options);
  const snapshots: TurnSnapshot[] = [];
  let lastTurnRecorded = 0;
  for (const action of actions) {
    state = step(data, state, action);
    const atTurnEnd = state.phase === 'report' || state.phase === 'ended';
    if (atTurnEnd && state.turn > lastTurnRecorded) {
      snapshots.push({ turn: state.turn, state });
      lastTurnRecorded = state.turn;
    }
  }
  return snapshots;
}

export interface ProbeResult {
  /** Turns (1-based) where the probe fired. Empty = did not apply to this run. */
  turns: number[];
  /** One number per fired turn as supporting evidence (probe-specific meaning). */
  evidence: number[];
}

/**
 * The treaty window: turns where the verified-slowdown path was available
 * (channel open, rival trust at signing level). Includes the turn it was
 * taken, if it was; the debrief distinguishes taken from missed by whether
 * the run ended in negotiatedSlowdown. Empty result = the window never
 * opened, which is its own honest debrief line.
 */
export function treatyWindowOpen(data: EngineData, snapshots: TurnSnapshot[]): ProbeResult {
  const min = data.parameters.thresholds.treatyTrustMin.value;
  const turns: number[] = [];
  const evidence: number[] = [];
  for (const { turn, state } of snapshots) {
    if (state.world.flags.includes('treatyChannel') && state.world.bilateralTrust >= min) {
      turns.push(turn);
      evidence.push(state.world.bilateralTrust);
    }
  }
  return { turns, evidence };
}

/**
 * Safety underinvestment: turns where the player pushed capability hard
 * (allocation >= 60) while the eval band was still wide (> 300): racing
 * blind, the exact gamble takeaway 2 is about.
 */
export function safetyUnderinvestment(_data: EngineData, snapshots: TurnSnapshot[]): ProbeResult {
  const turns: number[] = [];
  const evidence: number[] = [];
  for (const { turn, state } of snapshots) {
    const player = state.seats[state.playerSeat];
    const report = player.evalHistory[player.evalHistory.length - 1];
    if (!report) {
      continue;
    }
    const bandWidth = report.bandHigh - report.bandLow;
    if (player.allocation.capability >= 60 && bandWidth > 300) {
      turns.push(turn);
      evidence.push(bandWidth);
    }
  }
  return { turns, evidence };
}

/**
 * Society neglect: turns where unrest had risen versus the previous turn
 * while diffusion allocation stayed under 20: the social clock ticking
 * while the budget looked away.
 */
export function societyNeglect(_data: EngineData, snapshots: TurnSnapshot[]): ProbeResult {
  const turns: number[] = [];
  const evidence: number[] = [];
  for (let i = 1; i < snapshots.length; i += 1) {
    const prev = snapshots[i - 1]!;
    const current = snapshots[i]!;
    const prevPlayer = prev.state.seats[prev.state.playerSeat];
    const currentPlayer = current.state.seats[current.state.playerSeat];
    if (
      currentPlayer.society.unrest > prevPlayer.society.unrest &&
      currentPlayer.allocation.diffusion < 20
    ) {
      turns.push(current.turn);
      evidence.push(currentPlayer.society.unrest);
    }
  }
  return { turns, evidence };
}

/**
 * Warning shots: the turns incidents fired, with evidence 1 when the NEXT
 * turn's allocation stayed racing-heavy (capability >= 60) anyway. The
 * observed pattern across 43 real AI-race wargames: act early, go
 * complacent, reengage only after the shot (SRC-SIM-GAMING-INSIGHTS).
 */
export function warningShots(_data: EngineData, snapshots: TurnSnapshot[]): ProbeResult {
  const last = snapshots[snapshots.length - 1];
  if (!last) {
    return { turns: [], evidence: [] };
  }
  const turns: number[] = [];
  const evidence: number[] = [];
  const playerSeat = last.state.playerSeat;
  for (const entry of last.state.log) {
    if (entry.kind !== 'incident' || entry.seat !== playerSeat) {
      continue;
    }
    const after = snapshots.find((s) => s.turn === entry.turn + 1);
    turns.push(entry.turn);
    evidence.push(after && after.state.seats[playerSeat].allocation.capability >= 60 ? 1 : 0);
  }
  return { turns, evidence };
}

export interface DebriefProbes {
  treatyWindowOpen: ProbeResult;
  safetyUnderinvestment: ProbeResult;
  societyNeglect: ProbeResult;
  warningShots: ProbeResult;
}

/** Everything the debrief needs, from one replay. */
export function runProbes(
  data: EngineData,
  options: ReplayOptions,
  actions: Action[],
): DebriefProbes {
  const snapshots = replayTurns(data, options, actions);
  return {
    treatyWindowOpen: treatyWindowOpen(data, snapshots),
    safetyUnderinvestment: safetyUnderinvestment(data, snapshots),
    societyNeglect: societyNeglect(data, snapshots),
    warningShots: warningShots(data, snapshots),
  };
}
