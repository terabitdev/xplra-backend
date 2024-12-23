import { getFirestore, doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { Quest } from '@/lib/domain/models/quest';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage();

export class FirebaseQuestService implements IQuestService {
    private questsCollection = collection(db, 'quests');

    async createQuest(quest: Quest, imageFile?: File): Promise<Quest> {
        // Handle image upload if present
        let imageUrl = quest.imageUrl;
        if (imageFile) {
            const storageRef = ref(storage, `quests/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Save quest data with the image URL in Firestore
        const newQuestRef = await addDoc(this.questsCollection, { ...quest, imageUrl });
        await updateDoc(doc(db, 'quests', newQuestRef.id), { id: newQuestRef.id });

        const { ...questData } = quest;
        return { ...questData, imageUrl };
    }

    async getQuestById(id: string): Promise<Quest | null> {
        const questDoc = doc(db, 'quests', id);
        const questSnap = await getDoc(questDoc);
        return questSnap.exists() ? { ...questSnap.data(), id: questSnap.id } as Quest : null;
    }

    async getAllQuests(): Promise<Quest[]> {
        const querySnapshot = await getDocs(this.questsCollection);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Quest));
    }

    async updateQuest(id: string, updatedQuest: Partial<Quest>, imageFile?: File): Promise<void> {
        const questDoc = doc(db, 'quests', id);
        // Handle image upload if present
        if (imageFile) {
            const storageRef = ref(storage, `quests/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            updatedQuest.imageUrl = await getDownloadURL(snapshot.ref);
        }
        await updateDoc(questDoc, updatedQuest);
    }

    async deleteQuest(id: string): Promise<void> {
        const questDoc = doc(db, 'quests', id);
        await deleteDoc(questDoc);
    }
}
