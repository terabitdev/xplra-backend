import { NextResponse } from 'next/server';
import { Adventure } from '@/lib/domain/models/adventures';
import { IAdventureService } from '@/lib/domain/services/IAdventuresService';
import { FirebaseAdventureService } from '@/lib/infrastructure/services/FirebaseAdventuresService';

const adventureService: IAdventureService = new FirebaseAdventureService();

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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
