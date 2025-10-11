import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;

    // Search through all adminCategories documents to find the category
    const adminCategoriesSnapshot = await adminDb.collection('adminCategories').get();

    for (const doc of adminCategoriesSnapshot.docs) {
      const data = doc.data();
      const categories = data.categories || [];
      const category = categories.find((c: Category) => c.id === categoryId);

      if (category) {
        return NextResponse.json(category);
      }
    }

    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const categoryData = JSON.parse(formData.get('category') as string);
    const imageFile = formData.get('image') as File | null;
    const categoryId = params.id;
    const adminId = categoryData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = categoryData.imageUrl || '';

    // Upload new image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `categories/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Get admin's category document
    const adminCategoryDocRef = adminDb.collection('adminCategories').doc(adminId);
    const adminCategoryDoc = await adminCategoryDocRef.get();

    if (!adminCategoryDoc.exists) {
      return NextResponse.json(
        { error: 'Admin category document not found' },
        { status: 404 }
      );
    }

    const data = adminCategoryDoc.data();
    const categories = data?.categories || [];

    // Find and update the category in the array
    const categoryIndex = categories.findIndex((c: Category) => c.id === categoryId);

    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update the category
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: categoryData.name,
      imageUrl,
    };

    // Update the document
    await adminCategoryDocRef.update({
      categories,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Category updated successfully',
      category: categories[categoryIndex],
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;

    // Find the admin document containing this category
    const adminCategoriesSnapshot = await adminDb.collection('adminCategories').get();

    for (const doc of adminCategoriesSnapshot.docs) {
      const data = doc.data();
      const categories = data.categories || [];
      const categoryToDelete = categories.find((c: Category) => c.id === categoryId);

      if (categoryToDelete) {
        // Remove the category from the array
        await doc.ref.update({
          categories: admin.firestore.FieldValue.arrayRemove(categoryToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Category deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
