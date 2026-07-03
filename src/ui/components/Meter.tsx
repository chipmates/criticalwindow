interface MeterProps {
  label: string;
  value: number;
  max?: number;
  token: string;
  trend?: number;
}

export function Meter({ label, value, max = 1000, token, trend = 0 }: MeterProps) {
  const arrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '–';
  const trendClass = trend > 0 ? 'meter-up' : trend < 0 ? 'meter-down' : 'meter-flat';
  return (
    <div
      className="meter"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <span className="meter-label">{label}</span>
      <span className="meter-bar">
        <span
          className="meter-fill"
          style={{ width: `${(value / max) * 100}%`, background: `var(${token})` }}
        />
      </span>
      <span className="meter-value">{value}</span>
      <span className={`meter-trend ${trendClass}`} aria-hidden="true">
        {arrow}
      </span>
    </div>
  );
}
