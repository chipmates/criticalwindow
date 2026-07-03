/**
 * Loading and cross-file integrity for game content. Used by the runtime
 * (UI boot), the tests, and scripts/validate-data.ts, so the exact same
 * rules apply everywhere: a data file that loads in dev cannot fail CI,
 * and vice versa.
 */
import {
  eventCardSchema,
  policyCardSchema,
  parametersSchema,
  scenarioSchema,
  type EventCardData,
  type ParametersData,
  type PolicyCardData,
  type ScenarioData,
  type SourcesRegistryData,
  type StringsData,
} from './schemas';

export interface EngineData {
  dataVersion: string;
  parameters: ParametersData;
  scenario: ScenarioData;
  events: EventCardData[];
  policies: PolicyCardData[];
}

export interface RawEngineData {
  dataVersion: string;
  parameters: unknown;
  scenario: unknown;
  events: Array<{ name: string; json: unknown }>;
  policies: Array<{ name: string; json: unknown }>;
}

export class DataLoadError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`data failed to load:\n${issues.join('\n')}`);
    this.issues = issues;
  }
}

/** Parse all content files; throw with every issue listed (not just the first). */
export function loadEngineData(raw: RawEngineData): EngineData {
  const issues: string[] = [];

  const parameters = parametersSchema.safeParse(raw.parameters);
  if (!parameters.success) {
    issues.push(...formatZodIssues('parameters.json', parameters.error));
  }
  const scenario = scenarioSchema.safeParse(raw.scenario);
  if (!scenario.success) {
    issues.push(...formatZodIssues('scenario', scenario.error));
  }

  const events: EventCardData[] = [];
  for (const file of raw.events) {
    const parsed = eventCardSchema.safeParse(file.json);
    if (parsed.success) {
      events.push(parsed.data);
    } else {
      issues.push(...formatZodIssues(`events/${file.name}`, parsed.error));
    }
  }

  const policies: PolicyCardData[] = [];
  for (const file of raw.policies) {
    const parsed = policyCardSchema.safeParse(file.json);
    if (parsed.success) {
      policies.push(parsed.data);
    } else {
      issues.push(...formatZodIssues(`policies/${file.name}`, parsed.error));
    }
  }

  if (issues.length > 0) {
    throw new DataLoadError(issues);
  }

  return {
    dataVersion: raw.dataVersion,
    parameters: parameters.data!,
    scenario: scenario.data!,
    events,
    policies,
  };
}

function formatZodIssues(
  file: string,
  error: { issues: Array<{ path: unknown[]; message: string }> },
): string[] {
  return error.issues.map(
    (issue) => `${file}: ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`,
  );
}

// ---------------------------------------------------------------------------
// Referential integrity (the iron rule's executable half)
// ---------------------------------------------------------------------------

export interface IntegrityReport {
  /** Hard failures: broken references, duplicate ids. */
  errors: string[];
  /** TODO-SOURCE occurrences: allowed while drafting, fatal under --strict-sources. */
  draftValues: string[];
}

/** Recursively collect values under any `sourceIds` array, with JSON paths. */
function collectSourceIds(value: unknown, path: string, out: Array<{ id: string; path: string }>) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectSourceIds(item, `${path}[${i}]`, out));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      if (key === 'sourceIds' && Array.isArray(child)) {
        for (const id of child) {
          if (typeof id === 'string') {
            out.push({ id, path: childPath });
          }
        }
      } else {
        collectSourceIds(child, childPath, out);
      }
    }
  }
}

/** Recursively collect every "strings:..." reference, with JSON paths. */
function collectStringsRefs(
  value: unknown,
  path: string,
  out: Array<{ ref: string; path: string }>,
) {
  if (typeof value === 'string') {
    if (value.startsWith('strings:')) {
      out.push({ ref: value, path });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStringsRefs(item, `${path}[${i}]`, out));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collectStringsRefs(child, path ? `${path}.${key}` : key, out);
    }
  }
}

export function checkIntegrity(input: {
  parameters: ParametersData;
  scenario: ScenarioData;
  events: EventCardData[];
  policies: PolicyCardData[];
  strings: StringsData | null;
  sources: SourcesRegistryData | null;
}): IntegrityReport {
  const errors: string[] = [];
  const draftValues: string[] = [];

  const eventIds = new Set<string>();
  for (const event of input.events) {
    if (eventIds.has(event.id)) {
      errors.push(`duplicate event id: ${event.id}`);
    }
    eventIds.add(event.id);
  }
  const policyIds = new Set<string>();
  for (const policy of input.policies) {
    if (policyIds.has(policy.id)) {
      errors.push(`duplicate policy id: ${policy.id}`);
    }
    policyIds.add(policy.id);
  }
  if (eventIds.size > 0 && policyIds.size > 0) {
    for (const id of eventIds) {
      if (policyIds.has(id)) {
        errors.push(`id used by both an event and a policy: ${id}`);
      }
    }
  }

  for (const handId of input.scenario.startingHand ?? []) {
    if (!policyIds.has(handId)) {
      errors.push(`scenario startingHand references unknown policy: ${handId}`);
    }
  }

  const roots: Array<[string, unknown]> = [
    ['parameters', input.parameters],
    [`scenario(${input.scenario.id})`, input.scenario],
    ...input.events.map((e): [string, unknown] => [`event(${e.id})`, e]),
    ...input.policies.map((p): [string, unknown] => [`policy(${p.id})`, p]),
  ];

  const sourceRefs: Array<{ id: string; path: string }> = [];
  const stringsRefs: Array<{ ref: string; path: string }> = [];
  for (const [label, root] of roots) {
    collectSourceIds(root, label, sourceRefs);
    collectStringsRefs(root, label, stringsRefs);
  }

  const knownSourceIds = input.sources ? new Set(input.sources.sources.map((s) => s.id)) : null;
  for (const { id, path } of sourceRefs) {
    if (id === 'TODO-SOURCE') {
      draftValues.push(path);
    } else if (knownSourceIds && !knownSourceIds.has(id)) {
      errors.push(`unknown source id '${id}' at ${path}`);
    }
  }

  if (input.strings) {
    for (const { ref, path } of stringsRefs) {
      const key = ref.slice('strings:'.length);
      if (!(key in input.strings)) {
        errors.push(`unresolved string key '${key}' at ${path}`);
      }
    }
  }

  return { errors, draftValues };
}
