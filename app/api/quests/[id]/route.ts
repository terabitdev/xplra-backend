import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const questId = params.id;

    // Search through all adminQuests documents to find the quest
    const adminQuestsSnapshot = await adminDb.collection('adminQuests').get();

    for (const doc of adminQuestsSnapshot.docs) {
      const data = doc.data();
      const quests = data.quests || [];
      const quest = quests.find((q: Quest) => q.id === questId);

      if (quest) {
        return NextResponse.json(quest);
      }
    }

    return NextResponse.json(
      { error: 'Quest not found' },
      { status: 404 }
    );
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
    const formData = await req.formData();
    const questData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;
    const questId = params.id;
    const adminId = questData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = questData.imageUrl || '';

    // Upload new image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `quests/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Get admin's quest document
    const adminQuestDocRef = adminDb.collection('adminQuests').doc(adminId);
    const adminQuestDoc = await adminQuestDocRef.get();

    if (!adminQuestDoc.exists) {
      return NextResponse.json(
        { error: 'Admin quest document not found' },
        { status: 404 }
      );
    }

    const data = adminQuestDoc.data();
    const quests = data?.quests || [];

    // Find and update the quest in the array
    const questIndex = quests.findIndex((q: Quest) => q.id === questId);

    if (questIndex === -1) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Update the quest
    quests[questIndex] = {
      ...quests[questIndex],
      title: questData.title,
      shortDescription: questData.shortDescription,
      longDescription: questData.longDescription,
      experience: questData.experience,
      imageUrl,
      stepCode: questData.stepCode,
      stepLatitude: questData.stepLatitude,
      stepLongitude: questData.stepLongitude,
      stepType: questData.stepType,
      timeInSeconds: questData.timeInSeconds,
      distance: questData.distance || 0,
      category: questData.category,
      hoursToCompleteAgain: questData.hoursToCompleteAgain || 0,
    };

    // Update the document
    await adminQuestDocRef.update({
      quests,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Quest updated successfully',
      quest: quests[questIndex],
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

    // Find the admin document containing this quest
    const adminQuestsSnapshot = await adminDb.collection('adminQuests').get();

    for (const doc of adminQuestsSnapshot.docs) {
      const data = doc.data();
      const quests = data.quests || [];
      const questToDelete = quests.find((q: Quest) => q.id === questId);

      if (questToDelete) {
        // Remove the quest from the array
        await doc.ref.update({
          quests: admin.firestore.FieldValue.arrayRemove(questToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Quest deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Quest not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quest' },
      { status: 500 }
    );
  }
}
