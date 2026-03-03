import { getFirestore, doc, collection, setDoc, updateDoc, getDoc, getDocs, deleteDoc, query, where, orderBy } from 'firebase/firestore';
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
            return docSnap.data() as Category;
        }
        return null;
    }

    async getAllCategories(): Promise<Category[]> {
        const q = query(collection(db, 'categories'), orderBy('interestsOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as Category);
    }

    async getRootCategories(): Promise<Category[]> {
        const q = query(
            collection(db, 'categories'),
            where('parentId', '==', null),
            orderBy('interestsOrder', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as Category);
    }

    async getChildrenOf(parentId: string): Promise<Category[]> {
        const q = query(
            collection(db, 'categories'),
            where('parentId', '==', parentId),
            orderBy('interestsOrder', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as Category);
    }

    async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
        const categoryId = `category_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        const newCategory: Category = {
            ...category,
            id: categoryId,
            createdAt: now,
            updatedAt: now,
        };

        await setDoc(doc(db, 'categories', categoryId), newCategory);
        return newCategory;
    }

    async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
        const existingCategory = await this.getById(id);
        if (!existingCategory) {
            throw new Error('Category not found');
        }

        const updatedData = {
            ...category,
            updatedAt: new Date().toISOString(),
        };

        const categoryDoc = doc(db, 'categories', id);
        await updateDoc(categoryDoc, updatedData);

        return { ...existingCategory, ...updatedData } as Category;
    }

    async deleteCategory(id: string): Promise<void> {
        const docRef = doc(db, 'categories', id);
        await deleteDoc(docRef);
    }
}
