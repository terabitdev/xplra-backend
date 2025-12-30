import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const placeData = await req.json();

    const placeId = placeData.placeId || `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newPlace: Place = {
      placeId,
      name: placeData.name,
      geo: placeData.geo || { lat: 0, lng: 0 },
      geohash: placeData.geohash || '',
      categories: placeData.categories || [],
      address: placeData.address || undefined,
      source: placeData.source || 'seed',
      status: placeData.status || 'active',
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
