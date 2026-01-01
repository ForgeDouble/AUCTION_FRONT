import React from "react";

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

const COLORS = [
    "bg-green-500",
    "bg-green-400",
    "bg-lime-400",
    "bg-yellow-400",
    "bg-amber-400",
    "bg-orange-400",
    "bg-orange-500",
    "bg-red-400",
    "bg-red-500",
    "bg-red-600",
];

export const ImportanceBlocks: React.FC<{ value: number }> = ({ value }) => {
    const v = clamp(Number.isFinite(value) ? value : 0, 0, 100);
    const filled = v === 0 ? 0 : Math.ceil(v / 10);

    return (
        <div
            className="inline-flex items-center gap-[2px]"
            title={`중요도 ${v}/100`}
            aria-label={`중요도 ${v}/100`}
        >
            {Array.from({ length: 10 }).map((_, idx) => {
                const i = idx + 1;
                const active = i <= filled;
                const color = active ? COLORS[idx] : "bg-gray-200";
                return <span key={i} className={`w-2.5 h-2.5 rounded-sm ${color}`} />;
            })}
        </div>
    );
};