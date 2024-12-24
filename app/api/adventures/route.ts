import { Adventure } from '@/lib/domain/models/adventures';
import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';
import { NextResponse } from 'next/server';

const adventureService: IAdventureService = new FirebaseAdventureService();

export async function GET() {
    try {
        const allAdventures = await adventureService.getAllAdventures();
        const adventures = allAdventures.filter(adventure => adventure.userId === null || adventure.userId === "");
        return NextResponse.json(adventures);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}


export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const adventureData = JSON.parse(formData.get('adventure') as string);
        const imageFile = formData.get('image') as File | null;
        const imageFiles = formData.getAll('featuredImages') as File[];

        const adventure: Adventure = {
            ...adventureData,
            imageUrl: '', // Default value; FirebaseAdventureService will update this if an image is uploaded
            featuredImages: [], // Default value; FirebaseAdventureService will update this if images are uploaded
        };

        const newAdventure = await adventureService.createAdventure(adventure, imageFile || undefined, imageFiles);
        return NextResponse.json(newAdventure);
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}