/**
 * Shared node-side helpers for locating and reading data files.
 * Used by validate-data, generate-schemas, and vite.config (dataVersion).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Absolute path of the repo's data/ directory (this file lives in scripts/lib/). */
export function dataRoot(): string {
  return new URL('../../data', import.meta.url).pathname;
}

export function listJsonFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...listJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      found.push(full);
    }
  }
  return found;
}

export interface DataFile {
  /** Path relative to data/, forward slashes. */
  relPath: string;
  absPath: string;
  content: string;
}

export function readDataFiles(dataRoot: string): DataFile[] {
  return listJsonFiles(dataRoot).map((absPath) => ({
    relPath: relative(dataRoot, absPath).split('\\').join('/'),
    absPath,
    content: readFileSync(absPath, 'utf8'),
  }));
}
