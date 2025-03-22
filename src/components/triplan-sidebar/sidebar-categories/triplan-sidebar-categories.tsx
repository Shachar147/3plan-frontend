import TriplanSearch from '../../triplan-header/triplan-search/triplan-search';
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
import React, { CSSProperties, useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { GoogleTravelMode, prioritiesOrder, TriplanEventPreferredTime, TriplanPriority } from '../../../utils/enums';
import { modalsStoreContext } from '../../../stores/modals-store';
import './triplan-sidebar-categories.scss';
import { renderLineWithText } from '../../../utils/ui-utils';
import TriplanSidebarDraggableEvent from '../sidebar-draggable-event/triplan-sidebar-draggable-event';
import { observer } from 'mobx-react';
import { rootStoreContext } from '../../../v2/stores/root-store';
import SidebarSearch from '../sidebar-search/sidebar-search';
import { priorityToColor } from '../../../utils/consts';
import { toJS } from 'mobx';

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

	function renderExpandCollapse() {
		const eyeIcon = eventStore.hideEmptyCategories || eventStore.isFiltered ? 'fa-eye' : 'fa-eye-slash';
		const expandMinimizedEnabled =
			eventStore.hideEmptyCategories || eventStore.isFiltered
				? Object.values(eventStore.getSidebarEvents).flat().length > 0
				: eventStore.categories.length > 0;

		return (
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

	function renderAreas() {
		// Calculate areas based on distance results
		const areasMap = new Map<string, SidebarEvent[]>();
		const sidebarEvents = eventStore.allFilteredSidebarEvents;

		// Default area for events without location
		areasMap.set(
			'No Location',
			sidebarEvents.filter(
				(event) => !event.location || (typeof event.location === 'string' && event.location === '')
			)
		);

		// Group events by proximity (if we have distance results)
		if (eventStore.distanceResults && eventStore.distanceResults.size > 0) {
			// Create proximity clusters
			const eventsWithLocation = sidebarEvents.filter(
				(event) => event.location && typeof event.location.latitude && event.location.longitude
			);

			// Process each event with location
			for (const event of eventsWithLocation) {
				let foundCluster = false;

				// Try to add to existing clusters
				for (const [areaName, areaEvents] of Array.from(areasMap.entries())) {
					if (areaName === 'No Location') continue;

					// Check if this event is close to any event in this cluster
					for (const areaEvent of areaEvents) {
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

						if (
							(distanceA && distanceA.duration_value && Number(distanceA.duration_value) <= 10 * 60) || // Max 10 min
							(distanceB && distanceB.duration_value && Number(distanceB.duration_value) <= 20 * 60) // Max 20 min
						) {
							// Add to this cluster
							areaEvents.push(event);
							foundCluster = true;
							break;
						}
					}

					if (foundCluster) break;
				}

				// If event doesn't fit any cluster, create a new one
				if (!foundCluster) {
					const areaName = `Area ${areasMap.size}`;
					areasMap.set(areaName, [event]);
				}
			}
		} else {
			// If distance calculation hasn't been run, group by location string
			const locationGroups = new Map<string, SidebarEvent[]>();

			sidebarEvents.forEach((event) => {
				if (event.location) {
					// Handle different location types
					let loc = '';
					if (typeof event.location === 'string') {
						loc = event.location;
					} else {
						// Location is a LocationData object
						loc = locationToString(event.location);
					}

					if (loc && !locationGroups.has(loc)) {
						locationGroups.set(loc, []);
					}
					if (loc) {
						locationGroups.get(loc)?.push(event);
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
				{Array.from(areasMap.entries()).map(([areaName, areaEvents], index) => {
					if ((eventStore.hideEmptyCategories || eventStore.isFiltered) && areaEvents.length === 0) {
						return <></>;
					}
					totalDisplayedCategories++;

					const openStyle = {
						padding: '10px',
						transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
					};

					// Cast areaName to string type for openCategories.has()
					const isOpen = eventStore.openCategories.has(areaName as any);
					const eventsStyle = isOpen ? openStyle : closedStyle;

					return (
						<div className="external-events" key={areaName}>
							<div
								className="sidebar-statistics sidebar-group"
								style={{
									borderBottom: borderStyle,
									borderTop: index === 0 ? borderStyle : '0',
								}}
								onClick={() => {
									// Cast areaName to any for toggleCategory()
									eventStore.toggleCategory(areaName as any);
								}}
							>
								<i
									className={
										isOpen ? 'fa fa-angle-double-down' : `fa fa-angle-double-${arrowDirection}`
									}
									aria-hidden="true"
								/>
								<span>
									<i className="fa fa-map-marker" aria-hidden="true" />
									&nbsp;
									{areaName}
								</span>
								<div>({areaEvents.length})</div>
							</div>
							<div style={eventsStyle as unknown as CSSProperties}>
								{renderAreaEvents(areaName, areaEvents)}
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
				const preferredHourString: string = TriplanEventPreferredTime[preferredHour];
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

		const scheduledEvents = eventStore.calendarEvents.filter((e) => e.priority.toString() === priority.toString());

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
				const preferredHourString: string = TriplanEventPreferredTime[preferredHour];
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

		const scheduledEvents = eventStore.calendarEvents.filter(
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
		const order = [
			TriplanPriority.unset,
			TriplanPriority.must,
			TriplanPriority.high,
			TriplanPriority.maybe,
			TriplanPriority.least,
		];

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
		const order = [
			TriplanPriority.unset,
			TriplanPriority.must,
			TriplanPriority.high,
			TriplanPriority.maybe,
			TriplanPriority.least,
		];

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
		const order = [
			TriplanPriority.unset,
			TriplanPriority.must,
			TriplanPriority.high,
			TriplanPriority.maybe,
			TriplanPriority.least,
		];

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
		const order = [
			TriplanPriority.unset,
			TriplanPriority.must,
			TriplanPriority.high,
			TriplanPriority.maybe,
			TriplanPriority.least,
		];

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
		const preferredHoursHash: Record<string, SidebarEvent[]> = {};

		Object.keys(TriplanEventPreferredTime)
			.filter((x) => !Number.isNaN(Number(x)))
			.forEach((preferredHour) => {
				preferredHoursHash[preferredHour] = areaEvents
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
				const preferredHourString: string = TriplanEventPreferredTime[preferredHour];
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
		const scheduledEvents = eventStore.calendarEvents.filter((calEvent) => {
			if (!calEvent.location) return false;

			// Check if this scheduled event's location matches any event in this area
			return areaLocations.some((areaLoc) => {
				if (typeof areaLoc === 'string' && typeof calEvent.location === 'string') {
					return areaLoc === calEvent.location;
				} else if (typeof areaLoc !== 'string' && typeof calEvent.location !== 'string') {
					// Compare lat/long for LocationData objects
					return (
						areaLoc.latitude === calEvent.location.latitude &&
						areaLoc.longitude === calEvent.location.longitude
					);
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
					</div>
				)}
			</>
		);
	};

	return (
		<>
			{renderExpandCollapse()}
			<SidebarSearch />
			{totalDisplayedCategories >= 0 && eventStore.isFiltered && renderShowingXOutOfY()}
			{eventStore.sidebarGroupBy === 'priority'
				? renderPriorities()
				: eventStore.sidebarGroupBy === 'area'
				? renderAreas()
				: renderCategories()}
			{totalDisplayedCategories === 0 && renderNoDisplayedCategoriesPlaceholder()}
		</>
	);
}

export default observer(TriplanSidebarCategories);
