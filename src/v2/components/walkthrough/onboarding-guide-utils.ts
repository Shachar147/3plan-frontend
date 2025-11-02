import TranslateService from '../../../services/translate-service';
import { EventStore } from '../../../stores/events-store';
import ReactModalService from '../../../services/react-modal-service';
import { TripActions } from '../../../utils/interfaces';

const RANDOM_LOCATIONS = [
	'London',
	'Paris',
	'Germany',
	'New York',
	'Tokyo',
	'Barcelona',
	'Rome',
	'Amsterdam',
	'Dubai',
	'Thailand',
	'Spain',
	'Italy',
	'Greece',
	'Japan',
];

// Generate random trip name with location
export const generateRandomTripName = (
	eventStore: EventStore
): {
	tripName: string;
	location: string;
} => {
	const locations = RANDOM_LOCATIONS;
	const randomLocation = locations[Math.floor(Math.random() * locations.length)];
	const translatedLocation = TranslateService.translate(eventStore, randomLocation);

	const patternKeys = [
		'WALKTHROUGH.TRIP_NAME_PATTERN.MY_AMAZING_TRIP',
		'WALKTHROUGH.TRIP_NAME_PATTERN.MY_BIRTHDAY',
		'WALKTHROUGH.TRIP_NAME_PATTERN.DAYS',
		'WALKTHROUGH.TRIP_NAME_PATTERN.ADVENTURE',
		'WALKTHROUGH.TRIP_NAME_PATTERN.SUMMER',
		'WALKTHROUGH.TRIP_NAME_PATTERN.EXPLORING',
		'WALKTHROUGH.TRIP_NAME_PATTERN.VACATION',
		'WALKTHROUGH.TRIP_NAME_PATTERN.WEEKEND',
	];

	const randomPatternKey = patternKeys[Math.floor(Math.random() * patternKeys.length)];
	let tripName = TranslateService.translate(eventStore, randomPatternKey, { location: translatedLocation });

	// Special handling for days pattern
	if (randomPatternKey === 'WALKTHROUGH.TRIP_NAME_PATTERN.DAYS') {
		const days = Math.floor(Math.random() * 14) + 3; // Random between 3-16 days
		tripName = TranslateService.translate(eventStore, randomPatternKey, {
			location: translatedLocation,
			days: days.toString(),
		});
	}

	// Add (Example) or (דוגמא) at the end
	const exampleText = TranslateService.translate(eventStore, 'WALKTHROUGH.EXAMPLE');
	return {
		tripName: `${tripName} (${exampleText})`,
		location: randomLocation,
	};
};

// Trigger React onChange handler directly
export const triggerReactOnChange = (inputElement: HTMLInputElement, value: string) => {
	// Get the native value setter to properly update the value
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

	// Set value using native setter so React tracks it
	if (nativeInputValueSetter) {
		nativeInputValueSetter.call(inputElement, value);
	} else {
		inputElement.value = value;
	}

	// Try to get React's onChange handler from the element's props
	// React stores event handlers in various ways depending on version
	const reactKey = Object.keys(inputElement).find(
		(key) => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
	);
	if (reactKey) {
		// @ts-ignore - accessing React internals
		const reactInstance = inputElement[reactKey];
		if (reactInstance) {
			// Try to find the onChange handler in the props
			let props = reactInstance.memoizedProps || reactInstance.pendingProps || reactInstance.props;
			if (!props && reactInstance.return) {
				props =
					reactInstance.return.memoizedProps ||
					reactInstance.return.pendingProps ||
					reactInstance.return.props;
			}
			if (props && props.onChange) {
				// Create a synthetic event-like object with proper value
				const syntheticEvent = {
					target: inputElement,
					currentTarget: inputElement,
					type: 'change',
					bubbles: true,
					cancelable: true,
					// Ensure target.value is accessible
					get preventDefault() {
						return () => {};
					},
					get stopPropagation() {
						return () => {};
					},
				};
				// Ensure the value property is set before calling onChange
				if (nativeInputValueSetter) {
					nativeInputValueSetter.call(inputElement, value);
				}
				// Call React's onChange directly
				try {
					props.onChange(syntheticEvent);
					return; // If direct call succeeds, don't dispatch events
				} catch (e) {
					// Fall back to event dispatch if direct call fails
					console.warn('Failed to call React onChange directly:', e);
				}
			}
		}
	}

	// Also dispatch standard events as fallback
	const inputEvent = new InputEvent('input', {
		bubbles: true,
		cancelable: true,
		inputType: 'insertText',
	});
	inputElement.dispatchEvent(inputEvent);

	const changeEvent = new Event('change', { bubbles: true, cancelable: true });
	inputElement.dispatchEvent(changeEvent);
};

// Simulate typing character by character into input
export const simulateTyping = async (inputElement: HTMLInputElement, text: string, speed = 60) => {
	// Clear existing value first
	triggerReactOnChange(inputElement, '');
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Focus the input
	inputElement.focus();

	// Trigger input event for each character
	for (let i = 0; i < text.length; i++) {
		const currentValue = text.substring(0, i + 1);

		// Trigger React onChange for each character
		triggerReactOnChange(inputElement, currentValue);

		// Wait before next character
		await new Promise((resolve) => setTimeout(resolve, speed));
	}
};

// Simulate Google Places Autocomplete selection by triggering the existing place_changed listener
export const simulateGooglePlacesSelection = async (
	searchInput: HTMLInputElement,
	searchQuery: string,
	variableName: string = 'selectedSearchLocation',
	eventStore?: EventStore
): Promise<void> => {
	console.log('[Walkthrough] Starting Google Places selection simulation for:', searchQuery);

	// @ts-ignore - Google Maps API is loaded globally
	if (!window.google || !window.google.maps) {
		console.error('[Walkthrough] Google Maps API is not loaded');
		return;
	}

	return new Promise((resolve, reject) => {
		try {
			// @ts-ignore - Google Maps API types
			const autocompleteService = new window.google.maps.places.AutocompleteService();

			console.log('[Walkthrough] Getting place predictions for:', searchQuery);
			autocompleteService.getPlacePredictions(
				{
					input: searchQuery,
					types: ['establishment', 'geocode'],
				},
				(predictions, status) => {
					// @ts-ignore - Google Maps API types
					if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
						console.error('[Walkthrough] PlacesServiceStatus:', status);
						reject(new Error(`PlacesServiceStatus: ${status}`));
						return;
					}

					if (!predictions || predictions.length === 0) {
						console.error('[Walkthrough] No predictions found');
						reject(new Error('No predictions found'));
						return;
					}

					// Get the first prediction's place_id
					const firstPrediction = predictions[0];
					console.log(
						'[Walkthrough] First prediction:',
						firstPrediction.description,
						'place_id:',
						firstPrediction.place_id
					);

					// @ts-ignore - Google Maps API types
					const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

					console.log('[Walkthrough] Getting place details for place_id:', firstPrediction.place_id);
					placesService.getDetails(
						{
							placeId: firstPrediction.place_id,
							fields: [
								'formatted_address',
								'geometry',
								'name',
								'opening_hours',
								'photos',
								'website',
								'international_phone_number',
								'rating',
								'user_ratings_total',
								'reviews',
								'types',
								'url',
							],
						},
						(place, placeStatus) => {
							// @ts-ignore - Google Maps API types
							if (placeStatus !== window.google.maps.places.PlacesServiceStatus.OK) {
								console.error('[Walkthrough] Place details status:', placeStatus);
								reject(new Error(`Place details status: ${placeStatus}`));
								return;
							}

							if (!place) {
								console.error('[Walkthrough] No place details returned');
								reject(new Error('No place details returned'));
								return;
							}

							console.log('[Walkthrough] Place details received:', place.name);

							// Set the input value to the place description
							const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
								HTMLInputElement.prototype,
								'value'
							)?.set;
							if (nativeInputValueSetter) {
								nativeInputValueSetter.call(searchInput, firstPrediction.description);
							} else {
								searchInput.value = firstPrediction.description;
							}

							// Trigger React onChange
							triggerReactOnChange(searchInput, firstPrediction.description);
							console.log('[Walkthrough] Input value set to:', firstPrediction.description);

							// Find the autocomplete instance that was created by initLocationPicker
							// Get the className from the input element (should be 'map-header-location-input-search')
							const inputClassName =
								searchInput.className
									.split(' ')
									.find((cls) => cls === 'map-header-location-input-search') ||
								'map-header-location-input-search';

							// Get the stored autocomplete instance from window.googleAutocompleteInstances
							// @ts-ignore
							const autocompleteInstances = window.googleAutocompleteInstances || {};
							let autocomplete = autocompleteInstances[inputClassName];

							if (!autocomplete) {
								console.warn('[Walkthrough] Autocomplete instance not found, creating temporary one');
								// If we can't find the existing instance (maybe initLocationPicker wasn't called yet),
								// create a temporary one - this should still trigger the event if listeners are set up
								// @ts-ignore
								autocomplete = new window.google.maps.places.Autocomplete(searchInput);
							} else {
								console.log('[Walkthrough] Found stored autocomplete instance');
							}

							// Set the place on the autocomplete instance
							// @ts-ignore
							autocomplete.set('place', place);
							console.log('[Walkthrough] Set place on autocomplete instance');

							// Extract location data directly from the place object
							const latitude = place.geometry.location.lat();
							const longitude = place.geometry.location.lng();
							const address = firstPrediction.description || place.formatted_address || searchInput.value;

							// Extract opening hours
							let openingHoursData = undefined;
							// @ts-ignore
							if (place.opening_hours && place.opening_hours.periods) {
								// @ts-ignore
								if (window.transformOpeningHours) {
									// @ts-ignore
									openingHoursData = window.transformOpeningHours(place.opening_hours);
								}
							}

							// Set location data directly (matching what index.js does)
							const locationData = {
								address,
								latitude,
								longitude,
							};

							// @ts-ignore
							window[variableName] = locationData;
							// @ts-ignore
							window.openingHours = openingHoursData;

							console.log('[Walkthrough] Set location data directly:', locationData);

							// Trigger the place_changed event which will call the listener in index.js
							// This ensures the rest of the app knows about the place change
							// @ts-ignore
							window.google.maps.event.trigger(autocomplete, 'place_changed');
							console.log('[Walkthrough] Triggered place_changed event');

							// Wait a bit for any side effects of place_changed event
							setTimeout(() => {
								const searchValue =
									searchInput.value || firstPrediction.description || place.name || searchQuery;

								// Open the modal if eventStore is provided
								if (eventStore) {
									ReactModalService.openAddSidebarEventModal(
										eventStore,
										undefined,
										{
											location: locationData,
											title: searchValue,
											openingHours: openingHoursData,
										},
										undefined,
										undefined,
										TripActions.addedNewSidebarEventFromMap
									);
									console.log('[Walkthrough] Opened add activity modal');
								}

								console.log('[Walkthrough] Google Places selection simulation completed');
								resolve();
							}, 300);
						}
					);
				}
			);
		} catch (error) {
			console.error('[Walkthrough] Error in simulateGooglePlacesSelection:', error);
			reject(error);
		}
	});
};

// Simulate searching on the map: type in the search input and select the first result
export const simulateSearchOnMap = async (
	searchInput: HTMLInputElement,
	searchQuery: string = 'Big Ben London',
	eventStore?: EventStore
): Promise<void> => {
	console.log('[Walkthrough] Starting map search simulation for:', searchQuery);

	if (!searchInput) {
		console.error('[Walkthrough] Search input not found');
		return;
	}

	// First, click/focus the input to initialize Google Places Autocomplete
	// This calls window.initLocationPicker('map-header-location-input-search', ...)
	searchInput.click();
	await new Promise((resolve) => setTimeout(resolve, 100));
	searchInput.focus();

	// Wait for Google Places to initialize
	await new Promise((resolve) => setTimeout(resolve, 400));

	// Now type the search query character by character
	// Google Places Autocomplete listens to native input events
	for (let i = 0; i < searchQuery.length; i++) {
		const currentValue = searchQuery.substring(0, i + 1);
		const char = searchQuery[i];

		// Update the value using native setter
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
		if (nativeInputValueSetter) {
			nativeInputValueSetter.call(searchInput, currentValue);
		} else {
			searchInput.value = currentValue;
		}

		// Trigger React onChange (for React state)
		triggerReactOnChange(searchInput, currentValue);

		// Trigger native input event (Google Places listens to this)
		const inputEvent = new InputEvent('input', {
			bubbles: true,
			cancelable: true,
			inputType: 'insertText',
			data: char,
		});
		searchInput.dispatchEvent(inputEvent);

		// Trigger keyup event (the code has a listener for this)
		const keyUpEvent = new KeyboardEvent('keyup', {
			bubbles: true,
			cancelable: true,
			key: char,
			code: `Key${char.toUpperCase()}`,
		});
		searchInput.dispatchEvent(keyUpEvent);

		// Wait before next character
		await new Promise((resolve) => setTimeout(resolve, 80));
	}

	// Wait for dropdown results to appear (Google Places needs time to fetch results)
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Simulate selecting the first option using Google Places API
	// This will also open the modal if eventStore is provided
	await simulateGooglePlacesSelection(searchInput, searchQuery, 'selectedSearchLocation', eventStore);

	console.log('[Walkthrough] Map search simulation completed');
};

// Click on the green search marker on the map to open the activity modal
export const clickSearchMarkerOnMap = async (): Promise<void> => {
	console.log('[Walkthrough] Looking for green search marker on map');

	// Wait a bit for the marker to appear after search
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// The search marker uses FontAwesome icon with classes: fa fa-map-marker fa-4x text-success
	// text-success makes it green, fa-map-marker is the icon
	// The marker is rendered via React and should be clickable
	for (let attempt = 0; attempt < 10; attempt++) {
		// Try multiple selectors to find the green marker
		const greenMarker =
			(document.querySelector('.fa-map-marker.text-success') as HTMLElement) ||
			(document.querySelector('.fa.fa-map-marker.fa-4x.text-success') as HTMLElement) ||
			(document.querySelector('[class*="fa-map-marker"][class*="text-success"]') as HTMLElement) ||
			// Also try finding any marker with text-success class
			(Array.from(document.querySelectorAll('.fa-map-marker')).find((el) =>
				el.classList.contains('text-success')
			) as HTMLElement);

		if (greenMarker && greenMarker.offsetParent !== null) {
			console.log('[Walkthrough] Found green marker, clicking it');

			// Scroll into view if needed
			greenMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Try clicking the marker or its parent (the onClick might be on parent)
			const clickableElement =
				greenMarker.closest('[style*="cursor: pointer"]') || greenMarker.parentElement || greenMarker;

			// Click with mouse events
			const mouseDown = new MouseEvent('mousedown', {
				bubbles: true,
				cancelable: true,
				view: window,
				button: 0,
			});
			const mouseUp = new MouseEvent('mouseup', {
				bubbles: true,
				cancelable: true,
				view: window,
				button: 0,
			});
			const clickEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window,
				button: 0,
			});

			clickableElement.dispatchEvent(mouseDown);
			await new Promise((resolve) => setTimeout(resolve, 50));
			clickableElement.dispatchEvent(mouseUp);
			await new Promise((resolve) => setTimeout(resolve, 50));
			(clickableElement as HTMLElement).click();

			console.log('[Walkthrough] Clicked green marker');
			await new Promise((resolve) => setTimeout(resolve, 500));
			return;
		}

		// Wait and retry
		await new Promise((resolve) => setTimeout(resolve, 300 + attempt * 100));
	}

	console.warn('[Walkthrough] Could not find green marker on map');
};
