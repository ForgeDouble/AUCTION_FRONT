import type { ApiResponse } from "@/type/CommonType";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";

const BASE =
(import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

export async function fetchSeasonLatestForUser(
    userId: number,
): Promise<ApiResponse<SeasonUserAwardsDto>> {
    const res = await fetch(`${BASE}/season/user/${userId}/latest`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`시즌 뱃지 조회 실패 (${res.status}) ${text?.slice(0, 200) ?? ""}`);
    }

    return res.json();
}