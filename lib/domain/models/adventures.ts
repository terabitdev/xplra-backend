export interface Adventure {
    id: string;
    adventureId: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    experience: number;
    featured: boolean;
    userId: string;
}
