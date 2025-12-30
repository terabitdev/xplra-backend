import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const snapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc: any) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      lastXpUpdate: doc.data().lastXpUpdate?.toDate?.()?.toISOString() || doc.data().lastXpUpdate,
    }));

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
