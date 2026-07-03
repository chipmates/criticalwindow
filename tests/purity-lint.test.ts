/**
 * The purity boundary must FIRE, not just exist. This test plants a
 * deliberate violation inside src/engine/ and expects eslint to reject it.
 * If this test ever passes with a green lint, the constitution's teeth
 * fell out silently.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const VIOLATION = `export function bad(): number {
  return Math.random() + Date.now() + Math.exp(1);
}
`;

describe('engine purity lint', () => {
  test('a deliberate violation in src/engine fails eslint', () => {
    // Unique name so parallel runs never collide; cleaned in finally.
    const scratch = mkdtempSync(join(tmpdir(), 'purity-'));
    const violationPath = join(process.cwd(), 'src', 'engine', '__purity_violation.test-only.ts');
    writeFileSync(violationPath, VIOLATION);
    try {
      let failed = false;
      let output = '';
      try {
        execFileSync('pnpm', ['exec', 'eslint', violationPath], {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        failed = true;
        output = String((error as { stdout?: string }).stdout ?? '');
      }
      expect(failed).toBe(true);
      expect(output).toContain('Math.random');
      expect(output).toContain('Date.now');
      expect(output).toContain('Math.exp');
    } finally {
      rmSync(violationPath, { force: true });
      rmSync(scratch, { recursive: true, force: true });
    }
  }, 30_000);
});
