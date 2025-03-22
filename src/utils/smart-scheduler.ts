import { EventStore } from '../stores/events-store';
import { CalendarEvent, SidebarEvent, WeeklyOpeningHoursData, LocationData, DistanceResult } from './interfaces';
import { TriplanEventPreferredTime, TriplanPriority } from './enums';
import { DateRangeFormatted } from '../services/data-handlers/data-handler-base';
import { addDays } from './time-utils';
import { isHotel } from './utils';

/**
 * Priority order for scheduling events
 */
const PRIORITY_ORDER = [
	TriplanPriority.must,
	TriplanPriority.high,
	TriplanPriority.maybe,
	TriplanPriority.least,
	TriplanPriority.unset,
];

/**
 * Calculate the distance between two sets of coordinates
 */
function calculateDistance(coord1: LocationData, coord2: LocationData): number {
	if (!coord1 || !coord2 || !coord1.latitude || !coord1.longitude || !coord2.latitude || !coord2.longitude) {
		return Number.MAX_SAFE_INTEGER;
	}

	// Haversine formula to calculate distance between two points on Earth
	const R = 6371; // Earth's radius in km
	const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
	const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((coord1.latitude * Math.PI) / 180) *
			Math.cos((coord2.latitude * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in km
}

/**
 * Get travel time between locations from EventStore's distanceResults
 */
function getTravelTime(eventStore: EventStore, origin: LocationData, destination: LocationData): number {
	if (
		!origin ||
		!destination ||
		!origin.latitude ||
		!origin.longitude ||
		!destination.latitude ||
		!destination.longitude
	) {
		return 45; // Default 45 minutes (increased from 30)
	}

	const fromCoord = `${origin.latitude},${origin.longitude}`;
	const toCoord = `${destination.latitude},${destination.longitude}`;

	// Try to find the distance result in the event store
	const distanceResult = Array.from(eventStore.distanceResults.values()).find(
		(result) => result.from === fromCoord && result.to === toCoord
	);

	if (distanceResult && distanceResult.duration_value) {
		// Convert seconds to minutes and add a larger buffer (50%)
		return Math.ceil((distanceResult.duration_value / 60) * 1.5);
	}

	// If not found, calculate buffer based on distance
	const distance = calculateDistance(origin, destination);

	// Default buffer based on approximate distance - increased all values
	if (distance === Number.MAX_SAFE_INTEGER) {
		return 45; // Default 45 minutes
	} else if (distance < 1) {
		return 30; // Very short distance: 30 minutes (was 20)
	} else if (distance < 3) {
		return 45; // Short distance: 45 minutes (was 30)
	} else if (distance < 5) {
		return 60; // Medium distance: 60 minutes (was 45)
	} else if (distance < 10) {
		return 90; // Longer distance: 90 minutes (was 60)
	} else {
		return 120; // Very long distance: 120 minutes (was 90)
	}
}

/**
 * Check if a category is food-related
 */
function isFoodRelated(categoryId: number | string): boolean {
	// Based on the provided categories, id 4 is food, id 5 is desserts, id 6 is bars and nightlife
	return [4, 5, 6].includes(Number(categoryId));
}

/**
 * Parse duration string (like "02:30") to minutes
 */
function parseDuration(duration: string | undefined): number {
	if (!duration) return 60; // Default to 1 hour

	// Handle format "12:00" (for 12 hours)
	const parts = duration.split(':');
	if (parts.length === 2) {
		const hours = parseInt(parts[0], 10) || 0;
		const minutes = parseInt(parts[1], 10) || 0;
		return hours * 60 + minutes;
	}

	// Handle format "1h" or "30m" or "1h 30m"
	if (typeof duration === 'string' && (duration.includes('h') || duration.includes('m'))) {
		let totalMinutes = 0;

		const hoursMatch = duration.match(/(\d+)h/);
		if (hoursMatch && hoursMatch[1]) {
			totalMinutes += parseInt(hoursMatch[1], 10) * 60;
		}

		const minutesMatch = duration.match(/(\d+)m/);
		if (minutesMatch && minutesMatch[1]) {
			totalMinutes += parseInt(minutesMatch[1], 10);
		}

		return totalMinutes > 0 ? totalMinutes : 60;
	}

	// If all else fails, try to parse as a number (assuming hours)
	const numericValue = parseFloat(duration);
	if (!isNaN(numericValue)) {
		return numericValue * 60;
	}

	return 60; // Default to 1 hour
}

/**
 * Check if a time slot is available
 */
function isTimeSlotAvailable(startTime: Date, endTime: Date, existingEvents: CalendarEvent[]): boolean {
	return !existingEvents.some((event) => {
		const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
		const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);

		// Check if there's any overlap
		return startTime < eventEnd && endTime > eventStart;
	});
}

/**
 * Check if a venue is open at a given time
 */
function isVenueOpen(day: Date, startTime: Date, endTime: Date, openingHours?: WeeklyOpeningHoursData): boolean {
	if (!openingHours) return true; // Assume always open if no data

	// Get day of week
	const options = { weekday: 'long' as const };
	const dayOfWeek = day.toLocaleDateString('en-US', options).toLowerCase();

	// Match day name to property name in WeeklyOpeningHoursData
	const dayKey = dayOfWeek as keyof WeeklyOpeningHoursData;
	const dayHours = openingHours[dayKey];

	if (!dayHours) return false; // Closed on this day

	// Handle edge case: if open 24/7
	if (dayHours.start === '00:00' && dayHours.end === '00:00') {
		return true;
	}

	// Parse opening hours
	const [openHours, openMinutes] = dayHours.start.split(':').map((n) => parseInt(n, 10));
	const [closeHours, closeMinutes] = dayHours.end.split(':').map((n) => parseInt(n, 10));

	// Create date objects for opening and closing times on the given day
	const openingTime = new Date(day);
	openingTime.setHours(openHours, openMinutes, 0, 0);

	const closingTime = new Date(day);
	closingTime.setHours(closeHours, closeMinutes, 0, 0);

	// If closing time is earlier than opening time, it means closing is on the next day
	if (closingTime <= openingTime) {
		closingTime.setDate(closingTime.getDate() + 1);
	}

	// Check if the event time is within opening hours
	return startTime >= openingTime && endTime <= closingTime;
}

/**
 * Get the ideal hour for an activity based on its category and preferred time
 */
function getIdealTimeForActivity(event: SidebarEvent): { hour: number; minute: number } {
	// First check explicit preferred time
	if (event.preferredTime) {
		// Handle string format of preferred time
		if (typeof event.preferredTime === 'string') {
			const preferredTimeStr = event.preferredTime as string;

			// Check if it's a time format with a colon (e.g. "09:00")
			if (preferredTimeStr.indexOf(':') !== -1) {
				const parts = preferredTimeStr.split(':');
				const hours = parseInt(parts[0], 10);
				const minutes = parseInt(parts[1], 10);
				if (!isNaN(hours) && !isNaN(minutes)) {
					return { hour: hours, minute: minutes };
				}
			}
		}

		// Handle enum or numeric values
		const preferredTimeValue = Number(event.preferredTime);
		if (!isNaN(preferredTimeValue)) {
			// Convert enum values to appropriate times
			switch (preferredTimeValue) {
				case TriplanEventPreferredTime.morning: // 1
					return { hour: 9, minute: 0 };
				case TriplanEventPreferredTime.noon: // 2
					return { hour: 12, minute: 0 };
				case TriplanEventPreferredTime.afternoon: // 3
					return { hour: 15, minute: 0 };
				case TriplanEventPreferredTime.sunset: // 4
					return { hour: 17, minute: 0 };
				case TriplanEventPreferredTime.evening: // 5
					return { hour: 18, minute: 0 };
				case TriplanEventPreferredTime.night: // 7
					return { hour: 20, minute: 0 };
				default:
					// If it's just a number (like 14 for 2PM), use it directly
					if (preferredTimeValue >= 0 && preferredTimeValue <= 23) {
						return { hour: preferredTimeValue, minute: 0 };
					}
					break;
			}
		}
	}

	// If no valid preferred time, infer from category
	const categoryId = typeof event.category === 'string' ? parseInt(event.category, 10) : event.category;

	// Based on provided categories (4: food, 5: desserts, 6: bars and nightlife)
	if (categoryId === 4) {
		// Food
		const title = (event.title || '').toLowerCase();
		if (title.includes('breakfast') || title.includes('cafe') || title.includes('coffee')) {
			return { hour: 9, minute: 0 }; // Breakfast
		} else if (title.includes('lunch')) {
			return { hour: 13, minute: 0 }; // Lunch
		} else if (title.includes('dinner')) {
			return { hour: 19, minute: 0 }; // Dinner
		} else {
			return { hour: 13, minute: 0 }; // Default lunch time
		}
	} else if (categoryId === 5) {
		// Desserts
		return { hour: 15, minute: 30 }; // Afternoon treat
	} else if (categoryId === 6) {
		// Bars and nightlife
		return { hour: 20, minute: 0 }; // Evening
	} else if (categoryId === 7) {
		// Shopping
		return { hour: 11, minute: 0 }; // Late morning
	} else if (categoryId === 8 || categoryId === 11) {
		// Attractions or Tourism
		return { hour: 10, minute: 0 }; // Morning
	} else if (categoryId === 10) {
		// Nature
		return { hour: 10, minute: 0 }; // Morning
	} else if (categoryId === 3) {
		// Hotels
		return { hour: 9, minute: 0 }; // Morning (starting point)
	} else {
		return { hour: 12, minute: 0 }; // Default noon
	}
}

/**
 * Find the optimal time slot for an event
 */
function findOptimalTimeSlot(
	event: SidebarEvent,
	day: Date,
	existingEvents: CalendarEvent[],
	scheduledEvents: CalendarEvent[],
	earliestPossible: Date
): { start: Date; end: Date } | null {
	const durationMinutes = parseDuration(event.duration);

	// Get preferred time, but prioritize explicit preferred time if available
	const { hour, minute } = getIdealTimeForActivity(event);

	// Create ideal start time
	const idealStart = new Date(day);
	idealStart.setHours(hour, minute, 0, 0);

	// Ensure the time is not earlier than the earliest possible time
	const startTime = idealStart < earliestPossible ? new Date(earliestPossible) : new Date(idealStart);
	const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

	// All events to check against
	const allEvents = [...existingEvents, ...scheduledEvents];

	// Check for similar events that might be scheduled right before or after
	const potentialDuplicateEvent = allEvents.find((existingEvent) => {
		// Check if this is potentially the same activity type
		const sameCategory = existingEvent.category === event.category;
		const sameDuration = Math.abs(parseDuration(existingEvent.duration as string) - durationMinutes) < 30; // Within 30 minutes of same duration

		// Don't consider it a duplicate if it's the exact same event ID
		if (existingEvent.id === event.id) return false;

		// Check if the events are scheduled very close to each other
		const existingStart = existingEvent.start instanceof Date ? existingEvent.start : new Date(existingEvent.start);
		const existingEnd = existingEvent.end instanceof Date ? existingEvent.end : new Date(existingEvent.end);

		// Calculate time difference in minutes
		const timeDiffStart = Math.abs(existingStart.getTime() - startTime.getTime()) / (60 * 1000);
		const timeDiffEnd = Math.abs(existingEnd.getTime() - endTime.getTime()) / (60 * 1000);

		// If they have the same category, similar duration, and are scheduled within 2 hours of each other
		return sameCategory && sameDuration && (timeDiffStart < 120 || timeDiffEnd < 120);
	});

	// If we found a potential duplicate, skip the ideal time and try later slots
	if (potentialDuplicateEvent && Math.random() > 0.3) {
		// 70% chance to avoid duplicates
		// Try later in the day instead
		const laterTime = new Date(startTime);
		laterTime.setHours(laterTime.getHours() + 3); // Push 3 hours later

		// Ensure we're not too late in the day
		if (laterTime.getHours() >= 20) {
			laterTime.setHours(10); // Try morning of next day
			laterTime.setDate(laterTime.getDate() + 1);
		}

		// We'll continue with regular time slot finding below
	} else {
		// Check if ideal time works and is within opening hours (if applicable)
		if (
			isTimeSlotAvailable(startTime, endTime, allEvents) &&
			isVenueOpen(day, startTime, endTime, event.openingHours)
		) {
			return { start: startTime, end: endTime };
		}
	}

	// Get preferred time range based on the enum value
	let preferredRange = { start: 9, end: 22 }; // Default range
	if (event.preferredTime) {
		const preferredTimeValue = Number(event.preferredTime);
		switch (preferredTimeValue) {
			case TriplanEventPreferredTime.morning: // 1
				preferredRange = { start: 9, end: 11 }; // 09:00-11:00
				break;
			case TriplanEventPreferredTime.noon: // 2
				preferredRange = { start: 12, end: 16 }; // 12:00-16:00
				break;
			case TriplanEventPreferredTime.afternoon: // 3
				preferredRange = { start: 16, end: 18.5 }; // 16:00-18:30
				break;
			case TriplanEventPreferredTime.sunset: // 4
				preferredRange = { start: 18.5, end: 20 }; // 18:30-20:00
				break;
			case TriplanEventPreferredTime.evening: // 5
				preferredRange = { start: 20, end: 22 }; // 20:00-22:00
				break;
			case TriplanEventPreferredTime.night: // 7
				preferredRange = { start: 22, end: 24 }; // 22:00-00:00
				break;
		}
	}

	// Try different times throughout the day
	// Define time ranges to search - more expansive search with better distribution
	const timeRanges = [
		// First try within the preferred time range
		{
			min: Math.max(9, preferredRange.start),
			max: Math.min(22, preferredRange.end),
			increment: 15,
		},
		// Then try close to the ideal time (±1 hour in 15-minute increments)
		{
			min: Math.max(9, hour - 1),
			max: Math.min(22, hour + 1),
			increment: 15,
		},
		// Then try morning (9-12)
		{ min: 9, max: 12, increment: 15 },
		// Then afternoon (12-17)
		{ min: 12, max: 17, increment: 15 },
		// Then evening (17-22)
		{ min: 17, max: 22, increment: 15 },
	];

	// Try each time range
	for (const range of timeRanges) {
		// Convert non-integer hours to hour + minute
		const minHour = Math.floor(range.min);
		const minMinute = Math.round((range.min - minHour) * 60);
		const maxHour = Math.floor(range.max);
		const maxMinute = Math.round((range.max - maxHour) * 60);

		// Try times within the range at specified increment
		for (let h = minHour; h <= maxHour; h++) {
			const startM = h === minHour ? minMinute : 0;
			const endM = h === maxHour ? maxMinute : 59;

			for (let m = startM; m <= endM; m += range.increment) {
				const testTime = new Date(day);
				testTime.setHours(h, m, 0, 0);

				// Skip times before the earliest possible
				if (testTime < earliestPossible) {
					continue;
				}

				const testEndTime = new Date(testTime.getTime() + durationMinutes * 60 * 1000);

				// Cap end time to 11 PM
				const maxEndTime = new Date(day);
				maxEndTime.setHours(23, 0, 0, 0);

				if (testEndTime > maxEndTime) {
					continue; // Skip if the event would end after 11 PM
				}

				// Check if this time works
				if (
					isTimeSlotAvailable(testTime, testEndTime, allEvents) &&
					isVenueOpen(day, testTime, testEndTime, event.openingHours)
				) {
					return { start: testTime, end: testEndTime };
				}
			}
		}
	}

	// If we couldn't find a time that respects opening hours, try without that constraint
	// But only for non-crucial places (maybe/least priority)
	if (
		event.openingHours &&
		(event.priority === TriplanPriority.maybe ||
			event.priority === TriplanPriority.least ||
			event.priority === TriplanPriority.unset)
	) {
		for (const range of timeRanges) {
			const minHour = Math.floor(range.min);
			const minMinute = Math.round((range.min - minHour) * 60);
			const maxHour = Math.floor(range.max);
			const maxMinute = Math.round((range.max - maxHour) * 60);

			for (let h = minHour; h <= maxHour; h++) {
				const startM = h === minHour ? minMinute : 0;
				const endM = h === maxHour ? maxMinute : 59;

				for (let m = startM; m <= endM; m += range.increment) {
					const testTime = new Date(day);
					testTime.setHours(h, m, 0, 0);

					if (testTime < earliestPossible) {
						continue;
					}

					const testEndTime = new Date(testTime.getTime() + durationMinutes * 60 * 1000);
					const maxEndTime = new Date(day);
					maxEndTime.setHours(23, 0, 0, 0);

					if (testEndTime > maxEndTime) {
						continue;
					}

					if (isTimeSlotAvailable(testTime, testEndTime, allEvents)) {
						console.warn(`Scheduled event outside opening hours (as fallback): ${event.title}`);
						return { start: testTime, end: testEndTime };
					}
				}
			}
		}
	}

	return null; // No suitable time found
}

/**
 * Group events by geographic proximity
 */
function groupByProximity(events: SidebarEvent[]): SidebarEvent[][] {
	const MAX_DISTANCE_FOR_GROUP = 3; // Max distance in km to consider events "nearby" (reduced from 4km)
	const MAX_GROUP_SIZE = 3; // Limit number of events in a proximity group for more balanced days
	const groups: SidebarEvent[][] = [];
	const processedEvents = new Set<string>();

	// Separate events with and without valid locations
	const eventsWithLocation = events.filter((e) => e.location && e.location.latitude && e.location.longitude);

	const eventsWithoutLocation = events.filter((e) => !e.location || !e.location.latitude || !e.location.longitude);

	// Create proximity groups for events with locations
	for (const event of eventsWithLocation) {
		if (processedEvents.has(event.id)) continue;

		const group: SidebarEvent[] = [event];
		processedEvents.add(event.id);

		// If this is a food-related event, maybe don't group it
		if (
			event.category &&
			isFoodRelated(event.category) &&
			Math.random() > 0.5 // 50% chance to keep food events separate for better distribution
		) {
			groups.push(group);
			continue;
		}

		const remainingEvents = eventsWithLocation.filter((e) => !processedEvents.has(e.id));

		// Add nearby events to this group, up to the max group size
		while (remainingEvents.length > 0 && group.length < MAX_GROUP_SIZE) {
			const lastEvent = group[group.length - 1];
			let nearestEvent: SidebarEvent | null = null;
			let minDistance = Number.MAX_SAFE_INTEGER;

			for (const candidate of remainingEvents) {
				// Don't group food-related events with non-food events
				if (
					(isFoodRelated(lastEvent.category) && !isFoodRelated(candidate.category)) ||
					(!isFoodRelated(lastEvent.category) && isFoodRelated(candidate.category))
				) {
					continue;
				}

				const distance = calculateDistance(lastEvent.location, candidate.location);
				if (distance < minDistance) {
					minDistance = distance;
					nearestEvent = candidate;
				}
			}

			// Only add the event if it's within the distance threshold
			if (minDistance <= MAX_DISTANCE_FOR_GROUP && nearestEvent) {
				group.push(nearestEvent);
				processedEvents.add(nearestEvent.id);
				const index = remainingEvents.findIndex((e) => e.id === nearestEvent!.id);
				remainingEvents.splice(index, 1);
			} else {
				break;
			}
		}

		groups.push(group);
	}

	// Add events without location as individual groups
	for (const event of eventsWithoutLocation) {
		if (!processedEvents.has(event.id)) {
			groups.push([event]);
			processedEvents.add(event.id);
		}
	}

	return groups;
}

/**
 * Find hotel events to add as starting points for each day
 */
function findHotelEvents(events: SidebarEvent[]): SidebarEvent[] {
	const hotelEvents = events.filter((event) => isHotel(event.category, event.title));

	if (hotelEvents.length > 0) {
		return hotelEvents;
	}

	// If no hotel events found, look for events with "hotel" in the title
	const hotelByTitle = events.filter((event) => event.title && event.title.toLowerCase().includes('hotel'));

	if (hotelByTitle.length > 0) {
		return hotelByTitle;
	}

	return []; // No hotel events found
}

/**
 * Create a hotel event for the start of the day
 */
function createHotelStartEvent(hotelEvent: SidebarEvent, day: Date, counter: number): SidebarEvent {
	// Clone the hotel event and adjust for start of day
	const morningHotelEvent: SidebarEvent = {
		...JSON.parse(JSON.stringify(hotelEvent)),
		id: `${hotelEvent.id}_morning_${counter}`,
		title: `${hotelEvent.title} (Start Day ${counter + 1})`,
		duration: '00:30', // 30 minutes duration
		preferredTime: '09:00', // Start at 9 AM
	};

	return morningHotelEvent;
}

/**
 * Main function to generate a smart schedule
 */
export async function generateSmartSchedule(
	eventStore: EventStore,
	sidebarEvents: Record<number, SidebarEvent[]>,
	dateRange: DateRangeFormatted
): Promise<CalendarEvent[]> {
	// Flatten sidebar events - use JSON.parse(JSON.stringify()) to create deep copies
	let allEvents: SidebarEvent[] = [];
	Object.values(sidebarEvents).forEach((events) => {
		// Create deep copies to avoid mutating original events
		allEvents = allEvents.concat(events.map((event) => JSON.parse(JSON.stringify(event))));
	});

	// Sort events by priority
	allEvents.sort((a, b) => {
		const priorityA = PRIORITY_ORDER.indexOf((a.priority as TriplanPriority) || TriplanPriority.unset);
		const priorityB = PRIORITY_ORDER.indexOf((b.priority as TriplanPriority) || TriplanPriority.unset);
		return priorityA - priorityB;
	});

	// Find hotel events to use as starting points for each day
	let hotelEvents = findHotelEvents(allEvents);

	// Setup date range
	const startDate = new Date(dateRange.start);
	const endDate = new Date(dateRange.end);
	const daysCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	// Generate days array
	const days: Date[] = [];
	for (let i = 0; i < daysCount; i++) {
		days.push(addDays(new Date(startDate), i));
	}

	// Get existing calendar events (clone to avoid modifying the originals)
	const existingCalendarEvents = eventStore.calendarEvents.map((event) => {
		const eventCopy = JSON.parse(JSON.stringify(event));
		// Ensure Date objects are properly reconstructed
		eventCopy.start = new Date(event.start);
		eventCopy.end = new Date(event.end);
		return eventCopy;
	});

	// We need at least one hotel event for proper scheduling - create a dummy one if none exists
	if (hotelEvents.length === 0) {
		const dummyHotel: SidebarEvent = {
			id: 'dummy_hotel_' + new Date().getTime(),
			title: 'Starting Point',
			category: '3', // Hotel category as string
			duration: '00:30',
			preferredTime: TriplanEventPreferredTime.morning,
			location: null,
			priority: TriplanPriority.must,
		};
		hotelEvents = [dummyHotel];
	}

	// Groups events by geographic proximity
	const proximityGroups = groupByProximity(allEvents);

	// Separate events by type for better distribution
	const foodGroups = proximityGroups.filter((group) =>
		group.some((event) => event.category && isFoodRelated(event.category))
	);

	const attractionGroups = proximityGroups.filter(
		(group) => !group.some((event) => event.category && isFoodRelated(event.category))
	);

	// Further prioritize groups by priority level
	const mustGroups = attractionGroups.filter((group) =>
		group.some((event) => event.priority === TriplanPriority.must)
	);

	const highGroups = attractionGroups.filter(
		(group) =>
			!group.some((event) => event.priority === TriplanPriority.must) &&
			group.some((event) => event.priority === TriplanPriority.high)
	);

	const otherGroups = attractionGroups.filter(
		(group) =>
			!group.some((event) => event.priority === TriplanPriority.must || event.priority === TriplanPriority.high)
	);

	// Calculate minimum and maximum number of groups per day to ensure balanced distribution
	const totalGroups = mustGroups.length + highGroups.length + otherGroups.length + foodGroups.length;
	const MIN_GROUPS_PER_DAY = Math.max(2, Math.floor(totalGroups / daysCount)); // At least 2 groups per day
	const MAX_GROUPS_PER_DAY = Math.min(5, Math.ceil(totalGroups / daysCount) + 1); // No more than 5 groups per day (reduced from 8)

	// A set to track which events have been scheduled to avoid duplicates
	const scheduledEventIds = new Set<string>();

	// Distribute groups evenly across days
	const groupsPerDay: Record<number, SidebarEvent[][]> = {};

	// Initialize empty arrays for each day
	for (let i = 0; i < days.length; i++) {
		groupsPerDay[i] = [];
	}

	// First pass: ensure every day has at least one must-see group if available
	for (let dayIndex = 0; dayIndex < Math.min(days.length, mustGroups.length); dayIndex++) {
		groupsPerDay[dayIndex].push(mustGroups[dayIndex]);
		// Mark all events in this group as scheduled
		mustGroups[dayIndex].forEach((event) => scheduledEventIds.add(event.id));
	}

	// Second pass: distribute remaining must-see groups
	for (let i = days.length; i < mustGroups.length; i++) {
		// Find the day with the fewest groups
		let dayWithFewestGroups = 0;
		for (let j = 1; j < days.length; j++) {
			if (groupsPerDay[j].length < groupsPerDay[dayWithFewestGroups].length) {
				dayWithFewestGroups = j;
			}
		}

		// Only add if we haven't reached the maximum
		if (groupsPerDay[dayWithFewestGroups].length < MAX_GROUPS_PER_DAY) {
			// Check if any event in this group is already scheduled
			const hasScheduledEvent = mustGroups[i].some((event) => scheduledEventIds.has(event.id));
			if (!hasScheduledEvent) {
				groupsPerDay[dayWithFewestGroups].push(mustGroups[i]);
				mustGroups[i].forEach((event) => scheduledEventIds.add(event.id));
			}
		}
	}

	// Third pass: distribute high priority groups
	for (let i = 0; i < highGroups.length; i++) {
		// Find the day with the fewest groups
		let dayWithFewestGroups = 0;
		for (let j = 1; j < days.length; j++) {
			if (groupsPerDay[j].length < groupsPerDay[dayWithFewestGroups].length) {
				dayWithFewestGroups = j;
			}
		}

		// Only add if we haven't reached the maximum
		if (groupsPerDay[dayWithFewestGroups].length < MAX_GROUPS_PER_DAY) {
			// Check if any event in this group is already scheduled
			const hasScheduledEvent = highGroups[i].some((event) => scheduledEventIds.has(event.id));
			if (!hasScheduledEvent) {
				groupsPerDay[dayWithFewestGroups].push(highGroups[i]);
				highGroups[i].forEach((event) => scheduledEventIds.add(event.id));
			}
		}
	}

	// Fourth pass: distribute other attraction groups
	for (let i = 0; i < otherGroups.length; i++) {
		// Find the day with the fewest groups
		let dayWithFewestGroups = 0;
		for (let j = 1; j < days.length; j++) {
			if (groupsPerDay[j].length < groupsPerDay[dayWithFewestGroups].length) {
				dayWithFewestGroups = j;
			}
		}

		// Only add if we haven't reached the maximum
		if (groupsPerDay[dayWithFewestGroups].length < MAX_GROUPS_PER_DAY) {
			// Check if any event in this group is already scheduled
			const hasScheduledEvent = otherGroups[i].some((event) => scheduledEventIds.has(event.id));
			if (!hasScheduledEvent) {
				groupsPerDay[dayWithFewestGroups].push(otherGroups[i]);
				otherGroups[i].forEach((event) => scheduledEventIds.add(event.id));
			}
		}
	}

	// Distribute food events across days - try to add breakfast, lunch, dinner to each day
	// Categorize food events by preferred time
	const breakfastEvents = foodGroups.filter((group) => {
		const event = group[0]; // Usually food groups are singular
		const { hour } = getIdealTimeForActivity(event);
		return hour < 11;
	});

	const lunchEvents = foodGroups.filter((group) => {
		const event = group[0];
		const { hour } = getIdealTimeForActivity(event);
		return hour >= 11 && hour < 16;
	});

	const dinnerEvents = foodGroups.filter((group) => {
		const event = group[0];
		const { hour } = getIdealTimeForActivity(event);
		return hour >= 16;
	});

	// Fifth pass: Add one breakfast, lunch, and dinner to each day if available
	for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
		// Add breakfast
		for (let i = 0; i < breakfastEvents.length; i++) {
			if (groupsPerDay[dayIndex].length < MAX_GROUPS_PER_DAY) {
				const hasScheduledEvent = breakfastEvents[i].some((event) => scheduledEventIds.has(event.id));
				if (!hasScheduledEvent) {
					groupsPerDay[dayIndex].push(breakfastEvents[i]);
					breakfastEvents[i].forEach((event) => scheduledEventIds.add(event.id));
					break;
				}
			}
		}

		// Add lunch
		for (let i = 0; i < lunchEvents.length; i++) {
			if (groupsPerDay[dayIndex].length < MAX_GROUPS_PER_DAY) {
				const hasScheduledEvent = lunchEvents[i].some((event) => scheduledEventIds.has(event.id));
				if (!hasScheduledEvent) {
					groupsPerDay[dayIndex].push(lunchEvents[i]);
					lunchEvents[i].forEach((event) => scheduledEventIds.add(event.id));
					break;
				}
			}
		}

		// Add dinner
		for (let i = 0; i < dinnerEvents.length; i++) {
			if (groupsPerDay[dayIndex].length < MAX_GROUPS_PER_DAY) {
				const hasScheduledEvent = dinnerEvents[i].some((event) => scheduledEventIds.has(event.id));
				if (!hasScheduledEvent) {
					groupsPerDay[dayIndex].push(dinnerEvents[i]);
					dinnerEvents[i].forEach((event) => scheduledEventIds.add(event.id));
					break;
				}
			}
		}
	}

	// Sixth pass: Make sure every day has at least MIN_GROUPS_PER_DAY events
	// Collect all remaining unscheduled groups
	const allRemainingGroups = [...mustGroups, ...highGroups, ...otherGroups, ...foodGroups].filter(
		(group) => !group.some((event) => scheduledEventIds.has(event.id))
	);

	// Add events to days that have fewer than MIN_GROUPS_PER_DAY
	for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
		while (groupsPerDay[dayIndex].length < MIN_GROUPS_PER_DAY && allRemainingGroups.length > 0) {
			const group = allRemainingGroups.shift();
			if (group) {
				groupsPerDay[dayIndex].push(group);
				group.forEach((event) => scheduledEventIds.add(event.id));
			} else {
				break; // No more groups to add
			}
		}
	}

	// Setup the final scheduled events array
	const scheduledEvents: CalendarEvent[] = [];

	// For each day, schedule events
	for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
		const currentDay = days[dayIndex];
		const groupsForThisDay = groupsPerDay[dayIndex];

		// Start the day with a hotel event
		let earliestTimeForDay = new Date(currentDay);
		earliestTimeForDay.setHours(9, 0, 0, 0);

		// Always add a hotel event at the start of the day
		const hotelEvent = createHotelStartEvent(hotelEvents[0], currentDay, dayIndex);
		const hotelTimeSlot = findOptimalTimeSlot(
			hotelEvent,
			currentDay,
			existingCalendarEvents,
			scheduledEvents,
			earliestTimeForDay
		);

		if (hotelTimeSlot) {
			// Add hotel event to start the day
			const newEvent: CalendarEvent = {
				...hotelEvent,
				start: hotelTimeSlot.start,
				end: hotelTimeSlot.end,
				allDay: false,
			};
			scheduledEvents.push(newEvent);

			// Update earliest possible time
			earliestTimeForDay = new Date(hotelTimeSlot.end);
		}

		// Sort the groups to prioritize food at meal times and attractions in between
		const sortedGroups = [...groupsForThisDay].sort((a, b) => {
			const aIsFood = a.some((event) => event.category && isFoodRelated(event.category));
			const bIsFood = b.some((event) => event.category && isFoodRelated(event.category));

			if (aIsFood && !bIsFood) {
				return 1; // Food after attractions
			} else if (!aIsFood && bIsFood) {
				return -1; // Attractions before food
			} else if (aIsFood && bIsFood) {
				// Sort food events by preferred time
				const aHour = getIdealTimeForActivity(a[0]).hour;
				const bHour = getIdealTimeForActivity(b[0]).hour;
				return aHour - bHour;
			} else {
				// For non-food events, sort by priority
				const aPriority = PRIORITY_ORDER.indexOf((a[0].priority as TriplanPriority) || TriplanPriority.unset);
				const bPriority = PRIORITY_ORDER.indexOf((b[0].priority as TriplanPriority) || TriplanPriority.unset);
				return aPriority - bPriority;
			}
		});

		// Process each group for this day
		for (const group of sortedGroups) {
			// For each group, schedule events in sequence
			let lastEventLocation = null;
			let lastEventEnd = new Date(earliestTimeForDay);

			for (const event of group) {
				// Calculate buffer time based on travel distance from last event
				let bufferTime = 0;
				if (lastEventLocation && event.location) {
					bufferTime = getTravelTime(eventStore, lastEventLocation, event.location);
				}

				// Add a minimum buffer of 30 minutes even for nearby locations
				bufferTime = Math.max(bufferTime, 30);

				// Earliest possible time for this event
				const earliestPossible = new Date(lastEventEnd.getTime() + bufferTime * 60 * 1000);

				// Find a suitable time slot
				const timeSlot = findOptimalTimeSlot(
					event,
					currentDay,
					existingCalendarEvents,
					scheduledEvents,
					earliestPossible
				);

				if (timeSlot) {
					// Create calendar event
					const newEvent: CalendarEvent = {
						...event,
						start: timeSlot.start,
						end: timeSlot.end,
						allDay: false,
					};

					scheduledEvents.push(newEvent);

					// Update last event info for the next event in this group
					lastEventLocation = event.location;
					lastEventEnd = new Date(timeSlot.end);
				} else {
					// If we couldn't schedule this event today, try it on another day
					let scheduled = false;

					for (let altDayIndex = 0; altDayIndex < days.length; altDayIndex++) {
						if (altDayIndex === dayIndex) continue; // Skip current day

						const alternativeDay = days[altDayIndex];
						const morningTime = new Date(alternativeDay);
						morningTime.setHours(9, 0, 0, 0);

						const alternativeTimeSlot = findOptimalTimeSlot(
							event,
							alternativeDay,
							existingCalendarEvents,
							scheduledEvents,
							morningTime
						);

						if (alternativeTimeSlot) {
							const newEvent: CalendarEvent = {
								...event,
								start: alternativeTimeSlot.start,
								end: alternativeTimeSlot.end,
								allDay: false,
							};

							scheduledEvents.push(newEvent);
							scheduled = true;
							break;
						}
					}

					if (!scheduled) {
						console.warn(`Could not schedule event: ${event.title}`);
					}
				}
			}
		}
	}

	return scheduledEvents;
}
