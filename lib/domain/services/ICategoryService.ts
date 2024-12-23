import { Category } from "../models/category";


export interface ICategoryService {
    getById(id: string): Promise<Category | null>;
    getAllCategories(): Promise<Category[]>;
    createCategory(category: Category, imageFile?: File): Promise<Category>;
    updateCategory(id: string, category: Partial<Category>, imageFile?: File): Promise<Category>;
    deleteCategory(id: string): Promise<void>;
}