import React, { CSSProperties, useContext } from 'react';
import { observer } from 'mobx-react';
// @ts-ignore
import * as _ from 'lodash';
import { eventStoreContext } from '../../../stores/events-store';
import { CalendarEvent, SidebarEvent } from '../../../utils/interfaces';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import TranslateService from '../../../services/translate-service';
import ReactModalService from '../../../services/react-modal-service';
import { addLineBreaks, getClasses, ucfirst } from '../../../utils/utils';
import ListViewService from '../../../services/list-view-service';
import { TriplanEventPreferredTime, TriplanPriority } from '../../../utils/enums';
import { getDurationString } from '../../../utils/time-utils';
import { priorityToColor } from '../../../utils/consts';
import { adminStoreContext } from '../../stores/admin-store';
import { TriplanTinderApiService } from '../../services/triplan-tinder-api-service';
import { CreateInstagramItemsResult, DownloadMediaResult, FixItemsResult } from '../../helpers/interfaces';
import { runInAction } from 'mobx';
import { modalsStoreContext } from '../../../stores/modals-store';
import {TriplanSidebarDivider} from "../../../components/triplan-sidebar/triplan-sidebar-divider";

export interface TriplanAdminSidebarProps {
	removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
	addToEventsToCategories: (event: SidebarEvent) => void;
}

enum SidebarGroups {
	CALENDAR_STATISTICS = 'CALENDAR_STATISTICS',
	WARNINGS = 'WARNINGS',
	ACTIONS = 'ACTIONS',
	RECOMMENDATIONS = 'RECOMMENDATIONS',
	PRIORITIES_LEGEND = 'PRIORITIES_LEGEND',
}

const TriplanAdminSidebar = (props: TriplanAdminSidebarProps) => {
	const eventStore = useContext(eventStoreContext);
	const modalsStore = useContext(modalsStoreContext);
	const adminStore = useContext(adminStoreContext);
	const { removeEventFromSidebarById, addToEventsToCategories } = props;

	const renderActionButtons = () => {
		return (
			<>
				<Button
					icon={adminStore.isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}
					text={TranslateService.translate(eventStore, 'ADMIN_SIDEBAR.DOWNLOAD_BUTTON_TEXT')}
					onClick={() => {
						if (adminStore.isDownloading) return;
						adminStore.setIsDownloading(true);
						TriplanTinderApiService.downloadMedia()
							.then((result: DownloadMediaResult) => {
								ReactModalService.internal.alertMessage(
									eventStore,
									'SUCCESS',
									'ADMIN_SIDEBAR.DOWNLOAD_RESULTS_MODAL.CONTENT',
									'success',
									{
										X: result.totalDownloadedImages,
										Y: result.totalDownloadedVideos,
										Z: result.totalAffectedItems,
									}
								);
							})
							.catch(() => {
								ReactModalService.internal.alertMessage(
									eventStore,
									'MODALS.ERROR.TITLE',
									'OOPS_SOMETHING_WENT_WRONG',
									'error'
								);
							})
							.finally(() => {
								runInAction(() => {
									adminStore.setIsDownloading(false);
								});
							});
					}}
					flavor={ButtonFlavor['movable-link']}
				/>
				<Button
					icon={adminStore.isFixing ? 'fa-spinner fa-spin' : 'fa-gavel'}
					text={TranslateService.translate(eventStore, 'ADMIN_SIDEBAR.FIX_BUTTON_TEXT')}
					onClick={() => {
						if (adminStore.isFixing) return;
						adminStore.setIsFixing(true);
						TriplanTinderApiService.fixItems()
							.then((result: FixItemsResult) => {
								ReactModalService.internal
									.alertMessage(
										eventStore,
										'SUCCESS',
										'ADMIN_SIDEBAR.FIX_ITEMS_RESULTS_MODAL.CONTENT',
										'success',
										{
											X: result.totalAffectedItems,
											Y:
												result.updatedDestinations.length > 0
													? result.updatedDestinations
															.map((x) =>
																TranslateService.translate(
																	eventStore,
																	'ADMIN_SIDEBAR.FIX_ITEMS_RESULTS_MODAL.RESULT',
																	{
																		X: x.name,
																		Y: x.destination,
																		Z: x.newDestination,
																	}
																)
															)
															.join('<br/>')
													: TranslateService.translate(eventStore, 'NO_DETAILS'),
											Z:
												result.updatedCategories.length > 0
													? result.updatedCategories
															.map((x) =>
																TranslateService.translate(
																	eventStore,
																	'ADMIN_SIDEBAR.FIX_ITEMS_RESULTS_MODAL.RESULT2',
																	{
																		X: x.name,
																		Y: x.category,
																		Z: x.newCategory,
																	}
																)
															)
															.join('<br/>')
													: TranslateService.translate(eventStore, 'NO_DETAILS'),
										}
									)
									.then(() => {
										window.location.reload();
									});
							})
							.catch((error) => {
								ReactModalService.internal.alertMessage(
									eventStore,
									'MODALS.ERROR.TITLE',
									'OOPS_SOMETHING_WENT_WRONG',
									'error'
								);
							})
							.finally(() => {
								runInAction(() => {
									adminStore.setIsFixing(false);
								});
							});
					}}
					flavor={ButtonFlavor['movable-link']}
				/>

				<Button
					icon={adminStore.isScraping ? 'fa-spinner fa-spin' : 'fa-instagram'}
					text={TranslateService.translate(eventStore, 'ADMIN_SIDEBAR.ADD_FROM_INSTAGRAM_BUTTON_TEXT')}
					onClick={() => {
						if (adminStore.isScraping) return;
						adminStore.setIsScraping(true);
						TriplanTinderApiService.scrapeInstagramProfile(
							// '29859324' // 'https://www.instagram.com/__swiss_travel__/?hl=en'
							'22767954' // jeremy austin
						)
							.then((result: CreateInstagramItemsResult) => {
								ReactModalService.internal.alertMessage(
									eventStore,
									'SUCCESS',
									'ADMIN_SIDEBAR.SCRAPE_INSTAGRAM_RESULT_MODAL.CONTENT',
									'success',
									{
										A: result.totals.created,
										B: result.totals.updated,
										C: result.totals.downloadedImages,
										D: result.totals.downloadedVideos,
										E: result.totals.errors,
									}
								);
							})
							.catch(() => {
								ReactModalService.internal.alertMessage(
									eventStore,
									'MODALS.ERROR.TITLE',
									'OOPS_SOMETHING_WENT_WRONG',
									'error'
								);
							})
							.finally(() => {
								runInAction(() => {
									adminStore.setIsScraping(false);
								});
							});
					}}
					flavor={ButtonFlavor['movable-link']}
				/>
			</>
		);
	};

	const wrapWithSidebarGroup = (
		children: JSX.Element,
		groupIcon: string | undefined = undefined,
		groupKey: string,
		groupTitle: string,
		itemsCount: number,
		textColor: string = 'inherit'
	) => {
		const isOpen = eventStore.openSidebarGroups.has(groupKey);
		const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';

		const openStyle = {
			maxHeight: 100 * itemsCount + 90 + 'px',
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
					className="sidebar-statistics"
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
					<span className="flex-gap-5 align-items-center">
						{groupIcon ? <i className={`fa ${groupIcon}`} aria-hidden="true" /> : null} {groupTitle}
					</span>
				</div>
				<div style={eventsStyle as unknown as CSSProperties}>{children}</div>
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
						)} (${TranslateService.translate(eventStore, eventsWithNoLocationKey)})`}
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
						)} (${TranslateService.translate(eventStore, eventsWithNoHoursKey)})`}
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
			let todoCompleteEvents = eventStore.allEventsComputed.filter((x) => {
				const { title, allDay, description = '' } = x;
				const isTodoComplete = taskKeywords.find(
					(k: string) =>
						title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 ||
						description?.toLowerCase().indexOf(k.toLowerCase()) !== -1
				);
				return isTodoComplete && !allDay;
			});

			// @ts-ignore
			todoCompleteEvents = _.uniq(todoCompleteEvents.map((x) => x.id));

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
						)} (${TranslateService.translate(eventStore, todoCompleteEventsKey)})`}
						onClick={() => {
							eventStore.toggleShowOnlyEventsWithTodoComplete();
						}}
						flavor={ButtonFlavor['movable-link']}
						className={getClasses(eventStore.showOnlyEventsWithTodoComplete && 'blue-color')}
					/>
				</div>
			) : null;
		};

		const noLocationWarning = renderNoLocationEventsStatistics();
		const noOpeningHoursWarning = renderNoOpeningHoursEventsStatistics();
		const eventsWithTodoComplete = renderEventsWithTodoCompleteStatistics();
		const numOfItems = [noLocationWarning, noOpeningHoursWarning].filter((x) => x != null).length;
		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.WARNING');
		const warningsBlock =
			noLocationWarning || noOpeningHoursWarning
				? wrapWithSidebarGroup(
						<>
							{noLocationWarning}
							{noOpeningHoursWarning}
							{eventsWithTodoComplete}
						</>,
						'fa-exclamation-triangle',
						SidebarGroups.WARNINGS,
						groupTitle,
						numOfItems,
						'var(--red)'
				  )
				: null;

		return warningsBlock ? (
			<>
				<hr className="margin-block-2" />
				{warningsBlock}
			</>
		) : undefined;
	};

	const renderActions = () => {
		// do not render actions block on mobile if there are no calendar events since "clear all" is the only action on mobile view.
		if (eventStore.isMobile && eventStore.calendarEvents.length === 0) return;

		const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.ACTIONS');
		const actionsBlock = wrapWithSidebarGroup(
			<>{renderActionButtons()}</>,
			undefined,
			SidebarGroups.ACTIONS,
			groupTitle,
			3
		);
		return (
			<>
				<hr className="margin-block-2" />
				{actionsBlock}
			</>
		);
	};

	const renderCalendarSidebarStatistics = () => {
		const groupTitleKey = eventStore.isMobile
			? 'ADMIN_SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS.SHORT'
			: 'ADMIN_SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS';
		const groupTitle = TranslateService.translate(eventStore, groupTitleKey);

		const calendarSidebarStatistics = (
			<>
				<div className="sidebar-statistics">
					<i className="fa fa-calendar-check-o" aria-hidden="true" />
					{adminStore.verifiedActivities.length}{' '}
					{TranslateService.translate(eventStore, 'ADMIN_VERIFIED_ACTIVITIES')}
				</div>
				<div className="sidebar-statistics">
					<i className="fa fa-calendar-times-o" aria-hidden="true" />
					{adminStore.unverifiedActivities.length}{' '}
					{TranslateService.translate(eventStore, 'ADMIN_UNVERIFIED_ACTIVITIES')}
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
				<hr className="margin-block-2" />
				{statsBlock}
			</>
		);
	};

	const renderPrioritiesLegend = () => {
		const renderPrioritiesStatistics = () => {
			const eventsByPriority: Record<string, SidebarEvent[] & CalendarEvent[]> = {};
			// eventStore.allEvents.forEach((iter) => {
			[...Object.values(eventStore.sidebarEvents).flat(), ...eventStore.calendarEvents].forEach((iter) => {
				const priority = iter.priority ?? TriplanPriority.unset;
				eventsByPriority[priority] = eventsByPriority[priority] || [];

				// @ts-ignore
				eventsByPriority[priority].push(iter);
			});

			const calendarEventsByPriority: Record<string, SidebarEvent[]> = {};
			eventStore.calendarEvents.forEach((iter) => {
				const priority = iter.priority ?? TriplanPriority.unset;
				calendarEventsByPriority[priority] = calendarEventsByPriority[priority] || [];
				calendarEventsByPriority[priority].push(iter as SidebarEvent);
			});

			const getPriorityTotalEvents = (priorityVal: string) => {
				const priority = priorityVal as unknown as TriplanPriority;
				return eventsByPriority[priority] ? eventsByPriority[priority].length : 0;
			};

			return Object.keys(TriplanPriority)
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

					return (
						<div className="sidebar-statistics" key={`sidebar-statistics-for-${priorityText}`}>
							<i className="fa fa-sticky-note" aria-hidden="true" style={{ color: color }}></i>
							<div>
								{`${total} ${prefix} `}
								<span>{TranslateService.translate(eventStore, priorityText)}</span>
								{` (${total - totalInCalendar} ${notInCalendar})`}
							</div>
						</div>
					);
				});
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
				<hr className="margin-block-2" />
				{prioritiesBlock}
			</>
		);
	};

	const renderCategories = () => {
		const renderExpandCollapse = () => {
			const eyeIcon = eventStore.hideEmptyCategories ? 'fa-eye' : 'fa-eye-slash';
			const expandMinimizedEnabled = eventStore.hideEmptyCategories
				? Object.values(eventStore.getSidebarEvents).flat().length > 0
				: eventStore.categories.length > 0;

			return (
				<>
					{/*<div style={{ display: "flex", gap: "10px" }}>*/}
					{/*    <Button*/}
					{/*        className={getClasses(["padding-inline-start-10 pointer"], eventStore.hideEmptyCategories && 'blue-color')}*/}
					{/*        onClick={() => {*/}
					{/*            eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);*/}
					{/*        }}*/}
					{/*        flavor={ButtonFlavor.link}*/}
					{/*        icon={eyeIcon}*/}
					{/*        text={TranslateService.translate(eventStore, !eventStore.hideEmptyCategories ? 'SHOW_EMPTY_CATEGORIES' : 'HIDE_EMPTY_CATEGORIES')}*/}
					{/*    />*/}
					{/*</div>*/}
					<div className="category-actions">
						<Button
							disabled={!expandMinimizedEnabled}
							flavor={ButtonFlavor.link}
							// className="padding-inline-start-10"
							onClick={eventStore.openAllCategories.bind(eventStore)}
							icon={'fa-plus-square-o'}
							text={TranslateService.translate(eventStore, 'EXPAND_ALL')}
						/>
						<div className="sidebar-statistics" style={{ padding: 0 }}>
							{' '}
							|{' '}
						</div>
						<Button
							disabled={!expandMinimizedEnabled}
							flavor={ButtonFlavor.link}
							className="padding-inline-start-10"
							onClick={eventStore.closeAllCategories.bind(eventStore)}
							icon={'fa-minus-square-o'}
							text={TranslateService.translate(eventStore, 'COLLAPSE_ALL')}
						/>
						<div className="sidebar-statistics" style={{ padding: 0 }}>
							{' '}
							|{' '}
						</div>
						<Button
							className={getClasses(
								['padding-inline-start-10 pointer padding-inline-end-10'],
								eventStore.hideEmptyCategories && 'blue-color'
							)}
							onClick={() => {
								eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);
							}}
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
		const categoriesBlock = eventStore.categories.map((category, index) => {
			const itemsCount = (eventStore.getSidebarEvents[category.id] || []).filter(
				(e) => e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1
			).length;
			if (eventStore.hideEmptyCategories && itemsCount === 0) {
				return <></>;
			}
			totalDisplayedCategories++;

			const openStyle = {
				maxHeight: 100 * itemsCount + 90 + 'px',
				padding: '10px',
				transition: 'padding 0.2s ease, max-height 0.3s ease-in-out',
			};

			const isOpen = eventStore.openCategories.has(category.id);
			const eventsStyle = isOpen ? openStyle : closedStyle;

			return (
				<div className="external-events" key={category.id}>
					<div
						className="sidebar-statistics"
						style={{
							paddingInlineStart: '10px',
							cursor: 'pointer',
							backgroundColor: '#e5e9ef80',
							borderBottom: borderStyle,
							height: '45px',
							borderTop: index === 0 ? borderStyle : '0',
						}}
						onClick={() => {
							eventStore.toggleCategory(category.id);
						}}
					>
						<i
							className={isOpen ? 'fa fa-angle-double-down' : 'fa fa-angle-double-' + arrowDirection}
							aria-hidden="true"
						></i>
						<span>
							{category.icon ? `${category.icon} ` : ''}
							{category.title}
						</span>
						<div>({itemsCount})</div>
						<div style={editIconStyle}>
							<i
								className="fa fa-pencil-square-o"
								aria-hidden="true"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onEditCategory(category.id);
								}}
							></i>
							<i
								className="fa fa-trash-o"
								style={{ position: 'relative', top: '-1px' }}
								aria-hidden="true"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									ReactModalService.openDeleteCategoryModal(eventStore, category.id);
								}}
							></i>
						</div>
					</div>
					<div style={eventsStyle as unknown as CSSProperties}>
						{renderCategoryEvents(category.id)}
						{renderAddSidebarEventButton(category.id)}
					</div>
				</div>
			);
		});

		return (
			<>
				{renderExpandCollapse()}
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
				className="black"
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
				flavor={ButtonFlavor.primary}
				onClick={() => {
					ReactModalService.openAddSidebarEventModal(eventStore, undefined);
				}}
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
		// todo complete
	};

	const renderAddSidebarEventButton = (categoryId: number) => (
		<Button
			flavor={ButtonFlavor.secondary}
			style={{
				width: '100%',
				marginBlock: '10px',
			}}
			onClick={() => {
				ReactModalService.openAddSidebarEventModal(eventStore, categoryId);
			}}
			text={TranslateService.translate(eventStore, 'ADD_EVENT.BUTTON_TEXT')}
		/>
	);

	const renderCategoryEvents = (categoryId: number) => {
		const categoryEvents = eventStore.getSidebarEvents[categoryId] || [];

		const preferredHoursHash: Record<string, SidebarEvent[]> = {};
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
						(x) => x.preferredTime != undefined && x.preferredTime.toString() === preferredHour.toString()
					)
					.filter((e) => {
						return e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1;
					})
					.sort(sortByPriority);
			});

		if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0) {
			return undefined;
		}

		return Object.keys(preferredHoursHash)
			.filter((x) => preferredHoursHash[x].length > 0)
			.map((preferredHour: string) => {
				// @ts-ignore
				const preferredHourString: string = TriplanEventPreferredTime[preferredHour];
				return (
					<div key={`${categoryId}-${preferredHour}`}>
						<div className="preferred-time">
							<div className="preferred-time-divider" style={{ maxWidth: '20px' }}></div>
							<div className="preferred-time-title">
								{TranslateService.translate(eventStore, 'TIME')}:{' '}
								{ucfirst(TranslateService.translate(eventStore, preferredHourString))} (
								{preferredHoursHash[preferredHour].length})
							</div>
							<div className="preferred-time-divider"></div>
						</div>
						<div>{renderPreferredHourEvents(categoryId, preferredHoursHash[preferredHour])}</div>
					</div>
				);
			});
	};

	const sortByPriority = (a: SidebarEvent, b: SidebarEvent) => {
		if (!a.priority) a.priority = TriplanPriority.unset;
		if (!b.priority) b.priority = TriplanPriority.unset;
		return a.priority - b.priority;
	};

	const renderPreferredHourEvents = (categoryId: number, events: SidebarEvent[]) => {
		events = events.map((event) => {
			event.category = categoryId.toString();
			return event;
		});
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
				{events.map((event) => (
					<div
						className={`fc-event priority-${event.priority}`}
						title={event.title}
						data-id={event.id}
						data-duration={event.duration}
						data-category={categoryId}
						data-icon={event.icon}
						data-description={event.description}
						data-priority={event.priority}
						data-preferred-time={event.preferredTime}
						data-location={
							Object.keys(event).includes('location') ? JSON.stringify(event.location) : undefined
						}
						data-opening-hours={event.openingHours}
						data-images={event.images} // add column 3
						data-price={event.price}
						data-currency={event.currency}
						data-more-info={event.moreInfo}
						key={event.id}
					>
						<span
							className="sidebar-event-title-container"
							title={'Edit'}
							onClick={() => {
								// modalsStore.switchToViewMode();
								ReactModalService.openEditSidebarEventModal(
									eventStore,
									event,
									removeEventFromSidebarById,
									addToEventsToCategories,
									modalsStore
								);
							}}
						>
							<span className="sidebar-event-title-text">
								<span className="sidebar-event-icon">
									{event.icon || eventStore.categoriesIcons[categoryId]}
								</span>
								{event.title}
							</span>
							<span className="sidebar-event-duration">
								({getDurationString(eventStore, event.duration)})
							</span>
						</span>
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
						<a
							title={TranslateService.translate(eventStore, 'DELETE')}
							className="fc-remove-event"
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
					</div>
				))}
			</div>
		);
	};

	return (
		<div
			className={getClasses(
				'external-events-container bright-scrollbar',
				!eventStore.isMobile && eventStore.viewMode,
				!eventStore.isMobile && 'pc'
			)}
		>
			<div>
				<div
					className="flex-row gap-10 sticky-0"
					style={{ backgroundColor: '#f2f5f8', zIndex: 1, minHeight: 50 }}
				>
					{renderAddEventButton()}
					{renderAddCategoryButton()}
				</div>
				<div>
					{renderWarnings()}
					{renderActions()}
					{renderCalendarSidebarStatistics()}
					{renderPrioritiesLegend()}
					<hr className="margin-block-2" />
					<TriplanSidebarDivider />
					{renderCategories()}
				</div>
			</div>
		</div>
	);
};

export default observer(TriplanAdminSidebar);
