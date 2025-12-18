import { EventStore } from '../../stores/events-store';
import { LS_DISTANCE_RESULTS } from '../../utils/defaults';
import {
	CalendarEvent,
	DistanceResult,
	SidebarEvent,
	TriPlanCategory,
	TriplanTaskStatus,
} from '../../utils/interfaces';
import { AllEventsEvent, BaseDataHandler, DateRangeFormatted, LocaleCode, SharedTrip, Trip } from './data-handler-base';
import { apiDelete, apiDeletePromise, apiGetPromise, apiPut, apiPost } from '../../helpers/api';
import { TripDataSource } from '../../utils/enums';
import { getCoordinatesRangeKey, stringToCoordinate } from '../../utils/utils';
import axios from 'axios';
import { getToken } from '../../helpers/auth';
// @ts-ignore
import _ from 'lodash';
import { addSeconds } from '../../utils/time-utils';
import ReactModalService from '../react-modal-service';
import { endpoints } from '../../v2/utils/endpoints';

export interface upsertTripProps {
	name?: string;
	dateRange?: DateRangeFormatted;
	categories?: TriPlanCategory[];
	calendarEvents?: CalendarEvent[];
	sidebarEvents?: Record<number, SidebarEvent[]>;
	allEvents?: AllEventsEvent[];
	calendarLocale?: LocaleCode;
	destinations?: string[];
	priorityColors?: Record<string, string>;
	priorityMapColors?: Record<string, string>;
}

export const useInviteLinkLSKey = 'triplan-invite-link';

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

		const res: any = await apiGetPromise(this, endpoints.v1.distance.getDistanceResults(tripName));

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
		const res: any = await apiGetPromise(this, endpoints.v1.trips.getTripByName(tripName!));
		if (!res) {
			window.location.href = '/login';
		}
		return res.data as Trip;
	}

	async updateTripColors(
		tripName: string,
		data: { priorityColors: Record<string, string>; priorityMapColors: Record<string, string> }
	) {
		return apiPut(endpoints.v1.trips.updateTripByName(tripName), data);
	}

	// unused
	async getTrips(eventStore: EventStore): Promise<{ trips: Trip[]; sharedTrips: SharedTrip[] }> {
		const res: any = await apiGetPromise(this, endpoints.v1.trips.getAllTrips);
		const trips: Trip[] = [];
		res.data.data.forEach((x: any) => {
			trips.push(x as Trip);
		});
		return { trips, sharedTrips: [] };
	}

	async getCollaborators(eventStore: EventStore): Promise<any[]> {
		const res: any = await apiGetPromise(this, endpoints.v1.sharedTrips.getTripCollaborators(eventStore.tripName));
		const collaborators: any[] = [];
		res.data.forEach((x: any) => {
			collaborators.push(x);
		});
		return collaborators;
	}

	async getTripsShort(_: any): Promise<{ trips: Trip[]; sharedTrips: SharedTrip[] }> {
		const res: any = await apiGetPromise(this, endpoints.v1.trips.getAllTripsShort);
		const trips: Trip[] = [];
		if (!res) {
			window.location.href = '/login';
		}
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
			if (token) {
				axios.defaults.headers.Authorization = `Bearer ${token}`;
			}
		}

		try {
			const res: any = await apiGetPromise(this, endpoints.v1.admin.statistics, false);
			return res?.data ?? [];
		} catch {
			return [];
		}
	}

	// --- SET ------------------------------------------------------------------------------
	async setAllEvents(allEvents: AllEventsEvent[], tripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { allEvents });
	}

	async setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string) {
		const arr = _.cloneDeep(calendarEvents);
		arr.map((x: CalendarEvent) => {
			x.className = (x.className ?? '').replace(' locked', '');

			// @ts-ignore
			x.classNames = x.classNames?.replace(' locked', '');
		});

		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { calendarEvents: arr });
	}

	async setCalendarLocale(calendarLocale: LocaleCode, tripName?: string) {
		if (!tripName) return;
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { calendarLocale });
	}

	async setCategories(categories: TriPlanCategory[], tripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { categories });
	}

	async setDateRange(dateRange: DateRangeFormatted, tripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { dateRange });
	}

	setDistanceResults(distanceResults: Map<String, DistanceResult>, tripName?: string): void {
		// todo complete
		const key = tripName ? [LS_DISTANCE_RESULTS, tripName].join('-') : LS_DISTANCE_RESULTS;
		localStorage.setItem(key, JSON.stringify(distanceResults));
	}

	async setSidebarEvents(sidebarEvents: Record<number, SidebarEvent[]>, tripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { sidebarEvents });
	}

	async setTripName(tripName: string, newTripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { name: newTripName });
	}

	async setDestinations(destinations: string[], tripName: string) {
		return await apiPut(endpoints.v1.trips.updateTripByName(tripName), { destinations });
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
			endpoints.v1.trips.deleteTripByName(tripName),
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
		return await apiPut(endpoints.v1.trips.hideTripByName(tripName), {});
	}

	async unHideTripByName(tripName: string) {
		return await apiPut(endpoints.v1.trips.unhideTripByName(tripName), {});
	}

	async createInviteLink(tripName: string, canWrite: boolean) {
		return await apiPost(endpoints.v1.sharedTrips.createInviteLink, {
			tripName,
			canRead: true,
			canWrite,
		});
	}

	async useInviteLink(eventStore: EventStore, token: string) {
		localStorage.setItem(
			useInviteLinkLSKey,
			JSON.stringify({
				token,
				expiresIn: addSeconds(new Date(), 120).getTime(),
			})
		);

		return await apiPost(
			endpoints.v1.sharedTrips.useInviteLink,
			{
				token,
			},
			true,
			() => {
				localStorage.removeItem(useInviteLinkLSKey);
			},
			() => {
				// todo complete - log history - there was a try to use an old invite link

				ReactModalService.internal.openOopsErrorModal(eventStore);
			}
		);
	}

	async createTrip(
		data: upsertTripProps,
		successCallback?: (res: any) => void,
		errorCallback?: (error: any, error_retry: number) => void,
		finallyCallback?: () => void
	) {
		const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale, destinations } =
			data;

		return await apiPost(endpoints.v1.trips.createTrip, {
			name,
			dateRange,
			categories,
			calendarEvents,
			sidebarEvents,
			allEvents,
			calendarLocale,
			destinations,
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
		return await apiPost(endpoints.v1.trips.duplicateTrip, { name: tripName, newName: newTripName });
	}

	async lockTrip(tripName: string) {
		return await apiPut(endpoints.v1.trips.lockTripByName(tripName), {});
	}

	async unlockTrip(tripName: string) {
		return await apiPut(endpoints.v1.trips.unlockTripByName(tripName), {});
	}

	async deleteCollaboratorPermissions(
		permissionsId: any,
		successCallback?: (res: any) => void,
		errorCallback?: (error: any, error_retry: number) => void,
		finallyCallback?: () => void
	) {
		await apiDelete(
			this,
			endpoints.v1.sharedTrips.deleteCollaboratorPermissions(permissionsId),
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
		return await apiPut(endpoints.v1.sharedTrips.updateCollaboratorPermissions(permissionsId), {
			canWrite,
		});
	}

	async getHistory(tripId: number, limit: number = 100) {
		const res: any = await apiGetPromise(this, endpoints.v1.history.getHistoryById(tripId, limit));
		return res.data;
	}

	async logHistory(tripId: number, action: string, actionParams?: any, eventId?: number, eventName?: string) {
		return await apiPost(endpoints.v1.history.logHistory, {
			tripId,
			action,
			actionParams,
			eventId,
			eventName,
		});
	}

	async getTasks(tripId: number) {
		const res: any = await apiGetPromise(this, endpoints.v1.tasks.getTripTasks(tripId));
		return res.data;
	}

	async createTask(data: {
		description: string;
		title: string;
		status: TriplanTaskStatus;
		eventId?: number;
		mustBeDoneBefore?: number;
	}) {
		return await apiPost(endpoints.v1.tasks.createTask, data);
	}

	async updateTask(
		taskId: number,
		data: {
			description: string;
			title: string;
			status: TriplanTaskStatus;
			eventId?: number;
			mustBeDoneBefore?: number;
		}
	) {
		return await apiPut(endpoints.v1.tasks.updateTaskStatus(taskId), data);
	}

	async updateTaskStatus(taskId: number, status: TriplanTaskStatus) {
		return await apiPut(endpoints.v1.tasks.updateTaskStatus(taskId), { status });
	}

	// Packing methods
	async getPackingItems(tripId: number) {
		const res: any = await apiGetPromise(this, endpoints.v1.packing.item.getByTrip(tripId));
		return res.data;
	}

	async getPackingCategories(tripId: number) {
		const res: any = await apiGetPromise(this, endpoints.v1.packing.category.getByTrip(tripId));
		return res.data;
	}

	async createPackingItem(data: {
		tripId: number;
		title: string;
		icon?: string;
		categoryId?: number;
		isPacked?: boolean;
		order?: number;
	}) {
		return await apiPost(endpoints.v1.packing.item.create, data);
	}

	async updatePackingItem(
		itemId: number,
		data: {
			title?: string;
			icon?: string;
			categoryId?: number;
			isPacked?: boolean;
			order?: number;
		}
	) {
		return await apiPut(endpoints.v1.packing.item.update(itemId), data);
	}

	async deletePackingItem(itemId: number) {
		const res: any = await apiDeletePromise(endpoints.v1.packing.item.delete(itemId));
		return res.data;
	}

	async createPackingCategory(data: { tripId: number; name: string; icon?: string; order?: number }) {
		return await apiPost(endpoints.v1.packing.category.create, data);
	}

	async updatePackingCategory(
		categoryId: number,
		data: {
			name?: string;
			icon?: string;
			order?: number;
		}
	) {
		return await apiPut(endpoints.v1.packing.category.update(categoryId), data);
	}

	async deletePackingCategory(categoryId: number) {
		const res: any = await apiDeletePromise(endpoints.v1.packing.category.delete(categoryId));
		return res.data;
	}
}
