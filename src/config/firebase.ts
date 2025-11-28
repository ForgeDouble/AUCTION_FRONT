import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from "firebase/messaging"

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

const app = initializeApp(firebaseConfig)

let messagingPromise: Promise<ReturnType<typeof getMessaging>> | null = null

async function getMessagingSafe() {
    if (!messagingPromise) {
        messagingPromise = isSupported().then((ok) => {
        if (!ok) throw new Error("이 브라우저는 FCM을 지원하지 않습니다.")
            return getMessaging(app)
        })
    }
    return messagingPromise
}

export async function requestFcmToken(): Promise<string | null> {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
        console.warn("알림 권한 거부됨")
        return null
    }

    const messaging = await getMessagingSafe()

    const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
    })

    return token || null
}

export async function listenForegroundMessage(
    handler: (payload: MessagePayload) => void,
) {
    try {
        const messaging = await getMessagingSafe()
        onMessage(messaging, handler)
    } catch (e) {
        console.warn("포그라운드 메시지 리스너 초기화 실패", e)
    }
}