//src/components/ServiceWorkerNoficationBridge.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routeForNotification } from "@/firebase/notificationRoute";

export default function ServiceWorkerNotificationBridge() {
    const navigate = useNavigate();

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const handler = (event: MessageEvent) => {
            const msg = event.data || {};
            if (msg.type !== "PUSH_NOTIFICATION_CLICK") return;

            const payload = msg.payload || {};
            const type = payload.type;
            const data = payload as Record<string, string>;

            const path = routeForNotification(type, data);
            if (path) {
                navigate(path);
            }
        };

        navigator.serviceWorker.addEventListener("message", handler);
        return () => navigator.serviceWorker.removeEventListener("message", handler);
    }, [navigate]);

    return null;
}