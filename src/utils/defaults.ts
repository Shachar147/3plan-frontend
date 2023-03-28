import { SidebarEvent, TriPlanCategory } from './interfaces';
import { DateRangeFormatted } from '../services/data-handlers/data-handler-base';
import { EventStore } from '../stores/events-store';
import TranslateService from '../services/translate-service';

export const defaultLocalCode = 'he';
export const defaultTimedEventDuration = '01:00';

export const defaultEvents: Record<number, SidebarEvent[]> = {};

export const defaultCalendarEvents = [];

export const getDefaultCategories = (eventStore: EventStore): TriPlanCategory[] => {
	return [
		{
			id: 1,
			icon: '🧞‍♂️',
			title: TranslateService.translate(eventStore, 'CATEGORY.GENERAL'),
			description: 'CATEGORY.GENERAL.DESCRIPTION',
		},
		{
			id: 2,
			icon: '🛫',
			title: TranslateService.translate(eventStore, 'CATEGORY.FLIGHTS'),
			description: 'CATEGORY.FLIGHTS.DESCRIPTION',
		},
		{
			id: 3,
			icon: '🏩',
			title: TranslateService.translate(eventStore, 'CATEGORY.HOTELS'),
			description: 'CATEGORY.HOTELS.DESCRIPTION',
		},
		{
			id: 4,
			icon: '🍕',
			title: TranslateService.translate(eventStore, 'CATEGORY.FOOD'),
			description: 'CATEGORY.FOOD.DESCRIPTION',
		},
		{
			id: 5,
			icon: '🍦',
			title: TranslateService.translate(eventStore, 'CATEGORY.DESSERTS'),
			description: 'CATEGORY.DESSERTS.DESCRIPTION',
		},
		{
			id: 6,
			icon: '🍹',
			title: TranslateService.translate(eventStore, 'CATEGORY.BARS_AND_NIGHTLIFE'),
			description: 'CATEGORY.BARS_AND_NIGHTLIFE.DESCRIPTION',
		},
		{
			id: 7,
			icon: '🛒',
			title: TranslateService.translate(eventStore, 'CATEGORY.SHOPPING'),
			description: 'CATEGORY.SHOPPING.DESCRIPTION',
		},
		{
			id: 8,
			icon: '⭐',
			title: TranslateService.translate(eventStore, 'CATEGORY.ATTRACTIONS'),
			description: 'CATEGORY.ATTRACTIONS.DESCRIPTION',
		},
		{
			id: 9,
			icon: '👻',
			title: TranslateService.translate(eventStore, 'CATEGORY.GIMMICKS'),
			description: 'CATEGORY.GIMMICKS.DESCRIPTION',
		},
		{
			id: 10,
			icon: '🌺',
			title: TranslateService.translate(eventStore, 'CATEGORY.NATURE'),
			description: 'CATEGORY.NATURE.DESCRIPTION',
		},
		{
			id: 11,
			icon: '🗽',
			title: TranslateService.translate(eventStore, 'CATEGORY.TOURISM'),
			description: 'CATEGORY.TOURISM.DESCRIPTION',
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
