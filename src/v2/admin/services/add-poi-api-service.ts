import {endpoints} from "../../utils/endpoints";
import {apiPut} from "../../../helpers/api";

export default class AdminAddPoiApiService {

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
}
