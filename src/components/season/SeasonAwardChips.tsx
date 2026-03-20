// src/components/season/SeasonAwardChip.tsx
import { useMemo } from "react";
import { Crown, BadgeCheck } from "lucide-react";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";

type Props = {
    data: SeasonUserAwardsDto | null;
    accent: string; // rgb(118,90,255)
    accentSoft: string; // rgba(118,90,255,0.10)
    className?: string;
    max?: number;
};

export default function SeasonAwardChips({
    data,
    accent,
    accentSoft,
    className,
    max = 3,
    }: Props) {
        const chips = useMemo(() => {
            if (!data) return [];

            const titles = (data.titles ?? [])
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((t) => ({
                key: `T-${t.titleType}-${t.rank}`,
                label: `${t.titleLabel} TOP${t.rank}`,
                kind: "title" as const,
            }));

            const badges = (data.badges ?? [])
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((b) => ({
                key: `B-${b.badgeType}-${b.rank}`,
                label: `${b.badgeLabel} TOP${b.rank}`,
                kind: "badge" as const,
            }));

            return [...titles, ...badges].slice(0, max);
        }, [data, max]);

    if (!data || chips.length === 0) return null;

    return (
        <div className={"flex flex-wrap gap-2 " + (className ?? "")}>
            {chips.map((c) => (
                <span
                    key={c.key}
                    className="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1"
                    style={{
                        color: accent,
                        backgroundColor: accentSoft,
                        borderColor: "rgba(118,90,255,0.25)",
                    }}
                >
                {c.kind === "title" ? (
                    <Crown className="w-3.5 h-3.5" style={{ color: accent }} />
                ) : (
                    <BadgeCheck className="w-3.5 h-3.5" style={{ color: accent }} />
                )}
                    {c.label}
                </span>
            ))}
        </div>
    );
}