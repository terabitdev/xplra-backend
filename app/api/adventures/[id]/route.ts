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
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: 'An unknown error occurred' }, { status: 400 });
        }
    }
}



export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const formData = await req.formData();
        const adventureData = JSON.parse(formData.get('adventure') as string);
        const imageFile = formData.get('image') as File | null;
        const imageFiles = formData.getAll('featuredImages') as File[];

        await adventureService.updateAdventure(params.id, adventureData, imageFile || undefined, imageFiles);
        return NextResponse.json({ message: 'Adventure updated successfully' });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await adventureService.deleteAdventure(params.id);
        return NextResponse.json({ message: 'Adventure deleted successfully' });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

