import { CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory } from '../../utils/interfaces';
import { EventStore } from '../../stores/events-store';
import { LocalStorageService } from './local-storage-service';
import { TripDataSource } from '../../utils/enums';
import { DBService } from './db-service';
import { apiPut } from '../../helpers/api';

export type LocaleCode = 'he' | 'en';

export interface Trip {
	name: string;
	dateRange: DateRangeFormatted;
	categories: TriPlanCategory[];
	sidebarEvents: Record<number, SidebarEvent[]>;
	calendarEvents: CalendarEvent[];
	allEvents: AllEventsEvent[];
	calendarLocale: LocaleCode;
	isLocked?: boolean;
	isHidden?: boolean;
	id?: number; // for my trips page
	lastUpdateAt?: string;
	destinations?: string[];
	createdAt?: number;
}

export interface SharedTrip extends Trip {
	canRead: boolean;
	canWrite: boolean;
}

export interface DBTrip extends Trip {
	id: number;
	lastUpdateAt: string;
}

export interface DateRange {
	start: Date;
	end: Date;
}

// already formatted for the FullCalendar component
export interface DateRangeFormatted {
	start: string;
	end: string;
}

export interface AllEventsEvent extends SidebarEvent {
	category: string;
}

export interface BaseDataHandler {
	getTrips: (eventStore: EventStore) => Promise<{ trips: Trip[]; sharedTrips: SharedTrip[] }>;
	setTripName: (tripName: string, newTripName: string) => any;
	setDateRange: (dateRange: DateRangeFormatted, tripName: string) => void;
	setCategories: (categories: TriPlanCategory[], tripName: string) => void;
	setSidebarEvents: (sidebarEvents: Record<number, SidebarEvent[]>, tripName: string) => void;
	setCalendarEvents: (calendarEvents: CalendarEvent[], tripName: string) => void;
	setAllEvents: (allEvents: AllEventsEvent[], tripName: string) => void;
	setCalendarLocale: (calendarLocale: LocaleCode, tripName?: string) => void;
	setDistanceResults: (distanceResults: Map<String, DistanceResult>, tripName?: string) => void;
	duplicateTrip: (eventStore: EventStore, tripName: string, newTripName: string) => Promise<any>;

	setDestinations: (destinations: string[], tripName: string) => Promise<any>;

	getDateRange: (tripName: string, createMode?: boolean) => Promise<DateRangeFormatted> | DateRangeFormatted;
	getCategories: (
		eventStore: EventStore,
		tripName?: string,
		createMode?: boolean
	) => Promise<TriPlanCategory[]> | TriPlanCategory[];
	getSidebarEvents: (
		tripName?: string,
		createMode?: boolean
	) => Promise<Record<number, SidebarEvent[]>> | Record<number, SidebarEvent[]>;
	getCalendarEvents: (tripName?: string, createMode?: boolean) => Promise<CalendarEvent[]> | CalendarEvent[];
	getAllEvents: (
		eventStore: EventStore,
		tripName?: string,
		createMode?: boolean
	) => Promise<AllEventsEvent[]> | AllEventsEvent[];
	getCalendarLocale: (tripName?: string, createMode?: boolean) => Promise<LocaleCode> | LocaleCode;
	getDistanceResults: (tripName?: string) => Promise<Record<string, DistanceResult>>;
	getDataSourceName: () => TripDataSource;
}

export const tripNameToLSTripName = (tripName: string) => tripName.replaceAll(' ', '-');
export const lsTripNameToTripName = (tripName: string) => tripName.replaceAll('-', ' ');

export const DataServices = {
	LocalStorageService: new LocalStorageService(),
	DBService: new DBService(),
	getService: (dataSource: TripDataSource) => {
		if (dataSource === TripDataSource.DB) {
			return DataServices.DBService;
		} else {
			return DataServices.LocalStorageService;
		}
	},
};
export default DataServices;
