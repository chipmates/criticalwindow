/**
 * Renderers for every generated view of the source registry:
 *   SOURCES.md                        (repo root, human-readable map)
 *   docs/EVIDENCE.md                  (every cited number, with its evidence)
 *   src/ui/generated/source-usage.json (the in-game Sources screen's map)
 *
 * All three are pure functions of data/, rendered through this one module,
 * so the published counts can never disagree. generate-source-views.ts
 * writes them; validate-data.ts fails CI when a committed copy drifts.
 * No timestamps: output must be reproducible from data alone.
 */
import type { SourceEntry, SourcesRegistryData } from '../../src/engine/schemas';
import { formatUse, type UsageMap } from './source-usage';

const TIER_HEADING: Record<SourceEntry['tier'], string> = {
  'load-bearing': 'Sources that drive numbers',
  background: 'Sources that shaped the design',
  library: 'The library: further reading',
};

const STATUS_BADGE: Record<SourceEntry['status'], string> = {
  verified: '',
  pending: ' *(verification pending)*',
  flagged: ' *(link broken, replacement wanted)*',
  book: ' *(book, obtain manually)*',
};

/** Max citation sites listed per entry before folding into "+N more". */
const MAX_SITES = 6;

function entryLine(source: SourceEntry): string {
  const who = [source.authors, source.org].filter(Boolean).join(', ');
  const year = source.year ? ` (${source.year})` : '';
  const title = source.url ? `[${source.title}](${source.url})` : source.title;
  // Flagged entries name their own limitation instead of a generic badge.
  const badge =
    source.status === 'flagged' && source.flagReason
      ? ` *(flagged: ${source.flagReason})*`
      : STATUS_BADGE[source.status];
  return `- **${source.id}** · ${title}${who ? ` · ${who}` : ''}${year} · \`${source.evidenceClass}\`${badge}`;
}

function citedSites(source: SourceEntry, usage: UsageMap): string {
  const uses = usage.get(source.id) ?? [];
  const shown = uses.slice(0, MAX_SITES).map(formatUse);
  const more = uses.length > MAX_SITES ? ` *(+${uses.length - MAX_SITES} more)*` : '';
  return `${shown.join(' · ')}${more}`;
}

export function tierCounts(registry: SourcesRegistryData): Record<SourceEntry['tier'], number> {
  const counts = { 'load-bearing': 0, background: 0, library: 0 };
  for (const source of registry.sources) {
    counts[source.tier] += 1;
  }
  return counts;
}

export function citationSiteCount(usage: UsageMap): number {
  let total = 0;
  for (const uses of usage.values()) {
    total += uses.length;
  }
  return total;
}

// ---------------------------------------------------------------------------
// SOURCES.md
// ---------------------------------------------------------------------------

export function renderSourcesMd(registry: SourcesRegistryData, usage: UsageMap): string {
  const counts = tierCounts(registry);
  const sites = citationSiteCount(usage);
  const selfSites = usage.get('SRC-DESIGN-HANDOVER')?.length ?? 0;

  const loadBearing = registry.sources
    .filter((s) => s.tier === 'load-bearing')
    .sort((a, b) => (usage.get(b.id)?.length ?? 0) - (usage.get(a.id)?.length ?? 0));
  const background = registry.sources.filter((s) => s.tier === 'background');
  const library = registry.sources.filter((s) => s.tier === 'library');

  const loadBearingSection = loadBearing
    .map((source) => {
      const uses = usage.get(source.id) ?? [];
      return [
        `${entryLine(source)}`,
        `  Used for: ${source.gameUse ?? ''}`,
        `  Cited ${uses.length}× by: ${citedSites(source, usage)}`,
      ].join('\n');
    })
    .join('\n');

  const backgroundSection = background
    .map((source) => `${entryLine(source)}\n  Shaped: ${source.shaped ?? ''}`)
    .join('\n');

  const byTag = new Map<string, SourceEntry[]>();
  for (const source of library) {
    const primary = source.tags?.[0] ?? 'general';
    const list = byTag.get(primary) ?? [];
    list.push(source);
    byTag.set(primary, list);
  }
  const librarySection = [...byTag.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([tag, sources]) =>
        `### ${tag}\n\n${sources
          .map((source) => `${entryLine(source)}\n  Why it is here: ${source.whyListed ?? ''}`)
          .join('\n')}`,
    )
    .join('\n\n');

  const statusCounts = registry.sources.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return `# Sources

The evidence base, mapped. Machine-readable registry: [\`data/sources.json\`](data/sources.json)
(this file is generated from it, do not edit by hand, run \`pnpm sources-md\`).

The map runs in both directions and \`pnpm validate\` enforces it in CI: a number
in \`data/\` without a source ID fails the build, and so does a registry entry that
claims a tier its citations do not support. [\`docs/EVIDENCE.md\`](docs/EVIDENCE.md)
lists every cited number with its evidence.

**${registry.sources.length} entries. ${counts['load-bearing'] - 1} external sources drive numbers directly (${sites - selfSites} citation sites). Game-design constants cite the project's own [design constitution](docs/DESIGN.md) instead (${selfSites} sites), and those are always labeled \`design\`, never counted as outside evidence. ${counts.background} more sources shaped the design, ${counts.library} are further reading.**
Status: ${Object.entries(statusCounts)
    .sort()
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')}.

What the statuses mean: \`verified\` says the link was fetched and the title and
authors matched this entry (July 2026, scripted fetches plus hand checks; where
a publisher blocks robots, the entry's note says so and the check was manual).
\`flagged\` names its own limitation on the entry. \`book\` means a library copy.
One honest limit, stated plainly: the machine proves every citation exists and
every tier is real. Whether a source truly supports a value is human work, and
the challenge loop exists exactly for that.

Every entry carries an evidence class: \`empirical\` (a measurement or documented
fact), \`forecast\` (a claim about the future), \`analysis\` (an argument or
framework), \`design\` (a game-design decision, no claim about the world).
The most contested dials, how hard alignment is and how fast capability
compounds, never become single numbers: they live as ranges inside worldview
presets, and a seeded hidden roll picks the truth inside the range you chose.

Found a dead link, a better source, or a number you want to challenge? Open an
issue. That is a real contribution and it is welcome, see
[\`CONTRIBUTING.md\`](CONTRIBUTING.md).

## ${TIER_HEADING['load-bearing']} (${counts['load-bearing']})

Every entry lists each place it is cited. Sorted by citation count.

${loadBearingSection}

## ${TIER_HEADING.background} (${counts.background})

These shaped a mechanic without backing one specific number. Each states which
mechanic, checkably. Wiring one of these to an actual number is a welcome PR.

${backgroundSection}

## ${TIER_HEADING.library} (${counts.library})

No usage claim. This is the shelf we read from and the shelf we recommend,
grouped by topic.

${librarySection}
`;
}

// ---------------------------------------------------------------------------
// docs/EVIDENCE.md — every cited number, grouped by data file
// ---------------------------------------------------------------------------

export interface ParsedDataFile {
  relPath: string;
  json: unknown;
}

interface EvidenceRow {
  path: string;
  numbers: string;
  note: string;
  sourceIds: string[];
}

/** Files rendered as full number tables; everything else gets compact rows. */
const DETAILED_FILES = new Set(['parameters.json', 'anchors.json', 'seats.json']);

function collectRows(value: unknown, path: string, out: EvidenceRow[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectRows(item, `${path}[${i}]`, out));
    return;
  }
  if (value === null || typeof value !== 'object') {
    return;
  }
  const node = value as Record<string, unknown>;
  if (Array.isArray(node.sourceIds)) {
    let numbers = Object.entries(node)
      .filter((pair): pair is [string, number] => typeof pair[1] === 'number')
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ');
    // Anchor tracks carry labeled rungs, not a single value; say what is there.
    if (!numbers && Array.isArray(node.anchors)) {
      numbers = `${node.anchors.length} labeled rungs${node.unit ? ' plus a continuous real-world unit mapping' : ''}`;
    }
    out.push({
      path: path || '(root)',
      numbers,
      note: typeof node.note === 'string' ? node.note : '',
      sourceIds: node.sourceIds.filter((id): id is string => typeof id === 'string'),
    });
  }
  for (const [key, child] of Object.entries(node)) {
    if (key === 'sourceIds') {
      continue;
    }
    collectRows(child, path ? `${path}.${key}` : key, out);
  }
}

function classOf(registry: SourcesRegistryData): Map<string, SourceEntry['evidenceClass']> {
  return new Map(registry.sources.map((s) => [s.id, s.evidenceClass]));
}

/** A row's kind, derived from the evidence classes of the sources it cites. */
function rowKind(sourceIds: string[], classes: Map<string, SourceEntry['evidenceClass']>): string {
  const set = new Set(sourceIds.map((id) => classes.get(id)).filter(Boolean));
  if (set.size > 0 && [...set].every((c) => c === 'design')) {
    return 'design choice';
  }
  if (set.has('forecast')) {
    return 'forecast-based';
  }
  if (set.has('analysis')) {
    return 'analysis-based';
  }
  // An empirical base with a design-class citation on top means the magnitude
  // was calibrated, not read off the source; the badge must not hide that.
  if (set.has('design')) {
    return 'measured, design-tuned';
  }
  return 'measured';
}

function mdEscape(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function renderEvidenceMd(
  registry: SourcesRegistryData,
  files: ParsedDataFile[],
  usage: UsageMap,
): string {
  const classes = classOf(registry);
  const kindTotals = new Map<string, number>();
  const sections: string[] = [];
  let paramRowCount = 0;
  let cardRowCount = 0;

  const ordered = [...files]
    .filter((f) => f.relPath !== 'sources.json' && !f.relPath.startsWith('schemas/'))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  // Group card directories into one section each.
  const groups = new Map<string, ParsedDataFile[]>();
  for (const file of ordered) {
    const top = file.relPath.includes('/') ? `${file.relPath.split('/')[0]}/` : file.relPath;
    const list = groups.get(top) ?? [];
    list.push(file);
    groups.set(top, list);
  }

  for (const [groupName, groupFiles] of groups) {
    const rows: Array<EvidenceRow & { file: string }> = [];
    for (const file of groupFiles) {
      const fileRows: EvidenceRow[] = [];
      collectRows(file.json, '', fileRows);
      for (const row of fileRows) {
        rows.push({ ...row, file: file.relPath });
      }
    }
    if (rows.length === 0) {
      continue;
    }
    const detailed = groupFiles.every((f) => DETAILED_FILES.has(f.relPath));
    for (const row of rows) {
      if (detailed) {
        const kind = rowKind(row.sourceIds, classes);
        kindTotals.set(kind, (kindTotals.get(kind) ?? 0) + 1);
        paramRowCount += 1;
      } else {
        cardRowCount += 1;
      }
    }
    const header = detailed
      ? '| Where | Numbers | Kind | Sources | How the number was derived |\n|---|---|---|---|---|'
      : '| Where | Premise kind | Sources |\n|---|---|---|';
    const body = rows
      .map((row) => {
        const where = groupFiles.length > 1 ? `${row.file} → ${row.path}` : row.path;
        const sources = row.sourceIds.join(', ');
        const kind = rowKind(row.sourceIds, classes);
        if (!detailed) {
          // Cards cite the real-world premise they dramatize; the effect
          // magnitudes are balance-tuned design values unless a note says more.
          return `| ${mdEscape(where)} | ${kind} premise | ${sources} |`;
        }
        let note = row.note;
        if (!note) {
          note =
            kind === 'design choice'
              ? 'design constant; the constitution is the derivation'
              : '⚠ derivation note missing';
        }
        return `| ${mdEscape(where)} | ${mdEscape(row.numbers)} | ${kind} | ${sources} | ${mdEscape(note)} |`;
      })
      .join('\n');
    sections.push(`## ${groupName}\n\n${header}\n${body}`);
  }

  const kindSummary = [...kindTotals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, n]) => `- **${n}** ${kind}`)
    .join('\n');

  return `# Where the numbers come from

Every cited value in \`data/\`, with its evidence. Generated from the data files,
do not edit by hand, run \`pnpm sources-md\`. Registry with full source details:
[\`SOURCES.md\`](../SOURCES.md).

How a number gets into this game: a claim from the literature becomes an honest
range, contested ranges live inside worldview presets you pick at setup, and a
seeded hidden roll fixes the truth for your run inside that range. Design
constants with no real-world referent cite the design constitution and say so. The
iron rule: no number ships without a source ID, \`pnpm validate\` fails CI
otherwise. Run it yourself.

**${paramRowCount} cited parameter values and ${cardRowCount} cited card premises, across ${citationSiteCount(usage)} citation sites.** Parameter values by kind:

${kindSummary}

A **measured** value cites only empirical evidence, and **measured,
design-tuned** means an empirical base whose game magnitude we calibrated, with
the note saying how. A **forecast-based** or **analysis-based** value rests on
somebody's argument rather than a measurement; the most contested of these,
alignment difficulty and takeoff speed, sit as ranges inside worldview presets
rather than pretending to be facts, and the rest say in their note what they
take from the argument. A **design choice** claims nothing about the world.

Card premises are counted separately on purpose: a card's citations back the
real-world event it dramatizes, while its effect magnitudes are balance-tuned
design values unless a note says otherwise. No card premise is ever counted as
a measured value.

## Five worked examples, source figure to game value

The tables below are complete; these five show the transformation step by step.

1. **Starting compute 700.** The scenario opens the US seat at 700 of 1000. The compute
   track's unit mapping (anchors.json) reads 700 as roughly 65% of the world's frontier
   training capacity, the cited compute dataset's picture of the US share; the index
   point is the mapping, not a measurement of its own.
2. **Capability pacing (curves.capabilityPerRnd).** The cited analyses report training
   compute doubling roughly every six months and the 50% task horizon doubling every
   188 days on the all-time fit. The curve compresses that regime onto the 0-1000
   index so an all-in racer reaches threshold resolution around turn 10 of 16; the
   compression ratio is the design decision, and it cites the constitution.
3. **Eval band floor (evalUncertainty.floorBandWidth 100).** The deception literature
   reports near-99% true-trigger rates against ~0 red-team detection, and 55% real
   misalignment reading as 6.5% in evals. No paper says "100 points"; the floor is a
   design-tuned translation of "the band never closes," rounded to the game's
   multiple-of-50 rule, and badged design-tuned accordingly.
4. **Displacement curve knee.** The cited exposure work puts about 40% of global
   employment exposed to AI. The curve turns exposure into equilibrium displacement
   rising with capability; the knee's position was calibrated in play so early-game
   displacement rises instead of falling, and the note says so.
5. **Starting energy 450.** The cited projections put datacenter electricity demand
   rising from about 415 TWh toward about 945 TWh by 2030. The energy track reads 450
   as roughly 40 GW of grid headroom for new AI load: the 2026 reality, with the
   squeeze still ahead.

Disagree with a value? Open a "challenge a number" issue with a source.
Realism disputes are decided by the maintainer in public issues today; if the
project earns an advisory board, it takes that role.
See [\`GOVERNANCE.md\`](../GOVERNANCE.md).

${sections.join('\n\n')}
`;
}

// ---------------------------------------------------------------------------
// src/ui/generated/source-usage.json — the in-game map
// ---------------------------------------------------------------------------

export function renderUsageJson(registry: SourcesRegistryData, usage: UsageMap): string {
  const counts = tierCounts(registry);
  const uses: Record<string, string[]> = {};
  for (const source of registry.sources) {
    const sites = usage.get(source.id);
    if (sites) {
      uses[source.id] = sites.map(formatUse);
    }
  }
  return `${JSON.stringify(
    {
      comment: 'Generated by pnpm sources-md; validate-data flags drift. Do not edit.',
      counts: {
        loadBearing: counts['load-bearing'],
        background: counts.background,
        library: counts.library,
        citationSites: citationSiteCount(usage),
      },
      uses,
    },
    null,
    2,
  )}\n`;
}
