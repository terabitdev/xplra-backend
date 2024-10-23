import { NextResponse } from 'next/server';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { FirebaseQuestService } from '@/lib/infrastructure/services/FirebaseQuestService';

const questService: IQuestService = new FirebaseQuestService();

export async function GET() {
    try {
        const quests = await questService.getAllQuests();
        return NextResponse.json(quests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
