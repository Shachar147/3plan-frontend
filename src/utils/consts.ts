import { TriplanPriority, ViewMode } from './enums';

export const DEFAULT_EVENT_DURATION = 1;

export const TRIP_MAX_SIZE_DAYS = 90;
export const ACTIVITY_MAX_SIZE_DAYS = 1;
export const ACTIVITY_MIN_SIZE_MINUTES = 10;

export const DEFAULT_VIEW_MODE_FOR_NEW_TRIPS: ViewMode = ViewMode.map;

export const priorityToColor: Record<string, string> = {
	[TriplanPriority.must]: '#E06666FF',
	[TriplanPriority.maybe]: '#ffb752', // '#8E7CC3FF'
	[TriplanPriority.unset]: 'var(--gray)',
	[TriplanPriority.least]: 'var(--black)',
	[TriplanPriority.high]: '#d2105b', // '#f57c01',
};

export const priorityToMapColor: Record<string, string> = {
	[TriplanPriority.must]: '#FF5252',
	[TriplanPriority.maybe]: '#ffb752', // '#8E7CC3FF'
	[TriplanPriority.unset]: '#b4b4b4',
	[TriplanPriority.least]: '#000000',
	[TriplanPriority.high]: '#d2105b', //'#f57c01',
};

export const flightColor = 'dc5757';
export const hotelColor = '7cb342';

export const LOGIN_DELAY: number = 300; // to be able to see the loader
