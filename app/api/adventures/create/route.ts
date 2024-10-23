import { NextResponse } from 'next/server';
import { Adventure } from '@/lib/domain/models/adventures';
import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function POST(req: Request) {
    try {
        const data: Adventure = await req.json();
        const newAdventure = await adventureService.createAdventure(data);
        return NextResponse.json(newAdventure);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
