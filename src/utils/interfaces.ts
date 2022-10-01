import {TriplanEventPreferredTime, TriplanPriority} from "./enums";

export interface CalendarEvent {
    title: string,
    start: Date,
    end: Date,
    id: string,
    allDay?: boolean
    icon?: string
    priority?: TriplanPriority
    duration?: string
    extendedProps?: any
    preferredTime?: TriplanEventPreferredTime,
    description?: string
    location?: LocationData
}

export interface SidebarEvent {
    id: string,
    title: string,
    duration?: string,
    icon?: string,
    category?: string,
    description?: string,
    priority?: TriplanPriority,
    preferredTime?: TriplanEventPreferredTime,
    extendedProps?: any,
    className?: string,
    location?: LocationData,
    allDay?: Boolean;
}

export interface TriPlanCategory {
    id: number,
    title: string,
    icon: string
}

export interface LocationData {
    address: string;
    latitude?: number;
    longitude?: number;
}

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface ImportEventsConfirmInfo {
    eventsToAdd: SidebarEvent[],
    categoriesToAdd: TriPlanCategory[],
    numOfEventsWithErrors: number,
    errors: string[]
}

export interface CustomDateRange {
    start?: string,
    end?: string
}

export interface DistanceResult {
    from: string,
    to: string,
    duration: string,
    distance: string,
    duration_value: number,
}