import {createContext} from "react";
import {action, computed, observable, runInAction} from "mobx";
import DataServices, {SharedTrip, Trip} from "../../services/data-handlers/data-handler-base";
import {TripDataSource} from "../../utils/enums";

export class MyTripsStore {
   @observable myTrips: Trip[] = [];
   @observable mySharedTrips: SharedTrip[] = [];
   @observable hiddenTripsEnabled: boolean = false;
   @observable isLoading = false;
   @observable showHidden = false;

   @observable tripsInEditMode: Record<number, boolean> = {};

   dataSource = TripDataSource.DB; // shouldn't change, therefore not observer

   @action
   async loadMyTrips(showLoader: boolean = true){

       if (showLoader) {
           this.setIsLoading(true);
       }

       // @ts-ignore
       const { trips, sharedTrips } = await DataServices.getService(this.dataSource).getTripsShort(undefined);
       runInAction(() => {
           this.myTrips = trips;
           this.mySharedTrips = sharedTrips;

           if (showLoader) {
               this.setIsLoading(false);
           }

           this.hiddenTripsEnabled = !!this.myTrips.find((x) => x.isHidden) || !!this.mySharedTrips.find((x) => x.isHidden);
       })
   }

   @action
    setIsLoading(isLoading: boolean){
       this.isLoading = isLoading;
   }

    @computed
    get allTripsSorted(){
        const filteredList = [...this.myTrips, ...this.mySharedTrips].filter((x) =>
            !!x.isHidden == this.showHidden
        );

        return filteredList.sort((a, b) => {
            const b_timestamp = b.lastUpdateAt ? new Date(b.lastUpdateAt).getTime() : 0;
            const a_timestamp = a.lastUpdateAt ? new Date(a.lastUpdateAt).getTime() : 0;
            return b_timestamp - a_timestamp;
        })
   }

    @action
    toggleEditTrip(tripId: number) {
       if (this.tripsInEditMode[tripId]) {
           delete this.tripsInEditMode[tripId];
       } else {
           this.tripsInEditMode[tripId] = true;
       }
    }

    isTripOnEditMode(tripId:number): boolean{
       return !!this.tripsInEditMode[tripId];
    }

    @action
    setShowHidden(showHidden: boolean){
       this.showHidden = showHidden;
    }

    @computed
    get totalTrips(){
        return this.myTrips.filter((x) => x.isHidden == this.showHidden).length + this.mySharedTrips.filter((x) => x.isHidden == this.showHidden).length;
    }
}

export const myTripsContext = createContext(new MyTripsStore());
