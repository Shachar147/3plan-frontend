import { EventStore } from '../stores/events-store';
import { CalendarEvent, SidebarEvent, TriPlanCategory } from '../utils/interfaces';

/**
 * Configuration for auto-scheduling
 */
export interface AutoScheduleConfig {
	foodCategoryId?: number;
	hotelCategoryId?: number;
	dessertCategoryId?: number;
	selectedHotelEventId?: string;
	travelBufferMinutes: number;
	tripStartDate: string;
	tripEndDate: string;
}

/**
 * Result of the scheduling process
 */
export interface SchedulingResult {
	scheduledEvents: CalendarEvent[];
	unscheduledEvents: SidebarEvent[];
	warnings: string[];
}

/**
 * Auto Schedule Service - Phase 1: Hotel Scheduling Only
 * Handles scheduling of the selected hotel at the beginning of each day
 */
export class AutoScheduleService {
	/**
	 * Auto-detect food/hotel/dessert categories
	 */
	static detectCategories(eventStore: EventStore): { food?: number; hotel?: number; dessert?: number } {
		const result: { food?: number; hotel?: number; dessert?: number } = {};

		eventStore.categories.forEach((category: TriPlanCategory) => {
			// Check by titleKey first
			if (category.titleKey === 'CATEGORY.FOOD') {
				result.food = category.id;
			} else if (category.titleKey === 'CATEGORY.HOTELS') {
				result.hotel = category.id;
			} else if (category.titleKey === 'CATEGORY.DESSERTS') {
				result.dessert = category.id;
			}
			// Fallback to translated titles
			else if (category.title === 'Food' || category.title === 'אוכל') {
				result.food = category.id;
			} else if (category.title === 'Hotels' || category.title === 'בתי מלון') {
				result.hotel = category.id;
			} else if (category.title === 'Desserts' || category.title === 'קינוחים') {
				result.dessert = category.id;
			}
		});

		return result;
	}

	/**
	 * Get all hotel events from a specific category
	 */
	static getHotelEvents(eventStore: EventStore, hotelCategoryId: number): SidebarEvent[] {
		// Get all sidebar events (unscheduled events)
		const allSidebarEvents = Object.values(eventStore.sidebarEvents).flat();

		// Filter for hotel events in the specified category
		const hotelEvents = allSidebarEvents.filter((event) => {
			const eventCategory = event.category?.toString();
			const targetCategory = hotelCategoryId.toString();
			return eventCategory === targetCategory;
		});

		return hotelEvents;
	}

	/**
	 * Validate configuration - Phase 1: Only hotel validation
	 */
	static validateConfig(config: AutoScheduleConfig): { valid: boolean; missingFields: string[] } {
		const missingFields: string[] = [];

		if (!config.hotelCategoryId) missingFields.push('Hotel Category');
		if (!config.selectedHotelEventId) missingFields.push('Selected Hotel');
		if (!config.tripStartDate) missingFields.push('Trip Start Date');
		if (!config.tripEndDate) missingFields.push('Trip End Date');

		return {
			valid: missingFields.length === 0,
			missingFields,
		};
	}

	/**
	 * Main scheduling algorithm - Phase 1: Hotel scheduling only
	 */
	static scheduleEvents(eventStore: EventStore, config: AutoScheduleConfig): SchedulingResult {
		console.log('🚀 AutoScheduleService.scheduleEvents (Phase 1 - Hotel Only) called with config:', config);

		const scheduledEvents: CalendarEvent[] = [];
		const unscheduledEvents: SidebarEvent[] = [];
		const warnings: string[] = [];

		try {
			// Find the selected hotel event
			const hotelEvent = this.findSelectedHotelEvent(eventStore, config);

			if (!hotelEvent) {
				warnings.push('Selected hotel event not found');
				console.log('⚠️ Selected hotel event not found');
				return { scheduledEvents, unscheduledEvents, warnings };
			}

			console.log('🏨 Found selected hotel event:', { id: hotelEvent.id, title: hotelEvent.title });

			// Generate dates for the trip
			const tripDates = this.generateTripDates(config.tripStartDate, config.tripEndDate);
			console.log('📅 Trip dates generated:', tripDates.length, 'days');

			// Schedule hotel for each day
			tripDates.forEach((date, index) => {
				const hotelCalendarEvent = this.createHotelCalendarEvent(hotelEvent, date, config);
				scheduledEvents.push(hotelCalendarEvent);
				console.log(`🏨 Scheduled hotel for day ${index + 1}: ${date.toDateString()} at 08:00-09:00`);
			});

			// Actually schedule the events to the calendar
			this.scheduleEventsToCalendar(eventStore, scheduledEvents, warnings);

			console.log('✅ Hotel scheduling completed. Total scheduled events:', scheduledEvents.length);
		} catch (error) {
			warnings.push(`Scheduling error: ${error.message}`);
			console.error('❌ Error during hotel scheduling:', error);
		}

		return { scheduledEvents, unscheduledEvents, warnings };
	}

	/**
	 * Find the selected hotel event from the event store
	 */
	private static findSelectedHotelEvent(eventStore: EventStore, config: AutoScheduleConfig): SidebarEvent | null {
		// Look in the hotel category's sidebar events
		const hotelCategoryEvents = eventStore.sidebarEvents[config.hotelCategoryId!];

		if (!hotelCategoryEvents) {
			console.log('⚠️ No events found in hotel category:', config.hotelCategoryId);
			return null;
		}

		const selectedHotel = hotelCategoryEvents.find((event) => event.id === config.selectedHotelEventId);

		if (!selectedHotel) {
			console.log('⚠️ Selected hotel event not found in category events:', {
				selectedHotelEventId: config.selectedHotelEventId,
				availableEvents: hotelCategoryEvents.map((e) => ({ id: e.id, title: e.title })),
			});
		}

		return selectedHotel || null;
	}

	/**
	 * Generate array of dates for the trip period
	 */
	private static generateTripDates(startDate: string, endDate: string): Date[] {
		const dates: Date[] = [];
		const start = new Date(startDate);
		const end = new Date(endDate);

		for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
			dates.push(new Date(date));
		}

		return dates;
	}

	/**
	 * Create a calendar event for the hotel at 08:00-09:00
	 */
	private static createHotelCalendarEvent(
		hotelEvent: SidebarEvent,
		date: Date,
		config: AutoScheduleConfig
	): CalendarEvent {
		const hotelStart = new Date(date);
		hotelStart.setHours(8, 0, 0, 0);

		const hotelEnd = new Date(date);
		hotelEnd.setHours(9, 0, 0, 0);

		return {
			...hotelEvent,
			allDay: false,
			start: hotelStart,
			end: hotelEnd,
			category: config.hotelCategoryId!.toString(),
			duration: '01:00', // 1 hour for morning routine
		};
	}

	/**
	 * Schedule events to the calendar by setting them in the event store
	 */
	private static scheduleEventsToCalendar(
		eventStore: EventStore,
		scheduledEvents: CalendarEvent[],
		warnings: string[]
	): void {
		try {
			console.log('📅 Scheduling events to calendar...');

			// Set the auto-scheduled events in the event store
			eventStore.setAutoScheduledEvents(scheduledEvents);

			// Show the auto-schedule banner so user can save or discard
			eventStore.setShowAutoScheduleBanner(true);

			// Set any warnings
			if (warnings.length > 0) {
				eventStore.setAutoScheduleWarnings(warnings);
			}

			console.log('✅ Events scheduled to calendar. Banner should now be visible.');
		} catch (error) {
			console.error('❌ Error scheduling events to calendar:', error);
			warnings.push(`Failed to schedule events to calendar: ${error.message}`);
		}
	}
}
