import React, { useMemo } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

export interface MultiLineSeries {
  name: string;
  colorClass: string;
  points: LinePoint[];
}

export interface DonutSegment {
  label: string;
  value: number;
  colorClass: string;
}

export interface BarPoint {
  label: string;
  value: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const SimpleMultiLineChart: React.FC<{
  series: MultiLineSeries[];
  height?: number;
  yLabel?: string;

  valueLabelMode?: "none" | "last" | "all";
  valueFormatter?: (v: number) => string;
}> = ({
  series,
  height = 180,
  yLabel,
  valueLabelMode = "none",
  valueFormatter,
}) => {
  const allValues = useMemo(
    () => series.flatMap((s) => s.points.map((p) => p.value)),
    [series],
  );
  const max = useMemo(() => Math.max(1, ...allValues), [allValues]);
  const min = useMemo(() => Math.min(0, ...allValues), [allValues]);

  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const w = 640;
  const h = height;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 26;

  const xAt = (i: number, n: number): number => {
    if (n <= 1) return padL;
    const usable = w - padL - padR;
    return padL + (usable * i) / (n - 1);
  };

  const yAt = (v: number): number => {
    const usable = h - padT - padB;
    if (max === min) return padT + usable / 2;
    const t = (v - min) / (max - min);
    return padT + usable * (1 - t);
  };

  const fmt = (v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return new Intl.NumberFormat("ko-KR").format(v);
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + (h - padT - padB) * t;
          return (
            <line
              key={t}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="#eee"
              strokeWidth="1"
            />
          );
        })}

        {/* axis */}
        <line x1={padL} x2={padL} y1={padT} y2={h - padB} stroke="#ddd" />
        <line
          x1={padL}
          x2={w - padR}
          y1={h - padB}
          y2={h - padB}
          stroke="#ddd"
        />

        {/* y label */}
        {yLabel ? (
          <text x={6} y={14} fontSize="10" fill="#999">
            {yLabel}
          </text>
        ) : null}

        {/* series lines */}
        {series.map((s) => {
          const n = s.points.length;
          const d = s.points
            .map((p, i) => {
              const x = xAt(i, n);
              const y = yAt(p.value);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
          return (
            <path
              key={s.name}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={s.colorClass}
            />
          );
        })}

        {series.map((s, sIdx) => {
          const n = s.points.length;

          return (
            <g key={`${s.name}-points`} className={s.colorClass}>
              {s.points.map((p, i) => {
                const x = xAt(i, n);
                const y = yAt(p.value);

                const show =
                  valueLabelMode === "all" ||
                  (valueLabelMode === "last" && i === n - 1);

                const yText = Math.max(padT + 10, y - (10 + sIdx * 12));

                return (
                  <g key={`${s.name}-${i}`}>
                    {/* 점 */}
                    <circle cx={x} cy={y} r={2.6} fill="currentColor" />

                    {/* 값 라벨 */}
                    {show && (
                      <text
                        x={x}
                        y={yText}
                        fontSize="9"
                        textAnchor="middle"
                        fill="black"
                        opacity="1.0"
                        fontWeight="bold"
                      >
                        {fmt(p.value)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* x labels (sparse) */}
        {labels.map((lb, i) => {
          const step = Math.ceil(labels.length / 6);
          if (labels.length > 6 && i % step !== 0 && i !== labels.length - 1)
            return null;
          const x = xAt(i, labels.length);
          return (
            <text
              key={lb + i}
              x={x}
              y={h - 8}
              fontSize="10"
              textAnchor="middle"
              fill="#999"
            >
              {lb}
            </text>
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span
              className={"w-2.5 h-2.5 rounded-full shrink-0 " + s.colorClass}
              style={{ backgroundColor: "currentColor" }}
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SimpleDonutChart: React.FC<{
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}> = ({ segments, size = 180, thickness = 16 }) => {
  const total = useMemo(
    () => segments.reduce((acc, s) => acc + s.value, 0),
    [segments],
  );
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#eee"
          strokeWidth={thickness}
          fill="none"
        />
        {segments.map((s) => {
          const frac = total > 0 ? s.value / total : 0;
          const dash = c * frac;
          const dashArray = `${dash} ${c - dash}`;
          const node = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              className={s.colorClass}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return node;
        })}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fill="#333"
        >
          {total.toLocaleString()}
        </text>
      </svg>

      <div className="flex-1 space-y-2">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div
              key={s.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={"w-3 h-3 rounded-full shrink-0 " + s.colorClass}
                  style={{ backgroundColor: "currentColor" }}
                />
                <span className="text-gray-800">{s.label}</span>
              </div>
              <div className="text-gray-600 text-[12px]">
                {s.value.toLocaleString()} ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SimpleBarChart: React.FC<{
  data: BarPoint[];
  height?: number;
}> = ({ data, height = 180 }) => {
  const w = 640;
  const h = height;
  const padL = 28;
  const padR = 12;
  const padT = 10;
  const padB = 26;

  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  const n = data.length;

  const usableW = w - padL - padR;
  const gap = 6;
  const barW = n > 0 ? (usableW - gap * (n - 1)) / n : usableW;

  const xAt = (i: number): number => padL + i * (barW + gap);

  const yAt = (v: number): number => {
    const usableH = h - padT - padB;
    const t = v / max;
    return padT + usableH * (1 - clamp(t, 0, 1));
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <line
          x1={padL}
          x2={w - padR}
          y1={h - padB}
          y2={h - padB}
          stroke="#ddd"
        />

        {data.map((d, i) => {
          const x = xAt(i);
          const y = yAt(d.value);
          const base = h - padB;
          const barH = base - y;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill="#7c3aed"
                opacity={0.85}
              />
              <text
                x={x + barW / 2}
                y={h - 8}
                fontSize="10"
                textAnchor="middle"
                fill="#999"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
