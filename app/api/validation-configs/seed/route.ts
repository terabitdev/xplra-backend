import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

const GLOBAL_DEFAULT_ID = 'globalDefault';

const GLOBAL_DEFAULT_CONFIG = {
  id: GLOBAL_DEFAULT_ID,
  name: 'Global Default',
  radiusM: 150,
  minAccuracyM: 40,
  maxSpeedMps: null,
  requireLocationServices: true,
  minAcceptedSamplesToLock: 2,
  checkInRequiredPings: 2,
  pingRecommendedIntervalSec: 20,
  maxStalePingSec: 90,
  sessionTtlSec: 1800,
  timeToValidateSec: 10,
  dwellRequiredSec: 300,
  graceConsecutiveOutsideSec: 60,
  graceTotalOutsideSec: 120,
  requireInsideOnComplete: true,
  useScheduleWindow: false,
  schedule: null,
  oneTimeOnly: false,
  cooldownSec: null,
  requireQrOrCode: false,
  qrTokenTtlSec: 0,
  maxCodeAttempts: 0,
  codeAttemptWindowSec: 0,
  maxActiveSessionsPerUser: 1,
  denyIfMockLocationSuspected: false,
  auditLogLevel: 'basic',
};

export async function POST() {
  try {
    const docRef = adminDb.collection('validationConfigs').doc(GLOBAL_DEFAULT_ID);
    const existing = await docRef.get();

    if (existing.exists) {
      return NextResponse.json(
        { error: 'Global Default validation config already exists' },
        { status: 400 }
      );
    }

    await docRef.set({
      ...GLOBAL_DEFAULT_CONFIG,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const now = new Date().toISOString();
    return NextResponse.json({
      message: 'Global Default validation config seeded successfully',
      config: { ...GLOBAL_DEFAULT_CONFIG, createdAt: now, updatedAt: now },
    });
  } catch (error: unknown) {
    console.error('Seed validation config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to seed validation config';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
