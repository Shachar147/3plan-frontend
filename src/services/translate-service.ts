import { EventStore } from '../stores/events-store';

import he from '../locale/he.json';
import en from '../locale/en.json';

const translates = {
	he,
	en,
};

const TranslateService = {
	translate: (eventStore: EventStore, key: string, params: Record<string, string | number> = {}) => {
		const language = eventStore.calendarLocalCode;
		const translations: Record<string, string> = translates[language];

		// @ts-ignore
		let result = Object.keys(translations).includes(key)
			? translations[key]
			: Object.keys(translates['en']).includes(key)
			? (translates['en'] as Record<string, string>)[key]
			: key; // fallback

		Object.keys(params).forEach((key) => {
			result = result.replace(`{${key}}`, params[key].toString());
		});

		return result;
	},
};

export default TranslateService;
