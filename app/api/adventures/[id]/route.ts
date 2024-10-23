import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';
import { NextResponse } from 'next/server';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const adventure = await adventureService.getById(params.id);
        if (adventure) {
            return NextResponse.json(adventure);
        } else {
            return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
