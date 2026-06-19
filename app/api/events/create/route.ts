import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';

function computeWindowTimestamp(isoString: string, offsetMinutes: number): admin.firestore.Timestamp {
  const ms = new Date(isoString).getTime() + offsetMinutes * 60 * 1000;
  return admin.firestore.Timestamp.fromMillis(ms);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate: if placeId is null, geoOverride is required
    if (!body.placeId && !body.geoOverride) {
      return NextResponse.json(
        { error: 'geoOverride is required when placeId is null' },
        { status: 400 }
      );
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const preGrace: number = body.eventPreGraceMin ?? 15;
    const postGrace: number = body.eventPostGraceMin ?? 15;

    // Compute windowStart and windowEnd
    const windowStart = computeWindowTimestamp(body.startTime, -preGrace);
    const windowEnd = computeWindowTimestamp(body.endTime, postGrace);

    // Compute resolvedGeo
    let resolvedGeoFirestore: { geopoint: admin.firestore.GeoPoint; geohash: string } | null = null;

    if (body.geoOverride) {
      const { lat, lng } = body.geoOverride;
      const geohash = ngeohash.encode(lat, lng, 9);
      resolvedGeoFirestore = {
        geopoint: new admin.firestore.GeoPoint(lat, lng),
        geohash,
      };
    } else if (body.placeId) {
      const placeDoc = await adminDb.collection('places').doc(body.placeId).get();
      if (placeDoc.exists) {
        const placeData = placeDoc.data();
        const geopoint = placeData?.geo?.geopoint;
        if (geopoint) {
          resolvedGeoFirestore = {
            geopoint,
            geohash: placeData?.geo?.geohash || '',
          };
        }
      }
    }

    // Build geoOverride in Firestore format
    let geoOverrideFirestore: { geopoint: admin.firestore.GeoPoint; geohash: string } | null = null;
    if (body.geoOverride) {
      const { lat, lng } = body.geoOverride;
      const geohash = ngeohash.encode(lat, lng, 9);
      geoOverrideFirestore = {
        geopoint: new admin.firestore.GeoPoint(lat, lng),
        geohash,
      };
    }

    const { mode: vcMode, ...vcWithoutMode } = body.validationConfig ?? {};

    const firestoreDoc = {
      eventId,
      title: body.title,
      xp: Number(body.xp) || 0,
      placeId: body.placeId ?? null,
      geoOverride: geoOverrideFirestore,
      resolvedGeo: resolvedGeoFirestore,
      startTime: admin.firestore.Timestamp.fromDate(new Date(body.startTime)),
      endTime: admin.firestore.Timestamp.fromDate(new Date(body.endTime)),
      eventPreGraceMin: preGrace,
      eventPostGraceMin: postGrace,
      windowStart,
      windowEnd,
      mode: body.mode ?? vcMode ?? null,
      validationConfigId: body.validationConfigId ?? null,
      validationConfig: body.validationConfig ? vcWithoutMode : null,
      isActive: body.isActive ?? true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection('events').doc(eventId).set(firestoreDoc);

    const responseEvent: Event = {
      eventId,
      title: body.title,
      xp: Number(body.xp) || 0,
      placeId: body.placeId ?? null,
      geoOverride: body.geoOverride
        ? { lat: body.geoOverride.lat, lng: body.geoOverride.lng, geohash: geoOverrideFirestore!.geohash }
        : undefined,
      resolvedGeo: resolvedGeoFirestore
        ? { lat: resolvedGeoFirestore.geopoint.latitude, lng: resolvedGeoFirestore.geopoint.longitude, geohash: resolvedGeoFirestore.geohash }
        : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      eventPreGraceMin: preGrace,
      eventPostGraceMin: postGrace,
      windowStart: windowStart.toDate().toISOString(),
      windowEnd: windowEnd.toDate().toISOString(),
      mode: body.mode ?? vcMode ?? undefined,
      validationConfigId: body.validationConfigId ?? null,
      validationConfig: body.validationConfig ? vcWithoutMode : undefined,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseEvent);
  } catch (error: unknown) {
    console.error('Create event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
