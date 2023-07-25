import { EventStore } from '../../stores/events-store';
import { LS_DISTANCE_RESULTS } from '../../utils/defaults';
import {
	buildCalendarEvent,
	CalendarEvent,
	DistanceResult,
	SidebarEvent,
	TripActions,
	TriPlanCategory,
} from '../../utils/interfaces';
import { AllEventsEvent, BaseDataHandler, DateRangeFormatted, LocaleCode, SharedTrip, Trip } from './data-handler-base';
import { apiDelete, apiGetPromise, apiPut, apiPost } from '../../helpers/api';
import { TripDataSource } from '../../utils/enums';
import { getCoordinatesRangeKey, jsonDiff, stringToCoordinate } from '../../utils/utils';
import axios from 'axios';
import { getToken } from '../../helpers/auth';
import _ from 'lodash';
import { convertMsToHM, formatFromISODateString } from '../../utils/time-utils';
import { runInAction } from 'mobx';

export interface upsertTripProps {
	name?: string;
	dateRange?: DateRangeFormatted;
	categories?: any[];
	calendarEvents?: any[];
	sidebarEvents?: Record<number, any[]>;
	allEvents?: any[];
	calendarLocale?: LocaleCode;
}

export class DBService implements BaseDataHandler {
	getDataSourceName() {
		return TripDataSource.DB;
	}

	// --- GET ------------------------------------------------------------------------------
	async getAllEvents(eventStore: EventStore, tripName?: string, createMode?: boolean): Promise<AllEventsEvent[]> {
		const trip = await this.getTripData(tripName);
		const { allEvents } = trip;
		return allEvents;
	}

	async getCalendarEvents(tripName?: string, createMode?: boolean): Promise<CalendarEvent[]> {
		const trip = await this.getTripData(tripName);
		const { calendarEvents } = trip;
		return calendarEvents;
	}

	async getCalendarLocale(tripName?: string, createMode?: boolean): Promise<LocaleCode> {
		const trip = await this.getTripData(tripName);
		const { calendarLocale } = trip;
		return calendarLocale;
	}

	async getCategories(eventStore: EventStore, tripName?: string, createMode?: boolean): Promise<TriPlanCategory[]> {
		const trip = await this.getTripData(tripName);
		const { categories } = trip;
		return categories;
	}

	async getDateRange(tripName: string, createMode?: boolean): Promise<DateRangeFormatted> {
		const trip = await this.getTripData(tripName);
		const { dateRange } = trip;
		return dateRange;
	}

	async getDistanceResults(tripName?: string): Promise<Record<string, DistanceResult>> {
		if (!tripName) {
			return {};
		}

		const res: any = await apiGetPromise(this, `/distance/trip/${tripName}`);

		const result: Record<string, DistanceResult> = {};

		res.data.results.forEach((x: any) => {
			const key = getCoordinatesRangeKey(x.travelMode, stringToCoordinate(x.from)!, stringToCoordinate(x.to)!);

			result[key] = {
				from: x.from,
				to: x.to,
				duration: x.duration?.text,
				distance: x.distance?.text,
				duration_value: x.duration?.value,
				distance_value: x.distance?.value,
			} as DistanceResult;
		});

		return result;
	}

	async getSidebarEvents(tripName?: string, createMode?: boolean): Promise<Record<number, SidebarEvent[]>> {
		const trip = await this.getTripData(tripName);
		const { sidebarEvents } = trip;
		return sidebarEvents;
	}

	async getTripData(tripName?: string): Promise<Trip> {
		const res: any = await apiGetPromise(this, `/trip/name/${tripName}`);
		return res.data as Trip;
	}

	// unused
	async getTrips(eventStore: EventStore): Promise<{ trips: Trip[]; sharedTrips: SharedTrip[] }> {
		const res: any = await apiGetPromise(this, '/trip/');
		const trips: Trip[] = [];
		res.data.data.forEach((x: any) => {
			trips.push(x as Trip);
		});
		return { trips, sharedTrips: [] };
	}

	async getCollaborators(eventStore: EventStore): Promise<any[]> {
		const res: any = await apiGetPromise(this, `/shared-trips/collaborators/name/${eventStore.tripName}`);
		const collaborators: any[] = [];
		res.data.forEach((x: any) => {
			collaborators.push(x);
		});
		return collaborators;
	}

	async getTripsShort(eventStore: EventStore): Promise<{ trips: Trip[]; sharedTrips: SharedTrip[] }> {
		const res: any = await apiGetPromise(this, '/trip/short');
		const trips: Trip[] = [];
		res.data.data.forEach((x: any) => {
			trips.push(x as Trip);
		});

		const sharedTrips: SharedTrip[] = [];
		res.data.sharedTrips.forEach((x: any) => {
			sharedTrips.push(x as SharedTrip);
		});
		return { trips, sharedTrips };
	}

	async getUserStats(): Promise<any[]> {
		if (!axios.defaults.headers.Authorization) {
			const token = getToken();
			axios.defaults.headers.Authorization = `Bearer ${token}`;
		}

		const res: any = await apiGetPromise(this, '/statistics', false);
		return res.data;
	}

	// --- SET ------------------------------------------------------------------------------
	async setAllEvents(allEvents: AllEventsEvent[], tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { allEvents });
	}

	async setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string) {
		const arr = _.cloneDeep(calendarEvents);
		arr.map((x) => {
			x.className = x.className?.replace(' locked', '');

			// @ts-ignore
			x.classNames = x.classNames?.replace(' locked', '');
		});

		return await apiPut(`/trip/name/${tripName}`, { calendarEvents: arr });
	}

	async setCalendarLocale(calendarLocale: LocaleCode, tripName?: string) {
		if (!tripName) return;
		return await apiPut(`/trip/name/${tripName}`, { calendarLocale });
	}

	async setCategories(categories: TriPlanCategory[], tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { categories });
	}

	async setDateRange(dateRange: DateRangeFormatted, tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { dateRange });
	}

	setDistanceResults(distanceResults: Map<String, DistanceResult>, tripName?: string): void {
		// todo complete
		const key = tripName ? [LS_DISTANCE_RESULTS, tripName].join('-') : LS_DISTANCE_RESULTS;
		localStorage.setItem(key, JSON.stringify(distanceResults));
	}

	async setSidebarEvents(sidebarEvents: Record<number, SidebarEvent[]>, tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { sidebarEvents });
	}

	async setTripName(tripName: string, newTripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { name: newTripName });
	}

	// --------------------------------------------------------------------------------------
	async deleteTripByName(
		tripName: string,
		successCallback?: (res: any) => void,
		errorCallback?: (error: any, error_retry: number) => void,
		finallyCallback?: () => void
	) {
		await apiDelete(
			this,
			`/trip/name/${tripName}`,
			async function (res: any) {
				if (successCallback) {
					successCallback(res);
				}
			},
			function (error: any, error_retry: number) {
				// console.log(error);
				// let req_error = error.message;
				// if (error.message.indexOf("401") !== -1) { req_error = UNAUTHORIZED_ERROR; }
				// if (error.message.indexOf("400") !== -1) { req_error = `Oops, failed saving this game.` }

				if (errorCallback) {
					errorCallback(error, error_retry);
				}
			},
			function () {
				if (finallyCallback) {
					finallyCallback();
				}
			}
		);
	}

	async hideTripByName(tripName: string) {
		return await apiPut(`/trip/hide/name/${tripName}`, {});
	}

	async unHideTripByName(tripName: string) {
		return await apiPut(`/trip/unhide/name/${tripName}`, {});
	}

	async createInviteLink(tripName: string, canWrite: boolean) {
		return await apiPost(`/shared-trips/create-invite-link`, {
			tripName,
			canRead: true,
			canWrite,
		});
	}

	async useInviteLink(token: string) {
		return await apiPost(`/shared-trips/use-invite-link`, {
			token,
		});
	}

	async createTrip(
		data: upsertTripProps,
		successCallback?: (res: any) => void,
		errorCallback?: (error: any, error_retry: number) => void,
		finallyCallback?: () => void
	) {
		const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale } = data;

		return await apiPost('/trip', {
			name,
			dateRange,
			categories,
			calendarEvents,
			sidebarEvents,
			allEvents,
			calendarLocale,
		})
			.then((res: any) => {
				if (successCallback) {
					successCallback(res);
				}
			})
			.catch((error: any) => {
				if (errorCallback) {
					errorCallback(error, 3);
				}
			})
			.finally(() => {
				if (finallyCallback) {
					finallyCallback();
				}
			});
	}

	async duplicateTrip(_eventStore: EventStore, tripName: string, newTripName: string) {
		return await apiPost(`/trip/duplicate`, { name: tripName, newName: newTripName });
	}

	async lockTrip(tripName: string) {
		return await apiPut(`/trip/lock/name/${tripName}`, {});
	}

	async unlockTrip(tripName: string) {
		return await apiPut(`/trip/unlock/name/${tripName}`, {});
	}

	async deleteCollaboratorPermissions(
		permissionsId: any,
		successCallback?: (res: any) => void,
		errorCallback?: (error: any, error_retry: number) => void,
		finallyCallback?: () => void
	) {
		await apiDelete(
			this,
			`/shared-trips/${permissionsId}`,
			async function (res: any) {
				if (successCallback) {
					successCallback(res);
				}
			},
			function (error: any, error_retry: number) {
				// console.log(error);
				// let req_error = error.message;
				// if (error.message.indexOf("401") !== -1) { req_error = UNAUTHORIZED_ERROR; }
				// if (error.message.indexOf("400") !== -1) { req_error = `Oops, failed saving this game.` }

				if (errorCallback) {
					errorCallback(error, error_retry);
				}
			},
			function () {
				if (finallyCallback) {
					finallyCallback();
				}
			}
		);
	}

	async changeCollaboratorPermissions(permissionsId: any, canWrite: boolean) {
		return await apiPut(`/shared-trips/${permissionsId}`, {
			canWrite,
		});
	}

	async getHistory(tripId: number, limit: number = 30) {
		const res: any = await apiGetPromise(this, `/history/by-trip/${tripId}/${limit}`);
		return res.data;
	}

	async logHistory(tripId: number, action: string, actionParams?: object, eventId?: number, eventName?: string) {
		return await apiPost('/history', {
			tripId,
			action,
			actionParams,
			eventId,
			eventName,
		});
	}

	logHistoryOnEventChange(
		eventStore: EventStore,
		tripId: number,
		changeInfo: any,
		eventId?: number,
		eventName?: string
	) {
		const original = {
			...changeInfo.oldEvent._def,
			...changeInfo.oldEvent.extendedProps,
			...changeInfo.oldEvent,
			allDay: changeInfo.oldEvent.allDay,
			hasEnd: !changeInfo.oldEvent.allDay,
			start: formatFromISODateString(changeInfo.oldEvent.start.toISOString()),
			end: formatFromISODateString(changeInfo.oldEvent.end.toISOString()),
		};

		const updated = {
			...changeInfo.event._def,
			...changeInfo.event.extendedProps,
			...changeInfo.event,
			allDay: changeInfo.event.allDay,
			hasEnd: !changeInfo.event.allDay,
			start: formatFromISODateString(changeInfo.event.start.toISOString()),
			end: formatFromISODateString(changeInfo.event.end.toISOString()),
			duration: convertMsToHM(changeInfo.event.end - changeInfo.event.start),
		};

		let diff = jsonDiff(buildCalendarEvent(original), buildCalendarEvent(updated));

		// console.log({
		// 	diff,
		// 	original: buildCalendarEvent(original),
		// 	updated: buildCalendarEvent(updated),
		// });

		let action: TripActions = TripActions.changedEvent;
		let actionParams = diff;
		if ('start' in diff || 'end' in diff) {
			if ('duration' in diff) {
				console.log('changed duration and timing');
				action = TripActions.changedEventDurationAndTiming;
				actionParams = {
					was: `${diff?.start?.was ?? original.start} - ${diff?.end?.was ?? original.end} (${
						diff?.duration?.was ?? original.duration
					})`,
					now: `${diff?.start?.now ?? updated.start} - ${diff?.end?.now ?? updated.end} (${
						diff?.duration?.now ?? updated.duration
					})`,
				};
			} else {
				action = TripActions.changedEventTiming;
				actionParams = {
					was: `${diff?.start?.was ?? original.start} - ${diff?.end?.was ?? original.end}`,
					now: `${diff?.start?.now ?? updated.start} - ${diff?.end?.now ?? updated.end}`,
				};
			}
		}

		this.logHistory(tripId, action, actionParams, eventId, eventName).then(() => {
			runInAction(() => {
				eventStore.reloadHistoryCounter += 1;
			});
		});
	}
}
