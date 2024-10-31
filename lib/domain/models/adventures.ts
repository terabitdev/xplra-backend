export interface Adventure {
    id: string;
    adventureId: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    imageUrl: string;
    featuredImages: string[]; // Added to hold multiple images
    latitude: number | any;
    longitude: number | any;
    experience: number;
    featured: boolean;
    userId: string;
}
