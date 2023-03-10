import { DEFAULT_EVENT_DURATION } from './consts';
import { padTo2Digits } from './utils';
import TranslateService from '../services/translate-service';
import { EventStore } from '../stores/events-store';
import { DateRangeFormatted } from '../services/data-handlers/data-handler-base';

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

export function formatTime(timeString: string) {
	const parts = timeString.replace(' PM', '').replace(' AM', '').split(':');

	return padTo2Digits(parseInt(parts[0])) + ':' + padTo2Digits(parseInt(parts[1]));
}

export function getInputDateTimeValue(date?: Date): string | undefined {
	if (!date) return undefined;
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
