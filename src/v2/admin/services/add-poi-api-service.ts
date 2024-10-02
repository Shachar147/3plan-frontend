import {endpoints} from "../../utils/endpoints";
import {apiGetPromise, apiPut} from "../../../helpers/api";
import { apiPostPromise } from "../../../helpers/api"

export default class AdminPoiApiService {

    async addPoi(poi): Promise<any> {

        try {
            // Assuming apiGetPromise needs a request method for file uploads,
            // you might need to adjust this based on how your API handles it.
            const result = await apiPut(endpoints.v2.admin.poi.add, [poi], false);

            // Check if the result is valid and return the appropriate data
            return result?.data;
        } catch {
            console.log("failed");
            return undefined;
        }
    }

    async extractInfo(moreInfo: string): Promise<any> {

        try {
            // Assuming apiGetPromise needs a request method for file uploads,
            // you might need to adjust this based on how your API handles it.
            const result = await apiPostPromise(endpoints.v2.admin.poi.infoExtractor, {
                moreInfo,
            }, false);

            // Check if the result is valid and return the appropriate data
            return result?.data;
        } catch {
            console.log("failed");
            return undefined;
        }
    }
}
