import { EventStore, eventStoreContext } from '../stores/events-store';

import he from '../locale/he.json';
import en from '../locale/en.json';
import { LocaleCode } from './data-handlers/data-handler-base';

const translates = {
	he,
	en,
};

export type TranslationParams = Record<string, string | number | undefined>;

const TranslateService = {
	translate: (eventStore: EventStore, key: string, params: TranslationParams = {}) => {
		const language = eventStore.calendarLocalCode;
		// @ts-ignore
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

	translateFromTo: (
		eventStore: EventStore,
		value: string,
		params: TranslationParams = {},
		from: LocaleCode,
		to: LocaleCode
	) => {
		if (from == to) {
			return value;
		}

		// @ts-ignore
		const sourceTranslations: Record<string, string> = translates[from];

		let key = Object.keys(sourceTranslations).find(
			(k) => sourceTranslations[k].toLowerCase() === value.toLowerCase()
		);
		if (!key) {
			// @ts-ignore
			const sourceTranslations2 = translates[to];
			key = Object.keys(sourceTranslations2).find((k) => k.toLowerCase() === value.toLowerCase());

			if (!key) {
				return undefined;
			}
		}

		// @ts-ignore
		const translations: Record<string, string> = translates[to];

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
