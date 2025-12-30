import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';
import admin from '@/lib/firebase-admin';

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
    const place: Place = {
      placeId: data?.placeId || placeDoc.id,
      name: data?.name || '',
      geo: data?.geo || { lat: 0, lng: 0 },
      geohash: data?.geohash || '',
      categories: data?.categories || [],
      address: data?.address,
      source: data?.source || 'seed',
      status: data?.status || 'active',
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
    const placeData = await req.json();
    const placeId = params.id;

    const placeDocRef = adminDb.collection('places').doc(placeId);
    const placeDoc = await placeDocRef.get();

    if (!placeDoc.exists) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    const updatedPlace: Partial<Place> = {
      name: placeData.name,
      geo: placeData.geo,
      geohash: placeData.geohash,
      categories: placeData.categories || [],
      address: placeData.address || undefined,
      source: placeData.source,
      status: placeData.status,
      updatedAt: new Date().toISOString(),
    };

    await placeDocRef.update({
      ...updatedPlace,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
