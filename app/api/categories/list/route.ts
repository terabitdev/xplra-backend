import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';

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
