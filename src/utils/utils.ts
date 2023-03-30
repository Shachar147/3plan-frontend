import { GoogleTravelMode, TriplanEventPreferredTime, TriplanPriority } from './enums';
import { EventStore } from '../stores/events-store';
import { EventInput } from '@fullcalendar/react';
import TranslateService from '../services/translate-service';
import { CalendarEvent, Coordinate, DistanceResult, LocationData, SidebarEvent } from './interfaces';
import { FLIGHT_KEYWORDS, HOTEL_KEYWORDS } from '../components/map-container/map-container';
import { formatDate, formatTime, getDurationString, toDate } from './time-utils';

export function padTo2Digits(num: number) {
	return num.toString().padStart(2, '0');
}

export function ucfirst(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// loaders
export interface Loader {
	loader: string;
	backgroundColor?: string;
	top?: string;
	textColor?: string;
	titleTextColor?: string;
}
export const LOADERS: Record<string, Partial<Loader>> = {
	'plane1.gif': {
		backgroundColor: '#fcfff5', // done
		top: '30px',
	},
	'plane2.gif': {
		backgroundColor: '#e2f5fc', // done
		top: '30px',
	},
	'plane3.gif': {
		backgroundColor: '#ffffff', // done
		top: '30px',
	},
	'travel1.gif': {
		backgroundColor: '#676f80', // done
		top: '30px',
		textColor: 'white',
	},
	'travel2.gif': {
		backgroundColor: '#41aeb4', // done
		top: '30px',
		textColor: 'white',
	},
	'travel3.gif': {
		backgroundColor: '#c0e2e0', // done
		top: '30px',
	},
	// 'travel4.gif': {
	// 	backgroundColor: '#a7f1fb', // done
	// 	top: '30px',
	// },
	'hotel1.gif': {
		backgroundColor: '#100c33', // done
		top: '30px',
		textColor: 'white',
		titleTextColor: 'white',
	},
	'hotel2.gif': {
		backgroundColor: '#ef9cc8', // done
		top: '30px',
		textColor: 'white',
	},
	// 'hotel3.gif': {
	// 	backgroundColor: '#ffcb3c', // done
	// 	top: '30px',
	// },
	'giphy1.gif': {
		backgroundColor: '#fff',
		top: '30px',
		textColor: 'black',
	},
	'giphy2.gif': {
		backgroundColor: '#fff',
		top: '30px',
		textColor: 'black',
	},
	'giphy3.gif': {
		backgroundColor: '#fff',
		top: '30px',
		textColor: 'black',
	},
	'giphy4.gif': {
		backgroundColor: '#fff',
		top: '30px',
		textColor: 'black',
	},
	'travel5.gif': {
		backgroundColor: '#41aeb4', // done
		top: '30px',
		textColor: 'white',
	},
	'road1.gif': {
		backgroundColor: '#DB7D74', // done
		top: '30px',
		textColor: 'white',
	},
	'road2.gif': {
		backgroundColor: '#FFC100', // done
		top: '30px',
		textColor: 'white',
	},
	'road3.gif': {
		backgroundColor: '#00D158', // done
		top: '30px',
		textColor: 'white',
	},
	'road4.gif': {
		backgroundColor: '#00B7C8', // done
		top: '30px',
		textColor: 'white',
	},
	'travel6.gif': {
		backgroundColor: '#6DDDEB', // done
		top: '30px',
		textColor: 'white',
	},
	'travel7.gif': {
		backgroundColor: '#80E5EB', // done
		top: '30px',
		textColor: 'white',
	},
	'plane4.gif': {
		backgroundColor: '#16B5E4', // done
		top: '30px',
		textColor: 'white',
	},
	'plane5.gif': {
		backgroundColor: '#596285', // done
		top: '30px',
		textColor: 'white',
	},
	// 'plane6.gif': {
	// 	backgroundColor: '#596285', // done
	// 	top: '30px',
	// 	textColor: 'white',
	// },
	'plane7.gif': {
		backgroundColor: '#C5EBF9', // done
		top: '30px',
		textColor: 'black',
	},
};
export function shuffle(array: any[]) {
	let counter = array.length;

	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		let index = Math.floor(Math.random() * counter);

		// Decrease counter by 1
		counter--;

		// And swap the last element with it
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}
export const LOADER_DETAILS = (): Loader => {
	const options = shuffle(Object.keys(LOADERS));

	// @ts-ignore
	let option = LOADERS[options[0]];

	option.loader = `/loaders/${options[0]}`;
	return option as Loader;
};

export function getClasses(...classes: any[]): string {
	return classes.filter(Boolean).join(' ');
	// return _.flatten(classes).filter(Boolean).join(' ');
}

export function priorityKeyToValue(priority: string) {
	const values = Object.keys(TriplanPriority).filter((x) => !Number.isNaN(Number(x)));
	const keys = Object.values(TriplanPriority).filter((x) => Number.isNaN(Number(x)));

	let result = TriplanPriority.unset;

	keys.forEach((key, index) => {
		if (priority && priority.toString() === keys[index].toString()) {
			result = values[index] as unknown as TriplanPriority;
		}
	});
	return result;
}

export function preferredTimeKeyToValue(preferredTime: string) {
	const values = Object.keys(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x)));
	const keys = Object.values(TriplanEventPreferredTime).filter((x) => Number.isNaN(Number(x)));

	let result = TriplanEventPreferredTime.unset;

	keys.forEach((key, index) => {
		if (preferredTime && preferredTime.toString() === keys[index].toString()) {
			result = values[index] as unknown as TriplanEventPreferredTime;
		}
	});
	return result;
}

export function addLineBreaks(str: string, replaceWith: string) {
	return str.replace(/\\n/gi, replaceWith);
}

export function getCoordinatesRangeKey(travelMode: string, startDestination: Coordinate, endDestination: Coordinate) {
	return `[${travelMode}] ${startDestination.lat},${startDestination.lng}-${endDestination.lat},${endDestination.lng}`;
}

export function toDistanceString(
	eventStore: EventStore,
	distanceResult: DistanceResult,
	short: boolean = false,
	travelMode?: GoogleTravelMode,
	showOverDayDistances = true
) {
	let duration = distanceResult.duration;
	let distance = distanceResult.distance;

	if (duration && duration.indexOf('day') !== -1 && !showOverDayDistances) {
		return '';
	}

	if (!travelMode) {
		travelMode = eventStore.travelMode;
	}

	const reachingTo = short ? '' : `${TranslateService.translate(eventStore, 'REACHING_TO_NEXT_DESTINATION')}: `;

	// means there are no ways to get there in this travel mode
	if (!distance || !duration || distance === '-' || duration === '-') {
		return `${reachingTo}${TranslateService.translate(
			eventStore,
			'DISTANCE.ERROR.NO_POSSIBLE_WAY'
		)}${TranslateService.translate(eventStore, 'TRAVEL_MODE.' + eventStore.travelMode.toUpperCase())}`;
	}

	duration = duration.replaceAll('mins', TranslateService.translate(eventStore, 'DURATION.MINS'));
	duration = duration.replaceAll('min', TranslateService.translate(eventStore, 'DURATION.MIN'));
	duration = duration.replaceAll('hours', TranslateService.translate(eventStore, 'DURATION.HOURS'));
	duration = duration.replaceAll('hour', TranslateService.translate(eventStore, 'DURATION.HOUR'));
	duration = duration.replaceAll('day', TranslateService.translate(eventStore, 'DURATION.DAYS'));
	duration = duration.replaceAll('days', TranslateService.translate(eventStore, 'DURATION.DAY'));

	duration = duration.replaceAll('1 שעה', 'שעה');
	duration = duration.replaceAll('1 דקה', 'דקה');

	distance = distance.replaceAll('km', TranslateService.translate(eventStore, 'DISTANCE.KM'));
	distance = distance.replaceAll('m', TranslateService.translate(eventStore, 'DISTANCE.M'));

	let prefix, suffix;

	switch (travelMode) {
		case GoogleTravelMode.TRANSIT:
			prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.DRIVING');
			suffix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.TRANSIT.SUFFIX');
			return `${reachingTo}${prefix} ${duration} (${distance}) ${suffix}`;
		case GoogleTravelMode.DRIVING:
			prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.DRIVING');
			return `${reachingTo}${prefix} ${duration} (${distance})`;
		case GoogleTravelMode.WALKING:
			prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.WALKING');
			return `${reachingTo}${prefix} ${duration} (${distance})`;
		default:
			return '';
	}
}

export function isMatching(str: string = '', options: string[]) {
	let isMatch = false;
	let idx = 0;
	while (!isMatch && idx < options.length) {
		isMatch = str.toLowerCase().indexOf(options[idx].toLowerCase()) !== -1;
		idx++;
	}
	return isMatch;
}

export function isFlight(category: string, title: string) {
	return isMatching(title, FLIGHT_KEYWORDS) || isMatching(category, FLIGHT_KEYWORDS);
}

export function isDessert(category: string, title: string) {
	return isMatching(category, ['desserts', 'קינוחים']) || isMatching(title, ['desserts', 'קינוחים', 'גלידה']);
}

export function isBasketball(category: string, title: string) {
	return isMatching(title, ['basketball', 'כדורסל']);
}

export function isHotel(category: string, title: string) {
	return isMatching(category, HOTEL_KEYWORDS) || isMatching(title, HOTEL_KEYWORDS);
}

export function containsDuplicates(array: any[]) {
	return array.length !== new Set(array).size;
}

export function lockOrderedEvents(calendarEvent: CalendarEvent) {
	// const isOrdered = isEventAlreadyOrdered(calendarEvent);
	// if (isOrdered) {
	// 	// @ts-ignore
	// 	calendarEvent.editable = false;
	// 	// @ts-ignore
	// 	calendarEvent.durationEditable = false;
	// 	// @ts-ignore
	// 	calendarEvent.disableDragging = true;
	// 	// @ts-ignore
	// 	calendarEvent.classNames = calendarEvent.className
	// 		? `${calendarEvent.className.toString().replace(' locked', '')} locked`
	// 		: 'locked';
	// } else {
	// 	// @ts-ignore
	// 	calendarEvent.editable = true;
	// 	// @ts-ignore
	// 	calendarEvent.durationEditable = true;
	// 	// @ts-ignore
	// 	calendarEvent.disableDragging = false;
	// 	// @ts-ignore
	// 	console.log(calendarEvent.classNames);
	// 	// try {
	// 	//     calendarEvent.classNames = calendarEvent.classNames ? calendarEvent.classNames.replaceAll(/\s*locked/ig, '') : undefined;
	// 	// } catch {
	// 	//     console.error("error");
	// 	// }
	// }
	return calendarEvent;
}

export function isEventAlreadyOrdered(calendarEvent: EventInput) {
	return calendarEvent.description && isMatching(calendarEvent.description?.toLowerCase(), ['הוזמן', 'ordered']);
}

export function isDefined(value: any) {
	return typeof value !== 'undefined';
}

export function BuildEventUrl(location: LocationData) {
	if (!location || !location.latitude || !location.longitude) return undefined;
	const lat = location.latitude.toFixed(7);
	const lng = location.longitude.toFixed(7);
	return `https://maps.google.com/maps?q=${lat},${lng}`;
}

export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function coordinateToString(coordinate: Coordinate): string {
	return `${coordinate.lat},${coordinate.lng}`;
}

export function stringToCoordinate(coordinateStr: string): Coordinate | undefined {
	const parts = coordinateStr.split(',');
	if (parts.length !== 2) {
		return undefined;
	}
	if (Number.isNaN(Number(parts[0])) || Number.isNaN(Number(parts[1]))) {
		return undefined;
	}
	return {
		lat: Number(parts[0]),
		lng: Number(parts[1]),
	};
}

export function calendarOrSidebarEventDetails(eventStore: EventStore, event: SidebarEvent | CalendarEvent) {
	const calendarEvent = eventStore.calendarEvents.find((x) => x.id === event.id);

	if (calendarEvent) {
		const dtStart = toDate(calendarEvent.start);
		const dtEnd = toDate(calendarEvent.end);
		const dt = formatDate(dtStart);
		const startTime = dtStart?.toLocaleTimeString('en-US', { hour12: false });
		const endTime = dtEnd?.toLocaleTimeString('en-US', { hour12: false });
		const start = formatTime(startTime);
		const end = formatTime(endTime);

		return `${TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.SCHEDULED_TO')}: ${dt} ${end}-${start}`;
	}
	return TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.SCHEDULED_TO.UNSCHEDULED');
}
