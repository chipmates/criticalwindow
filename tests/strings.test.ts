import { expect, test } from 'vitest';
import strings from '../data/strings/en.json';

// en.json is the single source of user-facing text (i18n keys from day one).
// Keys are flat dot-paths ("app.title"); values are non-empty strings.
test('every string key is a dot-path with a non-empty value', () => {
  const entries = Object.entries(strings as Record<string, unknown>);
  expect(entries.length).toBeGreaterThan(0);
  for (const [key, value] of entries) {
    // Same pattern the schema enforces (numeric segments allowed: ticker.early.0).
    expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
  }
});

// Displayed-text voice rule (CLAUDE.md): no em dashes in anything the player reads.
test('no em dashes in displayed strings', () => {
  for (const value of Object.values(strings as Record<string, string>)) {
    expect(value).not.toContain('—');
  }
});
