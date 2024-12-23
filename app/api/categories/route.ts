import { ICategoryService } from '@/lib/domain/services/ICategoryService';
import { FirebaseICategoryService } from '@/lib/infrastructure/services/FirebaseCategoryService';
import { NextResponse } from 'next/server';

const categoriesService: ICategoryService = new FirebaseICategoryService();

export async function GET() {
    try {
        const allCategories = await categoriesService.getAllCategories();
        return NextResponse.json(allCategories);
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
        const categoryData = JSON.parse(formData.get('category') as string);

        const imageFile = formData.get('image') as File | null;
        if (!imageFile) {
            throw new Error('Image is required');
        }
        const category = {
            ...categoryData,
        };
        const newAchievement = await categoriesService.createCategory(category, imageFile!);
        return NextResponse.json(newAchievement);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }
}