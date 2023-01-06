import {EventStore} from "../../stores/events-store";
import {defaultDateRange, defaultLocalCode} from "../../utils/defaults";
import {CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory} from "../../utils/interfaces";
import {AllEventsEvent, BaseDataHandler, DateRangeFormatted, LocaleCode, Trip} from "./data-handler-base";
import {apiDelete, apiGetPromise, apiPost} from "../../helpers/api";
import {TripDataSource} from "../../utils/enums";

export interface upsertTripProps {
    name?: string,
    dateRange?: string,
    categories?: string,
    calendarEvents?: string,
    sidebarEvents?: string,
    allEvents?: string,
    calendarLocale?: LocaleCode
}

export class DBService implements BaseDataHandler {

    getDataSourceName(){
        return TripDataSource.DB;
    }

    // --- GET ------------------------------------------------------------------------------
    getAllEvents(eventStore: EventStore, tripName?: string, createMode?: boolean): AllEventsEvent[] {
        return []; // todo complete
    }

    getCalendarEvents(tripName?: string, createMode?: boolean): CalendarEvent[] {
        return []; // todo complete
    }

    getCalendarLocale(tripName?: string, createMode?: boolean): LocaleCode {
        return defaultLocalCode; // todo complete
    }

    getCategories(eventStore: EventStore, tripName?: string, createMode?: boolean): TriPlanCategory[] {
        return []; // todo complete
    }

    getDateRange(tripName: string, createMode?: boolean): DateRangeFormatted {
        return defaultDateRange(); // todo complete
    }

    getDistanceResults(tripName?: string): Map<string, DistanceResult> {
        return new Map<string,DistanceResult>(); // todo complete
    }

    getSidebarEvents(tripName?: string, createMode?: boolean): Record<number, SidebarEvent[]> {
        return {}; // todo complete
    }

    async getTrips(eventStore: EventStore): Promise<Trip[]> {
        const res: any = await apiGetPromise(this, '/trip/');
        const trips: Trip[] = [];
        res.data.data.forEach((x: any) => {
            // x.name += ' (db)'; // todo remove
            trips.push(x as Trip);
        });
        return trips;
    }

    // --- SET ------------------------------------------------------------------------------
    setAllEvents(allEvents: AllEventsEvent[], tripName: string): void {
        // todo complete
    }

    setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string): void {
        // todo complete
    }

    setCalendarLocale(calendarLocale: LocaleCode, tripName?: string): void {
        // todo complete
    }

    setCategories(categories: TriPlanCategory[], tripName: string): void {
        // todo complete
    }

    setDateRange(dateRange: DateRangeFormatted, tripName: string): void {
        // todo complete
    }

    setDistanceResults(distanceResults: Map<String, DistanceResult>, tripName?: string): void {
        // todo complete
    }

    setSidebarEvents(sidebarEvents: Record<number, SidebarEvent[]>, tripName: string): void {
        // todo complete
    }

    setTripName(tripName: string, newTripName: string): void {
        // todo complete
    }

    // --------------------------------------------------------------------------------------
    async deleteTripByName(
        tripName: string,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ){
        await apiDelete(this,
            '/trip/name/' + tripName,
            async function(res: any) {
                if (successCallback){
                    successCallback(res);
                }
            },
            function(error: any, error_retry: number) {
                // console.log(error);
                // let req_error = error.message;
                // if (error.message.indexOf("401") !== -1) { req_error = UNAUTHORIZED_ERROR; }
                // if (error.message.indexOf("400") !== -1) { req_error = `Oops, failed saving this game.` }

                if (errorCallback){
                    errorCallback(error, error_retry);
                }

            },
            function() {
                if (finallyCallback){
                    finallyCallback();
                }
            }
        );
    }

    async createTrip(
        data: upsertTripProps,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ){
        const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale } = data;
        await apiPost(this,
            '/trip',
            { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale },
            async function(res: any) {
                if (successCallback){
                    successCallback(res);
                }
            },
            function(error: any, error_retry: number) {
                // console.log(error);
                // let req_error = error.message;
                // if (error.message.indexOf("401") !== -1) { req_error = UNAUTHORIZED_ERROR; }
                // if (error.message.indexOf("400") !== -1) { req_error = `Oops, failed saving this game.` }

                if (errorCallback){
                    errorCallback(error, error_retry);
                }

            },
            function() {
                if (finallyCallback){
                    finallyCallback();
                }
            }
        );
    }
}
