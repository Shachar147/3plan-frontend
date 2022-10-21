import {CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory} from "../utils/interfaces";
import {
    defaultCalendarEvents, defaultDateRange,
    defaultEvents, defaultLocalCode, LS_ALL_EVENTS, LS_CALENDAR_EVENTS, LS_CALENDAR_LOCALE,
    LS_CATEGORIES,
    LS_CUSTOM_DATE_RANGE, LS_DISTANCE_RESULTS,
    LS_SIDEBAR_EVENTS, setAllEvents, setDefaultCalendarEvents, setDefaultCalendarLocale,
    setDefaultCategories, setDefaultDistanceResults,
    setDefaultEvents
} from "../utils/defaults";
import TranslateService from "./translate-service";
import {EventStore} from "../stores/events-store";

export type LocaleCode = 'he' | 'en';

export interface Trip {
    name: string,
    dateRange: DateRangeFormatted,
    categories: TriPlanCategory[],
    sidebarEvents: Record<number,SidebarEvent[]>,
    calendarEvents: CalendarEvent[],
    allEvents: AllEventsEvent[],
    calendarLocale: LocaleCode
}

export interface DateRange {
    start: Date,
    end: Date
}

// already formatted for the FullCalendar component
export interface DateRangeFormatted {
    start: string,
    end: string
}

interface AllEventsEvent extends SidebarEvent {
    category: string
}

interface BaseDataHandler {
    getTrips: (eventStore: EventStore) => Trip[],
    setTripName: (name: string) => void,
    setDateRange: (dateRange: DateRangeFormatted, tripName: string) => void,
    setCategories: (categories: TriPlanCategory[], tripName: string) => void,
    setSidebarEvents: (sidebarEvents: SidebarEvent[], tripName: string) => void,
    setCalendarEvents: (calendarEvents: CalendarEvent[], tripName: string) => void,
    setAllEvents: (allEvents: AllEventsEvent[], tripName: string) => void,
    setCalendarLocale: (calendarLocale: LocaleCode, tripName: string) => void,

    getDateRange: (tripName: string, createMode?: boolean) => DateRangeFormatted,
    getCategories: (eventStore: EventStore, tripName?: string, createMode?: boolean) => TriPlanCategory[],
    getSidebarEvents: (tripName?: string, createMode?: boolean) => Record<number,SidebarEvent[]>,
    getCalendarEvents: (tripName?: string, createMode?: boolean) => CalendarEvent[],
    getAllEvents: (eventStore: EventStore, tripName?: string, createMode?: boolean) => AllEventsEvent[],
    getCalendarLocale: (tripName?: string, createMode?: boolean) => LocaleCode,
    getDistanceResults: (tripName?: string) => Map<string,DistanceResult>
}

export const tripNameToLSTripName = (tripName: string) => tripName.replaceAll(" ","-") ;
export const lsTripNameToTripName = (tripName: string) => tripName.replaceAll("-"," ") ;

class LocalStorageService implements BaseDataHandler {

    // --- GET ------------------------------------------------------------------------------
    getTrips(eventStore: EventStore): Trip[] {

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

            setAllEvents(defaultAllEvents, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!).map((e: CalendarEvent) => { e.start = new Date(e.start); e.end = new Date(e.end); return e; });
    }

    getCalendarEvents(tripName?: string, createMode?: boolean): CalendarEvent[] {
        createMode = createMode ||  window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CALENDAR_EVENTS,tripName].join("-") : LS_CALENDAR_EVENTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];
            setDefaultCalendarEvents(defaultCalendarEvents, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!).map((e: CalendarEvent) => { e.start = new Date(e.start); e.end = new Date(e.end); return e; });
    }

    getCalendarLocale(tripName?: string, createMode?: boolean): LocaleCode {
        createMode = createMode ||  window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CALENDAR_LOCALE,tripName].join("-") : LS_CALENDAR_LOCALE;
        if (!localStorage.getItem(key)){
            if (!createMode) return defaultLocalCode;
            setDefaultCalendarLocale(defaultLocalCode, tripName);
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
            setDefaultCategories(defaultCategories, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!);
    }

    getDateRange(tripName?: string, createMode?: boolean): DateRangeFormatted {
        createMode = createMode || window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_CUSTOM_DATE_RANGE,tripName].join("-") : LS_CUSTOM_DATE_RANGE;
        const eventStore = { createMode: createMode || window.location.href.indexOf("/create/") !== -1 }
        if (!localStorage.getItem(key)){
            if (!eventStore.createMode) return defaultDateRange();
            if (tripName) DataServices.LocalStorageService.setDateRange(defaultDateRange(), tripName);
        }
        return JSON.parse(localStorage.getItem(key)!);
    }

    getSidebarEvents(tripName?: string, createMode?: boolean): Record<number,SidebarEvent[]> {
        createMode = createMode || window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_SIDEBAR_EVENTS,tripName].join("-") : LS_SIDEBAR_EVENTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return [];
            setDefaultEvents(defaultEvents, tripName);
        }
        return JSON.parse(localStorage.getItem(key)!);
    }

    // --- SET ------------------------------------------------------------------------------
    setAllEvents(allEvents: AllEventsEvent[], tripName: string): void {
    }

    setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string): void {
    }

    setCalendarLocale(calendarLocale: LocaleCode, tripName: string): void {
    }

    setCategories(categories: TriPlanCategory[], tripName: string): void {
    }

    setDateRange(dateRange: DateRangeFormatted, tripName: string): void {
        const key = tripName ? [LS_CUSTOM_DATE_RANGE,tripName].join("-") : LS_CUSTOM_DATE_RANGE;
        localStorage.setItem(key, JSON.stringify(dateRange))
    }

    setSidebarEvents(sidebarEvents: SidebarEvent[], tripName: string): void {
    }

    setTripName(name: string): void {
    }

    getDistanceResults(tripName?: string): Map<string, DistanceResult> {

        // todo change - need to be general, not trip related
        // BUT - need to make sure we won't cross localstorage limits.

        const createMode = window.location.href.indexOf("/create/") !== -1;
        const key = tripName ? [LS_DISTANCE_RESULTS,tripName].join("-") : LS_DISTANCE_RESULTS;
        if (!localStorage.getItem(key)){
            if (!createMode) return new Map<string, DistanceResult>();
            setDefaultDistanceResults({}, tripName);
        }
        // @ts-ignore
        return JSON.parse(localStorage.getItem(key)) || {};
    }

    // --- LOCAL STORAGE --------------------------------------------------------------------
    CONTINUE_AS_GUEST_MODAL_LS_KEY = "triplan-hide-continue-as-guest-modal";

    shouldShowContinueAsGuest(): boolean {
        const shouldShow = localStorage.getItem(this.CONTINUE_AS_GUEST_MODAL_LS_KEY);
        return !!shouldShow;
    }

    doNotShowContinueAsGuest(): void {
        localStorage.setItem(this.CONTINUE_AS_GUEST_MODAL_LS_KEY, "1");
    }
}

export const DataServices = {
    LocalStorageService: new LocalStorageService()
}
export default DataServices;