export enum TriplanCurrency {
	eur = 'eur',
	usd = 'usd',
	ils = 'ils',
	aed = 'aed',
}

export enum TriplanPriority {
	must = 1, // pink
	high = 10, // purple?
	maybe = 2, // orange (used to be purple in google maps)
	least = 3, // black
	unset = 0, // gray
}

export enum TriplanEventPreferredTime {
	morning = 1,
	noon = 2,
	afternoon = 3,
	sunset = 4,
	evening = 5,
	nevermind = 6,
	night = 7,
	unset = 0,
}

export enum ViewMode {
	combined = 'combined', // calendar + map <- only desktop
	list = 'list',
	calendar = 'calendar',
	map = 'map',

	feed = 'feed',

	// for mobile:
	sidebar = 'sidebar',
}

export enum AdminViewMode {
	list = 'list',
	map = 'map',
}

export enum ListViewSummaryMode {
	full = 'full',
	noDescriptions = 'noDescriptions',
	box = 'box',
}

export enum GoogleTravelMode {
	TRANSIT = 'TRANSIT',
	DRIVING = 'DRIVING',
	WALKING = 'WALKING',
}

export enum TripDataSource {
	LOCAL = 'LOCAL',
	DB = 'DB',
}

export enum MapViewMode {
	CATEGORIES_AND_PRIORITIES = 'CATEGORIES_AND_PRIORITIES',
	CHRONOLOGICAL_ORDER = 'CHRONOLOGICAL_ORDER',
}

export function getEnumKey(enumObj: any, value: any) {
	for (let key in enumObj) {
		if (enumObj[key] == value) {
			return key;
		}
	}
}

export enum InputValidation {
	link = 'link',
}
