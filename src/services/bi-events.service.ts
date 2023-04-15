import { apiPost } from '../helpers/api';

export const BiEventsService = {
	reportEvent: (action: string, context: string, isMobile: boolean, content?: object) => {
		return apiPost('/bi-events', {
			action,
			context,
			isMobile,
			content,
		});
	},
};
