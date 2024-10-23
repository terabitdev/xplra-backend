// lib/infrastructure/services/FirebaseAuthService.ts

import { IAuthService } from '../../domain/services/IAuthService';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp } from 'firebase/app';



const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const auth = getAuth();

export class FirebaseAuthService implements IAuthService {
    async signOut(): Promise<void> {
        await auth.signOut();
    }
    async signUp(email: string, password: string): Promise<void> {
        await createUserWithEmailAndPassword(auth, email, password);
    }

    async signIn(email: string, password: string): Promise<string> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken(); // Generate the token here
        return token; // Return the token to the API
    }

    async forgotPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    }
}
