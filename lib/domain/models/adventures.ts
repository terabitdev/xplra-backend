export interface Adventure {
    id: string;
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
}
