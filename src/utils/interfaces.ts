import { TriplanCurrency, TriplanEventPreferredTime, TriplanPriority } from './enums';

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
	price?: number;
	currency?: TriplanCurrency;
	moreInfo?: string;
	category: string; // category id
	suggestedEndTime?: any;
	timingError?: any;
	className?: string;
	// Group properties
	groupId?: string;
	isGrouped?: boolean;
	isGroup?: boolean;
	groupedEvents?: string[];

	extendedProps?: Record<string, any>;
}

export function buildCalendarEvent(json: any): Partial<CalendarEvent> {
	const calendarProps: string[] = [
		'title',
		'start',
		'end',
		'id',
		'allDay',
		'icon',
		'priority',
		'duration',
		'preferredTime',
		'description',
		'location',
		'openingHours',
		'images',
		'moreInfo',
		'category',
		'suggestedEndTime',
		'className',
		'timingError',
		'price', // add column 14
		'currency',
	];

	const calendarEvent: Partial<CalendarEvent> = {};

	calendarProps.forEach((prop) => {
		// @ts-ignore
		calendarEvent[prop] = json[prop];
	});

	return calendarEvent;
}

export interface SidebarEvent {
	id: string;
	title: string;
	duration?: string;
	icon?: string;
	category: string;
	description?: string;
	priority?: TriplanPriority;
	preferredTime?: TriplanEventPreferredTime;
	className?: string;
	location?: LocationData;
	allDay?: Boolean;
	openingHours?: WeeklyOpeningHoursData;
	images?: string; // add column 9
	moreInfo?: string;
	price?: number;
	currency?: TriplanCurrency;

	extendedProps?: Record<string, any>;
}

export interface TriPlanCategory {
	id: number;
	title: string;
	icon: string;
	description?: string;
	titleKey?: string;
	/** Optional Google Maps marker icon key (see icons map) */
	googleMapIcon?: string;
}

export interface LocationData {
	address: string;
	latitude?: number;
	longitude?: number;
	eventName?: string;
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
	eventName?: string;
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
	duration: string; // formatted string
	distance: string; // formatted string
	duration_value: number; // in seconds
}

export enum TripActions {
	// calendar
	changedEventDurationAndTiming = 'changedEventDurationAndTiming',
	changedEventTiming = 'changedEventTiming',
	changedEvent = 'changedEvent',
	deletedCalendarEvent = 'deletedCalendarEvent',
	duplicatedCalendarEvent = 'duplicatedCalendarEvent',
	switchedDays = 'switchedDays',
	addedCalendarEventFromExisting = 'addedCalendarEventFromExisting',
	addedHotelCalendarEventFromExisting = 'addedHotelCalendarEventFromExisting',
	addedNewCalendarEvent = 'addedNewCalendarEvent',
	clearedCalendar = 'clearedCalendar',

	// sidebar
	addedNewSidebarEventFromMap = 'addedNewSidebarEventFromMap',
	addedNewSidebarEvent = 'addedNewSidebarEvent',
	addedNewSidebarEventFromTinder = 'addedNewSidebarEventFromTinder',
	addedNewSidebarEventFromExploreTab = 'addedNewSidebarEventFromExploreTab',
	importedEvents = 'importedEvents',
	importedCategoriesAndEvents = 'importedCategoriesAndEvents',
	deletedSidebarEvent = 'deletedSidebarEvent',
	changedSidebarEvent = 'changedSidebarEvent',
	duplicatedSidebarEvent = 'duplicatedSidebarEvent',
	createdTask = 'createdTask',
	updatedTask = 'updatedTask',

	// categories
	addedCategory = 'addedCategory',
	deletedCategory = 'deletedCategory',
	changedCategory = 'changedCategory',

	// trip
	changedTripDates = 'changedTripDates',
	unlockedTrip = 'unlockedTrip',
	lockedTrip = 'lockedTrip',
	updatedTrip = 'updatedTrip',
	changedTripColors = 'changedTripColors',
	hideTrip = 'hideTrip',
	unhideTrip = 'unhideTrip',
	createdTrip = 'createdTrip',
	ranDistanceCalculation = 'ranDistanceCalculation',

	// share trips actions
	sharedTrip = 'sharedTrip',
	usedShareTripLink = 'usedShareTripLink',
	changeCollaboratorPermissions = 'changeCollaboratorPermissions',
	deleteCollaborator = 'deleteCollaborator',
}

export enum TriplanTaskStatus {
	TODO = 'TODO',
	IN_PROGRESS = 'IN_PROGRESS',
	CANCELLED = 'CANCELLED',
	DONE = 'DONE',
}

export interface TriplanTask {
	id: number;
	tripId: number;
	eventId?: number;
	addedByUserId: number;
	title: string;
	content?: string;
	addedAt: number; // timestamp
	mustBeDoneBefore?: number; // timestamp
	status: TriplanTaskStatus;
	isDeleted: boolean;
	deletedAt?: number;
	updatedAt?: number; // timestamp
}

export interface SuggestedCombination {
	id: string;
	events: SidebarEvent[]; // ordered
	totalDuration: number; // in minutes
	travelTimeBetween: number[]; // travel time between consecutive events
	travelModeBetween: string[]; // travel mode between consecutive events ('WALKING' or 'DRIVING')
	hasScheduledEvents: boolean; // if any event is on calendar
	isShoppingDay: boolean;
	suggestedName: string; // e.g., "Shopping Day", "Must-See Tour"
}
