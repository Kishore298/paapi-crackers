const admin = require('firebase-admin');

let firebaseInitialized = false;

const initFirebase = () => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.log('Firebase: Missing credentials in .env. Push notifications disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace literal string '\n' with actual newlines in case it's escaped in .env
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
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
