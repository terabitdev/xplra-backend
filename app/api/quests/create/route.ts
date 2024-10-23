import { NextResponse } from 'next/server';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { FirebaseQuestService } from '@/lib/infrastructure/services/FirebaseQuestService';
import { Quest } from '@/lib/domain/models/quest';

const questService: IQuestService = new FirebaseQuestService();

export async function POST(req: Request) {
    const data = await req.json();
    const quest: Quest = {
        id: '',
        title: data.title,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        experience: data.experience,
        imageUrl: data.imageUrl,
        stepCode: data.stepCode,
        stepLatitude: data.stepLatitude,
        stepLongitude: data.stepLongitude,
        stepType: data.stepType,
        timeInSeconds: data.timeInSeconds,
        userId: data.userId || null,
    };

    try {
        const createdQuest = await questService.createQuest(quest);
        return NextResponse.json(createdQuest);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
