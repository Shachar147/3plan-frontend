import { DownloadMediaResult, FixItemsResult, GetPlacesByDestinationResult } from '../helpers/interfaces';
import { apiGet, apiPut } from '../helpers/api';

export const TriplanTinderApiService = {
	async getPlacesByDestination(): Promise<GetPlacesByDestinationResult> {
		const result = await apiGet('/item/by-destination');
		if (result) {
			return result?.data as GetPlacesByDestinationResult;
		}
		return {} as GetPlacesByDestinationResult;
	},

	async downloadMedia(): Promise<DownloadMediaResult> {
		const result = await apiPut('/item/download-media', {});
		if (result) {
			return result?.data as DownloadMediaResult;
		}
		return {} as DownloadMediaResult;
	},

	async fixItems(): Promise<FixItemsResult> {
		const result = await apiPut('/item/fix', {});
		if (result) {
			return result?.data as FixItemsResult;
		}
		return {} as FixItemsResult;
	},
};
