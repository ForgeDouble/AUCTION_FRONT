import React, { useMemo } from "react";

export type MiniLinePoint = { label: string; value: number };

type Props = {
  points: MiniLinePoint[];
  height?: number;
};

export default function MiniLineChart({ points, height = 160 }: Props) {
  const width = 640;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const { pathD, maxV, minV, xLabels } = useMemo(() => {
    const vals = points.map((p) => p.value);
    const max = vals.length ? Math.max(...vals) : 0;
    const min = vals.length ? Math.min(...vals) : 0;

    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const safeMax = max === min ? max + 1 : max;
    const safeMin = max === min ? min - 1 : min;

    const toX = (i: number) =>
      padL + (innerW * (points.length <= 1 ? 0 : i / (points.length - 1)));
    const toY = (v: number) =>
      padT + innerH - ((v - safeMin) / (safeMax - safeMin)) * innerH;

    let d = "";
    points.forEach((p, i) => {
      const x = toX(i);
      const y = toY(p.value);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    const labels = points.map((p, i) => ({ i, label: p.label }));

    return { pathD: d, maxV: max, minV: min, xLabels: labels };
  }, [points, height]);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* grid */}
        <line x1={40} y1={12} x2={40} y2={height - 28} stroke="#e5e7eb" />
        <line x1={40} y1={height - 28} x2={width - 12} y2={height - 28} stroke="#e5e7eb" />

        {/* y labels */}
        <text x={6} y={16} fontSize="10" fill="#6b7280">
          {maxV.toLocaleString()}
        </text>
        <text x={6} y={height - 30} fontSize="10" fill="#6b7280">
          {minV.toLocaleString()}
        </text>

        {/* line */}
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2.5" />

        {/* points */}
        {points.map((p, i) => {
          const innerW = width - 40 - 12;
          const innerH = height - 12 - 28;

          const max = maxV;
          const min = minV;
          const safeMax = max === min ? max + 1 : max;
          const safeMin = max === min ? min - 1 : min;

          const x = 40 + (innerW * (points.length <= 1 ? 0 : i / (points.length - 1)));
          const y = 12 + innerH - ((p.value - safeMin) / (safeMax - safeMin)) * innerH;

          return <circle key={p.label + i} cx={x} cy={y} r={3.2} fill="#7c3aed" />;
        })}

        {/* x labels */}
        {xLabels.map((x) => {
          const innerW = width - 40 - 12;
          const xx = 40 + (innerW * (points.length <= 1 ? 0 : x.i / (points.length - 1)));
          return (
            <text key={x.label + x.i} x={xx} y={height - 10} fontSize="10" textAnchor="middle" fill="#6b7280">
              {x.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
