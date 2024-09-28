import { endpoints } from "../utils/endpoints";
import {apiPost} from "../../helpers/api";

export default class FileUploadApiService {

    async uploadPhoto(file: File, fileName: string): Promise<any> {

        // Create FormData to hold the file and filename
        const formData = new FormData();
        formData.append('file', file, fileName);

        try {
            // Assuming apiGetPromise needs a request method for file uploads,
            // you might need to adjust this based on how your API handles it.
            const result = await apiPost(endpoints.v2.fileUpload, formData, false);

            // Check if the result is valid and return the appropriate data
            return result?.data?.file;
        } catch {
            console.log("failed");
            return undefined;
        }
    }
}
