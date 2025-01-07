import { NextResponse } from 'next/server';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { FirebaseQuestService } from '@/lib/infrastructure/services/FirebaseQuestService';
import { Quest } from '@/lib/domain/models/quest';

const questService: IQuestService = new FirebaseQuestService();

export async function POST(req: Request) {
    const formData = await req.formData();
    const questData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;

    const quest: Quest = {
        id: '',
        title: questData.title,
        shortDescription: questData.shortDescription,
        longDescription: questData.longDescription,
        experience: questData.experience,
        imageUrl: '',
        stepCode: questData.stepCode,
        stepLatitude: questData.stepLatitude,
        stepLongitude: questData.stepLongitude,
        stepType: questData.stepType,
        timeInSeconds: questData.timeInSeconds,
        userId: questData.userId || null,
        distance: questData.distance || null,
    };

    try {
        const createdQuest = await questService.createQuest(quest, imageFile || undefined);
        return NextResponse.json(createdQuest);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
