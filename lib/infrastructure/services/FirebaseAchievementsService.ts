import { getFirestore, doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { Achievement } from "@/lib/domain/models/achievement";
import { IAchievementsService } from "@/lib/domain/services/IAchievementsService";

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const db = getFirestore();

export class FirebaseAchievementsService implements IAchievementsService {
    async getById(id: string): Promise<Achievement | null> {
        const docRef = doc(db, 'achievements', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id, } as Achievement;
        }
        return null;
    }
    async getAllAchievements(): Promise<Achievement[]> {
        const querySnapshot = await getDocs(collection(db, 'achievements'));
        return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Achievement));
    }
    async createAchievement(achievement: Achievement): Promise<Achievement> {
        // Handle image upload if present
        // Save achievement data with the image URL in Firestore
        const newAchievementRef = await addDoc(collection(db, 'achievements'), { ...achievement });
        await updateDoc(doc(db, 'achievements', newAchievementRef.id), { achievementId: newAchievementRef.id });

        return { ...achievement };
    }
    async updateAchievement(id: string, achievement: Partial<Achievement>): Promise<void> {
        await updateDoc(doc(db, 'achievements', id), { ...achievement });
    }
    async deleteAchievement(id: string): Promise<void> {
        await deleteDoc(doc(db, 'achievements', id));
    }


}