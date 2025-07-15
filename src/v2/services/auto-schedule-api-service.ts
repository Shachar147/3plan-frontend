import { apiPost } from '../../helpers/api';
import { endpoints } from '../utils/endpoints';

export default class AutoScheduleApiService {
	autoScheduleTrip = async (tripName: string) => {
		const url = endpoints.v2.trips.autoSchedule;
		return await apiPost(url, { tripName });
	};
}
