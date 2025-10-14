import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get all admin adventure documents
    const adminAdventuresSnapshot = await adminDb.collection('adminAdventures').get();

    const allAdventures: Adventure[] = [];

    // Iterate through each admin document and collect all adventures
    adminAdventuresSnapshot.forEach((doc) => {
      const data = doc.data();
      const adventures = data.adventures || [];

      // Add all adventures from this admin
      adventures.forEach((adventure: Adventure) => {
        allAdventures.push(adventure);
      });
    });

    return NextResponse.json(allAdventures);
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
    const adminId = adventureData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

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

    // Generate unique adventure ID
    const adventureId = `adventure_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create adventure object
    const newAdventure: Adventure = {
      id: adventureId,
      adventureId: adventureId,
      title: adventureData.title,
      shortDescription: adventureData.shortDescription,
      longDescription: adventureData.longDescription,
      imageUrl,
      latitude: adventureData.latitude,
      longitude: adventureData.longitude,
      distance: adventureData.distance || 30,
      experience: adventureData.experience,
      featured: adventureData.featured || false,
      userId: adminId,
      featuredImages: featuredImages.length > 0 ? featuredImages : [],
      timeInSeconds: adventureData.timeInSeconds,
      hoursToCompleteAgain: adventureData.hoursToCompleteAgain || 0,
      category: adventureData.category,
    };

    // Reference to admin's adventure document
    const adminAdventureDocRef = adminDb.collection('adminAdventures').doc(adminId);
    const adminAdventureDoc = await adminAdventureDocRef.get();

    if (adminAdventureDoc.exists) {
      // Admin document exists, append to adventures array
      await adminAdventureDocRef.update({
        adventures: admin.firestore.FieldValue.arrayUnion(newAdventure),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with adventures array
      await adminAdventureDocRef.set({
        adminId,
        adventures: [newAdventure],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newAdventure);
  } catch (error: any) {
    console.error('Create adventure error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create adventure' },
      { status: 500 }
    );
  }
}
