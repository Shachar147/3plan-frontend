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

export function getDurationInMs(duration: string) {
	if (!duration) {
		return 0;
	}
	duration = fixDuration(duration);

	const hours = parseInt(duration.split(':')[0]);
	const minutes = parseInt(duration.split(':')[1]);
	const milliseconds = minutes * 60000 + hours * 3600000;
	return milliseconds;
}

export function formatDuration(duration: string) {
	duration = fixDuration(duration);

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

export function fixDuration(duration: string) {
	if (duration.indexOf(':') == -1) {
		if (duration.length == 4) {
			return duration.slice(0, 2) + ':' + duration.slice(2, 4);
		}
		if (duration.length == 3) {
			return '0' + duration[0] + ':' + duration.slice(1, 3);
		}
		if (duration.length == 2) {
			return duration + ':00';
		}
		if (duration.length == 1) {
			return '0' + duration[0] + ':00';
		}
	}
	return duration;
}

export function validateDuration(duration: string) {
	duration = fixDuration(duration);
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

export function addMinutes(dt: Date, minutes: number): Date {
	dt.setMinutes(dt.getMinutes() + minutes);
	return dt;
}

export function add15Minutes(dt: Date): Date {
	return addMinutes(dt, 15);
}

export function subtract15Minutes(dt: Date): Date {
	return addMinutes(dt, -15);
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

export function getOffsetInHours(zeroIfProd: boolean = true) {
	let offset = new Date().getTimezoneOffset() / 60;

	const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
	if (mode != 'development' && zeroIfProd) {
		offset = 0;
	}
	return offset;
}

// turns 18/02/2023 to 02/18/2023
export function israelDateFormatToUSA(israelDate: string): string {
	const parts = israelDate.split('/');
	return [parts[1], parts[0], parts[2]].join('/');
}

export function getUserDateFormat(eventStore: EventStore) {
	if (eventStore.isHebrew) {
		return 'DD/MM/YYYY';
	} else {
		return 'MM/DD/YYYY';
	}
}

export function getUserDateFormatLowercase(eventStore: EventStore) {
	if (eventStore.isHebrew) {
		return 'dd/mm/YYYY';
	} else {
		return 'mm/dd/YYYY';
	}
}

export function serializeDuration(eventStore: EventStore, seconds: number) {
	const timeUnits = [
		{ unit: 'day', seconds: 86400 },
		{ unit: 'hour', seconds: 3600 },
		{ unit: 'min', seconds: 60 },
	];
	let result = [];
	for (let { unit, seconds: unitSeconds } of timeUnits) {
		let value = Math.floor(seconds / unitSeconds);
		if (value > 0) {
			result.push(value + ' ' + TranslateService.translate(eventStore, unit + (value > 1 ? 's' : '')));
			seconds %= unitSeconds;
		}
	}
	if (seconds > 0 && result.length === 0) {
		result.push(seconds + ' ' + TranslateService.translate(eventStore, 'sec' + (seconds > 1 ? 's' : '')));
	}
	return result.join(' ');
}

// Auto-schedule utility functions

/**
 * Parse duration string (HH:MM format) to minutes
 */
export function parseDurationToMinutes(duration: string): number {
	if (!duration) return 0;

	const fixedDuration = fixDuration(duration);
	const parts = fixedDuration.split(':');
	const hours = parseInt(parts[0]) || 0;
	const minutes = parseInt(parts[1]) || 0;

	return hours * 60 + minutes;
}

/**
 * Add minutes to a date and return new date
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
	const result = new Date(date);
	result.setMinutes(result.getMinutes() + minutes);
	return result;
}

/**
 * Get preferred time slot range based on TriplanEventPreferredTime
 */
export function getPreferredTimeSlot(preferredTime: number): { start: number; end: number } | null {
	switch (preferredTime) {
		case 1: // morning
			return { start: 9, end: 12 };
		case 2: // noon
			return { start: 12, end: 15 };
		case 3: // afternoon
			return { start: 15, end: 18 };
		case 4: // sunset
			return { start: 18, end: 19.5 };
		case 5: // evening
			return { start: 19.5, end: 22 };
		case 7: // night
			return { start: 22, end: 24 };
		case 6: // nevermind
		case 0: // unset
		default:
			return null; // no preference
	}
}

/**
 * Check if an event is open on a specific day
 * Supports multiple time ranges per day (e.g., split shifts)
 */
export function isEventOpenOnDay(openingHours: any, date: Date): boolean {
	if (!openingHours) return true; // Assume open if no hours specified

	const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const dayHours = openingHours[dayOfWeek];

	if (!dayHours || !Array.isArray(dayHours) || dayHours.length === 0) {
		return false; // Closed on this day
	}

	// Check if any time range is available (event is open)
	return dayHours.some((timeRange: any) => {
		if (!timeRange.start || !timeRange.end) return false;
		return true; // Has at least one time range
	});
}

/**
 * Check if an event can fit in a specific time range
 */
export function canEventFitInTimeRange(
	startTime: Date,
	durationMinutes: number,
	rangeStart: Date,
	rangeEnd: Date
): boolean {
	const eventEnd = addMinutesToDate(startTime, durationMinutes);

	// Event must start within the range
	if (startTime < rangeStart || startTime >= rangeEnd) {
		return false;
	}

	// Event must end within the range
	if (eventEnd > rangeEnd) {
		return false;
	}

	return true;
}
