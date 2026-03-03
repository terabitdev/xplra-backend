import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { invalidateCategoriesCache } from '@/lib/cache/categoriesCache';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;
    const doc = await adminDb.collection('adminCategories').doc(categoryId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    return NextResponse.json({
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt || '',
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || '',
    });
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
    const iconFile = formData.get('icon') as File | null;
    const categoryId = params.id;

    const docRef = adminDb.collection('adminCategories').doc(categoryId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const existingData = docSnap.data()!;
    const updateData: Record<string, any> = {};

    // Copy over simple fields if provided
    if (categoryData.name !== undefined) updateData.name = categoryData.name;
    if (categoryData.interestName !== undefined) updateData.interestName = categoryData.interestName;
    if (categoryData.isActive !== undefined) updateData.isActive = categoryData.isActive;
    if (categoryData.isVisibleInInterests !== undefined) updateData.isVisibleInInterests = categoryData.isVisibleInInterests;
    if (categoryData.interestsOrder !== undefined) updateData.interestsOrder = categoryData.interestsOrder;
    if (categoryData.placeOrder !== undefined) updateData.placeOrder = categoryData.placeOrder;

    // Handle icon upload
    if (iconFile) {
      const bucket = adminStorage.bucket();
      const filePath = `categories/${categoryId}/${Date.now()}_${iconFile.name}`;
      const fileBuffer = Buffer.from(await iconFile.arrayBuffer());
      const fileRef = bucket.file(filePath);
      await fileRef.save(fileBuffer, {
        metadata: { contentType: iconFile.type },
      });
      await fileRef.makePublic();
      updateData.icon = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    // Handle parentId change (reparenting)
    if (categoryData.parentId !== undefined && categoryData.parentId !== existingData.parentId) {
      // Cannot set parent to self
      if (categoryData.parentId === categoryId) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      if (categoryData.parentId) {
        // Check if new parent is a descendant (would create a cycle)
        const newParentDoc = await adminDb.collection('adminCategories').doc(categoryData.parentId).get();
        if (!newParentDoc.exists) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 }
          );
        }
        const newParentData = newParentDoc.data()!;
        if (newParentData.ancestorIds?.includes(categoryId)) {
          return NextResponse.json(
            { error: 'Cannot move a category under its own descendant' },
            { status: 400 }
          );
        }
        updateData.parentId = categoryData.parentId;
        updateData.level = (newParentData.level || 0) + 1;
        updateData.ancestorIds = [...(newParentData.ancestorIds || []), categoryData.parentId];
      } else {
        updateData.parentId = null;
        updateData.level = 0;
        updateData.ancestorIds = [];
      }

      // Cascade update to all descendants
      const descendantsSnapshot = await adminDb.collection('adminCategories')
        .where('ancestorIds', 'array-contains', categoryId).get();

      if (!descendantsSnapshot.empty) {
        const batch = adminDb.batch();
        const newAncestorsForThis = updateData.ancestorIds || existingData.ancestorIds || [];

        for (const descDoc of descendantsSnapshot.docs) {
          const descData = descDoc.data();
          const oldAncestorIds: string[] = descData.ancestorIds || [];
          const indexOfThis = oldAncestorIds.indexOf(categoryId);
          const suffix = oldAncestorIds.slice(indexOfThis); // [categoryId, child1, ...]
          const newAncestorIds = [...newAncestorsForThis, ...suffix];

          batch.update(descDoc.ref, {
            ancestorIds: newAncestorIds,
            level: newAncestorIds.length,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      }
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);

    invalidateCategoriesCache();

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        ...existingData,
        ...updateData,
        id: categoryId,
        updatedAt: new Date().toISOString(),
      },
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

    // Check for children
    const childrenSnapshot = await adminDb.collection('adminCategories')
      .where('parentId', '==', categoryId).limit(1).get();

    if (!childrenSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete category with children. Delete or move children first.' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('adminCategories').doc(categoryId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await docRef.delete();
    invalidateCategoriesCache();

    return NextResponse.json({
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
