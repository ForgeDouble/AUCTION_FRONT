import type { NotificationCategory } from "@/hooks/useNotifications";

export type NotificationType =
| "INQUIRY_NEW_MESSAGE"
| "INQUIRY_REPLY"
| "AUCTION_ENDING_SOON"
| "AUCTION_ENDED"
| "AUCTION_WINNER"
| "AUCTION_ENDED_NO_WINNER"
| "USER_VIEW_ONLY"
| "ADMIN_PENDING_REPORTS"
| string;

export type NotificationData = Record<string, string | undefined>;

export function categoryFromType(type?: string): NotificationCategory {
    if (!type) return "ALL";
    if (type.startsWith("AUCTION_")) return "AUCTION";
    if (type.startsWith("INQUIRY_")) return "INQUIRY";
    if (type.startsWith("CHAT_")) return "CHAT";
    if (type.startsWith("PRODUCT_")) return "PRODUCT";
    if (type === "ADMIN_PENDING_REPORTS") return "PRODUCT";
    if (type === "USER_VIEW_ONLY") return "ALL";
    return "ALL";
}

export function routeForNotification(type?: string, data?: NotificationData): string | null {
    const d = data || {};

    if (type === "INQUIRY_NEW_MESSAGE" || type === "INQUIRY_REPLY") {
        const roomId = d.roomId;
        return roomId ? "/chat?roomId=" + encodeURIComponent(roomId) : "/chat";
    }

    if (
        type === "AUCTION_ENDING_SOON" ||
        type === "AUCTION_ENDED" ||
        type === "AUCTION_WINNER" ||
        type === "AUCTION_ENDED_NO_WINNER"
    ) {
        const productId = d.productId;
        return productId ? "/auction_detail/" + encodeURIComponent(productId) : null;
    }

    if (type === "USER_VIEW_ONLY") {
        return "/mypage/profile";
    }

    if (type === "ADMIN_PENDING_REPORTS") {
        return "/admin/report";
    }

    return null;
}

export function labelForNotificationType(type?: string): string {
    if (type === "INQUIRY_NEW_MESSAGE") return "새 문의 메시지";
    if (type === "INQUIRY_REPLY") return "문의 답변";
    if (type === "AUCTION_ENDING_SOON") return "경매 종료 임박";
    if (type === "AUCTION_ENDED") return "경매 종료";
    if (type === "AUCTION_WINNER") return "입찰 상품 낙찰";
    if (type === "AUCTION_ENDED_NO_WINNER") return "경매 종료(무입찰)";
    if (type === "USER_VIEW_ONLY") return "계정 제재 안내";
    if (type === "ADMIN_PENDING_REPORTS") return "관리자 신고 알림";
    return "알림";
}