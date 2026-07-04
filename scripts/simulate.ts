/**
 * pnpm simulate -- [--runs N] [--preset id|all] [--bot id|all] [--seed-prefix s] [--csv path]
 *
 * Headless balance harness: drives N runs per (preset, bot) pair through the
 * real engine and reports endings distribution, run length, and final
 * resource medians. Deterministic: same arguments, byte-identical output.
 * CI runs a 100-run smoke; balance studies run 10k+ locally.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BOT_IDS, runBot, type BotId } from '../src/engine/bots';
import { loadEngineData } from '../src/engine/data';
import { hashDataFiles } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { WORLDVIEW_PRESET_IDS, type WorldviewPresetId } from '../src/engine/types';
import { dataRoot, readDataFiles } from './lib/data-files';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : fallback;
}

const runsPerPair = Math.max(1, Number.parseInt(arg('runs', '100'), 10));
const presetArg = arg('preset', 'consensus');
const botArg = arg('bot', 'all');
const seedPrefix = arg('seed-prefix', 'sim');
const csvPath = arg('csv', '');

const presets: WorldviewPresetId[] =
  presetArg === 'all' ? [...WORLDVIEW_PRESET_IDS] : [presetArg as WorldviewPresetId];
const bots: BotId[] = botArg === 'all' ? [...BOT_IDS] : [botArg as BotId];

// Load real content.
const files = readDataFiles(dataRoot());
const json = (rel: string): unknown =>
  JSON.parse(readFileSync(files.find((f) => f.relPath === rel)!.absPath, 'utf8'));
const data = loadEngineData({
  dataVersion: hashDataFiles(files.map((f) => ({ path: f.relPath, content: f.content }))),
  parameters: json('parameters.json'),
  scenario: json('scenarios/scenario_2026.json'),
  incidents: json('incidents.json'),
  mandates: json('mandates.json'),
  events: files
    .filter((f) => f.relPath.startsWith('events/'))
    .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
  policies: files
    .filter((f) => f.relPath.startsWith('policies/'))
    .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
});

interface Row {
  preset: WorldviewPresetId;
  bot: BotId;
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

const rows: Row[] = [];
const started = performance.now();
for (const preset of presets) {
  for (const bot of bots) {
    for (let i = 0; i < runsPerPair; i += 1) {
      const seed = `${seedPrefix}-${preset}-${bot}-${i}`;
      const initial = initGame(data, { seed, presetId: preset });
      const result = runBot(data, initial, bot);
      const finalState = result.finalState;
      rows.push({
        preset,
        bot,
        seed,
        ending: result.endingId,
        turns: result.turns,
        capability: finalState.resources.capability,
        rivalCapability: finalState.rival.capability,
        publicTrust: finalState.resources.publicTrust,
        unrest: finalState.society.unrest,
        safetyInsight: finalState.resources.safetyInsight,
        windowStillOpen: finalState.flags.includes('windowStillOpen'),
      });
    }
  }
}
const elapsedMs = Math.round(performance.now() - started);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

console.log(
  `simulate: ${rows.length} runs (${runsPerPair} per pair) · content ${data.dataVersion} · ${elapsedMs}ms`,
);
for (const preset of presets) {
  for (const bot of bots) {
    const subset = rows.filter((r) => r.preset === preset && r.bot === bot);
    const dist: Record<string, number> = {};
    for (const row of subset) {
      dist[row.ending] = (dist[row.ending] ?? 0) + 1;
    }
    const distText = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([ending, count]) => `${ending} ${count}`)
      .join(' · ');
    console.log(
      `  ${preset.padEnd(9)} ${bot.padEnd(6)} | median turns ${median(subset.map((r) => r.turns))} | ${distText}`,
    );
  }
}
const unresolved = rows.filter((r) => r.windowStillOpen).length;
console.log(`  windowStillOpen (unresolved 2030): ${unresolved}/${rows.length}`);

// Reachability guard for CI: every ending should occur somewhere in the grid.
const seen = new Set(rows.map((r) => r.ending));
const expected = [
  'flourishing',
  'misalignedCatastrophe',
  'outpaced',
  'negotiatedSlowdown',
  'societalBreakdown',
];
const missing = expected.filter((e) => !seen.has(e));
if (botArg === 'all' && rows.length >= 100 && missing.length > 0) {
  console.error(`FAIL endings never reached in this batch: ${missing.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

if (csvPath) {
  const header =
    'preset,bot,seed,ending,turns,capability,rivalCapability,publicTrust,unrest,safetyInsight,windowStillOpen';
  const body = rows
    .map(
      (r) =>
        `${r.preset},${r.bot},${r.seed},${r.ending},${r.turns},${r.capability},${r.rivalCapability},${r.publicTrust},${r.unrest},${r.safetyInsight},${r.windowStillOpen ? 1 : 0}`,
    )
    .join('\n');
  mkdirSync(dirname(csvPath), { recursive: true });
  writeFileSync(csvPath, `${header}\n${body}\n`);
  console.log(`  csv: ${csvPath}`);
}
