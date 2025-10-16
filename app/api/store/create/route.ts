import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { StoreItem } from '@/lib/domain/models/storeItem';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const itemData = JSON.parse(formData.get('item') as string);
    const imageFile = formData.get('image') as File | null;
    const adminId = itemData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // Upload image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `store/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Generate unique item ID
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create store item object
    const newItem: StoreItem = {
      id: itemId,
      title: itemData.title,
      xpCost: itemData.xpCost,
      imageUrl,
      isAvailable: itemData.isAvailable ?? true,
      inventoryCount: itemData.inventoryCount,
      userId: adminId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reference to admin's store document
    const adminStoreDocRef = adminDb.collection('adminStore').doc(adminId);
    const adminStoreDoc = await adminStoreDocRef.get();

    if (adminStoreDoc.exists) {
      // Admin document exists, append to items array
      await adminStoreDocRef.update({
        items: admin.firestore.FieldValue.arrayUnion(newItem),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with items array
      await adminStoreDocRef.set({
        adminId,
        items: [newItem],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Create store item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create store item' },
      { status: 500 }
    );
  }
}
