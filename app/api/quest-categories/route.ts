import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (typeof body.priority !== 'number' || Number.isNaN(body.priority)) {
      return NextResponse.json(
        { error: 'Priority must be a number' },
        { status: 400 }
      );
    }

    const newCategory = {
      name,
      priority: body.priority,
      isActive: body.isActive ?? true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('questCategories').add(newCategory);

    const now = new Date().toISOString();
    return NextResponse.json({
      id: docRef.id,
      name,
      priority: body.priority,
      isActive: newCategory.isActive,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error: unknown) {
    console.error('Create quest category error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create quest category';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
