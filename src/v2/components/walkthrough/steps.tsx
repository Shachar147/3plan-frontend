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
	setRandomPriority,
	setRandomPreferredTime,
	setLastAddedCategoryId,
	LOCATION_POIS,
	getLastAddedCategoryId,
	simulateDoubleClickCalendarSlot,
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
	fixSpotlightPosition?: boolean; // If true, the spotlight position will be fixed
	delay?: number; // Delay in milliseconds before showing the step
}

const mainPageSteps = (eventStore: EventStore, rootStore: RootStore): CustomStep[] => {
	return [
		{
			// target: eventStore.isMobile ? '[data-walkthrough="slogan"]' : '[data-walkthrough="logo"]',
			target: 'body',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.WELCOME_TITLE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.WELCOME_DESC')}</p>
				</div>
			),
			placement: 'center',
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

					const selectorContainer = document.querySelector('[data-walkthrough="destinations-input"]');
					if (selectorContainer) {
						const selectControl = selectorContainer.querySelector('.select__control') as HTMLElement;
						if (selectControl) {
							selectControl.click();
							await new Promise((resolve) => setTimeout(resolve, 300));
						}

						const reactSelectInput =
							(selectorContainer.querySelector('input[id*="react-select"]') as HTMLInputElement) ||
							(selectorContainer.querySelector('.select__input') as HTMLInputElement) ||
							(selectorContainer.querySelector('input[type="text"]') as HTMLInputElement) ||
							(document.querySelector('input[id*="react-select"]') as HTMLInputElement);

						if (reactSelectInput) {
							reactSelectInput.focus();
							reactSelectInput.click();
							await new Promise((resolve) => setTimeout(resolve, 200));

							const locationLower = location.toLowerCase();

							const reactKey = Object.keys(reactSelectInput).find(
								(key) => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
							);

							for (let i = 0; i < locationLower.length; i++) {
								const currentValue = locationLower.substring(0, i + 1);
								const char = locationLower[i];

								const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
									HTMLInputElement.prototype,
									'value'
								)?.set;
								if (nativeInputValueSetter) {
									nativeInputValueSetter.call(reactSelectInput, currentValue);
								} else {
									reactSelectInput.value = currentValue;
								}

								if (reactKey) {
									// @ts-ignore
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
										let current = reactInstance;
										for (let j = 0; j < 5 && current; j++) {
											const parentProps =
												current.memoizedProps || current.pendingProps || current.props;
											if (parentProps && parentProps.onInputChange) {
												try {
													parentProps.onInputChange(currentValue);
												} catch (e) {
													// Fall through
												}
												break;
											}
											current = current.return;
										}
									}
								}

								const inputEvent = new InputEvent('input', {
									bubbles: true,
									cancelable: true,
									inputType: 'insertText',
									data: char,
								});
								reactSelectInput.dispatchEvent(inputEvent);

								const fallbackEvent = new Event('input', { bubbles: true, cancelable: true });
								reactSelectInput.dispatchEvent(fallbackEvent);

								await new Promise((resolve) => setTimeout(resolve, 80));
							}

							await new Promise((resolve) => setTimeout(resolve, 800));

							for (let attempt = 0; attempt < 5; attempt++) {
								const menu =
									(selectorContainer.querySelector('.select__menu') as HTMLElement) ||
									(document.querySelector('.select__menu') as HTMLElement) ||
									(document.querySelector('[class*="menu"]') as HTMLElement);

								if (menu) {
									const allOptions = menu.querySelectorAll(
										'.select__option, [class*="option"], div[role="option"]'
									);
									let firstOption: HTMLElement | null = null;

									for (let j = 0; j < allOptions.length; j++) {
										const option = allOptions[j] as HTMLElement;
										if (!option.className.includes('placeholder') && option.offsetParent !== null) {
											firstOption = option;
											break;
										}
									}

									if (firstOption) {
										firstOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
										await new Promise((resolve) => setTimeout(resolve, 200));

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

										firstOption.dispatchEvent(mouseDown);
										await new Promise((resolve) => setTimeout(resolve, 50));
										firstOption.dispatchEvent(mouseUp);
										await new Promise((resolve) => setTimeout(resolve, 50));
										firstOption.click();

										await new Promise((resolve) => setTimeout(resolve, 400));
										break;
									}
								}

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
				const button = document.querySelector('[data-walkthrough="submit-trip"]') as HTMLElement;
				if (button) {
					button.click();
				}

				setTimeout(() => {
					window.location.reload(); // to reload destinations tab
				}, 1500);
			},
		},
	];
};

const planSteps = (eventStore: EventStore, walkthroughStore: WalkthroughStore): CustomStep[] => {
	return [
		{
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
				eventStore.setViewMode(ViewMode.map);
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
			customPositionOffset: eventStore.isRtl ? -33.33 : 33.33,
			customPositionOffsetPercent: true,
			autoAdvance: true,
			beforeAction: async () => {
				const searchInput = document.querySelector('[data-walkthrough="map-search"]') as HTMLInputElement;
				if (searchInput) {
					const randomLocation = eventStore.destinations?.[0];
					const randomPois = LOCATION_POIS[randomLocation as keyof typeof LOCATION_POIS];
					const randomPoi = randomPois[Math.floor(Math.random() * randomPois.length)];
					return await simulateSearchOnMap(searchInput, randomPoi, eventStore);
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
			customZIndex: 5399,
			beforeAction: async () => {
				const button = document.querySelector('.triplan-react-modal .primary-button') as HTMLButtonElement;
				if (button) {
					button.disabled = true;
					button.classList.add('disabled');
				}
			},
		},
		{
			target: '.category-row',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.CATEGORY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.CATEGORY_DESC')}</p>
				</div>
			),
			disableBeacon: false,
			placement: 'top',
			customZIndex: undefined,
			fixSpotlightPosition: true,
		},
		{
			target: '.priority-row',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.PRIORITY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.PRIORITY_DESC')}</p>
				</div>
			),
			disableBeacon: false,
			placement: 'top',
			fixSpotlightPosition: true,
			afterAction: async () => {
				await setRandomPriority(eventStore);
			},
		},
		{
			target: '.preferred-time-row',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.PREFERRED_TIME')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.ACTIVITY_MODAL.PREFERRED_TIME_DESC')}</p>
				</div>
			),
			disableBeacon: false,
			placement: 'top',
			fixSpotlightPosition: true,
			afterAction: async () => {
				await setRandomPreferredTime(eventStore);
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
			placement: 'top',
			fixSpotlightPosition: true,
		},
		{
			target: '.triplan-react-modal .primary-button',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_ACTIVITY')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.SUBMIT_ACTIVITY_DESC')}</p>
				</div>
			),
			placement: 'top',
			afterAction: async () => {
				const categoryOption = eventStore.modalValues['category'] as
					| { value: number; label: string }
					| undefined;
				const categoryId = categoryOption?.value;
				if (categoryId) {
					setLastAddedCategoryId(categoryId);
				}

				const button = document.querySelector('.triplan-react-modal .primary-button') as HTMLElement;
				if (button) {
					button.click();
				}

				const sidebarCategory = document.querySelector(
					`[data-walkthrough="category-sidebar-${getLastAddedCategoryId()}"]`
				) as HTMLElement;
				if (sidebarCategory) {
					sidebarCategory.click();
				}

				const clickSwalConfirm = () => {
					const button = document.querySelector('.triplan-react-modal .primary-button') as HTMLButtonElement;
					if (button) {
						button.classList.remove('disabled');
					}
					const confirmButton = document.querySelector('.swal2-confirm') as HTMLElement;
					if (confirmButton) {
						confirmButton.click();
					}
				};
				setTimeout(clickSwalConfirm, 1000);
				setTimeout(clickSwalConfirm, 1500);
				setTimeout(clickSwalConfirm, 2000);
				setTimeout(clickSwalConfirm, 3000);
				setTimeout(clickSwalConfirm, 4000);

				eventStore.setViewMode(ViewMode.calendar);
			},
			disableBeacon: true,
			fixSpotlightPosition: true,
		},
		{
			target: `.external-events:has([data-walkthrough="category-sidebar-${getLastAddedCategoryId()}"])`,
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CATEGORY_SIDEBAR')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CATEGORY_SIDEBAR_DESC')}</p>
				</div>
			),
			placement: eventStore.isRtl ? 'left' : 'right',
			delay: 2500,
		},
		{
			target: '[data-walkthrough="tab-calendar"]',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.CALENDAR_VIEW')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.CALENDAR_VIEW_DESC')}</p>
				</div>
			),
			placement: 'bottom',
		},
		{
			target: '.fc-view-harness',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.DRAG_TO_CALENDAR')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.DRAG_TO_CALENDAR_DESC')}</p>
				</div>
			),
			placement: eventStore.isRtl ? 'right' : 'left',
			fixSpotlightPosition: true,
			customZIndex: 5399,
			beforeAction: async () => {
				return await simulateDoubleClickCalendarSlot(eventStore);
			},
			autoAdvance: true,
		},
		{
			target: 'body',
			content: (
				<div>
					<h3>{TranslateService.translate(eventStore, 'WALKTHROUGH.COMPLETE')}</h3>
					<p>{TranslateService.translate(eventStore, 'WALKTHROUGH.COMPLETE_DESC')}</p>
				</div>
			),
			placement: 'center',
			disableBeacon: true,
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
	return mainPageSteps(eventStore, rootStore);
};
