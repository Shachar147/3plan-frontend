import {EventStore} from "../../stores/events-store";
import {
    defaultCalendarEvents, defaultDateRange,
    defaultEvents, defaultLocalCode, getLocalStorageKeys,
    LS_ALL_EVENTS,
    LS_CALENDAR_EVENTS, LS_CALENDAR_LOCALE, LS_CATEGORIES,
    LS_CUSTOM_DATE_RANGE, LS_DATA_SOURCE, LS_DISTANCE_RESULTS, LS_SIDEBAR_EVENTS
} from "../../utils/defaults";
import {CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory} from "../../utils/interfaces";
import TranslateService from "../translate-service";
import DataServices, {
    AllEventsEvent, BaseDataHandler,
    DateRangeFormatted,
    LocaleCode,
    lsTripNameToTripName,
    Trip, tripNameToLSTripName
} from "./data-handler-base";
import {TripDataSource} from "../../utils/enums";

export class LocalStorageService implements BaseDataHandler {

    CONTINUE_AS_GUEST_MODAL_LS_KEY = "triplan-hide-continue-as-guest-modal";

    getDataSourceName(){
        return TripDataSource.LOCAL;
    }

    // --- GET ------------------------------------------------------------------------------
    async getTrips(eventStore: EventStore): Promise<Trip[]> {

        const trips: Trip[] = [];

        const lsTripsDates = Object.keys(localStorage).filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1);

        const getTripName = (x: string) => {
            return x.replace(LS_CUSTOM_DATE_RANGE + "-","");
        }

        lsTripsDates.map((x) => getTripName(x)).map((LSTripName) => {
            LSTripName = LSTripName === LS_CUSTOM_DATE_RANGE ? "" : LSTripName;
            const tripName = LSTripName !== "" ? lsTripNameToTripName(LSTripName) : "";
            if (tripName !== "") {
                const key = tripName.length ? [LS_CUSTOM_DATE_RANGE, LSTripName].join("-") : LS_CUSTOM_DATE_RANGE;
                const jsonString = localStorage.getItem(key);
                if (jsonString) {
                    const dates = JSON.parse(jsonString);

                    trips.push({
                        name: tripName,
                        dateRange: dates,
                        categories: this.getCategories(eventStore, tripName),
                        sidebarEvents: this.getSidebarEvents(tripName),
                        calendarEvents: this.getCalendarEvents(tripName),
                        allEvents: this.getAllEvents(eventStore, tripName),
                        calendarLocale: this.getCalendarLocale(tripName)
                    } as Trip)
                }
            }
        });

        return trips;
    }

    getAllEvents(eventStore: EventStore, tripName?: string, createMode?: boolean): AllEventsEvent[] {
        if (!tripName) return [];

        createMode = createMode ||  window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_ALL_EVENTS,tripName].join("-") : LS_ALL_EVENTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];

            const hash: any = {};
            DataServices.LocalStorageService.getCategories(eventStore, tripName).forEach((x:any) => hash[x.id] = x.icon)

            const defaultAllEvents = Object.keys(DataServices.LocalStorageService.getSidebarEvents(tripName)).map((category) => {
                // @ts-ignore
                const categoryEvents = defaultEvents[category];

                const categoryId = parseInt(category);
                return categoryEvents.map((event: SidebarEvent) => {
                    event.icon = event.icon || hash[categoryId];
                    event.category = category;
                    return event;
                })
            }).flat();

            if (tripName) this.setAllEvents(defaultAllEvents, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!).map((e: CalendarEvent) => { e.start = new Date(e.start); e.end = new Date(e.end); return e; });
    }

    getCalendarEvents(tripName?: string, createMode?: boolean): CalendarEvent[] {
        if (!tripName) return [];

        createMode = createMode ||  window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CALENDAR_EVENTS,tripName].join("-") : LS_CALENDAR_EVENTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];
            if (tripName) this.setCalendarEvents(defaultCalendarEvents, tripName);
        }
        const results = JSON.parse(localStorage.getItem(key)!).map((e: CalendarEvent) => { e.start = new Date(e.start); e.end = new Date(e.end); return e; });

        results.forEach((e: any) => {
            if (e.extendedProps && e.extendedProps.suggestedEndTime) {
                delete e.extendedProps.suggestedEndTime
            }
        })

        return results;
    }

    getCalendarLocale(tripName?: string, createMode?: boolean): LocaleCode {
        createMode = createMode ||  window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CALENDAR_LOCALE,tripName].join("-") : LS_CALENDAR_LOCALE;
        if (!localStorage.getItem(key)){
            if (!createMode) return defaultLocalCode;
            this.setCalendarLocale(defaultLocalCode, tripName);
        }
        // @ts-ignore
        return localStorage.getItem(key) || defaultLocalCode;
    }

    getCategories(eventStore: EventStore, tripName?: string, createMode?: boolean): TriPlanCategory[] {
        const key = tripName ? [LS_CATEGORIES,tripName].join("-") : LS_CATEGORIES;
        createMode = createMode || window.location.href.indexOf("/create/") !== -1;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];

            const defaultCategories: TriPlanCategory[] = [
                {
                    id: 1,
                    icon: "",
                    title: TranslateService.translate(eventStore, 'CATEGORY.GENERAL')
                },
                {
                    id: 2,
                    icon: "",
                    title: TranslateService.translate(eventStore, 'CATEGORY.LOGISTICS')
                }
            ]
            if (tripName) this.setCategories(defaultCategories, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!) || [];
    }

    getDateRange(tripName?: string, createMode?: boolean): DateRangeFormatted {
        createMode = createMode || window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CUSTOM_DATE_RANGE,tripName].join("-") : LS_CUSTOM_DATE_RANGE;
        const eventStore = { createMode: createMode || window.location.href.indexOf("/create/") !== -1 }
        if (!localStorage.getItem(key)){
            if (!eventStore.createMode) return defaultDateRange();
            if (tripName) this.setDateRange(defaultDateRange(), tripName);
        }
        return JSON.parse(localStorage.getItem(key)!);
    }

    getSidebarEvents(tripName?: string, createMode?: boolean): Record<number,SidebarEvent[]> {
        if (!tripName) return [];

        createMode = createMode || window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_SIDEBAR_EVENTS,tripName].join("-") : LS_SIDEBAR_EVENTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];
            if (tripName) this.setSidebarEvents(defaultEvents, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!);
    }

    getDistanceResults(tripName?: string): Map<string, DistanceResult> {

        // todo change - need to be general, not trip related
        // BUT - need to make sure we won't cross localstorage limits.

        const createMode = window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_DISTANCE_RESULTS,tripName].join("-") : LS_DISTANCE_RESULTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return new Map<string, DistanceResult>();
            this.setDistanceResults({} as Map<string, DistanceResult>, tripName);
        }
        // @ts-ignore
        return JSON.parse(localStorage.getItem(key)) || {};
    }

    // --- SET ------------------------------------------------------------------------------
    setAllEvents(allEvents: AllEventsEvent[], tripName: string): void {
        const key = tripName ? [LS_ALL_EVENTS,tripName].join("-") : LS_ALL_EVENTS;
        localStorage.setItem(key, JSON.stringify(allEvents))
    }

    setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string): void {
        const key = tripName ? [LS_CALENDAR_EVENTS,tripName].join("-") : LS_CALENDAR_EVENTS;
        localStorage.setItem(key, JSON.stringify(calendarEvents));
    }

    setCalendarLocale(calendarLocale: LocaleCode, tripName?: string): void {
        const key = tripName ? [LS_CALENDAR_LOCALE,tripName].join("-") : LS_CALENDAR_LOCALE;
        localStorage.setItem(key, defaultLocalCode)
    }

    setCategories(categories: TriPlanCategory[], tripName: string): void {
        const key = tripName ? [LS_CATEGORIES,tripName].join("-") : LS_CATEGORIES;
        localStorage.setItem(key, JSON.stringify(categories))
    }

    setDateRange(dateRange: DateRangeFormatted, tripName: string): void {
        const key = tripName ? [LS_CUSTOM_DATE_RANGE,tripName].join("-") : LS_CUSTOM_DATE_RANGE;
        localStorage.setItem(key, JSON.stringify(dateRange))
    }

    setSidebarEvents(sidebarEvents: Record<number, SidebarEvent[]>, tripName: string): void {
        const key = tripName ? [LS_SIDEBAR_EVENTS,tripName].join("-") : LS_SIDEBAR_EVENTS;
        localStorage.setItem(key, JSON.stringify(sidebarEvents));
    }

    setTripName(tripName: string, newTripName: string): void {
        const LSTripName = tripNameToLSTripName(tripName);
        const newLSTripName = tripNameToLSTripName(newTripName);

        const lsKeys = getLocalStorageKeys();
        const separator = (LSTripName === "") ? "" : "-";
        const separator2 = (newLSTripName === "") ? "" : "-";
        Object.values(lsKeys).forEach((localStorageKey) => {
            const key = [localStorageKey,LSTripName].join(separator);
            const newKey = [localStorageKey,newLSTripName].join(separator2);
            const value = localStorage.getItem(key);
            if (value != undefined) {
                localStorage.setItem(newKey, value);
                localStorage.removeItem(key);
            }
        });

    }

    setDistanceResults(distanceResults: Map<String, DistanceResult>, tripName?: string) {
        const key = tripName ? [LS_DISTANCE_RESULTS,tripName].join("-") : LS_DISTANCE_RESULTS;
        localStorage.setItem(key, JSON.stringify(distanceResults))
    }

    static getLastDataSource(){
        return localStorage.getItem(LS_DATA_SOURCE) as TripDataSource;
    }

    static setLastDataSource(dataSource: TripDataSource){
        localStorage.setItem(LS_DATA_SOURCE, dataSource)
    }

    // --- LOCAL STORAGE --------------------------------------------------------------------
    shouldShowContinueAsGuest(): boolean {
        const shouldShow = localStorage.getItem(this.CONTINUE_AS_GUEST_MODAL_LS_KEY);
        return !!shouldShow;
    }

    doNotShowContinueAsGuest(): void {
        localStorage.setItem(this.CONTINUE_AS_GUEST_MODAL_LS_KEY, "1");
    }
}
