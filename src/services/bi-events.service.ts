import { apiPost } from '../helpers/api';

export const BiEventsService = {
	reportEvent: (action: string, context: string, isMobile: boolean) => {
		return apiPost('/bi-events', {
			action,
			context,
			isMobile,
		});
	},
};
