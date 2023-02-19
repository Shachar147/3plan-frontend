type ItemStatus = 'active' | 'deleted';
export interface TinderItem {
	id: number;
	destination: string;
	name: string;
	description: string;
	images: string[];
	source: string;
	more_info: string;
	category: string;
	duration: string;
	icon: string;
	priority: string;
	location: {};
	openingHours: {};
	rate: string;
	videos: string[];
	addedAt: number;
	lastUpdatedAt: number;
	deletedAt: number;
	status: ItemStatus;
	addedBy: number;
	deletedBy: number;
	updatedBy: number; // user id
	isVerified?: boolean;

	downloadedImages?: string[];
	downloadedVideos?: string[];
}
export type GetPlacesByDestinationResult = {
	totals: Record<string, number>;
	data: Record<string, TinderItem[]>;
};

export type DownloadMediaResult = {
	totalDownloaded: number;
	totalDownloadedImages: number;
	totalDownloadedVideos: number;
	totalAffectedItems: number;
};

export type FixItemsResult = {
	totalAffectedItems: number;
	updatedDestinations: {
		id: number;
		name: string;
		destination: 'N/A';
		newDestination: string;
	}[];
};

export type CreateInstagramItemsResult = {
	totals: {
		created: number;
		updated: number;
		errors: number;
		downloadedImages: number;
		downloadedVideos: number;
	};
	created: any[];
	updated: {
		id: number;
		name: string;
	}[];
	errors: any[];
	downloaded: {
		images: number;
		videos: number;
	};
};
