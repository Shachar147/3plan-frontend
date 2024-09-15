import {createContext} from "react";
import {action, observable, runInAction} from "mobx";
import {Trip} from "../../services/data-handlers/data-handler-base";
import TripTemplatesApiService from "../services/trip-templates-api-service";

export class TripTemplatesStore {
    @observable tripTemplates: Trip[] = [];
    @observable isLoading = false;

    @action
    async loadTemplates(){
        this.setIsLoading(true);
        const tripTemplates = await new TripTemplatesApiService().getMainFeedTemplates();
        runInAction(() => {
            this.tripTemplates = [
                ...tripTemplates.results,
                ...tripTemplates.results,
                ...tripTemplates.results,
                ...tripTemplates.results,
                ...tripTemplates.results
            ];
            this.setIsLoading(false);
        })
    }

    @action
    setIsLoading(isLoading: boolean){
        this.isLoading = isLoading;
    }
}

export const tripTemplatesContext = createContext(new TripTemplatesStore());
