import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const questId = params.id;

    // Get quest document directly by ID
    const questDoc = await adminDb.collection('adminQuests').doc(questId).get();

    if (!questDoc.exists) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const data = questDoc.data();
    const quest: Quest = {
      questId: data?.questId || questDoc.id,
      placeId: data?.placeId || null,
      title: data?.title || '',
      description: data?.description || '',
      type: data?.type || 'checkin_time',
      requirements: data?.requirements || {},
      xpReward: data?.xpReward || 0,
      cooldownSeconds: data?.cooldownSeconds || 3600,
      active: data?.active ?? true,
      startAt: data?.startAt,
      endAt: data?.endAt,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
    };

    return NextResponse.json(quest);
  } catch (error: any) {
    console.error('Get quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quest' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const questData = await req.json();
    const questId = params.id;

    // Get quest document
    const questDocRef = adminDb.collection('adminQuests').doc(questId);
    const questDoc = await questDocRef.get();

    if (!questDoc.exists) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Update the quest with new data
    const updatedQuest: Partial<Quest> = {
      placeId: questData.placeId ?? null,
      title: questData.title,
      description: questData.description,
      type: questData.type,
      requirements: questData.requirements || {},
      xpReward: questData.xpReward,
      cooldownSeconds: questData.cooldownSeconds,
      active: questData.active,
      startAt: questData.startAt || undefined,
      endAt: questData.endAt || undefined,
      updatedAt: new Date().toISOString(),
    };

    // Update the document
    await questDocRef.update({
      ...updatedQuest,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Quest updated successfully',
      quest: { questId, ...updatedQuest },
    });
  } catch (error: any) {
    console.error('Update quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quest' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const questId = params.id;

    // Get quest document
    const questDocRef = adminDb.collection('adminQuests').doc(questId);
    const questDoc = await questDocRef.get();

    if (!questDoc.exists) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Delete the quest document
    await questDocRef.delete();

    return NextResponse.json({
      message: 'Quest deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quest' },
      { status: 500 }
    );
  }
}
