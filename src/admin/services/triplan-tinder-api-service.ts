import { GetPlacesByDestinationResult } from '../helpers/interfaces';
import { apiGet } from '../helpers/api';

export const TriplanTinderApiService = {
	async getPlacesByDestination(): Promise<GetPlacesByDestinationResult> {
		const result = await apiGet('/item/by-destination');
		if (result) {
			return result?.data as GetPlacesByDestinationResult;
		}
		return {} as GetPlacesByDestinationResult;
	},
};
