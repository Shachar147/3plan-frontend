import {EventStore, eventStoreContext} from '../stores/events-store';

import he from '../locale/he.json';
import en from '../locale/en.json';

const translates = {
	he,
	en,
};

export type TranslationParams = Record<string, string | number>;

const TranslateService = {
	translate: (eventStore: EventStore, key: string, params: TranslationParams = {}) => {
		const language = eventStore.calendarLocalCode;
		const translations: Record<string, string> = translates[language];

		// @ts-ignore
		let result = Object.keys(translations).includes(key)
			? translations[key]
			: Object.keys(translates['en']).includes(key)
			? (translates['en'] as Record<string, string>)[key]
			: key; // fallback

		Object.keys(params).forEach((key) => {
			result = result.replaceAll(`{${key}}`, params[key]?.toString());
		});

		return result;
	},
};

export default TranslateService;
