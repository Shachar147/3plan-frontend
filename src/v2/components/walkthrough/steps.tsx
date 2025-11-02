import React from 'react';
import { Step } from 'react-joyride';
import TranslateService from '../../../services/translate-service';
import { exploreTabId, myTripsTabId, savedCollectionsTabId } from '../../utils/consts';
import { EventStore } from '../../../stores/events-store';
import { RootStore } from '../../stores/root-store';
import {
	generateRandomTripName,
	simulateTyping,
	triggerReactOnChange,
	simulateSearchOnMap,
	closeAutocompletePicker,
} from './onboarding-guide-utils';
import { ViewMode } from '../../../utils/enums';
import { WalkthroughStore } from '../../stores/walkthrough-store';

export enum GuideMode {
	MAIN_PAGE = 'main_page',
	PLAN = 'plan',
}

export interface CustomStep extends Step {
	beforeAction?: () => Promise<void>;
	duringAction?: () => Promise<void>;
	afterAction?: () => Promise<void>;
	scrollToCenter?: boolean;
	container?: string;
	customPositionOffset?: number; // Horizontal offset in pixels (negative = left, positive = right)
	customPositionOffsetPercent?: boolean; // If true, offset is a percentage of screen width
	autoAdvance?: boolean; // If true, Next button is disabled and step auto-advances after beforeAction completes
	customZIndex?: number; // Custom z-index for this step (overrides default)
}

const mainPageSteps = (eventStore: EventStore, rootStore: RootStore): CustomStep[] => {
	return [
		{
			target: eventStore.isMobile ? '[data-walkthrough="slogan"]' : '[data-walkthrough="logo"]',
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
			target: '[data-walkthrough="search-box"]',
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
			target: `[data-walkthrough="tab-${exploreTabId}"]`,
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
			target: `[data-walkthrough="tab-${savedCollectionsTabId}"]`,
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
			target: `[data-walkthrough="tab-${myTripsTabId}"]`,
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
					const { tripName, location } = generateRandomTripName(eventStore);
					localStorage.setItem('triplan-walkthrough-trip-name', tripName);
					localStorage.setItem('triplan-walkthrough-trip-location', location);
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
			duringAction: async () => {
				const location = localStorage.getItem('triplan-walkthrough-trip-location');
				if (location) {
					localStorage.removeItem('triplan-walkthrough-trip-location');

					// Find the destination selector container
					const selectorContainer = document.querySelector('[data-walkthrough="destinations-input"]');
					if (selectorContainer) {
						console.log('selectorContainer', selectorContainer);
						// Step 1: Click the react-select control to open the menu
						const selectControl = selectorContainer.querySelector('.select__control') as HTMLElement;
						if (selectControl) {
							selectControl.click();
							// Wait for menu to open
							await new Promise((resolve) => setTimeout(resolve, 300));
						}

						// Step 2: Find the react-select input (available after menu opens)
						const reactSelectInput =
							(selectorContainer.querySelector('input[id*="react-select"]') as HTMLInputElement) ||
							(selectorContainer.querySelector('.select__input') as HTMLInputElement) ||
							(selectorContainer.querySelector('input[type="text"]') as HTMLInputElement) ||
							(document.querySelector('input[id*="react-select"]') as HTMLInputElement);

						if (reactSelectInput) {
							console.log('reactSelectInput', reactSelectInput);
							// Focus and click the input to ensure it's active
							reactSelectInput.focus();
							reactSelectInput.click();
							await new Promise((resolve) => setTimeout(resolve, 200));

							// Step 3: Type the location name character by character (lowercase for better matching)
							const locationLower = location.toLowerCase();

							// Try to trigger react-select's onInputChange directly through React internals
							const reactKey = Object.keys(reactSelectInput).find(
								(key) => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
							);

							for (let i = 0; i < locationLower.length; i++) {
								const currentValue = locationLower.substring(0, i + 1);
								const char = locationLower[i];

								// Set the value using native setter
								const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
									HTMLInputElement.prototype,
									'value'
								)?.set;
								if (nativeInputValueSetter) {
									nativeInputValueSetter.call(reactSelectInput, currentValue);
								} else {
									reactSelectInput.value = currentValue;
								}

								// Try to call react-select's onInputChange directly if we can find it
								if (reactKey) {
									// @ts-ignore - accessing React internals
									const reactInstance = reactSelectInput[reactKey];
									if (reactInstance) {
										let props =
											reactInstance.memoizedProps ||
											reactInstance.pendingProps ||
											reactInstance.props;
										if (!props && reactInstance.return) {
											props =
												reactInstance.return.memoizedProps ||
												reactInstance.return.pendingProps ||
												reactInstance.return.props;
										}
										// React-select's input might have onInputChange in a parent component
										// Try to find it by traversing up
										let current = reactInstance;
										for (let j = 0; j < 5 && current; j++) {
											const parentProps =
												current.memoizedProps || current.pendingProps || current.props;
											if (parentProps && parentProps.onInputChange) {
												try {
													parentProps.onInputChange(currentValue);
												} catch (e) {
													// Fall through to event dispatch
												}
												break;
											}
											current = current.return;
										}
									}
								}

								// Trigger input event for react-select's onInputChange handler
								const inputEvent = new InputEvent('input', {
									bubbles: true,
									cancelable: true,
									inputType: 'insertText',
									data: char,
								});
								reactSelectInput.dispatchEvent(inputEvent);

								// Also dispatch regular input event as fallback
								const fallbackEvent = new Event('input', { bubbles: true, cancelable: true });
								reactSelectInput.dispatchEvent(fallbackEvent);

								// Wait before next character
								await new Promise((resolve) => setTimeout(resolve, 80));
							}

							// Step 4: Wait for dropdown to filter and render options
							await new Promise((resolve) => setTimeout(resolve, 800));

							// Step 5: Find and click the first option (retry with increasing delays)
							for (let attempt = 0; attempt < 5; attempt++) {
								// Look for the menu - could be in selector container or document body (if menuPortalTarget is used)
								const menu =
									(selectorContainer.querySelector('.select__menu') as HTMLElement) ||
									(document.querySelector('.select__menu') as HTMLElement) ||
									(document.querySelector('[class*="menu"]') as HTMLElement);

								if (menu) {
									// Find the first option (skip placeholder if exists)
									const allOptions = menu.querySelectorAll(
										'.select__option, [class*="option"], div[role="option"]'
									);
									let firstOption: HTMLElement | null = null;

									for (let j = 0; j < allOptions.length; j++) {
										const option = allOptions[j] as HTMLElement;
										// Skip placeholder options
										if (!option.className.includes('placeholder') && option.offsetParent !== null) {
											firstOption = option;
											break;
										}
									}

									if (firstOption) {
										// Scroll option into view if needed
										firstOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
										await new Promise((resolve) => setTimeout(resolve, 200));

										// Click the option with mouse events (react-select listens to these)
										const mouseDown = new MouseEvent('mousedown', {
											bubbles: true,
											cancelable: true,
											view: window,
										});
										const mouseUp = new MouseEvent('mouseup', {
											bubbles: true,
											cancelable: true,
											view: window,
										});
										const clickEvent = new MouseEvent('click', {
											bubbles: true,
											cancelable: true,
											view: window,
										});

										firstOption.dispatchEvent(mouseDown);
										await new Promise((resolve) => setTimeout(resolve, 50));
										firstOption.dispatchEvent(mouseUp);
										await new Promise((resolve) => setTimeout(resolve, 50));
										firstOption.click();

										await new Promise((resolve) => setTimeout(resolve, 400));
										break;
									}
								}

								// Wait a bit more and retry with exponential backoff
								await new Promise((resolve) => setTimeout(resolve, 200 + attempt * 100));
							}
						}
					}
				}
			},
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
	];
};

const planSteps = (eventStore: EventStore, walkthroughStore: WalkthroughStore): CustomStep[] => {
	// todo complete:
	// 4. explain about calendar view and how to schedule.
	// 5. explain about the importance of priority (and the colors), and categories (and the icons).
	// 6. note that if you scheduled something you can write 'הוזמן' at the description to mark it as booked.
	// 7. explain about itinerary view.
	// 8. explain about list view.
	// 9. congratulations! you are now experts on planning trips!
	return [
		{
			// target: `[data-tab-id=${eventStore.viewMode}]`,
			target: '.tabular.menu',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.TABULAR_MENU')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.TABULAR_MENU_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			disableBeacon: true,
		},
		(eventStore.viewMode === ViewMode.feed ||
			(eventStore.isMobile && eventStore.mobileViewMode === ViewMode.feed)) && {
			target: '[data-walkthrough="tab-feed"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.FEED_VIEW')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.FEED_VIEW_DESC')}</p>
				</div>
			),
		},
		{
			target: '[data-walkthrough="sidebar-categories"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SIDEBAR_CATEGORIES')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SIDEBAR_CATEGORIES_DESC')}</p>
				</div>
			),
			placement: eventStore.isRtl ? 'left' : 'right',
			scrollToCenter: true,
			container: '.external-events-container',
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
			target: '[data-walkthrough="tab-map"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_VIEW')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_VIEW_DESC')}</p>
				</div>
			),
			placement: 'bottom',
			afterAction: async () => {
				setTimeout(() => {
					eventStore.setViewMode(ViewMode.map);
				}, 1500);
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
			target: 'body',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_DEMO')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.MAP_DEMO_DESC')}</p>
				</div>
			),
			placement: 'center',
			disableBeacon: true,
			// Position at middle of left/right 1/3 based on RTL
			// Modal takes center 1/3 (33.33% to 66.66%)
			// Middle of left 1/3 = 16.67%, offset from center = -33.33%
			// Middle of right 1/3 = 83.33%, offset from center = +33.33%
			customPositionOffset: eventStore.isRtl ? -33.33 : 33.33, // RTL: right, LTR: left
			customPositionOffsetPercent: true,
			autoAdvance: true, // Auto-advance to next step after beforeAction completes
			beforeAction: async () => {
				const searchInput = document.querySelector('[data-walkthrough="map-search"]') as HTMLInputElement;
				if (searchInput) {
					return await simulateSearchOnMap(searchInput, 'Big Ben London', eventStore);
				} else {
					console.error('Search input not found, stopping walkthrough');
				}
			},
		},
		{
			target: '.triplan-react-modal',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL_DESC')}</p>
				</div>
			),
			disableBeacon: false,
			placement: eventStore.isRtl ? 'left' : 'right',
			customZIndex: 5399, // Use lower z-index so tooltip appears below modal
			customPositionOffset: undefined,
			customPositionOffsetPercent: undefined,
			beforeAction: async () => {
				// Close Google Places autocomplete dropdown if it's open
				const searchInput = document.querySelector('[data-walkthrough="map-search"]') as HTMLInputElement;
				if (searchInput) {
					closeAutocompletePicker(searchInput);
				}
			},
		},
		{
			target: '.show-hide-more',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.SHOW_MORE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.SHOW_MORE_DESC')}</p>
				</div>
			),
			disableBeacon: false,
			placement: 'top', //eventStore.isRtl ? 'left' : 'right',
		},
		{
			target: '.primary-button',
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
	].filter(Boolean) as CustomStep[];
};

export const getOnboardingGuideSteps = (
	eventStore: EventStore,
	rootStore: RootStore,
	walkthroughStore: WalkthroughStore,
	mode: GuideMode = GuideMode.MAIN_PAGE
): CustomStep[] => {
	if (mode === GuideMode.PLAN) {
		return planSteps(eventStore, walkthroughStore);
	}
	// GuideMode.MAIN_PAGE
	return mainPageSteps(eventStore, rootStore);
};
