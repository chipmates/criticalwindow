/**
 * pnpm sources-md — render SOURCES.md from data/sources.json.
 * The JSON registry is the single source of truth; the markdown is a view.
 * Regenerate after every registry change (validate flags drift).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sourcesRegistrySchema, type SourceEntry } from '../src/engine/schemas';
import { dataRoot } from './lib/data-files';

const registry = sourcesRegistrySchema.parse(
  JSON.parse(readFileSync(join(dataRoot(), 'sources.json'), 'utf8')),
);

const STATUS_BADGE: Record<SourceEntry['status'], string> = {
  verified: '',
  pending: ' *(verification pending)*',
  flagged: ' *(link broken, replacement wanted)*',
  book: ' *(book, obtain manually)*',
};

function entryLine(source: SourceEntry): string {
  const who = [source.authors, source.org].filter(Boolean).join(', ');
  const year = source.year ? ` (${source.year})` : '';
  const title = source.url ? `[${source.title}](${source.url})` : source.title;
  const use = source.gameUse ? `. ${source.gameUse}` : '';
  return `- **${source.id}** · ${title}${who ? ` · ${who}` : ''}${year}${use}${STATUS_BADGE[source.status]}`;
}

const byTag = new Map<string, SourceEntry[]>();
for (const source of registry.sources) {
  const primary = source.tags?.[0] ?? 'general';
  const list = byTag.get(primary) ?? [];
  list.push(source);
  byTag.set(primary, list);
}

const sections = [...byTag.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([tag, sources]) => {
    const lines = sources.map(entryLine).join('\n');
    return `## ${tag}\n\n${lines}`;
  })
  .join('\n\n');

const counts = registry.sources.reduce<Record<string, number>>((acc, s) => {
  acc[s.status] = (acc[s.status] ?? 0) + 1;
  return acc;
}, {});

const header = `# Sources

The evidence base. Machine-readable registry: [\`data/sources.json\`](data/sources.json)
(this file is generated from it; do not edit by hand, run \`pnpm sources-md\`).

Every number in \`data/\` cites an entry here by ID, and \`pnpm validate\` enforces it.
Found a dead link or a better source? Open a "source check" issue. That is a real
contribution and it is welcome.

${registry.sources.length} entries. Status: ${Object.entries(counts)
  .sort()
  .map(([k, v]) => `${v} ${k}`)
  .join(', ')}.
`;

writeFileSync(new URL('../SOURCES.md', import.meta.url).pathname, `${header}\n${sections}\n`);
console.log(`SOURCES.md: ${registry.sources.length} entries rendered`);
