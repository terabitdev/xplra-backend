import { NextResponse } from 'next/server';
import { IQuestService } from '@/lib/domain/services/IQuestService';
import { FirebaseQuestService } from '@/lib/infrastructure/services/FirebaseQuestService';

const questService: IQuestService = new FirebaseQuestService();

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const questId = params.id;

    try {
        const quest = await questService.getQuestById(questId);
        if (!quest) {
            return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
        }
        return NextResponse.json(quest);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const questId = params.id;
    const formData = await req.formData();
    const updatedData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;

    try {
        await questService.updateQuest(questId, updatedData, imageFile || undefined);
        return NextResponse.json({ message: 'Quest updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const questId = params.id;

    try {
        await questService.deleteQuest(questId);
        return NextResponse.json({ message: 'Quest deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
