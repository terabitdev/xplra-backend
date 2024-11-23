import { NextResponse } from 'next/server';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { FirebaseQuestService } from '@/lib/infrastructure/services/FirebaseQuestService';

const questService: IQuestService = new FirebaseQuestService();

export async function GET() {
    try {
        let quests = await questService.getAllQuests();
        //filter out the quests with a userId property
        quests = quests.filter(quest => !quest.userId || quest.userId === "");
        return NextResponse.json(quests);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
