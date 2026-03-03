import { Category } from "../models/category";

export interface ICategoryService {
    getById(id: string): Promise<Category | null>;
    getAllCategories(): Promise<Category[]>;
    getRootCategories(): Promise<Category[]>;
    getChildrenOf(parentId: string): Promise<Category[]>;
    createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
    updateCategory(id: string, category: Partial<Category>): Promise<Category>;
    deleteCategory(id: string): Promise<void>;
}
