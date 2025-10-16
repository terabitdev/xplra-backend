export interface StoreItem {
    id: string;
    title: string;
    xpCost: number; // XP cost for the item
    imageUrl: string; // Item image URL
    isAvailable: boolean; // Availability toggle
    inventoryCount?: number; // Optional inventory tracking
    userId: string | null; // Admin who created it
    createdAt?: string; // ISO string for creation date
    updatedAt?: string; // ISO string for last update
}
