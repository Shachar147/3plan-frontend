import { endpoints } from '../utils/endpoints';
import { apiGetPromise, apiPost, apiPut, apiDeletePromise } from '../../helpers/api';

export interface ReleaseNotePayload {
	englishTitle: string;
	hebrewTitle?: string;
	englishDescription?: string;
	hebrewDescription?: string;
	imageUrls: string[];
}

export default class ReleaseNotesApiService {
	create = async (payload: ReleaseNotePayload) => {
		const result = await apiPost('/release-notes', payload);
		return result?.data;
	};

	list = async () => {
		const result = await apiGetPromise(this, '/release-notes');
		return result?.data ?? [];
	};

	update = async (id: number, payload: Partial<ReleaseNotePayload>) => {
		const result = await apiPut(`/release-notes/${id}`, payload);
		return result?.data;
	};

	delete = async (id: number) => {
		const result = await apiDeletePromise(`/release-notes/${id}`);
		return result?.data;
	};
}
