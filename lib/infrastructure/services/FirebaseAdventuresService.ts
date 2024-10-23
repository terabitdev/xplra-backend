import { Adventure } from '@/lib/domain/models/adventures';
import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
} from 'firebase/firestore';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');

initializeApp(firebaseConfig);
const db = getFirestore();

export class FirebaseAdventureService implements IAdventureService {
    async getById(id: string): Promise<Adventure | null> {
        const docRef = doc(db, 'adventures', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Adventure;
        }
        return null;
    }
    async getAllAdventures(): Promise<Adventure[]> {
        const querySnapshot = await getDocs(collection(db, 'adventures'));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Adventure));
    }

    async createAdventure(adventure: Adventure): Promise<Adventure> {
        const docRef = await addDoc(collection(db, 'adventures'), adventure);
        await updateDoc(docRef, { id: docRef.id });
        return { ...adventure, id: docRef.id };
    }

    async updateAdventure(id: string, adventure: Partial<Adventure>): Promise<void> {
        const docRef = doc(db, 'adventures', id);
        await updateDoc(docRef, adventure);
    }

    async deleteAdventure(id: string): Promise<void> {
        const docRef = doc(db, 'adventures', id);
        await deleteDoc(docRef);
    }
}
