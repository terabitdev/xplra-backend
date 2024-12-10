export interface Quest {
    id: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    experience: number;
    imageUrl: string;
    stepCode: string;
    stepLatitude: number | unknown;
    stepLongitude: number | unknown;
    distance: number | unknown;
    stepType: string; // e.g., qr, gps, etc.
    timeInSeconds: number;
    userId: string | null; // Could be null
}
