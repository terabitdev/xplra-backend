export interface Quest {
    questId: string;
    placeId: string | null;
    title: string;
    description: string;
    type: "checkin_time" | "checkin_proof" | "qr_scan" | "gps_verify";
    requirements: Record<string, any>;
    xpReward: number;
    cooldownSeconds: number;
    active: boolean;
    startAt?: string;
    endAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
