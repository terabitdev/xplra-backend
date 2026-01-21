import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';
import admin from '@/lib/firebase-admin';

// In-memory cache
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_DURATION = 120 * 1000; // 2 minutes (categories change less frequently)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skipCache = searchParams.get('fresh') === 'true';
    const now = Date.now();

    // Check cache
    if (!skipCache && categoriesCache && (now - categoriesCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json(categoriesCache.data);
    }

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

    // Update cache
    categoriesCache = { data: allCategories, timestamp: now };

    return NextResponse.json(allCategories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Invalidate cache after mutations (internal use only)
function invalidateCategoriesCache() {
  categoriesCache = null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const categoryData = JSON.parse(formData.get('category') as string);
    const adminId = categoryData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Generate unique category ID
    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create category object
    const newCategory: Category = {
      id: categoryId,
      name: categoryData.name,
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
