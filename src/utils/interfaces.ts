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

export interface ImportEventsConfirmInfo {
    eventsToAdd: SidebarEvent[],
    categoriesToAdd: TriPlanCategory[],
    numOfEventsWithErrors: number,
    errors: string[]
}