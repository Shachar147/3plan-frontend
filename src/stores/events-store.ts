import { createContext, useState } from 'react';
import { action, computed, observable, runInAction, toJS } from 'mobx';
import { DateSelectArg, EventInput } from '@fullcalendar/react';
import { defaultDateRange, defaultLocalCode, LS_CALENDAR_LOCALE, LS_SIDEBAR_EVENTS } from '../utils/defaults';
import { CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory } from '../utils/interfaces';
import {
	GoogleTravelMode,
	ListViewSummaryMode,
	TripDataSource,
	TriplanEventPreferredTime,
	TriplanPriority,
	ViewMode,
} from '../utils/enums';
import { convertMsToHM, toDate } from '../utils/time-utils';

// @ts-ignore
import _ from 'lodash';
import { getCoordinatesRangeKey, lockOrderedEvents } from '../utils/utils';
import ReactModalService from '../services/react-modal-service';
import {
	AllEventsEvent,
	DataServices,
	DateRangeFormatted,
	LocaleCode,
	lsTripNameToTripName,
} from '../services/data-handlers/data-handler-base';
import ListViewService from '../services/list-view-service';
import { LocalStorageService } from '../services/data-handlers/local-storage-service';
import { DBService } from '../services/data-handlers/db-service';
import { getUser } from '../helpers/auth';

const defaultModalSettings = {
	show: false,
	title: '',
	content: undefined,
	onConfirm: () => {},
	onCancel: () => {
		// const eventStore = useContext(eventStoreContext);
		// runInAction(() => {
		//     eventStore.modalSettings.show = false;
		// })
	},
	// showClass: {
	// 	popup: 'animate__animated animate__fadeInDown'
	// },
	// hideClass: {
	// 	popup: 'animate__animated animate__fadeOutUp'
	// }
	customOverlayClass: 'z-index-99999999',
};

const minLoadTimeInSeconds = 1.5;

export class EventStore {
	categoryIdBuffer = 0;
	eventIdBuffer = 0;
	allowRemoveAllCalendarEvents = false;
	@observable weekendsVisible = true;
	@observable categories: TriPlanCategory[] = [];
	@observable sidebarEvents: Record<number, SidebarEvent[]> = {};
	@observable calendarEvents: EventInput[] = [];
	@observable allEvents: AllEventsEvent[] = []; // SidebarEvent[];
	@observable calendarLocalCode: LocaleCode = defaultLocalCode;
	@observable searchValue = '';
	@observable viewMode = ViewMode.combined;
	@observable mobileViewMode = DataServices.LocalStorageService.getLastViewMode(ViewMode.sidebar);
	@observable hideCustomDates = this.viewMode == ViewMode.calendar;
	@observable openCategories = observable.map<number, number>({});
	@observable openSidebarGroups = observable.map<string, number>({});
	@observable hideEmptyCategories: boolean = false;
	@observable tripName: string = '';
	@observable allEventsTripName: string = '';
	@observable customDateRange: DateRangeFormatted = defaultDateRange(); // -
	@observable showOnlyEventsWithNoLocation: boolean = false;
	@observable showOnlyEventsWithNoOpeningHours: boolean = false;
	@observable showOnlyEventsWithTodoComplete: boolean = false;
	@observable calculatingDistance = 0;
	@observable distanceResults = observable.map<string, DistanceResult>();
	@observable travelMode = GoogleTravelMode.DRIVING;
	@observable modalSettings = defaultModalSettings;
	@observable secondModalSettings = defaultModalSettings;
	@observable modalValuesRefs: any = {};
	@observable createMode: boolean = false;
	@observable listViewSummaryMode = ListViewSummaryMode.full;
	@observable dataService: LocalStorageService | DBService;
	modalValues: any = {};
	@observable isLoading = false;
	@observable isMobile = false;
	@observable isMenuOpen = false;
	@observable isSearchOpen = true;

	constructor() {
		let dataSourceName = LocalStorageService.getLastDataSource();
		if (!dataSourceName) {
			dataSourceName = getUser() ? TripDataSource.DB : TripDataSource.LOCAL;
		}
		if (dataSourceName === TripDataSource.DB && !getUser()) {
			dataSourceName = TripDataSource.LOCAL;
		}
		const defaultDataService = DataServices.LocalStorageService;
		this.dataService =
			dataSourceName == TripDataSource.LOCAL
				? DataServices.LocalStorageService
				: dataSourceName === TripDataSource.DB
				? DataServices.DBService
				: defaultDataService;

		// todo check if its not causing issues.
		// for the admin view
		this.setCalendarLocalCode(DataServices.LocalStorageService.getCalendarLocale());

		this.init();
	}

	@action
	async init() {
		const startTime = new Date().getTime();
		this.isLoading = true;
		if (this.dataService.getDataSourceName() == TripDataSource.LOCAL) {
			this.distanceResults = observable.map<string, DistanceResult>(
				DataServices.LocalStorageService.getDistanceResults()
			);
			this.initBodyLocaleClassName();
			this.initCustomDatesVisibilityBasedOnViewMode();
			// console.log("hey2!")
			this.isLoading = false;
		} else {
			const promises = [
				DataServices.DBService.getDistanceResults(),
				// new Promise((resolve, reject) => resolve(DataServices.DBService.getTripData(this.tripName)))
			];
			await Promise.all(promises)
				.then((results) => {
					runInAction(() => {
						const distanceResults = results[0] as any; // todo complete: once api implemented, verify its working
						this.distanceResults = observable.map<string, DistanceResult>(distanceResults);

						// const trip = results[1] as Trip;
						// const { categories, allEvents, sidebarEvents, calendarEvents, calendarLocale, dateRange } = trip;
						// this.categories = categories;
						// this.allEvents = allEvents;
						// this.sidebarEvents = sidebarEvents;
						// this.calendarEvents = calendarEvents;
						// this.calendarLocalCode = calendarLocale;
						// this.customDateRange = dateRange;
						// this.distanceResults = distanceResults;

						this.initBodyLocaleClassName();
						this.initCustomDatesVisibilityBasedOnViewMode();
					});
				})
				.finally(async () => {
					await this.waitIfNeeded(startTime);
					runInAction(() => {
						this.isLoading = false;
					});
				});
		}
	}

	checkIfEventHaveOpenTasks(event: SidebarEvent | CalendarEvent | AllEventsEvent | EventInput): boolean {
		let { title, description } = event;
		const { taskKeywords } = ListViewService._initSummaryConfiguration();
		const isTodoComplete = taskKeywords.find(
			(k: string) =>
				title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 ||
				description?.toLowerCase().indexOf(k.toLowerCase()) !== -1
		);
		return !!isTodoComplete;
	}

	// --- computed -------------------------------------------------------------

	reduceEventsEndDateToFitDistanceResult = (filteredEvents: EventInput[]): EventInput[] => {
		// only if not in filter mode - add driving instructions
		if (filteredEvents.length === this.calendarEvents.length) {
			filteredEvents = filteredEvents.sort((a, b) => {
				return toDate(a.start).getTime() - toDate(b.start).getTime();
			});

			const extractDetails = (event: EventInput) => {
				const location = event.location?.address;
				const title = event.title;
				const startDate = new Date(event.start!.toString());
				const endDate = new Date(event.end!.toString());
				const id = event.id!;
				const coordinate = {
					lat: event?.location?.latitude,
					lng: event?.location?.longitude,
				};

				return { id, title, location, startDate, endDate, coordinate };
			};

			const eachEventAndItsDirections: Record<string, any[]> = {};

			filteredEvents.forEach((event, index) => {
				let currentEvent = extractDetails(event);

				if (currentEvent.location && !event.allDay) {
					const nextEvents = filteredEvents
						.filter(
							(e, idx) =>
								new Date(e.start!.toString()).getTime() >= currentEvent.endDate.getTime() &&
								e.location &&
								!e.allDay &&
								e.id !== currentEvent.id
						)
						.sort((e) => {
							const details = extractDetails(e);
							const diff = details.startDate.getTime() - currentEvent.endDate.getTime();
							if (diff < 0) {
								return 99999999999;
							}
							return diff;
						});

					if (nextEvents && nextEvents.length) {
						let nextEventStart = nextEvents[0].start;
						let i = 0;
						while (
							i < nextEvents.length &&
							new Date(nextEventStart!.toString()).getTime() ===
								new Date(nextEvents[i].start!.toString()).getTime()
						) {
							const details = extractDetails(nextEvents[i]);
							if (
								details.startDate.toLocaleDateString() === currentEvent.endDate.toLocaleDateString() &&
								currentEvent.endDate.toLocaleTimeString() !== '12:00:00 AM'
							) {
								if (currentEvent?.location !== details?.location) {
									console.log(currentEvent.title, ' -> ', details.title);

									const key = currentEvent.id!;
									eachEventAndItsDirections[key] = eachEventAndItsDirections[key] || [];
									// eachEventAndItsDirections[key].push(details.title);

									const distanceKey = getCoordinatesRangeKey(
										this.travelMode,
										currentEvent.coordinate,
										details.coordinate
									);
									const distance = this.distanceResults.get(distanceKey);
									console.log(distance);
									eachEventAndItsDirections[key].push({
										target: {
											id: details.id,
											title: details.title,
											arrivalTime: details.startDate,
										},
										distanceKey,
										distance,
									});
								}
							} else {
								console.log('----------------------');
								break;
							}
							i++;
						}
					}
				}
			});
			// console.info(eachEventAndItsDirections);

			const uuidv4 = () => {
				// @ts-ignore
				return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
					(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
				);
			};

			const newEvents: EventInput[] = [];
			filteredEvents.forEach((e) => {
				// newEvents.push(e);
				if (eachEventAndItsDirections[e.id!]) {
					let minStartDate = new Date(new Date().setFullYear(3000));
					eachEventAndItsDirections[e.id!].forEach((obj: any) => {
						// debugger;

						// duration is not longer then 3 hours (probably flight) and more then 5 minutes
						if (
							obj.distance &&
							obj.distance.duration_value < 60 * 60 * 3 &&
							obj.distance.duration_value > 60 * 5
						) {
							// const priority = TriplanPriority.must;

							const endDate = new Date(obj.target.arrivalTime);
							const startDate = new Date(endDate.getTime() - obj.distance.duration_value * 1000);

							if (startDate.getTime() < minStartDate.getTime()) {
								minStartDate = startDate;
							}

							// todo complete - add a locked driving event here?
						}
					});

					const warn = minStartDate.getTime() - new Date(e.end!.toString()).getTime() <= 1000 * 60 * 30;
					const problem = new Date(e.end!.toString()).getTime() > minStartDate.getTime();

					if (problem || warn) {
						console.info(`reduced ${e.title} from ${e.end} to ${minStartDate.toString()}`);
						// e.end = minStartDate;
						if (problem) e.className += ' red-border';
						e.suggestedEndTime = minStartDate;
					}
				}

				newEvents.push(e);
			});

			return newEvents;
			// console.log(filteredEvents);
		}

		return filteredEvents;
	};

	@computed
	get filteredCalendarEvents(): EventInput[] {
		let filteredEvents = this.getJSCalendarEvents().filter(
			(event) =>
				event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1 &&
				(this.showOnlyEventsWithNoLocation ? !(event.location != undefined) : true) &&
				(this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined) : true) &&
				(this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true)
		);

		filteredEvents = this.reduceEventsEndDateToFitDistanceResult(filteredEvents);

		console.log(filteredEvents);

		return filteredEvents;
	}

	@computed
	get categoriesIcons(): Record<number, string> {
		const hash: Record<number, string> = {};
		this.categories.forEach((x) => (hash[x.id] = x.icon));
		return hash;
	}

	@computed
	get isListView() {
		return this.viewMode === ViewMode.list;
	}

	@computed
	get isMapView() {
		return this.viewMode === ViewMode.map;
	}

	@computed
	get isCalendarView() {
		return this.viewMode === ViewMode.calendar;
	}

	@computed
	get isCombinedView() {
		return this.viewMode === ViewMode.combined;
	}

	@computed
	get getSidebarEvents(): Record<number, SidebarEvent[]> {
		const toReturn: Record<number, SidebarEvent[]> = {};
		Object.keys(this.sidebarEvents).forEach((category) => {
			toReturn[parseInt(category)] = this.sidebarEvents[parseInt(category)]
				.map((x) => toJS(x))
				.filter(
					(event) =>
						event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1 &&
						(this.showOnlyEventsWithNoLocation ? !event.location : true) &&
						(this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined) : true) &&
						(this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true)
				);
		});
		return toReturn;
	}

	@computed
	get shouldRenderDescriptionOnListView() {
		return this.listViewSummaryMode !== ListViewSummaryMode.noDescriptions;
	}

	@computed
	get isRtl() {
		return this.calendarLocalCode === 'he';
	}

	@computed
	get allFilteredSidebarEvents() {
		return Object.values(this.getSidebarEvents).flat();
	}

	@computed
	get allSidebarEvents() {
		return Object.values(this.sidebarEvents).flat();
	}

	@computed
	get allEventsComputed() {
		return [...this.allSidebarEvents, ...this.getJSCalendarEvents()];
	}

	@computed
	get isFiltered(): boolean {
		return (
			!!this.searchValue?.length ||
			this.showOnlyEventsWithNoLocation ||
			this.showOnlyEventsWithNoOpeningHours ||
			this.showOnlyEventsWithTodoComplete
		);
	}

	// --- actions --------------------------------------------------------------

	@action
	setHideCustomDates(hide: boolean) {
		this.hideCustomDates = hide;
	}

	@action
	changeEvent(changeInfo: any) {
		const newEvent = changeInfo.event;
		const eventId = changeInfo.event.id;
		const storedEvent = this.calendarEvents.find((e) => e.id == eventId);
		if (storedEvent) {
			this.updateEvent(storedEvent, newEvent);

			this.setCalendarEvents([
				...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
				storedEvent,
			]);

			const findEvent = this.allEvents.find((event) => event.id.toString() === eventId.toString());
			if (findEvent) {
				this.updateEvent(findEvent, storedEvent);
			} else {
				console.error('event not found!');
			}

			this.setAllEvents([...this.allEvents]);

			return true;
		}
		return false;
	}

	@action
	addEvent(selectInfo: DateSelectArg, title: string | null) {
		this.calendarEvents.push({
			id: this.createEventId(),
			title: title || 'New Event',
			start: selectInfo.start,
			end: selectInfo.end,
			allDay: selectInfo.allDay,
		});
	}

	@action
	deleteEvent(eventId: string) {
		this.setCalendarEvents([
			...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
		]);
	}

	@action
	toggleWeekends() {
		this.weekendsVisible = !this.weekendsVisible;
	}

	@action
	setCalendarEvents(newCalenderEvents: EventInput[]) {
		this.calendarEvents = newCalenderEvents.filter((e) => Object.keys(e).includes('start'));

		// lock ordered events
		this.calendarEvents = this.calendarEvents.map((x: EventInput) => lockOrderedEvents(x));

		// update local storage
		if (this.calendarEvents.length === 0 && !this.allowRemoveAllCalendarEvents) return;
		this.allowRemoveAllCalendarEvents = false;
		const defaultEvents = this.getJSCalendarEvents() as CalendarEvent[]; // todo: make sure this conversion not fucking things up
		this.dataService.setCalendarEvents(defaultEvents, this.tripName);
	}

	@action
	setSidebarEvents(newSidebarEvents: Record<number, SidebarEvent[]>) {
		this.sidebarEvents = newSidebarEvents;
		// if (!this.showOnlyEventsWithNoOpeningHours && !this.searchValue && !this.showOnlyEventsWithTodoComplete && !this.showOnlyEventsWithTodoComplete)
		this.dataService.setSidebarEvents(newSidebarEvents, this.tripName);
	}

	@action
	setCategories(newCategories: TriPlanCategory[]) {
		this.categories = newCategories;
		this.dataService.setCategories(this.categories, this.tripName);
	}

	@action
	setAllEvents(newAllEvents: SidebarEvent[] | CalendarEvent[]) {
		if (this.tripName == '') return;

		// if (containsDuplicates(newAllEvents.map((x: SidebarEvent | CalendarEvent) => x.id))){
		//     // alert("error! contains duplicates!");
		//     // debugger;
		// }

		// debugger;
		this.allEvents = [...newAllEvents].map((x) => {
			if ('start' in x) {
				// @ts-ignore
				delete x.start;
			}
			if ('end' in x) {
				// @ts-ignore
				delete x.end;
			}
			return x;
		}) as AllEventsEvent[]; // todo check conversion

		// update local storage
		if (this.allEventsTripName === this.tripName) {
			this.dataService.setAllEvents(this.allEvents, this.tripName);
		}
	}

	@action
	clearCalendarEvents() {
		// add back to sidebar
		const newEvents = { ...this.sidebarEvents };
		const eventToCategory: any = {};
		const eventIdToEvent: any = {};
		this.allEvents.forEach((e) => {
			eventToCategory[e.id] = e.category;
			eventIdToEvent[e.id] = e;
		});

		this.calendarEvents.forEach((event) => {
			const eventId = event.id!;
			const categoryId = eventToCategory[eventId];
			const sidebarEvent = eventIdToEvent[eventId];
			delete sidebarEvent.start;
			delete sidebarEvent.end;

			sidebarEvent.priority = sidebarEvent.priority ?? TriplanPriority.unset;
			sidebarEvent.preferredTime = sidebarEvent.preferredTime ?? TriplanEventPreferredTime.unset;

			newEvents[categoryId] = newEvents[categoryId] || [];
			newEvents[categoryId].push(sidebarEvent);
		});

		this.setSidebarEvents(newEvents);
		this.allowRemoveAllCalendarEvents = true;
		this.setCalendarEvents([]);
	}

	@action
	setCalendarLocalCode(newCalendarLocalCode: LocaleCode) {
		this.calendarLocalCode = newCalendarLocalCode;

		// change body class name
		this.initBodyLocaleClassName();

		this.dataService.setCalendarLocale(this.calendarLocalCode, this.tripName);
	}

	@action
	setSearchValue(value: string) {
		this.searchValue = value;
	}

	@action
	setViewMode(newVideMode: ViewMode) {
		this.viewMode = newVideMode;

		// show hide custom dates based on view
		this.initCustomDatesVisibilityBasedOnViewMode();
	}

	@action
	setMobileViewMode(viewMode: ViewMode) {
		this.mobileViewMode = viewMode;
	}

	@action
	openCategory(categoryId: number) {
		this.openCategories.set(categoryId, 1);
	}

	@action
	toggleCategory(categoryId: number) {
		if (this.openCategories.has(categoryId)) {
			this.openCategories.delete(categoryId);
		} else {
			this.openCategory(categoryId);
		}
	}

	@action
	openSidebarGroup(groupKey: string) {
		this.openSidebarGroups.set(groupKey, 1);
	}

	@action
	toggleSidebarGroups(groupKey: string) {
		if (this.openSidebarGroups.has(groupKey)) {
			this.openSidebarGroups.delete(groupKey);
		} else {
			this.openSidebarGroup(groupKey);
		}
	}

	@action
	openAllCategories() {
		this.categories.forEach((category) => {
			this.openCategory(category.id);
		});
	}

	@action
	closeAllCategories() {
		this.openCategories = observable.map({});
	}

	@action
	setHideEmptyCategories(hide: boolean) {
		this.hideEmptyCategories = hide;
	}

	@action
	async setTripName(name: string, calendarLocale?: LocaleCode, createMode?: boolean) {
		const existingTrips = await this.dataService.getTrips(this);
		// console.log('existing', existingTrips, 'type', this.dataService.getDataSourceName());

		if (!createMode && !existingTrips.find((x) => x.name === name || x.name === lsTripNameToTripName(name))) {
			ReactModalService.internal.alertMessage(this, 'MODALS.ERROR.TITLE', 'MODALS.ERROR.TRIP_NOT_EXIST', 'error');
			setTimeout(() => {
				window.location.href = '/my-trips';
				localStorage.removeItem([LS_CALENDAR_LOCALE, name].join('-'));
				localStorage.removeItem([LS_SIDEBAR_EVENTS, name].join('-'));
			}, 3000);
		} else {
			LocalStorageService.setLastDataSource(this.dataService.getDataSourceName());

			this.tripName = name;
			this.createMode = !!createMode;

			const isLocal = this.dataService.getDataSourceName() === TripDataSource.LOCAL;

			let newDistanceResults: any;
			const startTime = new Date().getTime();
			if (isLocal) {
				this.setCalendarLocalCode(calendarLocale || DataServices.LocalStorageService.getCalendarLocale(name));
				this.setSidebarEvents(DataServices.LocalStorageService.getSidebarEvents(name));
				this.setCalendarEvents(DataServices.LocalStorageService.getCalendarEvents(name));
				this.customDateRange = DataServices.LocalStorageService.getDateRange(name);
				this.allEvents = DataServices.LocalStorageService.getAllEvents(this, name);
				this.categories = DataServices.LocalStorageService.getCategories(this, name);
				newDistanceResults = DataServices.LocalStorageService.getDistanceResults(name);
			} else {
				this.isLoading = true;
				const tripData = await DataServices.DBService.getTripData(name);
				newDistanceResults = await DataServices.DBService.getDistanceResults(name);
				runInAction(() => {
					const { categories, allEvents, sidebarEvents, calendarEvents, dateRange } = tripData;
					this.setCalendarLocalCode(calendarLocale || tripData.calendarLocale);
					this.setSidebarEvents(sidebarEvents);
					this.setCalendarEvents(calendarEvents);
					this.customDateRange = dateRange;
					this.allEvents = allEvents;
					this.categories = categories;
				});

				await this.waitIfNeeded(startTime);
				runInAction(() => {
					this.isLoading = false;
				});
			}

			this.allEventsTripName = name;
			runInAction(() => {
				this.distanceResults = observable.map(newDistanceResults);
			});
		}
	}

	@action
	setCustomDateRange(customDateRange: any) {
		this.customDateRange = customDateRange;
	}

	@action
	toggleShowOnlyEventsWithNoLocation() {
		this.showOnlyEventsWithNoLocation = !this.showOnlyEventsWithNoLocation;
	}

	@action
	setShowOnlyEventsWithNoLocation(newVal: boolean) {
		this.showOnlyEventsWithNoLocation = newVal;
	}

	@action
	toggleShowOnlyEventsWithNoOpeningHours() {
		this.showOnlyEventsWithNoOpeningHours = !this.showOnlyEventsWithNoOpeningHours;
	}

	@action
	setShowOnlyEventsWithNoOpeningHours(newVal: boolean) {
		this.showOnlyEventsWithNoOpeningHours = newVal;
	}

	@action
	toggleShowOnlyEventsWithTodoComplete() {
		this.showOnlyEventsWithTodoComplete = !this.showOnlyEventsWithTodoComplete;
	}

	@action
	setShowOnlyEventsWithTodoComplete(newVal: boolean) {
		this.showOnlyEventsWithTodoComplete = newVal;
	}

	@action
	setDistance(key: string, value: DistanceResult) {
		this.distanceResults.set(key, value);
		this.dataService.setDistanceResults(this.distanceResults, this.tripName);
	}

	@action
	setModalSettings(newModalSettings: any) {
		this.modalSettings = newModalSettings;
	}

	@action
	setSecondModalSettings(newModalSettings: any) {
		this.secondModalSettings = newModalSettings;
	}

	@action
	setListViewSummaryMode(newListViewSummaryMode: string) {
		this.listViewSummaryMode = newListViewSummaryMode as ListViewSummaryMode;
	}

	@action
	setIsMobile(isMobile: boolean) {
		this.isMobile = isMobile;
	}

	@action
	setIsMenuOpen(isOpen: boolean) {
		this.isMenuOpen = isOpen;
	}

	@action
	setIsSearchOpen(isOpen: boolean) {
		this.isSearchOpen = isOpen;
	}

	// --- private functions ----------------------------------------------------

	getJSCalendarEvents(): EventInput[] {
		return toJS(this.calendarEvents);
	}

	getJSSidebarEvents(): Record<number, SidebarEvent[]> {
		return _.cloneDeep(this.sidebarEvents);
		// return toJS(this.sidebarEvents);
	}

	updateEvent(storedEvent: SidebarEvent | EventInput | any, newEvent: SidebarEvent | EventInput | any) {
		storedEvent.title = newEvent.title;
		storedEvent.allDay = newEvent.allDay;
		storedEvent.start = newEvent.start ?? storedEvent.start;
		storedEvent.end = newEvent.end ?? storedEvent.end;
		storedEvent.icon = newEvent.icon ?? storedEvent.icon;
		storedEvent.priority = newEvent.priority ?? storedEvent.priority;
		storedEvent.description = newEvent.description ?? storedEvent.description;
		storedEvent.className = `priority-${storedEvent.priority}`;
		// storedEvent.className = newEvent.className || storedEvent.className;

		storedEvent.location = Object.keys(newEvent).includes('location') ? newEvent.location : storedEvent.location;

		storedEvent.openingHours = Object.keys(newEvent).includes('openingHours')
			? newEvent.openingHours
			: storedEvent.openingHours;

		// add column 7
		storedEvent.images = newEvent.images || storedEvent.images;

		storedEvent.moreInfo = newEvent.moreInfo ?? storedEvent.moreInfo;

		// @ts-ignore
		const millisecondsDiff = storedEvent.end - storedEvent.start;
		if (millisecondsDiff > 0) {
			storedEvent.duration = convertMsToHM(millisecondsDiff);
		}
	}

	updateSidebarEvent(storedEvent: SidebarEvent, newEvent: SidebarEvent) {
		storedEvent.title = newEvent.title;
		storedEvent.icon = newEvent.icon ?? storedEvent.icon;
		storedEvent.duration = newEvent.duration ?? storedEvent.duration;
		storedEvent.priority = newEvent.priority ?? storedEvent.priority;
		storedEvent.preferredTime = newEvent.preferredTime ?? storedEvent.preferredTime;
		storedEvent.description = newEvent.description ?? storedEvent.description;
		storedEvent.location = Object.keys(newEvent).includes('location') ? newEvent.location : storedEvent.location;
		storedEvent.openingHours = Object.keys(newEvent).includes('openingHours')
			? newEvent.openingHours
			: storedEvent.openingHours;
		storedEvent.images = newEvent.images; // add column 6
		storedEvent.moreInfo = newEvent.moreInfo;
	}

	getCurrentDirection() {
		if (this.calendarLocalCode === 'he') {
			return 'rtl';
		} else {
			return 'ltr';
		}
	}

	initBodyLocaleClassName() {
		document.querySelector('body')!.classList.remove('rtl');
		document.querySelector('body')!.classList.remove('ltr');
		document.querySelector('body')!.classList.add(this.getCurrentDirection());
	}

	initCustomDatesVisibilityBasedOnViewMode() {
		setTimeout(() => {
			if (this.isListView) {
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
		if (this.categories.length > 0) {
			maxCategory = Math.max(...this.categories.map((x) => x.id));
		}
		return maxCategory + 1 + this.categoryIdBuffer;
	}

	async waitIfNeeded(startTime: number) {
		const gap = minLoadTimeInSeconds * 1000 - (new Date().getTime() - startTime);
		// console.log('gap in milliseconds: ', gap);
		if (gap > 0) {
			await new Promise((r) => setTimeout(r, gap));
		}
	}
}

export const eventStoreContext = createContext(new EventStore());
