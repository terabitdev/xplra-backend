import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';
import { NextResponse } from 'next/server';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const data = await req.json();
        await adventureService.updateAdventure(params.id, data);
        return NextResponse.json({ message: 'Adventure updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
