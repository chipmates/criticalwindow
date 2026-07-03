/**
 * validate-data v0 (Block A1): every JSON file under data/ must parse.
 * Grows with the project: zod schemas + referential integrity (source IDs,
 * string keys, unique card ids) arrive with Blocks A3/B1. The iron rule
 * (no sourceless numbers in data/) is enforced here once schemas land.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dataRoot = new URL('../data', import.meta.url).pathname;

function collectJsonFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      found.push(full);
    }
  }
  return found;
}

const files = collectJsonFiles(dataRoot);
let failures = 0;

for (const file of files) {
  const label = relative(dataRoot, file);
  try {
    JSON.parse(readFileSync(file, 'utf8'));
    console.log(`ok   data/${label}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL data/${label}: ${String(error)}`);
  }
}

if (failures > 0) {
  console.error(`validate: ${failures} of ${files.length} data files failed to parse`);
  process.exit(1);
}
console.log(`validate: ${files.length} data files parsed (schema checks arrive with A3/B1)`);
