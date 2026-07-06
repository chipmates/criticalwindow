/**
 * The scripted half of source verification: HEAD-checks every registry URL and
 * reports breakage. Judgment about whether a source supports a value stays
 * human; this only proves the links are alive.
 *
 *   pnpm tsx scripts/check-links.ts            # all entries
 *   pnpm tsx scripts/check-links.ts --sample 20
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const registry = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'data', 'sources.json'), 'utf8'),
) as { sources: Array<{ id: string; url?: string; status: string }> };

const sampleArg = process.argv.indexOf('--sample');
let entries = registry.sources.filter((s) => s.url);
if (sampleArg > -1) {
  const n = Number(process.argv[sampleArg + 1] ?? 20);
  entries = entries.filter((_, i) => i % Math.ceil(entries.length / n) === 0);
}

let broken = 0;
for (const source of entries) {
  try {
    const res = await fetch(source.url as string, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    // Some hosts refuse HEAD; retry those as GET before judging.
    const ok =
      res.ok ||
      (res.status === 405 &&
        (await fetch(source.url as string, { signal: AbortSignal.timeout(15_000) })).ok);
    if (!ok) {
      broken += 1;
      console.log(`BROKEN ${res.status} ${source.id} ${source.url}`);
    }
  } catch {
    broken += 1;
    console.log(`UNREACHABLE ${source.id} ${source.url}`);
  }
}
console.log(`checked ${entries.length} of ${registry.sources.length} entries, ${broken} broken`);
process.exit(broken > 0 ? 1 : 0);
