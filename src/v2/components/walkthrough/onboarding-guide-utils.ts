import TranslateService from '../../../services/translate-service';
import { EventStore } from '../../../stores/events-store';

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
