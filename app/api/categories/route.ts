import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get all admin category documents
    const adminCategoriesSnapshot = await adminDb.collection('adminCategories').get();

    const allCategories: Category[] = [];

    // Iterate through each admin document and collect all categories
    adminCategoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const categories = data.categories || [];

      // Add all categories from this admin
      categories.forEach((category: Category) => {
        allCategories.push(category);
      });
    });

    return NextResponse.json(allCategories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const categoryData = JSON.parse(formData.get('category') as string);
    const imageFile = formData.get('image') as File | null;
    const adminId = categoryData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // Upload image
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fileName = `categories/${Date.now()}_${imageFile.name}`;
    const file = adminStorage.bucket().file(fileName);

    await file.save(buffer, {
      metadata: { contentType: imageFile.type },
    });

    await file.makePublic();
    imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;

    // Generate unique category ID
    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create category object
    const newCategory: Category = {
      id: categoryId,
      name: categoryData.name,
      imageUrl,
      userId: adminId,
    };

    // Reference to admin's category document
    const adminCategoryDocRef = adminDb.collection('adminCategories').doc(adminId);
    const adminCategoryDoc = await adminCategoryDocRef.get();

    if (adminCategoryDoc.exists) {
      // Admin document exists, append to categories array
      await adminCategoryDocRef.update({
        categories: admin.firestore.FieldValue.arrayUnion(newCategory),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with categories array
      await adminCategoryDocRef.set({
        adminId,
        categories: [newCategory],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newCategory);
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
