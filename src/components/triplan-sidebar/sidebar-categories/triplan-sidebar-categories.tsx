import TranslateService from '../../../services/translate-service';
import Button, { ButtonFlavor } from '../../common/button/button';
import {
	addLineBreaks,
	calendarOrSidebarEventDetails,
	getClasses,
	isHotelsCategory,
	ucfirst,
	locationToString,
	getCoordinatesRangeKey,
} from '../../../utils/utils';
import { CalendarEvent, SidebarEvent, TriPlanCategory } from '../../../utils/interfaces';
import ReactModalService from '../../../services/react-modal-service';
import React, { CSSProperties, useContext, useEffect, useMemo, useRef } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { GoogleTravelMode, prioritiesOrder, TriplanEventPreferredTime, TriplanPriority } from '../../../utils/enums';
import { modalsStoreContext } from '../../../stores/modals-store';
import './triplan-sidebar-categories.scss';
import { renderLineWithText } from '../../../utils/ui-utils';
import TriplanSidebarDraggableEvent from '../sidebar-draggable-event/triplan-sidebar-draggable-event';
import { observer } from 'mobx-react';
import SidebarSearch from '../sidebar-search/sidebar-search';
import { priorityToColor } from '../../../utils/consts';

interface TriplanSidebarCategoriesProps {
	removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
	addToEventsToCategories: (event: SidebarEvent) => void;
	TriplanCalendarRef: React.MutableRefObject<HTMLDivElement>;
	addEventToSidebar: (event: SidebarEvent) => boolean;
}

function TriplanSidebarCategories(props: TriplanSidebarCategoriesProps) {
	const { removeEventFromSidebarById, addToEventsToCategories, TriplanCalendarRef } = props;
	const eventStore = useContext(eventStoreContext);
	const modalsStore = useContext(modalsStoreContext);

	// Store previous threshold values to detect changes
	const prevThresholdValues = useRef({
		driving: eventStore.sidebarSettings.get('area-driving-threshold') || 5,
		walking: eventStore.sidebarSettings.get('area-walking-threshold') || 2,
	});

	// Memoize area calculation to prevent frequent recalculations
	const [recalculateAreas, setRecalculateAreas] = React.useState(0);
	const [isRecalculating, setIsRecalculating] = React.useState(false);

	// Add these new states at the top of the component, with other states
	const [editingAreaName, setEditingAreaName] = React.useState<string | null>(null);
	const [editingValue, setEditingValue] = React.useState('');

	// Set up effect to detect threshold changes
	useEffect(() => {
		if (eventStore.sidebarGroupBy !== 'area') return;

		const drivingThreshold = eventStore.sidebarSettings.get('area-driving-threshold') || 5;
		const walkingThreshold = eventStore.sidebarSettings.get('area-walking-threshold') || 2;

		// Only recalculate if the thresholds have changed
		if (
			drivingThreshold !== prevThresholdValues.current.driving ||
			walkingThreshold !== prevThresholdValues.current.walking
		) {
			// Show recalculating indicator
			setIsRecalculating(true);

			// Update the previous values immediately
			prevThresholdValues.current = {
				driving: drivingThreshold,
				walking: walkingThreshold,
			};

			// Use a setTimeout with a safety mechanism to ensure loading indicator is removed
			const timerId = setTimeout(() => {
				// Trigger the recalculation
				setRecalculateAreas((prev) => prev + 1);

				// Ensure loading indicator is removed
				setIsRecalculating(false);

				// Clean up orphaned area names when thresholds change
				try {
					eventStore.cleanupOrphanedAreaNames();
				} catch (error) {
					console.error('Error cleaning up area names:', error);
				}
			}, 300);

			// Add safety timeout to clear loading state if something goes wrong
			const safetyTimerId = setTimeout(() => {
				if (isRecalculating) {
					setIsRecalculating(false);
				}
			}, 2000);

			return () => {
				clearTimeout(timerId);
				clearTimeout(safetyTimerId);
			};
		}
	}, [
		eventStore.sidebarSettings.get('area-driving-threshold'),
		eventStore.sidebarSettings.get('area-walking-threshold'),
		eventStore.sidebarGroupBy,
	]);

	// Check if we need to recalculate areas
	useEffect(() => {
		if (eventStore.sidebarGroupBy !== 'area' || !eventStore.distanceResults.size) return;

		setIsRecalculating(true);

		// Using setTimeout to allow the UI to update before recalculating
		setTimeout(() => {
			try {
				// Force re-render of the component
				setRecalculateAreas((prev) => prev);
			} catch (error) {
				console.error('Error calculating areas:', error);
			} finally {
				setIsRecalculating(false);
			}
		}, 0);
	}, [
		eventStore.distanceResults.size,
		recalculateAreas,
		eventStore.sidebarGroupBy,
		eventStore.calendarEvents.length,
		eventStore.isFiltered,
	]);

	function renderExpandCollapse() {
		const eyeIcon = eventStore.hideEmptyCategories || eventStore.isFiltered ? 'fa-eye' : 'fa-eye-slash';
		const expandMinimizedEnabled =
			eventStore.hideEmptyCategories || eventStore.isFiltered
				? Object.values(eventStore.getSidebarEvents).flat().length > 0
				: eventStore.categories.length > 0;

		return (
			<>
				<div className="category-actions">
					<Button
						disabled={!expandMinimizedEnabled}
						flavor={ButtonFlavor.link}
						onClick={eventStore.openAllCategories.bind(eventStore)}
						icon="fa-plus-square-o"
						text={TranslateService.translate(eventStore, 'EXPAND_ALL')}
					/>
					<div className="sidebar-statistics padding-0">{` | `}</div>
					<Button
						disabled={!expandMinimizedEnabled}
						flavor={ButtonFlavor.link}
						className="padding-inline-start-10"
						onClick={eventStore.closeAllCategories.bind(eventStore)}
						icon="fa-minus-square-o"
						text={TranslateService.translate(eventStore, 'COLLAPSE_ALL')}
					/>
					<div className="sidebar-statistics padding-0">{` | `}</div>
					<Button
						className={getClasses(
							'padding-inline-10',
							(eventStore.hideEmptyCategories || eventStore.isFiltered) && 'blue-color'
						)}
						onClick={() => eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories)}
						disabled={eventStore.isFiltered}
						disabledReason={TranslateService.translate(eventStore, 'ON_FILTER_EMPTY_CATEGORIES_ARE_HIDDEN')}
						flavor={ButtonFlavor.link}
						icon={eyeIcon}
						text={TranslateService.translate(
							eventStore,
							!eventStore.hideEmptyCategories ? 'SHOW_EMPTY_CATEGORIES' : 'HIDE_EMPTY_CATEGORIES'
						)}
					/>
				</div>
			</>
		);
	}

	function renderNoDisplayedCategoriesPlaceholder() {
		return (
			<div className="sidebar-statistics">
				{TranslateService.translate(eventStore, 'NO_DISPLAYED_CATEGORIES')}
			</div>
		);
	}

	function renderNoItemsInCategoryPlaceholder(category: TriPlanCategory) {
		if (!category.description) return null; // indication that it is a default category
		const categoryEvents = eventStore.getSidebarEvents[category.id] || [];
		if (categoryEvents.length) return null;
		const scheduledEvents = eventStore.calendarEvents.filter(
			(e) => e.category.toString() === category.id.toString()
		);
		if (scheduledEvents.length) return null;

		return (
			<div className="flex-row justify-content-center text-align-center opacity-0-3 width-100-percents padding-inline-15">
				{TranslateService.translate(eventStore, category.description)}
			</div>
		);
	}

	let totalDisplayedCategories = 0;

	function renderPriorities() {
		// todo complete: remove inline style
		const closedStyle = {
			maxHeight: 0,
			overflowY: 'hidden',
			padding: 0,
			transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
		};
		const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';
		const borderStyle = '1px solid rgba(0, 0, 0, 0.05)';

		return (
			<>
				{prioritiesOrder.map((priorityVal, index) => {
					const priority = priorityVal as unknown as TriplanPriority;
					const priorityText = TranslateService.translate(eventStore, TriplanPriority[priority]);
					const color = priorityToColor[priority];

					const sidebarItemsCount = eventStore.allFilteredSidebarEvents.filter(
						(s) => s.priority == priority
					)?.length;
					const calendarItemsCount = eventStore.filteredCalendarEvents.filter((e) => {
						return e.priority == priority;
					}).length;

					const itemsCount = sidebarItemsCount + calendarItemsCount;
					const totalItemsCountTooltip =
						calendarItemsCount > 0
							? TranslateService.translate(eventStore, 'TOTAL_ITEMS_COUNT.TOOLTIP')
									.replace('{X}', calendarItemsCount.toString())
									.replace('{Y}', sidebarItemsCount.toString())
							: undefined;

					if ((eventStore.hideEmptyCategories || eventStore.isFiltered) && sidebarItemsCount === 0) {
						// itemsCount <- to prevent hiding non-empty category that all of it's items inside are scheduled.
						return <></>;
					}
					totalDisplayedCategories++;

					const openStyle = {
						// maxHeight: 100 * sidebarItemsCount + 90 + 'px',
						padding: '10px',
						transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
					};

					const isOpen = eventStore.openCategories.has(priority);
					const eventsStyle = isOpen ? openStyle : closedStyle;

					return (
						<div className="external-events" key={priority}>
							<div
								className="sidebar-statistics sidebar-group"
								style={{
									borderBottom: borderStyle,
									borderTop: index === 0 ? borderStyle : '0',
								}}
								onClick={() => eventStore.toggleCategory(priority)}
							>
								<i
									className={
										isOpen ? 'fa fa-angle-double-down' : `fa fa-angle-double-${arrowDirection}`
									}
									aria-hidden="true"
								/>
								<span>
									<i className="fa fa-sticky-note" aria-hidden="true" style={{ color: color }} />
									&nbsp;
									{priorityText}
								</span>
								<div title={totalItemsCountTooltip}>
									({sidebarItemsCount}/{itemsCount})
								</div>
							</div>
							<div style={eventsStyle as unknown as CSSProperties}>
								{renderPriorityEvents(priority)}
								{renderAddSidebarPriorityEventButton(priority)}
							</div>
						</div>
					);
				})}
			</>
		);
	}

	// Generate the area key consistently
	const generateAreaKey = (areaEvents: any[]) => {
		try {
			// Use the EventStore's generateAreaKey method if available
			if (eventStore.generateAreaKey) {
				return eventStore.generateAreaKey(areaEvents);
			}

			// Fallback: generate key directly
			const eventIds = areaEvents.map((event) => event.id).sort();
			return 'events_' + eventIds.join('|');
		} catch (error) {
			console.error('Error generating area key in sidebar:', error);
			return '';
		}
	};

	function renderAreas() {
		// Calculate areas based on distance results
		const areasMap = new Map<string, SidebarEvent[]>();
		const sidebarEvents = [
			...eventStore.allFilteredSidebarEvents,
			// Do not include calendar events here since they'll be handled separately in renderAreaEvents
			// The calendar events were being included twice - once here and once in the scheduled events section
		];

		const noLocationText = TranslateService.translate(eventStore, 'NO_LOCATION');

		// Default area for events without location
		areasMap.set(
			noLocationText,
			sidebarEvents.filter(
				(event) => !event.location || (typeof event.location === 'string' && event.location === '')
			)
		);

		// Group events by proximity (if we have distance results)
		if (eventStore.distanceResults && eventStore.distanceResults.size > 0) {
			// Create proximity clusters - filter out events without proper location data
			const eventsWithLocation = sidebarEvents.filter(
				(event) =>
					event.location &&
					typeof event.location !== 'string' &&
					event.location.latitude != null &&
					event.location.longitude != null
			);

			// Process each event with location
			for (const event of eventsWithLocation) {
				let foundCluster = false;

				// Try to add to existing clusters
				for (const [areaName, areaEvents] of Array.from(areasMap.entries())) {
					if (areaName === noLocationText) continue;

					// Check if this event is close to any event in this cluster
					for (const areaEvent of areaEvents) {
						if (
							!areaEvent.location ||
							typeof areaEvent.location === 'string' ||
							!areaEvent.location.latitude ||
							!areaEvent.location.longitude ||
							!event.location ||
							!event.location.latitude ||
							!event.location.longitude
						) {
							continue;
						}

						// Safety check in case of corrupted data
						try {
							const loc1 = {
								lat: areaEvent.location.latitude,
								lng: areaEvent.location.longitude,
								eventName: areaEvent.title,
							};

							const loc2 = {
								lat: event.location.latitude,
								lng: event.location.longitude,
								eventName: event.title,
							};

							const distanceKey = getCoordinatesRangeKey(GoogleTravelMode.DRIVING, loc1, loc2);
							const distanceKey2 = getCoordinatesRangeKey(GoogleTravelMode.WALKING, loc1, loc2);
							const distanceA = eventStore.distanceResults.get(distanceKey);
							const distanceB = eventStore.distanceResults.get(distanceKey2);

							// Get threshold values from settings (with fallbacks to default values)
							const drivingThresholdKilometers = Number(
								eventStore.sidebarSettings.get('area-driving-threshold') || 5
							);
							const walkingThresholdKilometers = Number(
								eventStore.sidebarSettings.get('area-walking-threshold') || 2
							);

							if (
								(distanceA &&
									distanceA.distance_value &&
									Number(distanceA.distance_value) <= drivingThresholdKilometers * 1000) || // Convert km to meters
								(distanceB &&
									distanceB.distance_value &&
									Number(distanceB.distance_value) <= walkingThresholdKilometers * 1000) // Convert km to meters
							) {
								// Add to this cluster
								areaEvents.push(event);
								foundCluster = true;
								break;
							}
						} catch (error) {
							console.warn('Error calculating distance between events:', error);
							continue;
						}
					}

					if (foundCluster) break;
				}

				// If event doesn't fit any cluster, create a new one
				if (!foundCluster) {
					const areaName = TranslateService.translate(eventStore, 'AREA_X', {
						X: areasMap.size,
					});
					areasMap.set(areaName, [event]);
				}
			}
		} else {
			// If distance calculation hasn't been run, group by location string
			const locationGroups = new Map<string, SidebarEvent[]>();

			sidebarEvents.forEach((event) => {
				if (event.location) {
					try {
						// Handle different location types
						let loc = '';
						if (typeof event.location === 'string') {
							loc = event.location;
						} else if (event.location && typeof event.location === 'object') {
							// Location is a LocationData object
							loc = locationToString(event.location);
						}

						if (loc && !locationGroups.has(loc)) {
							locationGroups.set(loc, []);
						}
						if (loc) {
							locationGroups.get(loc)?.push(event);
						}
					} catch (error) {
						console.warn('Error processing event location:', error);
					}
				}
			});

			// Add location groups to areas map
			locationGroups.forEach((events, location) => {
				if (location) {
					// Only use first 15 chars of location as area name
					const shortLocation = location.length > 15 ? location.substring(0, 15) + '...' : location;
					areasMap.set(shortLocation, events);
				}
			});
		}

		// Remove empty areas when filtering is active
		// Always remove empty areas when searching
		if (eventStore.searchValue || eventStore.isFiltered) {
			for (const [areaName, areaEvents] of Array.from(areasMap.entries())) {
				if (areaEvents.length === 0) {
					areasMap.delete(areaName);
				}
			}
		}

		// Check if each area will show any matching events after considering scheduled events
		// This prevents showing empty areas when searching
		if (eventStore.sidebarSearchValue) {
			for (const [areaName, areaEvents] of Array.from(areasMap.entries())) {
				// Get the locations for this area
				const areaLocations = areaEvents.map((event) => event.location);

				// Check if any scheduled events match by location and search term
				const hasMatchingScheduledEvents = eventStore.filteredCalendarEvents.some((calEvent) => {
					// Check if the event matches search term
					const matchesSearch =
						calEvent.title?.toLowerCase().indexOf(eventStore.sidebarSearchValue.toLowerCase()) > -1 ||
						(calEvent.description &&
							calEvent.description.toLowerCase().indexOf(eventStore.sidebarSearchValue.toLowerCase()) >
								-1) ||
						(calEvent.location &&
							calEvent.location.address &&
							calEvent.location.address
								.toLowerCase()
								.indexOf(eventStore.sidebarSearchValue.toLowerCase()) > -1);

					if (!matchesSearch) return false;

					// Then check if it matches any location in this area
					return areaLocations.some((areaLoc) => {
						try {
							if (!areaLoc && !calEvent.location) {
								return true;
							}
							if (typeof areaLoc === 'string' && typeof calEvent.location === 'string') {
								return areaLoc === calEvent.location;
							} else if (
								typeof areaLoc !== 'string' &&
								typeof calEvent.location !== 'string' &&
								areaLoc.latitude &&
								areaLoc.longitude &&
								calEvent.location.latitude &&
								calEvent.location.longitude
							) {
								// Compare lat/long for LocationData objects
								return (
									areaLoc.latitude == calEvent.location.latitude &&
									areaLoc.longitude == calEvent.location.longitude
								);
							}
						} catch (error) {
							console.warn('Error comparing locations:', error);
						}
						return false;
					});
				});

				// Keep area if it has either matching sidebar events or matching scheduled events
				if (areaEvents.length === 0 && !hasMatchingScheduledEvents) {
					areasMap.delete(areaName);
				}
			}
		}

		// Sort areas
		let sortedAreas = Array.from(areasMap.entries()).sort((a, b) => {
			// [0] is area name, [1] is array of events
			return b[1].length - a[1].length;
		});

		// Style definitions for collapsible areas
		const closedStyle = {
			maxHeight: 0,
			overflowY: 'hidden',
			padding: 0,
			transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
		};
		const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';
		const borderStyle = '1px solid rgba(0, 0, 0, 0.05)';

		// Handler for saving edited area name
		const handleSaveAreaName = (areaEvents: any[]) => {
			if (!editingValue) return;

			try {
				// Generate a consistent area key from the area events
				const eventIds = areaEvents.map((event) => event.id).sort();

				// Use the EventStore's generateAreaKey method if available
				const areaKey = generateAreaKey(areaEvents);

				// Save the custom name
				eventStore.customAreaNames.set(areaKey, editingValue);
				eventStore.saveCustomAreaNames();

				// Reset editing state
				setEditingAreaName(null);
				setEditingValue('');
			} catch (error) {
				console.error('Error saving area name:', error);
			}
		};

		// Handler for handling key press in the input field
		const handleKeyPress = (event: React.KeyboardEvent, areaEvents: SidebarEvent[]) => {
			if (event.key === 'Enter') {
				handleSaveAreaName(areaEvents);
			}
		};

		// Handler for starting name edit
		const handleStartEditing = (areaName: string, customName: string) => {
			setEditingAreaName(areaName);
			setEditingValue(customName);
		};

		return (
			<>
				{sortedAreas.map(([defaultAreaName, areaEvents], index) => {
					const sidebarItemsCount = eventStore.allSidebarEvents.filter((s) =>
						areaEvents.map((e) => e.id).includes(s.id)
					).length;

					if (eventStore.hideEmptyCategories && sidebarItemsCount == 0) {
						return;
					}

					const itemsCount = areaEvents.length;

					if ((eventStore.hideEmptyCategories || eventStore.isFiltered) && areaEvents.length === 0) {
						return <></>;
					}
					totalDisplayedCategories++;

					const openStyle = {
						padding: '10px',
						transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
					};

					// Look up the custom area name for this group of events
					const areaKey = generateAreaKey(areaEvents);

					// Get the custom name directly from the observable map
					const customAreaName = eventStore.customAreaNames.get(areaKey);

					// Determine the area name to display
					const areaNameToDisplay = customAreaName || defaultAreaName;

					// Cast areaName to string type for openCategories.has()
					const isOpen = eventStore.openCategories.has(defaultAreaName as any);
					const eventsStyle = isOpen ? openStyle : closedStyle;

					return (
						<div className="external-events" key={defaultAreaName}>
							<div
								className="sidebar-statistics sidebar-group"
								style={{
									borderBottom: borderStyle,
									borderTop: index === 0 ? borderStyle : '0',
								}}
								onClick={() => {
									// Cast areaName to any for toggleCategory()
									eventStore.toggleCategory(defaultAreaName as any);
								}}
							>
								<i
									className={
										isOpen ? 'fa fa-angle-double-down' : `fa fa-angle-double-${arrowDirection}`
									}
									aria-hidden="true"
								/>
								<span className="flex-row align-items-center gap-5">
									<i className="fa fa-map-marker" aria-hidden="true" />
									&nbsp;
									{editingAreaName === defaultAreaName ? (
										<input
											type="text"
											value={editingValue}
											onChange={(e) => setEditingValue(e.target.value)}
											onBlur={(e) => handleSaveAreaName(areaEvents)}
											onKeyPress={(e) => handleKeyPress(e, areaEvents)}
											onClick={(e) => e.stopPropagation()}
											placeholder={TranslateService.translate(
												eventStore,
												'AREA_CUSTOM_NAME_PLACEHOLDER'
											)}
											title={TranslateService.translate(eventStore, 'EDIT_AREA_NAME')}
											autoFocus
											style={{
												width: '150px',
												padding: '2px 5px',
												border: '1px solid var(--gray-light)',
											}}
										/>
									) : (
										<>
											{areaNameToDisplay}
											{defaultAreaName !== noLocationText && (
												<i
													className="fa fa-pencil cursor-pointer opacity-0-5 opacity-1-hover"
													aria-hidden="true"
													onClick={(e) => {
														e.stopPropagation();
														handleStartEditing(defaultAreaName, areaNameToDisplay);
													}}
													title={TranslateService.translate(eventStore, 'EDIT_AREA_NAME')}
													style={{ marginLeft: '5px', fontSize: '0.8em' }}
												/>
											)}
										</>
									)}
								</span>
								<div>
									({sidebarItemsCount}/{itemsCount})
								</div>
							</div>
							<div style={eventsStyle as unknown as CSSProperties}>
								{renderAreaEvents(defaultAreaName, areaEvents)}
							</div>
						</div>
					);
				})}
			</>
		);
	}

	function renderCategories() {
		// todo complete: remove inline style
		const closedStyle = {
			maxHeight: 0,
			overflowY: 'hidden',
			padding: 0,
			transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
		};
		const editIconStyle = {
			display: 'flex',
			justifyContent: 'flex-end',
			flexGrow: 1,
			paddingInline: '10px',
			gap: '10px',
			color: 'var(--gray)',
		};
		const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';
		const borderStyle = '1px solid rgba(0, 0, 0, 0.05)';

		return (
			<>
				{eventStore.categories.map((triplanCategory, index) => {
					const sidebarItemsCount = (eventStore.getSidebarEvents[triplanCategory.id] || []).length;

					const calendarItemsCount = eventStore.filteredCalendarEvents.filter((e) => {
						return e.category.toString() == triplanCategory.id.toString();
					}).length;

					const itemsCount = sidebarItemsCount + calendarItemsCount;
					const totalItemsCountTooltip =
						calendarItemsCount > 0
							? TranslateService.translate(eventStore, 'TOTAL_ITEMS_COUNT.TOOLTIP')
									.replace('{X}', calendarItemsCount.toString())
									.replace('{Y}', sidebarItemsCount.toString())
							: undefined;

					if ((eventStore.hideEmptyCategories || eventStore.isFiltered) && sidebarItemsCount === 0) {
						// itemsCount <- to prevent hiding non-empty category that all of it's items inside are scheduled.
						return <></>;
					}
					totalDisplayedCategories++;

					const openStyle = {
						// maxHeight: 100 * sidebarItemsCount + 90 + 'px',
						padding: '10px',
						transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
					};

					const isOpen = eventStore.openCategories.has(triplanCategory.id);
					const eventsStyle = isOpen ? openStyle : closedStyle;

					return (
						<div className="external-events" key={triplanCategory.id}>
							<div
								className="sidebar-statistics sidebar-group"
								style={{
									borderBottom: borderStyle,
									borderTop: index === 0 ? borderStyle : '0',
								}}
								onClick={() => eventStore.toggleCategory(triplanCategory.id)}
							>
								<i
									className={
										isOpen ? 'fa fa-angle-double-down' : `fa fa-angle-double-${arrowDirection}`
									}
									aria-hidden="true"
								/>
								<span>
									{triplanCategory.icon ? `${triplanCategory.icon} ` : ''}
									{triplanCategory.title}
								</span>
								<div title={totalItemsCountTooltip}>
									({sidebarItemsCount}/{itemsCount})
								</div>
								<div style={editIconStyle}>
									<i
										className={getClasses(
											'fa fa-pencil-square-o',
											eventStore.isTripLocked && 'display-none'
										)}
										aria-hidden="true"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onEditCategory(triplanCategory.id);
										}}
									/>
									<i
										className={getClasses(
											'fa fa-trash-o',
											eventStore.isTripLocked && 'display-none',
											'position-relative',
											'top--1'
										)}
										aria-hidden="true"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											ReactModalService.openDeleteCategoryModal(eventStore, triplanCategory.id);
										}}
									/>
								</div>
							</div>
							<div style={eventsStyle as unknown as CSSProperties}>
								{renderNoItemsInCategoryPlaceholder(triplanCategory)}
								{renderCategoryEvents(triplanCategory.id)}
								{renderAddSidebarEventButton(triplanCategory)}
							</div>
						</div>
					);
				})}
			</>
		);
	}

	function renderShowingXOutOfY() {
		if (!eventStore.isFiltered) {
			return null;
		}

		const filteredText = TranslateService.translate(eventStore, 'SIDEBAR.SHOWING_X_OF_Y', {
			X: eventStore.allFilteredSidebarEvents.length,
			Y: eventStore.allSidebarEvents.length,
		});
		const clickHereText = TranslateService.translate(eventStore, 'GENERAL.CLICK_HERE');

		return (
			<div className="triplan-sidebar-filtered-text">
				<span>{filteredText}</span>
				<Button
					flavor={ButtonFlavor.link}
					className="blue-color min-height-0 padding-0"
					text={clickHereText}
					onClick={() => eventStore.resetFilters()}
				/>
			</div>
		);
	}

	function onEditCategory(categoryId: number) {
		return ReactModalService.openEditCategoryModal(TriplanCalendarRef, eventStore, categoryId);
	}

	const renderAddSidebarPriorityEventButton = (priority: TriplanPriority) => {
		return (
			<Button
				flavor={ButtonFlavor.secondary}
				className="width-100-percents margin-block-10"
				onClick={() =>
					ReactModalService.openAddSidebarEventModal(eventStore, undefined, { priority: priority })
				}
				text={TranslateService.translate(eventStore, 'ADD_EVENT.BUTTON_TEXT')}
				icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
				disabled={eventStore.isTripLocked}
				disabledReason={TranslateService.translate(eventStore, 'TRIP_IS_LOCKED')}
			/>
		);
	};

	const renderAddSidebarEventButton = (category: TriPlanCategory) => {
		const isHotel = isHotelsCategory(category);
		return (
			<Button
				flavor={ButtonFlavor.secondary}
				className="width-100-percents margin-block-10"
				onClick={() => ReactModalService.openAddSidebarEventModal(eventStore, category.id)}
				text={TranslateService.translate(
					eventStore,
					isHotel ? 'ADD_HOTEL.BUTTON_TEXT' : 'ADD_EVENT.BUTTON_TEXT'
				)}
				icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
				disabled={eventStore.isTripLocked}
				disabledReason={TranslateService.translate(eventStore, 'TRIP_IS_LOCKED')}
			/>
		);
	};

	const renderPriorityEvents = (priority: TriplanPriority) => {
		const priorityEvents = eventStore.allFilteredSidebarEvents.filter((s) => s.priority == priority);

		const preferredHoursHash: Record<string, SidebarEvent[]> = {};

		Object.keys(TriplanEventPreferredTime)
			.filter((x) => !Number.isNaN(Number(x)))
			.forEach((preferredHour) => {
				preferredHoursHash[preferredHour] = priorityEvents
					.map((x) => {
						x.preferredTime ||= TriplanEventPreferredTime.unset;
						x.title = addLineBreaks(x.title, ', ');
						if (x.description != undefined) {
							x.description = addLineBreaks(x.description, '&#10;');
						}
						return x;
					})
					.filter((x: SidebarEvent) => x.preferredTime?.toString() === preferredHour.toString())
					.sort(sortByPriority);
			});

		if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0) {
			return null;
		}

		const eventsByPreferredHour = Object.keys(preferredHoursHash)
			.filter((x) => preferredHoursHash[x].length > 0)
			.map((preferredHour: string) => {
				let preferredHourString: string = TriplanEventPreferredTime[preferredHour];

				if (preferredHourString == 'unset' && eventStore.isHebrew) {
					preferredHourString = 'unset.male';
				}

				return (
					<div key={`${priority}-${preferredHour}`}>
						{renderLineWithText(
							`${TranslateService.translate(eventStore, 'TIME')}: ${ucfirst(
								TranslateService.translate(eventStore, preferredHourString)
							)} (${preferredHoursHash[preferredHour].length})`
						)}
						<div>{renderPreferredHourEventsByPriority(priority, preferredHoursHash[preferredHour])}</div>
					</div>
				);
			});

		const scheduledEvents = eventStore.filteredCalendarEvents.filter(
			(e) => e.priority.toString() === priority.toString()
		);

		return (
			<>
				{eventsByPreferredHour}
				{scheduledEvents.length > 0 && !eventStore.sidebarSettings.get('hide-scheduled') && (
					<div key={`${priority}-scheduled-events`}>
						{renderLineWithText(
							`${TranslateService.translate(eventStore, 'SCHEDULED_EVENTS.SHORT')} (${
								scheduledEvents.length
							})`
						)}
						<div>{renderScheduledEventsByPriority(priority, scheduledEvents)}</div>
					</div>
				)}
			</>
		);
	};

	const renderCategoryEvents = (categoryId: number) => {
		const categoryEvents = eventStore.getSidebarEvents[categoryId] || [];

		const preferredHoursHash: Record<string, SidebarEvent[]> = {};

		Object.keys(TriplanEventPreferredTime)
			.filter((x) => !Number.isNaN(Number(x)))
			.forEach((preferredHour) => {
				preferredHoursHash[preferredHour] = categoryEvents
					.map((x) => {
						x.preferredTime ||= TriplanEventPreferredTime.unset;
						x.title = addLineBreaks(x.title, ', ');
						if (x.description != undefined) {
							x.description = addLineBreaks(x.description, '&#10;');
						}
						return x;
					})
					.filter((x: SidebarEvent) => x.preferredTime?.toString() === preferredHour.toString())
					.sort(sortByPriority);
			});

		// console.log("category events", categoryEvents, "by hour", preferredHoursHash);

		if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0) {
			return null;
		}

		const eventsByPreferredHour = Object.keys(preferredHoursHash)
			.filter((x) => preferredHoursHash[x].length > 0)
			.map((preferredHour: string) => {
				let preferredHourString: string = TriplanEventPreferredTime[preferredHour];
				if (preferredHourString == 'unset' && eventStore.isHebrew) {
					preferredHourString = 'unset.male';
				}
				return (
					<div key={`${categoryId}-${preferredHour}`}>
						{renderLineWithText(
							`${TranslateService.translate(eventStore, 'TIME')}: ${ucfirst(
								TranslateService.translate(eventStore, preferredHourString)
							)} (${preferredHoursHash[preferredHour].length})`
						)}
						<div>{renderPreferredHourEvents(categoryId, preferredHoursHash[preferredHour])}</div>
					</div>
				);
			});

		const scheduledEvents = eventStore.filteredCalendarEvents.filter(
			(e) => e.category.toString() === categoryId.toString()
		);

		return (
			<>
				{eventsByPreferredHour}
				{scheduledEvents.length > 0 && !eventStore.sidebarSettings.get('hide-scheduled') && (
					<div key={`${categoryId}-scheduled-events`}>
						{renderLineWithText(
							`${TranslateService.translate(eventStore, 'SCHEDULED_EVENTS.SHORT')} (${
								scheduledEvents.length
							})`
						)}
						<div>{renderScheduledEvents(categoryId, scheduledEvents)}</div>
					</div>
				)}
			</>
		);
	};

	const sortByPriority = (a: SidebarEvent, b: SidebarEvent) => {
		if (!a.priority) a.priority = TriplanPriority.unset;
		if (!b.priority) b.priority = TriplanPriority.unset;
		return a.priority - b.priority;
	};

	const renderPreferredHourEvents = (categoryId: number, events: SidebarEvent[]) => {
		const order = prioritiesOrder;

		events = events
			.map((event) => {
				event.category = categoryId.toString();
				return event;
			})
			.sort((a, b) => {
				let A = order.indexOf(Number(a.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);
				let B = order.indexOf(Number(b.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);

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

		return (
			<div className="flex-column gap-5">
				{events.map((event) => (
					<TriplanSidebarDraggableEvent
						event={event}
						categoryId={categoryId}
						removeEventFromSidebarById={removeEventFromSidebarById}
						addToEventsToCategories={addToEventsToCategories}
						addEventToSidebar={(e) => {
							props.addEventToSidebar(e);
						}}
					/>
				))}
			</div>
		);
	};

	const renderPreferredHourEventsByPriority = (priority: TriplanPriority, events: SidebarEvent[]) => {
		const order = prioritiesOrder;

		events = events.sort((a, b) => {
			let A = order.indexOf(Number(a.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);
			let B = order.indexOf(Number(b.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);

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

		return (
			<div className="flex-column gap-5">
				{events.map((event) => (
					<TriplanSidebarDraggableEvent
						event={event}
						categoryId={Number(event.category)}
						removeEventFromSidebarById={removeEventFromSidebarById}
						addToEventsToCategories={addToEventsToCategories}
						addEventToSidebar={(e) => {
							props.addEventToSidebar(e);
						}}
					/>
				))}
			</div>
		);
	};

	const renderScheduledEvents = (categoryId: number, events: CalendarEvent[]) => {
		const order = prioritiesOrder;

		events = events
			.map((event) => {
				event.category = categoryId.toString();
				return event;
			})
			.sort((a, b) => {
				let A = order.indexOf(Number(a.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);
				let B = order.indexOf(Number(b.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);

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
		return (
			<div className="flex-column gap-5">
				{events.map((event, idx) => (
					<TriplanSidebarDraggableEvent
						event={event}
						categoryId={categoryId}
						addToEventsToCategories={addToEventsToCategories}
						removeEventFromSidebarById={removeEventFromSidebarById}
						fullActions={false}
						eventTitleSuffix={calendarOrSidebarEventDetails(eventStore, event)}
						addEventToSidebar={(e) => {
							props.addEventToSidebar(e);
						}}
						_onClick={() => {
							const calendarEvent = eventStore.calendarEvents.find((y) => y.id == event.id)!;
							if (typeof calendarEvent.start === 'string') {
								calendarEvent.start = new Date(calendarEvent.start);
							}
							if (typeof calendarEvent.end === 'string') {
								calendarEvent.end = new Date(calendarEvent.end);
							}
							modalsStore.switchToViewMode();
							ReactModalService.openEditCalendarEventModal(
								eventStore,
								props.addEventToSidebar,
								{
									event: {
										...calendarEvent,
										_def: calendarEvent,
									},
								},
								modalsStore
							);
						}}
					/>
				))}
			</div>
		);
	};

	const renderScheduledEventsByPriority = (priority: TriplanPriority, events: CalendarEvent[]) => {
		const order = prioritiesOrder;

		events = events.sort((a, b) => {
			let A = order.indexOf(Number(a.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);
			let B = order.indexOf(Number(b.priority ?? TriplanPriority.unset) as unknown as TriplanPriority);

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
		return (
			<div className="flex-column gap-5">
				{events.map((event, idx) => (
					<TriplanSidebarDraggableEvent
						event={event}
						categoryId={Number(event.category)}
						addToEventsToCategories={addToEventsToCategories}
						removeEventFromSidebarById={removeEventFromSidebarById}
						fullActions={false}
						eventTitleSuffix={calendarOrSidebarEventDetails(eventStore, event)}
						addEventToSidebar={(e) => {
							props.addEventToSidebar(e);
						}}
						_onClick={() => {
							const calendarEvent = eventStore.calendarEvents.find((y) => y.id == event.id)!;
							if (typeof calendarEvent.start === 'string') {
								calendarEvent.start = new Date(calendarEvent.start);
							}
							if (typeof calendarEvent.end === 'string') {
								calendarEvent.end = new Date(calendarEvent.end);
							}
							modalsStore.switchToViewMode();
							ReactModalService.openEditCalendarEventModal(
								eventStore,
								props.addEventToSidebar,
								{
									event: {
										...calendarEvent,
										_def: calendarEvent,
									},
								},
								modalsStore
							);
						}}
					/>
				))}
			</div>
		);
	};

	// Add a new helper function to render area events by preferred time
	const renderAreaEvents = (areaName: string, areaEvents: SidebarEvent[]) => {
		try {
			const preferredHoursHash: Record<string, SidebarEvent[]> = {};

			const sidebarEventIds = eventStore.allFilteredSidebarEvents.map((s) => s.id);

			Object.keys(TriplanEventPreferredTime)
				.filter((x) => !Number.isNaN(Number(x)))
				.forEach((preferredHour) => {
					preferredHoursHash[preferredHour] = areaEvents
						.map((x) => {
							x.preferredTime = x.preferredTime || TriplanEventPreferredTime.unset;
							x.title = addLineBreaks(x.title, ', ');
							if (x.description != undefined) {
								x.description = addLineBreaks(x.description, '&#10;');
							}
							return x;
						})
						.filter(
							(x: SidebarEvent) =>
								x.preferredTime?.toString() === preferredHour.toString() &&
								sidebarEventIds.includes(x.id)
						)
						.sort(sortByPriority);
				});

			// Only render preferred hours if there are matching events
			const eventsByPreferredHour = Object.keys(preferredHoursHash)
				.filter((preferredHourString) => preferredHoursHash[preferredHourString].length > 0)
				.map((preferredHourString) => {
					const translatedPreferredHour = TranslateService.translate(
						eventStore,
						getPreferredHourTranslationKey(Number(preferredHourString))
					);
					return (
						<div
							key={`${areaName}-${preferredHourString}`}
							className="text-transform-capitalize margin-block-4"
						>
							{renderLineWithText(
								`${translatedPreferredHour} (${preferredHoursHash[preferredHourString].length})`
							)}

							<div className="flex-column gap-5">
								{preferredHoursHash[preferredHourString].map((event) => (
									<TriplanSidebarDraggableEvent
										key={event.id}
										event={event}
										categoryId={Number(event.category)}
										addToEventsToCategories={addToEventsToCategories}
										removeEventFromSidebarById={removeEventFromSidebarById}
										eventTitleSuffix={calendarOrSidebarEventDetails(eventStore, event)}
										addEventToSidebar={(e) => props.addEventToSidebar(e)}
									/>
								))}
							</div>
						</div>
					);
				});

			// For all areas, get matching scheduled events
			let scheduledEvents: CalendarEvent[] = [];

			// Don't show scheduled events if hide-scheduled setting is on
			const shouldShowScheduledEvents = !eventStore.sidebarSettings.get('hide-scheduled');

			if (shouldShowScheduledEvents) {
				// Check if this is a special "Found Activities" area created just for search results
				// We know it's a special area if it has no events but was still included in the rendering
				const isSpecialSearchArea = areaEvents.length === 0 && eventStore.searchValue;

				// For regular areas with events, get locations for this area
				const areaLocations = areaEvents.map((event) => event.location);

				// Filter calendar events based on search and area
				scheduledEvents = eventStore.filteredCalendarEvents.filter((calEvent) => {
					// First check if event matches search term
					if (eventStore.searchValue && !checkIfEventMatchesSearch(calEvent, eventStore.searchValue)) {
						return false;
					}

					// For special search areas with no events
					if (isSpecialSearchArea) {
						// Match all search results for the generic "Found Activities" area
						return true;
					}

					// For regular areas, check if location matches
					return areaLocations.some((areaLoc) => {
						try {
							if (!areaLoc && !calEvent.location) {
								return true;
							}
							if (typeof areaLoc === 'string' && typeof calEvent.location === 'string') {
								return areaLoc === calEvent.location;
							} else if (
								typeof areaLoc !== 'string' &&
								typeof calEvent.location !== 'string' &&
								areaLoc?.latitude &&
								areaLoc?.longitude &&
								calEvent.location?.latitude &&
								calEvent.location?.longitude
							) {
								// Compare lat/long for LocationData objects
								return (
									areaLoc.latitude == calEvent.location.latitude &&
									areaLoc.longitude == calEvent.location.longitude
								);
							}
						} catch (error) {
							console.warn('Error comparing locations:', error);
						}
						return false;
					});
				});
			}

			// Don't render this area if we're searching and nothing matches
			if (eventStore.searchValue && eventsByPreferredHour.length === 0 && scheduledEvents.length === 0) {
				return null;
			}

			return (
				<>
					{areaEvents.length === 0 && scheduledEvents.length === 0 && (
						<div className="flex-row justify-content-center text-align-center opacity-0-3 width-100-percents padding-inline-15">
							{TranslateService.translate(eventStore, 'NO_ITEMS')}
						</div>
					)}
					{eventsByPreferredHour}
					{scheduledEvents.length > 0 && (
						<div key={`${areaName}-scheduled-events`}>
							{renderLineWithText(
								`${TranslateService.translate(eventStore, 'SCHEDULED_EVENTS.SHORT')} (${
									scheduledEvents.length
								})`
							)}
							<div className="flex-column gap-5">
								{scheduledEvents.map((event) => (
									<TriplanSidebarDraggableEvent
										key={event.id}
										event={event}
										categoryId={Number(event.category)}
										addToEventsToCategories={addToEventsToCategories}
										removeEventFromSidebarById={removeEventFromSidebarById}
										fullActions={false}
										eventTitleSuffix={calendarOrSidebarEventDetails(eventStore, event)}
										addEventToSidebar={(e) => {
											props.addEventToSidebar(e);
										}}
										_onClick={() => {
											const calendarEvent = eventStore.calendarEvents.find(
												(y) => y.id == event.id
											)!;
											if (typeof calendarEvent.start === 'string') {
												calendarEvent.start = new Date(calendarEvent.start);
											}
											if (typeof calendarEvent.end === 'string') {
												calendarEvent.end = new Date(calendarEvent.end);
											}
											modalsStore.switchToViewMode();
											ReactModalService.openEditCalendarEventModal(
												eventStore,
												props.addEventToSidebar,
												{
													event: {
														...calendarEvent,
														_def: calendarEvent,
													},
												},
												modalsStore
											);
										}}
									/>
								))}
							</div>
						</div>
					)}
				</>
			);
		} catch (error) {
			console.error('Error in renderAreaEvents:', error);
			return (
				<div className="flex-row justify-content-center text-align-center opacity-0-3 width-100-percents padding-inline-15">
					{TranslateService.translate(eventStore, 'ERROR_RENDERING_AREA')}
				</div>
			);
		}
	};

	// Helper to get the preferred hour translation key based on enum value
	const getPreferredHourTranslationKey = (preferredHourValue: number): string => {
		let preferredHourString = TriplanEventPreferredTime[preferredHourValue];
		if (preferredHourString === 'unset' && eventStore.isHebrew) {
			preferredHourString = 'unset.male';
		}
		return preferredHourString;
	};

	return (
		<>
			{renderExpandCollapse()}
			<SidebarSearch />
			{totalDisplayedCategories >= 0 && eventStore.isFiltered && renderShowingXOutOfY()}
			{eventStore.sidebarGroupBy === 'priority' ? (
				renderPriorities()
			) : eventStore.sidebarGroupBy === 'area' ? (
				<>
					{isRecalculating && (
						<div className="flex-row justify-content-center align-items-center padding-block-10">
							<i className="fa fa-spinner fa-spin margin-inline-end-5" aria-hidden="true"></i>&nbsp;
							<span>{TranslateService.translate(eventStore, 'RECALCULATING_AREAS')}</span>
						</div>
					)}
					{renderAreas()}
				</>
			) : (
				renderCategories()
			)}
			{totalDisplayedCategories === 0 && renderNoDisplayedCategoriesPlaceholder()}
		</>
	);
}

export default observer(TriplanSidebarCategories);
