import React, { createContext } from 'react';
import { action, computed, observable, runInAction, toJS } from 'mobx';
import { EventInput } from '@fullcalendar/react';
import { defaultDateRange, defaultLocalCode, LS_CALENDAR_LOCALE, LS_SIDEBAR_EVENTS } from '../utils/defaults';
import {
	CalendarEvent,
	Coordinate,
	DistanceResult,
	SidebarEvent,
	TripActions,
	TriPlanCategory,
	TriplanTask,
} from '../utils/interfaces';
import {
	getEnumKey,
	GoogleTravelMode,
	ListViewSummaryMode,
	MapViewMode,
	TripDataSource,
	TriplanEventPreferredTime,
	TriplanPriority,
	ViewMode,
} from '../utils/enums';
import { addDays, convertMsToHM, formatDate, getEndDate, toDate } from '../utils/time-utils';

// @ts-ignore
import _ from 'lodash';
import { coordinateToString, generate_uuidv4, getCoordinatesRangeKey, lockEvents } from '../utils/utils';
import ReactModalService from '../services/react-modal-service';
import {
	AllEventsEvent,
	DataServices,
	DateRangeFormatted,
	LocaleCode,
	lsTripNameToTripName,
	Trip,
} from '../services/data-handlers/data-handler-base';
import ListViewService from '../services/list-view-service';
import { LocalStorageService } from '../services/data-handlers/local-storage-service';
import { DBService } from '../services/data-handlers/db-service';
import { getUser } from '../helpers/auth';
import { SidebarGroups } from '../components/triplan-sidebar/triplan-sidebar';
import { apiGetNew } from '../helpers/api';
import TranslateService from '../services/translate-service';
import { MapContainerRef } from '../components/map-container/map-container';
import LogHistoryService from '../services/data-handlers/log-history-service';

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
	@observable calendarEvents: CalendarEvent[] = []; // EventInput[]
	@observable allEvents: AllEventsEvent[] = []; // SidebarEvent[];
	@observable calendarLocalCode: LocaleCode = defaultLocalCode;
	@observable searchValue = '';
	@observable sidebarSearchValue = '';
	@observable viewMode = DataServices.LocalStorageService.getLastViewMode(ViewMode.map); // ViewMode.combined
	@observable mobileViewMode = DataServices.LocalStorageService.getLastMobileViewMode(ViewMode.sidebar);
	@observable hideCustomDates = this.viewMode == ViewMode.calendar;
	@observable openCategories = observable.map<number, number>({});
	@observable openSidebarGroups = observable.map<string, number>({});
	@observable hideEmptyCategories: boolean = false;
	@observable tripName: string = '';
	@observable tripId: number = 0;
	@observable isSharedTrip: boolean = false;
	@observable canRead: boolean = true;
	@observable canWrite: boolean = true;
	@observable allEventsTripName: string = '';
	@observable customDateRange: DateRangeFormatted = defaultDateRange(); // -
	@observable showOnlyEventsWithNoLocation: boolean = false;
	@observable showOnlyEventsWithNoOpeningHours: boolean = false;
	@observable showOnlyEventsWithTodoComplete: boolean = false;
	@observable showOnlyEventsWithDistanceProblems: boolean = false;
	@observable showOnlyEventsWithOpeningHoursProblems: boolean = false;
	@observable calculatingDistance = 0;
	@observable distanceResults = observable.map<string, DistanceResult>();
	@observable travelMode = GoogleTravelMode.DRIVING;
	@observable modalSettings = defaultModalSettings;
	@observable secondModalSettings = defaultModalSettings;
	@observable modalValuesRefs: any = {};
	@observable createMode: boolean = false;
	@observable listViewSummaryMode = ListViewSummaryMode.noDescriptions;
	@observable listViewShowNavigateTo = false;
	@observable listViewShowDaysNavigator = false;
	@observable dataService: LocalStorageService | DBService;
	@observable modalValues: any = {};
	@observable isLoading = false;
	@observable isLoadingTrip = false; // is loading trip data right now
	@observable isMobile = false;
	@observable isMenuOpen = false;
	@observable isSearchOpen = true;
	@observable didChangeSearchOpenState = false;

	@observable forceUpdate = 0;
	@observable forceSetDraggable = 0;

	// map filters
	@observable mapFiltersVisible: boolean = false;
	@observable filterOutPriorities = observable.map({});
	@observable hideScheduled: boolean = false;
	@observable hideUnScheduled: boolean = false;
	@observable mapViewMode: MapViewMode = MapViewMode.CATEGORIES_AND_PRIORITIES;
	@observable mapViewDayFilter: string | undefined;

	// add side bar modal
	@observable isModalMinimized: boolean = true;

	// distances
	@observable distanceModalOpened: boolean = false;
	@observable taskId: number | undefined;
	@observable checkTaskStatus: NodeJS.Timeout | undefined; // interval
	@observable taskData: any = { progress: 0 };
	@observable eventsWithDistanceProblems: any[] = [];
	@observable eventsWithOpeningHoursProblems: any[] = [];
	@observable selectedEventForNearBy: CalendarEvent | SidebarEvent | undefined = undefined;
	@observable selectedEventNearByPlaces: any[] | undefined = undefined;
	@observable distanceSectionAutoOpened: boolean = false;
	@observable closedDistanceAutoOpened: boolean = false; // indicates user closing auto-opened distance section

	// for show on map link
	@observable mapContainerRef: React.MutableRefObject<MapContainerRef> | null = null;
	showEventOnMap: number | null = null;

	@observable isTripLocked: boolean = false;

	toastrClearTimeout: NodeJS.Timeout | null = null;
	@observable toastrSettings: {
		show: boolean;
		message: string;
		duration: number;
		icon?: string;
		key?: string;
	} = {
		show: false,
		message: '',
		icon: 'icons-8-done.gif',
		duration: 3000,
		key: generate_uuidv4(),
	};

	@observable mostAvailableSlotInView: { start: Date | null; end: Date | null } | null = null;
	@observable isSwitchDaysEnabled: boolean = true;
	@observable activeStart: Date | null = null;
	@observable activeEnd: Date | null = null;
	@observable currentStart: Date | null = null;
	@observable currentEnd: Date | null = null;
	@observable calendarViewType: string | null = null;

	@observable isSidebarMinimized: boolean = false;

	@observable reloadCollaboratorsCounter: number = 0;
	@observable reloadHistoryCounter: number = 0;

	@observable tasks: TriplanTask[] = [];
	@observable tasksSearchValue = '';
	@observable hideDoneTasks: boolean = false;
	@observable groupTasksByEvent: boolean = false;

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
			// disabled on local
			this.distanceResults = observable.map<string, DistanceResult>();
			this.initBodyLocaleClassName();
			this.initCustomDatesVisibilityBasedOnViewMode();
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
		// let { title, description } = event;
		// const { taskKeywords } = ListViewService._initSummaryConfiguration();
		// const isTodoComplete = taskKeywords.find(
		// 	(k: string) =>
		// 		title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 ||
		// 		(description && description.toLowerCase().indexOf(k.toLowerCase()) !== -1)
		// );
		//
		// return !!isTodoComplete;
		const { id: eventId } = event;
		return !!this.tasks.find((t) => t.eventId == eventId);
	}

	@action
	async initTasks(tripId: number) {
		const data = await (this.dataService as DBService).getTasks(tripId);
		this.tasks = data.data;
	}

	@action
	async reloadTasks() {
		if (this.tripId) {
			this.initTasks(this.tripId);
		}
	}

	// --- computed -------------------------------------------------------------

	addSuggestedLeavingTime = (filteredEvents: CalendarEvent[], eventStore: EventStore): CalendarEvent[] => {
		if (this.showOnlyEventsWithDistanceProblems) {
			return filteredEvents.map((x) => {
				x.suggestedEndTime = this.eventsWithDistanceProblems.find((e) => e.id == x.id)?.suggestedEndTime;
				x.className = x.className || '';
				x.className = x.className.replaceAll(' red-background', '') + ' red-background';
				return x;
			});
		}

		if (this.showOnlyEventsWithOpeningHoursProblems) {
			return filteredEvents.map((x) => {
				x.timingError = this.eventsWithOpeningHoursProblems.find((e) => e.id == x.id)?.timingError;
				x.className = x.className || '';
				x.className = x.className.replaceAll(' red-background', '') + ' red-background';
				return x;
			});
		}

		const eventsWithOpeningHoursProblems: any[] = [];
		const eventsWithWarnings: any[] = [];
		const eventsWithProblems: any[] = [];

		// only if not in filter mode - add driving instructions
		if (filteredEvents.length === this.calendarEvents.length) {
			filteredEvents = filteredEvents.sort((a, b) => {
				return toDate(a.start).getTime() - toDate(b.start).getTime();
			});

			const extractDetails = (event: CalendarEvent) => {
				const location = event.location?.address;
				const title = event.title;

				// not sure how we got into this siutation need to check
				if (event.start && event.duration && !event.end) {
					// @ts-ignore
					event.end = getEndDate(event.start, event.duration);
				}
				const startDate = new Date(event.start!.toString());
				const endDate = event.allDay
					? addDays(new Date(event.start!.toString()), 1)
					: new Date(event.end!.toString());
				const id = event.id!;

				const coordinate: Coordinate | undefined =
					event.location?.latitude && event.location?.longitude
						? {
								lat: event.location.latitude,
								lng: event.location.longitude,
						  }
						: undefined;

				return { id, title, location, startDate, endDate, coordinate };
			};

			const eachEventAndItsDirections: Record<string, any[]> = {};

			filteredEvents.forEach((event, index) => {
				let currentEvent = extractDetails(event);

				if (currentEvent.coordinate && !event.allDay) {
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
								currentEvent.endDate.toLocaleTimeString() !== '12:00:00 AM' &&
								details.coordinate
							) {
								if (currentEvent?.location !== details?.location) {
									// console.log(currentEvent.title, ' -> ', details.title);

									const key = currentEvent.id!;
									eachEventAndItsDirections[key] = eachEventAndItsDirections[key] || [];
									// eachEventAndItsDirections[key].push(details.title);

									const distanceKey = getCoordinatesRangeKey(
										this.travelMode,
										currentEvent.coordinate,
										details.coordinate
									);
									const distance = this.distanceResults.get(distanceKey);
									// console.log(distance);
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
								break;
							}
							i++;
						}
					}
				}
			});
			// console.info(eachEventAndItsDirections);

			const newEvents: CalendarEvent[] = [];
			filteredEvents.forEach((e) => {
				// check opening hours
				let isValidToOpenHours = true;
				let errorReason = '';
				if (e.openingHours) {
					if (
						!(
							Object.keys(e.openingHours).length == 1 &&
							// @ts-ignore
							e.openingHours['SUNDAY'] &&
							// @ts-ignore
							e.openingHours['SUNDAY']['start'] == '00:00'
						)
					) {
						const eventStartDate = new Date(e.start);
						const eventEndDate = new Date(e.end);
						const options = { weekday: 'long' };

						// @ts-ignore
						const dayOfWeek = eventStartDate.toLocaleDateString('en-US', options);

						// @ts-ignore
						const a = e.openingHours['SUNDAY'];
						const b = Array.isArray(a) ? a[0] : a;
						const is247 = b && b.start == '00:00' && b.end == '00:00';

						if (!is247) {
							// @ts-ignore
							let openingHoursOnThisDay = e.openingHours[dayOfWeek.toUpperCase()];

							if (!openingHoursOnThisDay) {
								isValidToOpenHours = false;
								errorReason = TranslateService.translate(eventStore, 'CLOSED_ON_THIS_DAY');
							} else {
								// old opening hours support
								if (!Array.isArray(openingHoursOnThisDay)) {
									openingHoursOnThisDay = [openingHoursOnThisDay];
								}

								let isWithinHours = false;
								// check if there's a valid period on that day
								openingHoursOnThisDay.forEach((period: { start: string; end: string }) => {
									if (!isWithinHours) {
										// dtstart
										const startTimeString = period.start;
										let [hours, minutes] = startTimeString.split(':');
										const dtStart = new Date(e.start);
										dtStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

										// dt end
										const endTimeString = period.end;
										[hours, minutes] = endTimeString.split(':');
										const dtEnd = new Date(e.end);
										dtEnd.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
										if (dtEnd.getTime() < dtStart.getTime()) {
											dtEnd.setDate(dtEnd.getDate() + 1);
										}

										// is invalid due to start time
										if (dtStart.getTime() > eventStartDate.getTime()) {
											isWithinHours = false;
											if (openingHoursOnThisDay.length == 1) {
												errorReason = TranslateService.translate(
													eventStore,
													'INVALID_START_HOUR',
													{
														X: startTimeString,
													}
												);
											} else {
												errorReason = TranslateService.translate(eventStore, 'INVALID_HOURS');
											}
										}
										// is invalid due to end time
										else if (eventEndDate.getTime() > dtEnd.getTime()) {
											isWithinHours = false;

											if (openingHoursOnThisDay.length == 1) {
												errorReason = TranslateService.translate(
													eventStore,
													'INVALID_END_HOUR',
													{
														X: endTimeString,
													}
												);
											} else {
												errorReason = TranslateService.translate(eventStore, 'INVALID_HOURS');
											}
										}
										// means it's valid
										else {
											isWithinHours = true;
											errorReason = '';
										}
									}
								});
							}
						}

						// console.log({
						// 	isValidToOpenHours,
						// 	start: e.start,
						// 	end: e.end,
						// 	openingHours: openingHoursOnThisDay,
						// 	errorReason,
						// });
					}

					if (errorReason !== '') {
						// console.log({ title: e.title, errorReason, start: e.start, end: e.end });
						e.timingError = errorReason;
						e.className = e.className || '';
						e.className = e.className.replaceAll(' red-background', '') + ' red-background';
						e.className += ' red-background';
						console.log({ id: e.id, timingError: errorReason });
						eventsWithOpeningHoursProblems.push({ id: e.id, timingError: errorReason });
					} else {
						e.timingError = '';
					}
				}

				// newEvents.push(e);
				if (eachEventAndItsDirections[e.id!]) {
					let minStartDate = new Date(new Date().setFullYear(3000));
					eachEventAndItsDirections[e.id!].forEach((obj: any) => {
						// duration is not longer then 3 hours (probably flight) and more then 5 minutes
						if (
							obj.distance &&
							obj.distance.duration_value < 60 * 60 * 3 &&
							obj.distance.duration_value > 60 * 5
						) {
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
						if (problem) {
							e.className = e.className || '';
							e.className = e.className.replaceAll(' red-background', '') + ' red-background';
							e.className += ' red-background';
							eventsWithProblems.push({ id: e.id, suggestedEndTime: minStartDate });
						} else {
							eventsWithWarnings.push({ id: e.id, suggestedEndTime: minStartDate });
						}
						e.suggestedEndTime = minStartDate;
					}
				}

				newEvents.push(e);
			});

			runInAction(() => {
				this.eventsWithDistanceProblems = eventsWithProblems;
				this.eventsWithOpeningHoursProblems = eventsWithOpeningHoursProblems;
			});

			return newEvents;
		}

		return filteredEvents;
	};

	@computed
	get filteredCalendarEvents(): CalendarEvent[] {
		let filteredEvents = this.getJSCalendarEvents().filter(
			(event) =>
				(event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1 ||
					(event.description &&
						event.description.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1) ||
					(event.location &&
						event.location.address &&
						event.location.address.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1)) &&
				(this.showOnlyEventsWithNoLocation ? !(event.location != undefined) : true) &&
				(this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined) : true) &&
				(this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true) &&
				(this.showOnlyEventsWithDistanceProblems
					? !!this.eventsWithDistanceProblems.find((x) => event.id == x.id)
					: true) &&
				(this.showOnlyEventsWithOpeningHoursProblems
					? !!this.eventsWithOpeningHoursProblems.find((x) => event.id == x.id)
					: true)
		);

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
		return this.isMobile ? this.mobileViewMode === ViewMode.list : this.viewMode === ViewMode.list;
	}

	@computed
	get isMapView() {
		return this.isMobile ? this.mobileViewMode === ViewMode.map : this.viewMode === ViewMode.map;
	}

	@computed
	get isCalendarView() {
		return this.isMobile ? this.mobileViewMode === ViewMode.calendar : this.viewMode === ViewMode.calendar;
	}

	@computed
	get isCombinedView() {
		return this.isMobile ? false : this.viewMode === ViewMode.combined;
	}

	@computed
	get isHebrew() {
		return this.calendarLocalCode === 'he';
	}

	@computed
	get isEnglish() {
		return this.calendarLocalCode === 'en';
	}

	_isEventMatchingSearch(event: SidebarEvent, searchValue: string) {
		// priority search - if user typed a name of priority, search by it.
		let prioritySearch = undefined;
		const priorities = Object.keys(TriplanPriority).filter((x) => Number.isNaN(Number(x)));
		priorities.forEach((priority) => {
			if (
				searchValue.toLowerCase() === priority ||
				searchValue.toLowerCase() === TranslateService.translate(this, priority)
			) {
				prioritySearch = priority;
			}
		});
		if (prioritySearch) {
			// @ts-ignore
			return event.priority == TriplanPriority[prioritySearch];
		}

		// preferred time search - if user typed a name of preferred time, search by it.
		let preferredTimeSearch = undefined;
		const preferredTimes = Object.keys(TriplanEventPreferredTime).filter((x) => Number.isNaN(Number(x)));
		preferredTimes.forEach((preferredTime) => {
			if (
				searchValue.toLowerCase() === preferredTime ||
				searchValue.toLowerCase() === TranslateService.translate(this, preferredTime)
			) {
				preferredTimeSearch = preferredTime;
			}
		});
		if (preferredTimeSearch) {
			// @ts-ignore
			return event.preferredTime == TriplanEventPreferredTime[preferredTimeSearch];
		}

		return (
			event.title!.toLowerCase().indexOf(searchValue.toLowerCase()) > -1 ||
			(event.description && event.description.toLowerCase().indexOf(searchValue.toLowerCase()) > -1) ||
			(event.location &&
				event.location.address &&
				event.location.address.toLowerCase().indexOf(searchValue.toLowerCase()) > -1)
		);
	}

	@computed
	get getSidebarEvents(): Record<number, SidebarEvent[]> {
		const toReturn: Record<number, SidebarEvent[]> = {};
		Object.keys(this.sidebarEvents).forEach((category) => {
			toReturn[parseInt(category)] = this.sidebarEvents[parseInt(category)]
				.map((x) => toJS(x))
				.filter(
					(event) =>
						this._isEventMatchingSearch(event, this.searchValue) &&
						this._isEventMatchingSearch(event, this.sidebarSearchValue) &&
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
	get allSidebarEvents(): SidebarEvent[] {
		return Object.values(this.sidebarEvents).flat();
	}

	@computed
	get allEventsComputed() {
		return [...this.allSidebarEvents, ...this.getJSCalendarEvents()];
	}

	@computed
	get allEventsFilteredComputed() {
		return this.allEventsComputed.filter((event) => {
			const calendarEvent = this.calendarEvents.find((c) => c.id == event.id);

			return (
				(event.title!.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1 ||
					(event.description &&
						event.description.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1) ||
					(event.location &&
						event.location.address &&
						event.location.address.toLowerCase().indexOf(this.searchValue.toLowerCase()) > -1)) &&
				(this.showOnlyEventsWithNoLocation ? !event.location : true) &&
				(this.showOnlyEventsWithNoOpeningHours ? !(event.openingHours != undefined) : true) &&
				(this.showOnlyEventsWithTodoComplete ? this.checkIfEventHaveOpenTasks(event) : true) &&
				!this.filterOutPriorities.get(getEnumKey(TriplanPriority, event.priority)) &&
				(this.hideScheduled ? !this.calendarEvents.find((x) => x.id == event.id) : true) &&
				(this.hideUnScheduled ? !!this.calendarEvents.find((x) => x.id == event.id) : true) &&
				(this.mapViewMode === MapViewMode.CHRONOLOGICAL_ORDER && this.mapViewDayFilter
					? !calendarEvent || calendarEvent.allDay || !calendarEvent.start
						? false
						: new Date(calendarEvent.start).toLocaleDateString() === this.mapViewDayFilter
					: true)
			);
		});
	}

	@computed
	get isFiltered(): boolean {
		return (
			!!this.searchValue?.length ||
			!!this.sidebarSearchValue?.length ||
			this.showOnlyEventsWithNoLocation ||
			this.showOnlyEventsWithNoOpeningHours ||
			this.showOnlyEventsWithTodoComplete
			// for now it affects only map. todo complete - add it to sidebar filters as well both in UI and on logic
			// || !!Array.from(this.filterOutPriorities.values()).length
			// || this.hideScheduled
			// || this.hideUnScheduled
		);
	}

	@computed
	get scheduledDaysNames(): string[] {
		return Array.from(new Set(this.calendarEvents.map((x) => new Date(x.start).setHours(0, 0, 0, 0))))
			.sort((a, b) => b - a)
			.map((x) => new Date(x).toLocaleDateString());
	}

	getEventIndexInCalendarByDay(event: CalendarEvent, day: string | undefined = this.mapViewDayFilter) {
		if (!this.mapViewDayFilter) {
			console.error(`wrong use of getEventIndexInCalendarByDay - day not passed`);
			return -1;
		}
		const calendarEventsInDay = this.calendarEvents
			.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
			.filter(
				(e) =>
					new Date(e.start).toLocaleDateString() === day &&
					e.location?.latitude &&
					e.location?.longitude &&
					!e.allDay
			);
		return calendarEventsInDay.findIndex((e) => e.id == event.id);
	}

	@computed
	get allEventsLocations(): Coordinate[] {
		const allLocations = this.allEventsLocationsWithDuplicates;

		// if there are multiple evnets with same location but different name, take only one of them.
		const filtered: Record<string, any> = {};
		allLocations.forEach((x) => {
			const key = JSON.stringify({ lat: x.lat, lng: x.lng });
			filtered[key] = x;
		});

		return Object.values(filtered);
	}

	@computed
	get allEventsLocationsWithDuplicates(): { lat: number; lng: number; eventName: string }[] {
		// returns all locations with duplicates (if names are different)
		return Array.from(
			new Set(
				this.allEventsComputed
					.filter((x) => x.location?.latitude && x.location?.longitude)
					.map((x) =>
						JSON.stringify({
							lat: x.location?.latitude,
							lng: x.location?.longitude,
							eventName: x.title,
						})
					)
			)
		).map((x) => JSON.parse(x));
	}

	@computed
	get tripTotalDaysNum() {
		return (
			parseInt(
				(
					(new Date(this.customDateRange.end).getTime() - new Date(this.customDateRange.start).getTime()) /
					86400000
				).toString()
			) + 1
		);
	}

	@computed
	get tripDaysArray() {
		const arr = [];
		let currDt = new Date(this.customDateRange.start);
		while (currDt.getTime() <= new Date(this.customDateRange.end).getTime()) {
			arr.push(formatDate(currDt));
			currDt = addDays(currDt, 1);
		}
		return arr;
	}

	@computed
	get tripTotalActiveDaysNum() {
		if (!this.activeStart || !this.activeEnd) {
			return 0;
		}
		return parseInt(((this.activeEnd.getTime() - this.activeStart.getTime()) / 86400000).toString()); // + 1;
	}

	@computed
	get tripTotalCurrentDaysNum() {
		if (!this.currentStart || !this.currentEnd) {
			return 0;
		}
		return parseInt(((this.currentEnd.getTime() - this.currentStart.getTime()) / 86400000).toString()); // + 1
	}

	// --- actions --------------------------------------------------------------
	@action
	setHideCustomDates(hide: boolean) {
		this.hideCustomDates = hide;
	}

	@action
	async changeEvent(changeInfo: any, logHistoryData?: any) {
		const eventId = changeInfo.event.id;
		const storedEvent = this.calendarEvents.find((e) => e.id == eventId);

		if (storedEvent) {
			const newEvent = this.updateEvent(storedEvent, { ...changeInfo.event });

			await this.setCalendarEvents([
				...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
				newEvent,
			]);

			LogHistoryService.logHistoryOnEventChange(this, this.tripId, logHistoryData, eventId, storedEvent.title);

			return true;
		}
		return false;
	}

	@action
	deleteEvent(eventId: string) {
		return this.setCalendarEvents([
			...this.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
		]);
	}

	@action
	toggleWeekends() {
		this.weekendsVisible = !this.weekendsVisible;
	}

	@action
	async setCalendarEvents(newCalenderEvents: CalendarEvent[], updateServer: boolean = true) {
		this.calendarEvents = newCalenderEvents.filter((e) => Object.keys(e).includes('start'));

		// lock ordered events
		this.calendarEvents = this.calendarEvents.map((x: CalendarEvent) => lockEvents(this, x));

		// update local storage
		if (this.calendarEvents.length === 0 && !this.allowRemoveAllCalendarEvents) return;
		this.allowRemoveAllCalendarEvents = false;
		const defaultEvents = this.getJSCalendarEvents() as CalendarEvent[]; // todo: make sure this conversion not fucking things up

		if (updateServer) {
			return this.dataService.setCalendarEvents(defaultEvents, this.tripName);
		}
		return true;
	}

	@action
	async setSidebarEvents(newSidebarEvents: Record<number, SidebarEvent[]>, updateServer: boolean = true) {
		this.sidebarEvents = newSidebarEvents;
		if (updateServer) {
			return this.dataService.setSidebarEvents(newSidebarEvents, this.tripName);
		}
		return true;
	}

	@action
	setCategories(newCategories: TriPlanCategory[], sort: boolean = true) {
		if (sort) {
			const newCategoriesSorted = newCategories.sort((a, b) => a.id - b.id);
			this.categories = newCategoriesSorted;
			return this.dataService.setCategories(newCategoriesSorted, this.tripName);
		} else {
			this.categories = newCategories;
			return this.dataService.setCategories(newCategories, this.tripName);
		}
	}

	@action
	async setAllEvents(newAllEvents: SidebarEvent[] | CalendarEvent[]) {
		// deprecated
		// if (this.tripName == '') return;
		//
		// // if (containsDuplicates(newAllEvents.map((x: SidebarEvent | CalendarEvent) => x.id))){
		// //     // alert("error! contains duplicates!");
		// // }
		//
		// this.allEvents = [...newAllEvents].map((x) => {
		// 	if ('start' in x) {
		// 		// @ts-ignore
		// 		delete x.start;
		// 	}
		// 	if ('end' in x) {
		// 		// @ts-ignore
		// 		delete x.end;
		// 	}
		// 	return x;
		// }) as AllEventsEvent[]; // todo check conversion
		//
		// // update local storage
		// if (this.allEventsTripName === this.tripName) {
		// 	return this.dataService.setAllEvents(this.allEvents, this.tripName);
		// }
		// return Promise.resolve();
	}

	@action
	clearCalendarEvents() {
		// add back to sidebar
		const newEvents = { ...this.sidebarEvents };
		const eventToCategory: any = {};
		const eventIdToEvent: any = {};
		this.allEventsComputed.forEach((e) => {
			eventToCategory[e.id] = e.category;
			eventIdToEvent[e.id] = e;
		});

		const count = this.calendarEvents.length;

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

		const promise1 = this.setSidebarEvents(newEvents);
		this.allowRemoveAllCalendarEvents = true;
		const promise2 = this.setCalendarEvents([]);

		return Promise.all([promise1, promise2]).then(() => {
			LogHistoryService.logHistory(this, TripActions.clearedCalendar, {
				count,
			});
		});
	}

	@action
	setCalendarLocalCode(newCalendarLocalCode: LocaleCode, updateServer: boolean = true) {
		this.calendarLocalCode = newCalendarLocalCode;

		// change body class name
		this.initBodyLocaleClassName();

		DataServices.LocalStorageService.setCalendarLocale(newCalendarLocalCode);
		if (updateServer) {
			return this.dataService.setCalendarLocale(this.calendarLocalCode, this.tripName);
		}
		return true;
	}

	@action
	setSearchValue(value: string) {
		this.searchValue = value;
	}

	@action
	setSidebarSearchValue(value: string) {
		this.sidebarSearchValue = value;
	}

	@action
	setViewMode(newViewMode: ViewMode) {
		this.viewMode = newViewMode;

		// show hide custom dates based on view
		this.initCustomDatesVisibilityBasedOnViewMode();

		DataServices.LocalStorageService.setLastViewMode(newViewMode);
	}

	@action
	setMobileViewMode(viewMode: ViewMode) {
		this.mobileViewMode = viewMode;
		if (viewMode == ViewMode.list) {
			document.getElementById('root')!.classList.add('overflow-hidden');
		} else {
			document.getElementById('root')!.classList.remove('overflow-hidden');
		}
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
	autoOpenDistanceSidebarGroup() {
		// disable this feature for now, it's annoying.
		return;

		if (this.closedDistanceAutoOpened) {
			return;
		}
		this.openSidebarGroup(SidebarGroups.DISTANCES);
		this.openSidebarGroup(SidebarGroups.DISTANCES_NEARBY);
		this.distanceSectionAutoOpened = true;
	}

	@action
	toggleSidebarGroups(groupKey: string) {
		if (this.openSidebarGroups.has(groupKey)) {
			// indicate user close it after it's automatically opened.
			if (
				this.distanceSectionAutoOpened &&
				[SidebarGroups.DISTANCES, SidebarGroups.DISTANCES_NEARBY].includes(groupKey as SidebarGroups)
			) {
				this.closedDistanceAutoOpened = true;
			}

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

	async verifyUserHavePermissionsOnTrip(name: string, createMode?: boolean) {
		const { trips, sharedTrips } = await this.dataService.getTripsShort(this);
		const existingTrips = [...trips, ...sharedTrips];

		if (!createMode && !existingTrips.find((x) => x.name === name || x.name === lsTripNameToTripName(name))) {
			ReactModalService.internal.alertMessage(
				this,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.TRIP_NOT_EXIST_MAYBE_SHARED',
				'error'
			);
			setTimeout(() => {
				window.location.href = '/my-trips';
				localStorage.removeItem([LS_CALENDAR_LOCALE, name].join('-'));
				localStorage.removeItem([LS_SIDEBAR_EVENTS, name].join('-'));
			}, 3000);
		} else {
			const sharedTrip = sharedTrips.find((s) => s.name === name);
			this.isSharedTrip = !!sharedTrip;
			if (!!sharedTrip) {
				this.isTripLocked = !!sharedTrip.isLocked;
				this.canRead = sharedTrip.canRead;
				this.canWrite = sharedTrip.canWrite;

				// @ts-ignore
				this.isTripLocked ||= !sharedTrip.canWrite;
			} else {
				this.canRead = true;
				this.canWrite = true;
			}
		}
	}

	@action
	async setTripName(name: string, calendarLocale?: LocaleCode, createMode?: boolean) {
		const { trips, sharedTrips } = await this.dataService.getTripsShort(this);
		const existingTrips = [...trips, ...sharedTrips];

		runInAction(() => {
			this.isLoadingTrip = true;
		});

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
				const dateRange = DataServices.LocalStorageService.getDateRange(name);
				this.customDateRange = dateRange;
				this.allEvents = DataServices.LocalStorageService.getAllEvents(this, name);
				this.categories = DataServices.LocalStorageService.getCategories(this, name);
				newDistanceResults = await DataServices.LocalStorageService.getDistanceResults(name);

				const isLocked = DataServices.LocalStorageService.getIsLocked(name);
				this.isTripLocked = isLocked;
				this.lockTripIfAlreadyOver(isLocked, dateRange.end);
				this.isTripLocked = DataServices.LocalStorageService.getIsLocked(name);

				this.tripId = 0;
			} else {
				runInAction(() => {
					this.isLoading = true;
				});

				const tripData = await DataServices.DBService.getTripData(name);
				newDistanceResults = await DataServices.DBService.getDistanceResults(name);

				this.tripId = tripData.id ?? 0;

				if (tripData.id) {
					await this.initTasks(tripData.id);
				}

				await this.updateTripData(tripData);

				await this.waitIfNeeded(startTime);
				runInAction(() => {
					this.isLoading = false;
				});
			}

			const sharedTrip = sharedTrips.find((s) => s.name === name);
			this.isSharedTrip = !!sharedTrip;
			if (!!sharedTrip) {
				this.canRead = sharedTrip.canRead;
				this.canWrite = sharedTrip.canWrite;

				// @ts-ignore
				this.isTripLocked ||= !sharedTrip.canWrite;
			} else {
				this.canRead = true;
				this.canWrite = true;
			}

			// reset them when switching trips
			this.selectedEventForNearBy = undefined;
			this.selectedEventNearByPlaces = [];
			this.distanceSectionAutoOpened = false;
			this.closedDistanceAutoOpened = false;

			this.allEventsTripName = name;
			runInAction(() => {
				this.distanceResults = observable.map(newDistanceResults);
			});
		}

		runInAction(() => {
			this.isLoadingTrip = false;
		});
	}

	@action
	async updateTripData(tripData: Trip) {
		const { categories, allEvents, sidebarEvents, calendarEvents, dateRange, isLocked } = tripData;
		// this.setCalendarLocalCode(calendarLocale ?? tripData.calendarLocale);
		// this.setCalendarLocalCode(tripData.calendarLocale);
		this.setCalendarLocalCode(DataServices.LocalStorageService.getCalendarLocale(), false);

		await this.setSidebarEvents(sidebarEvents, false);
		await this.setCalendarEvents(calendarEvents, false);
		this.customDateRange = dateRange;
		this.allEvents = allEvents;
		this.categories = categories;
		this.isTripLocked = !!isLocked;

		if ('canRead' in Object.keys(tripData) || 'canWrite' in Object.keys(tripData)) {
			// @ts-ignore
			this.canRead = tripData.canRead;

			// @ts-ignore
			this.canWrite = tripData.canWrite;

			// @ts-ignore
			this.isTripLocked ||= !tripData.canWrite;
		}

		this.lockTripIfAlreadyOver(!!isLocked, dateRange.end);
	}

	lockTripIfAlreadyOver(isLocked: boolean, endDate: string) {
		// if trip end date already passed, auto-lock it.
		// after it was auto-locked once, do not auto-lock it again (if the user decided to unlock it, leave it unlocked)
		const key = 'auto-locked-' + this.tripName;
		const key2 = 'auto-locked-' + this.tripId;
		if (!isLocked) {
			if (new Date().getTime() > new Date(endDate).getTime()) {
				console.log('passed time', new Date().getTime() - new Date(endDate).getTime());
				if (!localStorage.getItem(key) && !localStorage.getItem(key2)) {
					this.dataService.lockTrip(this.tripName);
					localStorage.setItem(key, '1');
					localStorage.setItem(key2, '1');
				}
			}
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
	toggleShowOnlyEventsWithDistanceProblems() {
		this.showOnlyEventsWithDistanceProblems = !this.showOnlyEventsWithDistanceProblems;
	}

	@action
	toggleShowOnlyEventsWithOpeningHoursProblems() {
		this.showOnlyEventsWithOpeningHoursProblems = !this.showOnlyEventsWithOpeningHoursProblems;
	}

	@action
	setShowOnlyEventsWithNoLocation(newVal: boolean) {
		this.showOnlyEventsWithNoLocation = newVal;
	}

	@action
	setShowOnlyEventsWithDistanceProblems(newVal: boolean) {
		this.showOnlyEventsWithDistanceProblems = newVal;
	}

	@action
	setShowOnlyEventsWithOpeningHoursProblems(newVal: boolean) {
		this.showOnlyEventsWithOpeningHoursProblems = newVal;
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

		if (isMobile) {
			this.isSwitchDaysEnabled = false;
			// this.listViewShowNavigateTo = true;
		}
	}

	@action
	setIsMenuOpen(isOpen: boolean) {
		this.isMenuOpen = isOpen;
	}

	@action
	setIsSearchOpen(isOpen: boolean) {
		this.isSearchOpen = isOpen;
	}

	@action
	toggleFilterPriority(priority: string) {
		if (this.filterOutPriorities.get(priority)) {
			this.filterOutPriorities.delete(priority);
		} else {
			this.filterOutPriorities.set(priority, true);
		}
	}

	@action
	toggleMapFilters() {
		this.mapFiltersVisible = !this.mapFiltersVisible;
	}

	@action
	setSelectedEventForNearBy(calendarEvent: CalendarEvent | SidebarEvent | undefined) {
		// @ts-ignore
		const location = calendarEvent?.location ?? calendarEvent?.extendedProps?.location;
		if (!location) {
			this.selectedEventForNearBy = undefined;
			this.selectedEventNearByPlaces = undefined;
			this.modalValues['selectedCalendarEvent'] = undefined;
		} else {
			this.selectedEventForNearBy = calendarEvent;
			this.modalValues['selectedCalendarEvent'] = {
				label: calendarEvent?.title,
				value: calendarEvent?.id,
			};

			const from: Coordinate = {
				lat: location.latitude!,
				lng: location.longitude!,
			};

			apiGetNew(`/distance/near/${coordinateToString(from)}`).then((results) => {
				const data = results.data;
				const allEventsWithLocation = this.allEventsComputed.filter(
					(x) => x?.location?.latitude && x?.location?.longitude
				);

				const coordinateToEvent: Record<string, SidebarEvent | CalendarEvent> = {};
				allEventsWithLocation.forEach((e) => {
					const coordinate: Coordinate = {
						lat: e.location!.latitude!,
						lng: e.location!.longitude!,
					};
					coordinateToEvent[coordinateToString(coordinate)] = e;
				});

				const topEventsWithDetails = data
					.map((x: any) => {
						const event = coordinateToEvent[x.to];
						x.distance = x.distance?.text;
						x.duration = x.duration?.text;
						if (event) {
							return {
								...x,
								event,
							};
						} else {
							return undefined;
						}
					})
					.filter(Boolean)
					.slice(0, 10);

				topEventsWithDetails.forEach((x: any) => {
					const otherTravelMode =
						x.travelMode == GoogleTravelMode.DRIVING ? GoogleTravelMode.WALKING : GoogleTravelMode.DRIVING;

					x.alternative = data.find(
						(y: any) => x.from === y.from && x.to === y.to && y.travelMode == otherTravelMode
					);
				});

				this.selectedEventNearByPlaces = topEventsWithDetails;

				this.autoOpenDistanceSidebarGroup();
			});
		}

		// to force re-define the draggables
		setTimeout(() => {
			runInAction(() => {
				this.forceSetDraggable += 1;
			});
		}, 500);
	}

	@action
	async toggleTripLocked() {
		if (this.isSharedTrip && !this.canWrite) {
			return;
		}

		if (this.isTripLocked) {
			await this.dataService.unlockTrip(this.tripName);
			LogHistoryService.logHistory(this, TripActions.unlockedTrip, {});
		} else {
			await this.dataService.lockTrip(this.tripName);
			LogHistoryService.logHistory(this, TripActions.lockedTrip, {});
		}

		if (this.dataService.getDataSourceName() == TripDataSource.LOCAL) {
			this.isTripLocked = !this.isTripLocked;
		}
	}

	// --- private functions ----------------------------------------------------

	getJSCalendarEvents(): CalendarEvent[] {
		return toJS(this.calendarEvents);
	}

	getJSSidebarEvents(): Record<number, SidebarEvent[]> {
		return _.cloneDeep(this.sidebarEvents);
		// return toJS(this.sidebarEvents);
	}

	updateEvent(_storedEvent: SidebarEvent | CalendarEvent | any, newEvent: SidebarEvent | CalendarEvent | any) {
		const storedEvent = _.cloneDeep(_storedEvent);
		storedEvent.title = newEvent.title ?? storedEvent.title;
		storedEvent.allDay = newEvent.allDay ?? storedEvent.allDay;
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
		storedEvent.images = newEvent.images ?? storedEvent.images;

		storedEvent.price = newEvent.price ?? storedEvent.price;
		storedEvent.currency = newEvent.currency ?? storedEvent.currency;

		storedEvent.moreInfo = newEvent.moreInfo ?? storedEvent.moreInfo;

		// @ts-ignore
		const millisecondsDiff = storedEvent.end - storedEvent.start;
		if (millisecondsDiff > 0) {
			storedEvent.duration = convertMsToHM(millisecondsDiff);
		}

		// todo check
		storedEvent.preferredTime = newEvent.preferredTime ?? storedEvent.preferredTime;
		storedEvent.category = newEvent.category ?? storedEvent.category;

		return storedEvent;
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
		storedEvent.price = newEvent.price;
		storedEvent.currency = newEvent.currency;
		storedEvent.moreInfo = newEvent.moreInfo;
	}

	getCurrentDirection() {
		if (this.calendarLocalCode === 'he') {
			return 'rtl';
		} else {
			return 'ltr';
		}
	}

	getCurrentDirectionStart() {
		if (this.calendarLocalCode === 'he') {
			return 'right';
		} else {
			return 'left';
		}
	}

	getCurrentDirectionEnd() {
		if (this.calendarLocalCode === 'he') {
			return 'left';
		} else {
			return 'right';
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
		if (this.allEventsComputed.length > 0) {
			minEventId = Math.max(...this.allEventsComputed.flat().map((x) => parseInt(x.id)));
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
		if (gap > 0) {
			await new Promise((r) => setTimeout(r, gap));
		}
	}

	hasDistanceResultsOfCoordinate(coordinate: Coordinate): boolean {
		const coordinateKey = coordinateToString(coordinate);
		const hashMap = JSON.parse(JSON.stringify(this.distanceResults));
		const found = Object.keys(hashMap).find((x) => x.indexOf(coordinateKey) !== -1);
		return !!found;
	}

	@action
	showToastr(message: string, icon: string = 'icons-8-done.gif', duration: number = 3000) {
		this.toastrSettings = {
			show: true,
			duration,
			message,
			icon,
			key: generate_uuidv4(),
		};

		if (this.toastrClearTimeout) {
			clearTimeout(this.toastrClearTimeout);
		}

		this.toastrClearTimeout = setTimeout(() => {
			runInAction(() => {
				this.toastrSettings = {
					show: false,
					message: '',
					icon: 'icons-8-done.gif',
					duration: 3000,
				};
			});
		}, duration + 100);
	}
}

export const eventStoreContext = createContext(new EventStore());
