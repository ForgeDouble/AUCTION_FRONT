import {
initializeApp
} from "firebase/app";

import {
getMessaging,
getToken,
onMessage,
isSupported,
type MessagePayload
} from "firebase/messaging";

// ─────────────────────────────
// 1) Firebase 기본 설정
// ─────────────────────────────

const firebaseConfig = {
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log("[FCM] firebase.ts 로드됨");
console.log("[FCM] firebaseConfig:", firebaseConfig);
const app = initializeApp(firebaseConfig);

// ─────────────────────────────
// 2) Messaging 준비 함수
// ─────────────────────────────
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

// ─────────────────────────────
// 3) Service Worker 등록
// ─────────────────────────────
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
if (!("serviceWorker" in navigator)) {
console.warn("[FCM] serviceWorker 를 지원하지 않는 환경입니다.");
return null;
}

// 이미 등록된 SW가 있으면 재사용
const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
if (existing) {
console.log("[FCM] 기존 SW 등록 재사용:", existing);
return existing;
}

console.log("[FCM] SW 신규 등록 시도 (/firebase-messaging-sw.js)");
const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
console.log("[FCM] SW 등록 완료:", reg);
return reg;
}

// ─────────────────────────────
// 4) 토큰 요청 함수
// ─────────────────────────────
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

// ─────────────────────────────
// 5) 포그라운드 메시지 구독
// ─────────────────────────────
export function subscribeForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<() => void> {
  console.log("[FCM] foreground message 구독 시도");

  return ensureMessaging()
  .then((messaging) => {
  if (!messaging) {
  console.warn("[FCM] messaging 없음 → 포그라운드 구독 생략");
  // 실패해도 호출 측이 안전하게 unsubscribe 호출할 수 있도록 no-op 반환
  return () => {};
  }

    console.log("[FCM] foreground message 구독 시작");
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] foreground message 수신:", payload);
      callback(payload);
    });

    // onMessage 가 리스너 해제 함수 반환
    return unsubscribe;
  })
  .catch((e) => {
    console.error("[FCM] 포그라운드 메시지 구독 실패:", e);
    // 에러가 나도 항상 함수 하나는 돌려주자
    return () => {};
  });


}