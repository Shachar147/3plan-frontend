import TranslateService from '../../../services/translate-service';
import { EventStore } from '../../../stores/events-store';
import ReactModalService from '../../../services/react-modal-service';
import { TripActions } from '../../../utils/interfaces';
import { TriplanPriority, TriplanEventPreferredTime } from '../../../utils/enums';
import { runInAction } from 'mobx';
import { ucfirst } from '../../../utils/utils';
import { addDays, addHours } from '../../../utils/time-utils';

export const setLastAddedCategoryId = (categoryId: number | null) => {
	localStorage.setItem('triplan-walkthrough-last-added-category-id', categoryId?.toString() || '');
};

export const getLastAddedCategoryId = (): number | null => {
	return localStorage.getItem('triplan-walkthrough-last-added-category-id')
		? parseInt(localStorage.getItem('triplan-walkthrough-last-added-category-id') || '0')
		: null;
};

export enum Location {
	London = 'London',
	Paris = 'Paris',
	Germany = 'Germany',
	NewYork = 'New York',
	Tokyo = 'Tokyo',
	Barcelona = 'Barcelona',
	Rome = 'Rome',
	Amsterdam = 'Amsterdam',
	Dubai = 'Dubai',
	Thailand = 'Thailand',
	Spain = 'Spain',
	Italy = 'Italy',
	Greece = 'Greece',
	Japan = 'Japan',
}

export const LOCATION_POIS: Record<Location, string[]> = {
	[Location.London]: ['Big Ben London', 'Hyde Park London', 'The Shard London', 'Warner Bros Studio London'],
	[Location.Paris]: ['Eiffel Tower', 'Louvre Museum', 'Notre Dame Paris', 'Disneyland Paris'],
	[Location.Germany]: ['Berlin Wall', 'Prison Island Berlin', 'Reichstag Berlin', 'Berlin Icebar'],
	[Location.NewYork]: ['Times Square', 'Central Park New York', 'Statue of Liberty', 'Empire State Building'],
	[Location.Tokyo]: ['Shibuya Crossing', 'Tokyo Tower', 'Hello Kitty Smile Tokyo'],
	[Location.Barcelona]: ['Sagrada Familia', 'Camp Nou Barcelona', 'Barcelona Aquarium'],
	[Location.Rome]: ['Colosseum Rome', 'Rome Magicland', 'Basilica of Santa Maria in Trastevere'],
	[Location.Amsterdam]: [
		'Anne Frank House',
		'Amsterdam Heineken Experience',
		'Van Gogh Museum Amsterdam',
		'Adam lookout amsterdam',
	],
	[Location.Dubai]: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall', 'Dubai Frame', 'Museum of the future dubai'],
	[Location.Thailand]: ['Grand Palace Bangkok', 'Phi Phi Islands', 'Koh Phi Phi', 'Koh Samui', 'Koh Tao'],
	[Location.Spain]: ['Madrid', 'Barcelona', 'Ibiza'],
	[Location.Italy]: ['Colosseum Rome', 'Leaning Tower of Pisa', 'Amalfi Coast', 'Florence', 'Venice'],
	[Location.Greece]: ['Acropolis Athens', 'Zara Pireus', 'Santorini', 'Mykonos', 'Corfu'],
	[Location.Japan]: ['Mount Fuji', 'Tokyo', 'Kyoto', 'Osaka', 'Hiroshima'],
};

export const generateRandomTripName = (
	eventStore: EventStore
): {
	tripName: string;
	location: string;
} => {
	const locations = Object.values(Location);
	const randomLocation = locations[Math.floor(Math.random() * locations.length)].toString();
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

	if (randomPatternKey === 'WALKTHROUGH.TRIP_NAME_PATTERN.DAYS') {
		const days = Math.floor(Math.random() * 14) + 3;
		tripName = TranslateService.translate(eventStore, randomPatternKey, {
			location: translatedLocation,
			days: days.toString(),
		});
	}

	const exampleText = TranslateService.translate(eventStore, 'WALKTHROUGH.EXAMPLE');
	return {
		tripName: `${tripName} (${exampleText})`,
		location: randomLocation,
	};
};

export const triggerReactOnChange = (inputElement: HTMLInputElement, value: string) => {
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

	if (nativeInputValueSetter) {
		nativeInputValueSetter.call(inputElement, value);
	} else {
		inputElement.value = value;
	}

	const reactKey = Object.keys(inputElement).find(
		(key) => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
	);
	if (reactKey) {
		// @ts-ignore
		const reactInstance = inputElement[reactKey];
		if (reactInstance) {
			let props = reactInstance.memoizedProps || reactInstance.pendingProps || reactInstance.props;
			if (!props && reactInstance.return) {
				props =
					reactInstance.return.memoizedProps ||
					reactInstance.return.pendingProps ||
					reactInstance.return.props;
			}
			if (props && props.onChange) {
				const syntheticEvent = {
					target: inputElement,
					currentTarget: inputElement,
					type: 'change',
					bubbles: true,
					cancelable: true,
					get preventDefault() {
						return () => {};
					},
					get stopPropagation() {
						return () => {};
					},
				};
				if (nativeInputValueSetter) {
					nativeInputValueSetter.call(inputElement, value);
				}
				try {
					props.onChange(syntheticEvent);
					return;
				} catch (e) {
					// Fall through to event dispatch
				}
			}
		}
	}

	const inputEvent = new InputEvent('input', {
		bubbles: true,
		cancelable: true,
		inputType: 'insertText',
	});
	inputElement.dispatchEvent(inputEvent);

	const changeEvent = new Event('change', { bubbles: true, cancelable: true });
	inputElement.dispatchEvent(changeEvent);
};

export const simulateTyping = async (inputElement: HTMLInputElement, text: string, speed = 60) => {
	triggerReactOnChange(inputElement, '');
	await new Promise((resolve) => setTimeout(resolve, 50));

	inputElement.focus();

	for (let i = 0; i < text.length; i++) {
		const currentValue = text.substring(0, i + 1);
		triggerReactOnChange(inputElement, currentValue);
		await new Promise((resolve) => setTimeout(resolve, speed));
	}
};

export const simulateGooglePlacesSelection = async (
	searchInput: HTMLInputElement,
	searchQuery: string,
	variableName: string = 'selectedSearchLocation',
	eventStore?: EventStore
): Promise<void> => {
	// @ts-ignore
	if (!window.google || !window.google.maps) {
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
					// @ts-ignore
					if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
						reject(new Error(`PlacesServiceStatus: ${status}`));
						return;
					}

					if (!predictions || predictions.length === 0) {
						reject(new Error('No predictions found'));
						return;
					}

					const firstPrediction = predictions[0];

					// @ts-ignore
					const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

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
							// @ts-ignore
							if (placeStatus !== window.google.maps.places.PlacesServiceStatus.OK) {
								reject(new Error(`Place details status: ${placeStatus}`));
								return;
							}

							if (!place) {
								reject(new Error('No place details returned'));
								return;
							}

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

							triggerReactOnChange(searchInput, firstPrediction.description);

							const inputClassName =
								searchInput.className
									.split(' ')
									.find((cls) => cls === 'map-header-location-input-search') ||
								'map-header-location-input-search';

							// @ts-ignore
							const autocompleteInstances = window.googleAutocompleteInstances || {};
							let autocomplete = autocompleteInstances[inputClassName];

							if (!autocomplete) {
								// @ts-ignore
								autocomplete = new window.google.maps.places.Autocomplete(searchInput);
							}

							// @ts-ignore
							autocomplete.set('place', place);

							const latitude = place.geometry.location.lat();
							const longitude = place.geometry.location.lng();
							const address = firstPrediction.description || place.formatted_address || searchInput.value;

							let openingHoursData = undefined;
							// @ts-ignore
							if (place.opening_hours && place.opening_hours.periods) {
								// @ts-ignore
								if (window.transformOpeningHours) {
									// @ts-ignore
									openingHoursData = window.transformOpeningHours(place.opening_hours);
								}
							}

							const locationData = {
								address,
								latitude,
								longitude,
							};

							// @ts-ignore
							window[variableName] = locationData;
							// @ts-ignore
							window.openingHours = openingHoursData;
							// @ts-ignore
							window.google.maps.event.trigger(autocomplete, 'place_changed');

							setTimeout(() => {
								const searchValue =
									searchInput.value || firstPrediction.description || place.name || searchQuery;

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
								}

								resolve();
							}, 300);
						}
					);
				}
			);
		} catch (error) {
			reject(error);
		}
	});
};

export const simulateSearchOnMap = async (
	searchInput: HTMLInputElement,
	searchQuery: string = 'Big Ben London',
	eventStore?: EventStore
): Promise<void> => {
	if (!searchInput) {
		return;
	}

	searchInput.click();
	await new Promise((resolve) => setTimeout(resolve, 100));
	searchInput.focus();

	await new Promise((resolve) => setTimeout(resolve, 400));

	for (let i = 0; i < searchQuery.length; i++) {
		const currentValue = searchQuery.substring(0, i + 1);
		const char = searchQuery[i];

		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
		if (nativeInputValueSetter) {
			nativeInputValueSetter.call(searchInput, currentValue);
		} else {
			searchInput.value = currentValue;
		}

		triggerReactOnChange(searchInput, currentValue);

		const inputEvent = new InputEvent('input', {
			bubbles: true,
			cancelable: true,
			inputType: 'insertText',
			data: char,
		});
		searchInput.dispatchEvent(inputEvent);

		const keyUpEvent = new KeyboardEvent('keyup', {
			bubbles: true,
			cancelable: true,
			key: char,
			code: `Key${char.toUpperCase()}`,
		});
		searchInput.dispatchEvent(keyUpEvent);

		await new Promise((resolve) => setTimeout(resolve, 80));
	}

	await new Promise((resolve) => setTimeout(resolve, 1500));

	await simulateGooglePlacesSelection(searchInput, searchQuery, 'selectedSearchLocation', eventStore);
};

export const setRandomPriority = async (eventStore: EventStore): Promise<void> => {
	const priorityEnumValues = [TriplanPriority.must, TriplanPriority.high, TriplanPriority.maybe];
	const randomPriorityEnum = priorityEnumValues[Math.floor(Math.random() * priorityEnumValues.length)];

	const values = Object.keys(TriplanPriority);
	const keys = Object.values(TriplanPriority);

	const order = [
		TriplanPriority.unset,
		TriplanPriority.must,
		TriplanPriority.high,
		TriplanPriority.maybe,
		TriplanPriority.least,
	];

	const options = Object.values(TriplanPriority)
		.filter((x) => !Number.isNaN(Number(x)))
		.map((val, index) => ({
			value: values[index],
			label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
		}))
		.sort((a, b) => {
			let A = order.indexOf(Number(a.value) as unknown as TriplanPriority);
			let B = order.indexOf(Number(b.value) as unknown as TriplanPriority);

			if (A === -1) {
				A = 999;
			}
			if (B === -1) {
				B = 999;
			}

			if (A > B) {
				return 1;
			} else if (A < B) {
				return -1;
			}
			return 0;
		});

	const priorityKeyName = Object.keys(TriplanPriority).find((key) => {
		return Number.isNaN(Number(key)) && TriplanPriority[key as keyof typeof TriplanPriority] === randomPriorityEnum;
	});

	const matchingOption = options.find((opt) => {
		const optEnumVal = TriplanPriority[opt.value as keyof typeof TriplanPriority];
		const numericVal = Number(opt.value);

		return (
			optEnumVal === randomPriorityEnum ||
			(numericVal === randomPriorityEnum && !isNaN(numericVal)) ||
			opt.value === priorityKeyName
		);
	});

	if (matchingOption) {
		runInAction(() => {
			eventStore.modalValues['priority'] = matchingOption;
		});

		await new Promise((resolve) => setTimeout(resolve, 150));
	}
};

export const setRandomPreferredTime = async (eventStore: EventStore): Promise<void> => {
	const preferredTimeEnumValues = [
		TriplanEventPreferredTime.morning,
		TriplanEventPreferredTime.noon,
		TriplanEventPreferredTime.afternoon,
		TriplanEventPreferredTime.sunset,
		TriplanEventPreferredTime.evening,
		TriplanEventPreferredTime.nevermind,
		TriplanEventPreferredTime.night,
	];

	const randomPreferredTimeEnum = preferredTimeEnumValues[Math.floor(Math.random() * preferredTimeEnumValues.length)];

	const values = Object.keys(TriplanEventPreferredTime);
	const keys = Object.values(TriplanEventPreferredTime);

	const options = Object.keys(TriplanEventPreferredTime)
		.filter((x) => Number.isNaN(Number(x)))
		.map((key, index) => ({
			value: values[index],
			label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
		}))
		.sort((a, b) => {
			const valA = a.value == '7' ? 5.5 : a.value; // 7 is night, 6 is nevermind
			const valB = b.value == '7' ? 5.5 : b.value; // 7 is night, 6 is nevermind
			return Number(valA) - Number(valB);
		});

	const preferredTimeKeyName = Object.keys(TriplanEventPreferredTime).find((key) => {
		return (
			Number.isNaN(Number(key)) &&
			TriplanEventPreferredTime[key as keyof typeof TriplanEventPreferredTime] === randomPreferredTimeEnum
		);
	});

	const matchingOption = options.find((opt) => {
		const optEnumVal = TriplanEventPreferredTime[opt.value as keyof typeof TriplanEventPreferredTime];
		const numericVal = Number(opt.value);

		return (
			optEnumVal === randomPreferredTimeEnum ||
			(numericVal === randomPreferredTimeEnum && !isNaN(numericVal)) ||
			opt.value === preferredTimeKeyName
		);
	});

	if (matchingOption) {
		runInAction(() => {
			eventStore.modalValues['preferred-time'] = matchingOption;
		});

		await new Promise((resolve) => setTimeout(resolve, 150));
	}
};

export const simulateDoubleClickCalendarSlot = async (eventStore: EventStore): Promise<void> => {
	const hours = [8, 9, 10];
	const randomHour = hours[Math.floor(Math.random() * hours.length)];

	await new Promise((resolve) => setTimeout(resolve, 500));

	// @ts-ignore
	const calendarApi = window.triplanCalendarApi;

	if (!calendarApi) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		// @ts-ignore
		if (window.triplanCalendarApi) {
			// @ts-ignore
			const api = window.triplanCalendarApi;
			return await selectTimeSlot(api, randomHour, eventStore);
		}
		return;
	}

	await selectTimeSlot(calendarApi, randomHour, eventStore);

	await new Promise((resolve) => setTimeout(resolve, 1000));

	const chooseWhereButton = document.querySelector(
		'.add-calendar-event-modal-choose-where > button:first-child'
	) as HTMLElement;
	if (!chooseWhereButton) {
		return;
	}

	chooseWhereButton.click();

	await new Promise((resolve) => setTimeout(resolve, 800));

	const allSidebarEvents = eventStore.allSidebarEvents;
	if (allSidebarEvents.length === 0) {
		return;
	}

	const firstEvent = allSidebarEvents[0];
	const selectedOption = {
		value: firstEvent.id,
		label: firstEvent.title,
	};

	runInAction(() => {
		eventStore.modalValues['sidebar-event-to-add-to-calendar'] = selectedOption;
	});

	await new Promise((resolve) => setTimeout(resolve, 300));

	eventStore.setCalendarEvents([
		...eventStore.getJSCalendarEvents(),
		{
			...firstEvent,
			start: new Date(new Date(eventStore.customDateRange.start).setHours(randomHour, 0, 0, 0)),
			end: new Date(new Date(eventStore.customDateRange.start).setHours(randomHour + 1, 0, 0, 0)),
			allDay: false,
		},
	]);

	ReactModalService.internal.closeModal(eventStore);
};

const selectTimeSlot = async (calendarApi: any, randomHour: number, eventStore: EventStore): Promise<void> => {
	if (!calendarApi.view) {
		return;
	}

	const view = calendarApi.view;
	const activeStart = new Date(view.activeStart);

	const timeGridBody = document.querySelector('.fc-timegrid-body');
	if (!timeGridBody) {
		return;
	}

	const dayColumns = Array.from(timeGridBody.querySelectorAll('.fc-timegrid-col'));
	const randomDayIndex = Math.floor(Math.random() * Math.min(dayColumns.length, 7));

	const startDate = addDays(new Date(activeStart), randomDayIndex);
	startDate.setHours(randomHour, 0, 0, 0);

	const endDate = addHours(new Date(startDate), 1);

	if (calendarApi.select) {
		try {
			calendarApi.select(startDate, endDate);
			await new Promise((resolve) => setTimeout(resolve, 400));
			return;
		} catch (e) {
			// Fall through to direct callback
		}
	}

	// @ts-ignore
	const onCalendarSelect = window.onCalendarSelect;
	if (onCalendarSelect && typeof onCalendarSelect === 'function') {
		const selectionInfo = {
			start: startDate,
			end: endDate,
			allDay: false,
		};
		try {
			onCalendarSelect(selectionInfo);
			await new Promise((resolve) => setTimeout(resolve, 400));
		} catch (e) {
			// Ignore errors
		}
	}
};
