import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;

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

    // Create quest document
    const quest: Omit<Quest, 'id'> = {
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
      userId: questData.userId || null,
      distance: questData.distance || null,
      category: questData.category,
    };

    const docRef = await adminDb.collection('quests').add(quest);

    return NextResponse.json({
      id: docRef.id,
      ...quest,
    });
  } catch (error: any) {
    console.error('Create quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quest' },
      { status: 500 }
    );
  }
}
