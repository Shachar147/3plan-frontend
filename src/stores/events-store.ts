import {createContext} from "react";
import {action, computed, observable, toJS} from "mobx";
import {DateSelectArg, EventInput} from "@fullcalendar/react";
import {
    getAllEvents,
    getDefaultCalendarEvents,
    getDefaultCalendarLocale,
    getDefaultCategories, getDefaultCustomDateRange,
    getDefaultEvents
} from "../utils/defaults";
import {CalendarEvent, SidebarEvent, TriPlanCategory} from "../utils/interfaces";
import {ViewMode} from "../utils/enums";
import {convertMsToHM} from "../utils/time-utils";

export class EventStore {
    categoryIdBuffer = 0;
    eventIdBuffer = 0;
    allowRemoveAllCalendarEvents = false;
    @observable weekendsVisible = true;
    @observable categories: TriPlanCategory[] = getDefaultCategories();
    @observable sidebarEvents: Record<number,SidebarEvent[]> = getDefaultEvents();
    @observable calendarEvents: EventInput[] = getDefaultCalendarEvents();
    @observable allEvents: SidebarEvent[] = getAllEvents();
    @observable calendarLocalCode: "he" | "en" = getDefaultCalendarLocale();
    @observable searchValue = "";
    @observable viewMode = ViewMode.calendar;
    @observable hideCustomDates = this.viewMode == ViewMode.calendar;
    @observable openCategories = observable.map<number,number>({});
    @observable hideEmptyCategories: boolean = false;
    @observable tripName: string = "";
    @observable allEventsTripName: string = "";
    @observable customDateRange = getDefaultCustomDateRange();

    getJSCalendarEvents(): EventInput[] {
        return toJS(this.calendarEvents);
    }

    @action
    setHideCustomDates(hide: boolean){
        this.hideCustomDates = hide;
    }

    @computed
    get filteredCalendarEvents(): EventInput[] {
        return this.getJSCalendarEvents().filter((event) => event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1);
    }

    getSidebarEvents(): Record<number,SidebarEvent[]> {
        const toReturn: Record<number,SidebarEvent[]> = {};
        Object.keys(this.sidebarEvents).forEach((category) => {
            toReturn[parseInt(category)] = this.sidebarEvents[parseInt(category)].map((x) => toJS(x))
        })
        return toReturn;
    }

    public createEventId(): string {
        this.eventIdBuffer++;

        let minEventId = 0;
        if (this.allEvents.length > 0) {
            minEventId = Math.max(...this.allEvents.flat().map((x) => parseInt(x.id)));
        }

        return (minEventId + 1 + this.eventIdBuffer).toString();
    }

    public createCategoryId(): number {
        this.categoryIdBuffer++;
        let maxCategory = 0;
        if (this.categories.length > 0){
            maxCategory = Math.max(...this.categories.map((x) => x.id));
        }
        return maxCategory + 1 + this.categoryIdBuffer;
    }

    updateEvent(storedEvent: SidebarEvent | EventInput | any, newEvent: SidebarEvent | EventInput | any){
        storedEvent.title = newEvent.title;
        storedEvent.allDay = newEvent.allDay;
        storedEvent.start = newEvent.start || storedEvent.start;
        storedEvent.end = newEvent.end || storedEvent.end;
        storedEvent.icon = newEvent.icon != undefined ? newEvent.icon :
            newEvent.extendedProps ? newEvent.extendedProps.icon :
            storedEvent.extendedProps ? storedEvent.extendedProps.icon :
            storedEvent.icon;
        storedEvent.priority = newEvent.priority != undefined ? newEvent.priority : newEvent.extendedProps ? newEvent.extendedProps.priority : storedEvent.priority
        storedEvent.description = newEvent.description != undefined ? newEvent.description : newEvent.extendedProps ? newEvent.extendedProps.description : storedEvent.description
        storedEvent.className = `priority-${storedEvent.priority}`;
        // storedEvent.className = newEvent.className || storedEvent.className;

        storedEvent.extendedProps = storedEvent.extendedProps || {};
        if (newEvent.extendedProps){
            Object.keys(newEvent.extendedProps).forEach((key) => {
                storedEvent.extendedProps![key] = newEvent.extendedProps[key];
            });
        }
        storedEvent.extendedProps.icon = storedEvent.icon;
        storedEvent.extendedProps.priority = storedEvent.priority;
        storedEvent.extendedProps.description = storedEvent.description;

        // @ts-ignore
        const millisecondsDiff = storedEvent.end - storedEvent.start;
        if (millisecondsDiff > 0) {
            storedEvent.duration = convertMsToHM(millisecondsDiff);
        }
    }

    updateSidebarEvent(storedEvent: SidebarEvent, newEvent: SidebarEvent){
        storedEvent.title = newEvent.title;
        storedEvent.icon = newEvent.icon != undefined ? newEvent.icon : storedEvent.icon;
        storedEvent.duration = newEvent.duration || storedEvent.duration;
        storedEvent.extendedProps = newEvent.extendedProps != undefined ? newEvent.extendedProps : storedEvent.extendedProps ? storedEvent.extendedProps : {};
        storedEvent.priority = newEvent.priority != undefined ? newEvent.priority : storedEvent.priority;
        storedEvent.preferredTime = newEvent.preferredTime != undefined ? newEvent.preferredTime : storedEvent.preferredTime;
        storedEvent.description = newEvent.description != undefined ? newEvent.description : storedEvent.description;
        if (newEvent.extendedProps){
            Object.keys(newEvent.extendedProps).forEach((key) => {
                storedEvent.extendedProps![key] = newEvent.extendedProps[key];
            });
        }
    }

    @action
    changeEvent(changeInfo: any) {
        const newEvent = changeInfo.event;
        const eventId = changeInfo.event.id;
        const storedEvent = this.calendarEvents.find((e) => e.id == eventId);
        if (storedEvent) {
            this.updateEvent(storedEvent, newEvent)

            this.setCalendarEvents([
                ...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
                storedEvent
            ]);

            const findEvent = this.allEvents.find((event) => event.id.toString() === eventId.toString());
            if (findEvent) {
                this.updateEvent(findEvent, storedEvent)
            } else {
                console.error("event not found!");
            }

            this.setAllEvents([
                ...this.allEvents
            ])

            return true;
        }
        return false;
    }

    @action
    addEvent(selectInfo: DateSelectArg, title: string | null) {
        this.calendarEvents.push({
            id: this.createEventId(),
            title: title || "New Event",
            start: selectInfo.start,
            end: selectInfo.end,
            allDay: selectInfo.allDay,
        });
    }

    @action
    deleteEvent(eventId: string) {
        this.setCalendarEvents([
            ...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString())
        ])
    }

    @action
    toggleWeekends() {
        this.weekendsVisible = !this.weekendsVisible;
    }

    @action
    setCalendarEvents(newCalenderEvents: EventInput[]){
        this.calendarEvents = newCalenderEvents.filter((e) => Object.keys(e).includes("start"));
    }

    @action
    setSidebarEvents(newSidebarEvents: Record<number,SidebarEvent[]>){
        this.sidebarEvents = newSidebarEvents;
    }

    @action
    setCategories(newCategories: TriPlanCategory[]){
        this.categories = newCategories;
    }

    @action
    setAllEvents(newAllEvents: SidebarEvent[] | CalendarEvent[]){
        this.allEvents = newAllEvents.map((x) => {
            if ("start" in x) {
                // @ts-ignore
                delete x.start;
            }
            if ("end" in x) {
                // @ts-ignore
                delete x.end;
            }
            return x;
        });
    }

    @action
    clearCalendarEvents(){
        // add back to sidebar
        const newEvents = {...this.getSidebarEvents()};
        const eventToCategory: any = {};
        const eventIdToEvent: any = {};
        this.allEvents.forEach((e) => {
            eventToCategory[e.id] = e.category ? e.category : e.extendedProps ? e.extendedProps.categoryId : undefined;
            eventIdToEvent[e.id] = e;
        })

        this.calendarEvents.forEach((event) => {
            const eventId = event.id!;
            const categoryId = eventToCategory[eventId];
            const sidebarEvent = eventIdToEvent[eventId];
            delete sidebarEvent.start;
            delete sidebarEvent.end;
            if (sidebarEvent.extendedProps) {
                sidebarEvent.priority = sidebarEvent.extendedProps.priority;
            }
            if (!sidebarEvent.preferredTime) {
                sidebarEvent.preferredTime = sidebarEvent.extendedProps ? sidebarEvent.extendedProps.preferredTime : sidebarEvent.preferredTime;
            }
            newEvents[categoryId].push(sidebarEvent);
        })

        this.setSidebarEvents(newEvents);
        this.allowRemoveAllCalendarEvents = true;
        this.setCalendarEvents([]);
    }

    @computed
    get categoriesIcons(): Record<number, string> {
        const hash: Record<number, string> = {};
        this.categories.forEach(x => hash[x.id] = x.icon);
        return hash;
    }

    @action
    setCalendarLocalCode(newCalendarLocalCode: 'he' | 'en'){
        this.calendarLocalCode = newCalendarLocalCode;
    }

    getCurrentDirection() {
        if (this.calendarLocalCode === "he"){
            return "rtl";
        } else {
            return "ltr";
        }
    }

    @action
    setSearchValue(value: string) {
        this.searchValue = value;
    }

    @action
    setViewMode(newVideMode: ViewMode){
        this.viewMode = newVideMode;
    }

    @computed
    get isListView(){
        return this.viewMode === ViewMode.list
    }

    @action
    openCategory(categoryId: number){
        this.openCategories.set(categoryId, 1);
    }

    @action
    toggleCategory(categoryId: number){
        if (this.openCategories.has(categoryId)){
            this.openCategories.delete(categoryId);
        } else {
            this.openCategory(categoryId);
        }
    }

    @action
    openAllCategories(){
        this.categories.forEach((category) => {
            this.openCategory(category.id);
        })
    }

    @action
    closeAllCategories(){
        this.openCategories = observable.map({})
    }

    @action
    setHideEmptyCategories(hide: boolean){
        this.hideEmptyCategories = hide;
    }

    @action
    setTripName(name: string, calendarLocale?: 'en' | 'he'){
        this.tripName = name;
        this.allEvents = getAllEvents(name);
        this.categories = getDefaultCategories(name);
        this.sidebarEvents = getDefaultEvents(name);
        this.calendarEvents = getDefaultCalendarEvents(name);
        this.customDateRange = getDefaultCustomDateRange(name);
        this.calendarLocalCode = calendarLocale || getDefaultCalendarLocale(name);
        this.allEventsTripName = name;
    }

    @action
    setCustomDateRange(customDateRange: any){
        this.customDateRange = customDateRange;
    }
}

export const eventStoreContext = createContext(new EventStore());

