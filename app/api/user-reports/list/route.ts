import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface ReportedUserInfo {
  uid: string;
  name: string;
  email: string;
  username: string;
}

export interface UserReport {
  id: string;
  reporterUid: string;
  reporter: ReportedUserInfo | null;
  reportedUid: string;
  reported: ReportedUserInfo | null;
  reason: string;
  details: string | null;
  sourceScreen: string;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface RawUserReportDoc {
  id: string;
  reporter_uid?: string;
  reported_uid?: string;
  reason?: string;
  details?: unknown;
  source_screen?: string;
  status?: string;
  reviewed_at?: { toDate?: () => Date } | null;
  reviewed_by?: string | null;
  created_at?: { toDate?: () => Date } | string;
}

async function loadUserInfoMap(uids: string[]): Promise<Map<string, ReportedUserInfo>> {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const map = new Map<string, ReportedUserInfo>();

  await Promise.all(
    uniqueUids.map(async (uid) => {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (!snap.exists) return;
      const d = snap.data() || {};
      map.set(uid, {
        uid,
        name: d.name || d.display_name || '',
        email: d.email || '',
        username: d.username || '',
      });
    })
  );

  return map;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const snap = await adminDb.collection('user_reports').orderBy('created_at', 'desc').get();

    const rawReports: RawUserReportDoc[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const userInfoMap = await loadUserInfoMap(
      rawReports.flatMap((r) => [r.reporter_uid || '', r.reported_uid || ''])
    );

    const allReports: UserReport[] = rawReports.map((d) => ({
      id: d.id,
      reporterUid: d.reporter_uid || '',
      reporter: (d.reporter_uid && userInfoMap.get(d.reporter_uid)) || null,
      reportedUid: d.reported_uid || '',
      reported: (d.reported_uid && userInfoMap.get(d.reported_uid)) || null,
      reason: d.reason || '',
      details: typeof d.details === 'string' ? d.details : null,
      sourceScreen: d.source_screen || '',
      status: d.status || '',
      reviewedAt: d.reviewed_at?.toDate?.()?.toISOString() || null,
      reviewedBy: d.reviewed_by || null,
      createdAt: (typeof d.created_at === 'string' ? d.created_at : d.created_at?.toDate?.()?.toISOString()) || '',
    }));

    const total = allReports.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return NextResponse.json({
      data: allReports.slice(startIndex, startIndex + limit),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error: unknown) {
    console.error('Get user reports error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch user reports';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
