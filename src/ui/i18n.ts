/**
 * Minimal t(): flat dot-keys from data/strings, {name} interpolation.
 * Conventions in docs/i18n.md. Additional locales load as sibling JSON
 * files with English fallback; the machinery stays this small on purpose.
 */
import en from '../../data/strings/en.json';

export type StringKey = keyof typeof en;

const strings: Record<string, string> = en;

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let text = strings[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** Era-flavored ticker pools, resolved once. */
export function tickerPool(era: 'early' | 'mid' | 'late'): string[] {
  return Object.entries(strings)
    .filter(([key]) => key.startsWith(`ticker.${era}.`))
    .sort(([a], [b]) => Number(a.split('.')[2]) - Number(b.split('.')[2]))
    .map(([, value]) => value);
}

/** Resolve a "strings:foo.bar" reference from game data. */
export function tRef(ref: string, vars?: Record<string, string | number>): string {
  return t(ref.replace(/^strings:/, '') as StringKey, vars);
}
