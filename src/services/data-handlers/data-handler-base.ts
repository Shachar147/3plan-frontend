import {CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory} from "../../utils/interfaces";
import {EventStore} from "../../stores/events-store";
import {LocalStorageService} from "./local-storage-service";
import {TripDataSource} from "../../utils/enums";
import {DBService} from "./db-service";

export type LocaleCode = 'he' | 'en';

export interface Trip {
    name: string,
    dateRange: DateRangeFormatted,
    categories: TriPlanCategory[],
    sidebarEvents: Record<number,SidebarEvent[]>,
    calendarEvents: CalendarEvent[],
    allEvents: AllEventsEvent[],
    calendarLocale: LocaleCode,
}

export interface DBTrip extends Trip {
    id: number
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

export interface AllEventsEvent extends SidebarEvent {
    category: string
}

export interface BaseDataHandler {
    getTrips: (eventStore: EventStore) => Promise<Trip[]>,
    setTripName: (tripName: string, newTripName: string) => Promise<void>,
    setDateRange: (dateRange: DateRangeFormatted, tripName: string) => void,
    setCategories: (categories: TriPlanCategory[], tripName: string) => void,
    setSidebarEvents: (sidebarEvents: Record<number, SidebarEvent[]>, tripName: string) => void,
    setCalendarEvents: (calendarEvents: CalendarEvent[], tripName: string) => void,
    setAllEvents: (allEvents: AllEventsEvent[], tripName: string) => void,
    setCalendarLocale: (calendarLocale: LocaleCode, tripName?: string) => void,
    setDistanceResults: (distanceResults: Map<String, DistanceResult>, tripName?: string) => void,

    getDateRange: (tripName: string, createMode?: boolean) => DateRangeFormatted,
    getCategories: (eventStore: EventStore, tripName?: string, createMode?: boolean) => TriPlanCategory[],
    getSidebarEvents: (tripName?: string, createMode?: boolean) => Record<number,SidebarEvent[]>,
    getCalendarEvents: (tripName?: string, createMode?: boolean) => CalendarEvent[],
    getAllEvents: (eventStore: EventStore, tripName?: string, createMode?: boolean) => AllEventsEvent[],
    getCalendarLocale: (tripName?: string, createMode?: boolean) => LocaleCode,
    getDistanceResults: (tripName?: string) => Map<string,DistanceResult>
    getDataSourceName: () => TripDataSource
}

export const tripNameToLSTripName = (tripName: string) => tripName.replaceAll(" ","-") ;
export const lsTripNameToTripName = (tripName: string) => tripName.replaceAll("-"," ") ;

export const DataServices = {
    LocalStorageService: new LocalStorageService(),
    DBService: new DBService(),
    getService: (dataSource: TripDataSource) => {
        if (dataSource === TripDataSource.DB){
            return DataServices.DBService;
        } else {
            return DataServices.LocalStorageService;
        }
    }
}
export default DataServices;