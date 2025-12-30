import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { XpLedgerEntry } from '@/lib/domain/models/xpLedger';

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { uid } = params;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type'); // Optional filter by type

    // Build query (without orderBy to avoid index requirement temporarily)
    let query = adminDb
      .collection('xp_ledger')
      .where('uid', '==', uid);

    // Apply type filter if provided
    if (type) {
      query = query.where('type', '==', type) as any;
    }

    // Fetch more docs to sort client-side, then limit
    query = query.limit(limit * 2) as any;

    const snapshot = await query.get();

    // Map and sort client-side
    let entries: XpLedgerEntry[] = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as XpLedgerEntry[];

    // Sort by createdAt descending (newest first)
    entries = entries.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Apply limit after sorting
    entries = entries.slice(0, limit);

    // Get user's current XP total
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();

    return NextResponse.json({
      entries,
      total: entries.length,
      userXpTotal: userData?.xpTotal || 0,
      userXpEarnedAllTime: userData?.xpEarnedAllTime || 0,
    });
  } catch (error: unknown) {
    console.error('Error fetching XP ledger entries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
