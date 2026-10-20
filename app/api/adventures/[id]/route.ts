import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';
import admin from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const adventureData = JSON.parse(formData.get('adventure') as string);
    const imageFile = formData.get('image') as File | null;
    const imageFiles = formData.getAll('featuredImages') as File[];
    const adventureId = params.id;

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

    // Any admin can edit any adventure from this shared panel, so the owning
    // document is found by searching for the adventure id (same approach as
    // GET/DELETE below) rather than trusting a doc-id/admin-id read from the
    // submitted form — that field was never verified against who is actually
    // signed in.
    const adminAdventuresSnapshot = await adminDb.collection('adminAdventures').get();
    let adminAdventureDocRef: FirebaseFirestore.DocumentReference | null = null;
    let adventures: Adventure[] = [];
    let adventureIndex = -1;

    for (const doc of adminAdventuresSnapshot.docs) {
      const data = doc.data();
      const docAdventures: Adventure[] = data.adventures || [];
      const idx = docAdventures.findIndex((a: Adventure) => a.id === adventureId);
      if (idx !== -1) {
        adminAdventureDocRef = doc.ref;
        adventures = docAdventures;
        adventureIndex = idx;
        break;
      }
    }

    if (!adminAdventureDocRef || adventureIndex === -1) {
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
