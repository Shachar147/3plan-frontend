import { DEFAULT_EVENT_DURATION, TRIP_MAX_SIZE_DAYS } from './consts';
import { padTo2Digits } from './utils';
import TranslateService from '../services/translate-service';
import { EventStore } from '../stores/events-store';
import { DateRangeFormatted } from '../services/data-handlers/data-handler-base';
import ReactModalService from '../services/react-modal-service';
import moment from 'moment/moment';

export const MINUTES_IN_DAY = 1440;

export function getDateRangeString(start: Date, end: Date) {
	const startDay = start.getDate();
	const endDay = end.getDate();

	const startMonth = start.getMonth() + 1;
	const endMonth = end.getMonth() + 1;

	const startYear = start.getFullYear();
	const endYear = end.getFullYear();

	if (startYear !== endYear) {
		return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
	} else if (startMonth !== endMonth) {
		return `${startDay}.${startMonth} - ${endDay}.${endMonth}`;
	} else {
		return `${startDay}-${endDay}.${startMonth}`;
	}
}

export function formatDate(dt: Date) {
	const parts = dt.toLocaleDateString().replace(/\//gi, '-').split('-');
	return [padTo2Digits(Number(parts[1])), padTo2Digits(Number(parts[0])), parts[2]].join('/');
}

export function getDurationString(eventStore: EventStore, duration?: string) {
	if (!duration) {
		return `${DEFAULT_EVENT_DURATION}h`;
	} else {
		const minutes = Number(duration.split(':')[1]);
		const hours = Number(duration.split(':')[0]);

		const h = TranslateService.translate(eventStore, 'DURATION_STRING.H');
		const m = TranslateService.translate(eventStore, 'DURATION_STRING.M');

		if (minutes) {
			return `${hours}${h} ${minutes}${m}`;
		}
		return `${Number(hours)}${h}`;
	}
}

export function getTimeStringFromDate(date: Date) {
	const hours = padTo2Digits(date.getHours());
	const minutes = padTo2Digits(date.getMinutes());
	return `${hours}:${minutes}`;
}

export function convertMsToHM(milliseconds: number): string {
	let seconds = Math.floor(milliseconds / 1000);
	let minutes = Math.floor(seconds / 60);
	let hours = Math.floor(minutes / 60);
	let days = Math.floor(hours / 24);

	seconds = seconds % 60;
	// 👇️ if seconds are greater than 30, round minutes up (optional)
	minutes = seconds >= 30 ? minutes + 1 : minutes;

	minutes = minutes % 60;

	// 👇️ If you don't want to roll hours over, e.g. 24 to 00
	// 👇️ comment (or remove) the line below
	// commenting next line gets you `24:00:00` instead of `00:00:00`
	// or `36:15:31` instead of `12:15:31`, etc.
	hours = hours % 24;

	return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}`;
}

export function formatDuration(duration: string) {
	const hours = parseInt(duration.split(':')[0]);
	const minutes = parseInt(duration.split(':')[1]);
	const milliseconds = minutes * 60000 + hours * 3600000;
	return convertMsToHM(milliseconds);
}

export function getEndDate(start: Date | string, duration: string) {
	let dt = start;
	if (typeof dt == 'string') {
		dt = new Date(dt);
	}
	const hours = parseInt(duration.split(':')[0]);
	const minutes = parseInt(duration.split(':')[1]);
	const milliseconds = minutes * 60000 + hours * 3600000;
	const result = new Date(dt.getTime() + milliseconds);
	if (typeof start == 'string') {
		return result.toISOString();
	}
	return result;
}

export function formatTime(timeString: string) {
	const parts = timeString.replace(' PM', '').replace(' AM', '').split(':');

	return padTo2Digits(parseInt(parts[0])) + ':' + padTo2Digits(parseInt(parts[1]));
}

export function getInputDateTimeValue(eventStore: EventStore, date?: Date, startDate?: string): string {
	if (!date) {
		if (startDate) {
			return addHours(new Date(startDate + 'Z'), 1)
				.toISOString()
				.slice(0, 16);
		}
		// find the first available hour:
		else if (eventStore.mostAvailableSlotInView && eventStore.mostAvailableSlotInView.start) {
			return eventStore.mostAvailableSlotInView.start.toISOString().slice(0, 16);
		}

		// get first available hour
		return new Date(eventStore.customDateRange.start).toISOString().slice(0, 16);
	}
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('.')[0];
}

export function getEventDueDate(event: any) {
	const hoursToAdd = 1;
	return event.end ? toDate(event.end) : addHoursToDate(new Date(toDate(event.start)), hoursToAdd);
}

export function addHoursToDate(date: Date, hoursToAdd: number) {
	const hourToMilliseconds = 60 * 60 * 1000;
	return new Date(date.setTime(date.getTime() + hoursToAdd * hourToMilliseconds));
}

export function validateDuration(duration: string) {
	return (
		duration.split(':').length == 2 &&
		!Number.isNaN(duration.split(':')[0]) &&
		!Number.isNaN(duration.split(':')[1]) &&
		parseInt(duration.split(':')[0]) >= 0 &&
		parseInt(duration.split(':')[1]) >= 0 &&
		parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1]) > 0
	);
}

export function getAmountOfDays(startDate: string, endDate: string) {
	const endTimestamp = new Date(endDate).getTime();
	const startTimestamp = new Date(startDate).getTime();
	const oneDayInMilliseconds = 86400000;
	return parseInt(((endTimestamp - startTimestamp) / oneDayInMilliseconds).toString()) + 1;
}

export function formatShortDateStringIsrael(date: string) {
	// 01-22-2022 to 22.01
	return `${date.split('-')[2]}.${date.split('-')[1]}`;
}

export function toDate(dt: Date | string | number | number[] | undefined) {
	const dtDate = typeof dt === 'string' ? new Date(dt) : (dt as Date);
	// console.log(dt, dtDate);
	return dtDate;
}

export function addDays(dt: Date, days: number): Date {
	dt.setDate(dt.getDate() + days);
	return dt;
}

export function addHours(dt: Date, hours: number): Date {
	dt.setHours(dt.getHours() + hours);
	return dt;
}

export function addSeconds(dt: Date, seconds: number): Date {
	dt.setSeconds(dt.getSeconds() + seconds);
	return dt;
}

export function fullCalendarFormatDate(dt: Date) {
	const parts = dt.toLocaleDateString().replace(/\//gi, '-').split('-');
	return [parts[2], padTo2Digits(Number(parts[0])), padTo2Digits(Number(parts[1]))].join('-');
}

export function isTodayInDateRange(customDateRange: DateRangeFormatted) {
	const todayTimestamp = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
	const endTimestamp = new Date(new Date(customDateRange.end).setHours(0, 0, 0, 0)).getTime();
	const startTimestamp = new Date(new Date(customDateRange.start).setHours(0, 0, 0, 0)).getTime();

	return startTimestamp <= todayTimestamp && todayTimestamp <= endTimestamp;
}

export function validateDateRange(
	eventStore: EventStore,
	start: string | undefined,
	end: string | undefined,
	limit_in_days: number = TRIP_MAX_SIZE_DAYS,
	min_limit: number = 0,
	min_limit_days_or_minutes: 'days' | 'minutes' = 'days',
	showErrorPopups: boolean = true
): boolean {
	if (!start) {
		if (showErrorPopups) {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.START_DATE_CANT_BE_EMPTY',
				'error'
			);
		}
		return false;
	}

	if (!end) {
		if (showErrorPopups) {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.END_DATE_CANT_BE_EMPTY',
				'error'
			);
		}
		return false;
	}

	if (new Date(end).getTime() < new Date(start).getTime()) {
		if (showErrorPopups) {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.START_DATE_SMALLER',
				'error'
			);
		}
		return false;
	}

	if (new Date(end).getTime() - new Date(start).getTime() > limit_in_days * 86400000) {
		if (showErrorPopups) {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.TOO_LONG_RANGE',
				'error',
				{ X: limit_in_days }
			);
		}
		return false;
	}

	let min_limit_in_days = min_limit;
	if (min_limit_days_or_minutes == 'minutes') {
		min_limit_in_days = min_limit / MINUTES_IN_DAY;
	}
	const diff = new Date(end).getTime() - new Date(start).getTime();
	if (diff < min_limit_in_days * 86400000) {
		if (showErrorPopups) {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.TOO_SHORT_RANGE',
				'error',
				{
					X: diff / 60 / 1000,
					Y: TranslateService.translate(eventStore, min_limit_days_or_minutes.toUpperCase()),
					Z: min_limit,
				}
			);
		}
		return false;
	}

	return true;
}

/***
 * format ISO date string into a readable format
 * @param inputDateString - example: 2023-04-22T09:30:00
 *
 * returns date in a readable format for example: 22/04/2023, 09:30
 */
export const formatFromISODateString = (inputDateString: string, withComma: boolean = true): string => {
	const momentObj = moment(inputDateString);
	const format = withComma ? 'DD/MM/YYYY, HH:mm' : 'DD/MM/YYYY HH:mm';
	return momentObj.format(format);
};

export const formatTimeFromISODateString = (inputDateString: string): string => {
	const momentObj = moment(inputDateString);
	return momentObj.format('HH:mm');
};

export function areDatesOnDifferentDays(date1: Date, date2: Date) {
	return (
		date1.getFullYear() !== date2.getFullYear() ||
		date1.getMonth() !== date2.getMonth() ||
		date1.getDate() !== date2.getDate()
	);
}
