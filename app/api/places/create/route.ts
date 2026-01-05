import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Extract place data from FormData
    const placeDataStr = formData.get('placeData') as string;
    const placeData = JSON.parse(placeDataStr);

    const placeId = placeData.placeId || `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Handle image uploads
    const imageUrls: string[] = [];
    const imageFiles: File[] = [];

    // Collect all image files from FormData
    for (let i = 0; i < 4; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      if (file) {
        imageFiles.push(file);
      }
    }

    // Upload images to Firebase Storage
    for (const file of imageFiles) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `${timestamp}_${randomStr}_${file.name}`;
      const filePath = `places/${placeId}/${fileName}`;

      const bucket = adminStorage.bucket();
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileRef = bucket.file(filePath);

      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      imageUrls.push(publicUrl);
    }

    const newPlace: Place = {
      placeId,
      name: placeData.name,
      geo: placeData.geo || { lat: 0, lng: 0 },
      geohash: placeData.geohash || '',
      categories: placeData.categories || [],
      address: placeData.address || undefined,
      source: placeData.source || 'seed',
      status: placeData.status || 'active',
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const placeDocRef = adminDb.collection('places').doc(placeId);
    await placeDocRef.set({
      ...newPlace,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(newPlace);
  } catch (error: unknown) {
    console.error('Create place error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create place';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
