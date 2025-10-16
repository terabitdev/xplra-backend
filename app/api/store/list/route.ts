import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { StoreItem } from '@/lib/domain/models/storeItem';

export async function GET() {
  try {
    // Get all admin store documents
    const adminStoreSnapshot = await adminDb.collection('adminStore').get();

    const allItems: StoreItem[] = [];

    // Iterate through each admin document and collect all store items
    adminStoreSnapshot.forEach((doc) => {
      const data = doc.data();
      const items = data.items || [];

      // Add all items from this admin
      items.forEach((item: StoreItem) => {
        allItems.push(item);
      });
    });

    return NextResponse.json(allItems);
  } catch (error: any) {
    console.error('Get store items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store items' },
      { status: 500 }
    );
  }
}
