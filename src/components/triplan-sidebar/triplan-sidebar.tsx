import React, { CSSProperties, useContext } from 'react';
import TranslateService from '../../services/translate-service';
import {
	addLineBreaks,
	coordinateToString,
	calendarOrSidebarEventDetails,
	getClasses,
	isBasketball,
	isDessert,
	isFlight,
	isHotel,
	toDistanceString,
	ucfirst,
	isHotelsCategory,
} from '../../utils/utils';
import { TriplanEventPreferredTime, TriplanPriority } from '../../utils/enums';
import { getDurationString } from '../../utils/time-utils';
import { eventStoreContext } from '../../stores/events-store';
import { CalendarEvent, SidebarEvent, TriPlanCategory } from '../../utils/interfaces';
import { Observer, observer } from 'mobx-react';
import './triplan-sidebar.scss';
import CustomDatesSelector from './custom-dates-selector/custom-dates-selector';
import Button, { ButtonFlavor } from '../common/button/button';
// @ts-ignore
import * as _ from 'lodash';
import { hotelColor, priorityToColor } from '../../utils/consts';
import ListViewService from '../../services/list-view-service';
import ReactModalService, { ReactModalRenderHelper } from '../../services/react-modal-service';
import { AllEventsEvent, DateRangeFormatted } from '../../services/data-handlers/data-handler-base';
import { runInAction } from 'mobx';
import DistanceCalculator from './distance-calculator/distance-calculator';
import { modalsStoreContext } from '../../stores/modals-store';

export interface TriplanSidebarProps {
	removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
	addToEventsToCategories: (event: SidebarEvent) => void;
	customDateRange: DateRangeFormatted;
	setCustomDateRange: (newRange: DateRangeFormatted) => void;
	TriplanCalendarRef: React.MutableRefObject<HTMLDivElement>;
	addEventToSidebar: (event: SidebarEvent) => boolean;
}

export enum SidebarGroups {
	CALENDAR_STATISTICS = 'CALENDAR_STATISTICS',
	WARNINGS = 'WARNINGS',
	ACTIONS = 'ACTIONS',
	RECOMMENDATIONS = 'RECOMMENDATIONS',
	PRIORITIES_LEGEND = 'PRIORITIES_LEGEND',
	DISTANCES = 'DISTANCES',
	DISTANCES_NEARBY = 'DISTANCES_NEARBY',
	DISTANCES_FROMTO = 'DISTANCES_FROMTO',
}

export const wrapWithSidebarGroup = (
	children: JSX.Element,
	groupIcon: string | undefined = undefined,
	groupKey: string,
	groupTitle: string,
	itemsCount: number,
	textColor: string = 'inherit'
) => {
	const eventStore = useContext(eventStoreContext);
	const isOpen = eventStore.openSidebarGroups.has(groupKey);
	const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';

	const num = 100 * itemsCount + 90;

	const openStyle = {
		maxHeight: num + 'px',
		padding: '10px',
		transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
	};
	const closedStyle = {
		maxHeight: 0,
		overflowY: 'hidden',
		padding: 0,
		transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
	};

	const eventsStyle = isOpen ? openStyle : closedStyle;

	return (
		<>
			<div
				className={'sidebar-statistics'}
				style={{
					color: textColor,
					paddingInlineStart: '10px',
					cursor: 'pointer',
					backgroundColor: '#e5e9ef80',
					borderBottom: '1px solid #e5e9ef',
					height: '45px',
				}}
				onClick={() => {
					eventStore.toggleSidebarGroups(groupKey);
				}}
			>
				<i
					className={isOpen ? 'fa fa-angle-double-down' : 'fa fa-angle-double-' + arrowDirection}
					aria-hidden="true"
				/>
				<span className={'flex-gap-5 align-items-center'}>
					{groupIcon ? <i className={`fa ${groupIcon}`} aria-hidden="true" /> : null} {groupTitle}
				</span>
			</div>
			<div style={eventsStyle as unknown as CSSProperties}>{children}</div>
		</>
	);
};

const TriplanSidebar = (props: TriplanSidebarProps) => {
	const eventStore = useContext(eventStoreContext);
	const modalsStore = useContext(modalsStoreContext);
	const {
		removeEventFromSidebarById,
		addToEventsToCategories,
		customDateRange,
		setCustomDateRange,
		TriplanCalendarRef,
	} = props;

	const renderCustomDates = () => {
		return (
			<CustomDatesSelector
				TriplanCalendarRef={TriplanCalendarRef}
				customDateRange={customDateRange}
				setCustomDateRange={setCustomDateRange}
			/>
		);
	};

	const renderClearAll = () => {
		const isDisabled = eventStore.calendarEvents.length === 0;
		return (
			<Button
				disabled={isDisabled}
				icon={'fa-trash'}
				text={TranslateService.translate(eventStore, 'CLEAR_CALENDAR_EVENTS.BUTTON_TEXT')}
				onClick={() => {
					ReactModalService.openConfirmModal(eventStore, eventStore.clearCalendarEvents.bind(eventStore));
				}}
				flavor={ButtonFlavor['movable-link']}
			/>
		);
	};

	const renderImportButtons = () => {
		if (eventStore.isMobile) return;
		return (
			<>
				<Button
					icon={'fa-download'}
					text={TranslateService.translate(eventStore, 'IMPORT_EVENTS.DOWNLOAD_BUTTON_TEXT')}
					onClick={() => {
						ReactModalService.openImportEventsModal(eventStore);
					}}
					flavor={ButtonFlavor['movable-link']}
				/>
				<Button
					icon={'fa-upload'}
					text={TranslateService.translate(eventStore, 'IMPORT_EVENTS.BUTTON_TEXT')}
					onClick={() => {
						ReactModalService.openImportEventsStepTwoModal(eventStore);
					}}
					flavor={ButtonFlavor['movable-link']}
				/>
			</>
		);
	};

	const renderWarnings = () => {
		const renderNoLocationEventsStatistics = () => {
			const eventsWithNoLocationArr = eventStore.allEventsComputed.filter((x) => {
				const eventHaveNoLocation = !x.location;
				const eventIsInCalendar = eventStore.calendarEvents.find((y) => y.id === x.id);
				const eventIsANote = x.allDay || (eventIsInCalendar && eventIsInCalendar.allDay); // in this case location is irrelevant.

				return eventHaveNoLocation && !eventIsANote;
			});

			const eventsWithNoLocation = _.uniq(eventsWithNoLocationArr.map((x) => x.id));

			// console.log('events with no location', eventsWithNoLocationArr);

			const eventsWithNoLocationKey = eventStore.showOnlyEventsWithNoLocation
				? 'SHOW_ALL_EVENTS'
				: 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION';

			return !!eventsWithNoLocation.length ? (
				<div
					className={getClasses(
						['sidebar-statistics padding-inline-0'],
						eventStore.showOnlyEventsWithNoLocation && 'blue-color'
					)}
				>
					<Button
						icon={'fa-exclamation-triangle'}
						text={`${eventsWithNoLocation.length} ${TranslateService.translate(
							eventStore,
							'EVENTS_WITH_NO_LOCATION'
						)}${separator}(${TranslateService.translate(eventStore, eventsWithNoLocationKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithNoLocation();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(eventStore.showOnlyEventsWithNoLocation && 'blue-color')}
					/>
				</div>
			) : null;
		};

		const renderNoOpeningHoursEventsStatistics = () => {
			const eventsWithNoHoursArr = eventStore.allEventsComputed.filter((x) => {
				const eventHaveNoHours = !x.openingHours;
				const eventIsInCalendar = eventStore.calendarEvents.find((y) => y.id === x.id);
				const eventIsANote = x.allDay || (eventIsInCalendar && eventIsInCalendar.allDay); // in this case location is irrelevant.

				return eventHaveNoHours && !eventIsANote;
			});

			const eventsWithNoHours = _.uniq(eventsWithNoHoursArr.map((x) => x.id));

			// console.log('events with no location', eventsWithNoLocationArr);

			const eventsWithNoHoursKey = eventStore.showOnlyEventsWithNoOpeningHours
				? 'SHOW_ALL_EVENTS'
				: 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION';

			return !!eventsWithNoHours.length ? (
				<div
					className={getClasses(
						['sidebar-statistics padding-inline-0'],
						eventStore.showOnlyEventsWithNoOpeningHours && 'blue-color'
					)}
				>
					<Button
						icon={'fa-exclamation-triangle'}
						text={`${eventsWithNoHours.length} ${TranslateService.translate(
							eventStore,
							'EVENTS_WITH_NO_OPENING_HOURS'
						)}${separator}(${TranslateService.translate(eventStore, eventsWithNoHoursKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithNoOpeningHours();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(eventStore.showOnlyEventsWithNoOpeningHours && 'blue-color')}
					/>
				</div>
			) : null;
		};

		const renderEventsWithTodoCompleteStatistics = () => {
			const { taskKeywords } = ListViewService._initSummaryConfiguration();
			let todoCompleteEvents: AllEventsEvent[] | string[] = eventStore.allEventsComputed.filter((x) => {
				const { title, allDay, description = '' } = x;
				const isTodoComplete = taskKeywords.find(
					(k) =>
						title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 ||
						description?.toLowerCase().indexOf(k.toLowerCase()) !== -1
				);
				return isTodoComplete && !allDay;
			});

			todoCompleteEvents = _.uniq(todoCompleteEvents.map((x) => x.id));

			// console.log('events with no location', eventsWithNoLocationArr);

			const todoCompleteEventsKey = eventStore.showOnlyEventsWithTodoComplete
				? 'SHOW_ALL_EVENTS'
				: 'SHOW_ONLY_EVENTS_WITH_TODO_COMPLETE';

			return !!todoCompleteEvents.length ? (
				<div
					className={getClasses(
						['sidebar-statistics padding-inline-0'],
						eventStore.showOnlyEventsWithTodoComplete && 'blue-color'
					)}
				>
					<Button
						icon={'fa-exclamation-triangle'}
						text={`${todoCompleteEvents.length} ${TranslateService.translate(
							eventStore,
							'EVENTS_WITH_TODO_COMPLETE'
						)}${separator}(${TranslateService.translate(eventStore, todoCompleteEventsKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithTodoComplete();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(eventStore.showOnlyEventsWithTodoComplete && 'blue-color')}
					/>
				</div>
			) : null;
		};

		const renderEventsWithDistanceProblemsStatistics = () => {
			const eventsWithDistanceProblems = eventStore.eventsWithDistanceProblems;

			const distanceProblemsEventsKey = eventStore.showOnlyEventsWithDistanceProblems
				? 'SHOW_ALL_EVENTS'
				: 'SHOW_ONLY_EVENTS_WITH_DISTANCE_PROBLEMS';

			return !!eventsWithDistanceProblems.length ? (
				<div
					className={getClasses(
						['sidebar-statistics padding-inline-0'],
						eventStore.showOnlyEventsWithDistanceProblems && 'blue-color'
					)}
				>
					<Button
						icon={'fa-exclamation-triangle'}
						text={`${eventsWithDistanceProblems.length} ${TranslateService.translate(
							eventStore,
							'EVENTS_WITH_DISTANCE_PROBLEMS'
						)}${separator}(${TranslateService.translate(eventStore, distanceProblemsEventsKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithDistanceProblems();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(eventStore.showOnlyEventsWithDistanceProblems && 'blue-color')}
					/>
				</div>
			) : null;
		};

		const renderEventsWithOpeningHoursProblemsStatistics = () => {
			const uniqueSeparator = eventStore.isMobile ? '\n' : ' ';
			const eventsWithOpeningHoursProblems = eventStore.eventsWithOpeningHoursProblems;

			const openingHoursProblemsEventsKey = eventStore.showOnlyEventsWithOpeningHoursProblems
				? 'SHOW_ALL_EVENTS'
				: 'SHOW_ONLY_EVENTS_WITH_DISTANCE_PROBLEMS';

			return !!eventsWithOpeningHoursProblems.length ? (
				<div
					className={getClasses(
						['sidebar-statistics padding-inline-0'],
						eventStore.showOnlyEventsWithOpeningHoursProblems && 'blue-color'
					)}
				>
					<Button
						icon={'fa-exclamation-triangle'}
						text={`${eventsWithOpeningHoursProblems.length} ${TranslateService.translate(
							eventStore,
							'EVENTS_WITH_OPENING_HOURS_PROBLEMS'
						)}${uniqueSeparator}(${TranslateService.translate(eventStore, openingHoursProblemsEventsKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithOpeningHoursProblems();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(
							'red-color',
							eventStore.showOnlyEventsWithOpeningHoursProblems && 'blue-color'
						)}
					/>
				</div>
			) : null;
		};

		const separator = eventStore.isEnglish ? '\n' : ' ';
		const noLocationWarning = renderNoLocationEventsStatistics();
		const noOpeningHoursWarning = renderNoOpeningHoursEventsStatistics();
		const eventsWithTodoComplete = renderEventsWithTodoCompleteStatistics();
		const eventsWithDistanceProblems = renderEventsWithDistanceProblemsStatistics();
		const eventsWithOpeningHoursProblems = renderEventsWithOpeningHoursProblemsStatistics();
		const numOfItems = [noLocationWarning, noOpeningHoursWarning].filter((x) => x != null).length;
		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.WARNING');
		const warningsBlock =
			noLocationWarning ||
			noOpeningHoursWarning ||
			eventsWithTodoComplete ||
			eventsWithDistanceProblems ||
			eventsWithOpeningHoursProblems
				? wrapWithSidebarGroup(
						<div className="flex-column gap-4">
							{eventsWithOpeningHoursProblems}
							{eventsWithDistanceProblems}
							{noLocationWarning}
							{noOpeningHoursWarning}
							{eventsWithTodoComplete}
						</div>,
						'fa-exclamation-triangle',
						SidebarGroups.WARNINGS,
						groupTitle,
						numOfItems,
						'var(--red)'
				  )
				: null;

		return warningsBlock ? (
			<>
				<hr className={'margin-block-2'} />
				{warningsBlock}
			</>
		) : null;
	};

	const renderDistances = () => {
		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR.DISTANCES_BLOCK.TITLE');

		const renderNearBy = () => {
			// if (!eventStore.selectedCalendarEvent || !eventStore.selectedCalendarEventCloseBy?.length) {
			// 	return null;
			// }

			// todo:
			// 2 - if there is event but no results, show appropriate message / try to check air distance?
			// 9 - when moving between trips, need to clear selected nearby and its results too.

			const options = eventStore.allEventsComputed
				.filter((x) => x.location?.latitude && x.location?.longitude)
				.map((x) => ({
					label: x.title,
					value: x.id,
				}));

			const selectControl = ReactModalRenderHelper.renderSelectInput(
				eventStore,
				'selectedCalendarEvent',
				{
					options,
					placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER',
					onChange: (data: any) => {
						const eventId = data.value;
						const event = eventStore.allEventsComputed.find((x) => x.id == eventId);
						eventStore.setSelectedEventForNearBy(event);
					},
					onClear: () => {
						eventStore.setSelectedEventForNearBy(undefined);
					},
				},
				'distance-nearby-selector',
				undefined
			);

			let noResultsPlaceholder: string | React.ReactNode = '';

			if (eventStore.selectedEventForNearBy) {
				if (!eventStore.selectedEventNearByPlaces?.length) {
					const location = eventStore.selectedEventForNearBy!.location!;
					const coordinate = { lat: location.latitude!, lng: location.longitude! };
					if (eventStore.hasDistanceResultsOfCoordinate(coordinate)) {
						noResultsPlaceholder = (
							<>{TranslateService.translate(eventStore, 'NO_NEARBY_ACTIVITIES_PLACEHOLDER')}</>
						);
					} else {
						noResultsPlaceholder = (
							<>
								{TranslateService.translate(
									eventStore,
									'NO_NEARBY_ACTIVITIES_PLACEHOLDER.NOT_CALCULATED'
								)}
								<Button
									flavor={ButtonFlavor.link}
									onClick={() => ReactModalService.openCalculateDistancesModal(eventStore)}
									text={TranslateService.translate(eventStore, 'GENERAL.CLICK_HERE')}
									className="padding-inline-3-important"
								/>
								{TranslateService.translate(
									eventStore,
									'SIDEBAR.DISTANCES_BLOCK.ROUTE_NOT_CALCULATED.SUFFIX'
								)}
							</>
						);
					}
				}
			}

			const nearByPlaces = eventStore.selectedEventNearByPlaces ?? [];
			const scheduledNearByPlaces: any[] = [];
			const unscheduledNearByPlaces: any[] = [];

			nearByPlaces.forEach((info) => {
				const calendarEvent = eventStore.calendarEvents.find((x) => x.id == info.event.id);
				if (calendarEvent) {
					scheduledNearByPlaces.push(info);
				} else {
					unscheduledNearByPlaces.push(info);
				}
			});

			return (
				<>
					<div
						className="sidebar-distances-block nearby-places body-text-align padding-block-10 flex-col gap-8"
						key={`nearby-places-${eventStore.selectedEventForNearBy}`}
						id={`nearby-places-${eventStore.selectedEventForNearBy}`}
					>
						{selectControl}
						{eventStore.selectedEventForNearBy && <hr className="margin-block-2 width-100-percents" />}
						{noResultsPlaceholder !== '' && (
							<div className="no-nearby-placeholder">{noResultsPlaceholder}</div>
						)}
						{!!nearByPlaces.length && (
							<>
								<div className="nearby-places-results external-events bright-scrollbar">
									<div>
										{renderLineWithText(
											`${TranslateService.translate(eventStore, 'UNSCHEDULED_EVENTS')} (${
												unscheduledNearByPlaces.length
											})`
										)}
										{unscheduledNearByPlaces.map((x: any, idx: number) => {
											return (
												<div className="nearby-result cursor-pointer flex-col gap-3">
													{renderEventDraggable(
														x.event,
														x.event.category,
														false,
														toDistanceString(eventStore, x, true, x.travelMode, true)
													)}
												</div>
											);
										})}
									</div>
									<div>
										{renderLineWithText(
											`${TranslateService.translate(eventStore, 'SCHEDULED_EVENTS')} (${
												scheduledNearByPlaces.length
											})`
										)}
										{scheduledNearByPlaces.map((x: any, idx: number) => (
											<div className="nearby-result cursor-pointer flex-col gap-3">
												{renderEventDraggable(
													x.event,
													x.event.category,
													false,
													<div className="flex-col gap-5">
														<span>
															{toDistanceString(eventStore, x, true, x.travelMode, true)}
														</span>
														{x.alternative && (
															<span>
																{toDistanceString(
																	eventStore,
																	x.alternative,
																	true,
																	x.alternative.travelMode,
																	true
																)}
															</span>
														)}
														<span>
															{calendarOrSidebarEventDetails(eventStore, x.event)}
														</span>
													</div>,
													() => {
														const calendarEvent = eventStore.calendarEvents.find(
															(y) => y.id == x.event.id
														)!;
														if (typeof calendarEvent.start === 'string') {
															calendarEvent.start = new Date(calendarEvent.start);
														}
														if (typeof calendarEvent.end === 'string') {
															calendarEvent.end = new Date(calendarEvent.end);
														}
														ReactModalService.openEditCalendarEventModal(
															eventStore,
															props.addEventToSidebar,
															{
																event: {
																	...calendarEvent,
																	_def: calendarEvent,
																},
															}
														);
													}
												)}
											</div>
										))}
									</div>
								</div>
							</>
						)}
					</div>
					<hr className="margin-block-2" />
				</>
			);
		};

		const renderDistanceCalculator = () => {
			return (
				<div className="body-text-alignflex-col gap-8">
					<DistanceCalculator />
				</div>
			);
		};

		const shouldShowDistancesBlock =
			Array.from(eventStore.distanceResults.values()).length > 0 &&
			eventStore.allEventsLocationsWithDuplicates.length >= 2;
		return shouldShowDistancesBlock ? (
			<Observer>
				{() => (
					<>
						<hr className={'margin-block-2'} />
						{wrapWithSidebarGroup(
							<>
								<hr className="margin-block-2 width-100-percents" />
								{wrapWithSidebarGroup(
									<>{renderNearBy()}</>,
									undefined,
									SidebarGroups.DISTANCES_NEARBY,
									TranslateService.translate(eventStore, 'CLOSE_BY_ACTIVITIES.GROUP_TITLE'),
									Math.max(100, eventStore.allEventsLocations.length) // ?
								)}
								<hr className="margin-block-2 width-100-percents" />
								{wrapWithSidebarGroup(
									<>{renderDistanceCalculator()}</>,
									undefined,
									SidebarGroups.DISTANCES_FROMTO,
									TranslateService.translate(eventStore, 'DISTANCE_CALCULATOR.TITLE'),
									Math.max(100, eventStore.allEventsLocations.length) // ?
								)}
								<hr className="margin-block-2 width-100-percents" />
							</>,
							'fa-map-signs',
							SidebarGroups.DISTANCES,
							groupTitle,
							Math.max(100, eventStore.allEventsLocations.length)
						)}
					</>
				)}
			</Observer>
		) : null;
	};

	const renderActions = () => {
		// do not render actions block on mobile if there are no calendar events since "clear all" is the only action on mobile view.
		if (eventStore.isMobile && eventStore.calendarEvents.length === 0) return;

		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.ACTIONS');
		const actionsBlock = wrapWithSidebarGroup(
			<>
				{(eventStore.isCalendarView || eventStore.isCombinedView || eventStore.isMobile) && renderClearAll()}
				{renderImportButtons()}
			</>,
			undefined,
			SidebarGroups.ACTIONS,
			groupTitle,
			3
		);
		return (
			<>
				<hr className={'margin-block-2'} />
				{actionsBlock}
			</>
		);
	};

	const renderCalendarSidebarStatistics = () => {
		const groupTitleKey = eventStore.isMobile
			? 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS.SHORT'
			: 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS';
		const groupTitle = TranslateService.translate(eventStore, groupTitleKey);

		const calendarSidebarStatistics = (
			<>
				<div className={'sidebar-statistics'}>
					<i className="fa fa-calendar-o" aria-hidden="true" />
					{eventStore.calendarEvents.length + eventStore.allSidebarEvents.length}{' '}
					{TranslateService.translate(eventStore, 'TOTAL_EVENTS_ON_THE_SIDEBAR')}
				</div>
				<div className={'sidebar-statistics'}>
					<i className="fa fa-calendar-check-o" aria-hidden="true" />
					{eventStore.calendarEvents.length}{' '}
					{TranslateService.translate(eventStore, 'EVENTS_ON_THE_CALENDAR')}
				</div>
				<div className={'sidebar-statistics'}>
					<i className="fa fa-calendar-times-o" aria-hidden="true" />
					{eventStore.allSidebarEvents.length}{' '}
					{TranslateService.translate(eventStore, 'EVENTS_ON_THE_SIDEBAR')}
				</div>
			</>
		);

		const statsBlock = wrapWithSidebarGroup(
			calendarSidebarStatistics,
			undefined,
			SidebarGroups.CALENDAR_STATISTICS,
			groupTitle,
			2
		);
		return (
			<>
				<hr className={'margin-block-2'} />
				{statsBlock}
			</>
		);
	};

	const renderPrioritiesLegend = () => {
		const separator = eventStore.isEnglish ? '\n' : ' ';

		const getTotalHotelsAmount = () => {
			const allEvents = eventStore.allEventsComputed;
			let totalHotelsInCalendar = 0;
			const totalHotels = allEvents.filter((x) => {
				const categoryId = x.category ?? eventStore.categories[0]?.id;
				if (!x.category) {
					console.error(`event somehow don't have any category, ${x}`);
				}

				let categoryTitle: string = eventStore.categories[0]?.title;
				if (!Number.isNaN(categoryId)) {
					const categoryObject = eventStore.categories.find((x) => x.id.toString() == categoryId.toString());
					if (categoryObject) {
						categoryTitle = categoryObject.title;
					}
				}

				const isMatching =
					!(
						isDessert(categoryTitle, x.title!) ||
						isBasketball(categoryTitle, x.title!) ||
						isFlight(categoryTitle, x.title!)
					) && isHotel(categoryTitle, x.title!);

				const calendarEvent = eventStore.calendarEvents.find((c) => c.id == x.id);
				if (isMatching && calendarEvent) totalHotelsInCalendar++;
				return isMatching;
			}).length;

			return { totalHotels, totalHotelsInCalendar };
		};

		const renderPrioritiesStatistics = () => {
			const eventsByPriority: Record<string, SidebarEvent[] & CalendarEvent[]> = {};
			const allEvents = eventStore.allEventsComputed;

			allEvents.forEach((iter) => {
				const priority = iter.priority || TriplanPriority.unset;
				eventsByPriority[priority] = eventsByPriority[priority] || [];

				// @ts-ignore
				eventsByPriority[priority].push(iter);
			});

			const calendarEventsByPriority: Record<string, SidebarEvent[]> = {};
			eventStore.calendarEvents.forEach((iter) => {
				const priority = iter.priority || TriplanPriority.unset;
				calendarEventsByPriority[priority] = calendarEventsByPriority[priority] || [];
				calendarEventsByPriority[priority].push(iter as SidebarEvent);
			});

			const getPriorityTotalEvents = (priorityVal: string) => {
				const priority = priorityVal as unknown as TriplanPriority;
				return eventsByPriority[priority] ? eventsByPriority[priority].length : 0;
			};

			const priorities = Object.keys(TriplanPriority)
				.filter((x) => !Number.isNaN(Number(x)))
				.sort((a, b) => getPriorityTotalEvents(b) - getPriorityTotalEvents(a))
				.map((priorityVal) => {
					const priority = priorityVal as unknown as TriplanPriority;
					const priorityText = TriplanPriority[priority];

					const total = getPriorityTotalEvents(priorityVal);
					const totalInCalendar = calendarEventsByPriority[priority]
						? calendarEventsByPriority[priority].length
						: 0;
					const notInCalendar = TranslateService.translate(eventStore, 'NOT_IN_CALENDAR');
					const prefix = TranslateService.translate(eventStore, 'EVENTS_ON_PRIORITY');

					const color = priorityToColor[priority];

					const translatedPriority = TranslateService.translate(eventStore, priorityText)
						.replace('עדיפות ', '')
						.replace(' priority', '');

					return (
						<div className={'sidebar-statistics'} key={`sidebar-statistics-for-${priorityText}`}>
							<i className="fa fa-sticky-note" aria-hidden="true" style={{ color: color }} />
							<div className="white-space-pre">
								{`${total} ${prefix} `}
								<span>{translatedPriority}</span>
								{`${separator}(${total - totalInCalendar} ${notInCalendar})`}
							</div>
						</div>
					);
				});

			const notInCalendar = TranslateService.translate(eventStore, 'NOT_IN_CALENDAR');
			const { totalHotels, totalHotelsInCalendar } = getTotalHotelsAmount();
			const translatedHotels = TranslateService.translate(eventStore, 'HOTELS');
			const custom = (
				<>
					<div className={'sidebar-statistics'} key={`sidebar-statistics-for-hotels`}>
						<i className="fa fa-sticky-note" aria-hidden="true" style={{ color: `#${hotelColor}` }} />
						<div>
							{`${totalHotels} `}
							<span>{translatedHotels}</span>
							{`${separator}(${totalHotels - totalHotelsInCalendar} ${notInCalendar})`}
						</div>
					</div>
				</>
			);

			return (
				<div className="flex-column gap-4">
					{priorities}
					{custom}
				</div>
			);
		};

		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.PRIORITIES_LEGEND');
		const prioritiesBlock = wrapWithSidebarGroup(
			<>{renderPrioritiesStatistics()}</>,
			undefined,
			SidebarGroups.PRIORITIES_LEGEND,
			groupTitle,
			Object.keys(TriplanPriority).length
		);

		return (
			<>
				<hr className={'margin-block-2'} />
				{prioritiesBlock}
			</>
		);
	};

	const renderCategories = () => {
		const renderExpandCollapse = () => {
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
							// className={"padding-inline-start-10"}
							onClick={eventStore.openAllCategories.bind(eventStore)}
							icon={'fa-plus-square-o'}
							text={TranslateService.translate(eventStore, 'EXPAND_ALL')}
						/>
						<div className={'sidebar-statistics'} style={{ padding: 0 }}>
							{' '}
							|{' '}
						</div>
						<Button
							disabled={!expandMinimizedEnabled}
							flavor={ButtonFlavor.link}
							className={'padding-inline-start-10'}
							onClick={eventStore.closeAllCategories.bind(eventStore)}
							icon={'fa-minus-square-o'}
							text={TranslateService.translate(eventStore, 'COLLAPSE_ALL')}
						/>
						<div className={'sidebar-statistics'} style={{ padding: 0 }}>
							{' '}
							|{' '}
						</div>
						<Button
							className={getClasses(
								['padding-inline-start-10 pointer padding-inline-end-10'],
								(eventStore.hideEmptyCategories || eventStore.isFiltered) && 'blue-color'
							)}
							onClick={() => {
								eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);
							}}
							disabled={eventStore.isFiltered}
							disabledReason={TranslateService.translate(
								eventStore,
								'ON_FILTER_EMPTY_CATEGORIES_ARE_HIDDEN'
							)}
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
		};

		const renderNoDisplayedCategoriesPlaceholder = () => {
			return (
				<div className="sidebar-statistics">
					{TranslateService.translate(eventStore, 'NO_DISPLAYED_CATEGORIES')}
				</div>
			);
		};

		const renderNoItemsInCategoryPlaceholder = (category: TriPlanCategory) => {
			if (!category.description) return null;
			const categoryEvents = eventStore.getSidebarEvents[category.id] || [];
			if (categoryEvents.length) return null;
			return (
				<div className="flex-row justify-content-center text-align-center opacity-0-3 width-100-percents padding-inline-15">
					{TranslateService.translate(eventStore, category.description)}
				</div>
			);
		};

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

		let totalDisplayedCategories = 0;
		const categoriesBlock = eventStore.categories.map((triplanCategory, index) => {
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
				<div className={'external-events'} key={triplanCategory.id}>
					<div
						className={'sidebar-statistics'}
						style={{
							paddingInlineStart: '10px',
							cursor: 'pointer',
							backgroundColor: '#e5e9ef80',
							borderBottom: borderStyle,
							height: '45px',
							borderTop: index === 0 ? borderStyle : '0',
						}}
						onClick={() => {
							eventStore.toggleCategory(triplanCategory.id);
						}}
					>
						<i
							className={isOpen ? 'fa fa-angle-double-down' : 'fa fa-angle-double-' + arrowDirection}
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
								className="fa fa-pencil-square-o"
								aria-hidden="true"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onEditCategory(triplanCategory.id);
								}}
							/>
							<i
								className="fa fa-trash-o"
								style={{ position: 'relative', top: '-1px' }}
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
						{renderCategoryEvents(triplanCategory.id)}
						{renderNoItemsInCategoryPlaceholder(triplanCategory)}
						{renderAddSidebarEventButton(triplanCategory)}
					</div>
				</div>
			);
		});

		const renderShowingXOutOfY = () => {
			if (!eventStore.isFiltered) return;

			const filteredText = TranslateService.translate(eventStore, 'SIDEBAR.SHOWING_X_OF_Y', {
				X: eventStore.allFilteredSidebarEvents.length,
				Y: eventStore.allSidebarEvents.length,
			});
			const clickHereText = TranslateService.translate(eventStore, 'GENERAL.CLICK_HERE');

			return (
				<div className="triplan-sidebar-filtered-text">
					<span>{filteredText}</span>
					<a
						onClick={() => {
							runInAction(() => {
								eventStore.setSearchValue('');
								eventStore.setShowOnlyEventsWithNoLocation(false);
								eventStore.setShowOnlyEventsWithNoOpeningHours(false);
								eventStore.setShowOnlyEventsWithTodoComplete(false);
								window.location.reload(); // to reload the search component
							});
						}}
					>
						{clickHereText}
					</a>
				</div>
			);
		};

		return (
			<>
				{renderExpandCollapse()}
				{totalDisplayedCategories >= 0 && eventStore.isFiltered && renderShowingXOutOfY()}
				{categoriesBlock}
				{totalDisplayedCategories === 0 && renderNoDisplayedCategoriesPlaceholder()}
			</>
		);
	};

	const renderAddCategoryButton = () => (
		<div
			style={{
				backgroundColor: '#f2f5f8',
				display: 'flex',
				flex: '1 1 0',
				maxHeight: '40px',
			}}
		>
			<Button
				flavor={ButtonFlavor.secondary}
				className={'black'}
				onClick={() => {
					ReactModalService.openAddCategoryModal(eventStore);
				}}
				style={{
					width: '100%',
				}}
				text={TranslateService.translate(eventStore, 'ADD_CATEGORY.BUTTON_TEXT')}
			/>
		</div>
	);

	const renderAddEventButton = () => (
		<div
			style={{
				backgroundColor: '#f2f5f8',
				display: 'flex',
				flex: '1 1 0',
				maxHeight: '40px',
			}}
		>
			<Button
				flavor={eventStore.isMapView ? ButtonFlavor.secondary : ButtonFlavor.primary}
				onClick={() => {
					ReactModalService.openAddSidebarEventModal(eventStore, undefined);
				}}
				className={eventStore.isMapView ? 'black' : undefined}
				style={{
					width: '100%',
				}}
				text={TranslateService.translate(eventStore, 'ADD_EVENT.BUTTON_TEXT')}
				disabled={eventStore.categories.length === 0}
				disabledReason={TranslateService.translate(eventStore, 'DISABLED_REASON.THERE_ARE_NO_CATEGORIES')}
			/>
		</div>
	);

	const onEditCategory = (categoryId: number) => {
		ReactModalService.openEditCategoryModal(TriplanCalendarRef, eventStore, categoryId);
	};

	const renderAddSidebarEventButton = (category: TriPlanCategory) => {
		const isHotel = isHotelsCategory(category);
		return (
			<Button
				flavor={ButtonFlavor.secondary}
				style={{
					width: '100%',
					marginBlock: '10px',
				}}
				onClick={() => {
					ReactModalService.openAddSidebarEventModal(eventStore, category.id);
				}}
				text={TranslateService.translate(
					eventStore,
					isHotel ? 'ADD_HOTEL.BUTTON_TEXT' : 'ADD_EVENT.BUTTON_TEXT'
				)}
			/>
		);
	};

	const renderCategoryEvents = (categoryId: number) => {
		const categoryEvents = eventStore.getSidebarEvents[categoryId] || [];

		const preferredHoursHash: Record<string, SidebarEvent[]> = {};
		// console.log(Object.keys(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x))));
		Object.keys(TriplanEventPreferredTime)
			.filter((x) => !Number.isNaN(Number(x)))
			.forEach((preferredHour) => {
				preferredHoursHash[preferredHour] = categoryEvents
					.map((x) => {
						if (!x.preferredTime) {
							x.preferredTime = TriplanEventPreferredTime.unset;
						}
						x.title = addLineBreaks(x.title, ', ');
						if (x.description) {
							x.description = addLineBreaks(x.description, '&#10;');
						}
						return x;
					})
					.filter(
						(x: any) =>
							x.preferredTime != undefined && x.preferredTime.toString() === preferredHour.toString()
					)
					.sort(sortByPriority);
			});

		// console.log("category events", categoryEvents, "by hour", preferredHoursHash);

		if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0) {
			return null;
		}

		return Object.keys(preferredHoursHash)
			.filter((x) => preferredHoursHash[x].length > 0)
			.map((preferredHour: string) => {
				// @ts-ignore
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
	};

	const renderLineWithText = (text: string) => {
		return (
			<div className={'preferred-time'}>
				<div className={'preferred-time-divider'} style={{ maxWidth: '20px' }} />
				<div className={'preferred-time-title'}>{text}</div>
				<div className={'preferred-time-divider'} />
			</div>
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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
				{events.map((event) => renderEventDraggable(event, categoryId))}
			</div>
		);
	};

	function renderEventDraggable(
		event: SidebarEvent,
		categoryId: number,
		fullActions: boolean = true,
		eventTitleSuffix: React.ReactNode | string | undefined = undefined,
		_onClick?: () => void
	) {
		const onClick = () => {
			if (_onClick) {
				_onClick();
			} else {
				runInAction(() => {
					modalsStore.switchToViewMode();
				});
				ReactModalService.openEditSidebarEventModal(
					eventStore,
					event,
					removeEventFromSidebarById,
					addToEventsToCategories,
					modalsStore
				);
			}
		};

		return (
			<div
				className={`fc-event flex-col align-items-start priority-${event.priority}`}
				title={event.title}
				data-id={event.id}
				data-duration={event.duration}
				data-category={categoryId}
				data-icon={event.icon}
				data-description={event.description}
				data-priority={event.priority}
				data-preferred-time={event.preferredTime}
				data-location={Object.keys(event).includes('location') ? JSON.stringify(event.location) : undefined}
				data-opening-hours={
					// used to be simply event.openingHours
					Object.keys(event).includes('openingHours') ? JSON.stringify(event.openingHours) : undefined
				}
				data-images={event.images} // add column 3
				data-more-info={event.moreInfo}
				key={event.id}
			>
				<div className="flex-row gap-5 align-items-start width-100-percents">
					<span className={'sidebar-event-icon flex-grow-0'}>
						{event.icon || eventStore.categoriesIcons[categoryId]}
					</span>
					<span className="sidebar-event-title-container" title={'Edit'} onClick={onClick}>
						<span className={'sidebar-event-title-text'}>{event.title}</span>
						<span className={'sidebar-event-duration'}>
							({getDurationString(eventStore, event.duration)})
						</span>
					</span>
					{fullActions && (
						<div
							className="fc-duplicate-event"
							onClick={() => {
								ReactModalService.openDuplicateSidebarEventModal(eventStore, event);
							}}
						>
							<img
								title={TranslateService.translate(eventStore, 'DUPLICATE')}
								alt={TranslateService.translate(eventStore, 'DUPLICATE')}
								src="/images/duplicate.png"
							/>
						</div>
					)}
					{fullActions && (
						<a
							title={TranslateService.translate(eventStore, 'DELETE')}
							className={'fc-remove-event'}
							onClick={() => {
								ReactModalService.openDeleteSidebarEventModal(
									eventStore,
									removeEventFromSidebarById,
									event
								);
							}}
						>
							X
						</a>
					)}
				</div>
				{eventTitleSuffix != undefined ? (
					<div className="flex-row align-items-start width-100-percents" onClick={onClick}>
						{eventTitleSuffix}
					</div>
				) : undefined}
			</div>
		);
	}

	function renderRecommendations() {
		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.RECOMMENDATIONS');
		const recomendationsBlock = wrapWithSidebarGroup(
			<>
				<Button
					icon="fa-heart"
					flavor={ButtonFlavor['movable-link']}
					onClick={() => {
						ReactModalService.openPlacesTinderModal(eventStore);
					}}
					text={TranslateService.translate(eventStore, 'PLACES_TINDER_LINK')}
				/>
				<Button
					icon="fa-share"
					flavor={ButtonFlavor['movable-link']}
					onClick={() => {
						ReactModalService.openShareToTinderModal(eventStore);
					}}
					text={TranslateService.translate(eventStore, 'SHARE_EVENTS_TO_TRIPLAN_TINDER')}
				/>
			</>,
			undefined,
			SidebarGroups.RECOMMENDATIONS,
			groupTitle,
			3
		);
		return (
			<>
				<hr className={'margin-block-2'} />
				{recomendationsBlock}
			</>
		);
	}

	return (
		<div className={'external-events-container bright-scrollbar'}>
			{renderCustomDates()}
			<div>
				<div
					className={'flex-row gap-10 sticky-0'}
					style={{ backgroundColor: '#f2f5f8', zIndex: 1, minHeight: 50 }}
				>
					{renderAddEventButton()}
					{renderAddCategoryButton()}
				</div>
				<div>
					{renderWarnings()}
					{renderDistances()}
					{renderActions()}
					{renderRecommendations()}
					{renderCalendarSidebarStatistics()}
					{renderPrioritiesLegend()}
					<hr className={'margin-block-2'} />
					{/*<div className={"spacer margin-top-40"}/>*/}
					<hr style={{ marginBlock: '20px 10px' }} />
					{renderCategories()}
				</div>
			</div>
		</div>
	);
};

export default observer(TriplanSidebar);
