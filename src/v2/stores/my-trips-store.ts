import {createContext} from "react";
import {action, observable, runInAction} from "mobx";
import DataServices, {SharedTrip, Trip} from "../../services/data-handlers/data-handler-base";
import {TripDataSource} from "../../utils/enums";

export class MyTripsStore {
   @observable myTrips: Trip[] = [];
   @observable mySharedTrips: SharedTrip[] = [];
   @observable isLoading = false;

   @action
   async loadMyTrips(){
       this.setIsLoading(true);

       // @ts-ignore
       const { trips, sharedTrips } = await DataServices.getService(TripDataSource.DB).getTripsShort(undefined);
       runInAction(() => {
           this.myTrips = trips;
           this.mySharedTrips = sharedTrips;
           this.setIsLoading(false);
       })
   }

   @action
    setIsLoading(isLoading: boolean){
       this.isLoading = isLoading;
   }
}

export const myTripsContext = createContext(new MyTripsStore());
