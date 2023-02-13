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
}
export type GetPlacesByDestinationResult = {
	totals: Record<string, number>;
	data: Record<string, TinderItem[]>;
};
