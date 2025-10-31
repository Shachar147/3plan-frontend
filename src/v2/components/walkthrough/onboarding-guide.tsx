import React, { useContext, useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { myTripsContext } from '../../stores/my-trips-store';
import { rootStoreContext } from '../../stores/root-store';
import { walkthroughStoreContext } from '../../stores/walkthrough-store';
import { exploreTabId, myTripsTabId, savedCollectionsTabId } from '../../utils/consts';
import TranslateService from '../../../services/translate-service';
import './onboarding-guide.scss';

interface CustomStep extends Step {
	beforeAction?: () => Promise<void> | void;
	duringAction?: () => Promise<void> | void;
	afterAction?: () => Promise<void> | void;
}

function OnboardingGuide() {
	const eventStore = useContext(eventStoreContext);
	const myTripsStore = useContext(myTripsContext);
	const rootStore = useContext(rootStoreContext);
	const walkthroughStore = useContext(walkthroughStoreContext);

	const [run, setRun] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);

	// Helper function to scroll to element with -100px offset
	const scrollToElementWithOffset = (element: HTMLElement, offset = -150) => {
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset + offset;

		window.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

	// Generate random trip name with location
	const generateRandomTripName = (): string => {
		const locations = [
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
		return `${tripName} (${exampleText})`;
	};

	// Trigger React onChange handler directly
	const triggerReactOnChange = (inputElement: HTMLInputElement, value: string) => {
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
	const simulateTyping = async (inputElement: HTMLInputElement, text: string, speed = 60) => {
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

	// Define all walkthrough steps
	const steps: CustomStep[] = [
		{
			target: '.header-logo',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.WELCOME_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.WELCOME_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			disableBeacon: true,
		},
		{
			target: '.search-box',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SEARCH_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SEARCH_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			afterAction: async () => {
				rootStore.navigateToTab(exploreTabId);
			},
		},
		{
			target: '[data-tab-id="explore"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.EXPLORE_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.EXPLORE_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			afterAction: async () => {
				rootStore.navigateToTab(savedCollectionsTabId);
			},
		},
		{
			target: '[data-tab-id="saved-collections"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SAVED_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SAVED_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			afterAction: async () => {
				rootStore.navigateToTab(myTripsTabId);
			},
		},
		{
			target: '[data-tab-id="my-trips"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MY_TRIPS_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MY_TRIPS_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '[data-walkthrough="create-trip-btn"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_TRIP_BTN')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_TRIP_BTN_DESC')}</p>
				</div>
			),
			placement: 'top',
			afterAction: async () => {
				const button = document.querySelector('[data-walkthrough="create-trip-btn"]') as HTMLElement;
				if (button) {
					button.click();
				}
			},
		},
		{
			target: '[data-walkthrough="create-trip-form"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_TRIP_FORM')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_TRIP_FORM_DESC')}</p>
				</div>
			),
			placement: eventStore.isRtl ? 'left' : 'right',
		},
		{
			target: '[data-walkthrough="trip-name-input"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.TRIP_NAME')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.TRIP_NAME_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			duringAction: async () => {
				const inputElement = document.querySelector('[data-walkthrough="trip-name-input"]') as HTMLInputElement;
				if (inputElement) {
					const tripName = generateRandomTripName();
					localStorage.setItem('triplan-walkthrough-trip-name', tripName);
					await simulateTyping(inputElement, tripName, 60);
				}
			},
			afterAction: async () => {
				// in case the user hit next quickly, to still write the name.
				const tripName = localStorage.getItem('triplan-walkthrough-trip-name');
				if (tripName) {
					localStorage.removeItem('triplan-walkthrough-trip-name');
					const inputElement = document.querySelector(
						'[data-walkthrough="trip-name-input"]'
					) as HTMLInputElement;
					if (inputElement) {
						triggerReactOnChange(inputElement, tripName);
					}
				}
			},
		},
		{
			target: '[data-walkthrough="destinations-input"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.DESTINATIONS')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.DESTINATIONS_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '[data-walkthrough="date-range"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.DATES')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.DATES_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '[data-walkthrough="submit-trip"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_TRIP')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_TRIP_DESC')}</p>
				</div>
			),
			placement: 'top',
			afterAction: async () => {
				// Click submit button
				const button = document.querySelector('[data-walkthrough="submit-trip"]') as HTMLElement;
				if (button) {
					button.click();
				}
				// Wait for redirect to plan page
				await new Promise((resolve) => setTimeout(resolve, 2000));
			},
		},
		{
			target: '.triplan-sidebar-categories',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SIDEBAR_CATEGORIES')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SIDEBAR_CATEGORIES_DESC')}</p>
				</div>
			),
			placement: 'right',
		},
		{
			target: '[data-walkthrough="create-category-btn"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_CATEGORY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CREATE_CATEGORY_DESC')}</p>
				</div>
			),
			placement: 'right',
		},
		{
			target: '[data-walkthrough="add-activity-btn"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ADD_ACTIVITY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ADD_ACTIVITY_DESC')}</p>
				</div>
			),
			placement: 'right',
		},
		{
			target: '[data-walkthrough="map-view-btn"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_VIEW')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_VIEW_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			beforeAction: async () => {
				// Switch to map view
				const button = document.querySelector('[data-walkthrough="map-view-btn"]') as HTMLElement;
				if (button) {
					button.click();
				}
				await new Promise((resolve) => setTimeout(resolve, 800));
			},
		},
		{
			target: '[data-walkthrough="map-search"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_SEARCH')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_SEARCH_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '[data-walkthrough="map-search"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_DEMO')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_DEMO_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			beforeAction: async () => {
				// Type "Big Ben London" in search
				const searchInput = document.querySelector('[data-walkthrough="map-search"]') as HTMLInputElement;
				if (searchInput) {
					searchInput.value = 'Big Ben London';
					searchInput.dispatchEvent(new Event('input', { bubbles: true }));
					searchInput.dispatchEvent(new Event('change', { bubbles: true }));
				}
				// Wait for results to appear
				await new Promise((resolve) => setTimeout(resolve, 2000));
				// Click on marker
				const marker = document.querySelector('.map-marker') as HTMLElement;
				if (marker) {
					marker.click();
				}
			},
		},
		{
			target: '.add-activity-modal',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL_DESC')}</p>
				</div>
			),
			placement: 'center',
		},
		{
			target: '[data-walkthrough="submit-activity"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_ACTIVITY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_ACTIVITY_DESC')}</p>
				</div>
			),
			placement: 'top',
			beforeAction: async () => {
				// Click submit activity button
				const button = document.querySelector('[data-walkthrough="submit-activity"]') as HTMLElement;
				if (button) {
					button.click();
				}
				await new Promise((resolve) => setTimeout(resolve, 500));
			},
		},
		{
			target: '[data-walkthrough="calendar-view-btn"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CALENDAR_VIEW')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CALENDAR_VIEW_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			beforeAction: async () => {
				// Switch to calendar view
				const button = document.querySelector('[data-walkthrough="calendar-view-btn"]') as HTMLElement;
				if (button) {
					button.click();
				}
				await new Promise((resolve) => setTimeout(resolve, 800));
			},
		},
		{
			target: '[data-walkthrough="category-sidebar"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CATEGORY_SIDEBAR')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CATEGORY_SIDEBAR_DESC')}</p>
				</div>
			),
			placement: 'right',
		},
		{
			target: '[data-walkthrough="drag-to-calendar"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.DRAG_TO_CALENDAR')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.DRAG_TO_CALENDAR_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '.triplan-header-banner',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.COMPLETE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.COMPLETE_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
	];

	// Auto-start walkthrough for new users
	useEffect(() => {
		if (walkthroughStore.shouldAutoStart && myTripsStore.totalTrips === 0) {
			// Small delay to ensure page is fully loaded
			const timer = setTimeout(() => {
				setRun(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [walkthroughStore.shouldAutoStart, myTripsStore.totalTrips]);

	// Handle walkthrough callbacks
	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status, type, index } = data;

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
			setRun(false);
			walkthroughStore.completeWalkthrough();
		}

		if (type === 'step:before') {
			const currentStep = steps[index];
			if (currentStep && currentStep.beforeAction) {
				currentStep.beforeAction();
			}
		}

		if (type === 'step:after') {
			const currentStep = steps[index];
			if (currentStep && currentStep.afterAction) {
				currentStep.afterAction();
			}
			setStepIndex(index + 1);
		}

		// After tooltip is shown, scroll to target element with offset
		if (type === 'tooltip') {
			const currentStep = steps[index];

			setTimeout(() => {
				if (currentStep && currentStep.target) {
					const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
					if (targetElement) {
						scrollToElementWithOffset(targetElement);
					}
				}
			}, 100);

			if (currentStep) {
				setTimeout(() => {
					currentStep.duringAction?.();
				}, 1500);
			}
		}
	};

	// Start walkthrough manually
	const startWalkthrough = () => {
		setRun(true);
		setStepIndex(0);
	};

	// Expose start function for help icon
	useEffect(() => {
		// @ts-ignore
		window.startWalkthrough = startWalkthrough;
	}, []);

	// Fix button text translation after Joyride renders
	useEffect(() => {
		if (!run) return;

		const updateButtonText = () => {
			const nextButton = document.querySelector(
				'.react-joyride__tooltip button[data-action="primary"]'
			) as HTMLElement;
			if (nextButton) {
				const currentText = nextButton.textContent || '';
				// Replace "Next" with Hebrew translation if current language is Hebrew
				if (eventStore.calendarLocalCode === 'he') {
					const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');
					// Check if button shows progress format like "Next (Step 1 of 23)"
					if (currentText.includes('(Step') || currentText.includes('(שלב')) {
						const match = currentText.match(/\((.+)\)/);
						if (match) {
							// Extract step number part and replace "Step" with Hebrew equivalent
							const stepPart = match[1]
								.replace(/Step/g, 'שלב')
								.replace(/step/g, 'שלב')
								.replace(/of/g, 'מתוך');
							nextButton.textContent = `${nextText} (${stepPart})`;
						}
					} else {
						// Simple replacement if no progress text
						nextButton.textContent = nextText;
					}
				}
			}
		};

		// Update immediately and also after delays to catch dynamic updates
		updateButtonText();
		const timers = [
			setTimeout(updateButtonText, 50),
			setTimeout(updateButtonText, 150),
			setTimeout(updateButtonText, 300),
		];

		// Use MutationObserver to watch for button text changes
		const observer = new MutationObserver(updateButtonText);
		const tooltip = document.querySelector('.react-joyride__tooltip');
		if (tooltip) {
			observer.observe(tooltip, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		return () => {
			timers.forEach((timer) => clearTimeout(timer));
			observer.disconnect();
		};
	}, [run, stepIndex, eventStore.calendarLocalCode]);

	// Get translated strings
	const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');
	const backText = TranslateService.translate(eventStore, 'WALKTHROUGH.BACK');
	const skipText = TranslateService.translate(eventStore, 'WALKTHROUGH.SKIP');
	const finishText = TranslateService.translate(eventStore, 'WALKTHROUGH.FINISH');

	// Create custom locale object with proper translations
	const joyrideLocale = {
		back: backText,
		close: skipText,
		last: finishText,
		next: nextText,
		skip: skipText,
	};

	return (
		<Joyride
			steps={steps}
			run={run}
			stepIndex={stepIndex}
			callback={handleJoyrideCallback}
			continuous
			showProgress
			showSkipButton
			disableScrolling={true}
			styles={{
				options: {
					primaryColor: '#007bff',
					textColor: '#333',
					backgroundColor: '#fff',
					overlayColor: 'rgba(0, 0, 0, 0.5)',
					arrowColor: '#fff',
					width: 400,
				},
			}}
			locale={joyrideLocale}
		/>
	);
}

export default observer(OnboardingGuide);
