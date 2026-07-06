/**
 * Mutation tests for the registry-honesty rules: prove the validator
 * actually catches each class of violation, on the REAL data. If a rule
 * silently stops firing, these fail before a reader catches us publishing
 * a claim the data does not support.
 */
import { describe, expect, test } from 'vitest';
import { sourcesRegistrySchema, sourceEntrySchema } from '../src/engine/schemas';
import { dataRoot, readDataFiles } from '../scripts/lib/data-files';
import { buildUsageMap } from '../scripts/lib/source-usage';
import { registryHonestyErrors } from '../scripts/lib/registry-honesty';
import {
  citationSiteCount,
  renderEvidenceMd,
  renderSourcesMd,
  renderUsageJson,
  tierCounts,
  type ParsedDataFile,
} from '../scripts/lib/render-views';
import registryJson from '../data/sources.json';
import usageView from '../src/ui/generated/source-usage.json';

const registry = sourcesRegistrySchema.parse(registryJson);
const usage = buildUsageMap();
const parsedFiles: ParsedDataFile[] = readDataFiles(dataRoot()).map((file) => ({
  relPath: file.relPath,
  json: JSON.parse(file.content) as unknown,
}));

describe('the live registry is honest', () => {
  test('zero honesty errors on the real data', () => {
    expect(registryHonestyErrors(registry, usage)).toEqual([]);
  });

  test('every load-bearing entry is actually cited, and vice versa', () => {
    for (const source of registry.sources) {
      expect(usage.has(source.id), source.id).toBe(source.tier === 'load-bearing');
    }
  });

  test('the counts the game displays match the data', () => {
    const counts = tierCounts(registry);
    expect(usageView.counts.loadBearing).toBe(counts['load-bearing']);
    expect(usageView.counts.background).toBe(counts.background);
    expect(usageView.counts.library).toBe(counts.library);
    expect(usageView.counts.citationSites).toBe(citationSiteCount(usage));
  });
});

describe('mutations are caught (the rules bite)', () => {
  test('a cited source demoted to library fails', () => {
    const mutated = structuredClone(registry);
    const cited = mutated.sources.find((s) => usage.has(s.id));
    if (!cited) throw new Error('no cited source in registry');
    cited.tier = 'library';
    delete cited.gameUse;
    cited.whyListed = 'now pretending to be shelf material';
    const errors = registryHonestyErrors(mutated, usage);
    expect(errors.some((e) => e.includes(cited.id) && e.includes('load-bearing'))).toBe(true);
  });

  test('an uncited source promoted to load-bearing fails', () => {
    const mutated = structuredClone(registry);
    const uncited = mutated.sources.find((s) => !usage.has(s.id));
    if (!uncited) throw new Error('no uncited source in registry');
    uncited.tier = 'load-bearing';
    delete uncited.shaped;
    delete uncited.whyListed;
    uncited.gameUse = 'claims a citation it does not have';
    const errors = registryHonestyErrors(mutated, usage);
    expect(errors.some((e) => e.includes(uncited.id) && e.includes('nothing in data/'))).toBe(true);
  });

  const TIER_FIELD = {
    'load-bearing': 'gameUse',
    background: 'shaped',
    library: 'whyListed',
  } as const;
  const CLAIM_FIELDS = ['gameUse', 'shaped', 'whyListed'] as const;

  test('vague phrasing fails on every claim field, every tier', () => {
    for (const [tier, field] of Object.entries(TIER_FIELD)) {
      const mutated = structuredClone(registry);
      const entry = mutated.sources.find((s) => s.tier === tier);
      if (!entry) throw new Error(`no ${tier} source in registry`);
      entry[field] =
        'This source informed our thinking, as general background.';
      const errors = registryHonestyErrors(mutated, usage);
      expect(
        errors.some((e) => e.includes(entry.id) && e.includes(field)),
        `${tier}.${field}`,
      ).toBe(true);
    }
  });

  test('schema: every tier requires its claim field and forbids the other two', () => {
    for (const [tier, required] of Object.entries(TIER_FIELD)) {
      const original = registry.sources.find((s) => s.tier === tier);
      if (!original) throw new Error(`no ${tier} source in registry`);

      const missing = structuredClone(original);
      delete missing[required];
      expect(sourceEntrySchema.safeParse(missing).success, `${tier} without ${required}`).toBe(
        false,
      );

      for (const field of CLAIM_FIELDS) {
        if (field === required) {
          continue;
        }
        const smuggled = structuredClone(original);
        smuggled[field] = 'a claim that does not belong on this tier';
        expect(sourceEntrySchema.safeParse(smuggled).success, `${tier} claiming ${field}`).toBe(
          false,
        );
      }
    }
  });

  test('registry changes surface as view drift', () => {
    const mutated = structuredClone(registry);
    const first = mutated.sources.find((s) => s.tier === 'load-bearing');
    if (!first) throw new Error('no load-bearing source');
    first.gameUse = 'a silently edited claim';
    expect(renderSourcesMd(mutated, usage)).not.toBe(renderSourcesMd(registry, usage));
    first.tier = 'background';
    expect(renderUsageJson(mutated, usage)).not.toBe(renderUsageJson(registry, usage));
  });

  test('an evidence-class flip surfaces as EVIDENCE.md drift', () => {
    const mutated = structuredClone(registry);
    const cited = mutated.sources.find(
      (s) => s.tier === 'load-bearing' && s.evidenceClass === 'empirical',
    );
    if (!cited) throw new Error('no empirical load-bearing source');
    cited.evidenceClass = 'forecast';
    expect(renderEvidenceMd(mutated, parsedFiles, usage)).not.toBe(
      renderEvidenceMd(registry, parsedFiles, usage),
    );
  });
});
