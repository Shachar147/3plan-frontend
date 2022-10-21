import {apiDelete, apiGet, apiPost} from "../helpers/api";
import {EventStore} from "../stores/events-store";
import {DataServices, LocaleCode} from "./data-handlers/data-handler-base";

interface upsertTripProps {
    name?: string,
    dateRange?: string,
    categories?: string,
    calendarEvents?: string,
    sidebarEvents?: string,
    allEvents?: string,
    calendarLocale?: LocaleCode
}

let lastUpsertData = {};

const DBService = {
    upsertTrip: async (
        data: upsertTripProps,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ) => {
        const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale } = data;
        await apiPost(this,
            '/trip/upsert',
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
    },
    createTrip: async (
        data: upsertTripProps,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ) => {
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
    },
    upsertTripByName: async (
        tripName: string,
        customDateRange: string,
        eventStore: EventStore,
        newData: upsertTripProps,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ) => {
        const defaultData = {
            name: tripName,
            dateRange: customDateRange,
            calendarLocale: eventStore.calendarLocalCode,
            allEvents: DataServices.LocalStorageService.getAllEvents(eventStore, tripName),
            sidebarEvents: DataServices.LocalStorageService.getSidebarEvents(tripName),
            calendarEvents: DataServices.LocalStorageService.getCalendarEvents(tripName),
            categories: DataServices.LocalStorageService.getCategories(eventStore, tripName)
        };

        const combinedData = {
            ...defaultData,
            ...newData
        } as upsertTripProps;

        if (JSON.stringify(combinedData) !== JSON.stringify(lastUpsertData)) {
            console.log("combined", combinedData, "last", lastUpsertData);
            lastUpsertData = combinedData;
            await DBService.upsertTrip(combinedData, successCallback, errorCallback, finallyCallback);
        }
    },
    deleteTripByName: async (
        tripName: string,
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ) => {
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
    },
    getTrips: async (
        successCallback?: (res: any) => void,
        errorCallback?: (error: any, error_retry: number) => void,
        finallyCallback?: () => void
    ) => {
        return apiGet(this, '/trip/',
            async function(res: any) {
                if (successCallback){
                    res.data.data.forEach((x: any) => x.name += ' (db)');
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
            });
    }
};

export default DBService;