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
    source: "seed" | "user_contribution";
    status: "active" | "hidden" | "pending";
    createdAt?: string;
    updatedAt?: string;
}
