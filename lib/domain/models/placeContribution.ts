import { CategorySelection } from './place';

export interface PlaceDraft {
    name: string;
    geo: {
        lat: number;
        lng: number;
    };
    images?: string[];
    description?: string;
    categorySelections?: CategorySelection[];
    location?: string;
}

export interface PlaceContribution {
    contributionId: string;
    uid: string;
    placeDraft: PlaceDraft;
    status: "pending" | "approved" | "rejected";
    reviewedBy?: string;
    reviewNote?: string;
    createdAt?: string;
    reviewedAt?: string;
}
