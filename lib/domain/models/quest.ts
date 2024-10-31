export interface Quest {
    id: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    experience: number;
    imageUrl: string;
    stepCode: string;
    stepLatitude: number | any;
    stepLongitude: number | any;
    stepType: string; // e.g., qr, gps, etc.
    timeInSeconds: number;
    userId: string | null; // Could be null
}
