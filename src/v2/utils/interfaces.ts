import React from 'react';
import { AllEventsEvent } from '../../services/data-handlers/data-handler-base';
import { TriplanCurrency, TriplanEventPreferredTime, TriplanPriority } from '../../utils/enums';
import { LocationData, WeeklyOpeningHoursData } from '../../utils/interfaces';

export interface SavedCollection {
	id: number;
	name: string;
	destination: string;
	items: SavedCollectionItem[];
}

export interface SavedCollectionItem {
	id: number;
	poiId: number;
	collectionId: number;
	fullDetails: IPointOfInterest;
}

export interface IPointOfInterest {
	id: number;
	name: string;
	destination: string;
	description: string;
	images: string[];
	imagesNames?: string[];
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
	duration?: string;
}

export function IPointOfInterestToTripEvent(i: IPointOfInterest, idx: number): AllEventsEvent {
	return {
		id: idx + 1,
		title: i.name,
		duration: i.duration || '01:00',
		icon: '',
		category: '', // todo complete
		description: i.description,
		priority: '', // todo complete
		preferredTime: TriplanEventPreferredTime.unset,
		// className: "",
		location: {
			...(i.location ?? {}),
			address: i.location?.address ?? i.name,
		},
		// allDay: false,
		// openingHours? : WeeklyOpeningHoursData,
		images: i.images,
		moreInfo: i.more_info,
		price: i.price,
		currency: i.currency ? i.currency?.toLowerCase() : undefined,
	} as unknown as AllEventsEvent;
}

export interface TabData {
	id: string;
	order: number;
	name: string;
	icon: string;
	render: () => React.ReactNode;
}
