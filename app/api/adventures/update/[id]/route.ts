import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';
import { NextResponse } from 'next/server';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const formData = await req.formData();
        const adventureData = JSON.parse(formData.get('adventure') as string);
        const imageFile = formData.get('image') as File | null;

        await adventureService.updateAdventure(params.id, adventureData, imageFile || undefined);
        return NextResponse.json({ message: 'Adventure updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
