import {apiGetPromise} from "../../helpers/api";
import {endpoints} from "../utils/endpoints";

export default class PlacesPhotosApiService {
    getPhoto = async (destination: string) => {
        const result = await apiGetPromise(this, endpoints.v2.placesPhotos.get(destination));
        if (result) {
            return result?.data;
        }
        return {};
    }

}