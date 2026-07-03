/**
 * The color system's accessibility claims, enforced. Parses the token file
 * and computes WCAG 2.x contrast ratios for every declared ink/surface
 * pairing per theme. A palette tweak that breaks AA fails CI, which is
 * what "WCAG AA contrast" means as a constitution instead of a hope.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('../src/ui/theme.css', import.meta.url), 'utf8');

function themeBlock(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start, `selector ${selector} present`).toBeGreaterThanOrEqual(0);
  const open = css.indexOf('{', start);
  let depth = 1;
  let i = open + 1;
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    i += 1;
  }
  const body = css.slice(open + 1, i - 1);
  const vars: Record<string, string> = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    vars[match[1]!] = match[2]!.trim();
  }
  return vars;
}

// :root holds light tokens (plus shared); dark/contrast override.
const light = themeBlock(':root {');
const dark = { ...light, ...themeBlock(":root[data-theme='dark']") };
const contrast = { ...light, ...themeBlock(":root[data-theme='contrast']") };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]: [number, number, number]): number {
  const chan = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function ratio(a: string, b: string): number {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES: Array<[string, Record<string, string>]> = [
  ['light', light],
  ['dark', dark],
  ['contrast', contrast],
];

describe.each(THEMES)('theme %s', (_name, t) => {
  const surfaces = ['--bg', '--surface', '--surface-raised', '--surface-sunken'];

  test('body ink reads at AA (4.5:1) on every surface', () => {
    for (const surface of surfaces) {
      expect(ratio(t['--ink']!, t[surface]!), `--ink on ${surface}`).toBeGreaterThanOrEqual(4.5);
      expect(
        ratio(t['--ink-muted']!, t[surface]!),
        `--ink-muted on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('faint ink still reads at large-text AA (3:1)', () => {
    for (const surface of surfaces) {
      expect(
        ratio(t['--ink-faint']!, t[surface]!),
        `--ink-faint on ${surface}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test('accent and danger buttons read at AA', () => {
    expect(ratio(t['--accent-ink']!, t['--accent']!)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--danger-ink']!, t['--danger']!)).toBeGreaterThanOrEqual(4.5);
    // Accent used as text on surfaces (links, highlights): large-text AA.
    expect(ratio(t['--accent']!, t['--surface']!)).toBeGreaterThanOrEqual(3);
  });

  test('status colors read at 3:1 (always paired with labels)', () => {
    for (const token of ['--good', '--warn', '--danger']) {
      expect(ratio(t[token]!, t['--surface']!), `${token} on surface`).toBeGreaterThanOrEqual(3);
    }
  });

  test('meter colors hit 3:1 against their surfaces (labels carry meaning)', () => {
    const meters = Object.keys(t).filter((k) => k.startsWith('--m-'));
    expect(meters.length).toBe(8);
    for (const meter of meters) {
      expect(ratio(t[meter]!, t['--surface']!), `${meter} on surface`).toBeGreaterThanOrEqual(3);
    }
  });

  test('focus ring reads at 3:1 against every surface', () => {
    for (const surface of surfaces) {
      expect(ratio(t['--focus']!, t[surface]!), `focus on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
});
