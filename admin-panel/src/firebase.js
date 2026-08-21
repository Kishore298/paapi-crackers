import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAzSafsrvc4E_rWvtKhSXRGKdCGDuMq-tQ",
  authDomain: "paapi-crackers.firebaseapp.com",
  projectId: "paapi-crackers",
  storageBucket: "paapi-crackers.firebasestorage.app",
  messagingSenderId: "331755104014",
  appId: "1:331755104014:web:d3b828cc020c641a10995f",
  measurementId: "G-9495RX7VLK"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const requestFirebaseToken = async (vapidKey) => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token.', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { app, messaging };
