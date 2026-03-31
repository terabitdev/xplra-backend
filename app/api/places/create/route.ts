import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';

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

    // Auto-generate geohash from lat/lng
    const geoInput = placeData.geo || { lat: 0, lng: 0 };
    const geohash = geoInput.lat && geoInput.lng ? ngeohash.encode(geoInput.lat, geoInput.lng, 9) : '';
    const status = placeData.status || 'active';

    // Derive categoryIds from categorySelections
    const categoryIds = Array.from(new Set((placeData.categorySelections || []).flatMap((cs: { path: string[] }) => cs.path)));

    // Build Firestore document in Flutter-compatible format
    const firestoreDoc = {
      placeId,
      name: placeData.name,
      geo: {
        geohash,
        geopoint: new admin.firestore.GeoPoint(geoInput.lat, geoInput.lng),
      },
      categorySelections: placeData.categorySelections || [],
      categoryIds,
      xp: placeData.xp || 0,
      location: placeData.location || '',
      description: placeData.description || '',
      source: placeData.source || 'seed',
      status,
      type: placeData.type || 'checkin_time',
      requirements: placeData.requirements || {},
      validationConfigId: placeData.validationConfigId || null,
      validationConfig: placeData.validationConfig || null,
      imageUrls: imageUrls.length > 0 ? imageUrls : [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const placeDocRef = adminDb.collection('places').doc(placeId);
    await placeDocRef.set(firestoreDoc);

    // Return admin-friendly format for the dashboard
    const responsePlace: Place = {
      placeId,
      name: placeData.name,
      geo: geoInput,
      geohash,
      categorySelections: placeData.categorySelections || [],
      xp: placeData.xp || 0,
      location: placeData.location || undefined,
      description: placeData.description || undefined,
      source: placeData.source || 'seed',
      status,
      type: placeData.type || 'checkin_time',
      requirements: placeData.requirements || {},
      validationConfigId: placeData.validationConfigId || undefined,
      validationConfig: placeData.validationConfig || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(responsePlace);
  } catch (error: unknown) {
    console.error('Create place error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create place';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
