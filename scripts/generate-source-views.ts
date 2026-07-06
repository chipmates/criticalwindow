/**
 * pnpm sources-md — render every generated view of the source registry:
 * SOURCES.md, docs/EVIDENCE.md, src/ui/generated/source-usage.json.
 * data/ is the single source of truth; these are views. Regenerate after
 * every data change (validate-data fails CI on drift).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { sourcesRegistrySchema } from '../src/engine/schemas';
import { dataRoot, readDataFiles } from './lib/data-files';
import { buildUsageMap } from './lib/source-usage';
import {
  renderEvidenceMd,
  renderSourcesMd,
  renderUsageJson,
  type ParsedDataFile,
} from './lib/render-views';

const root = dataRoot();
const registry = sourcesRegistrySchema.parse(
  JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8')),
);
const usage = buildUsageMap(root);
const parsedFiles: ParsedDataFile[] = readDataFiles(root).map((file) => ({
  relPath: file.relPath,
  json: JSON.parse(file.content) as unknown,
}));

const outputs: Array<[string, string]> = [
  [new URL('../SOURCES.md', import.meta.url).pathname, renderSourcesMd(registry, usage)],
  [
    new URL('../docs/EVIDENCE.md', import.meta.url).pathname,
    renderEvidenceMd(registry, parsedFiles, usage),
  ],
  [
    new URL('../src/ui/generated/source-usage.json', import.meta.url).pathname,
    renderUsageJson(registry, usage),
  ],
];

for (const [path, content] of outputs) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${path.slice(path.indexOf('criticalwindow/') + 'criticalwindow/'.length)}`);
}
