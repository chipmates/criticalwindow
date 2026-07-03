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
import { checkIntegrity } from '../src/engine/data';
import {
  eventCardSchema,
  parametersSchema,
  policyCardSchema,
  scenarioSchema,
  sourcesRegistrySchema,
  stringsFileSchema,
  type EventCardData,
  type ParametersData,
  type PolicyCardData,
  type ScenarioData,
  type SourcesRegistryData,
  type StringsData,
} from '../src/engine/schemas';
import { dataRoot, readDataFiles, type DataFile } from './lib/data-files';
import { buildJsonSchemas } from './lib/schema-json';

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
if (parameters && scenarios.length > 0) {
  for (const scenario of scenarios) {
    const report = checkIntegrity({ parameters, scenario, events, policies, strings, sources });
    errors.push(...report.errors);
    draftValues = [...draftValues, ...report.draftValues];
  }
} else if (events.length > 0 || policies.length > 0) {
  warnings.push('cards exist but parameters/scenario missing; integrity check skipped');
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
