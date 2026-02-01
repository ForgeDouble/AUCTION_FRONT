const API_BASE_URL = import.meta.env.VITE_API_BASE;

function getAccessToken() {
    return localStorage.getItem("accessToken");
}

function jsonAuthHeaders() {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
}

export async function fetchNotifications(size = 20) {
    const res = await fetch(`${API_BASE_URL}/notifications?size=${size}`, {
        method: "GET",
        headers: jsonAuthHeaders(),
        credentials: "include",
    });
    if (!res.ok) throw new Error("알림 목록 조회 실패: " + res.status);
    return res.json();
}

export async function fetchUnreadCount() {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: "GET",
        headers: jsonAuthHeaders(),
        credentials: "include",
    });
    if (!res.ok) throw new Error("미읽음 개수 조회 실패: " + res.status);
    return res.json();
}

export async function markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE_URL}/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        credentials: "include",
    });
    if (!res.ok) throw new Error("읽음 처리 실패: " + res.status);
}

export async function markAllNotificationsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        credentials: "include",
    });
    if (!res.ok) throw new Error("전체 읽음 실패: " + res.status);
}