import { ISessionService } from '../../domain/services/ISessionService';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON as string); // Use your service account credentials

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const auth = admin.auth();

export class FirebaseSessionService implements ISessionService {
    async validateSession(token: string): Promise<any> {
        try {
            const decodedToken = await auth.verifyIdToken(token);
            console.log(decodedToken);
            return decodedToken;
        } catch (error) {
            console.error(error);
            throw new Error('Invalid session token');
        }
    }
}
