"use client";

// Tiny dependency-free charts (keeps the bundle light & free).

type Point = { label: string; value: number };

export function LineChart({
  data,
  height = 120,
  color = "var(--bl)",
}: {
  data: Point[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{ height, color: "var(--c4)" }}
      >
        Not enough data yet
      </div>
    );
  }
  const w = 320;
  const pad = 8;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(data.length - 1)},${height - pad} L${x(0)},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lcfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lcfill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

export function BarChart({
  data,
  height = 120,
  color = "var(--bl)",
}: {
  data: Point[];
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{ height, color: "var(--c4)" }}
      >
        No data yet
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max(2, (d.value / max) * (height - 18))}px`,
              background: color,
              opacity: 0.85,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px]" style={{ color: "var(--c4)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
