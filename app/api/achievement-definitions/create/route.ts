import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { AchievementDefinitionInput } from '@/lib/domain/models/achievementDefinition';
import { uploadAchievementAsset } from '@/lib/utils/achievementAssets';

/**
 * POST /api/achievement-definitions/create
 * multipart/form-data:
 *   data            — JSON-stringified Partial<AchievementDefinitionInput> & { created_by }
 *   badge_asset     — optional image file (replaces badge_asset_url)
 *   thumbnail_asset — optional image file (replaces thumbnail_url)
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const dataStr = formData.get('data') as string | null;
    if (!dataStr) {
      return NextResponse.json({ error: 'Missing form field "data"' }, { status: 400 });
    }

    const body: Partial<AchievementDefinitionInput> & { created_by?: string } = JSON.parse(dataStr);

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!body.created_by) {
      return NextResponse.json({ error: 'created_by (admin uid) is required' }, { status: 400 });
    }

    // Pre-generate the doc ref so uploaded assets can live under a stable
    // achievements/{id}/ path, same convention as places/{id}/.
    const docRef = adminDb.collection('achievementDefinitions').doc();
    const achievementId = docRef.id;

    let badgeUrl = body.badge_asset_url || '';
    let thumbnailUrl = body.thumbnail_url || '';

    const badgeFile = formData.get('badge_asset') as File | null;
    const thumbnailFile = formData.get('thumbnail_asset') as File | null;

    if (badgeFile && badgeFile.size > 0) {
      badgeUrl = await uploadAchievementAsset(badgeFile, achievementId, 'badge');
    }
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnailUrl = await uploadAchievementAsset(thumbnailFile, achievementId, 'thumbnail');
    }

    const newDefinition = {
      title: body.title.trim(),
      description: body.description.trim(),
      unlock_hint: body.unlock_hint || '',
      badge_asset_url: badgeUrl,
      thumbnail_url: thumbnailUrl,
      asset_type: body.asset_type || 'IMAGE',
      category: body.category || 'OTHER',
      rarity: body.rarity || 'COMMON',
      status: body.status || 'DRAFT',
      visibility: body.visibility || 'DISCOVERABLE',
      rule_type: body.rule_type || 'COUNT',
      rule_config: body.rule_config || { event_type: '', target: 0 },
      xp_reward: Number(body.xp_reward) || 0,
      retroactive_enabled: body.retroactive_enabled ?? false,
      sort_order: Number(body.sort_order) || 0,
      created_by: body.created_by,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(newDefinition);
    const doc = await docRef.get();
    const data = doc.data();

    return NextResponse.json({
      ...data,
      id: doc.id,
      created_at: data?.created_at?.toDate?.()?.toISOString() || '',
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || '',
    });
  } catch (error: unknown) {
    console.error('Create achievement definition error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create achievement definition';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
