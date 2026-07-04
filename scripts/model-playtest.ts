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
import { scriptedSeatDecide } from '../src/engine/china-policy';
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
const playerSeatArg = arg('seat', 'usa');
if (playerSeatArg !== 'usa' && playerSeatArg !== 'china') {
  throw new Error(`--seat must be usa or china, got '${playerSeatArg}'`);
}
const playerSeat = playerSeatArg;
/** Both seats driven by the model policy (the hotseat skill-curve probe). */
const llmVsLlm = process.argv.includes('--llm-vs-llm');
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

function serializeView(data: EngineData, state: GameState, seat: 'usa' | 'china'): CompactView {
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
    const pending = state.seats[state.actingSeat].pendingEvents[0]!;
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

  // The static rulebook rides in a CACHED system block: across a sweep it is
  // identical for thousands of calls, so caching cuts the bill by more than half.
  const RULES = [
    'You are playing one seat in a deterministic strategy game about the AI race',
    '(2026 to 2030, 16 quarterly turns). Two seats, USA and China, one shared world.',
    'Play WELL: good endings are flourishing (cross capability 1000 with your hidden',
    'alignment above the shared hidden difficulty) and negotiatedSlowdown, the BILATERAL',
    'treaty (channel open, bilateral trust 850+, turn 11+, BOTH seats have played',
    'compute_treaty_feeler at least once, then one co-signs by playing it again).',
    'Bad endings: misalignedCatastrophe (ANY seat crosses with bad alignment, everyone',
    'loses), outpaced (the other seat crosses and its systems hold), societalBreakdown',
    '(either society reaches unrest 800).',
    'THE CENTRAL TRAP: crossing capability 1000 (or ending at 800+ at turn 16) resolves',
    'your HIDDEN true alignment against the HIDDEN difficulty. Cross with alignment BELOW',
    'difficulty and it is catastrophe for everyone. Alignment is SLOW and EXPENSIVE to',
    'build (safety allocation earns a little each turn) and it ERODES every turn once you',
    'enter the fog zone (capability 800+). So you must BANK alignment high BEFORE the final',
    'sprint, then cross fast; topping it up mid-sprint does not work. Racing to the line',
    'almost always crosses under-aligned. Your eval band is the ONLY alignment signal and',
    'it flatters you (never reads worse than truth). Capability allocation 70+ per turn',
    'also cuts alignment. Most crossings are catastrophes: that is the point, not a bug.',
    'Incidents fire when capability x misalignment x racing pressure crosses thresholds;',
    'they are warning shots: reading them beats trusting your evals. Rung 2-3 forces',
    'capability allocation <= 30 next turn. Wildcards (weight theft, Taiwan, EU export',
    'squeeze, grid crunch) hit through your exposure. Compute must not outrun energy',
    'by 300+. Diffusion converts to capital income, displacement relief and trust.',
    'Mandates pay political capital when delivered. Milestones at 700/800/900 make',
    'capability self-accelerate. USA: turn-8 midterm judges trust/unrest. China:',
    'legitimacy verdicts each era; capability growth under an export crackdown scales',
    'with substitution; no ubi_pilot; nationalize is cheaper.',
    'THE POLICY DECK (id: cost -> gist): export_controls: 100pc -> rival capability -150,',
    'trust -100, but their substitution +200 in 3 turns (slows, does not stop).',
    'chip_subsidies: 200cap+50pc -> compute +250 in 4 turns. energy_buildout: 150cap+50pc',
    '-> energy +250 in 3 turns, small unrest first. interpretability_moonshot: 100cap+50pc',
    '-> safety insight +150 now +150 in 2. eval_mandate: 100pc -> insight +100 now +100',
    'in 2, trust +100, capability -50. compute_treaty_feeler: 50pc -> bilateral trust',
    '+100, opens the treaty channel and signals your side (cooldown 4; both sides must',
    'signal, then co-sign at trust 850+ after turn 11 to SIGN). natsec_merge: 150pc, needs capability 500 + mid era -> compute +150,',
    'capability +100, trust -150, raises espionage exposure. open_weights_release: 50pc',
    '-> trust +150, rival capability +150, own capability -100, kills weight-theft risk.',
    'ubi_pilot (USA only): 100pc+150cap -> unrest -150, trust +100, capital bill later.',
    'ai_literacy_campaign: 100cap+50pc -> trust +100 now +100 later, unrest -100.',
    'preventive_sabotage: 100pc -> a GAMBLE: deter (rival capability -150) or spiral',
    '(bilateral trust craters, escalation flag); worse odds if the race is already on.',
    'global_moratorium: 200pc -> own capability -100, trust +50, unrest -50; rival may',
    'gain while you halt. weights_security_program: 100cap -> halves weight-theft damage.',
    'MEMO CHOICES follow the same logic: read the effect deltas shown in the legal moves;',
    'delayed effects (the bite) matter as much as immediate ones. Watch the race track:',
    'if the rival will cross first with bad alignment everyone dies, so either outpace',
    'them WITH safety investment, slow them, or build the treaty exit. Do not let',
    'displacement outrun public trust: unrest compounds and can end the run at 800.',
    'Forced pause after a bad incident caps capability allocation at 30 for one turn.',
    'A good player reads incident history as alignment data, times the treaty window,',
    'keeps energy within 300 of compute, and never crosses the threshold on a wide,',
    'flattering eval band in a cautious world.',
    'Reply with ONE JSON action object and NOTHING else.',
  ].join(' ');

  interface AskUsage {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  }
  const usage: AskUsage = { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };

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
        system: [{ type: 'text', text: RULES, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error(`anthropic api ${response.status}: ${await response.text()}`);
    }
    const json = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };
    usage.calls += 1;
    usage.inputTokens += json.usage?.input_tokens ?? 0;
    usage.outputTokens += json.usage?.output_tokens ?? 0;
    usage.cacheReadTokens += json.usage?.cache_read_input_tokens ?? 0;
    if (usage.calls % 50 === 0) {
      console.log(
        `  api: ${usage.calls} calls · in ${usage.inputTokens} · out ${usage.outputTokens} · cache-read ${usage.cacheReadTokens}`,
      );
    }
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
      `You are the ${view.seat.toUpperCase()} seat.`,
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
  seat: string;
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
    const policyTurn =
      state.phase === 'report' || llmVsLlm || state.actingSeat === state.playerSeat;
    if (!policyTurn) {
      // The scripted opponent is EXACTLY what ships: the fog-aware, stance-
      // based seat policy the store drives in production. Anything else
      // makes the harness measure a game that does not exist (iter2 lesson:
      // a generic bot opponent burned its own society down in 9 of 20 runs
      // and the collapse was misread as a China-seat balance problem).
      state = step(data, state, scriptedSeatDecide(data, state));
      decisions += 1;
      continue;
    }
    const deciderSeat = state.phase === 'report' ? state.playerSeat : state.actingSeat;
    const view = serializeView(data, state, deciderSeat);
    const moves = legalMoves(data, state);
    const out = await policy.decide(view, moves, { data, state, rng });
    rng = out.rng;
    transcript?.push({
      seed: state.seed,
      turn: state.turn,
      phase: state.phase,
      seat: deciderSeat,
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
  seat: string;
  seed: string;
  ending: string;
  outcomeSeat: string;
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
      const initial = initGame(data, { seed, presetId: preset, mode: 'solo', playerSeat });
      const r = await runPolicy(data, initial, policy, transcript);
      const s = r.finalState;
      const endLog = s.log.find((e) => e.kind === 'ending');
      rows.push({
        preset,
        policy: policy.name,
        seat: playerSeat,
        seed,
        ending: r.endingId,
        outcomeSeat: String(
          endLog?.meta?.winnerSeat ?? endLog?.meta?.causeSeat ?? endLog?.meta?.seat ?? '',
        ),
        turns: r.turns,
        capability: s.seats[playerSeat].resources.capability,
        rivalCapability: s.seats[playerSeat === 'usa' ? 'china' : 'usa'].resources.capability,
        publicTrust: s.seats[playerSeat].resources.publicTrust,
        unrest: s.seats[playerSeat].society.unrest,
        safetyInsight: s.seats[playerSeat].resources.safetyInsight,
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
      'preset,policy,seat,seed,ending,outcomeSeat,turns,capability,rivalCapability,publicTrust,unrest,safetyInsight,windowStillOpen';
    const body = rows
      .map(
        (r) =>
          `${r.preset},${r.policy},${r.seat},${r.seed},${r.ending},${r.outcomeSeat},${r.turns},${r.capability},${r.rivalCapability},${r.publicTrust},${r.unrest},${r.safetyInsight},${r.windowStillOpen ? 1 : 0}`,
      )
      .join('\n');
    mkdirSync(dirname(csvPath), { recursive: true });
    writeFileSync(csvPath, `${header}\n${body}\n`);
    console.log(`  csv: ${csvPath}`);
  }
}

await main();
