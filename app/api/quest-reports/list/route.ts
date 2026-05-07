import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface QuestReport {
  id: string;
  questId: string;
  quest: Record<string, unknown>;
  reason: string;
  details?: string;
  reporter: {
    userId: string;
    email: string;
    displayName: string;
  };
  reportedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const snap = await adminDb.collection('questReports').orderBy('reportedAt', 'desc').get();
    const allReports: QuestReport[] = [];

    snap.forEach((doc) => {
      const d = doc.data();
      allReports.push({
        id: doc.id,
        questId: d.questId || '',
        quest: d.quest || {},
        reason: d.reason || '',
        details: d.details,
        reporter: {
          userId: d.reporter?.userId || '',
          email: d.reporter?.email || '',
          displayName: d.reporter?.displayName || '',
        },
        reportedAt: d.reportedAt?.toDate?.()?.toISOString() || d.reportedAt || '',
      });
    });

    const total = allReports.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return NextResponse.json({
      data: allReports.slice(startIndex, startIndex + limit),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error: unknown) {
    console.error('Get quest reports error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch quest reports';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
