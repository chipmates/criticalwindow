/**
 * pnpm print-kit — generate the printable paper prototype from data/*.json.
 *
 * One content source for paper and digital: cards, tracks, tables and start
 * values all come from the same files the engine loads. The script refuses
 * to build if a card effect is not printable on the paper scale (multiples
 * of 50). Output: dist-print/kit.html + dist-print/critical-window-paper-kit.pdf.
 *
 * Paper mapping documented in docs/paper-kit.md. Kit prose in print-kit-text.ts.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { divRound, evalCurve } from '../src/engine/math';
import { hashDataFiles } from '../src/engine/hash';
import {
  eventCardSchema,
  incidentsSchema,
  parametersSchema,
  policyCardSchema,
  scenarioSchema,
  stringsFileSchema,
  type ChoiceEventData,
  type EffectSetData,
  type FixedEventData,
  type PolicyCardData,
  type WildcardEventData,
} from '../src/engine/schemas';
import { dataRoot, readDataFiles } from './lib/data-files';
import * as T from './print-kit-text';

// ---------------------------------------------------------------------------
// Load data (same files the digital game ships)
// ---------------------------------------------------------------------------

const files = readDataFiles(dataRoot());
const byPath = new Map(files.map((f) => [f.relPath, JSON.parse(f.content) as unknown]));

const parameters = parametersSchema.parse(byPath.get('parameters.json'));
const scenario = scenarioSchema.parse(byPath.get('scenarios/scenario_2026.json'));
const strings = stringsFileSchema.parse(byPath.get('strings/en.json'));
const events = files
  .filter((f) => f.relPath.startsWith('events/'))
  .map((f) => eventCardSchema.parse(byPath.get(f.relPath)));
const policies = files
  .filter((f) => f.relPath.startsWith('policies/'))
  .map((f) => policyCardSchema.parse(byPath.get(f.relPath)));
const incidents = incidentsSchema.parse(byPath.get('incidents.json'));

const choiceEvents = events.filter((c): c is ChoiceEventData => c.kind === 'choice');
const fixedEvents = events.filter((c): c is FixedEventData => c.kind === 'fixed');
const wildcardEvents = events.filter((c): c is WildcardEventData => c.kind === 'wildcard');

const dataVersion = hashDataFiles(files.map((f) => ({ path: f.relPath, content: f.content })));

// ---------------------------------------------------------------------------
// Paper scale helpers
// ---------------------------------------------------------------------------

const UNIT = 50; // one paper step = 50 digital points
const TRACK_MAX = 20;

/** Convert a card effect value; refuse to print a kit with off-grid values. */
function paperExact(value: number, context: string): number {
  if (value % UNIT !== 0) {
    throw new Error(`${context}: value ${value} is not a multiple of ${UNIT}; unprintable`);
  }
  return value / UNIT;
}

/** Display-round a derived value (tables, start marks), no exactness claim. */
function paperRound(value: number): number {
  return divRound(value, UNIT);
}

function t(key: string): string {
  const value = strings[key];
  if (!value) {
    throw new Error(`missing string: ${key}`);
  }
  return value;
}

function ref(stringsRef: string): string {
  return t(stringsRef.replace(/^strings:/, ''));
}

function targetLabel(target: string): string {
  return target.includes('.') ? t(`${target}.label`) : t(`resource.${target}.label`);
}

function esc(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

// ---------------------------------------------------------------------------
// Effect rendering
// ---------------------------------------------------------------------------

/** Paper does not track the hidden agency counter (digital hook only). */
const UNPRINTED_TARGETS = new Set(['hidden.agencyErosion']);

function effectParts(effects: EffectSetData, context: string): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(effects)) {
    if (key === 'flags') {
      for (const flag of value as string[]) {
        parts.push(`Set: ${t(`flag.${flag}.label`)}`);
      }
      continue;
    }
    if (key === 'clearFlags') {
      for (const flag of value as string[]) {
        parts.push(`Clear: ${t(`flag.${flag}.label`)}`);
      }
      continue;
    }
    if (typeof value !== 'number') {
      continue;
    }
    if (UNPRINTED_TARGETS.has(key)) {
      continue;
    }
    parts.push(`${targetLabel(key)} ${signed(paperExact(value, `${context}.${key}`))}`);
  }
  return parts;
}

function effectLine(effects: EffectSetData | undefined, context: string): string {
  if (!effects) {
    return '';
  }
  return effectParts(effects, context).join(' · ');
}

function delayedLines(
  delayed: Array<{ inTurns: number; effects: EffectSetData }> | undefined,
  context: string,
): string[] {
  if (!delayed) {
    return [];
  }
  // Paper turns are half the digital cadence; ceil keeps bites imminent.
  return delayed.map(
    (d) =>
      `⏳ in ${Math.ceil(d.inTurns / 2)} turn${Math.ceil(d.inTurns / 2) === 1 ? '' : 's'}: ` +
      effectParts(d.effects, context).join(' · '),
  );
}

// ---------------------------------------------------------------------------
// Derived tables (generated from the same curves the engine uses)
// ---------------------------------------------------------------------------

interface TableRange {
  from: number;
  to: number;
  value: number;
}

function collapseRanges(values: Array<{ x: number; y: number }>): TableRange[] {
  const ranges: TableRange[] = [];
  for (const { x, y } of values) {
    const last = ranges[ranges.length - 1];
    if (last && last.value === y) {
      last.to = x;
    } else {
      ranges.push({ from: x, to: x, value: y });
    }
  }
  return ranges;
}

const rndCurve = parameters.curves['rndCapacity'];
const capCurve = parameters.curves['capabilityPerRnd'];
if (!rndCurve || !capCurve) {
  throw new Error('parameters.curves must define rndCapacity and capabilityPerRnd');
}

const rndTable = collapseRanges(
  Array.from({ length: 41 }, (_, sum) => ({
    x: sum,
    y: paperRound(evalCurve(rndCurve, sum * UNIT)),
  })),
);

const capGainTable = collapseRanges(
  Array.from({ length: 9 }, (_, pts) => ({
    x: pts,
    y: paperRound(evalCurve(capCurve, pts * UNIT)),
  })),
);

const evalBandTable = collapseRanges(
  Array.from({ length: TRACK_MAX + 1 }, (_, insight) => {
    const digitalWidth = Math.max(
      parameters.evalUncertainty.floorBandWidth.value,
      parameters.evalUncertainty.baseBandWidth.value -
        (parameters.evalUncertainty.safetyInsightNarrowing.value * insight * UNIT) / 100,
    );
    return { x: insight, y: paperRound(digitalWidth) };
  }),
);

function rangeLabel(r: TableRange): string {
  return r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`;
}

function rangesRow(ranges: TableRange[], prefix: string): string {
  return ranges
    .map((r) => `<span class="pill">${rangeLabel(r)} → ${prefix}${r.value}</span>`)
    .join(' ');
}

/** Envelope lookup: digit 0-9 to paper difficulty / steepness modifier per preset. */
function presetRows(): string {
  const rows: string[] = [];
  for (const presetId of ['cautious', 'consensus', 'skeptic'] as const) {
    const preset = parameters.worldviewPresets[presetId];
    const diff = preset.alignmentDifficulty;
    const steep = preset.takeoffSteepness;
    const diffCells = Array.from({ length: 10 }, (_, d) =>
      paperRound(diff.min + divRound((diff.max - diff.min) * d, 9)),
    );
    const modCells = Array.from({ length: 10 }, (_, d) => {
      const s = paperRound(steep.min + divRound((steep.max - steep.min) * d, 9));
      const mod = Math.min(3, Math.floor(s / 5));
      return mod === 0 ? '0' : `-${mod}`;
    });
    rows.push(`
      <tr>
        <th rowspan="2">${esc(ref(preset.label))}</th>
        <td class="rowlabel">Difficulty</td>
        ${diffCells.map((v) => `<td>${v}</td>`).join('')}
      </tr>
      <tr>
        <td class="rowlabel">Steepness mod</td>
        ${modCells.map((v) => `<td>${v}</td>`).join('')}
      </tr>`);
  }
  return rows.join('');
}

// ---------------------------------------------------------------------------
// Card rendering
// ---------------------------------------------------------------------------

function conditionLine(card: ChoiceEventData): string {
  const parts: string[] = [];
  const conditions = card.trigger.conditions;
  if (conditions?.rivalPosture) {
    parts.push(`rival posture ${conditions.rivalPosture.toUpperCase()}`);
  }
  for (const flag of conditions?.flagsAll ?? []) {
    parts.push(`flag ${t(`flag.${flag}.label`)}`);
  }
  for (const flag of conditions?.flagsNone ?? []) {
    parts.push(`no flag ${t(`flag.${flag}.label`)}`);
  }
  return parts.length > 0 ? `Only if: ${parts.join(', ')}` : '';
}

function renderEventCard(card: ChoiceEventData): string {
  const era = card.trigger.era ?? 'early';
  const condition = conditionLine(card);
  const choices = card.choices
    .map((choice, i) => {
      const effects = effectLine(choice.effects, `event(${card.id}).choice[${i}]`);
      const delayed = delayedLines(choice.delayedEffects, `event(${card.id}).choice[${i}]`);
      return `
        <div class="choice">
          <div class="choice-label">${String.fromCharCode(65 + i)}. ${esc(ref(choice.label))}</div>
          ${effects ? `<div class="fx">${esc(effects)}</div>` : ''}
          ${delayed.map((line) => `<div class="fx delayed">${esc(line)}</div>`).join('')}
        </div>`;
    })
    .join('');
  return `
    <div class="card event-card era-${era}">
      <div class="card-top">
        <span class="era-badge">${esc(t(`era.${era}.label`)).toUpperCase()}</span>
        <span class="card-kind">EVENT</span>
      </div>
      <div class="card-title">${esc(ref(card.title))}</div>
      <div class="card-body">${esc(ref(card.body))}</div>
      ${condition ? `<div class="condition">${esc(condition)}</div>` : ''}
      <div class="choices">${choices}</div>
      <div class="card-sources">${esc(card.sourceIds.join(' · '))}</div>
    </div>`;
}

function beatWhenLine(card: FixedEventData): string {
  if (card.historical) {
    return card.fixedTurn.min === card.fixedTurn.max
      ? `Turn ${card.fixedTurn.min}, every run`
      : `Turns ${card.fixedTurn.min}-${card.fixedTurn.max}, every run`;
  }
  const parts: string[] = [];
  const cond = card.condition!;
  if (cond.minCapability !== undefined) {
    parts.push(`${t('resource.capability.label')} reaches ${paperRound(cond.minCapability)}`);
  }
  if (cond.era) {
    parts.push(`${t(`era.${cond.era}.label`)} era`);
  }
  for (const flag of cond.flagsAll ?? []) {
    parts.push(`flag ${t(`flag.${flag}.label`)}`);
  }
  if (cond.diceScaledFireProb) {
    parts.push('then d100 at or under the Takeoff slip value each quarter');
  }
  return `When: ${parts.join(', ')}`;
}

function renderBeatCard(card: FixedEventData): string {
  const choices = card.choices
    .map((choice, i) => {
      const effects = effectLine(choice.effects, `event(${card.id}).choice[${i}]`);
      const delayed = delayedLines(choice.delayedEffects, `event(${card.id}).choice[${i}]`);
      return `
        <div class="choice">
          <div class="choice-label">${String.fromCharCode(65 + i)}. ${esc(ref(choice.label))}</div>
          ${effects ? `<div class="fx">${esc(effects)}</div>` : ''}
          ${delayed.map((line) => `<div class="fx delayed">${esc(line)}</div>`).join('')}
        </div>`;
    })
    .join('');
  return `
    <div class="card event-card era-mid">
      <div class="card-top">
        <span class="era-badge">${card.historical ? 'SCHEDULED' : 'MILESTONE'}</span>
        <span class="card-kind">BEAT</span>
      </div>
      <div class="card-title">${esc(ref(card.title))}</div>
      <div class="card-body">${esc(ref(card.body))}</div>
      <div class="condition">${esc(beatWhenLine(card))}</div>
      <div class="choices">${choices}</div>
      <div class="card-sources">${esc(card.sourceIds.join(' · '))}</div>
    </div>`;
}

function wildcardScaledLine(card: WildcardEventData): string {
  const lines: string[] = [];
  for (const scaled of card.scaledEffects ?? []) {
    const label =
      scaled.exposure === 'computeMinusEnergy'
        ? `${t('resource.compute.label')} over ${t('resource.energy.label')}`
        : t(`resource.${scaled.exposure}.label`);
    const at = (x: number) => paperRound(scaled.base + Math.round((scaled.coef * x) / 1000));
    lines.push(
      `${targetLabel(scaled.target)}: scales with ${label} (at 300/600/900: ${at(300)}/${at(600)}/${at(900)})`,
    );
  }
  return lines.join(' · ');
}

function renderWildcardCard(card: WildcardEventData): string {
  const effects = effectLine(card.effects, `event(${card.id}).effects`);
  const delayed = delayedLines(card.delayedEffects, `event(${card.id})`);
  const eligible: string[] = [];
  const e = card.fire.eligible;
  if (e?.turnMin !== undefined) eligible.push(`from turn ${e.turnMin}`);
  if (e?.minCapability !== undefined) {
    eligible.push(`${t('resource.capability.label')} ${paperRound(e.minCapability)}+`);
  }
  if (e?.computeOverEnergyMin !== undefined) {
    eligible.push(
      `${t('resource.compute.label')} more than ${paperRound(e.computeOverEnergyMin)} over ${t('resource.energy.label')}`,
    );
  }
  for (const flag of e?.flagsAll ?? []) eligible.push(`flag ${t(`flag.${flag}.label`)}`);
  for (const flag of e?.flagsNone ?? []) eligible.push(`no flag ${t(`flag.${flag}.label`)}`);
  const scaledLine = wildcardScaledLine(card);
  return `
    <div class="card event-card era-late">
      <div class="card-top">
        <span class="era-badge">WILDCARD</span>
        <span class="card-kind">NO CHOICE</span>
      </div>
      <div class="card-title">${esc(ref(card.title))}</div>
      <div class="card-body">${esc(ref(card.body))}</div>
      <div class="condition">${esc(
        `Each quarter${eligible.length ? ` (${eligible.join(', ')})` : ''}: d100 at or under ${Math.round(card.fire.probPerMille / 10)} fires. Rests ${card.fire.cooldownTurns} turns after.`,
      )}</div>
      ${effects ? `<div class="fx">${esc(effects)}</div>` : ''}
      ${scaledLine ? `<div class="fx">${esc(scaledLine)}</div>` : ''}
      ${delayed.map((line) => `<div class="fx delayed">${esc(line)}</div>`).join('')}
      <div class="card-sources">${esc(card.sourceIds.join(' · '))}</div>
    </div>`;
}

function renderPolicyCard(card: PolicyCardData): string {
  const costs: string[] = [];
  if (card.cost?.politicalCapital) {
    costs.push(
      `${t('resource.politicalCapital.label')} ${paperExact(card.cost.politicalCapital, `policy(${card.id}).cost`)}`,
    );
  }
  if (card.cost?.capital) {
    costs.push(
      `${t('resource.capital.label')} ${paperExact(card.cost.capital, `policy(${card.id}).cost`)}`,
    );
  }
  const gates: string[] = [];
  if (card.gates?.publicTrustMin !== undefined) {
    gates.push(`${t('resource.publicTrust.label')} ≥ ${paperRound(card.gates.publicTrustMin)}`);
  }
  if (card.gates?.politicalCapitalMin !== undefined) {
    gates.push(
      `${t('resource.politicalCapital.label')} ≥ ${paperRound(card.gates.politicalCapitalMin)}`,
    );
  }
  if (card.gates?.capabilityMin !== undefined) {
    gates.push(`${t('resource.capability.label')} ≥ ${paperRound(card.gates.capabilityMin)}`);
  }
  if (card.gates?.eraMin) {
    gates.push(`${t(`era.${card.gates.eraMin}.label`)} era or later`);
  }
  for (const flag of card.gates?.flagsAll ?? []) {
    gates.push(`flag ${t(`flag.${flag}.label`)}`);
  }
  for (const flag of card.gates?.flagsNone ?? []) {
    gates.push(`no flag ${t(`flag.${flag}.label`)}`);
  }
  const effects = effectLine(card.effects, `policy(${card.id})`);
  const delayed = delayedLines(card.delayedEffects, `policy(${card.id})`);
  const meta: string[] = [];
  if (card.cooldown) {
    meta.push(`↻ returns after ${Math.ceil(card.cooldown / 2)} turns`);
  }
  if (card.oncePerRun) {
    meta.push('once per run');
  }
  return `
    <div class="card policy-card">
      <div class="card-top">
        <span class="era-badge">POLICY</span>
        ${meta.length > 0 ? `<span class="card-kind">${esc(meta.join(' · '))}</span>` : ''}
      </div>
      <div class="card-title">${esc(ref(card.title))}</div>
      <div class="card-body">${esc(ref(card.body))}</div>
      ${costs.length > 0 ? `<div class="condition">Cost: ${esc(costs.join(', '))}</div>` : ''}
      ${gates.length > 0 ? `<div class="condition">Requires: ${esc(gates.join(', '))}</div>` : ''}
      ${effects ? `<div class="fx">${esc(effects)}</div>` : ''}
      ${delayed.map((line) => `<div class="fx delayed">${esc(line)}</div>`).join('')}
      <div class="card-sources">${esc(card.sourceIds.join(' · '))}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

interface TrackSpec {
  label: string;
  start: number;
  fogFrom?: number;
}

function renderTrack(spec: TrackSpec): string {
  const cells = Array.from({ length: TRACK_MAX + 1 }, (_, i) => {
    const fog = spec.fogFrom !== undefined && i >= spec.fogFrom ? ' fog' : '';
    const start = i === spec.start ? '<span class="start-mark">▼</span>' : '';
    return `<div class="cell${fog}">${start}<span class="cell-num">${i}</span></div>`;
  }).join('');
  return `
    <div class="track">
      <div class="track-label">${esc(spec.label)}</div>
      <div class="cells">${cells}</div>
    </div>`;
}

function renderBoard(): string {
  const usaSeat = scenario.seats.usa;
  const chinaSeat = scenario.seats.china;
  const r = usaSeat.resources;
  const tracks: TrackSpec[] = [
    { label: t('resource.compute.label'), start: paperRound(r.compute.value) },
    { label: t('resource.energy.label'), start: paperRound(r.energy.value) },
    { label: t('resource.talent.label'), start: paperRound(r.talent.value) },
    { label: t('resource.capital.label'), start: paperRound(r.capital.value) },
    { label: t('resource.publicTrust.label'), start: paperRound(r.publicTrust.value) },
    { label: t('resource.politicalCapital.label'), start: paperRound(r.politicalCapital.value) },
    { label: t('resource.safetyInsight.label'), start: paperRound(r.safetyInsight.value) },
    {
      label: t('society.jobDisplacement.label'),
      start: paperRound(usaSeat.society.jobDisplacement.value),
    },
    { label: t('society.unrest.label'), start: paperRound(usaSeat.society.unrest.value) },
    { label: t('rival.trust.label'), start: paperRound(scenario.world.bilateralTrust.value) },
    {
      label: t('rival.substitution.label'),
      start: paperRound(chinaSeat.substitution.value),
    },
  ];

  const raceTracks: TrackSpec[] = [
    {
      label: `YOU · ${t('resource.capability.label')}`,
      start: paperRound(r.capability.value),
      fogFrom: 16,
    },
    {
      label: `RIVAL · ${t('resource.capability.label')}`,
      start: paperRound(chinaSeat.resources.capability.value),
      fogFrom: 16,
    },
  ];

  const flagBoxes = Object.keys(strings)
    .filter((key) => key.startsWith('flag.'))
    .map((key) => `<span class="flagbox">☐ ${esc(strings[key]!)}</span>`)
    .join(' ');

  const turnSlots = Array.from({ length: 10 }, (_, i) => {
    const turn = i + 1;
    const era = turn <= 3 ? 'EARLY' : turn <= 7 ? 'MID' : 'LATE';
    const election = turn === 5 ? ' ★' : '';
    return `
      <div class="turn-slot">
        <div class="turn-num">${turn}${election}</div>
        <div class="turn-era">${era}</div>
        <div class="tuck-zone"></div>
      </div>`;
  }).join('');

  const allocRows = ['Capability', 'Safety', 'Diffusion', 'R&D points']
    .map(
      (label) => `
      <tr>
        <th>${label}</th>
        ${Array.from({ length: 10 }, () => '<td></td>').join('')}
      </tr>`,
    )
    .join('');

  return `
    <section class="page board-page">
      <h2>${esc(ref(scenario.label))} <span class="muted">board sheet</span></h2>
      <div class="race-strip">
        <div class="race-title">THE RACE TRACK <span class="muted">fog zone from 16, threshold at 20</span></div>
        ${raceTracks.map(renderTrack).join('')}
      </div>
      <div class="tracks">${tracks.map(renderTrack).join('')}</div>
      <div class="flag-row"><strong>Flags:</strong> ${flagBoxes}</div>
      <div class="turn-track">
        <div class="race-title">TURN TRACK <span class="muted">tuck delayed cards below their due turn · ★ election</span></div>
        <div class="turn-slots">${turnSlots}</div>
      </div>
      <div class="alloc">
        <div class="race-title">ALLOCATION LOG <span class="muted">write points per turn</span></div>
        <table class="alloc-table">
          <tr><th></th>${Array.from({ length: 10 }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr>
          ${allocRows}
        </table>
      </div>
      <div class="modifier-box">
        <strong>Endgame modifiers</strong> (note them when cards say so):
        <span class="writein"></span>
      </div>
      ${footer()}
    </section>`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function footer(): string {
  return `<div class="pagefoot">${T.KIT_TITLE} · paper kit v0 · content ${dataVersion} · CC BY-SA 4.0</div>`;
}

function coverPage(): string {
  return `
    <section class="page cover">
      <h1>${T.KIT_TITLE}</h1>
      <div class="subtitle">${T.KIT_SUBTITLE}</div>
      <p class="intro">${esc(T.RULES_INTRO)}</p>
      <h3>In this kit</h3>
      <ul>${T.COMPONENTS_LIST.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      <h3>Before you print and play</h3>
      <ul>${T.COVER_NOTES.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      ${footer()}
    </section>`;
}

function rulesPages(): string {
  const phases = T.RULES_TURN_PHASES.map(
    (p) => `<div class="phase"><strong>${esc(p.name)}.</strong> ${esc(p.text)}</div>`,
  ).join('');
  return `
    <section class="page">
      <h2>How to play <span class="muted">page 1 of 2</span></h2>
      <p>${esc(T.RULES_GOAL)}</p>
      <h3>Setup</h3>
      <ol>${T.RULES_SETUP.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <h3>A turn</h3>
      ${phases}
      ${footer()}
    </section>
    <section class="page">
      <h2>How to play <span class="muted">page 2 of 2</span></h2>
      <h3>Reading cards</h3>
      <p>${esc(T.RULES_READING)}</p>
      <h3>Endings that can arrive early</h3>
      <ul>${T.RULES_ENDINGS_EARLY.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <h3>${esc(T.RULES_ENDGAME_TITLE)}</h3>
      <ol>${T.RULES_ENDGAME.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <h3>Why the game is like this</h3>
      <p>${esc(T.RULES_HONESTY)}</p>
      ${footer()}
    </section>`;
}

function cardPages(): string {
  const eventCards = [...choiceEvents]
    .sort((a, b) => {
      const order = { early: 0, mid: 1, late: 2 } as const;
      return order[a.trigger.era ?? 'early'] - order[b.trigger.era ?? 'early'];
    })
    .map(renderEventCard);
  const beatAndWildcardCards = [
    ...fixedEvents.map(renderBeatCard),
    ...wildcardEvents.map(renderWildcardCard),
  ];
  const policyCards = policies.map(renderPolicyCard);

  const pages: string[] = [];
  for (let i = 0; i < eventCards.length; i += 9) {
    pages.push(`
      <section class="page">
        <h2>Event cards <span class="muted">${i / 9 + 1}</span></h2>
        <div class="card-grid">${eventCards.slice(i, i + 9).join('')}</div>
        ${footer()}
      </section>`);
  }
  for (let i = 0; i < beatAndWildcardCards.length; i += 9) {
    pages.push(`
      <section class="page">
        <h2>Beats and wildcards <span class="muted">scheduled and uninvited</span></h2>
        <div class="card-grid">${beatAndWildcardCards.slice(i, i + 9).join('')}</div>
        ${footer()}
      </section>`);
  }
  for (let i = 0; i < policyCards.length; i += 9) {
    pages.push(`
      <section class="page">
        <h2>Policy cards</h2>
        <div class="card-grid">${policyCards.slice(i, i + 9).join('')}</div>
        ${footer()}
      </section>`);
  }
  return pages.join('');
}

function incidentsPage(): string {
  const rows = incidents.rungs
    .map((rung) => {
      const damage = effectLine(rung.baseDamage, `incident(${rung.id})`);
      return `<tr>
        <td>${esc(ref(rung.title))}</td>
        <td>${paperRound(rung.threshold)}</td>
        <td>${esc(damage)}</td>
        <td>${rung.forcedPause ? 'YES' : 'no'}</td>
      </tr>`;
    })
    .join('');
  return `
    <section class="page">
      <h2>Incident table <span class="muted">world update, after society</span></h2>
      <p>Risk (paper) = Capability x (20 minus your best guess of Alignment) / 20. If your
      Capability share this quarter was 7+ of 10, add a quarter more. If the rival is RACING,
      add a quarter more. Find the highest row your Risk beats, roll d100: at or under
      (Risk minus the row's threshold) x 5, the incident fires. Each row rests 2 turns after firing.</p>
      <table class="preset-table">
        <tr><th>Incident</th><th>Risk over</th><th>Damage (before Insight)</th><th>Forced pause</th></tr>
        ${rows}
      </table>
      <p class="small">Safety Insight softens damage: knock off up to half at Insight 20.
      The lab accident ends the run in catastrophe if true Alignment is under 3 on the slip.
      Damage values from data/incidents.json (same numbers the digital game uses).</p>
      ${footer()}
    </section>`;
}

function referencePage(): string {
  return `
    <section class="page">
      <h2>Reference card <span class="muted">World Update runs top to bottom</span></h2>
      <div class="ref-grid">
        <div class="ref-block">
          <h3>R&amp;D points <span class="muted">Compute + Talent →</span></h3>
          <div>${rangesRow(rndTable, '')}</div>
        </div>
        <div class="ref-block">
          <h3>Capability gain <span class="muted">points allocated →</span></h3>
          <div>${rangesRow(capGainTable, '+')}</div>
          <div class="small">${T.REF_CONVERSION_NOTES.map(esc).join('<br>')}</div>
        </div>
        <div class="ref-block">
          <h3>Eval band width <span class="muted">Safety Insight →</span></h3>
          <div>${rangesRow(evalBandTable, '±')}</div>
        </div>
        <div class="ref-block">
          <h3>1. Rival moves</h3>
          ${T.REF_RIVAL_MOVES.map((m) => `<div><strong>${m.posture}:</strong> ${esc(m.text)}</div>`).join('')}
        </div>
        <div class="ref-block">
          <h3>2. Posture check <span class="muted">first match wins</span></h3>
          <ol>${T.REF_POSTURE_CHECK.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        </div>
        <div class="ref-block">
          <h3>3. Society</h3>
          <ol>${T.REF_SOCIETY.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        </div>
        <div class="ref-block">
          <h3>4. Election <span class="muted">turn 5</span></h3>
          <ul>${T.REF_ELECTION.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
        <div class="ref-block">
          <h3>5. Ending check</h3>
          <ul>${T.REF_ENDING_CHECK.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
        <div class="ref-block wide">
          <h3>Unresolved 2030</h3>
          <p class="small">${esc(T.REF_UNRESOLVED)}</p>
        </div>
      </div>
      ${footer()}
    </section>`;
}

function envelopePage(): string {
  return `
    <section class="page">
      <h2>${esc(T.ENVELOPE_TITLE)}</h2>
      <ol>${T.ENVELOPE_INSTRUCTIONS.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="slip">
        <div class="slip-title">HIDDEN WORLD SLIP · seal me</div>
        <div class="slip-line">${esc(T.ENVELOPE_SLIP_LABELS.preset)} ______________________</div>
        <div class="slip-line">${esc(T.ENVELOPE_SLIP_LABELS.difficulty)} ______</div>
        <div class="slip-line">${esc(T.ENVELOPE_SLIP_LABELS.steepness)} ______</div>
      </div>
      <h3>Endgame lookup <span class="muted">digit rolled → value</span></h3>
      <table class="preset-table">
        <tr>
          <th>Preset</th><th></th>
          ${Array.from({ length: 10 }, (_, d) => `<th>${d}</th>`).join('')}
        </tr>
        ${presetRows()}
      </table>
      <p class="small">${esc(T.ENVELOPE_TABLE_NOTE)}</p>
      <p class="small">Preset sources: ${(['cautious', 'consensus', 'skeptic'] as const)
        .map((id) => {
          const p = parameters.worldviewPresets[id];
          const ids = [...p.alignmentDifficulty.sourceIds, ...p.takeoffSteepness.sourceIds];
          return `${esc(ref(p.label))}: ${esc([...new Set(ids)].join(', '))}`;
        })
        .join(' · ')}</p>
      ${footer()}
    </section>`;
}

// ---------------------------------------------------------------------------
// Assemble + PDF
// ---------------------------------------------------------------------------

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-family: Georgia, 'Times New Roman', serif; color: #111; }
  .page { width: 190mm; min-height: 270mm; padding: 6mm 0; page-break-after: always; position: relative; }
  h1 { font-size: 34pt; letter-spacing: 0.04em; }
  h2 { font-size: 14pt; border-bottom: 1.5pt solid #111; padding-bottom: 2mm; margin-bottom: 4mm; }
  h3 { font-size: 10.5pt; margin: 3mm 0 1.5mm; }
  p, li, .phase { font-size: 9pt; line-height: 1.45; margin-bottom: 1.2mm; }
  ol, ul { padding-left: 5mm; }
  .muted { color: #777; font-weight: normal; font-size: 8pt; letter-spacing: 0.05em; }
  .small { font-size: 7.5pt; color: #333; line-height: 1.4; }
  .subtitle { font-size: 11pt; color: #555; font-variant: small-caps; margin: 1mm 0 6mm; }
  .intro { font-size: 11pt; font-style: italic; margin: 4mm 0; }
  .cover ul { margin-bottom: 3mm; }
  .pagefoot { position: absolute; bottom: 2mm; left: 0; right: 0; font-size: 6.5pt; color: #999; text-align: center; font-family: system-ui, sans-serif; }

  .card-grid { display: grid; grid-template-columns: repeat(3, 60mm); grid-auto-rows: 85mm; gap: 1.5mm; }
  .card { border: 0.3pt dashed #aaa; padding: 2.5mm; display: flex; flex-direction: column; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
  .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm; }
  .era-badge { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.12em; border: 0.8pt solid #111; padding: 0.4mm 1.2mm; }
  .era-mid .era-badge { background: #e8e8e8; }
  .era-late .era-badge { background: #111; color: #fff; }
  .card-kind { font-size: 6pt; color: #888; letter-spacing: 0.1em; }
  .card-title { font-family: Georgia, serif; font-size: 10pt; font-weight: 700; margin-bottom: 1.2mm; line-height: 1.15; }
  .card-body { font-size: 6.8pt; line-height: 1.35; margin-bottom: 1.5mm; }
  .condition { font-size: 6.3pt; font-weight: 600; color: #444; border-top: 0.3pt solid #ccc; padding-top: 0.8mm; margin-bottom: 0.8mm; }
  .choices { margin-top: auto; }
  .choice { border-top: 0.5pt solid #999; padding: 1mm 0; }
  .choice-label { font-size: 7pt; font-weight: 700; }
  .fx { font-size: 6.3pt; color: #222; }
  .fx.delayed { color: #555; font-style: italic; }
  .card-sources { font-size: 5pt; color: #999; margin-top: 1mm; font-family: ui-monospace, monospace; }
  .policy-card { border-style: solid; border-width: 0.5pt; }
  .policy-card .fx { border-top: 0.5pt solid #999; padding-top: 1mm; margin-top: 1mm; }

  .board-page h2 { margin-bottom: 2mm; }
  .race-title { font-size: 8pt; font-weight: 700; letter-spacing: 0.08em; margin: 2mm 0 1mm; font-family: system-ui, sans-serif; }
  .race-strip { border: 1.2pt solid #111; padding: 1.5mm 2mm 2mm; margin-bottom: 2.5mm; }
  .track { display: flex; align-items: center; margin-bottom: 1mm; }
  .track-label { width: 30mm; font-size: 7pt; font-weight: 600; font-family: system-ui, sans-serif; padding-right: 1.5mm; text-align: right; }
  .cells { display: flex; }
  .cell { width: 7.2mm; height: 6.2mm; border: 0.4pt solid #888; margin-right: -0.4pt; position: relative; }
  .cell.fog { background: repeating-linear-gradient(45deg, #ddd 0 1mm, #f4f4f4 1mm 2mm); }
  .cell-num { position: absolute; bottom: 0.2mm; right: 0.5mm; font-size: 4pt; color: #999; font-family: system-ui, sans-serif; }
  .start-mark { position: absolute; top: -0.5mm; left: 50%; transform: translateX(-50%); font-size: 6pt; }
  .flag-row { font-size: 7pt; font-family: system-ui, sans-serif; margin: 2mm 0; line-height: 1.8; }
  .flagbox { border: 0.4pt solid #999; padding: 0.6mm 1.2mm; margin-right: 1mm; white-space: nowrap; }
  .turn-slots { display: flex; gap: 1mm; }
  .turn-slot { flex: 1; border: 0.6pt solid #555; text-align: center; }
  .turn-num { font-size: 10pt; font-weight: 700; font-family: Georgia, serif; padding-top: 1mm; }
  .turn-era { font-size: 5pt; letter-spacing: 0.1em; color: #777; font-family: system-ui, sans-serif; }
  .tuck-zone { height: 22mm; border-top: 0.4pt dashed #bbb; margin-top: 1mm; }
  .alloc-table { width: 100%; border-collapse: collapse; font-family: system-ui, sans-serif; }
  .alloc-table th, .alloc-table td { border: 0.4pt solid #999; font-size: 6.5pt; padding: 1.4mm 0.8mm; text-align: center; }
  .alloc-table th:first-child { text-align: right; width: 30mm; }
  .modifier-box { border: 1pt solid #111; margin-top: 2.5mm; padding: 2mm; font-size: 8pt; font-family: system-ui, sans-serif; min-height: 12mm; }

  .ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .ref-block { border: 0.5pt solid #999; padding: 2mm; }
  .ref-block.wide { grid-column: span 2; }
  .ref-block h3 { margin-top: 0; }
  .ref-block div, .ref-block li { font-size: 7.5pt; line-height: 1.45; }
  .pill { display: inline-block; border: 0.4pt solid #777; padding: 0.3mm 1.2mm; margin: 0.3mm 0.5mm 0.3mm 0; font-size: 7pt; font-family: system-ui, sans-serif; white-space: nowrap; }

  .slip { border: 1.2pt dashed #111; width: 120mm; padding: 3mm; margin: 4mm 0; }
  .slip-title { font-size: 8pt; letter-spacing: 0.15em; font-weight: 700; margin-bottom: 2mm; font-family: system-ui, sans-serif; }
  .slip-line { font-size: 9pt; margin-bottom: 2.5mm; }
  .preset-table { border-collapse: collapse; margin: 2mm 0; }
  .preset-table th, .preset-table td { border: 0.4pt solid #999; font-size: 7.5pt; padding: 1mm 1.6mm; text-align: center; }
  .preset-table .rowlabel { font-size: 6.5pt; text-align: right; color: #555; }

  @page { size: A4; margin: 12mm 10mm; }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${T.KIT_TITLE} paper kit</title>
<style>${CSS}</style>
</head>
<body>
${coverPage()}
${rulesPages()}
${renderBoard()}
${cardPages()}
${referencePage()}
${incidentsPage()}
${envelopePage()}
</body>
</html>`;

const outDir = new URL('../dist-print', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const htmlPath = join(outDir, 'kit.html');
writeFileSync(htmlPath, html);
console.log(`wrote ${htmlPath}`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`);
  const pdfPath = join(outDir, 'critical-window-paper-kit.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  console.log(`wrote ${pdfPath}`);
} finally {
  await browser.close();
}
console.log(
  `print-kit: ${events.length} events, ${policies.length} policies, content ${dataVersion}`,
);
