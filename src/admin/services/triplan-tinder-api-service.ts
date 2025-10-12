import {
	CreateInstagramItemsResult,
	DownloadMediaResult,
	FixItemsResult,
	GetPlacesByDestinationResult,
} from '../helpers/interfaces';
import { apiGet, apiPost, apiPut } from '../helpers/api';
import { getServerAddress } from '../../config/config';
import { endpoints } from '../../v2/utils/endpoints';

export const TriplanTinderApiService = {
	async getPlacesByDestination(): Promise<GetPlacesByDestinationResult> {
		// const result = await apiGet(endpoints.v1.tinderPlacesFinder.placesByDestination);
		// if (result) {
		// 	return result?.data as GetPlacesByDestinationResult;
		// }
		return {} as GetPlacesByDestinationResult;
	},

	async downloadMedia(): Promise<DownloadMediaResult> {
		const result = await apiPut(endpoints.v1.tinderPlacesFinder.downloadMedia, {});
		if (result) {
			return result?.data as DownloadMediaResult;
		}
		return {} as DownloadMediaResult;
	},

	async fixItems(): Promise<FixItemsResult> {
		const result = await apiPut(endpoints.v1.tinderPlacesFinder.fixItems, {});
		if (result) {
			return result?.data as FixItemsResult;
		}
		return {} as FixItemsResult;
	},

	async createInstagramItems(json: object): Promise<CreateInstagramItemsResult> {
		const result = await apiPost(endpoints.v1.tinderPlacesFinder.createInstagramItems, {}, getServerAddress());
		if (result) {
			return result?.data as CreateInstagramItemsResult;
		}
		return {} as CreateInstagramItemsResult;
	},

	async scrapeInstagramProfile(_userid: string): Promise<CreateInstagramItemsResult> {
		// todo complete
		return {} as CreateInstagramItemsResult;
	},
};
