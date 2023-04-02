import { getCurrentUsername } from './utils';

export const LimitationsService = {
	distanceLimitations: () => {
		const username = getCurrentUsername();
		return username === 'Shachar';
	},
};
