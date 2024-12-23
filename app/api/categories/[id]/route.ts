import { ICategoryService } from '@/lib/domain/services/ICategoryService';
import { FirebaseICategoryService } from '@/lib/infrastructure/services/FirebaseCategoryService';
import { NextResponse } from 'next/server';

const categoriesService: ICategoryService = new FirebaseICategoryService();

export async function GET(req: Request) {
    const id = req.url.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const categories = await categoriesService.getById(id);
        if (!categories) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }
        return NextResponse.json(categories);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const id = req.url.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const categoriesData = JSON.parse(formData.get('category') as string);
        const imageFile = formData.get('image') as File | null;
        const updatedCategory = await categoriesService.updateCategory(id, categoriesData, imageFile || undefined);
        return NextResponse.json(updatedCategory);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }
}

export async function PATCH(req: Request) {
    const id = req.url.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const categoriesData = JSON.parse(formData.get('category') as string);
        const imageFile = formData.get('image') as File | null;
        const updatedCategory = await categoriesService.updateCategory(id, categoriesData, imageFile || undefined);
        
        return NextResponse.json(updatedCategory);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }
}