/**
 * pnpm tsx scripts/model-playtest.ts -- [--runs N] [--preset id|all] [--policy scripted|llm]
 *                                       [--seed-prefix s] [--csv path]
 *
 * MODEL-PLAYTEST HARNESS (design-note §9) — SKELETON (P-D3). HELD until the Phase-3 gate.
 *
 * Purpose: let a policy (a scripted heuristic OR, later, an LLM) drive full runs through the
 * REAL engine to (a) discover exploits a scripted bot would miss, (b) measure difficulty for
 * smart-unscripted play, (c) tune toward target ending distributions. The GAME side stays
 * seeded/deterministic (engine purity); the POLICY is the explorer.
 *
 * This skeleton ships the plumbing and nothing that needs a key:
 *   - serializeView(): a compact, player-legible view (HIDDEN state is never exposed)
 *   - legalMoves():    the concrete legal options for the current phase
 *   - Policy interface: (view, legal) -> one Action
 *   - scriptedPolicy(): API-FREE default so `--policy scripted` runs end-to-end (the dry-run)
 *   - llmPolicy():     STUBBED. Reads ANTHROPIC_API_KEY at TOOLING TIME ONLY, never at runtime,
 *                      never shipped. The request is BUILT but not executed in the skeleton.
 *   - CSV columns match scripts/simulate.ts so downstream tooling is one format.
 *
 * Constitution guards honoured: no key in the repo; no network at game runtime; deterministic
 * engine; the scripted dry-run needs no key and no network at all.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadEngineData, type EngineData } from '../src/engine/data';
import { hashDataFiles } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { initStream, type RngStreamState } from '../src/engine/rng';
import { chinaDecide } from '../src/engine/china-policy';
import {
  eraForTurn,
  legalActions,
  playablePolicies,
  postureFromTrust,
  step,
} from '../src/engine/step';
import {
  WORLDVIEW_PRESET_IDS,
  type Action,
  type GameState,
  type WorldviewPresetId,
} from '../src/engine/types';
import { dataRoot, readDataFiles } from './lib/data-files';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : fallback;
}
const runsPerPreset = Math.max(1, Number.parseInt(arg('runs', '10'), 10));
const presetArg = arg('preset', 'consensus');
const policyName = arg('policy', 'scripted');
const seedPrefix = arg('seed-prefix', 'mp');
const csvPath = arg('csv', '');
const transcriptPath = arg('transcript', '');
const modelId = arg('model', 'claude-sonnet-5');
const presets: WorldviewPresetId[] =
  presetArg === 'all' ? [...WORLDVIEW_PRESET_IDS] : [presetArg as WorldviewPresetId];

// ---------------------------------------------------------------------------
// Content load (mirrors scripts/simulate.ts)
// ---------------------------------------------------------------------------

function loadData(): EngineData {
  const files = readDataFiles(dataRoot());
  const json = (rel: string): unknown =>
    JSON.parse(readFileSync(files.find((f) => f.relPath === rel)!.absPath, 'utf8'));
  return loadEngineData({
    dataVersion: hashDataFiles(files.map((f) => ({ path: f.relPath, content: f.content }))),
    parameters: json('parameters.json'),
    scenario: json('scenarios/scenario_2026.json'),
    incidents: json('incidents.json'),
    mandates: json('mandates.json'),
    seatsRules: json('seats.json'),
    events: files
      .filter((f) => f.relPath.startsWith('events/'))
      .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
    policies: files
      .filter((f) => f.relPath.startsWith('policies/'))
      .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
  });
}

// ---------------------------------------------------------------------------
// Serializer — the compact view a policy/model sees.
// HARD RULE: state.hidden (alignmentDifficulty, takeoffSteepness, trueAlignment,
// agencyErosion) is NEVER serialized. The policy plays under the same uncertainty
// as a human: only the banded eval report.
// ---------------------------------------------------------------------------

interface CompactView {
  turn: number;
  era: string;
  phase: string;
  seat: string;
  preset: string;
  resources: Record<string, number>;
  society: Record<string, number>;
  rival: { posture: string; capability: number };
  evalBand: { low: number; high: number } | null;
  allocation: { capability: number; safety: number; diffusion: number };
  flags: string[];
}

function serializeView(data: EngineData, state: GameState): CompactView {
  const seat = state.playerSeat;
  const me = state.seats[seat];
  const them = state.seats[seat === 'usa' ? 'china' : 'usa'];
  const lastEval = me.evalHistory[me.evalHistory.length - 1] ?? null;
  return {
    turn: state.turn,
    era: eraForTurn(data.parameters, state.turn),
    phase: state.phase,
    seat,
    preset: state.presetId,
    resources: { ...me.resources },
    society: { ...me.society },
    rival: {
      posture: postureFromTrust(data.parameters, state.world.bilateralTrust),
      capability: them.resources.capability,
    },
    evalBand: lastEval ? { low: lastEval.bandLow, high: lastEval.bandHigh } : null,
    allocation: { ...me.allocation },
    flags: [...state.world.flags, ...me.flags].sort(),
  };
}

// ---------------------------------------------------------------------------
// Legal moves — concrete options for the current phase (not just ActionType).
// ---------------------------------------------------------------------------

type LegalMoves =
  | { phase: 'allocate'; note: string }
  | { phase: 'policy'; playable: string[]; canSkip: true }
  | { phase: 'event'; eventId: string; choices: Array<{ index: number; label: string }> }
  | { phase: 'report'; advance: true }
  | { phase: 'ended' };

function legalMoves(data: EngineData, state: GameState): LegalMoves {
  const types = legalActions(state); // engine is source of truth for what's legal
  if (state.phase === 'allocate' && types.includes('allocate')) {
    return {
      phase: 'allocate',
      note: 'capability+safety+diffusion must equal 100 (multiples of 10)',
    };
  }
  if (state.phase === 'policy') {
    return {
      phase: 'policy',
      playable: playablePolicies(data, state)
        .filter((p) => p.playable)
        .map((p) => p.id),
      canSkip: true,
    };
  }
  if (state.phase === 'event') {
    const pending = state.seats[state.playerSeat].pendingEvents[0]!;
    const card = data.events.find((e) => e.id === pending.eventId)!;
    if (card.kind === 'wildcard') {
      throw new Error(`wildcard '${card.id}' cannot be a pending memo`);
    }
    return {
      phase: 'event',
      eventId: pending.eventId,
      choices: card.choices.map((c, index) => ({
        index,
        label: (c as { label?: string }).label ?? `choice ${index}`,
      })),
    };
  }
  if (state.phase === 'report') return { phase: 'report', advance: true };
  return { phase: 'ended' };
}

// ---------------------------------------------------------------------------
// Policy interface. Scripted policies are deterministic; the LLM policy is the
// non-deterministic explorer (engine stays seeded, so runs remain reproducible
// on the game side even when the policy varies).
// ---------------------------------------------------------------------------

interface PolicyContext {
  data: EngineData;
  state: GameState;
  rng: RngStreamState;
}
interface PolicyDecision {
  action: Action;
  rng: RngStreamState;
  /** Raw model output, when a model made the call (transcripts). */
  modelText?: string;
}
interface Policy {
  name: string;
  decide(
    view: CompactView,
    moves: LegalMoves,
    ctx: PolicyContext,
  ): PolicyDecision | Promise<PolicyDecision>;
}

/** API-FREE scripted policy: a steward-ish heuristic that exercises the full view->action path. */
function scriptedPolicy(): Policy {
  const SAFETY_PREF = [
    'interpretability_moonshot',
    'eval_mandate',
    'chip_subsidies',
    'energy_buildout',
  ];
  return {
    name: 'scripted',
    decide(view, moves, ctx) {
      const { rng } = ctx;
      if (moves.phase === 'allocate') {
        // Push the frontier AND pay for alignment (the taught 'steward' shape).
        return { action: { type: 'allocate', capability: 65, safety: 25, diffusion: 10 }, rng };
      }
      if (moves.phase === 'policy') {
        for (const id of SAFETY_PREF) {
          if (moves.playable.includes(id))
            return { action: { type: 'playPolicy', policyId: id }, rng };
        }
        return { action: { type: 'skipPolicy' }, rng };
      }
      if (moves.phase === 'event') {
        // Deterministic-but-varied: pick a choice by turn parity (placeholder heuristic).
        const index = view.turn % Math.max(1, moves.choices.length);
        return {
          action: { type: 'resolveEventChoice', eventId: moves.eventId, choiceIndex: index },
          rng,
        };
      }
      // report / fallback
      return { action: { type: 'advance' }, rng };
    },
  };
}

/**
 * LLM POLICY. Reads ANTHROPIC_API_KEY from env at TOOLING TIME ONLY (constitution: never
 * shipped, never called at game runtime; this script is a balance tool). The model plays
 * under the same fog as a human: serializeView() never exposes hidden state. Invalid or
 * unparseable replies get ONE retry with the error explained, then fall back to the
 * scripted heuristic so a sweep never dies mid-run.
 */
function llmPolicy(): Policy {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      '--policy llm needs ANTHROPIC_API_KEY in the environment (tooling time only). ' +
        'Use --policy scripted for the API-free dry-run.',
    );
  }
  const fallback = scriptedPolicy();

  async function ask(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error(`anthropic api ${response.status}: ${await response.text()}`);
    }
    const json = (await response.json()) as { content: Array<{ type: string; text?: string }> };
    return json.content.find((block) => block.type === 'text')?.text ?? '';
  }

  function parseAction(text: string, moves: LegalMoves): Action | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
    const action = parsed as Action;
    if (moves.phase === 'allocate' && action.type === 'allocate') {
      const { capability, safety, diffusion } = action;
      if (
        [capability, safety, diffusion].every((v) => Number.isInteger(v) && v >= 0) &&
        capability + safety + diffusion === 100
      ) {
        return action;
      }
      return null;
    }
    if (moves.phase === 'policy') {
      if (action.type === 'skipPolicy') return action;
      if (action.type === 'playPolicy' && moves.playable.includes(action.policyId)) return action;
      return null;
    }
    if (moves.phase === 'event' && action.type === 'resolveEventChoice') {
      if (
        action.eventId === moves.eventId &&
        moves.choices.some((c) => c.index === action.choiceIndex)
      ) {
        return action;
      }
      return null;
    }
    if (moves.phase === 'report' && action.type === 'advance') return action;
    return null;
  }

  function buildPrompt(view: CompactView, moves: LegalMoves, note: string): string {
    return [
      'You are playing one seat in a strategy game about the AI race. Play WELL: you want a',
      'good ending (flourishing or negotiated slowdown), not a fast one. Your eval band is the',
      'only alignment information you get, and it can flatter you.',
      note,
      `STATE: ${JSON.stringify(view)}`,
      `LEGAL MOVES: ${JSON.stringify(moves)}`,
      'Reply with ONE JSON action object and nothing else, e.g.',
      '{"type":"allocate","capability":60,"safety":30,"diffusion":10} or',
      '{"type":"playPolicy","policyId":"..."} or {"type":"skipPolicy"} or',
      '{"type":"resolveEventChoice","eventId":"...","choiceIndex":0} or {"type":"advance"}.',
      moves.phase === 'allocate' && view.flags.includes('forcedPause')
        ? 'NOTE: forced pause is active, capability share must be 30 or less.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return {
    name: 'llm',
    async decide(view, moves, ctx) {
      let text: string;
      try {
        text = await ask(buildPrompt(view, moves, ''));
        let action = parseAction(text, moves);
        if (!action) {
          text = await ask(
            buildPrompt(view, moves, 'Your previous reply was not a legal action. Try again.'),
          );
          action = parseAction(text, moves);
        }
        if (action) {
          return { action, rng: ctx.rng, modelText: text };
        }
      } catch (error) {
        text = `ERROR: ${String(error)}`;
      }
      const scripted = fallback.decide(view, moves, ctx) as PolicyDecision;
      return { ...scripted, modelText: `${text} [fell back to scripted]` };
    },
  };
}

function makePolicy(name: string): Policy {
  if (name === 'scripted') return scriptedPolicy();
  if (name === 'llm') return llmPolicy();
  throw new Error(`unknown policy '${name}' (use scripted|llm)`);
}

// ---------------------------------------------------------------------------
// Driver — mirrors runBot() but with a pluggable policy. The policy's own RNG
// is derived from (seed, policy-name), NEVER state.rng (engine-purity guard).
// ---------------------------------------------------------------------------

interface RunResult {
  endingId: NonNullable<GameState['endingId']>;
  turns: number;
  finalState: GameState;
  decisions: number;
}

interface TranscriptLine {
  seed: string;
  turn: number;
  phase: string;
  action: Action;
  modelText?: string;
}

async function runPolicy(
  data: EngineData,
  initial: GameState,
  policy: Policy,
  transcript: TranscriptLine[] | null,
  guard = 600,
): Promise<RunResult> {
  let state = initial;
  let rng = initStream(`${initial.seed}::${policy.name}`, 'bot');
  let decisions = 0;
  while (state.phase !== 'ended') {
    if (decisions >= guard) throw new Error(`policy '${policy.name}' exceeded ${guard} steps`);
    // The scripted seat plays its own window; the policy under test plays
    // the player seat (and advances through reports).
    if (state.phase !== 'report' && state.actingSeat !== state.playerSeat) {
      state = step(data, state, chinaDecide(data, state));
      decisions += 1;
      continue;
    }
    const view = serializeView(data, state);
    const moves = legalMoves(data, state);
    const out = await policy.decide(view, moves, { data, state, rng });
    rng = out.rng;
    transcript?.push({
      seed: state.seed,
      turn: state.turn,
      phase: state.phase,
      action: out.action,
      ...(out.modelText !== undefined ? { modelText: out.modelText } : {}),
    });
    state = step(data, state, out.action);
    decisions += 1;
  }
  return { endingId: state.endingId!, turns: state.turn, finalState: state, decisions };
}

// ---------------------------------------------------------------------------
// Run the grid + report (+ optional CSV matching simulate.ts columns)
// ---------------------------------------------------------------------------

interface Row {
  preset: WorldviewPresetId;
  policy: string;
  seed: string;
  ending: string;
  turns: number;
  capability: number;
  rivalCapability: number;
  publicTrust: number;
  unrest: number;
  safetyInsight: number;
  windowStillOpen: boolean;
}

async function main(): Promise<void> {
  const data = loadData();
  const policy = makePolicy(policyName);
  const rows: Row[] = [];
  const transcript: TranscriptLine[] | null = transcriptPath ? [] : null;
  const started = performance.now();
  for (const preset of presets) {
    for (let i = 0; i < runsPerPreset; i += 1) {
      const seed = `${seedPrefix}-${preset}-${policy.name}-${i}`;
      const initial = initGame(data, { seed, presetId: preset });
      const r = await runPolicy(data, initial, policy, transcript);
      const s = r.finalState;
      rows.push({
        preset,
        policy: policy.name,
        seed,
        ending: r.endingId,
        turns: r.turns,
        capability: s.seats.usa.resources.capability,
        rivalCapability: s.seats.china.resources.capability,
        publicTrust: s.seats.usa.resources.publicTrust,
        unrest: s.seats.usa.society.unrest,
        safetyInsight: s.seats.usa.resources.safetyInsight,
        windowStillOpen: s.world.flags.includes('windowStillOpen'),
      });
    }
  }
  const elapsedMs = Math.round(performance.now() - started);

  console.log(
    `model-playtest: ${rows.length} runs · policy=${policy.name} · content ${data.dataVersion} · ${elapsedMs}ms`,
  );
  for (const preset of presets) {
    const subset = rows.filter((r) => r.preset === preset);
    const dist: Record<string, number> = {};
    for (const row of subset) dist[row.ending] = (dist[row.ending] ?? 0) + 1;
    const distText = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([e, c]) => `${e} ${c}`)
      .join(' · ');
    console.log(
      `  ${preset.padEnd(9)} ${policy.name.padEnd(8)} | ${subset.length} runs | ${distText}`,
    );
  }

  if (transcriptPath && transcript) {
    mkdirSync(dirname(transcriptPath), { recursive: true });
    writeFileSync(transcriptPath, transcript.map((line) => JSON.stringify(line)).join('\n') + '\n');
    console.log(`  transcript: ${transcriptPath} (${transcript.length} decisions)`);
  }

  if (csvPath) {
    const header =
      'preset,policy,seed,ending,turns,capability,rivalCapability,publicTrust,unrest,safetyInsight,windowStillOpen';
    const body = rows
      .map(
        (r) =>
          `${r.preset},${r.policy},${r.seed},${r.ending},${r.turns},${r.capability},${r.rivalCapability},${r.publicTrust},${r.unrest},${r.safetyInsight},${r.windowStillOpen ? 1 : 0}`,
      )
      .join('\n');
    mkdirSync(dirname(csvPath), { recursive: true });
    writeFileSync(csvPath, `${header}\n${body}\n`);
    console.log(`  csv: ${csvPath}`);
  }
}

await main();
