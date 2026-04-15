import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { QuestCategory } from '@/lib/domain/models/questCategory';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection('questCategories').doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quest category not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const category: QuestCategory = {
      id: doc.id,
      name: data?.name,
      priority: data?.priority,
      isActive: data?.isActive,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt || '',
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || '',
    };

    return NextResponse.json(category);
  } catch (error: unknown) {
    console.error('Get quest category error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quest category';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const docRef = adminDb.collection('questCategories').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quest category not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) {
      const trimmed = typeof body.name === 'string' ? body.name.trim() : '';
      if (!trimmed) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = trimmed;
    }

    if (body.priority !== undefined) {
      if (typeof body.priority !== 'number' || Number.isNaN(body.priority)) {
        return NextResponse.json(
          { error: 'Priority must be a number' },
          { status: 400 }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = !!body.isActive;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const category: QuestCategory = {
      id: updatedDoc.id,
      name: updatedData?.name,
      priority: updatedData?.priority,
      isActive: updatedData?.isActive,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || '',
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json({ category });
  } catch (error: unknown) {
    console.error('Update quest category error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update quest category';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('questCategories').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quest category not found' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      message: 'Quest category deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete quest category error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete quest category';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
