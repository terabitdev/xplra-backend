import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';
import { getCategoriesCache, setCategoriesCache, invalidateCategoriesCache } from '@/lib/cache/categoriesCache';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skipCache = searchParams.get('fresh') === 'true';
    const rootsOnly = searchParams.get('roots') === 'true';
    const parentId = searchParams.get('parentId');
    // Check cache (only for unfiltered requests)
    if (!skipCache && !rootsOnly && !parentId) {
      const cached = getCategoriesCache();
      if (cached) return NextResponse.json(cached);
    }

    let query: FirebaseFirestore.Query = adminDb.collection('adminCategories');

    if (rootsOnly) {
      query = query.where('parentId', '==', null);
    } else if (parentId) {
      query = query.where('parentId', '==', parentId);
    }

    query = query.orderBy('interestsOrder', 'asc');
    const snapshot = await query.get();

    const categories: Category[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
      } as Category;
    });

    // Update cache only for unfiltered requests
    if (!rootsOnly && !parentId) {
      setCategoriesCache(categories);
    }

    return NextResponse.json(categories);
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
    const iconFile = formData.get('icon') as File | null;

    if (!categoryData.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const categoryId = `category_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Auto-calculate hierarchy fields
    let level = 0;
    let ancestorIds: string[] = [];

    if (categoryData.parentId) {
      const parentDoc = await adminDb.collection('adminCategories').doc(categoryData.parentId).get();
      if (!parentDoc.exists) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
      const parentData = parentDoc.data();
      level = (parentData?.level || 0) + 1;
      ancestorIds = [...(parentData?.ancestorIds || []), categoryData.parentId];
    }

    // Handle icon upload
    let iconUrl = categoryData.icon || '';
    if (iconFile) {
      const bucket = adminStorage.bucket();
      const filePath = `categories/${categoryId}/${Date.now()}_${iconFile.name}`;
      const fileBuffer = Buffer.from(await iconFile.arrayBuffer());
      const fileRef = bucket.file(filePath);
      await fileRef.save(fileBuffer, {
        metadata: { contentType: iconFile.type },
      });
      await fileRef.makePublic();
      iconUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    const newCategory = {
      id: categoryId,
      name: categoryData.name,
      icon: iconUrl,
      interestName: categoryData.interestName || categoryData.name,
      isActive: categoryData.isActive ?? true,
      isVisibleInInterests: categoryData.isVisibleInInterests ?? false,
      interestsOrder: categoryData.interestsOrder ?? 0,
      placeOrder: categoryData.placeOrder ?? 0,
      level,
      parentId: categoryData.parentId || null,
      ancestorIds,
    };

    await adminDb.collection('adminCategories').doc(categoryId).set({
      ...newCategory,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    invalidateCategoriesCache();

    const now = new Date().toISOString();
    return NextResponse.json({
      ...newCategory,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
