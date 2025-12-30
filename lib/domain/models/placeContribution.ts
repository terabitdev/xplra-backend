export interface PlaceDraft {
    name: string;
    geo: {
        lat: number;
        lng: number;
    };
    images?: string[];
    description?: string;
    categories?: string[];
    address?: string;
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
