// src/components/season/seasonApi.ts
// import type { ApiResponse } from "@/type/CommonType";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";
import { ApiError, DataReadError, UnauthorizedError } from "@/errors/Errors";


const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

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

    // if (!res.ok) {
    //     const text = await res.text().catch(() => "");
    //     throw new Error(`시즌 뱃지 조회 실패 (${res.status}) ${text?.slice(0, 200) ?? ""}`);
    // }

    // const json = await res.json();
    // return (json?.result ?? json?.data ?? json) as SeasonUserAwardsDto;
    if (res.status === 401 || res.status === 403) {
        throw new UnauthorizedError();
    }
    if (!res.ok) {
        const json = await safeReadJson(res);

        const statusCode = json?.statusCode ?? json?.errorCode ?? json?.code;
        const message = json?.errorMessage ?? json?.message ?? "시즌 조회 실패";
        const additionalInfo = json?.additionalInfo ?? json?.detail;

        if (statusCode) {
            throw new ApiError(res.status, statusCode, message, additionalInfo);
        }

        const text = await safeReadText(res);
        throw new DataReadError(text?.slice(0, 200));
    }

    const json = await safeReadJson(res);
    return unwrap<SeasonUserAwardsDto>(json);
}



async function safeReadText(res: Response) {
    try {
        return await res.text();
    } catch {
        return "";
    }
}

async function safeReadJson(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
function unwrap<T>(api: any): T {
    return (api?.result ?? api?.data ?? api?.body ?? api) as T;
}
