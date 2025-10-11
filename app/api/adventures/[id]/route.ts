import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const adventureId = params.id;

    // Search through all adminAdventures documents to find the adventure
    const adminAdventuresSnapshot = await adminDb.collection('adminAdventures').get();

    for (const doc of adminAdventuresSnapshot.docs) {
      const data = doc.data();
      const adventures = data.adventures || [];
      const adventure = adventures.find((a: Adventure) => a.id === adventureId);

      if (adventure) {
        return NextResponse.json(adventure);
      }
    }

    return NextResponse.json(
      { error: 'Adventure not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adventure' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const adventureData = JSON.parse(formData.get('adventure') as string);
    const imageFile = formData.get('image') as File | null;
    const imageFiles = formData.getAll('featuredImages') as File[];
    const adventureId = params.id;
    const adminId = adventureData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = adventureData.imageUrl || '';
    let featuredImages = adventureData.featuredImages || [];

    // Upload new main image if provided
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

      featuredImages = await Promise.all(uploadPromises);
    }

    // Get admin's adventure document
    const adminAdventureDocRef = adminDb.collection('adminAdventures').doc(adminId);
    const adminAdventureDoc = await adminAdventureDocRef.get();

    if (!adminAdventureDoc.exists) {
      return NextResponse.json(
        { error: 'Admin adventure document not found' },
        { status: 404 }
      );
    }

    const data = adminAdventureDoc.data();
    const adventures = data?.adventures || [];

    // Find and update the adventure in the array
    const adventureIndex = adventures.findIndex((a: Adventure) => a.id === adventureId);

    if (adventureIndex === -1) {
      return NextResponse.json(
        { error: 'Adventure not found' },
        { status: 404 }
      );
    }

    // Update the adventure
    adventures[adventureIndex] = {
      ...adventures[adventureIndex],
      title: adventureData.title,
      shortDescription: adventureData.shortDescription,
      longDescription: adventureData.longDescription,
      imageUrl,
      latitude: adventureData.latitude,
      longitude: adventureData.longitude,
      distance: adventureData.distance || 30,
      experience: adventureData.experience,
      featured: adventureData.featured || false,
      featuredImages,
      timeInSeconds: adventureData.timeInSeconds,
      hoursToCompleteAgain: adventureData.hoursToCompleteAgain || 0,
      category: adventureData.category,
    };

    // Update the document
    await adminAdventureDocRef.update({
      adventures,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Adventure updated successfully',
      adventure: adventures[adventureIndex],
    });
  } catch (error: any) {
    console.error('Update adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update adventure' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const adventureId = params.id;

    // Find the admin document containing this adventure
    const adminAdventuresSnapshot = await adminDb.collection('adminAdventures').get();

    for (const doc of adminAdventuresSnapshot.docs) {
      const data = doc.data();
      const adventures = data.adventures || [];
      const adventureToDelete = adventures.find((a: Adventure) => a.id === adventureId);

      if (adventureToDelete) {
        // Remove the adventure from the array
        await doc.ref.update({
          adventures: admin.firestore.FieldValue.arrayRemove(adventureToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Adventure deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Adventure not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete adventure' },
      { status: 500 }
    );
  }
}
