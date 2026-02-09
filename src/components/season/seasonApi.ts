// src/components/season/seasonApi.ts
import type { ApiResponse } from "@/type/CommonType";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";

const BASE =
(import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

export async function fetchSeasonLatestForUser(
    token: string,
    userId: number
): Promise<SeasonUserAwardsDto> {
    const res = await fetch(`${BASE}/season/user/${userId}/latest`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`시즌 뱃지 조회 실패 (${res.status}) ${text?.slice(0, 200) ?? ""}`);
    }

    const json = await res.json();
    return (json?.result ?? json?.data ?? json) as SeasonUserAwardsDto;
}