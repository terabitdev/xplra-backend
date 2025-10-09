import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('adventures').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Adventure not found' },
        { status: 404 }
      );
    }

    const adventure: Adventure = { id: doc.id, ...doc.data() } as Adventure;
    return NextResponse.json(adventure);
  } catch (error: any) {
    console.error('Get adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adventure' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const adventureData = JSON.parse(formData.get('adventure') as string);
    const imageFile = formData.get('image') as File | null;
    const imageFiles = formData.getAll('featuredImages') as File[];

    const updatedData: Partial<Adventure> = { ...adventureData };

    // Upload new main image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `adventures/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      updatedData.imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Upload new featured images if provided
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `adventures/${Date.now()}_${file.name}`;
        const storageFile = adminStorage.bucket().file(fileName);

        await storageFile.save(buffer, {
          metadata: { contentType: file.type },
        });

        await storageFile.makePublic();
        return `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
      });

      updatedData.featuredImages = await Promise.all(uploadPromises);
    }

    // Update document
    await adminDb.collection('adventures').doc(params.id).update(updatedData);

    return NextResponse.json({
      message: 'Adventure updated successfully',
      id: params.id,
    });
  } catch (error: any) {
    console.error('Update adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update adventure' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await adminDb.collection('adventures').doc(params.id).delete();

    return NextResponse.json({
      message: 'Adventure deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete adventure' },
      { status: 400 }
    );
  }
}
