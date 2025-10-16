import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { StoreItem } from '@/lib/domain/models/storeItem';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id;

    // Search through all adminStore documents to find the item
    const adminStoreSnapshot = await adminDb.collection('adminStore').get();

    for (const doc of adminStoreSnapshot.docs) {
      const data = doc.data();
      const items = data.items || [];
      const item = items.find((i: StoreItem) => i.id === itemId);

      if (item) {
        return NextResponse.json(item);
      }
    }

    return NextResponse.json(
      { error: 'Store item not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get store item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store item' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const itemData = JSON.parse(formData.get('item') as string);
    const imageFile = formData.get('image') as File | null;
    const itemId = params.id;
    const adminId = itemData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = itemData.imageUrl || '';

    // Upload new image if provided
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

    // Get admin's store document
    const adminStoreDocRef = adminDb.collection('adminStore').doc(adminId);
    const adminStoreDoc = await adminStoreDocRef.get();

    if (!adminStoreDoc.exists) {
      return NextResponse.json(
        { error: 'Admin store document not found' },
        { status: 404 }
      );
    }

    const data = adminStoreDoc.data();
    const items = data?.items || [];

    // Find and update the item in the array
    const itemIndex = items.findIndex((i: StoreItem) => i.id === itemId);

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      );
    }

    // Update the item
    items[itemIndex] = {
      ...items[itemIndex],
      title: itemData.title,
      xpCost: itemData.xpCost,
      imageUrl,
      isAvailable: itemData.isAvailable ?? items[itemIndex].isAvailable,
      inventoryCount: itemData.inventoryCount ?? items[itemIndex].inventoryCount,
      updatedAt: new Date().toISOString(),
    };

    // Update the document
    await adminStoreDocRef.update({
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Store item updated successfully',
      item: items[itemIndex],
    });
  } catch (error: any) {
    console.error('Update store item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update store item' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id;

    // Find the admin document containing this item
    const adminStoreSnapshot = await adminDb.collection('adminStore').get();

    for (const doc of adminStoreSnapshot.docs) {
      const data = doc.data();
      const items = data.items || [];
      const itemToDelete = items.find((i: StoreItem) => i.id === itemId);

      if (itemToDelete) {
        // Remove the item from the array
        await doc.ref.update({
          items: admin.firestore.FieldValue.arrayRemove(itemToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Store item deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Store item not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete store item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete store item' },
      { status: 500 }
    );
  }
}
