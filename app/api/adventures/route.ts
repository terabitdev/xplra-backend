import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';

export async function GET() {
  try {
    const adventuresRef = adminDb.collection('adventures');
    const snapshot = await adventuresRef.get();

    const adventures: Adventure[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for public adventures (null or empty userId)
      if (!data.userId || data.userId === '') {
        adventures.push({ id: doc.id, ...data } as Adventure);
      }
    });

    return NextResponse.json(adventures);
  } catch (error: any) {
    console.error('Get adventures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adventures' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const adventureData = JSON.parse(formData.get('adventure') as string);
    const imageFile = formData.get('image') as File | null;
    const imageFiles = formData.getAll('featuredImages') as File[];

    let imageUrl = '';
    let featuredImages: string[] = [];

    // Upload main image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `adventures/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
    }

    // Upload featured images if provided
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

      featuredImages = await Promise.all(uploadPromises);
    }

    // Create adventure document
    const adventure: Omit<Adventure, 'id'> = {
      ...adventureData,
      imageUrl,
      featuredImages,
    };

    const docRef = await adminDb.collection('adventures').add(adventure);

    // Update with adventureId
    await docRef.update({ adventureId: docRef.id });

    const createdAdventure = {
      id: docRef.id,
      ...adventure,
      adventureId: docRef.id,
    };

    return NextResponse.json(createdAdventure);
  } catch (error: any) {
    console.error('Create adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create adventure' },
      { status: 400 }
    );
  }
}
