import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';
import { NextResponse } from 'next/server';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function GET() {
    try {
        const allAdventures = await adventureService.getAllAdventures();
        const adventures = allAdventures.filter(adventure => adventure.userId === null);
        return NextResponse.json(adventures);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
