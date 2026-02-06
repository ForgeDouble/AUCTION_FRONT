// src/api/pushApi.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE;


export async function registerDeviceToken(token: string) {
    console.log("[pushApi] registerDeviceToken 호출, token prefix:", token.slice(0, 12));

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        console.warn("[PushApi] accessToken 이 없어서 FCM 토큰 등록을 건너뜁니다.");
        return;
    }

    const dto = {
        token,
        platform: "WEB",
        appVersion: "web-1.0.0",
        deviceModel: navigator.userAgent.slice(0, 100),
    };


    const response = await fetch(`${API_BASE_URL}/push/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dto),
    });

    console.log("[pushApi] /push/register status:", response.status);

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[pushApi] FCM 토큰 등록 실패", response.status, text);
        throw new Error("FCM 토큰 등록 실패: " + response.status);
    }

    return response.json();
}

export async function unregisterDeviceToken(fcmToken: string): Promise<void> {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        console.warn("[PushApi] accessToken 없음, unregister 스킵");
        return;
    }

    if (!fcmToken) {
        console.warn("[PushApi] fcmToken 이 비어 있어서 unregister를 스킵합니다.");
        return;
    }

    const url = API_BASE_URL + "/push/unregister?token=" + encodeURIComponent(fcmToken);

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    console.log("[pushApi] /push/unregister status:", response.status);

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[pushApi] FCM 토큰 해제 실패", response.status, text);
        throw new Error("FCM 토큰 해제 실패: " + response.status);
    }
}