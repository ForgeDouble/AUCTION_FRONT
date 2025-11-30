// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBsy85_vUpamq1XdJzp3jmF6jsD4e98R9g",
    authDomain: "auction-f5237.firebaseapp.com",
    projectId: "auction-f5237",
    storageBucket: "auction-f5237.firebasestorage.app",
    messagingSenderId: "733928231152",
    appId: "1:733928231152:web:7594877c18526489c9b235",
});

const messaging = firebase.messaging();

// 백그라운드에서 푸시 수신 시 (브라우저 알림 띄우기)
messaging.onBackgroundMessage(function (payload) {
    console.log("[firebase-messaging-sw.js] 받는 백그라운드 메세지 ", payload);

    const notificationTitle =
    (payload.notification && payload.notification.title) || "Auction 알림";

    const notificationOptions = {
        body: (payload.notification && payload.notification.body) || "",
        icon: "/icon-192x192.png",
        // 나중에 라우팅에 쓸 data
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 시 라우팅 처리
self.addEventListener("notificationclick", function (event) {
    const notification = event.notification || {};
    const data = notification.data || {};
    const type = data.type;
    const roomId = data.roomId;
    const productId = data.productId;

    notification.close();

    // 문의하기: /chat?roomId=...
    const urlForInquiry = roomId ? "/chat?roomId=" + roomId : "/chat";

    // 경매 상세: /auction_detail/:productId
    const urlForAuction = productId ? "/auction_detail/" + productId : "/";

    var targetUrl;
    if (type === "INQUIRY_NEW_MESSAGE") {
        targetUrl = urlForInquiry;
        } else if (type && type.indexOf("AUCTION_") === 0) {
            targetUrl = urlForAuction;
        } else {
            targetUrl = "/";
        }

        event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
        // 이미 열린 탭이 있으면 거기로 포커스 + 메시지 전달
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url && client.url.indexOf(self.location.origin) === 0) {
                    client.focus();
                    client.postMessage({
                        type: "PUSH_NOTIFICATION_CLICK",
                        payload: data,
                    });
                    return;
                }
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});