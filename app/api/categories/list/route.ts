import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Category } from '@/lib/domain/models/category';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('adminCategories')
      .orderBy('interestsOrder', 'asc')
      .get();

    const allCategories: Category[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
      } as Category;
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
