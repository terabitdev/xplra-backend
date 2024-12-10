import { IAchievementsService } from '@/lib/domain/services/IAchievementsService';
import { FirebaseAchievementsService } from '@/lib/infrastructure/services/FirebaseAchievementsService';
import { NextResponse } from 'next/server';

const achievementsService: IAchievementsService = new FirebaseAchievementsService();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const achievement = await achievementsService.getById(id);
        if (!achievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }
        return NextResponse.json(achievement);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const achievementData = JSON.parse(formData.get('achievement') as string);

        const updatedAchievement = await achievementsService.updateAchievement(id, achievementData);
        return NextResponse.json(updatedAchievement);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }
}