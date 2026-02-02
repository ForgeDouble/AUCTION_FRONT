import type { ApiResponse } from "@/type/CommonType";

const BASE =
(import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

async function throwApiError(response: Response, fallback: string) {
    const text = await response.text().catch(() => "");
    try {
        const json = text ? JSON.parse(text) : null;
        const code = json?.code ?? json?.errorCode ?? json?.result?.code;
        const msg =
        json?.message ??
        json?.msg ??
        json?.error ??
        json?.result?.message ??
        fallback;

        if (code) throw new Error(`[${code}] ${msg}`);
        throw new Error(msg);

    } catch {
        throw new Error(
            text ? `${fallback} (${response.status}) ${text}` : `${fallback} (${response.status})`
        );
    }
}

export type PublicProfileDto = {
    userId: number;
    nickname: string | null;
    profileImageUrl: string | null;
    createdAt: string;
    tradeCount: number;

    totalProducts: number;
    sellingProducts: number;
    endedProducts: number;

    reportable: boolean;
};

export async function fetchPublicProfile(token: string, userId: number) {
    const res = await fetch(`${BASE}/user/profile/${userId}`, {
        method: "GET",
        headers: { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` },
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "프로필 조회 실패");
    }
    return res.json() as Promise<ApiResponse<PublicProfileDto>>;
}

export type UserProductsQuery = {
    page?: number;
    size?: number;
    search?: string;
    statuses?: string[];
    sortBy?: string;
};

export async function fetchProductsByTargetUser(
    token: string,
    userId: number,
    query: UserProductsQuery = {}
) {
    const params = new URLSearchParams();
    params.set("page", String(query.page ?? 0));
    params.set("size", String(query.size ?? 10));

    if (query.search && query.search.trim().length > 0) {
        params.set("search", query.search.trim());
    }
    if (query.sortBy) params.set("sortBy", query.sortBy);

    if (query.statuses && query.statuses.length > 0) {
        query.statuses.forEach((s) => params.append("statuses", s));
    }

    const url = `${BASE}/product/user/${userId}?${params.toString()}`;

    const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`},
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`상품 목록 조회 실패 (${res.status}) ${text?.slice(0, 200) ?? ""}`);

    try {
        return text ? JSON.parse(text) : null;
    } catch {
        throw new Error(`상품 목록 조회 실패: JSON 파싱 실패 (${res.status}) ${text?.slice(0, 200) ?? ""}`);
    }
}