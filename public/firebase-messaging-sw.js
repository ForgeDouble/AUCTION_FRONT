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

messaging.onBackgroundMessage(function (payload) {
    console.log("[firebase-messaging-sw.js] 받는 백그라운드 메세지 ", payload);

    const notificationTitle = payload.notification?.title || "Auction 알림";
    const notificationOptions = {
        body: payload.notification?.body || "",
        icon: "/icon-192x192.png",
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});