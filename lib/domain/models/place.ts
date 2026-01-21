export interface Place {
    placeId: string;
    name: string;
    geo: {
        lat: number;
        lng: number;
    };
    geohash: string;
    categories: string[];
    address?: string;
    description?: string;
    source: "seed" | "user_contribution";
    status: "active" | "hidden" | "pending";
    type?: "checkin_time" | "qr_scan";
    requirements?: {
        minTimeSeconds?: number;
        radiusMeters?: number;
        qrData?: string;
    };
    imageUrls?: string[];
    createdAt?: string;
    updatedAt?: string;
}
