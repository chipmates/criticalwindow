/**
 * The registry-honesty rules, extracted so the test suite can mutation-test
 * them: a tier is declared in sources.json but proven by the citation map,
 * and usage claims must be specific enough to check. The vague-phrase lint here
 * is deliberately blunt: it catches the worst offenders, and human review
 * catches the rest. Nobody should mistake a blocklist for understanding.
 */
import type { SourcesRegistryData } from '../../src/engine/schemas';
import type { UsageMap } from './source-usage';

const VAGUE_PHRASES = [
  'informed our thinking',
  'provided context',
  'general background',
  'influenced the design',
  'shaped our approach',
];

export function registryHonestyErrors(registry: SourcesRegistryData, usage: UsageMap): string[] {
  const errors: string[] = [];
  for (const source of registry.sources) {
    const cited = usage.has(source.id);
    if (cited && source.tier !== 'load-bearing') {
      errors.push(
        `sources: '${source.id}' is cited by data files but declares tier '${source.tier}'; it is load-bearing`,
      );
    }
    if (!cited && source.tier === 'load-bearing') {
      errors.push(`sources: '${source.id}' declares load-bearing but nothing in data/ cites it`);
    }
    for (const field of ['gameUse', 'shaped', 'whyListed'] as const) {
      const text = source[field];
      if (!text) {
        continue;
      }
      for (const phrase of VAGUE_PHRASES) {
        if (text.toLowerCase().includes(phrase)) {
          errors.push(
            `sources: '${source.id}' ${field} says '${phrase}'; name the mechanic instead`,
          );
        }
      }
    }
  }
  return errors;
}
