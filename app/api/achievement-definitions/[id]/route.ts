import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { AchievementDefinition } from '@/lib/domain/models/achievementDefinition';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection('achievementDefinitions').doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Achievement definition not found' }, { status: 404 });
    }

    const data = doc.data();
    const definition: AchievementDefinition = {
      ...data,
      id: doc.id,
      created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at || '',
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || data?.updated_at || '',
    } as AchievementDefinition;

    return NextResponse.json(definition);
  } catch (error: unknown) {
    console.error('Get achievement definition error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch achievement definition';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const docRef = adminDb.collection('achievementDefinitions').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Achievement definition not found' }, { status: 404 });
    }

    const updateData = {
      ...body,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Immutable fields
    delete updateData.id;
    delete updateData.created_by;
    delete updateData.created_at;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const definition: AchievementDefinition = {
      ...updatedData,
      id: updatedDoc.id,
      created_at: updatedData?.created_at?.toDate?.()?.toISOString() || '',
      updated_at: updatedData?.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as AchievementDefinition;

    return NextResponse.json({ definition });
  } catch (error: unknown) {
    console.error('Update achievement definition error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update achievement definition';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('achievementDefinitions').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Achievement definition not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ message: 'Achievement definition deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete achievement definition error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete achievement definition';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
