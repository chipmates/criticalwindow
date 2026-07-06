/**
 * pnpm validate — the data-integrity gate (runs first in CI).
 *
 * Checks, in order:
 *   1. every JSON file under data/ parses
 *   2. known file types validate against their zod schemas
 *   3. cross-file integrity: string refs resolve, source ids exist,
 *      card ids unique (same rules the runtime uses: src/engine/data.ts)
 *   4. committed JSON Schemas match the zod definitions (pnpm schemas)
 *   5. displayed-text voice rules on strings (no em dashes)
 *   6. TODO-SOURCE draft values: listed always, fatal with --strict-sources
 *      (the iron rule: no sourceless numbers ship)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkIntegrity, collectSourceIds, collectStringsRefs } from '../src/engine/data';
import {
  eventCardSchema,
  incidentsSchema,
  mandatesSchema,
  parametersSchema,
  anchorsSchema,
  type AnchorsData,
  prologueSchema,
  seatsSchema,
  policyCardSchema,
  scenarioSchema,
  sourcesRegistrySchema,
  stringsFileSchema,
  type EventCardData,
  type IncidentsData,
  type MandatesData,
  type ParametersData,
  type PrologueData,
  type SeatsData,
  type PolicyCardData,
  type ScenarioData,
  type SourcesRegistryData,
  type StringsData,
} from '../src/engine/schemas';
import { dataRoot, readDataFiles, type DataFile } from './lib/data-files';
import { buildJsonSchemas } from './lib/schema-json';
import { buildUsageMap } from './lib/source-usage';
import { registryHonestyErrors } from './lib/registry-honesty';
import {
  renderEvidenceMd,
  renderSourcesMd,
  renderUsageJson,
  type ParsedDataFile,
} from './lib/render-views';

const strictSources = process.argv.includes('--strict-sources');
const dataRootPath = dataRoot();
const errors: string[] = [];
const warnings: string[] = [];

// -- 1. parse everything ----------------------------------------------------
const files = readDataFiles(dataRootPath);
const parsed = new Map<string, unknown>();
for (const file of files) {
  try {
    parsed.set(file.relPath, JSON.parse(file.content));
  } catch (error) {
    errors.push(`data/${file.relPath}: invalid JSON: ${String(error)}`);
  }
}

function byDir(dir: string): DataFile[] {
  return files.filter((f) => f.relPath.startsWith(`${dir}/`) && parsed.has(f.relPath));
}

// -- 2. schema validation ---------------------------------------------------
function validateFile<T>(
  relPath: string,
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      data?: T;
      error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
    };
  },
): T | null {
  const json = parsed.get(relPath);
  if (json === undefined) {
    return null;
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    for (const issue of result.error?.issues ?? []) {
      errors.push(
        `data/${relPath}: ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`,
      );
    }
    return null;
  }
  return result.data ?? null;
}

let strings: StringsData | null = null;
if (parsed.has('strings/en.json')) {
  strings = validateFile<StringsData>('strings/en.json', stringsFileSchema);
} else {
  errors.push('data/strings/en.json is missing (i18n from day one)');
}

// Additional locales: same schema, and key sets compared against en.json.
// Missing keys are honest warnings (runtime falls back to English); unknown
// keys are errors (they would silently never render). docs/i18n.md has the rules.
for (const file of byDir('strings')) {
  if (file.relPath === 'strings/en.json' || !strings) {
    continue;
  }
  const locale = validateFile<StringsData>(file.relPath, stringsFileSchema);
  if (!locale) {
    continue;
  }
  const missing = Object.keys(strings).filter((key) => !(key in locale));
  const unknown = Object.keys(locale).filter((key) => !(key in strings));
  if (missing.length > 0) {
    warnings.push(
      `data/${file.relPath}: ${missing.length} untranslated key(s) (English fallback applies)`,
    );
  }
  for (const key of unknown) {
    errors.push(`data/${file.relPath}: key '${key}' does not exist in en.json`);
  }
}

const sources = parsed.has('sources.json')
  ? validateFile<SourcesRegistryData>('sources.json', sourcesRegistrySchema)
  : null;
if (!parsed.has('sources.json')) {
  warnings.push('data/sources.json not present yet (arrives with Block A3)');
}

const parameters = parsed.has('parameters.json')
  ? validateFile<ParametersData>('parameters.json', parametersSchema)
  : null;
if (!parsed.has('parameters.json')) {
  warnings.push('data/parameters.json not present yet (arrives with Block C1)');
}

const incidents = parsed.has('incidents.json')
  ? validateFile<IncidentsData>('incidents.json', incidentsSchema)
  : null;
if (!parsed.has('incidents.json')) {
  errors.push('data/incidents.json is missing (misalignment-incident system, v0.2)');
}

const mandates = parsed.has('mandates.json')
  ? validateFile<MandatesData>('mandates.json', mandatesSchema)
  : null;
if (!parsed.has('mandates.json')) {
  errors.push('data/mandates.json is missing (cabinet mandates, v0.2 wave 2)');
}

const prologue = parsed.has('prologue.json')
  ? validateFile<PrologueData>('prologue.json', prologueSchema)
  : null;
if (!parsed.has('prologue.json')) {
  errors.push('data/prologue.json is missing (tutorial prologue, v0.2 wave 2)');
}

const anchors = parsed.has('anchors.json')
  ? validateFile<AnchorsData>('anchors.json', anchorsSchema)
  : null;
if (!parsed.has('anchors.json')) {
  errors.push('data/anchors.json is missing (anchor labels, v0.3 wave A)');
}

const seatsRules = parsed.has('seats.json')
  ? validateFile<SeatsData>('seats.json', seatsSchema)
  : null;
if (!parsed.has('seats.json')) {
  errors.push('data/seats.json is missing (seat rules, v0.2 wave 3)');
}

const scenarios: ScenarioData[] = [];
for (const file of byDir('scenarios')) {
  const scenario = validateFile<ScenarioData>(file.relPath, scenarioSchema);
  if (scenario) {
    scenarios.push(scenario);
  }
}

const events: EventCardData[] = [];
for (const file of byDir('events')) {
  const event = validateFile<EventCardData>(file.relPath, eventCardSchema);
  if (event) {
    if (`${event.id}.json` !== file.relPath.slice('events/'.length)) {
      errors.push(`data/${file.relPath}: file name must match card id '${event.id}'`);
    }
    events.push(event);
  }
}

const policies: PolicyCardData[] = [];
for (const file of byDir('policies')) {
  const policy = validateFile<PolicyCardData>(file.relPath, policyCardSchema);
  if (policy) {
    if (`${policy.id}.json` !== file.relPath.slice('policies/'.length)) {
      errors.push(`data/${file.relPath}: file name must match card id '${policy.id}'`);
    }
    policies.push(policy);
  }
}

// -- 3. cross-file integrity ------------------------------------------------
let draftValues: string[] = [];
if (parameters && incidents && mandates && seatsRules && scenarios.length > 0) {
  for (const scenario of scenarios) {
    const report = checkIntegrity({
      parameters,
      scenario,
      events,
      policies,
      incidents,
      mandates,
      seatsRules,
      strings,
      sources,
    });
    errors.push(...report.errors);
    draftValues = [...draftValues, ...report.draftValues];
  }
} else if (events.length > 0 || policies.length > 0) {
  warnings.push('cards exist but parameters/scenario missing; integrity check skipped');
}

// Anchors are UI data with the same honesty rules: sources exist, strings
// resolve, anchor positions strictly increase per track.
if (anchors) {
  const knownSourceIds = sources ? new Set(sources.sources.map((s) => s.id)) : null;
  for (const [trackId, trackDef] of Object.entries(anchors.tracks)) {
    for (const id of trackDef.sourceIds) {
      if (knownSourceIds && !knownSourceIds.has(id)) {
        errors.push(`anchors.${trackId}: unknown source id '${id}'`);
      }
    }
    let lastAt = -1;
    for (const anchor of trackDef.anchors) {
      if (anchor.at <= lastAt) {
        errors.push(`anchors.${trackId}: anchor positions must strictly increase`);
      }
      lastAt = anchor.at;
      if (strings) {
        const key = anchor.label.slice('strings:'.length);
        if (!(key in strings)) {
          errors.push(`anchors.${trackId}: unresolved string key '${key}'`);
        }
      }
    }
  }
}

// Prologue is UI data, not engine data, but the same honesty rules apply:
// source ids must exist, strings must resolve, mock policy ids must be real,
// and the history it replays must land EXACTLY on the scenario start state.
if (prologue) {
  const sourceRefs: Array<{ id: string; path: string }> = [];
  const stringsRefs: Array<{ ref: string; path: string }> = [];
  collectSourceIds(prologue, 'prologue', sourceRefs);
  collectStringsRefs(prologue, 'prologue', stringsRefs);
  const knownSourceIds = sources ? new Set(sources.sources.map((s) => s.id)) : null;
  for (const { id, path } of sourceRefs) {
    if (id === 'TODO-SOURCE') {
      draftValues.push(path);
    } else if (knownSourceIds && !knownSourceIds.has(id)) {
      errors.push(`unknown source id '${id}' at ${path}`);
    }
  }
  if (strings) {
    for (const { ref, path } of stringsRefs) {
      const key = ref.slice('strings:'.length);
      if (!(key in strings)) {
        errors.push(`unresolved string key '${key}' at ${path}`);
      }
    }
  }
  const policyIds = new Set(policies.map((p) => p.id));
  for (const chapter of prologue.chapters) {
    if (chapter.mockPolicyId && !policyIds.has(chapter.mockPolicyId)) {
      errors.push(
        `prologue chapter '${chapter.id}': unknown mockPolicyId '${chapter.mockPolicyId}'`,
      );
    }
  }
  const scenario = scenarios.find((s) => s.id === 'scenario_2026');
  if (scenario) {
    const finalTo = new Map<string, number>();
    for (const chapter of prologue.chapters) {
      for (const motion of chapter.trackMotion) {
        finalTo.set(motion.target, motion.to);
      }
    }
    const usa = scenario.seats.usa;
    const china = scenario.seats.china;
    const startFor = (target: string): number | null => {
      if (target === 'society.jobDisplacement') return usa.society.jobDisplacement.value;
      if (target === 'society.unrest') return usa.society.unrest.value;
      if (target === 'rival.capability') return china.resources.capability.value;
      if (target === 'rival.trust') return scenario.world.bilateralTrust.value;
      if (target === 'rival.substitution') return china.substitution.value;
      const resources = usa.resources as Record<string, { value: number } | undefined>;
      return resources[target]?.value ?? null;
    };
    for (const [target, to] of finalTo) {
      const start = startFor(target);
      if (start !== null && start !== to) {
        errors.push(
          `prologue: '${target}' ends at ${to} but the scenario starts at ${start}; history must land on the start state`,
        );
      }
    }
  }
}

// -- 3b. source registry honesty ---------------------------------------------
// A tier is declared in the registry but never self-declared in effect: the
// citation map proves it. load-bearing without citations is an overclaim,
// citations without load-bearing is an undercount; both fail. Usage claims
// must be specific enough to check (the vague-phrase lint is deliberately blunt).
const usageMap = buildUsageMap(dataRootPath);
if (sources) {
  errors.push(...registryHonestyErrors(sources, usageMap));
}

// -- 3c. generated source views in sync ---------------------------------------
// SOURCES.md, docs/EVIDENCE.md and the game's usage JSON are views of data/;
// stale copies would publish wrong counts, so drift is an error, not a warning.
if (sources) {
  const parsedForViews: ParsedDataFile[] = files
    .filter((f) => parsed.has(f.relPath))
    .map((f) => ({ relPath: f.relPath, json: parsed.get(f.relPath) }));
  const views: Array<[string, string]> = [
    ['SOURCES.md', renderSourcesMd(sources, usageMap)],
    ['docs/EVIDENCE.md', renderEvidenceMd(sources, parsedForViews, usageMap)],
    ['src/ui/generated/source-usage.json', renderUsageJson(sources, usageMap)],
  ];
  for (const [relPath, expected] of views) {
    const absPath = join(dataRootPath, '..', relPath);
    if (!existsSync(absPath)) {
      errors.push(`${relPath} missing; run pnpm sources-md`);
    } else if (readFileSync(absPath, 'utf8') !== expected) {
      errors.push(`${relPath} out of date; run pnpm sources-md`);
    }
  }
}

// -- 4. committed JSON Schemas in sync --------------------------------------
const schemaFiles = buildJsonSchemas();
for (const [file, expected] of Object.entries(schemaFiles)) {
  const committedPath = join(dataRootPath, 'schemas', file);
  if (!existsSync(committedPath)) {
    errors.push(`data/schemas/${file} missing; run pnpm schemas`);
  } else if (readFileSync(committedPath, 'utf8') !== expected) {
    errors.push(`data/schemas/${file} out of date; run pnpm schemas`);
  }
}

// -- 5. displayed-text voice rules -------------------------------------------
if (strings) {
  for (const [key, value] of Object.entries(strings)) {
    if (value.includes('—')) {
      errors.push(`strings/en.json '${key}': em dash in displayed text (voice rule)`);
    }
    if (value.includes(' – ')) {
      errors.push(`strings/en.json '${key}': spaced en dash in displayed text (voice rule)`);
    }
  }
}

// Displayed markdown prose obeys the same rules. SOURCES.md is exempt because
// quoted publication titles legitimately carry em dashes.
for (const relPath of [
  'README.md',
  'ROADMAP.md',
  'CONTRIBUTING.md',
  'GOVERNANCE.md',
  'docs/DESIGN.md',
  'docs/EVIDENCE.md',
]) {
  const absPath = join(dataRootPath, '..', relPath);
  if (!existsSync(absPath)) {
    continue;
  }
  const text = readFileSync(absPath, 'utf8');
  if (text.includes('—')) {
    errors.push(`${relPath}: em dash in displayed text (voice rule)`);
  }
  if (text.includes(' – ')) {
    errors.push(`${relPath}: spaced en dash in displayed text (voice rule)`);
  }
}

// -- 6. draft values ----------------------------------------------------------
if (draftValues.length > 0) {
  const message = `${draftValues.length} TODO-SOURCE value(s):\n  ${draftValues.join('\n  ')}`;
  if (strictSources) {
    errors.push(`--strict-sources: ${message}`);
  } else {
    warnings.push(message);
  }
}

// -- report -------------------------------------------------------------------
for (const warning of warnings) {
  console.warn(`warn: ${warning}`);
}
if (errors.length > 0) {
  for (const error of errors) {
    console.error(`FAIL ${error}`);
  }
  console.error(`\nvalidate: ${errors.length} error(s) across ${files.length} data files`);
  process.exit(1);
}
console.log(
  `validate: ok (${files.length} files; ${events.length} events, ${policies.length} policies, ` +
    `${scenarios.length} scenarios, ${sources ? sources.sources.length : 0} sources, ` +
    `${strings ? Object.keys(strings).length : 0} strings${strictSources ? ', strict sources' : ''})`,
);
