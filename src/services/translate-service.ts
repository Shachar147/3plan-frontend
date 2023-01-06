import { EventStore } from '../stores/events-store';

import he from '../locale/he.json';
import en from '../locale/en.json';

const translates = {
	he,
	en,
};

const TranslateService = {
	translate: (eventStore: EventStore, key: string) => {
		const language = eventStore.calendarLocalCode;
		const translations = translates[language];

		// @ts-ignore
		return Object.keys(translations).includes(key)
			? translations[key]
			: Object.keys(translates['en']).includes(key)
			? translates['en'][key]
			: key; // fallback
	},
};

export default TranslateService;
