import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';

function computeWindowTimestamp(isoString: string, offsetMinutes: number): admin.firestore.Timestamp {
  const ms = new Date(isoString).getTime() + offsetMinutes * 60 * 1000;
  return admin.firestore.Timestamp.fromMillis(ms);
}

function toIso(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'object' && 'toDate' in (val as object)) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return val as string;
}

function geopointToGeo(geoField: unknown) {
  if (!geoField) return undefined;
  const f = geoField as { geopoint?: { latitude: number; longitude: number }; geohash?: string };
  if (!f.geopoint) return undefined;
  return {
    lat: f.geopoint.latitude,
    lng: f.geopoint.longitude,
    geohash: f.geohash || '',
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const eventDoc = await adminDb.collection('events').doc(params.id).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const data = eventDoc.data()!;

    const event: Event = {
      eventId: data.eventId || eventDoc.id,
      title: data.title || '',
      xp: data.xp ?? 0,
      placeId: data.placeId ?? null,
      geoOverride: geopointToGeo(data.geoOverride),
      resolvedGeo: geopointToGeo(data.resolvedGeo),
      startTime: toIso(data.startTime) || '',
      endTime: toIso(data.endTime) || '',
      eventPreGraceMin: data.eventPreGraceMin ?? 15,
      eventPostGraceMin: data.eventPostGraceMin ?? 15,
      windowStart: toIso(data.windowStart),
      windowEnd: toIso(data.windowEnd),
      mode: data.mode ?? undefined,
      validationConfigId: data.validationConfigId ?? null,
      validationConfig: data.validationConfig ?? undefined,
      isActive: data.isActive ?? true,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };

    return NextResponse.json(event);
  } catch (error: unknown) {
    console.error('Get event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const body = await req.json();

    const eventDocRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventDocRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate: if placeId is null, geoOverride is required
    if (!body.placeId && !body.geoOverride) {
      return NextResponse.json(
        { error: 'geoOverride is required when placeId is null' },
        { status: 400 }
      );
    }

    const preGrace: number = body.eventPreGraceMin ?? 15;
    const postGrace: number = body.eventPostGraceMin ?? 15;

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

    const firestoreUpdate = {
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventDocRef.update(firestoreUpdate);

    const updatedEvent: Event = {
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
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error: unknown) {
    console.error('Update event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const eventDocRef = adminDb.collection('events').doc(params.id);
    const eventDoc = await eventDocRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await eventDocRef.delete();

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
