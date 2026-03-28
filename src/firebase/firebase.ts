//src/firebase/firebase.ts
import { initializeApp } from "firebase/app";

import {getMessaging, getToken, onMessage, isSupported, type MessagePayload } from "firebase/messaging";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// console.log("[FCM] firebase.ts 로드");
// console.log("[FCM] firebaseConfig:", firebaseConfig);
const app = initializeApp(firebaseConfig);


let messagingInstance: ReturnType<typeof getMessaging> | null = null;
let messagingInitPromise: Promise<ReturnType<typeof getMessaging> | null> | null = null;

async function ensureMessaging(): Promise<ReturnType<typeof getMessaging> | null> {
  if (messagingInstance) return messagingInstance;

  if (!messagingInitPromise) {
    messagingInitPromise = (async () => {
      console.log("[FCM] isSupported 체크 시작");

      const supported = await isSupported();

      console.log("[FCM] isSupported 결과:", supported);

      if (!supported) {
        console.warn("[FCM] 이 브라우저는 FCM을 지원하지 않습니다.");
        return null;
      }
      const m = getMessaging(app);
      console.log("[FCM] getMessaging 성공");
      messagingInstance = m;
      return m;
    })();
  }

  return messagingInitPromise;
}


//  Service Worker 등록
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] serviceWorker 를 지원하지 않는 환경입니다.");
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    return existing;
  }
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  return reg;
}

// 토큰 요청 함수
export async function requestFcmToken(): Promise<string | null> {
  try {
  console.log("[FCM] requestFcmToken 호출");

  const permission = await Notification.requestPermission();  
  console.log("[FCM] Notification permission:", permission);  

  if (permission !== "granted") {  
    console.warn("[FCM] 알림 권한 거부됨");  
    return null;  
  }  

  const messaging = await ensureMessaging();  
  if (!messaging) {  
    console.warn("[FCM] messaging 초기화 실패");  
    return null;  
  }  

  const swReg = await ensureServiceWorker();  
  if (!swReg) {  
    console.warn("[FCM] ServiceWorker 등록 실패로 토큰 요청 중단");  
    return null;  
  }  

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;  
  console.log("[FCM] VAPID 키 존재 여부:", !!vapidKey);  

  const token = await getToken(messaging, {  
    vapidKey,  
    serviceWorkerRegistration: swReg,  
  });  

  console.log("[FCM] getToken 결과:", token ? token.substring(0, 20) + "..." : null);  

  if (!token) {  
    console.warn("[FCM] FCM 토큰을 가져오지 못했습니다.");  
    return null;  
  }  

  return token;  

  } catch (e) {
  console.error("[FCM] FCM 토큰 요청 실패:", e);
  return null;
  }
}

// 포그라운드 메시지 구독
export function subscribeForegroundMessage(
callback: (payload: MessagePayload) => void
): Promise<() => void> {
  console.log("[FCM] foreground message 구독 시도");

  return ensureMessaging()
  .then((messaging) => {
  if (!messaging) {
  console.warn("[FCM] messaging 없음 → 포그라운드 구독 생략");
  return () => {};
  }
  console.log("[FCM] foreground message 구독 시작");

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] foreground message 수신:", payload);
      callback(payload);
    });

    return unsubscribe;
  })
  .catch((e) => {
    console.error("[FCM] 포그라운드 메시지 구독 실패:", e);
    return () => {};
  });

}