import "./charts.css";

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

/** Colorful donut chart, pure SVG (no extra chart dependency needed). */
export function DonutChart({ data, size = 120 }: { data: ChartDatum[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dash = fraction * circumference;
    const seg = { ...d, dash, gap: circumference - dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={15}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={15}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="donut__seg"
          />
        ))}
      </svg>
      <div className="donut__center">
        <strong>{total}</strong>
        <span>total</span>
      </div>
    </div>
  );
}

/** Horizontal gradient bar list, e.g. for "by role" / "by source" breakdowns. */
export function BarList({ data }: { data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bar-list">
      {data.map((d, i) => (
        <div className="bar-list__row" key={i}>
          <span className="bar-list__label">{d.label}</span>
          <div className="bar-list__track">
            <div
              className="bar-list__fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color,
              }}
            />
          </div>
          <span className="bar-list__value">{d.value}</span>
        </div>
      ))}
      {data.length === 0 && <p className="bar-list__empty">No data yet.</p>}
    </div>
  );
}

/**
 * Stage-by-stage progress bars: each pipeline stage gets its own row with
 * a label, a rounded horizontal bar sized to its share of the first
 * stage's count, the raw count, and (for every stage after the first) a
 * small drop-off badge showing the percentage lost since the previous
 * stage. This reads like a scannable list rather than an illustrative
 * "funnel" shape.
 *
 * "Rejected" is a side-exit, not a forward stage, so it's passed
 * separately and rendered as its own outcome chip beneath the stage list.
 */
export function StageFunnelChart({
  data,
  reject,
}: {
  data: ChartDatum[];
  reject?: ChartDatum;
}) {
  const base = Math.max(1, data[0]?.value ?? 0, ...data.map((d) => d.value));
  const MIN_FRAC = 6;

  return (
    <div className="sfunnel">
      <div className="sfunnel__rows">
        {data.map((d, i) => {
          const widthPct = Math.max(MIN_FRAC, Math.round((d.value / base) * 100));
          const prevValue = i > 0 ? data[i - 1].value : d.value;
          const dropOff = i > 0 && prevValue > 0 ? Math.round(((prevValue - d.value) / prevValue) * 100) : null;
          return (
            <div className="sfunnel__row" key={d.label}>
              <span className="sfunnel__label">
                <span className="sfunnel__dot" style={{ background: d.color }} />
                {d.label}
              </span>
              <div className="sfunnel__track">
                <div
                  className="sfunnel__fill"
                  style={{ width: `${widthPct}%`, background: d.color }}
                />
              </div>
              <span className="sfunnel__value">{d.value}</span>
              <span className="sfunnel__dropoff">
                {dropOff === null ? (
                  <span className="sfunnel__dash">—</span>
                ) : dropOff > 0 ? (
                  `−${dropOff}%`
                ) : (
                  <span className="sfunnel__dash">0%</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {reject && (
        <div
          className="sfunnel__reject"
          style={{ borderColor: reject.color, color: reject.color }}
        >
          <span>{reject.label}</span>
          <b>{reject.value}</b>
        </div>
      )}
    </div>
  );
}