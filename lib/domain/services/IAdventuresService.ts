import { Adventure } from '../models/adventures';

export interface IAdventureService {
    getById(id: string): Promise<Adventure | null>;
    getAllAdventures(): Promise<Adventure[]>;
    createAdventure(adventure: Adventure): Promise<Adventure>;
    updateAdventure(id: string, adventure: Partial<Adventure>): Promise<void>;
    deleteAdventure(id: string): Promise<void>;
}
