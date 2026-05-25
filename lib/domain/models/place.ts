import { ValidationConfig } from './validationConfig';

export interface CategorySelection {
    selectedId: string;
    path: string[];
}

export type PlaceSource = "seed" | "user_contribution";

export type PlaceStatus = "pending" | "approved" | "active" | "hidden" | "rejected";

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
    location: string;
    description?: string;
    xp?: number;
    source: PlaceSource;
    status: PlaceStatus;
    type?: "checkin_time" | "qr_scan";
    requirements?: {
        minTimeSeconds?: number;
        radiusMeters?: number;
        qrData?: string;
    };
    validationConfigId?: string;
    validationConfig?: Partial<ValidationConfig>;
    userId?: string;
    contributionXp?: number;
    rejectionReason?: string;
    originalContributionId?: string;
    createdAt?: string;
    updatedAt?: string;
}
