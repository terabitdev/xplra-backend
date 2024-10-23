import { Quest } from "../models/quest";

export interface IQuestService {
    createQuest(quest: Quest): Promise<Quest>;
    getQuestById(id: string): Promise<Quest | null>;
    getAllQuests(): Promise<Quest[]>;
    updateQuest(id: string, updatedQuest: Partial<Quest>): Promise<void>;
    deleteQuest(id: string): Promise<void>;
}
