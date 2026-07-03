/**
 * Regenerate data/schemas/*.schema.json from the zod definitions.
 * Data files reference them via "$schema" for editor autocomplete, so
 * non-coders get inline validation while editing event cards.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildJsonSchemas } from './lib/schema-json';

const outDir = new URL('../data/schemas', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const schemas = buildJsonSchemas();
for (const [file, content] of Object.entries(schemas)) {
  writeFileSync(join(outDir, file), content);
  console.log(`wrote data/schemas/${file}`);
}
