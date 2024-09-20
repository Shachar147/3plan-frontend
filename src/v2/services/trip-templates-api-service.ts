import {apiGetPromise} from "../../helpers/api";
import {endpoints} from "../utils/endpoints";


export default class TripTemplatesApiService {
    getMainFeedTemplates = async () => {
        const result = await apiGetPromise(this,  endpoints.v2.templates.feed);
        if (result) {
            return result?.data;
        }
        return {
            results: [],
            isFinished: true,
            source: "Local"
        };
    }
}