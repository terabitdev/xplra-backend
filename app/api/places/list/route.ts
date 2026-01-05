import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';

export async function GET() {
  try {
    const placesSnapshot = await adminDb.collection('places').get();

    const allPlaces: Place[] = [];

    placesSnapshot.forEach((doc) => {
      const data = doc.data();
      allPlaces.push({
        placeId: data.placeId || doc.id,
        name: data.name || '',
        geo: data.geo || { lat: 0, lng: 0 },
        geohash: data.geohash || '',
        categories: data.categories || [],
        address: data.address,
        source: data.source || 'seed',
        status: data.status || 'active',
        imageUrls: data.imageUrls || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Place);
    });

    return NextResponse.json(allPlaces);
  } catch (error: unknown) {
    console.error('Get places error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch places';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
