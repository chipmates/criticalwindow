import { describe, expect, test } from 'vitest';
import { canonicalJson, hashDataFiles, hashJsonValue, hashString } from '../src/engine/hash';

describe('canonicalJson', () => {
  test('key order never matters', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  test('nested objects sort recursively', () => {
    expect(canonicalJson({ z: { y: 1, x: 2 }, a: [3, { c: 1, b: 2 }] })).toBe(
      '{"a":[3,{"b":2,"c":1}],"z":{"x":2,"y":1}}',
    );
  });

  test('undefined object members are dropped (JSON.stringify semantics)', () => {
    expect(canonicalJson({ a: 1, gone: undefined })).toBe('{"a":1}');
  });

  test('top-level undefined and non-finite numbers are rejected', () => {
    expect(() => canonicalJson(undefined)).toThrow();
    expect(() => canonicalJson({ a: Number.NaN })).toThrow();
    expect(() => canonicalJson({ a: Infinity })).toThrow();
  });

  test('strings with quotes and unicode round through JSON.stringify', () => {
    expect(canonicalJson('he said "hi"')).toBe(JSON.stringify('he said "hi"'));
  });
});

describe('hashString', () => {
  test('stable across calls and sensitive to input', () => {
    const a = hashString('race-conditions');
    expect(hashString('race-conditions')).toBe(a);
    expect(hashString('race-conditionz')).not.toBe(a);
    expect(hashString('race-conditions', 1)).not.toBe(a);
  });

  test('produces integers within 53 bits', () => {
    const h = hashString('anything at all');
    expect(Number.isSafeInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

describe('hashJsonValue / hashDataFiles', () => {
  test('structurally equal values hash identically', () => {
    expect(hashJsonValue({ a: 1, b: [1, 2] })).toBe(hashJsonValue({ b: [1, 2], a: 1 }));
  });

  test('data file order never matters, content always does', () => {
    const v1 = hashDataFiles([
      { path: 'a.json', content: '{}' },
      { path: 'b.json', content: '[]' },
    ]);
    const v2 = hashDataFiles([
      { path: 'b.json', content: '[]' },
      { path: 'a.json', content: '{}' },
    ]);
    const v3 = hashDataFiles([
      { path: 'a.json', content: '{ }' },
      { path: 'b.json', content: '[]' },
    ]);
    expect(v2).toBe(v1);
    expect(v3).not.toBe(v1);
  });
});
