import { TriplanEventPreferredTime, TriplanPriority } from './enums';
import { SidebarEvent, TriPlanCategory } from './interfaces';
import { padTo2Digits } from './utils';
import { DateRangeFormatted } from '../services/data-handlers/data-handler-base';
import TranslateService from '../services/translate-service';
import { EventStore } from '../stores/events-store';

export const defaultLocalCode = 'he';
export const defaultTimedEventDuration = '01:00';
export const defaultEventsOld: Record<number, SidebarEvent[]> = {
	1: [
		// { title: "Nussert Steakhouse", description: "המסעדה של נאסר", duration: '02:00', id: "1", priority: TriplanPriority.must, preferredTime: TriplanEventPreferredTime.nevermind },
		// { title: "Gordon Ramzi Hell Kitchen", duration: '02:30', id: "2", priority: TriplanPriority.must },
		// { title: "Dinner in the sky", id: "3", priority: TriplanPriority.maybe },
		{
			id: '801',
			title: 'Blaze Pizza (mall)',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.nevermind,
		},
		{
			id: '802',
			title: 'Serial Cafe Killer (mall)',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.nevermind,
		},
		{
			id: '803',
			title: 'candylicious candy store (mall)',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.nevermind,
		},
		{
			id: '804',
			title: 'Ben Kukis (mall)',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.nevermind,
		},

		{
			id: '805',
			title: 'Forever Rose Cafe',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '806',
			title: 'Saya Restaurant',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '807',
			title: 'Brunch and Cake - bubble cafe',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '808',
			title: 'Black Tap - decadent desserts',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '809',
			title: "Lighthouse?\n(And then The Block? They're close)",
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '810',
			title: 'Nutella (at the airport)',
			priority: TriplanPriority.least,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '811',
			title: 'Atmosphere Restaurant',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.morning,
		},
		{
			id: '812',
			title: 'Vibe restaurant',
			priority: TriplanPriority.least,
			preferredTime: TriplanEventPreferredTime.morning,
		},

		{
			id: '813',
			title: 'Nussert Steakhouse',
			description: 'המסעדה של נאסר',
			duration: '02:00',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '814',
			title: 'Pizza Company',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '815',
			title: 'The Pods restaurant',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '816',
			title: 'Nonya restaurant?',
			priority: TriplanPriority.least,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '817',
			title: 'zou zou restaurant (mall)?',
			priority: TriplanPriority.least,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '818',
			title: 'Trove Restaurant',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{
			id: '819',
			title: 'Hard Rock Cafe',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.noon,
		},
		{ id: '820', title: 'Vapiano', priority: TriplanPriority.maybe, preferredTime: TriplanEventPreferredTime.noon },
		{
			id: '821',
			title: 'Armani Dubai restaurant? (+ view the Fountains?)',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.noon,
		},

		{
			id: '822',
			title: 'Gordon Ramzi Hell Kitchen',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '823',
			title: 'Ce La Vie',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '824',
			title: 'Gal Dubai',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '825',
			title: 'Gaya Restaurant + Nyx Secret Bar',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '826',
			title: 'Coya Restaurant + Coya Members Secret Bar',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '827',
			title: 'Tasca restaurant?',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.sunset,
		},
		{
			id: '828',
			title: 'Varda restaurant?',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '829',
			title: 'Dubai Marina Cruise?',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '830',
			title: 'Knox Secret Pub',
			priority: TriplanPriority.must,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '831',
			title: 'The unlucky Cat',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '832',
			title: 'Osasino - an underwater restaurant?',
			priority: TriplanPriority.least,
			preferredTime: TriplanEventPreferredTime.evening,
		},
		{
			id: '833',
			title: 'Dinner in the sky',
			priority: TriplanPriority.maybe,
			preferredTime: TriplanEventPreferredTime.evening,
		},
	],
	2: [
		{ title: 'Skydive', id: '4', priority: TriplanPriority.maybe },
		{ title: 'Safari Dessert', id: '5', priority: TriplanPriority.must },
		{ title: 'Flower Garden', id: '6', priority: TriplanPriority.must },
		{ title: 'Fountain', id: '10', icon: '⛲', priority: TriplanPriority.must },
		{ title: 'Play basketball in dubai', id: '11', priority: TriplanPriority.must },
	],
	3: [
		{ title: 'Nikki Beach', id: '7', priority: TriplanPriority.must },
		{ title: 'Five Palm', id: '8', priority: TriplanPriority.must },
		{ title: 'Drift Beach', id: '9', priority: TriplanPriority.maybe },
	],
	4: [
		{ title: 'Bla Bla', id: '12', priority: TriplanPriority.maybe },
		{ title: 'Billionare', id: '13', priority: TriplanPriority.unset },
		{ title: 'White', id: '14', priority: TriplanPriority.least },
	],
};

export const defaultEvents: Record<number, SidebarEvent[]> = {};
export const defaultEvents2: Record<number, SidebarEvent[]> = {
	'1': [
		{
			id: '801',
			title: 'Blaze Pizza (mall)',
			priority: 1,
			preferredTime: 6,
		},
		{
			id: '802',
			title: 'Serial Cafe Killer (mall)',
			priority: 1,
			preferredTime: 6,
		},
		{
			id: '803',
			title: 'candylicious candy store (mall)',
			priority: 1,
			preferredTime: 6,
		},
		{
			id: '804',
			title: 'Ben Kukis (mall)',
			priority: 1,
			preferredTime: 6,
		},
		{
			id: '805',
			title: 'Forever Rose Cafe',
			priority: 1,
			preferredTime: 1,
		},
		{
			id: '806',
			title: 'Saya Restaurant',
			priority: 1,
			preferredTime: 1,
		},
		{
			id: '807',
			title: 'Brunch and Cake - bubble cafe',
			priority: 1,
			preferredTime: 1,
		},
		{
			id: '808',
			title: 'Black Tap - decadent desserts',
			priority: 2,
			preferredTime: 1,
		},
		{
			id: '809',
			title: "Lighthouse?\n(And then The Block? They're close)",
			priority: 2,
			preferredTime: 1,
		},
		{
			id: '810',
			title: 'Nutella (at the airport)',
			priority: 3,
			preferredTime: 1,
		},
		{
			id: '811',
			title: 'Atmosphere Restaurant',
			priority: 2,
			preferredTime: 1,
		},
		{
			id: '812',
			title: 'Vibe restaurant',
			priority: 3,
			preferredTime: 1,
		},
		{
			id: '813',
			title: 'Nussert Steakhouse',
			description: 'המסעדה של נאסר',
			duration: '02:00',
			priority: 1,
			preferredTime: 2,
		},
		{
			id: '814',
			title: 'Pizza Company',
			priority: 1,
			preferredTime: 2,
		},
		{
			id: '815',
			title: 'The Pods restaurant',
			priority: 2,
			preferredTime: 2,
		},
		{
			id: '816',
			title: 'Nonya restaurant?',
			priority: 3,
			preferredTime: 2,
		},
		{
			id: '817',
			title: 'zou zou restaurant (mall)?',
			priority: 3,
			preferredTime: 2,
		},
		{
			id: '818',
			title: 'Trove Restaurant',
			priority: 2,
			preferredTime: 2,
		},
		{
			id: '819',
			title: 'Hard Rock Cafe',
			priority: 2,
			preferredTime: 2,
		},
		{
			id: '820',
			title: 'Vapiano',
			priority: 2,
			preferredTime: 2,
		},
		{
			id: '821',
			title: 'Armani Dubai restaurant? (+ view the Fountains?)',
			priority: 2,
			preferredTime: 2,
		},
		{
			id: '822',
			title: 'Gordon Ramzi Hell Kitchen',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '823',
			title: 'Ce La Vie',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '824',
			title: 'Gal Dubai',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '825',
			title: 'Gaya Restaurant + Nyx Secret Bar',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '826',
			title: 'Coya Restaurant + Coya Members Secret Bar',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '827',
			title: 'Tasca restaurant?',
			priority: 2,
			preferredTime: 4,
		},
		{
			id: '828',
			title: 'Varda restaurant?',
			priority: 2,
			preferredTime: 5,
		},
		{
			id: '829',
			title: 'Dubai Marina Cruise?',
			priority: 2,
			preferredTime: 5,
		},
		{
			id: '830',
			title: 'Knox Secret Pub',
			priority: 1,
			preferredTime: 5,
		},
		{
			id: '831',
			title: 'The unlucky Cat',
			priority: 2,
			preferredTime: 5,
		},
		{
			id: '832',
			title: 'Osasino - an underwater restaurant?',
			priority: 3,
			preferredTime: 5,
		},
		{
			id: '833',
			title: 'Dinner in the sky',
			priority: 2,
			preferredTime: 5,
			icon: '🌠',
			duration: '01:00',
			extendedProps: {},
			description: '',
		},
	],
	'2': [
		{
			title: 'Skydive',
			id: '4',
			priority: 2,
			preferredTime: 0,
		},
		{
			title: 'Flower Garden',
			id: '6',
			priority: 1,
			preferredTime: 0,
		},
		{
			title: 'Fountain',
			id: '10',
			icon: '⛲',
			priority: 1,
			duration: '00:20',
			preferredTime: 0,
		},
		{
			title: 'Play basketball in dubai',
			id: '11',
			priority: 1,
			preferredTime: 0,
		},
		{
			icon: '🏎',
			title: 'Car Rental',
			description: 'השכרת רכב ונסיעה לגשר ביידן איפה שצילמו את מהיר ועצבני',
			duration: '01:30',
			priority: 3,
			preferredTime: 5,
			id: '837',
		},
		{
			icon: '',
			title: 'Safari Dessert',
			description: 'דיונות עושים רייזרים תמונות לברר לגבי השמלות הארוכות ליהב',
			duration: '04:30',
			priority: 1,
			preferredTime: 3,
			id: '838',
		},
		{
			icon: '',
			title: 'Atlantis water park - half day',
			description: '',
			duration: '04:00',
			priority: 1,
			preferredTime: 1,
			id: '839',
		},
		{
			icon: '🪂',
			title: 'Skydiving',
			description: 'מ5 בבוקר עד 9:30 בבוקר בכל הימים חוץ משלישי רביעי',
			duration: '01:30',
			priority: 2,
			preferredTime: 1,
			id: '840',
		},
		{
			icon: '🏀 ⛹',
			title: 'Basketball - The Block',
			description: '',
			duration: '00:45',
			priority: 1,
			preferredTime: 6,
			id: '842',
		},
		{
			icon: '',
			title: 'Five Palm - Spa',
			description: '',
			duration: '01:30',
			priority: 1,
			preferredTime: 4,
			id: '843',
		},
		{
			icon: '🏌',
			title: 'Golf',
			description: 'לברר',
			duration: '01:00',
			priority: 3,
			preferredTime: 6,
			id: '844',
		},
		{
			icon: '🏌',
			title: '3D Blacklight Mini Golf Dubai',
			description: 'לברר',
			priority: 2,
			preferredTime: 6,
			id: '846',
		},
		{
			icon: '🏎 🛥',
			title: 'Water Jet Car Boat',
			description: 'השכרת סירת מכונית מירוץ לברר מחירים',
			duration: '01:00',
			priority: 1,
			preferredTime: 2,
			id: '848',
		},
		{
			icon: '',
			title: 'JBR טיילת',
			description: '',
			duration: '02:00',
			priority: 1,
			id: '849',
			preferredTime: 0,
		},
		{
			icon: '',
			title: 'Omega',
			description: '',
			duration: '01:30',
			priority: 1,
			id: '850',
			preferredTime: 0,
		},
		{
			icon: '🏖',
			title: 'Five Palm Beach Bar',
			description: 'פתוח בין 09:00 ל02:00 הכי חזק בין 18:00 ל00:00',
			duration: '03:00',
			priority: 1,
			preferredTime: 4,
			id: '851',
		},
		{
			icon: '🏊',
			title: 'Aura pool',
			description: 'מומלץ לבוא בין 15:00 ל19:00',
			duration: '04:00',
			priority: 1,
			preferredTime: 3,
			id: '852',
		},
		{
			icon: '',
			title: 'Global Village',
			description: 'מתחם ענק ומגניב עם מקומות מכל העולם אוכל שווקים וכו׳.',
			duration: '01:30',
			priority: 1,
			preferredTime: 5,
			id: '853',
		},
	],
	'3': [
		{
			title: 'Nikki Beach',
			id: '7',
			priority: 1,
			preferredTime: 0,
		},
		{
			title: 'Five Palm',
			id: '8',
			priority: 1,
			preferredTime: 0,
		},
		{
			title: 'Drift Beach',
			id: '9',
			priority: 2,
			preferredTime: 0,
		},
		{
			icon: '🏖',
			title: 'Namos Beach Bar',
			description: 'ביץ׳ קלאב טיל פאנסי דיור וכאלה',
			duration: '03:00',
			priority: 1,
			preferredTime: 2,
			id: '847',
		},
	],
	'4': [
		{
			title: 'Bla Bla',
			id: '12',
			priority: 2,
			preferredTime: 0,
		},
		{
			title: 'Billionare',
			id: '13',
			priority: TriplanPriority.must,
		},
		{
			title: 'White',
			id: '14',
			priority: 3,
			preferredTime: 0,
		},
		{
			icon: '🍻',
			title: 'Five Palm - Rooftop Club (16:00 - 03:00)',
			description: 'פתוח הכל מ16:00 ועד 03:00. השקיעה ממש יפה שם. הכי חזק בין 22:00 ל01:00',
			id: '841',
			preferredTime: 0,
			priority: TriplanPriority.must,
		},
	],
	'5': [
		{
			icon: '🏀',
			title: 'Basketbolista',
			description: '',
			duration: '00:20',
			priority: 1,
			preferredTime: 6,
			id: '835',
		},
		{
			icon: '🏀',
			title: 'SSSport - Dubai Mall',
			description: 'חנות עם מגרש כדורסל קטן בפנים - חובה !!!',
			duration: '16:00',
			priority: 1,
			preferredTime: 6,
			id: '836',
		},
	],
};

export const defaultCalendarEvents = [];

export const getDefaultCategories = (eventStore: EventStore): TriPlanCategory[] => {
	return [
		{
			id: 1,
			icon: '',
			title: TranslateService.translate(eventStore, 'CATEGORY.GENERAL'),
		},
		{
			id: 2,
			icon: '',
			title: TranslateService.translate(eventStore, 'CATEGORY.LOGISTICS'),
		},
	];
};

export const defaultCategoriesOldold: TriPlanCategory[] = [];
export const defaultCategoriesHeb: TriPlanCategory[] = [
	{ id: 2, icon: '', title: 'לוגיסטיקה' },
	{ id: 3, icon: '📸', title: 'תמונות' },
	{ id: 4, icon: '', title: 'כללי' },
	{ id: 5, icon: '⭐', title: 'אטרקציות' },
	{ id: 6, icon: '🍴', title: 'אוכל' },
	{ id: 7, icon: '🚨 🏖', title: 'ביץ׳ קלאבס' },
	{ id: 8, icon: '🍻', title: 'ברים' },
	{ id: 9, icon: '🛒', title: 'קניות' },
	{ id: 10, icon: '', title: 'מועדונים' },
	{ id: 12, title: 'הערות', icon: '' },
]; // [];
export const defaultCategoriesEng: TriPlanCategory[] = [
	{ id: 2, icon: '', title: 'Logistics' },
	{ id: 3, icon: '📸', title: 'Photos' },
	{ id: 4, icon: '', title: 'General' },
	{ id: 5, icon: '⭐', title: 'Attractions' },
	{ id: 6, icon: '🍴', title: 'Food' },
	{ id: 7, icon: '🚨 🏖', title: 'Beach Clubs' },
	{ id: 8, icon: '🍻', title: 'Bars' },
	{ id: 9, icon: '🛒', title: 'Shopping' },
	{ id: 10, icon: '', title: 'Clubs' },
	{ id: 12, title: 'Notes', icon: '' },
]; // [];
export const defaultCategoriesOld: TriPlanCategory[] = [
	{
		id: 1,
		title: 'Food',
		icon: '🍴',
	},
	{
		id: 2,
		title: 'Attractions',
		icon: '⭐',
	},
	{
		id: 3,
		title: 'Beach Clubs',
		icon: '🏖',
	},
	{
		id: 4,
		title: 'Clubs & Bars',
		icon: '🍻',
	},
	{
		id: 5,
		title: 'Shopping',
		icon: '🛒',
	},
];

export const defaultEventsToCategories = {};

export const defaultDateRange = (): DateRangeFormatted => {
	const date1 = new Date();
	date1.setDate(date1.getDate() + 7);

	const date2 = new Date();
	date2.setDate(date2.getDate() + 14);

	// let parts = date1.toLocaleDateString().split('/');
	// const result1 = [parts[2], padTo2Digits(Number(parts[0])), padTo2Digits(Number(parts[1]))].join('-');
	//
	// parts = date2.toLocaleDateString().split('/');
	// const result2 = [parts[2], padTo2Digits(Number(parts[0])), padTo2Digits(Number(parts[1]))].join('-');

	const result1 = formatDateString(date1);
	const result2 = formatDateString(date2);

	return {
		start: result1,
		end: result2,
	};
};

export const formatDateString = (dt: Date): string => {
	return dt.toISOString().split('T')[0];
};

export const LS_SIDEBAR_EVENTS = 'triplan-sidebar-events';
export const LS_CALENDAR_EVENTS = 'triplan-calendar-events';
export const LS_CATEGORIES = 'triplan-categories';
export const LS_ALL_EVENTS = 'triplan-all-events';
export const LS_CALENDAR_LOCALE = 'triplan-calendar-locale';
export const LS_DISTANCE_RESULTS = 'triplan-distance-results';
export const LS_CUSTOM_DATE_RANGE = 'triplan-custom-date-range';
export const LS_DATA_SOURCE = 'triplan-data-source';

export function getLocalStorageKeys() {
	return {
		LS_SIDEBAR_EVENTS,
		LS_CALENDAR_EVENTS,
		LS_CATEGORIES,
		LS_ALL_EVENTS,
		LS_CALENDAR_LOCALE,
		LS_CUSTOM_DATE_RANGE,
		LS_DISTANCE_RESULTS,
	};
}
