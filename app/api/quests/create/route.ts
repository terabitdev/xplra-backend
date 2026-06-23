import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';
import { reverseGeocode } from '@/lib/utils/geocoding';

const VALID_TYPES = ['checkin', 'dwell', 'accrual', 'qrCode', 'codePhrase'] as const;

const VALID_AUTO_START_TRIGGERS = ['location_enter', 'dwell_time', 'qr_scan', 'code_input', 'event_window'];

function sanitizeAutoStartTriggers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string' && VALID_AUTO_START_TRIGGERS.includes(t));
}

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

async function upsertQuestMeta(location: string, lat: number, lng: number): Promise<void> {
  await adminDb.collection('meta').doc('quest_locations').set(
    { locations: { [location]: { lat, lng } } },
    { merge: true }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
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

    const id = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const startConfig = {
      manualStartEnabled: body.manualStartEnabled ?? true,
      autoStartEnabled: body.autoStartEnabled ?? true,
      autoStartTriggers: sanitizeAutoStartTriggers(body.autoStartTriggers),
      requiresExplicitStartBeforeValidation: Boolean(body.requiresExplicitStartBeforeValidation),
    };

    const questDoc: Record<string, unknown> = {
      id,
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
      hint: body.hint?.trim() || null,
      startConfig,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection('questCatalogue').doc(id).set(questDoc);
    await upsertQuestMeta(location, resolvedLat, resolvedLng);

    return NextResponse.json({
      id,
      categoryId: questDoc.categoryId,
      title: questDoc.title,
      description: questDoc.description,
      xp: questDoc.xp,
      type: questDoc.type,
      isActive: questDoc.isActive,
      visibility: questDoc.visibility,
      placeId: questDoc.placeId,
      location,
      geoOverride: geoOverrideFirestore
        ? { lat: Number(body.geoOverride.lat), lng: Number(body.geoOverride.lng) }
        : null,
      resolvedGeo: { lat: resolvedLat, lng: resolvedLng },
      validationConfigId: questDoc.validationConfigId,
      validationConfig: questDoc.validationConfig,
      contextPillSettings: body.contextPillSettings || null,
      hint: questDoc.hint ?? null,
      startConfig,
      manualStartEnabled: startConfig.manualStartEnabled,
      autoStartEnabled: startConfig.autoStartEnabled,
      autoStartTriggers: startConfig.autoStartTriggers,
      requiresExplicitStartBeforeValidation: startConfig.requiresExplicitStartBeforeValidation,
    });
  } catch (error: unknown) {
    console.error('Create quest error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create quest';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
