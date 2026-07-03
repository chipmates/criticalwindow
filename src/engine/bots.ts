/**
 * Policy bots: tiny scripted strategies that drive full runs headlessly.
 * Used by the balance harness (scripts/simulate.ts), the ending-reachability
 * batches, and tests. Bots are DRIVERS, not part of the sim: the chaos bot
 * gets its own seeded stream derived from (seed, 'bot'), never state.rng.
 */
import type { EngineData } from './data';
import { initStream, nextInt, type RngStreamState } from './rng';
import { playablePolicies, step } from './step';
import type { Action, GameState } from './types';

export const BOT_IDS = ['racer', 'dove', 'hedger', 'chaos'] as const;
export type BotId = (typeof BOT_IDS)[number];

interface BotContext {
  data: EngineData;
  state: GameState;
  rng: RngStreamState;
}

interface BotDecision {
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
  const playable = playablePolicies(context.data, context.state)
    .filter((p) => p.playable)
    .map((p) => p.id);
  for (const id of preferences) {
    if (playable.includes(id)) {
      return { type: 'playPolicy', policyId: id };
    }
  }
  return { type: 'skipPolicy' };
}

function decide(bot: BotId, context: BotContext): BotDecision {
  const { state, rng } = context;
  switch (state.phase) {
    case 'allocate': {
      if (bot === 'racer') {
        return { action: { type: 'allocate', capability: 80, safety: 10, diffusion: 10 }, rng };
      }
      if (bot === 'dove') {
        return { action: { type: 'allocate', capability: 20, safety: 50, diffusion: 30 }, rng };
      }
      if (bot === 'hedger') {
        return { action: { type: 'allocate', capability: 50, safety: 25, diffusion: 25 }, rng };
      }
      const [a, r1] = nextInt(rng, 11);
      const [b, r2] = nextInt(r1, 11 - a);
      const capability = a * 10;
      const safety = b * 10;
      return {
        action: { type: 'allocate', capability, safety, diffusion: 100 - capability - safety },
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
      const playable = playablePolicies(context.data, context.state).filter((p) => p.playable);
      if (playable.length === 0) {
        return { action: { type: 'skipPolicy' }, rng };
      }
      const [index, r1] = nextInt(rng, playable.length + 1);
      const chosen = playable[index];
      return {
        action: chosen ? { type: 'playPolicy', policyId: chosen.id } : { type: 'skipPolicy' },
        rng: r1,
      };
    }
    case 'event': {
      const pending = state.pendingEvents[0]!;
      const card = context.data.events.find((e) => e.id === pending.eventId)!;
      let choiceIndex: number;
      let nextRng = rng;
      if (bot === 'racer') {
        choiceIndex = bestChoice(card, { capability: 3, compute: 1, 'rival.capability': -1 });
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
        action: { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex },
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

/** Drive a run to its ending. Deterministic per (initial state, bot, seed). */
export function runBot(
  data: EngineData,
  initial: GameState,
  bot: BotId,
  guard = 600,
): BotRunResult {
  let state = initial;
  let rng = initStream(`${initial.seed}::${bot}`, 'bot');
  const actions: Action[] = [];
  let steps = 0;
  while (state.phase !== 'ended') {
    if (steps >= guard) {
      throw new Error(`bot '${bot}' exceeded ${guard} steps without an ending`);
    }
    const decision = decide(bot, { data, state, rng });
    rng = decision.rng;
    actions.push(decision.action);
    state = step(data, state, decision.action);
    steps += 1;
  }
  return { endingId: state.endingId!, turns: state.turn, actions, finalState: state };
}
