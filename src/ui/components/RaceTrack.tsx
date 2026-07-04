import strings from '../../../data/strings/en.json';
import { anchorFor } from '../anchors';
import './race-track.css';

interface RaceTrackProps {
  you: number;
  rival: number;
  fogFrom: number;
  threshold: number;
  /** Current eval band width (0..1000): drawn as the halo around your marker. */
  bandWidth: number;
}

/**
 * The centerpiece. A single horizontal strip that makes takeaways 1 and 2
 * visible in one glance: two markers racing toward a fog-shrouded threshold,
 * and your own marker wearing its uncertainty as a halo. The wider your eval
 * band, the fuzzier your position in risk-space reads. CSS only.
 */
export function RaceTrack({ you, rival, fogFrom, threshold, bandWidth }: RaceTrackProps) {
  const pct = (v: number): string => `${(v / threshold) * 100}%`;
  const haloPct = Math.max(4, (bandWidth / threshold) * 100);
  const label = strings['a11y.raceTrack']
    .replace('{you}', String(you))
    .replace('{rival}', String(rival))
    .replace('{fog}', String(fogFrom));

  return (
    <figure className="race" role="img" aria-label={label}>
      <div className={you >= fogFrom - 120 ? 'race-lane race-lane-infog' : 'race-lane'}>
        <div className="race-rail" />
        <div className="race-fog" style={{ left: pct(fogFrom) }}>
          <span className="race-fog-label" aria-hidden="true">
            {strings['race.fog']}
          </span>
        </div>
        <div
          className="race-halo"
          style={{ left: pct(you), width: `${haloPct}%` }}
          aria-hidden="true"
        />
        <div className="race-marker race-marker-you" style={{ left: pct(you) }}>
          <span className="race-marker-flag">{strings['race.you']}</span>
          <span className="race-marker-pin" aria-hidden="true" />
        </div>
        <div className="race-marker race-marker-rival" style={{ left: pct(rival) }}>
          <span className="race-marker-pin" aria-hidden="true" />
          <span className="race-marker-flag">{strings['race.rival']}</span>
        </div>
        <div className="race-ticks" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className={i % 5 === 0 ? 'race-tick race-tick-major' : 'race-tick'} />
          ))}
        </div>
      </div>
      {/* The capability scale in human terms: the METR task-horizon ladder. */}
      <div className="race-horizon" aria-hidden="true">
        {[500, 700, 900].map((at) => (
          <span key={at} className="race-horizon-tick" style={{ left: pct(at) }}>
            {anchorFor('capability', at)}
          </span>
        ))}
      </div>
      <p className="race-horizon-now">{anchorFor('capability', you)}</p>
    </figure>
  );
}
