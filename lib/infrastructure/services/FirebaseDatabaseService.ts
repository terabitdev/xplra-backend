import { IDatabaseService } from '../../domain/services/IDatabaseService';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON as string); // Use your service account credentials

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

export class FirebaseDatabaseService implements IDatabaseService {
  async getUserData(userId: string): Promise<any> {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    return userDoc.data();
  }
}
