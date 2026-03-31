import { ValidationConfig } from './validationConfig';

export interface CategorySelection {
    selectedId: string;
    path: string[];
}

export interface Place {
    placeId: string;
    name: string;
    geo: {
        lat: number;
        lng: number;
    };
    geohash: string;
    categorySelections: CategorySelection[];
    categoryIds?: string[];
    imageUrls?: string[];
    location?: string;
    description?: string;
    xp?: number;
    source: "seed" | "user_contribution";
    status: "active" | "hidden" | "pending";
    type?: "checkin_time" | "qr_scan";
    requirements?: {
        minTimeSeconds?: number;
        radiusMeters?: number;
        qrData?: string;
    };
    validationConfigId?: string;
    validationConfig?: Partial<ValidationConfig>;
    createdAt?: string;
    updatedAt?: string;
}
