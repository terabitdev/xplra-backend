import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
    const adminSdkJson = process.env.FIREBASE_ADMIN_SDK_JSON;

    if (!adminSdkJson) {
        throw new Error(
            'FIREBASE_ADMIN_SDK_JSON environment variable is not set. ' +
            'Please add it to your .env.local file and restart the development server.'
        );
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(adminSdkJson);
    } catch (error) {
        throw new Error('Failed to parse FIREBASE_ADMIN_SDK_JSON. Please check the JSON format in your .env.local file.');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'xplra-1.appspot.com'
    });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;
