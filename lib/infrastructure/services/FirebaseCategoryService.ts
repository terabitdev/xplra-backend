import { getFirestore, doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage();


import { Category } from "@/lib/domain/models/category";
import { ICategoryService } from "@/lib/domain/services/ICategoryService";

export class FirebaseICategoryService implements ICategoryService {
    async getById(id: string): Promise<Category | null> {
        const docRef = doc(db, 'categories', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Category;
        }
        return null;
    }

    async getAllCategories(): Promise<Category[]> {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        return querySnapshot.docs.map((doc) => {
            return ({ ...doc.data(), id: doc.id } as Category);
        });
    }

    async createCategory(category: Category, imageFile?: File): Promise<Category> {
        let imageUrl = category.imageUrl;
        if (imageFile) {
            const storageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const newCategoryRef = await addDoc(collection(db, 'categories'), { ...category, imageUrl });
        await updateDoc(doc(db, 'categories', newCategoryRef.id), { id: newCategoryRef.id });

        return { ...category, id: newCategoryRef.id, imageUrl };
    }

    async updateCategory(id: string, category: Partial<Category>, imageFile?: File): Promise<Category> {
        const existingCategory = await this.getById(id);
        if (!existingCategory) {
            throw new Error('Category not found');
        }

        const updatedData = { ...category };
        if (imageFile) {
            const storageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);
            updatedData.imageUrl = imageUrl;
        }

        const categoryDoc = doc(db, 'categories', id);
        await updateDoc(categoryDoc, updatedData);

        return { ...existingCategory, ...updatedData };
    }

    async deleteCategory(id: string): Promise<void> {
        const docRef = doc(db, 'categories', id);
        await deleteDoc(docRef);
    }

}