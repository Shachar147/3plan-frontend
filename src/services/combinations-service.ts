import { SidebarEvent, CalendarEvent, TriPlanCategory, DistanceResult } from '../utils/interfaces';
import { TriplanPriority, GoogleTravelMode, TriplanEventPreferredTime } from '../utils/enums';
import { ObservableMap } from 'mobx';
import { getCoordinatesRangeKey, isMatching } from '../utils/utils';
import TranslateService from './translate-service';
import { EventStore } from '../stores/events-store';
import { getDurationInMs, roundTo15Minutes } from '../utils/time-utils';
import { STORE_KEYWORDS, TOURIST_KEYWORDS, NATURE_KEYWORDS } from '../components/map-container/map-container-utils';

// todo list:
// 1. GENERAL - go over combinations service, reduce code duplication, understand it and improve stuff.
// 2. ORDER IMPROVEMENT - sometimes it order things 1-2-4-3, check if we can improve it.
// 3. LOGIC - create combination of shopping, combination for morning close by events, noon closeby, etc. (by preferred time)
// 4. CALENDAR - ensure the time it shows === the actual time in the calendar
// 5. CALENDAR - improve how it behaves when changing group size / events within the group.
// ! 6. DISTANCE - allow the user if he wants to rather WALKING over DRIVING, on this case use it.

export interface SuggestedCombination {
	id: string;
	events: SidebarEvent[]; // ordered
	totalDuration: number; // in minutes
	travelTimeBetween: number[]; // travel time between consecutive events
	travelModeBetween: string[]; // travel mode between consecutive events ('WALKING' or 'DRIVING')
	hasScheduledEvents: boolean; // if any event is on calendar
	isShoppingDay: boolean;
	suggestedName: string; // e.g., "Shopping Day", "Must-See Tour", "Activities around X"
}

const isDebug = false;

export class CombinationsService {
	private static readonly MAX_TRAVEL_TIME = 30; // minutes (30 minutes between activities)
	private static readonly MAX_COMBINATION_DURATION = 10 * 60; // 10 hours in minutes
	private static readonly MAX_SHOPPING_DURATION = 12 * 60; // 12 hours in minutes
	private static readonly MAX_TIME_BASED_DURATION = 5 * 60; // 5 hours for time-based combinations
	private static readonly MAX_CATEGORY_DURATION = 10 * 60; // 10 hours for category-based combinations
	private static readonly MAX_COMBINATIONS = 10; // maximum number of combinations to generate
	private static readonly ALLOWED_PRIORITIES = [TriplanPriority.must, TriplanPriority.high, TriplanPriority.maybe]; // filter events to these priorities.
	private static readonly COMBINATION_MUST_PRIORITY = [
		TriplanPriority.must,
		TriplanPriority.high,
		TriplanPriority.maybe,
	]; // build combination around even with this priority
	// private static readonly ALLOWED_TRAVEL_MODES = [GoogleTravelMode.WALKING, GoogleTravelMode.DRIVING]; // allowed travel modes for combinations
	private static readonly ALLOWED_TRAVEL_MODES = [GoogleTravelMode.WALKING]; // allowed travel modes for combinations

	/**
	 * Generate suggested combinations based on proximity, priority, and travel time
	 */
	static generateCombinations(
		events: SidebarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>,
		calendarEvents: CalendarEvent[],
		categories: TriPlanCategory[],
		eventStore: EventStore
	): SuggestedCombination[] {
		// Filter events to only include allowed priorities and those with locations
		const filteredEvents = events.filter((event) => {
			// Convert priority to number if it's a string
			const priority = typeof event.priority === 'string' ? parseInt(event.priority) : event.priority;
			const hasValidPriority = this.ALLOWED_PRIORITIES.includes(priority || TriplanPriority.unset);
			const hasLocation = event.location?.latitude && event.location?.longitude;

			return hasValidPriority && hasLocation;
		});

		// Get all "must" priority events as seeds, but limit to prevent too many combinations
		const mustEvents = filteredEvents.filter((event) => {
			const priority = typeof event.priority === 'string' ? parseInt(event.priority) : event.priority;
			return this.COMBINATION_MUST_PRIORITY.includes(priority);
		});

		if (mustEvents.length === 0) {
			return []; // No combinations possible
		}

		const combinations: SuggestedCombination[] = [];

		// Shuffle must events to ensure variety in combinations
		const shuffledMustEvents = [...mustEvents].sort(() => Math.random() - 0.5);

		// Use more seed events to generate more combinations (up to 20 or all must events)
		const maxSeedEvents = Math.min(shuffledMustEvents.length, 20);
		const seedEvents = shuffledMustEvents.slice(0, maxSeedEvents);

		// Generate combinations starting from each "must" event
		if (isDebug) console.log('Debug - starting combination generation with', seedEvents.length, 'seed events');
		const usedSeedEvents = new Set<string>();

		for (let i = 0; i < seedEvents.length; i++) {
			const seedEvent = seedEvents[i];

			// Stop if we've reached the maximum number of combinations
			if (combinations.length >= this.MAX_COMBINATIONS) {
				break;
			}

			// Skip if we've already used this seed event
			if (usedSeedEvents.has(seedEvent.id)) {
				continue;
			}

			if (isDebug) console.log('Debug - building combination from seed:', seedEvent.title);
			const combination = this.buildCombinationFromSeed(
				seedEvent,
				filteredEvents,
				distanceResults,
				calendarEvents,
				categories,
				eventStore
			);

			if (combination && combination.events.length > 1) {
				if (isDebug) console.log('Debug - created combination with', combination.events.length, 'events');
				combinations.push(combination);

				// Only mark the seed event as used, not all events in the combination
				usedSeedEvents.add(seedEvent.id);
			} else {
				if (isDebug) console.log('Debug - combination was null or too short');
			}
		}

		if (isDebug) console.log('Debug - total combinations generated:', combinations.length);

		// Remove duplicates and rank by quality
		const uniqueCombinations = this.removeDuplicateCombinations(combinations);
		if (isDebug) console.log('Debug - unique combinations after deduplication:', uniqueCombinations.length);

		const rankedCombinations = this.rankCombinations(uniqueCombinations);
		if (isDebug) console.log('Debug - final combinations after ranking:', rankedCombinations.length);

		// Return only the top combinations (max 10)
		return rankedCombinations.slice(0, this.MAX_COMBINATIONS);
	}

	/**
	 * Generate more combinations excluding already shown ones
	 */
	static async generateMoreCombinations(
		events: SidebarEvent[],
		calendarEvents: CalendarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>,
		categories: TriPlanCategory[],
		shownCombinationIds: Set<string>,
		eventStore: EventStore
	): Promise<SuggestedCombination[]> {
		if (isDebug)
			console.log('Debug - generating more combinations, excluding', shownCombinationIds.size, 'already shown');

		// Generate all possible combinations first
		const allCombinations = this.generateCombinations(
			events,
			distanceResults,
			calendarEvents,
			categories,
			eventStore
		);

		// Filter out already shown combinations
		const newCombinations = allCombinations.filter((combination) => !shownCombinationIds.has(combination.id));

		return newCombinations;
	}

	/**
	 * Build a combination starting from a seed "must" event
	 */
	private static buildCombinationFromSeed(
		seedEvent: SidebarEvent,
		allEvents: SidebarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>,
		calendarEvents: CalendarEvent[],
		categories: TriPlanCategory[],
		eventStore: EventStore
	): SuggestedCombination | null {
		const combination: SidebarEvent[] = [seedEvent];
		const usedEventIds = new Set([seedEvent.id]);
		const usedLocations = new Set([this.getLocationKey(seedEvent)]);
		let currentEvent = seedEvent;
		let totalDuration = this.getEventDuration(seedEvent);
		let iterationCount = 0;
		const maxIterations = 20; // Safety limit to prevent infinite loops

		// Determine combination type based on seed event
		const combinationType = this.determineCombinationType(seedEvent, categories);

		// Continue adding events using greedy nearest-neighbor approach
		if (isDebug) console.log('Debug - starting combination build for:', seedEvent.title);
		while (iterationCount < maxIterations) {
			iterationCount++;

			const nextEvent = this.findNearestCompatibleEvent(
				currentEvent,
				allEvents,
				usedEventIds,
				usedLocations,
				distanceResults,
				totalDuration,
				combinationType,
				categories
			);

			if (!nextEvent) {
				if (isDebug) console.log('Debug - no more compatible events found at iteration', iterationCount);
				break; // No more compatible events
			}

			combination.push(nextEvent);
			usedEventIds.add(nextEvent.id);
			usedLocations.add(this.getLocationKey(nextEvent));
			totalDuration += this.getEventDuration(nextEvent);
			currentEvent = nextEvent;
		}

		if (isDebug) console.log('Debug - final combination length:', combination.length);
		if (combination.length < 2) {
			if (isDebug) console.log('Debug - combination too short, returning null');
			return null; // Need at least 2 events for a combination
		}

		// Optimize the route order for better efficiency
		const optimizedCombination = this.optimizeRouteOrder(combination, distanceResults);

		// Calculate travel times and modes between events
		const { times: travelTimeBetween, modes: travelModeBetween } = this.calculateTravelTimesAndModesBetween(
			optimizedCombination,
			distanceResults
		);
		const totalTravelTime = 0; // travelTimeBetween.filter(time => !Number.isNaN(time)).reduce((sum, time) => sum + time, 0);
		const roundedTravelTime = roundTo15Minutes(totalTravelTime);
		const finalTotalDuration = totalDuration + roundedTravelTime;

		// Check if combination exceeds duration limits based on type
		const maxDuration = this.getMaxDurationForType(combinationType);
		if (finalTotalDuration > maxDuration) {
			return null;
		}

		return {
			id: this.generateCombinationId(combination),
			events: combination,
			totalDuration: finalTotalDuration,
			travelTimeBetween,
			travelModeBetween,
			hasScheduledEvents: this.hasScheduledEvents(combination, calendarEvents),
			isShoppingDay: combinationType === 'shopping',
			suggestedName: this.generateCombinationName(eventStore, combination, combinationType, seedEvent),
		};
	}

	/**
	 * Find the nearest compatible event to the current event
	 */
	private static findNearestCompatibleEvent(
		currentEvent: SidebarEvent,
		allEvents: SidebarEvent[],
		usedEventIds: Set<string>,
		usedLocations: Set<string>,
		distanceResults: ObservableMap<string, DistanceResult>,
		currentDuration: number,
		combinationType: string,
		categories: TriPlanCategory[]
	): SidebarEvent | null {
		const candidates: { event: SidebarEvent; travelTime: number; priority: number }[] = [];

		for (const event of allEvents) {
			if (usedEventIds.has(event.id)) {
				continue; // Skip already used events
			}

			// Check if event is compatible
			if (
				!this.isEventCompatible(
					event,
					currentEvent,
					usedLocations,
					distanceResults,
					currentDuration,
					combinationType,
					categories
				)
			) {
				continue;
			}

			const travelTime = this.getTravelTime(currentEvent, event, distanceResults);
			const priority = this.getEventPriority(event);

			candidates.push({ event, travelTime, priority });
		}

		if (candidates.length === 0) {
			return null;
		}

		// Check if all candidates have the same priority
		const allSamePriority = candidates.every((c) => c.priority === candidates[0].priority);

		let scoredCandidates;

		if (allSamePriority) {
			// Calculate average distance to all remaining candidates for each candidate
			// This helps avoid "dead ends" where we pick a location that's close now but far from everything else
			scoredCandidates = candidates.map((candidate) => {
				const distancesToOthers = candidates
					.filter((c) => c.event.id !== candidate.event.id)
					.map((c) => this.getTravelTime(candidate.event, c.event, distanceResults));

				const avgDistanceToOthers =
					distancesToOthers.reduce((sum, dist) => sum + dist, 0) / distancesToOthers.length;

				// Score combines: 70% distance to current location, 30% average distance to other locations
				const score = -(candidate.travelTime * 0.7 + avgDistanceToOthers * 0.3);

				return {
					...candidate,
					score: score,
				};
			});
		} else {
			// Use priority + distance scoring when priorities differ
			scoredCandidates = candidates.map((candidate) => {
				// Normalize travel time (0-1 scale, where 0 is closest, 1 is furthest)
				const maxTravelTime = Math.max(...candidates.map((c) => c.travelTime));
				const normalizedDistance = candidate.travelTime / maxTravelTime;

				// Priority scores: must=3, high=2, maybe=1
				const priorityScore = candidate.priority;

				// Distance score: closer is better (1 - normalizedDistance)
				const distanceScore = 1 - normalizedDistance;

				// Combined score: 70% priority, 30% distance
				const finalScore = priorityScore * 0.7 + distanceScore * 0.3;

				return {
					...candidate,
					score: finalScore,
				};
			});
		}

		// Sort by score (highest first), then by travel time for tie-breaking
		scoredCandidates.sort((a, b) => {
			if (Math.abs(a.score - b.score) < 0.01) {
				return a.travelTime - b.travelTime; // Tie-break by distance
			}
			return b.score - a.score; // Higher score first
		});

		// if (isDebug) console.log('Debug - top 3 candidates for', currentEvent.title, ':');
		scoredCandidates.slice(0, 3).forEach((c, i) => {
			if (isDebug) {
				console.log(
					`  ${i + 1}. ${c.event.title} - score: ${c.score.toFixed(1)}, travel: ${
						c.travelTime
					}min, priority: ${c.priority}`
				);
			}
		});

		return scoredCandidates[0].event;
	}

	/**
	 * Optimize the route order using a simple 2-opt improvement algorithm
	 */
	private static optimizeRouteOrder(
		events: SidebarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>
	): SidebarEvent[] {
		if (events.length <= 2) {
			return events; // No optimization needed for 1-2 events
		}

		if (isDebug) console.log('Debug - optimizing route order for', events.length, 'events');

		let bestRoute = [...events];
		let bestDistance = this.calculateTotalRouteDistance(events, distanceResults);
		let improved = true;
		let iterations = 0;
		const maxIterations = 10; // Prevent infinite loops

		while (improved && iterations < maxIterations) {
			improved = false;
			iterations++;

			// Try swapping each pair of non-adjacent events
			for (let i = 1; i < events.length - 1; i++) {
				for (let j = i + 1; j < events.length; j++) {
					// Create a new route by reversing the segment between i and j
					const newRoute = [...bestRoute];
					const segment = newRoute.slice(i, j + 1).reverse();
					newRoute.splice(i, j - i + 1, ...segment);

					const newDistance = this.calculateTotalRouteDistance(newRoute, distanceResults);

					if (newDistance < bestDistance) {
						if (isDebug) {
							console.log(
								`Debug - route improvement found: ${bestDistance.toFixed(1)} -> ${newDistance.toFixed(
									1
								)} minutes`
							);
						}
						bestRoute = newRoute;
						bestDistance = newDistance;
						improved = true;
						break; // Start over with the new best route
					}
				}
				if (improved) break;
			}
		}

		if (isDebug) {
			console.log(
				`Debug - route optimization completed in ${iterations} iterations, final distance: ${bestDistance.toFixed(
					1
				)} minutes`
			);
		}
		return bestRoute;
	}

	/**
	 * Calculate total distance for a route
	 */
	private static calculateTotalRouteDistance(
		events: SidebarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>
	): number {
		let totalDistance = 0;
		for (let i = 0; i < events.length - 1; i++) {
			totalDistance += this.getTravelTime(events[i], events[i + 1], distanceResults);
		}
		return totalDistance;
	}

	/**
	 * Check if an event is compatible with the current combination
	 */
	private static isEventCompatible(
		event: SidebarEvent,
		currentEvent: SidebarEvent,
		usedLocations: Set<string>,
		distanceResults: ObservableMap<string, DistanceResult>,
		currentDuration: number,
		combinationType: string,
		categories: TriPlanCategory[]
	): boolean {
		// Check travel time constraint
		const travelTime = this.getTravelTime(currentEvent, event, distanceResults);
		if (travelTime > this.MAX_TRAVEL_TIME) {
			if (isDebug) {
				console.log(
					'Debug - rejected due to travel time:',
					currentEvent.title,
					'->',
					event.title,
					':',
					travelTime,
					'minutes >',
					this.MAX_TRAVEL_TIME
				);
			}
			return false;
		} else {
			if (isDebug) {
				console.log(
					'Debug - accepted travel time:',
					currentEvent.title,
					'->',
					event.title,
					':',
					travelTime,
					'minutes'
				);
			}
		}

		// Check duration constraint
		const eventDuration = this.getEventDuration(event);
		const maxDuration = this.getMaxDurationForType(combinationType);

		if (currentDuration + eventDuration + travelTime > maxDuration) {
			if (isDebug) {
				console.log(
					'Debug - rejected due to duration:',
					event.title,
					currentDuration + eventDuration + travelTime,
					'>',
					maxDuration
				);
			}
			return false;
		}

		// Check if location is already used (prevent duplicate locations)
		const eventLocationKey = this.getLocationKey(event);
		if (usedLocations.has(eventLocationKey)) {
			if (isDebug) console.log('Debug - rejected due to duplicate location:', event.title);
			return false;
		}

		// Check if both events are food-related (prevent food after food)
		const currentIsFood = this.isFoodCategory(currentEvent, categories);
		const eventIsFood = this.isFoodCategory(event, categories);
		if (currentIsFood && eventIsFood) {
			if (isDebug) console.log('Debug - rejected due to food after food:', currentEvent.title, '->', event.title);
			return false;
		}

		// Check preferred time compatibility
		if (!this.arePreferredTimesCompatible(currentEvent, event)) {
			if (isDebug) console.log('Debug - rejected due to preferred time incompatibility:', event.title);
			return false;
		}

		// For shopping days, ONLY allow shopping events
		if (combinationType === 'shopping') {
			if (!this.isShoppingCategory(event, categories)) {
				if (isDebug) console.log('Debug - rejected non-shopping event for shopping day:', event.title);
				return false; // Reject non-shopping events for shopping days
			}
		}

		// For time-based combinations, filter by preferred time
		if (['morning', 'noon', 'afternoon', 'evening', 'night'].includes(combinationType)) {
			const eventPreferredTime = event.preferredTime;
			if (eventPreferredTime) {
				const timeNum =
					typeof eventPreferredTime === 'string' ? parseInt(eventPreferredTime) : eventPreferredTime;
				const isCompatibleTime = this.isTimeCompatibleWithType(timeNum, combinationType);
				if (!isCompatibleTime) {
					if (isDebug)
						console.log(
							'Debug - rejected due to time-based filtering:',
							event.title,
							'time:',
							timeNum,
							'type:',
							combinationType
						);
					return false;
				}
			}
		}

		// For category-based combinations, filter by category
		if (combinationType === 'tourism' && !this.isTourismCategory(event, categories)) {
			if (isDebug) console.log('Debug - rejected due to tourism category filtering:', event.title);
			return false;
		}

		if (combinationType === 'nature' && !this.isNatureCategory(event, categories)) {
			if (isDebug) console.log('Debug - rejected due to nature category filtering:', event.title);
			return false;
		}

		// For regular combinations, limit to 6 events max
		return true;
	}

	/**
	 * Get travel time and mode between two events
	 */
	private static getTravelTimeAndMode(
		fromEvent: SidebarEvent,
		toEvent: SidebarEvent,
		distanceResults: ObservableMap<string, DistanceResult>
	): { time: number; mode: string } {
		if (
			!fromEvent.location?.latitude ||
			!fromEvent.location?.longitude ||
			!toEvent.location?.latitude ||
			!toEvent.location?.longitude
		) {
			return { time: this.MAX_TRAVEL_TIME, mode: 'DRIVING' }; // Default to max if no coordinates
		}

		// Try each allowed travel mode in order of preference
		for (const travelMode of this.ALLOWED_TRAVEL_MODES) {
			const key = getCoordinatesRangeKey(
				travelMode,
				{ lat: fromEvent.location.latitude, lng: fromEvent.location.longitude },
				{ lat: toEvent.location.latitude, lng: toEvent.location.longitude }
			);
			const result = distanceResults.get(key);

			if (result) {
				return {
					time: Math.round(result.duration_value / 60),
					mode: travelMode === GoogleTravelMode.WALKING ? 'WALKING' : 'DRIVING',
				};
			}
		}

		// Fallback to Haversine distance calculation
		return {
			time: this.calculateHaversineTravelTime(fromEvent, toEvent),
			mode: 'WALKING',
		};
	}

	/**
	 * Get travel time between two events (backward compatibility)
	 */
	private static getTravelTime(
		fromEvent: SidebarEvent,
		toEvent: SidebarEvent,
		distanceResults: ObservableMap<string, DistanceResult>
	): number {
		return this.getTravelTimeAndMode(fromEvent, toEvent, distanceResults).time;
	}

	/**
	 * Calculate travel time using Haversine formula (fallback)
	 */
	private static calculateHaversineTravelTime(fromEvent: SidebarEvent, toEvent: SidebarEvent): number {
		if (
			!fromEvent.location?.latitude ||
			!fromEvent.location?.longitude ||
			!toEvent.location?.latitude ||
			!toEvent.location?.longitude
		) {
			return this.MAX_TRAVEL_TIME; // Default to max if no coordinates
		}

		const R = 6371; // Earth's radius in kilometers
		const dLat = this.toRadians(toEvent.location.latitude - fromEvent.location.latitude);
		const dLon = this.toRadians(toEvent.location.longitude - fromEvent.location.longitude);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.toRadians(fromEvent.location.latitude)) *
				Math.cos(this.toRadians(toEvent.location.latitude)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c; // Distance in kilometers

		// Estimate travel time based on distance
		// For very short distances (< 0.5km), assume walking at 5 km/h
		// For longer distances, assume walking at 4 km/h (city walking speed)
		let speed = distance < 0.5 ? 5 : 4;
		const travelTimeHours = distance / speed;
		const travelTimeMinutes = Math.round(travelTimeHours * 60);

		// Return minimum 1 minute for very short distances
		return Math.max(1, travelTimeMinutes);
	}

	/**
	 * Convert degrees to radians
	 */
	private static toRadians(degrees: number): number {
		return degrees * (Math.PI / 180);
	}

	/**
	 * Calculate travel times and modes between consecutive events in a combination
	 */
	private static calculateTravelTimesAndModesBetween(
		events: SidebarEvent[],
		distanceResults: ObservableMap<string, DistanceResult>
	): { times: number[]; modes: string[] } {
		const travelTimes: number[] = [];
		const travelModes: string[] = [];

		for (let i = 0; i < events.length - 1; i++) {
			const { time, mode } = this.getTravelTimeAndMode(events[i], events[i + 1], distanceResults);
			travelTimes.push(time);
			travelModes.push(mode);
		}

		return { times: travelTimes, modes: travelModes };
	}

	/**
	 * Get event duration in minutes
	 */
	private static getEventDuration(event: SidebarEvent): number {
		if (!event.duration) {
			if (isDebug) console.log('Debug - no duration for event:', event.title, 'using default 60min');
			return 60; // Default 1 hour
		}

		const totalMinutes = getDurationInMs(event.duration) / 60000;

		// // Parse duration string (e.g., "2h 30m", "90m", "1.5h")
		// const durationStr = event.duration.toLowerCase();
		// let totalMinutes = 0;

		// // Extract hours
		// const hourMatch = durationStr.match(/(\d+(?:\.\d+)?)h/);
		// if (hourMatch) {
		// 	totalMinutes += parseFloat(hourMatch[1]) * 60;
		// }

		// // Extract minutes
		// const minuteMatch = durationStr.match(/(\d+)m/);
		// if (minuteMatch) {
		// 	totalMinutes += parseInt(minuteMatch[1]);
		// }

		const result = totalMinutes || 60; // Default to 1 hour if parsing fails
		if (isDebug) {
			console.log(
				'Debug - event duration:',
				event.title,
				'duration string:',
				event.duration,
				'parsed:',
				result,
				'minutes'
			);
		}
		return result;
	}

	/**
	 * Get event priority for sorting
	 */
	private static getEventPriority(event: SidebarEvent): number {
		const priority =
			typeof event.priority === 'string' ? parseInt(event.priority) : event.priority || TriplanPriority.unset;
		switch (priority) {
			case TriplanPriority.must:
				return 3;
			case TriplanPriority.high:
				return 2;
			case TriplanPriority.maybe:
				return 1;
			default:
				return 0;
		}
	}

	/**
	 * Check if event is a shopping category
	 */
	private static isShoppingCategory(event: SidebarEvent, categories: TriPlanCategory[]): boolean {
		const category = categories.find((cat) => cat.id.toString() === event.category);
		if (!category) {
			return false;
		}

		const categoryTitle = category.title.toLowerCase();
		return isMatching(categoryTitle, STORE_KEYWORDS);
	}

	/**
	 * Check if event is a food category
	 */
	private static isFoodCategory(event: SidebarEvent, categories: TriPlanCategory[]): boolean {
		// First check category-based detection
		const category = categories.find((cat) => cat.id.toString() === event.category);
		if (category) {
			const foodKeywords = [
				'restaurant',
				'food',
				'dining',
				'cafe',
				'bar',
				'pub',
				'kitchen',
				'meal',
				'eat',
				'drink',
				'beverage',
			];
			const categoryTitle = category.title.toLowerCase();

			if (foodKeywords.some((keyword) => categoryTitle.includes(keyword))) {
				return true;
			}
		}

		// Fallback: check event title for food-related keywords
		const eventTitle = event.title.toLowerCase();
		const titleFoodKeywords = [
			'restaurant',
			'cafe',
			'bar',
			'pub',
			'kitchen',
			'dining',
			'food',
			'eat',
			'drink',
			'bistro',
			'brasserie',
			'grill',
			'steakhouse',
			'pizzeria',
			'bakery',
			'deli',
			'novikov',
			'bagatelle',
			'amazónico',
			'cé la vi',
			'lío',
			'zuma',
			'gaucho',
			'cut at',
			'duck & waffle',
			'sky garden',
			'eggslut',
			'drunch',
			'daisy green',
			"ralph's coffee",
			'caffè',
			'matcha',
			'matcha',
		];

		const isFoodByTitle = titleFoodKeywords.some((keyword) => eventTitle.includes(keyword));
		if (isFoodByTitle) {
			if (isDebug) console.log('Debug - detected food venue by title:', event.title, 'matches keyword');
		}

		return isFoodByTitle;
	}

	/**
	 * Get a unique location key for an event
	 */
	private static getLocationKey(event: SidebarEvent): string {
		if (!event.location?.latitude || !event.location?.longitude) {
			return event.id; // Fallback to event ID if no location
		}

		// Round coordinates to avoid minor differences
		const lat = Math.round(event.location.latitude * 1000) / 1000;
		const lng = Math.round(event.location.longitude * 1000) / 1000;

		return `${lat},${lng}`;
	}

	/**
	 * Check if two events have compatible preferred times
	 */
	private static arePreferredTimesCompatible(event1: SidebarEvent, event2: SidebarEvent): boolean {
		const time1 = event1.preferredTime;
		const time2 = event2.preferredTime;

		// If either event has no preferred time, they're compatible
		if (!time1 || !time2) {
			return true;
		}

		// Convert to numbers if they're strings
		const numTime1 = typeof time1 === 'string' ? parseInt(time1) : time1;
		const numTime2 = typeof time2 === 'string' ? parseInt(time2) : time2;

		// For now, let's be more permissive - only reject if times are very incompatible
		// (e.g., morning vs night, but allow most other combinations)
		const veryIncompatible =
			(numTime1 === 1 && numTime2 === 7) || // morning vs night
			(numTime1 === 7 && numTime2 === 1) || // night vs morning
			(numTime1 === 1 && numTime2 === 5) || // morning vs evening
			(numTime1 === 5 && numTime2 === 1); // evening vs morning

		return !veryIncompatible;
	}

	/**
	 * Check if combination contains any scheduled events
	 */
	private static hasScheduledEvents(combination: SidebarEvent[], calendarEvents: CalendarEvent[]): boolean {
		const combinationIds = new Set(combination.map((event) => event.id));
		return calendarEvents.some((calEvent) => combinationIds.has(calEvent.id));
	}

	/**
	 * Generate combination ID
	 */
	private static generateCombinationId(events: SidebarEvent[]): string {
		const eventIds = events.map((e) => e.id).sort();
		return `combination-${eventIds.join('-')}`;
	}

	/**
	 * Generate descriptive name for combination
	 */
	private static generateCombinationName(
		eventStore: EventStore,
		events: SidebarEvent[],
		combinationType: string,
		seedEvent: SidebarEvent
	): string {
		const seedName = seedEvent.title;

		switch (combinationType) {
			case 'shopping':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.SHOPPING_DAY_AROUND', {
					SEED_NAME: seedName,
				});
			case 'morning':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.MORNING_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'noon':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.NOON_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'afternoon':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.AFTERNOON_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'evening':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.EVENING_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'night':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.NIGHT_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'tourism':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.TOURISM_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			case 'nature':
				return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.NATURE_ACTIVITIES_NEAR', {
					SEED_NAME: seedName,
				});
			default:
				// Fallback to general combination name
				const mustEvent = events.find((e) => {
					const priority = typeof e.priority === 'string' ? parseInt(e.priority) : e.priority;
					return priority === TriplanPriority.must || priority === TriplanPriority.high;
				});

				if (mustEvent) {
					return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.ACTIVITIES_IN_AREA', {
						MUST_ACTIVITY_NAME: mustEvent.title,
					});
				}

				return 'Activity Combination';
		}
	}

	/**
	 * Remove duplicate combinations (same event set regardless of order)
	 */
	private static removeDuplicateCombinations(combinations: SuggestedCombination[]): SuggestedCombination[] {
		const seen = new Set<string>();
		const unique: SuggestedCombination[] = [];

		for (const combination of combinations) {
			const eventIds = combination.events
				.map((e) => e.id)
				.sort()
				.join(',');
			if (!seen.has(eventIds)) {
				seen.add(eventIds);
				unique.push(combination);
			}
		}

		return unique;
	}

	/**
	 * Rank combinations by quality
	 */
	private static rankCombinations(combinations: SuggestedCombination[]): SuggestedCombination[] {
		return combinations.sort((a, b) => {
			// Primary: number of "must" events (descending)
			const aMustCount = a.events.filter((e) => {
				const priority = typeof e.priority === 'string' ? parseInt(e.priority) : e.priority;
				return priority === TriplanPriority.must;
			}).length;
			const bMustCount = b.events.filter((e) => {
				const priority = typeof e.priority === 'string' ? parseInt(e.priority) : e.priority;
				return priority === TriplanPriority.must;
			}).length;

			if (aMustCount !== bMustCount) {
				return bMustCount - aMustCount;
			}

			// Secondary: total number of events (descending)
			if (a.events.length !== b.events.length) {
				return b.events.length - a.events.length;
			}

			// Tertiary: minimize total travel time (ascending)
			const aTravelTime = a.travelTimeBetween.reduce((sum, time) => sum + time, 0);
			const bTravelTime = b.travelTimeBetween.reduce((sum, time) => sum + time, 0);

			return aTravelTime - bTravelTime;
		});
	}

	/**
	 * Determine the type of combination based on seed event
	 */
	private static determineCombinationType(seedEvent: SidebarEvent, categories: TriPlanCategory[]): string {
		// Check if seed is shopping
		if (this.isShoppingCategory(seedEvent, categories)) {
			return 'shopping';
		}

		// Check if seed has preferred time
		const preferredTime = seedEvent.preferredTime;
		if (preferredTime) {
			const timeNum = typeof preferredTime === 'string' ? parseInt(preferredTime) : preferredTime;
			switch (timeNum) {
				case 1:
					return 'morning';
				case 2:
					return 'noon';
				case 3:
					return 'afternoon';
				case 4:
					return 'afternoon';
				case 5:
					return 'evening';
				case 6:
					return 'evening';
				case 7:
					return 'night';
				default:
					break;
			}
		}

		// Check if seed is tourism category
		if (this.isTourismCategory(seedEvent, categories)) {
			return 'tourism';
		}

		// Check if seed is nature category
		if (this.isNatureCategory(seedEvent, categories)) {
			return 'nature';
		}

		// Default to general combination
		return 'general';
	}

	/**
	 * Get max duration for combination type
	 */
	private static getMaxDurationForType(combinationType: string): number {
		switch (combinationType) {
			case 'shopping':
				return this.MAX_SHOPPING_DURATION;
			case 'morning':
			case 'noon':
			case 'afternoon':
			case 'evening':
			case 'night':
				return this.MAX_TIME_BASED_DURATION;
			case 'tourism':
			case 'nature':
				return this.MAX_CATEGORY_DURATION;
			default:
				return this.MAX_COMBINATION_DURATION;
		}
	}

	/**
	 * Check if event is tourism category
	 */
	private static isTourismCategory(event: SidebarEvent, categories: TriPlanCategory[]): boolean {
		const category = categories.find((cat) => cat.id.toString() === event.category);
		if (!category) {
			return false;
		}

		const categoryTitle = category.title.toLowerCase();
		return isMatching(categoryTitle, TOURIST_KEYWORDS);
	}

	/**
	 * Check if event is nature category
	 */
	private static isNatureCategory(event: SidebarEvent, categories: TriPlanCategory[]): boolean {
		const category = categories.find((cat) => cat.id.toString() === event.category);
		if (!category) {
			return false;
		}

		const categoryTitle = category.title.toLowerCase();
		return isMatching(categoryTitle, NATURE_KEYWORDS);
	}

	/**
	 * Check if a preferred time is compatible with a combination type
	 */
	private static isTimeCompatibleWithType(preferredTime: number, combinationType: string): boolean {
		switch (combinationType) {
			case 'morning':
				return preferredTime === 1; // Only morning
			case 'noon':
				return preferredTime === 2; // Only noon
			case 'afternoon':
				return preferredTime === 3 || preferredTime === 4; // Afternoon times
			case 'evening':
				return preferredTime === 5 || preferredTime === 6; // Evening times
			case 'night':
				return preferredTime === 7; // Only night
			default:
				return true; // Allow all times for other types
		}
	}

	/**
	 * Set allowed travel modes for combinations
	 * @param modes Array of GoogleTravelMode values to allow
	 */
	static setAllowedTravelModes(modes: GoogleTravelMode[]): void {
		(this as any).ALLOWED_TRAVEL_MODES = modes;
	}

	/**
	 * Get current allowed travel modes
	 */
	static getAllowedTravelModes(): GoogleTravelMode[] {
		return (this as any).ALLOWED_TRAVEL_MODES;
	}
}
