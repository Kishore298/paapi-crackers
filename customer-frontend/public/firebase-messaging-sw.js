importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAzSafsrvc4E_rWvtKhSXRGKdCGDuMq-tQ",
  authDomain: "paapi-crackers.firebaseapp.com",
  projectId: "paapi-crackers",
  storageBucket: "paapi-crackers.firebasestorage.app",
  messagingSenderId: "331755104014",
  appId: "1:331755104014:web:d3b828cc020c641a10995f",
  measurementId: "G-9495RX7VLK"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
