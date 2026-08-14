const admin = require('firebase-admin');

let firebaseInitialized = false;

const initFirebase = () => {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      console.log('Firebase: No service account configured. Push notifications disabled.');
      return;
    }

    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized.');
  } catch (error) {
    console.log(`Firebase init skipped: ${error.message}`);
  }
};

const sendPushNotification = async (token, title, body, data = {}) => {
  if (!firebaseInitialized) return null;

  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      token,
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return null;
  }
};

module.exports = { initFirebase, sendPushNotification };
