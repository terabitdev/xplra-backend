import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { AchievementDefinitionInput } from '@/lib/domain/models/achievementDefinition';

export async function POST(req: Request) {
  try {
    const body: Partial<AchievementDefinitionInput> & { created_by?: string } = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!body.created_by) {
      return NextResponse.json({ error: 'created_by (admin uid) is required' }, { status: 400 });
    }

    const newDefinition = {
      title: body.title.trim(),
      description: body.description.trim(),
      unlock_hint: body.unlock_hint || '',
      badge_asset_url: body.badge_asset_url || '',
      thumbnail_url: body.thumbnail_url || '',
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

    const docRef = await adminDb.collection('achievementDefinitions').add(newDefinition);
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
