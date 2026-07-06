/**
 * The reverse citation map: for every source id, exactly where it is cited.
 * Single ground truth shared by validate-data, generate-sources-md,
 * generate-evidence and the game's usage JSON, so published counts can
 * never disagree with each other.
 *
 * "Cited" means: appears in a structured sourceIds array in a data file.
 * Prose mentions do not count; the iron rule is about numbers, not name-drops.
 */
import { collectSourceIds } from '../../src/engine/data';
import { dataRoot, readDataFiles } from './data-files';

export interface SourceUse {
  /** Data file, relative to data/ (e.g. "parameters.json"). */
  file: string;
  /** JSON path of the citing sourceIds array within the file. */
  path: string;
}

export type UsageMap = Map<string, SourceUse[]>;

/** Files that hold definitions, not citations. */
function isCitable(relPath: string): boolean {
  return relPath !== 'sources.json' && !relPath.startsWith('schemas/');
}

export function buildUsageMap(root: string = dataRoot()): UsageMap {
  const usage: UsageMap = new Map();
  for (const file of readDataFiles(root)) {
    if (!isCitable(file.relPath)) {
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(file.content);
    } catch {
      continue; // validate-data reports parse errors; not this module's job
    }
    const refs: Array<{ id: string; path: string }> = [];
    collectSourceIds(json, '', refs);
    for (const ref of refs) {
      if (ref.id === 'TODO-SOURCE') {
        continue;
      }
      const list = usage.get(ref.id) ?? [];
      list.push({ file: file.relPath, path: ref.path });
      usage.set(ref.id, list);
    }
  }
  return usage;
}

/** Human-readable citation site, e.g. "parameters.json → worldviewPresets.cautious.alignmentDifficulty". */
export function formatUse(use: SourceUse): string {
  const path = use.path.replace(/\.sourceIds$/, '').replace(/\[(\d+)\]/g, '.$1');
  return path ? `${use.file} → ${path}` : use.file;
}
