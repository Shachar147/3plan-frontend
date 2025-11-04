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
	mvr = 'mvr',
	idr = 'idr',
	inr = 'inr',
	egp = 'egp',
	pln = 'pln',
	sek = 'sek',
	rub = 'rub',
	brl = 'brl',
	cny = 'cny',
	cad = 'cad',
	ars = 'ars',
	clp = 'clp',
	cop = 'cop',
	crc = 'crc',
	hrk = 'hrk',
	cup = 'cup',
	lrd = 'lrd',
	myr = 'myr',
	mur = 'mur',
	mxn = 'mxn',
	npr = 'npr',
	nzd = 'nzd',
	ngn = 'ngn',
	pkr = 'pkr',
	pen = 'pen',
	php = 'php',
	qar = 'qar',
	rsd = 'rsd',
	scr = 'scr',
	zar = 'zar',
	uah = 'uah',
	uyu = 'uyu',
}
export const exchangeRates = {
	[TriplanCurrency.usd]: 1, // base currency [V]
	[TriplanCurrency.eur]: 0.87, // 1 USD = 0.87 EUR [V]
	[TriplanCurrency.ils]: 3.26, // 1 USD = 3.26 ILS [V]
	[TriplanCurrency.aed]: 3.67, // 1 USD = 3.67 AED [V]
	[TriplanCurrency.baht]: 32.48, // 1 USD = 32.48 BAHT
	[TriplanCurrency.gbp]: 0.76, // 1 USD = 0.76 GBP
	[TriplanCurrency.chf]: 0.81, // 1 USD = 0.88 CHF
	[TriplanCurrency.aud]: 1.53, // 1 USD = 1.52 AUD
	[TriplanCurrency.jpy]: 154.2, // 1 USD = 150 JPY
	[TriplanCurrency.sgd]: 1.3, // 1 USD = 1.35 SGD
	[TriplanCurrency.krw]: 1430.54, // 1 USD = 1350 KRW
	[TriplanCurrency.czk]: 21.12, // 1 USD = 23 CZK
	[TriplanCurrency.mvr]: 15.41, // 1 USD = 15.4 MVR
	[TriplanCurrency.idr]: 15750, // 1 USD = 15750 IDR

	// todo check:
	[TriplanCurrency.inr]: 83.5, // 1 USD = 83.5 INR
	[TriplanCurrency.egp]: 48.5, // 1 USD = 48.5 EGP
	[TriplanCurrency.pln]: 4.0, // 1 USD = 4.0 PLN
	[TriplanCurrency.sek]: 10.8, // 1 USD = 10.8 SEK
	[TriplanCurrency.rub]: 92.5, // 1 USD = 92.5 RUB
	[TriplanCurrency.brl]: 5.0, // 1 USD = 5.0 BRL
	[TriplanCurrency.cny]: 7.2, // 1 USD = 7.2 CNY
	[TriplanCurrency.cad]: 1.35, // 1 USD = 1.35 CAD
	[TriplanCurrency.ars]: 850, // 1 USD = 850 ARS
	[TriplanCurrency.clp]: 950, // 1 USD = 950 CLP
	[TriplanCurrency.cop]: 4100, // 1 USD = 4100 COP
	[TriplanCurrency.crc]: 520, // 1 USD = 520 CRC
	[TriplanCurrency.hrk]: 7.0, // 1 USD = 7.0 HRK (note: Croatia now uses EUR)
	[TriplanCurrency.cup]: 24, // 1 USD = 24 CUP
	[TriplanCurrency.lrd]: 1, // 1 USD = 1 LRD (parity with USD)
	[TriplanCurrency.myr]: 4.7, // 1 USD = 4.7 MYR
	[TriplanCurrency.mur]: 45, // 1 USD = 45 MUR
	[TriplanCurrency.mxn]: 17, // 1 USD = 17 MXN
	[TriplanCurrency.npr]: 133, // 1 USD = 133 NPR
	[TriplanCurrency.nzd]: 1.65, // 1 USD = 1.65 NZD
	[TriplanCurrency.ngn]: 1500, // 1 USD = 1500 NGN
	[TriplanCurrency.pkr]: 278, // 1 USD = 278 PKR
	[TriplanCurrency.pen]: 3.8, // 1 USD = 3.8 PEN
	[TriplanCurrency.php]: 56, // 1 USD = 56 PHP
	[TriplanCurrency.qar]: 3.64, // 1 USD = 3.64 QAR
	[TriplanCurrency.rsd]: 108, // 1 USD = 108 RSD
	[TriplanCurrency.scr]: 13.5, // 1 USD = 13.5 SCR
	[TriplanCurrency.zar]: 18.5, // 1 USD = 18.5 ZAR
	[TriplanCurrency.uah]: 37, // 1 USD = 37 UAH
	[TriplanCurrency.uyu]: 39, // 1 USD = 39 UYU
};

export const currenciesOrder = [
	TriplanCurrency.ils,
	TriplanCurrency.usd,
	TriplanCurrency.eur,
	TriplanCurrency.aed,
	TriplanCurrency.baht,
	TriplanCurrency.gbp,
	TriplanCurrency.chf,
	TriplanCurrency.aud,
	TriplanCurrency.jpy,
	TriplanCurrency.sgd,
	TriplanCurrency.krw,
	TriplanCurrency.czk,
	TriplanCurrency.mvr,
	TriplanCurrency.idr,
	TriplanCurrency.inr,
	TriplanCurrency.egp,
	TriplanCurrency.pln,
	TriplanCurrency.sek,
	TriplanCurrency.rub,
	TriplanCurrency.brl,
	TriplanCurrency.cny,
	TriplanCurrency.cad,
	TriplanCurrency.ars,
	TriplanCurrency.clp,
	TriplanCurrency.cop,
	TriplanCurrency.crc,
	TriplanCurrency.hrk,
	TriplanCurrency.cup,
	TriplanCurrency.lrd,
	TriplanCurrency.myr,
	TriplanCurrency.mur,
	TriplanCurrency.mxn,
	TriplanCurrency.npr,
	TriplanCurrency.nzd,
	TriplanCurrency.ngn,
	TriplanCurrency.pkr,
	TriplanCurrency.pen,
	TriplanCurrency.php,
	TriplanCurrency.qar,
	TriplanCurrency.rsd,
	TriplanCurrency.scr,
	TriplanCurrency.zar,
	TriplanCurrency.uah,
	TriplanCurrency.uyu,
];

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
	focused = 'focused',
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
