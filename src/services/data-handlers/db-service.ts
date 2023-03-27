import { EventStore } from '../../stores/events-store';
import { LS_DISTANCE_RESULTS } from '../../utils/defaults';
import { CalendarEvent, DistanceResult, SidebarEvent, TriPlanCategory } from '../../utils/interfaces';
import { AllEventsEvent, BaseDataHandler, DateRangeFormatted, LocaleCode, Trip } from './data-handler-base';
import { apiDelete, apiGetPromise, apiPut, apiPost } from '../../helpers/api';
import { TripDataSource } from '../../utils/enums';
import { getCoordinatesRangeKey, stringToCoordinate } from '../../utils/utils';

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
			// @ts-ignore
			return undefined;
		}

		const res: any = await apiGetPromise(this, `/distance/trip/${tripName}`);

		const result: Record<string, DistanceResult> = {};

		res.data.results.forEach((x: any) => {
			const key = getCoordinatesRangeKey('DRIVING', stringToCoordinate(x.from)!, stringToCoordinate(x.to)!);

			const distanceResult = {
				from: x.from,
				to: x.to,
				duration: x.duration?.text,
				distance: x.distance?.text,
				duration_value: x.duration?.value,
				distance_value: x.distance?.value,
			};

			result[key] = distanceResult;
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

	async getTrips(eventStore: EventStore): Promise<Trip[]> {
		const res: any = await apiGetPromise(this, '/trip/');
		const trips: Trip[] = [];
		res.data.data.forEach((x: any) => {
			trips.push(x as Trip);
		});
		return trips;
	}

	// --- SET ------------------------------------------------------------------------------
	async setAllEvents(allEvents: AllEventsEvent[], tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { allEvents });
	}

	async setCalendarEvents(calendarEvents: CalendarEvent[], tripName: string) {
		return await apiPut(`/trip/name/${tripName}`, { calendarEvents });
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
}
