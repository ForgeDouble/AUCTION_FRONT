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

    if (payload.notification) {
        return;
    }
    const notificationTitle =(payload.data && payload.data.title) || "Auction 알림";

    const notificationOptions = {
        body: (payload.data && payload.data.body) || "",
        icon: "/icon-192x192.png",
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

    const urlForInquiry = roomId ? "/chat?roomId=" + roomId : "/chat";
    const urlForAuction = productId ? "/auction_detail/" + productId : "/";
    const urlForAdminReports = "/admin/reports";

    var targetUrl;
    if (type === "INQUIRY_NEW_MESSAGE") {
        targetUrl = urlForInquiry;
    } else if (type && type.indexOf("AUCTION_") === 0) {
        targetUrl = urlForAuction;
    } else if (type === "ADMIN_PENDING_REPORTS") {
        targetUrl = urlForAdminReports;
    } else {
        targetUrl = "/";
    }

    const absoluteUrl = self.location.origin + targetUrl;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
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
            return self.clients.openWindow(absoluteUrl);
        })
    );
});