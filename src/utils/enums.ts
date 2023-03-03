export enum TriplanPriority {
	must = 1, // pink
	maybe = 2, // purple
	least = 3, // black
	unset = 0,
}

export enum TriplanEventPreferredTime {
	morning = 1,
	noon = 2,
	afternoon = 3,
	sunset = 4,
	evening = 5,
	nevermind = 6,
	unset = 0,
}

export enum ViewMode {
	combined = 'combined', // calendar + map <- only desktop
	list = 'list',
	calendar = 'calendar',
	map = 'map',

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
