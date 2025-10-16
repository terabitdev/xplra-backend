export interface Event {
    id: string;
    title: string;
    date: string; // ISO string for event date
    latitude: number;
    longitude: number;
    experience: number; // XP reward
    imageUrl: string; // Event image URL
    isVisible: boolean; // Visibility toggle
    userId: string | null; // Admin who created it
    createdAt?: string; // ISO string for creation date
    updatedAt?: string; // ISO string for last update
}
