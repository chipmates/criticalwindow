import sourcesJson from '../../../data/sources.json';
import { useStore } from '../store';

interface SourceEntry {
  id: string;
  title: string;
}

/** id -> human title, resolved once from the bundled source list. */
const TITLES: Record<string, string> = Object.fromEntries(
  (sourcesJson as unknown as { sources: SourceEntry[] }).sources.map((s) => [s.id, s.title]),
);

/**
 * A raw SRC- id has no meaning to a player. This renders the source's title
 * as a small chip that jumps to the evidence map with the search prefilled.
 * The raw id stays on the title= attribute so auditors can still read it.
 */
export function SourceChip({ id }: { id: string }) {
  const goTo = useStore((s) => s.goTo);
  const setSourcesQuery = useStore((s) => s.setSourcesQuery);
  const label = TITLES[id] ?? id;
  return (
    <button
      type="button"
      className="source-chip"
      title={id}
      onClick={() => {
        setSourcesQuery(label);
        goTo('sources');
      }}
    >
      {label}
    </button>
  );
}

/** A wrapped row of source chips from a de-duplicated id list. */
export function SourceChips({ ids }: { ids: string[] }) {
  const unique = [...new Set(ids)];
  return (
    <p className="source-chips">
      {unique.map((id) => (
        <SourceChip key={id} id={id} />
      ))}
    </p>
  );
}
