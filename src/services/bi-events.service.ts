import { apiPost } from '../helpers/api';
import {endpoints} from "../v2/utils/endpoints";

export const BiEventsService = {
	reportEvent: (action: string, context: string, isMobile: boolean, content?: object) => {
		return apiPost(endpoints.v1.biEvents, {
			action,
			context,
			isMobile,
			content,
		});
	},
};
