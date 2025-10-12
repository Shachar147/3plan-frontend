import { EventStore, eventStoreContext } from '../stores/events-store';

import he from '../locale/he.json';
import en from '../locale/en.json';
import { LocaleCode } from './data-handlers/data-handler-base';

type TranslationValue = string | { [key: string]: TranslationValue };

const translates: Record<LocaleCode, Record<string, TranslationValue>> = {
	he,
	en,
};

export type TranslationParams = Record<string, string | number | undefined>;

const TranslateService = {
	translate: (
		eventStore: EventStore,
		key: string,
		params: TranslationParams = {},
		language = eventStore.calendarLocalCode
	) => {
		const translations = translates[language];

		let result = key;
		if (key in translations) {
			result = translations[key] as string;
		} else if (key in translates['en']) {
			result = translates['en'][key] as string;
		}

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
		if (from === to) {
			return value;
		}

		const sourceTranslations = translates[from];
		const targetTranslations = translates[to];

		// Helper function to find a key by value in nested translations
		const findKeyByValue = (
			translations: Record<string, TranslationValue>,
			searchValue: string
		): string | undefined => {
			for (const [key, val] of Object.entries(translations)) {
				if (typeof val === 'string' && val.toLowerCase() === searchValue.toLowerCase()) {
					return key;
				} else if (typeof val === 'object') {
					const nestedKey = findKeyByValue(val as Record<string, TranslationValue>, searchValue);
					if (nestedKey) {
						return nestedKey;
					}
				}
			}
			return undefined;
		};

		let key = findKeyByValue(sourceTranslations, value);
		if (!key) {
			key = findKeyByValue(targetTranslations, value);
			if (!key) {
				return undefined;
			}
		}

		let result = key;
		if (key in targetTranslations) {
			result = targetTranslations[key] as string;
		} else if (key in translates['en']) {
			result = translates['en'][key] as string;
		}

		Object.keys(params).forEach((key) => {
			result = result.replaceAll(`{${key}}`, params[key]?.toString());
		});

		return result;
	},
};

export default TranslateService;
