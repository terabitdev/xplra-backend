import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;
    const adminId = questData.userId; // Admin ID from the form

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
      const fileName = `quests/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Generate unique quest ID
    const questId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create quest object
    const newQuest: Quest = {
      id: questId,
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
      userId: adminId,
      distance: questData.distance || 0,
      category: questData.category,
      hoursToCompleteAgain: questData.hoursToCompleteAgain || 0,
    };

    // Reference to admin's quest document
    const adminQuestDocRef = adminDb.collection('adminQuests').doc(adminId);
    const adminQuestDoc = await adminQuestDocRef.get();

    if (adminQuestDoc.exists) {
      // Admin document exists, append to quests array
      await adminQuestDocRef.update({
        quests: admin.firestore.FieldValue.arrayUnion(newQuest),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with quests array
      await adminQuestDocRef.set({
        adminId,
        quests: [newQuest],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newQuest);
  } catch (error: any) {
    console.error('Create quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quest' },
      { status: 500 }
    );
  }
}
