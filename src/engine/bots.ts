/**
 * Policy bots: tiny scripted strategies that drive full runs headlessly.
 * Used by the balance harness (scripts/simulate.ts), the ending-reachability
 * batches, and tests. Bots are DRIVERS, not part of the sim: each gets its
 * own seeded stream derived from (seed, name), never state.rng.
 *
 * Wave 3: a bot drives ONE seat. runBot drives the player seat with a bot
 * and the other seat with the scripted china policy (the shipped solo mode);
 * runMatch drives both seats with named bots (the hotseat balance grid).
 */
import { scriptedSeatDecide } from './china-policy';
import type { EngineData } from './data';
import { initStream, nextInt, type RngStreamState } from './rng';
import { playablePolicies, step } from './step';
import type { Action, GameState, PlayableSeatId } from './types';

export const BOT_IDS = ['racer', 'steward', 'dove', 'hedger', 'chaos'] as const;
export type BotId = (typeof BOT_IDS)[number];

export interface BotContext {
  data: EngineData;
  state: GameState;
  seat: PlayableSeatId;
  rng: RngStreamState;
}

export interface BotDecision {
  action: Action;
  rng: RngStreamState;
}

/**
 * Score a card's choices by weighted effect deltas (immediate + delayed
 * together: bites count). Deterministic; ties go to the earlier choice.
 */
function bestChoice(
  card: {
    choices: Array<{
      effects?: Record<string, unknown> | undefined;
      delayedEffects?: Array<{ effects: Record<string, unknown> }> | undefined;
    }>;
  },
  weights: Record<string, number>,
): number {
  let best = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  card.choices.forEach((choice, index) => {
    let score = 0;
    const tally = (effects: Record<string, unknown> | undefined): void => {
      for (const [key, value] of Object.entries(effects ?? {})) {
        if (typeof value === 'number' && weights[key] !== undefined) {
          score += value * weights[key];
        }
      }
    };
    tally(choice.effects);
    for (const delayed of choice.delayedEffects ?? []) {
      tally(delayed.effects);
    }
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

function preferPolicy(context: BotContext, preferences: string[]): Action {
  const playable = playablePolicies(context.data, context.state, context.seat)
    .filter((p) => p.playable)
    .map((p) => p.id);
  for (const id of preferences) {
    if (playable.includes(id)) {
      return { type: 'playPolicy', policyId: id, seat: context.seat };
    }
  }
  return { type: 'skipPolicy', seat: context.seat };
}

/** One decision for a named bot on a given seat (exported for harnesses). */
export function botDecide(bot: BotId, context: BotContext): BotDecision {
  const { state, seat, rng } = context;
  const seatState = state.seats[seat];
  switch (state.phase) {
    case 'allocate': {
      // A forced pause (incident fallout) caps the capability share; every
      // bot complies rather than crashing into the engine guard.
      const paused = seatState.flags.includes('forcedPause');
      if (bot === 'racer') {
        const action: Action = paused
          ? { type: 'allocate', capability: 30, safety: 40, diffusion: 30, seat }
          : { type: 'allocate', capability: 80, safety: 10, diffusion: 10, seat };
        return { action, rng };
      }
      if (bot === 'steward') {
        // The taught strategy: push the frontier AND pay for alignment.
        const action: Action = paused
          ? { type: 'allocate', capability: 30, safety: 45, diffusion: 25, seat }
          : { type: 'allocate', capability: 65, safety: 25, diffusion: 10, seat };
        return { action, rng };
      }
      if (bot === 'dove') {
        return {
          action: { type: 'allocate', capability: 20, safety: 50, diffusion: 30, seat },
          rng,
        };
      }
      if (bot === 'hedger') {
        const action: Action = paused
          ? { type: 'allocate', capability: 30, safety: 35, diffusion: 35, seat }
          : { type: 'allocate', capability: 50, safety: 25, diffusion: 25, seat };
        return { action, rng };
      }
      const bound = paused ? 4 : 11;
      const [a, r1] = nextInt(rng, bound);
      const [b, r2] = nextInt(r1, 11 - a);
      const capability = a * 10;
      const safety = b * 10;
      return {
        action: {
          type: 'allocate',
          capability,
          safety,
          diffusion: 100 - capability - safety,
          seat,
        },
        rng: r2,
      };
    }
    case 'policy': {
      if (bot === 'racer') {
        return {
          action: preferPolicy(context, [
            'natsec_merge',
            'chip_subsidies',
            'export_controls',
            'energy_buildout',
          ]),
          rng,
        };
      }
      if (bot === 'steward') {
        return {
          action: preferPolicy(context, [
            'interpretability_moonshot',
            'eval_mandate',
            'chip_subsidies',
            'energy_buildout',
          ]),
          rng,
        };
      }
      if (bot === 'dove') {
        return {
          action: preferPolicy(context, [
            'compute_treaty_feeler',
            'interpretability_moonshot',
            'ubi_pilot',
            'open_weights_release',
          ]),
          rng,
        };
      }
      if (bot === 'hedger') {
        return {
          action: preferPolicy(context, [
            'energy_buildout',
            'interpretability_moonshot',
            'chip_subsidies',
            'compute_treaty_feeler',
          ]),
          rng,
        };
      }
      const playable = playablePolicies(context.data, state, seat).filter((p) => p.playable);
      if (playable.length === 0) {
        return { action: { type: 'skipPolicy', seat }, rng };
      }
      const [index, r1] = nextInt(rng, playable.length + 1);
      const chosen = playable[index];
      return {
        action: chosen
          ? { type: 'playPolicy', policyId: chosen.id, seat }
          : { type: 'skipPolicy', seat },
        rng: r1,
      };
    }
    case 'event': {
      const pending = seatState.pendingEvents[0]!;
      const card = context.data.events.find((e) => e.id === pending.eventId)!;
      if (card.kind === 'wildcard') {
        throw new Error(`wildcard '${card.id}' cannot be a pending memo`);
      }
      let choiceIndex: number;
      let nextRng = rng;
      if (bot === 'racer') {
        choiceIndex = bestChoice(card, { capability: 3, compute: 1, 'rival.capability': -1 });
      } else if (bot === 'steward') {
        choiceIndex = bestChoice(card, {
          capability: 2,
          safetyInsight: 2,
          publicTrust: 1,
          'society.unrest': -1,
        });
      } else if (bot === 'dove') {
        choiceIndex = bestChoice(card, {
          'rival.trust': 3,
          publicTrust: 2,
          safetyInsight: 1,
          'society.unrest': -2,
        });
      } else if (bot === 'hedger') {
        choiceIndex = state.turn % card.choices.length;
      } else {
        const [i, r1] = nextInt(rng, card.choices.length);
        choiceIndex = i;
        nextRng = r1;
      }
      return {
        action: { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex, seat },
        rng: nextRng,
      };
    }
    case 'report':
      return { action: { type: 'advance' }, rng };
    default:
      throw new Error(`bot cannot act in phase '${state.phase}'`);
  }
}

export interface BotRunResult {
  endingId: NonNullable<GameState['endingId']>;
  turns: number;
  actions: Action[];
  finalState: GameState;
}

/**
 * Solo: the bot drives the player seat, the scripted china policy drives the
 * other seat (exactly what ships). Deterministic per (initial state, bot).
 */
export function runBot(
  data: EngineData,
  initial: GameState,
  bot: BotId,
  guard = 1200,
): BotRunResult {
  let state = initial;
  let botRng = initStream(`${initial.seed}::${bot}`, 'bot');
  const actions: Action[] = [];
  let steps = 0;
  while (state.phase !== 'ended') {
    if (steps >= guard) {
      throw new Error(`bot '${bot}' exceeded ${guard} steps without an ending`);
    }
    let action: Action;
    if (state.phase === 'report') {
      action = { type: 'advance' };
    } else if (state.actingSeat === state.playerSeat) {
      const decision = botDecide(bot, { data, state, seat: state.playerSeat, rng: botRng });
      botRng = decision.rng;
      action = decision.action;
    } else {
      action = scriptedSeatDecide(data, state);
    }
    actions.push(action);
    state = step(data, state, action);
    steps += 1;
  }
  return { endingId: state.endingId!, turns: state.turn, actions, finalState: state };
}

/** Hotseat balance: named bots on BOTH seats (the bot-vs-bot matrix). */
export function runMatch(
  data: EngineData,
  initial: GameState,
  botUsa: BotId,
  botChina: BotId,
  guard = 1200,
): BotRunResult {
  let state = initial;
  let usaRng = initStream(`${initial.seed}::usa::${botUsa}`, 'bot');
  let chinaRng = initStream(`${initial.seed}::china::${botChina}`, 'bot');
  const actions: Action[] = [];
  let steps = 0;
  while (state.phase !== 'ended') {
    if (steps >= guard) {
      throw new Error(`match ${botUsa}/${botChina} exceeded ${guard} steps`);
    }
    let action: Action;
    if (state.phase === 'report') {
      action = { type: 'advance' };
    } else if (state.actingSeat === 'usa') {
      const decision = botDecide(botUsa, { data, state, seat: 'usa', rng: usaRng });
      usaRng = decision.rng;
      action = decision.action;
    } else {
      const decision = botDecide(botChina, { data, state, seat: 'china', rng: chinaRng });
      chinaRng = decision.rng;
      action = decision.action;
    }
    actions.push(action);
    state = step(data, state, action);
    steps += 1;
  }
  return { endingId: state.endingId!, turns: state.turn, actions, finalState: state };
}
