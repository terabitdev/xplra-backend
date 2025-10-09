import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('quests').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const quest: Quest = { id: doc.id, ...doc.data() } as Quest;
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
    const formData = await req.formData();
    const questData = JSON.parse(formData.get('quest') as string);
    const imageFile = formData.get('image') as File | null;

    const updatedData: Partial<Quest> = { ...questData };

    // Upload new image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `quests/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      updatedData.imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Update document
    await adminDb.collection('quests').doc(params.id).update(updatedData);

    return NextResponse.json({
      message: 'Quest updated successfully',
      id: params.id,
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
    await adminDb.collection('quests').doc(params.id).delete();

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
