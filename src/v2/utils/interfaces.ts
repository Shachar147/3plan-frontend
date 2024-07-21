export interface SavedCollection {
    name: string;
    destination: string;
    items: SavedCollectionItem[]
}

export interface SavedCollectionItem {
    poiId: number;
}

export interface IPointOfInterest {
    id: number;
    name: string;
    destination: string;
    description: string;
    images: string[];
    source: string;
    more_info: string;
    category: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    rate?: {
        quantity: number;
        rating: number;
    };
    status?: string;
    isVerified: boolean;
    price?: number;
    currency: string;
    createdAt: number; // date
    lastUpdateAt: number; // date
    deletedAt?: number; // date
    addedBy?: Record<string, any>; // user
    updatedBy?: Record<string, any>; // user
    isSystemRecommendation: boolean;
}