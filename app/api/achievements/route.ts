import { IAchievementsService } from '@/lib/domain/services/IAchievementsService';
import { FirebaseAchievementsService } from '@/lib/infrastructure/services/FirebaseAchievementsService';
import { NextResponse } from 'next/server';

const achievementsService: IAchievementsService = new FirebaseAchievementsService();

export async function GET() {
    try {
        const allachievements = await achievementsService.getAllAchievements();
        const achievements = allachievements.filter(achievement => {
            return achievement.userId === null || achievement.userId === "" || achievement.userId === undefined;
        });
        return NextResponse.json(achievements);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}


export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const achievementData = JSON.parse(formData.get('achievement') as string);

        const achievement = {
            ...achievementData,
        };

        const newAchievement = await achievementsService.createAchievement(achievement);
        return NextResponse.json(newAchievement);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }
}