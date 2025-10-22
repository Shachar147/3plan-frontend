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
import ClusteringService, { ClusteringOptions, Cluster, LocationData } from '../../../services/clustering-service';
import { CombinationsService } from '../../../services/combinations-service';

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

	const [localEventToClusterMap, setEventToClusterMap] = React.useState<Map<string, string>>(new Map());

	// Store previous threshold values to detect changes
	const prevThresholdValues = useRef({
		driving: eventStore.sidebarSettings.get('area-driving-threshold') || 10,
		walking: eventStore.sidebarSettings.get('area-walking-threshold') || 20,
	});

	// Memoize area calculation to prevent frequent recalculations
	const [recalculateAreas, setRecalculateAreas] = React.useState(0);
	const [isRecalculating, setIsRecalculating] = React.useState(false);

	// Add these new states at the top of the component, with other states
	const [editingAreaName, setEditingAreaName] = React.useState<string | null>(null);
	const [editingValue, setEditingValue] = React.useState('');

	// Separate calculation function that doesn't cause re-renders
	const calculateClusters = React.useCallback(() => {
		const sidebarEvents = eventStore.allEventsFilteredWithSidebarSearchComputed;

		// Performance check: Skip clustering if too many events
		if (sidebarEvents.length > 200) {
			console.log(`Skipping clustering due to large dataset: ${sidebarEvents.length} events`);
			return {
				clusters: [],
				eventToClusterMap: new Map(),
				areasMap: new Map(),
				eventsWithoutLocation: [],
			};
		}

		const noLocationText = TranslateService.translate(eventStore, 'NO_LOCATION');

		// Separate events with and without location
		const eventsWithLocation = sidebarEvents.filter(
			(event) =>
				event.location &&
				typeof event.location !== 'string' &&
				event.location.latitude != null &&
				event.location.longitude != null
		);

		const eventsWithoutLocation = sidebarEvents.filter(
			(event) => !event.location || (typeof event.location === 'string' && event.location === '')
		);

		// Get clustering options from settings
		const clusteringOptions: ClusteringOptions = {
			algorithm: (eventStore.sidebarSettings.get('clustering-algorithm') as any) || 'distance-based',
			maxClusters: Number(eventStore.sidebarSettings.get('max-clusters')) || 10,
			minClusterSize: Number(eventStore.sidebarSettings.get('min-cluster-size')) || 2,
			distanceThreshold: Number(eventStore.sidebarSettings.get('distance-threshold')) || 1000, // 1km
			drivingThresholdMinutes: Number(eventStore.sidebarSettings.get('area-driving-threshold')) || 10,
			walkingThresholdMinutes: Number(eventStore.sidebarSettings.get('area-walking-threshold')) || 20,
			useAirDistanceFallback: eventStore.sidebarSettings.get('use-air-distance-fallback') === '1',
			maxAirDistance: Number(eventStore.sidebarSettings.get('max-air-distance')) || 5000, // 5km default
		};

		// Perform clustering on events with location
		let clusters: Cluster[] = [];
		if (eventsWithLocation.length > 0) {
			try {
				// Convert ObservableMap to regular Map for clustering service
				const distanceResultsMap = new Map<string, any>();
				eventStore.distanceResults.forEach((value, key) => {
					distanceResultsMap.set(key, value);
				});

				clusters = ClusteringService.clusterEvents(eventsWithLocation, clusteringOptions, distanceResultsMap);
			} catch (error) {
				console.error('Error during clustering:', error);
				// Fallback to simple grouping by location string
				clusters = fallbackLocationGrouping(eventsWithLocation);
			}
		}

		// Convert clusters to areas map format
		const areasMap = new Map<string, SidebarEvent[]>();
		const eventToClusterMap = new Map<string, string>();

		// Add events without location
		if (eventsWithoutLocation.length > 0) {
			areasMap.set(noLocationText, eventsWithoutLocation);
		}

		// Add clustered events and update cluster mapping
		clusters.forEach((cluster, index) => {
			const areaName = ClusteringService.generateClusterName(eventStore, cluster, index);
			areasMap.set(areaName, cluster.events);

			// Map each event to its cluster color
			cluster.events.forEach((event) => {
				if (cluster.color) {
					eventToClusterMap.set(event.id, cluster.color);
				}
			});
		});

		return {
			clusters,
			eventToClusterMap,
			areasMap,
			eventsWithoutLocation,
		};
	}, [eventStore.allEventsFilteredWithSidebarSearchComputed, eventStore.sidebarSettings, eventStore.distanceResults]);

	// Fallback function for simple location grouping
	const fallbackLocationGrouping = React.useCallback((events: SidebarEvent[]): Cluster[] => {
		const locationGroups = new Map<string, SidebarEvent[]>();

		events.forEach((event) => {
			if (event.location) {
				try {
					let loc = '';
					if (typeof event.location === 'string') {
						loc = event.location;
					} else if (event.location && typeof event.location === 'object') {
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

		return Array.from(locationGroups.entries()).map(([location, events], index) => ({
			id: `fallback_${index}`,
			events,
			center:
				events[0]?.location && typeof events[0].location === 'object'
					? (events[0].location as LocationData)
					: { latitude: 0, longitude: 0 },
			radius: 0,
			name: location.length > 15 ? location.substring(0, 15) + '...' : location,
		}));
	}, []);

	// Update cluster data when dependencies change
	useEffect(() => {
		const newClusterData = calculateClusters();
		setEventToClusterMap(newClusterData.eventToClusterMap);
	}, [calculateClusters]);

	// Watch for specific air distance setting changes with debouncing
	useEffect(() => {
		if (eventStore.sidebarGroupBy === 'area') {
			// Debounce the calculation to prevent excessive recalculations
			const timeoutId = setTimeout(() => {
				const newClusterData = calculateClusters();
				setEventToClusterMap(newClusterData.eventToClusterMap);
			}, 300); // 300ms debounce

			return () => clearTimeout(timeoutId);
		}
	}, [
		eventStore.sidebarSettings.get('use-air-distance-fallback'),
		eventStore.sidebarSettings.get('max-air-distance'),
		eventStore.sidebarGroupBy,
	]);

	// Update eventStore with cluster mapping (separate from calculation)
	useEffect(() => {
		eventStore.updateEventToClusterMap(localEventToClusterMap);
	}, [localEventToClusterMap, eventStore]);

	// Set up effect to detect threshold changes
	useEffect(() => {
		if (eventStore.sidebarGroupBy !== 'area') return;

		const drivingThreshold = eventStore.sidebarSettings.get('area-driving-threshold') || 10;
		const walkingThreshold = eventStore.sidebarSettings.get('area-walking-threshold') || 20;

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

	// Calculate suggested combinations when sidebar events or calendar events change
	useEffect(() => {
		// Add a timeout to prevent infinite loops
		const timeoutId = setTimeout(() => {
			try {
				const allSidebarEvents = Object.values(eventStore.getSidebarEvents).flat();
				console.log('Debug - allSidebarEvents:', allSidebarEvents.length);
				console.log('Debug - distanceResults size:', eventStore.distanceResults.size);

				const combinations = CombinationsService.generateCombinations(
					allSidebarEvents,
					eventStore.distanceResults,
					eventStore.calendarEvents,
					eventStore.categories,
					eventStore
				);

				console.log('Debug - generated combinations:', combinations.length);
				eventStore.setSuggestedCombinations(combinations);
			} catch (error) {
				console.error('Error generating combinations:', error);
				eventStore.setSuggestedCombinations([]);
			}
		}, 100); // Small delay to prevent rapid recalculations

		return () => clearTimeout(timeoutId);
	}, [
		eventStore.sidebarEvents,
		eventStore.calendarEvents,
		eventStore.distanceResults.size,
		eventStore.categories.length,
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

	// Separate rendering function that uses calculated data
	const renderAreas = React.useCallback(() => {
		const clusterData = calculateClusters();
		const { areasMap } = clusterData;
		const noLocationText = TranslateService.translate(eventStore, 'NO_LOCATION');

		// todo complete: remove inline style
		const closedStyle = {
			maxHeight: 0,
			overflowY: 'hidden',
			padding: 0,
			transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
		};
		const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';
		const borderStyle = '1px solid rgba(0, 0, 0, 0.05)';

		// Sort areas by number of events (most to least)
		const sortedAreas = Array.from(areasMap.entries()).sort((a, b) => {
			// [0] is area name, [1] is array of events
			return b[1].length - a[1].length;
		});

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
					const sidebarItemsCount = eventStore.allFilteredSidebarEvents.filter((s) =>
						areaEvents.map((e) => e.id).includes(s.id)
					).length;

					if ((eventStore.hideEmptyCategories || eventStore.isFiltered) && sidebarItemsCount == 0) {
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

					// Get the cluster color for this area (use the first event's cluster color)
					const areaColor =
						areaEvents.length > 0 ? eventStore.getClusterColorForEvent(areaEvents[0].id) : undefined;

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
								<span className="flex-row align-items-center gap-3">
									<i
										className="fa fa-map-marker"
										aria-hidden="true"
										style={{ color: areaColor || '#666' }}
									/>
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
											<span>{areaNameToDisplay}</span>
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
	}, [
		calculateClusters,
		eventStore,
		editingAreaName,
		editingValue,
		eventStore.searchValue,
		eventStore.sidebarSearchValue,
	]);

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
						<div key={`${areaName}-${preferredHour}`}>
							{renderLineWithText(
								`${TranslateService.translate(eventStore, 'TIME')}: ${ucfirst(
									TranslateService.translate(eventStore, preferredHourString)
								)} (${preferredHoursHash[preferredHour].length})`
							)}
							<div className="flex-column gap-5">
								{preferredHoursHash[preferredHour].map((event) => (
									<TriplanSidebarDraggableEvent
										key={event.id}
										event={event}
										categoryId={Number(event.category)}
										removeEventFromSidebarById={removeEventFromSidebarById}
										addToEventsToCategories={addToEventsToCategories}
										addEventToSidebar={(e) => props.addEventToSidebar(e)}
									/>
								))}
							</div>
						</div>
					);
				});

			// Get scheduled events for this area (those that match any event location in this area)
			const areaLocations = areaEvents.map((event) => event.location);
			// .filter((location) => location !== undefined);

			const scheduledEvents = eventStore.filteredCalendarEvents.filter((calEvent) => {
				// if (!calEvent.location) return false;

				// Check if this scheduled event's location matches any event in this area
				return areaLocations.some((areaLoc) => {
					// if (!areaLoc) return false;

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

			return (
				<>
					{areaEvents.length === 0 && (
						<div className="flex-row justify-content-center text-align-center opacity-0-3 width-100-percents padding-inline-15">
							{TranslateService.translate(eventStore, 'NO_ITEMS')}
						</div>
					)}
					{eventsByPreferredHour}
					{scheduledEvents.length > 0 && !eventStore.sidebarSettings.get('hide-scheduled') && (
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
			{totalDisplayedCategories === 0 &&
				eventStore.sidebarGroupBy != 'area' &&
				renderNoDisplayedCategoriesPlaceholder()}
		</>
	);
}

export default observer(TriplanSidebarCategories);
