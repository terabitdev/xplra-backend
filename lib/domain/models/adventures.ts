export interface Adventure {
    id: string;
    category?: string;
    adventureId: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    imageUrl: string;
    featuredImages: string[]; // Added to hold multiple images
    latitude: number | unknown;
    longitude: number | unknown;
    distance: number | unknown;
    experience: number;
    featured: boolean;
    userId: string;
    timeInSeconds: number;
    completedAt?: string; // ISO string for date time
    hoursToCompleteAgain?: number; // Number for hours to complete again
}
