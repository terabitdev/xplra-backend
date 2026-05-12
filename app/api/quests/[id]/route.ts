import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { Quest } from '@/lib/domain/models/quest';

const VALID_TYPES = ['checkin', 'dwell', 'accrual', 'qrCode', 'codePhrase'] as const;

function buildContextPillSettings(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return null;
  const toTs = (v: unknown) => v ? admin.firestore.Timestamp.fromDate(new Date(v as string)) : null;
  return {
    nearbyEligible: Boolean(raw.nearbyEligible),
    todayEligible: Boolean(raw.todayEligible),
    todaySettings: raw.todayEligible && raw.todaySettings
      ? { ...(raw.todaySettings as object), startDateTime: toTs((raw.todaySettings as Record<string,unknown>).startDateTime), endDateTime: toTs((raw.todaySettings as Record<string,unknown>).endDateTime) }
      : null,
    limitedEligible: Boolean(raw.limitedEligible),
    limitedSettings: raw.limitedEligible && raw.limitedSettings
      ? { ...(raw.limitedSettings as object), startDateTime: toTs((raw.limitedSettings as Record<string,unknown>).startDateTime), endDateTime: toTs((raw.limitedSettings as Record<string,unknown>).endDateTime) }
      : null,
    eventEligible: Boolean(raw.eventEligible),
    eventSettings: raw.eventEligible && raw.eventSettings ? raw.eventSettings : null,
    featuredEligible: Boolean(raw.featuredEligible),
    featuredSettings: raw.featuredEligible && raw.featuredSettings
      ? { startDateTime: toTs((raw.featuredSettings as Record<string,unknown>).startDateTime), endDateTime: toTs((raw.featuredSettings as Record<string,unknown>).endDateTime) }
      : null,
  };
}

function parseContextPillSettings(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return null;
  const fromTs = (v: unknown): string => {
    if (!v) return '';
    const ts = v as { toDate?: () => Date };
    return ts.toDate ? ts.toDate().toISOString() : String(v);
  };
  const ts = raw.todaySettings as Record<string, unknown> | null | undefined;
  const ls = raw.limitedSettings as Record<string, unknown> | null | undefined;
  const fs = raw.featuredSettings as Record<string, unknown> | null | undefined;
  const es = raw.eventSettings as Record<string, unknown> | null | undefined;
  return {
    nearbyEligible: Boolean(raw.nearbyEligible),
    todayEligible: Boolean(raw.todayEligible),
    todaySettings: ts
      ? { startDateTime: fromTs(ts.startDateTime), endDateTime: fromTs(ts.endDateTime), outsideWindowBehavior: (ts.outsideWindowBehavior as 'hidePill' | 'hideQuest') || 'hidePill' }
      : null,
    limitedEligible: Boolean(raw.limitedEligible),
    limitedSettings: ls
      ? { label: String(ls.label || ''), startDateTime: fromTs(ls.startDateTime), endDateTime: fromTs(ls.endDateTime), outsideWindowBehavior: (ls.outsideWindowBehavior as 'hidePill' | 'hideQuest') || 'hidePill' }
      : null,
    eventEligible: Boolean(raw.eventEligible),
    eventSettings: es ? { eventId: String(es.eventId || '') } : null,
    featuredEligible: Boolean(raw.featuredEligible),
    featuredSettings: fs
      ? { startDateTime: fromTs(fs.startDateTime), endDateTime: fromTs(fs.endDateTime) }
      : null,
  };
}

function parseGeoPoint(geoField: Record<string, unknown> | null | undefined): { lat: number; lng: number } {
  if (!geoField) return { lat: 0, lng: 0 };
  const gp = geoField.geopoint as { latitude?: number; longitude?: number } | null;
  if (gp) return { lat: gp.latitude ?? 0, lng: gp.longitude ?? 0 };
  return { lat: (geoField.lat as number) ?? 0, lng: (geoField.lng as number) ?? 0 };
}

async function upsertQuestMeta(location: string, lat: number, lng: number): Promise<void> {
  await adminDb.collection('meta').doc('quest_locations').set(
    { locations: { [location]: { lat, lng } } },
    { merge: true }
  );
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const questDoc = await adminDb.collection('questCatalogue').doc(params.id).get();
    if (!questDoc.exists) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    const d = questDoc.data()!;
    const quest: Quest = {
      id: d.id || questDoc.id,
      categoryId: d.categoryId || '',
      title: d.title || '',
      description: d.description || '',
      xp: d.xp ?? 0,
      type: d.type || 'checkin',
      isActive: d.isActive ?? true,
      visibility: { hideAfterOneTimeCompletion: d.visibility?.hideAfterOneTimeCompletion ?? false },
      placeId: d.placeId || null,
      location: d.location || '',
      geoOverride: d.geoOverride ? parseGeoPoint(d.geoOverride) : null,
      resolvedGeo: parseGeoPoint(d.resolvedGeo),
      validationConfigId: d.validationConfigId || null,
      validationConfig: d.validationConfig || null,
      contextPillSettings: parseContextPillSettings(d.contextPillSettings),
      createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt,
    };
    return NextResponse.json(quest);
  } catch (error: unknown) {
    console.error('Get quest error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch quest';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const questId = params.id;

    const questDocRef = adminDb.collection('questCatalogue').doc(questId);
    const questDoc = await questDocRef.get();
    if (!questDoc.exists) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Validate required fields
    const missing: string[] = [];
    if (!body.categoryId?.trim()) missing.push('categoryId');
    if (!body.title?.trim()) missing.push('title');
    if (!body.description?.trim()) missing.push('description');
    if (body.xp === undefined || body.xp === null) missing.push('xp');
    if (!body.type) missing.push('type');
    if (body.isActive === undefined || body.isActive === null) missing.push('isActive');
    if (!body.visibility || body.visibility.hideAfterOneTimeCompletion === undefined) {
      missing.push('visibility.hideAfterOneTimeCompletion');
    }
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Resolve geo + location
    let resolvedLat: number;
    let resolvedLng: number;
    let location: string;

    if (body.geoOverride?.lat !== undefined && body.geoOverride?.lng !== undefined) {
      resolvedLat = Number(body.geoOverride.lat);
      resolvedLng = Number(body.geoOverride.lng);
      const geocoded = await reverseGeocode(resolvedLat, resolvedLng);
      if (!geocoded) {
        return NextResponse.json(
          { error: 'Location could not be determined, adjust coordinates' },
          { status: 400 }
        );
      }
      location = geocoded;
    } else if (body.placeId) {
      const placeDoc = await adminDb.collection('places').doc(body.placeId).get();
      if (!placeDoc.exists) {
        return NextResponse.json({ error: 'Place not found' }, { status: 404 });
      }
      const pd = placeDoc.data()!;
      const geopoint = pd.geo?.geopoint;
      resolvedLat = geopoint ? geopoint.latitude : (pd.geo?.lat || 0);
      resolvedLng = geopoint ? geopoint.longitude : (pd.geo?.lng || 0);
      location = pd.location || '';
      if (!location) {
        return NextResponse.json(
          { error: 'Location could not be determined, adjust coordinates' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either placeId or geoOverride is required to resolve location' },
        { status: 400 }
      );
    }

    const geohash = ngeohash.encode(resolvedLat, resolvedLng, 9);
    const resolvedGeoFirestore = {
      geopoint: new admin.firestore.GeoPoint(resolvedLat, resolvedLng),
      geohash,
    };
    const geoOverrideFirestore =
      body.geoOverride?.lat !== undefined
        ? {
            geopoint: new admin.firestore.GeoPoint(
              Number(body.geoOverride.lat),
              Number(body.geoOverride.lng)
            ),
            geohash: ngeohash.encode(
              Number(body.geoOverride.lat),
              Number(body.geoOverride.lng),
              9
            ),
          }
        : null;

    const updateData: Record<string, unknown> = {
      categoryId: body.categoryId.trim(),
      title: body.title.trim(),
      description: body.description.trim(),
      xp: Number(body.xp),
      type: body.type,
      isActive: Boolean(body.isActive),
      visibility: {
        hideAfterOneTimeCompletion: Boolean(body.visibility.hideAfterOneTimeCompletion),
      },
      placeId: body.placeId || null,
      location,
      geoOverride: geoOverrideFirestore,
      resolvedGeo: resolvedGeoFirestore,
      validationConfigId: body.validationConfigId || null,
      validationConfig: body.validationConfig || null,
      contextPillSettings: buildContextPillSettings(body.contextPillSettings),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await questDocRef.update(updateData);
    await upsertQuestMeta(location, resolvedLat, resolvedLng);

    return NextResponse.json({
      message: 'Quest updated successfully',
      quest: {
        id: questId,
        ...updateData,
        geoOverride: geoOverrideFirestore
          ? { lat: Number(body.geoOverride.lat), lng: Number(body.geoOverride.lng) }
          : null,
        resolvedGeo: { lat: resolvedLat, lng: resolvedLng },
      },
    });
  } catch (error: unknown) {
    console.error('Update quest error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update quest';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const questDocRef = adminDb.collection('questCatalogue').doc(params.id);
    const questDoc = await questDocRef.get();
    if (!questDoc.exists) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    await questDocRef.delete();
    return NextResponse.json({ message: 'Quest deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete quest error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete quest';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
