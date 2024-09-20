import PlacesPhotosApiService from "../../services/places-photos-api-service";
import {Trip} from "../../../services/data-handlers/data-handler-base";

export async function getTripTemplatePhoto(trip: Trip){
    if (localStorage.getItem(`triplan-template-${trip.id}`)){
        return localStorage.getItem(`triplan-template-${trip.id}`);
    }

    const results = await Promise.all(trip.destinations.map((d) => new PlacesPhotosApiService().getPhoto(d)));

    // const bgs = results.map((r) => r["data"]?.[0]?.["photo"]).filter(Boolean);
    let bgs = results.map((r) => r["data"]?.[0]?.["other_photos"]).filter(Boolean).map((b) => JSON.parse(b)).flat();
    if (!bgs.length){
        bgs = results.map((r) => r["data"]?.[0]?.["photo"]).filter(Boolean).map((b) => JSON.parse(b)).flat();
    }

    if (bgs.length) {
        let random = Math.floor(Math.random() * bgs.length);
        localStorage.setItem(`triplan-template-${trip.id}`, bgs[random]);
        return bgs[random];
    }
    return undefined;
}