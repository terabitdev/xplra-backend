import { Adventure } from '../models/adventures';

export interface IAdventureService {
    getById(id: string): Promise<Adventure | null>;
    getAllAdventures(): Promise<Adventure[]>;
    createAdventure(adventure: Adventure, imageFile?: File, imageFiles?: File[]): Promise<Adventure>;
    updateAdventure(id: string, adventure: Partial<Adventure>, imageFile?: File, imageFiles?: File[]): Promise<void>;
    deleteAdventure(id: string): Promise<void>;
}
