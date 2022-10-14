import {createContext, useContext, useState} from "react";
import {action, computed, observable, runInAction, toJS} from "mobx";
import {DateSelectArg, EventInput} from "@fullcalendar/react";
import {
    getAllEvents,
    getDefaultCalendarEvents,
    getDefaultCalendarLocale,
    getDefaultCategories,
    getDefaultCustomDateRange,
    getDefaultDistanceResults,
    getDefaultEvents,
    setAllEvents,
    setDefaultCalendarEvents,
    setDefaultCalendarLocale,
    setDefaultCategories,
    setDefaultDistanceResults,
    setDefaultEvents
} from "../utils/defaults";
import {CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory} from "../utils/interfaces";
import {GoogleTravelMode, ViewMode} from "../utils/enums";
import {convertMsToHM} from "../utils/time-utils";

// @ts-ignore
import _ from "lodash";
import {containsDuplicates, lockOrderedEvents} from "../utils/utils";
import ListViewService from "../services/list-view-service";

const defaultModalSettings = {
    show: false,
    title: "",
    content: undefined,
    onConfirm: () => {},
    onCancel: () => {
        // const eventStore = useContext(eventStoreContext);
        // runInAction(() => {
        //     eventStore.modalSettings.show = false;
        // })
    }
}

export class EventStore {
    categoryIdBuffer = 0;
    eventIdBuffer = 0;
    allowRemoveAllCalendarEvents = false;
    @observable weekendsVisible = true;
    @observable categories: TriPlanCategory[];
    @observable sidebarEvents: Record<number,SidebarEvent[]> = getDefaultEvents();
    @observable calendarEvents: EventInput[] = getDefaultCalendarEvents();
    @observable allEvents: SidebarEvent[];
    @observable calendarLocalCode: "he" | "en" = getDefaultCalendarLocale();
    @observable searchValue = "";
    @observable viewMode = ViewMode.calendar;
    @observable hideCustomDates = this.viewMode == ViewMode.calendar;
    @observable openCategories = observable.map<number,number>({});
    @observable openSidebarGroups = observable.map<string,number>({});
    @observable hideEmptyCategories: boolean = false;
    @observable tripName: string = "";
    @observable allEventsTripName: string = "";
    @observable customDateRange = getDefaultCustomDateRange();
    @observable showOnlyEventsWithNoLocation: boolean = false;
    @observable showOnlyEventsWithNoOpeningHours: boolean = false;
    @observable showOnlyEventsWithTodoComplete: boolean = false;
    @observable calculatingDistance = 0;
    @observable distanceResults = observable.map<string,DistanceResult>(getDefaultDistanceResults());
    @observable travelMode = GoogleTravelMode.DRIVING;
    @observable modalSettings = defaultModalSettings;
    modalValues: any = {};
    @observable modalValuesRefs: any = {};

    constructor() {
        this.categories = getDefaultCategories(this);
        this.allEvents = getAllEvents(this);
        this.init();
    }

    init(){
        this.initBodyLocaleClassName();
        this.initCustomDatesVisibilityBasedOnViewMode();
    }

    checkIfEventHaveOpenTasks(event: any) {
        let { title, description } = event;
        if (description == undefined && event.extendedProps){
            description = event.extendedProps.description;
        }
        const { taskKeywords } = ListViewService._initSummaryConfiguration();
        const isTodoComplete = taskKeywords.find((k) => title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 || description.toLowerCase().indexOf(k.toLowerCase()) !== -1)
        return !!isTodoComplete;
    }

    // --- computed -------------------------------------------------------------

    @computed
    get filteredCalendarEvents(): EventInput[] {
        return this.getJSCalendarEvents()
            .filter((event) =>
                (event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1) &&
                (this.showOnlyEventsWithNoLocation ? !(event.location != undefined || (event.extendedProps && event.extendedProps.location != undefined)) : true) &&
                (this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined || (event.extendedProps && event.extendedProps.openingHours != undefined)) : true) &&
                (this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true)
            );
    }

    @computed
    get categoriesIcons(): Record<number, string> {
        const hash: Record<number, string> = {};
        this.categories.forEach(x => hash[x.id] = x.icon);
        return hash;
    }

    @computed
    get isListView(){
        return this.viewMode === ViewMode.list
    }

    @computed
    get isMapView(){
        return this.viewMode === ViewMode.map;
    }

    @computed
    get isCalendarView(){
        return this.viewMode === ViewMode.calendar;
    }

    @computed
    get getSidebarEvents(): Record<number,SidebarEvent[]> {
        const toReturn: Record<number,SidebarEvent[]> = {};
        Object.keys(this.sidebarEvents).forEach((category) => {
            toReturn[parseInt(category)] = this.sidebarEvents[parseInt(category)]
                .map((x) => toJS(x))
                .filter((event) =>
                    (this.showOnlyEventsWithNoLocation ? !(event.location || (event.extendedProps && event.extendedProps.location)) : true) &&
                    (this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined || (event.extendedProps && event.extendedProps.openingHours != undefined)) : true) &&
                    (this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true)
                )
        })
        return toReturn;
    }

    // --- actions --------------------------------------------------------------

    @action
    setHideCustomDates(hide: boolean){
        this.hideCustomDates = hide;
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
                ...this.allEvents,
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

        // lock ordered events
        this.calendarEvents = this.calendarEvents.map((x: EventInput) => lockOrderedEvents(x));

        // update local storage
        if (this.calendarEvents.length === 0 && !this.allowRemoveAllCalendarEvents) return;
        this.allowRemoveAllCalendarEvents = false;
        const defaultEvents = this.getJSCalendarEvents();
        setDefaultCalendarEvents(defaultEvents, this.tripName);
    }

    @action
    setSidebarEvents(newSidebarEvents: Record<number,SidebarEvent[]>){
        this.sidebarEvents = newSidebarEvents;

        // update local storage
        setDefaultEvents(newSidebarEvents, this.tripName);
    }

    @action
    setCategories(newCategories: TriPlanCategory[]){
        this.categories = newCategories;

        // update local storage
        setDefaultCategories(this.categories, this.tripName);
    }

    @action
    setAllEvents(newAllEvents: SidebarEvent[] | CalendarEvent[]){

        if (containsDuplicates(newAllEvents.map((x) => x.id))){
            // alert("error! contains duplicates!");
            // debugger;
        }

        // debugger;
        this.allEvents = [...newAllEvents].map((x) => {
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

        // update local storage
        if (this.allEventsTripName === this.tripName) {
            setAllEvents(this.allEvents, this.tripName);
        }
    }

    @action
    clearCalendarEvents(){
        // add back to sidebar
        const newEvents = {...this.sidebarEvents};
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

    @action
    setCalendarLocalCode(newCalendarLocalCode: 'he' | 'en'){
        this.calendarLocalCode = newCalendarLocalCode;

        // change body class name
        this.initBodyLocaleClassName();

        // update local storage
        setDefaultCalendarLocale(this.calendarLocalCode, this.tripName);
    }

    @action
    setSearchValue(value: string) {
        this.searchValue = value;
    }

    @action
    setViewMode(newVideMode: ViewMode){
        this.viewMode = newVideMode;

        // show hide custom dates based on view
        this.initCustomDatesVisibilityBasedOnViewMode();
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
    openSidebarGroup(groupKey: string){
        this.openSidebarGroups.set(groupKey, 1);
    }

    @action
    toggleSidebarGroups(groupKey: string){
        if (this.openSidebarGroups.has(groupKey)){
            this.openSidebarGroups.delete(groupKey);
        } else {
            this.openSidebarGroup(groupKey);
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
        this.setCalendarLocalCode(calendarLocale || getDefaultCalendarLocale(name));
        this.setSidebarEvents(getDefaultEvents(name))
        this.setCalendarEvents(getDefaultCalendarEvents(name))
        this.customDateRange = getDefaultCustomDateRange(name);
        this.allEvents = getAllEvents(this,name);
        this.categories = getDefaultCategories(this, name);;
        this.allEventsTripName = name;

        runInAction(() => {
            const newMap = getDefaultDistanceResults(name);
            this.distanceResults = observable.map(newMap);
        })
    }

    @action
    setCustomDateRange(customDateRange: any){
        this.customDateRange = customDateRange;
    }

    @action
    toggleShowOnlyEventsWithNoLocation(){
        this.showOnlyEventsWithNoLocation = !this.showOnlyEventsWithNoLocation;
    }

    @action
    setShowOnlyEventsWithNoLocation(newVal: boolean) {
        this.showOnlyEventsWithNoLocation = newVal;
    }

    @action
    toggleShowOnlyEventsWithNoOpeningHours(){
        this.showOnlyEventsWithNoOpeningHours = !this.showOnlyEventsWithNoOpeningHours;
    }

    @action
    setShowOnlyEventsWithNoOpeningHours(newVal: boolean) {
        this.showOnlyEventsWithNoOpeningHours = newVal;
    }

    @action
    toggleShowOnlyEventsWithTodoComplete(){
        this.showOnlyEventsWithTodoComplete = !this.showOnlyEventsWithTodoComplete;
    }

    @action
    setShowOnlyEventsWithTodoComplete(newVal: boolean) {
        this.showOnlyEventsWithTodoComplete = newVal;
    }

    @action
    setDistance(key: string, value: DistanceResult){
        this.distanceResults.set(key, value);

        // update local storage
        setDefaultDistanceResults(this.distanceResults, this.tripName);
    }

    @action
    setModalSettings(newModalSettings: any){
        this.modalSettings = newModalSettings;
    }

    // --- private functions ----------------------------------------------------

    getJSCalendarEvents(): EventInput[] {
        return toJS(this.calendarEvents);
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

        storedEvent.extendedProps.location =
            Object.keys(newEvent).includes('location') ? newEvent.location : storedEvent.extendedProps.location ? storedEvent.extendedProps.location : storedEvent.location;
        storedEvent.location = storedEvent.extendedProps.location;

        storedEvent.extendedProps.openingHours =
            Object.keys(newEvent).includes('openingHours') ? newEvent.openingHours : storedEvent.extendedProps.openingHours ? storedEvent.extendedProps.openingHours : storedEvent.openingHours;
        storedEvent.openingHours = storedEvent.extendedProps.openingHours;

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
        storedEvent.location = Object.keys(newEvent).includes("location") ? newEvent.location : storedEvent.location;
        storedEvent.openingHours = Object.keys(newEvent).includes("openingHours") ? newEvent.openingHours : storedEvent.openingHours;
        if (newEvent.extendedProps){
            Object.keys(newEvent.extendedProps).forEach((key) => {
                storedEvent.extendedProps![key] = newEvent.extendedProps[key];
            });

            if (storedEvent.extendedProps.location){
                delete storedEvent.extendedProps.location;
            }

            // ?
            if (storedEvent.extendedProps.openingHours){
                delete storedEvent.extendedProps.openingHours;
            }
        }
    }

    getCurrentDirection() {
        if (this.calendarLocalCode === "he"){
            return "rtl";
        } else {
            return "ltr";
        }
    }

    initBodyLocaleClassName(){
        document.querySelector("body")!.classList.remove("rtl");
        document.querySelector("body")!.classList.remove("ltr");
        document.querySelector("body")!.classList.add(this.getCurrentDirection());
    }

    initCustomDatesVisibilityBasedOnViewMode(){
        setTimeout(() => {
            if (this.isListView){
                this.setHideCustomDates(true);
            } else {
                this.setHideCustomDates(false);
            }
        }, 300);
    }

    // --- public functions -----------------------------------------------------

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
}

export const eventStoreContext = createContext(new EventStore());

