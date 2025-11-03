export enum TriplanCurrency {
	eur = 'eur',
	usd = 'usd',
	ils = 'ils',
	aed = 'aed',
	baht = 'baht',
	gbp = 'gbp',
	chf = 'chf',
	aud = 'aud',
	jpy = 'jpy',
	sgd = 'sgd',
	krw = 'krw',
	czk = 'czk',
}
export const exchangeRates = {
	[TriplanCurrency.usd]: 1, // base currency
	[TriplanCurrency.eur]: 0.87, // 1 USD = 0.87 EUR
	[TriplanCurrency.ils]: 3.26, // 1 USD = 3.26 ILS
	[TriplanCurrency.aed]: 3.67, // 1 USD = 3.67 AED
	[TriplanCurrency.baht]: 32.48, // 1 USD = 32.48 BAHT
	[TriplanCurrency.gbp]: 0.76, // 1 USD = 0.76 GBP
	[TriplanCurrency.chf]: 0.81, // 1 USD = 0.88 CHF
	[TriplanCurrency.aud]: 1.53, // 1 USD = 1.52 AUD
	[TriplanCurrency.jpy]: 154.2, // 1 USD = 150 JPY
	[TriplanCurrency.sgd]: 1.3, // 1 USD = 1.35 SGD
	[TriplanCurrency.krw]: 1430.54, // 1 USD = 1350 KRW
	[TriplanCurrency.czk]: 21.12, // 1 USD = 23 CZK
};

export enum TriplanPriority {
	must = 1, // pink
	high = 10, // purple?
	maybe = 2, // orange (used to be purple in google maps)
	least = 3, // black
	unset = 0, // gray
}

export const prioritiesOrder = [
	TriplanPriority.must,
	TriplanPriority.high,
	TriplanPriority.maybe,
	TriplanPriority.least,
	TriplanPriority.unset,
];

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
	itinerary = 'itinerary',

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
	AREAS = 'AREAS',
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

export enum SyncMode {
	localToRemote = 'localToRemote',
	remoteToLocal = 'remoteToLocal',
}
