import { getFirestore, doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { Adventure } from '@/lib/domain/models/adventures';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage();

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
        return querySnapshot.docs.map((doc) => {
            return ({ ...doc.data(), id: doc.id } as Adventure);
        });
    }

    async createAdventure(adventure: Adventure, imageFile?: File, imageFiles?: File[]): Promise<Adventure> {
        // Handle image upload if present
        let imageUrl = adventure.imageUrl;
        if (imageFile) {
            const storageRef = ref(storage, `adventures/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        if (imageFiles) {
            const imageUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    const storageRef = ref(storage, `adventures/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                })
            );
            adventure.featuredImages = imageUrls;
        }

        // Save adventure data with the image URL in Firestore
        const newAdventureRef = await addDoc(collection(db, 'adventures'), { ...adventure, imageUrl });
        await updateDoc(doc(db, 'adventures', newAdventureRef.id), { adventureId: newAdventureRef.id });

        return { ...adventure, adventureId: newAdventureRef.id, imageUrl };
    }
    // Removed the unused method

    async updateAdventure(id: string, updatedAdventure: Partial<Adventure>, imageFile?: File, imageFiles?: File[]): Promise<void> {
        // Handle image upload if present
        const updatedData = { ...updatedAdventure };
        if (imageFile) {
            const storageRef = ref(storage, `adventures/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);
            updatedData.imageUrl = imageUrl;
        }

        if (imageFiles) {
            const imageUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    const storageRef = ref(storage, `adventures/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                })
            );
            updatedData.featuredImages = imageUrls;
        }

        // Update adventure document with the new data, including the image URL if updated
        const adventureDoc = doc(db, 'adventures', id);
        await updateDoc(adventureDoc, updatedData);
    }

    async deleteAdventure(id: string): Promise<void> {
        const docRef = doc(db, 'adventures', id);
        await deleteDoc(docRef);
    }
}
