import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Config name is required' },
        { status: 400 }
      );
    }

    // Validate timeToValidateSec range (5-20)
    if (body.timeToValidateSec < 5 || body.timeToValidateSec > 20) {
      return NextResponse.json(
        { error: 'timeToValidateSec must be between 5 and 20 seconds' },
        { status: 400 }
      );
    }


    const configId = `vc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newConfig = {
      id: configId,
      name: body.name,

      // Geofence
      radiusM: body.radiusM ?? 0,
      minAccuracyM: body.minAccuracyM ?? 0,
      maxSpeedMps: body.maxSpeedMps ?? null,
      requireLocationServices: body.requireLocationServices ?? false,

      // Sampling & timing
      minAcceptedSamplesToLock: body.minAcceptedSamplesToLock ?? 0,
      checkInRequiredPings: body.checkInRequiredPings ?? 0,
      pingRecommendedIntervalSec: body.pingRecommendedIntervalSec ?? 0,
      maxStalePingSec: body.maxStalePingSec ?? 0,
      sessionTtlSec: body.sessionTtlSec ?? 0,
      timeToValidateSec: body.timeToValidateSec ?? 5,

      // Dwell
      dwellRequiredSec: body.dwellRequiredSec ?? 0,
      graceConsecutiveOutsideSec: body.graceConsecutiveOutsideSec ?? 0,
      graceTotalOutsideSec: body.graceTotalOutsideSec ?? 0,
      requireInsideOnComplete: body.requireInsideOnComplete ?? false,

      // Availability window
      useScheduleWindow: body.useScheduleWindow ?? false,
      schedule: body.useScheduleWindow ? (body.schedule || {}) : null,

      // Completion
      oneTimeOnly: body.oneTimeOnly ?? false,
      cooldownSec: body.cooldownSec ?? null,

      // QR / Code gating
      requireQrOrCode: body.requireQrOrCode ?? false,
      qrTokenTtlSec: body.qrTokenTtlSec ?? 0,
      maxCodeAttempts: body.maxCodeAttempts ?? 0,
      codeAttemptWindowSec: body.codeAttemptWindowSec ?? 0,

      // Fraud & limits
      maxActiveSessionsPerUser: body.maxActiveSessionsPerUser ?? 1,
      denyIfMockLocationSuspected: body.denyIfMockLocationSuspected ?? true,
      auditLogLevel: body.auditLogLevel || 'basic',
    };

    await adminDb.collection('validationConfigs').doc(configId).set({
      ...newConfig,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const now = new Date().toISOString();
    return NextResponse.json({
      ...newConfig,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error: unknown) {
    console.error('Create validation config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create validation config';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
