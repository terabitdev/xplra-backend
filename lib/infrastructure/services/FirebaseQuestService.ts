import { getFirestore, doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { Quest } from '@/lib/domain/models/quest';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const db = getFirestore();

export class FirebaseQuestService implements IQuestService {
    private questsCollection = collection(db, 'quests');

    async createQuest(quest: Quest): Promise<Quest> {
        const newQuestRef = await addDoc(this.questsCollection, quest);
        const { id, ...questWithoutId } = quest;
        await updateDoc(doc(db, 'quests', newQuestRef.id), { id: newQuestRef.id });
        return { id: newQuestRef.id, ...questWithoutId };
    }

    async getQuestById(id: string): Promise<Quest | null> {
        const questDoc = doc(db, 'quests', id);
        const questSnap = await getDoc(questDoc);
        return questSnap.exists() ? { id: questSnap.id, ...questSnap.data() } as Quest : null;
    }

    async getAllQuests(): Promise<Quest[]> {
        const querySnapshot = await getDocs(this.questsCollection);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest));
    }

    async updateQuest(id: string, updatedQuest: Partial<Quest>): Promise<void> {
        const questDoc = doc(db, 'quests', id);
        await updateDoc(questDoc, updatedQuest);
    }

    async deleteQuest(id: string): Promise<void> {
        const questDoc = doc(db, 'quests', id);
        await deleteDoc(questDoc);
    }
}
