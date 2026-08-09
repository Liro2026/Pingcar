/* PingCar Firebase Cloud Messaging service worker */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyComGzTg8b2WRRyzFLt7yt__eD9FRQCbrY",
  authDomain: "pingcar.firebaseapp.com",
  projectId: "pingcar",
  storageBucket: "pingcar.firebasestorage.app",
  messagingSenderId: "133178961912",
  appId: "1:133178961912:web:f41ed6b0b381ec69d7b00d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "PingCar";
  const options = {
    body: payload?.notification?.body || "Neue PingCar Nachricht",
    icon: "/favicon.ico",
    data: payload?.data || {}
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/dashboard.html";
  event.waitUntil(clients.openWindow(target));
});
