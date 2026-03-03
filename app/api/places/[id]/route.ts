import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id;

    const placeDoc = await adminDb.collection('places').doc(placeId).get();

    if (!placeDoc.exists) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    const data = placeDoc.data();
    // Handle both old format (geo: {lat, lng}) and new Flutter format (geo: {geopoint, geohash})
    const geopoint = data?.geo?.geopoint;
    const geo = geopoint
      ? { lat: geopoint.latitude, lng: geopoint.longitude }
      : (data?.geo?.lat !== undefined ? { lat: data.geo.lat, lng: data.geo.lng } : { lat: 0, lng: 0 });

    const place: Place = {
      placeId: data?.placeId || placeDoc.id,
      name: data?.name || '',
      geo,
      geohash: data?.geo?.geohash || data?.geohash || '',
      categorySelections: data?.categorySelections || (data?.categoryIds ? data.categoryIds.map((id: string) => ({ selectedId: id, path: [id] })) : []),
      location: data?.location,
      description: data?.description,
      source: data?.source || 'seed',
      status: data?.status || 'active',
      type: data?.type || 'checkin_time',
      requirements: data?.requirements || {},
      imageUrls: data?.imageUrls || [],
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
    };

    return NextResponse.json(place);
  } catch (error: unknown) {
    console.error('Get place error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch place';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const placeId = params.id;

    // Extract place data from FormData
    const placeDataStr = formData.get('placeData') as string;
    const placeData = JSON.parse(placeDataStr);

    const placeDocRef = adminDb.collection('places').doc(placeId);
    const placeDoc = await placeDocRef.get();

    if (!placeDoc.exists) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    // Handle new image uploads
    const newImageUrls: string[] = [];
    const imageFiles: File[] = [];

    // Collect all image files from FormData
    for (let i = 0; i < 4; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      if (file) {
        imageFiles.push(file);
      }
    }

    // Upload new images to Firebase Storage
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
      newImageUrls.push(publicUrl);
    }

    // Merge existing imageUrls with new ones (if any)
    const existingImageUrls = placeData.imageUrls || [];
    const combinedImageUrls = [...existingImageUrls, ...newImageUrls];

    // Auto-generate geohash from lat/lng
    const geoInput = placeData.geo || { lat: 0, lng: 0 };
    const geohash = geoInput.lat && geoInput.lng ? ngeohash.encode(geoInput.lat, geoInput.lng, 9) : '';
    const status = placeData.status;

    // Build Firestore update in Flutter-compatible format
    const firestoreUpdate = {
      name: placeData.name,
      geo: {
        geohash,
        geopoint: new admin.firestore.GeoPoint(geoInput.lat, geoInput.lng),
      },
      categorySelections: placeData.categorySelections || [],
      xp: placeData.xp || 0,
      location: placeData.location || '',
      description: placeData.description || '',
      source: placeData.source,
      status,
      type: placeData.type || 'checkin_time',
      requirements: placeData.requirements || {},
      imageUrls: combinedImageUrls.length > 0 ? combinedImageUrls : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await placeDocRef.update(firestoreUpdate);

    // Return admin-friendly format
    const updatedPlace: Partial<Place> = {
      name: placeData.name,
      geo: geoInput,
      geohash,
      categorySelections: placeData.categorySelections || [],
      xp: placeData.xp || 0,
      location: placeData.location || undefined,
      description: placeData.description || undefined,
      source: placeData.source,
      status,
      type: placeData.type || 'checkin_time',
      requirements: placeData.requirements || {},
      imageUrls: combinedImageUrls.length > 0 ? combinedImageUrls : undefined,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Place updated successfully',
      place: { placeId, ...updatedPlace },
    });
  } catch (error: unknown) {
    console.error('Update place error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update place';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id;

    const placeDocRef = adminDb.collection('places').doc(placeId);
    const placeDoc = await placeDocRef.get();

    if (!placeDoc.exists) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    await placeDocRef.delete();

    return NextResponse.json({
      message: 'Place deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete place error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete place';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
