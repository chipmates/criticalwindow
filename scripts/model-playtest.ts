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
import { eraForTurn, legalActions, playablePolicies, step } from '../src/engine/step';
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
  const lastEval = state.evalHistory[state.evalHistory.length - 1] ?? null;
  return {
    turn: state.turn,
    era: eraForTurn(data.parameters, state.turn),
    phase: state.phase,
    seat: state.seatId,
    preset: state.presetId,
    resources: { ...state.resources },
    society: { ...state.society },
    rival: { posture: state.rival.posture, capability: state.rival.capability },
    evalBand: lastEval ? { low: lastEval.bandLow, high: lastEval.bandHigh } : null,
    allocation: { ...state.allocation },
    flags: [...state.flags],
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
    const pending = state.pendingEvents[0]!;
    const card = data.events.find((e) => e.id === pending.eventId)!;
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
interface Policy {
  name: string;
  decide(
    view: CompactView,
    moves: LegalMoves,
    ctx: PolicyContext,
  ): { action: Action; rng: RngStreamState };
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
 * LLM POLICY — STUB. Reads ANTHROPIC_API_KEY from env at TOOLING TIME ONLY. Never shipped,
 * never called at game runtime. The skeleton BUILDS the prompt to prove the serializer feeds
 * a model cleanly, but does NOT execute a request — wiring the fetch is a Phase-3 task behind
 * an explicit flag. Invoking it without that wiring throws, by design.
 */
function llmPolicy(): Policy {
  const key = process.env.ANTHROPIC_API_KEY;
  return {
    name: 'llm',
    decide(view, moves) {
      // Prompt construction is safe to show; execution is intentionally absent in the skeleton.
      const _prompt = [
        'You are one seat in an AI-race strategy game. Choose ONE legal action.',
        `STATE: ${JSON.stringify(view)}`,
        `LEGAL MOVES: ${JSON.stringify(moves)}`,
        'Reply with a single JSON action object, e.g. {"type":"allocate","capability":60,"safety":30,"diffusion":10}.',
      ].join('\n');
      void _prompt;
      if (!key) {
        throw new Error(
          'llmPolicy is a Phase-3 stub: set ANTHROPIC_API_KEY (tooling-time only) AND wire the request before use. ' +
            'Use --policy scripted for the API-free dry-run.',
        );
      }
      throw new Error(
        'llmPolicy: request wiring is intentionally not implemented in the P-D3 skeleton.',
      );
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

function runPolicy(data: EngineData, initial: GameState, policy: Policy, guard = 600): RunResult {
  let state = initial;
  let rng = initStream(`${initial.seed}::${policy.name}`, 'bot');
  let decisions = 0;
  while (state.phase !== 'ended') {
    if (decisions >= guard) throw new Error(`policy '${policy.name}' exceeded ${guard} steps`);
    const view = serializeView(data, state);
    const moves = legalMoves(data, state);
    const out = policy.decide(view, moves, { data, state, rng });
    rng = out.rng;
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

function main(): void {
  const data = loadData();
  const policy = makePolicy(policyName);
  const rows: Row[] = [];
  const started = performance.now();
  for (const preset of presets) {
    for (let i = 0; i < runsPerPreset; i += 1) {
      const seed = `${seedPrefix}-${preset}-${policy.name}-${i}`;
      const initial = initGame(data, { seed, presetId: preset });
      const r = runPolicy(data, initial, policy);
      const s = r.finalState;
      rows.push({
        preset,
        policy: policy.name,
        seed,
        ending: r.endingId,
        turns: r.turns,
        capability: s.resources.capability,
        rivalCapability: s.rival.capability,
        publicTrust: s.resources.publicTrust,
        unrest: s.society.unrest,
        safetyInsight: s.resources.safetyInsight,
        windowStillOpen: s.flags.includes('windowStillOpen'),
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

main();
