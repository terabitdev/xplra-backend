export interface ValidationConfigSchedule {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
}

export type ValidationMode = 'CHECKIN' | 'DWELL' | 'QR_CODE' | 'CODE_PHRASE' | 'ACCRUAL' | 'HYBRID';

export interface ValidationConfig {
    id: string;
    name: string;
    mode: ValidationMode;

    // Geofence
    radiusM: number;
    minAccuracyM: number;
    maxSpeedMps?: number;
    requireLocationServices: boolean;

    // Sampling & timing
    minAcceptedSamplesToLock: number;
    checkInRequiredPings: number;
    pingRecommendedIntervalSec: number;
    maxStalePingSec: number;
    sessionTtlSec: number;
    timeToValidateSec: number;

    // Dwell
    dwellRequiredSec: number;
    graceConsecutiveOutsideSec: number;
    graceTotalOutsideSec: number;
    requireInsideOnComplete: boolean;

    // Accrual
    earnRateXpPerMinute: number;
    earnIntervalSec: number;
    earnCapXp: number | null;
    stopOnExitAfterSec: number;
    allowReentryWithinExitGrace: boolean;

    // Availability window
    useScheduleWindow: boolean;
    schedule?: ValidationConfigSchedule;

    // Completion
    oneTimeOnly: boolean;
    cooldownSec?: number;

    // QR / Code gating
    requireQrOrCode: boolean;
    qrTokenTtlSec: number;
    maxCodeAttempts: number;
    codeAttemptWindowSec: number;

    // Code Phrase
    requiredAnswerCount: number;
    codePhrasePromptLabel?: string | null;
    acceptedAnswers: string[];
    trimWhitespace: boolean;
    caseSensitive: boolean;
    useRegex: boolean;
    minAnswerLength?: number | null;
    maxAnswerLength?: number | null;
    failureFeedbackMessage?: string | null;

    // Fraud & limits
    maxActiveSessionsPerUser: number;
    denyIfMockLocationSuspected: boolean;
    auditLogLevel: "off" | "basic" | "verbose";

    createdAt: string;
    updatedAt: string;

    // Computed (from list API)
    placesCount?: number;
}
