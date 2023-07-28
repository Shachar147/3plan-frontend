import { buildCalendarEvent, SidebarEvent, TripActions, TriPlanCategory } from '../../utils/interfaces';
import { convertMsToHM, formatFromISODateString } from '../../utils/time-utils';
import { TripDataSource } from '../../utils/enums';
import { DBService } from './db-service';
import { runInAction } from 'mobx';
import { EventStore } from '../../stores/events-store';
import { jsonDiff } from '../../utils/utils';
import _ from 'lodash';

const LogHistoryService = {
	getWas(historyRow: any) {
		switch (historyRow.action) {
			case TripActions.deletedCalendarEvent:
				const start = historyRow.actionParams.was.start
					? formatFromISODateString(historyRow.actionParams.was.start)
					: 'N/A';

				const end = historyRow.actionParams.was.end
					? formatFromISODateString(historyRow.actionParams.was.end)
					: 'N/A';
				return `${start} - ${end}`;
			default:
				return historyRow.actionParams.was;
		}
	},

	logHistory(
		eventStore: EventStore,
		action: TripActions,
		data: {
			was?: any;
			now?: any;
			eventName?: string;
			toWhereStart?: Date;
			toWhereEnd?: Date;
			categoryName?: string;
			categoryId?: number;
			startDate?: { was: any; now: any };
			endDate?: { was: any; now: any };
			count?: number;

			// import:
			eventsToAdd?: SidebarEvent[];
			categoriesToAdd?: TriPlanCategory[];
			numOfEventsWithErrors?: number;
			errors?: string[];
			categoriesImported?: boolean;
			eventsImported?: boolean;
			count2?: number;

			totalAffectedSidebar?: number;
			totalAffectedCalendar?: number;
			tripName?: { was: string; now: string } | string;

			// share trip
			permissions?: string;
		},
		eventId?: number,
		eventName?: string
	) {
		if (eventStore.dataService.getDataSourceName() == TripDataSource.DB) {
			(eventStore.dataService as DBService)
				.logHistory(eventStore.tripId, action, data, eventId, eventName)
				.then(() => {
					runInAction(() => {
						eventStore.reloadHistoryCounter += 1;
					});
				});
		}
	},
	logHistoryOnEventChangeInternal(
		eventStore: EventStore,
		tripId: number,
		original: any,
		updated: any,
		eventId?: number,
		eventName?: string
	) {
		let diff = jsonDiff(buildCalendarEvent(original), buildCalendarEvent(updated));
		delete diff['timingError'];
		delete diff['className'];

		// if (diff['location'] && JSON.stringify(diff['location']['was']) == JSON.stringify(diff['location']['now'])) {
		// 	delete diff['location'];
		// }
		//
		// if (
		// 	diff['openingHours'] &&
		// 	JSON.stringify(diff['openingHours']['was']) == JSON.stringify(diff['openingHours']['now'])
		// ) {
		// 	delete diff['openingHours'];
		// }

		// console.log({
		// 	diff,
		// 	original: buildCalendarEvent(original),
		// 	updated: buildCalendarEvent(updated),
		// });

		let action: TripActions = TripActions.changedEvent;
		let actionParams = diff;

		const test = _.cloneDeep(diff);
		delete test['start'];
		delete test['end'];
		delete test['duration'];
		const isTimeRelatedChange = Object.keys(diff).length > 0 && Object.keys(test).length == 0;

		if (isTimeRelatedChange) {
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

		(eventStore.dataService as DBService).logHistory(tripId, action, actionParams, eventId, eventName).then(() => {
			runInAction(() => {
				eventStore.reloadHistoryCounter += 1;
			});
		});
	},
	logHistoryOnSidebarEventChangeInternal(
		eventStore: EventStore,
		tripId: number,
		original: any,
		updated: any,
		eventId?: number,
		eventName?: string
	) {
		let diff = jsonDiff(buildCalendarEvent(original), buildCalendarEvent(updated));
		delete diff['timingError'];
		delete diff['className'];

		let action: TripActions = TripActions.changedEvent;
		let actionParams = diff;

		action = TripActions.changedSidebarEvent;
		actionParams = diff;

		(eventStore.dataService as DBService).logHistory(tripId, action, actionParams, eventId, eventName).then(() => {
			runInAction(() => {
				eventStore.reloadHistoryCounter += 1;
			});
		});
	},
	logHistoryOnEventChange(
		eventStore: EventStore,
		tripId: number,
		changeInfo: any,
		eventId?: number,
		eventName?: string
	) {
		if (changeInfo && eventStore.dataService.getDataSourceName() == TripDataSource.DB) {
			const original = {
				...changeInfo.oldEvent._def,
				...changeInfo.oldEvent.extendedProps,
				...changeInfo.oldEvent,
				allDay: changeInfo.oldEvent.allDay,
				hasEnd: !changeInfo.oldEvent.allDay,
				start: formatFromISODateString(changeInfo.oldEvent.start.toISOString(), false),
				end: formatFromISODateString(changeInfo.oldEvent.end.toISOString(), false),
			};

			const updated = {
				...changeInfo.event._def,
				...changeInfo.event.extendedProps,
				...changeInfo.event,
				allDay: changeInfo.event.allDay,
				hasEnd: !changeInfo.event.allDay,
				start: formatFromISODateString(changeInfo.event.start.toISOString(), false),
				end: formatFromISODateString(changeInfo.event.end.toISOString(), false),
				duration: convertMsToHM(changeInfo.event.end - changeInfo.event.start),
			};

			this.logHistoryOnEventChangeInternal(eventStore, tripId, original, updated, eventId, eventName);
		}
	},
};

export default LogHistoryService;
