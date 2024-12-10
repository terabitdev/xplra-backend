import { Achievement } from "@/lib/domain/models/achievement";

export interface IAchievementsService {
    getById(id: string): Promise<Achievement | null>;
    getAllAchievements(): Promise<Achievement[]>;
    createAchievement(achievement: Achievement): Promise<Achievement>;
    updateAchievement(id: string, achievement: Partial<Achievement>): Promise<void>;
    deleteAchievement(id: string): Promise<void>;
}