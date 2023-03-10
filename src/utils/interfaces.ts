import { TriplanEventPreferredTime, TriplanPriority } from './enums';

export interface CalendarEvent {
	title: string;
	start: Date;
	end: Date;
	id: string;
	allDay?: boolean;
	icon?: string;
	priority?: TriplanPriority;
	duration?: string;
	preferredTime?: TriplanEventPreferredTime;
	description?: string;
	location?: LocationData;
	openingHours?: WeeklyOpeningHoursData;
	images?: string; // add column 8
	moreInfo?: string;
}

export interface SidebarEvent {
	id: string;
	title: string;
	duration?: string;
	icon?: string;
	category?: string;
	description?: string;
	priority?: TriplanPriority;
	preferredTime?: TriplanEventPreferredTime;
	className?: string;
	location?: LocationData;
	allDay?: Boolean;
	openingHours?: WeeklyOpeningHoursData;
	images?: string; // add column 9
	moreInfo?: string;
}

export interface TriPlanCategory {
	id: number;
	title: string;
	icon: string;
	description?: string;
}

export interface LocationData {
	address: string;
	latitude?: number;
	longitude?: number;
}

export interface OpeningHours {
	start: string;
	end: string;
}
export interface WeeklyOpeningHoursData {
	sunday: OpeningHours;
	monday: OpeningHours;
	tuesday: OpeningHours;
	wednesday: OpeningHours;
	thursday: OpeningHours;
	friday: OpeningHours;
	saturday: OpeningHours;
}

export interface Coordinate {
	lat: number;
	lng: number;
}

export interface ImportEventsConfirmInfo {
	eventsToAdd: SidebarEvent[];
	categoriesToAdd: TriPlanCategory[];
	numOfEventsWithErrors: number;
	errors: string[];
}

export interface DistanceResult {
	from: string;
	to: string;
	duration: string;
	distance: string;
	duration_value: number;
}
