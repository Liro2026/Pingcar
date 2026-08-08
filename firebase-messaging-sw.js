importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAxvR0zRSjUWWLp40qovq2iNlt9g0ISw7Y",
  authDomain: "pingcar.firebaseapp.com",
  projectId: "pingcar",
  storageBucket: "pingcar.firebasestorage.app",
  messagingSenderId: "133178961912",
  appId: "1:133178961912:web:f41ed6b0b381ec69d7b00d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || "PingCar";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192.png"
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});