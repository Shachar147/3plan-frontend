import React, {useContext} from "react";
import {
    calendarOrSidebarEventDetails, formatNumberWithCommas,
    getClasses, isBasketball,
    isDessert, isFlight, isFlightCategory, isHotel,
    locationToString,
    toDistanceString
} from "../../../utils/utils";
import Button, {ButtonFlavor} from "../../common/button/button";
import TranslateService from "../../../services/translate-service";
import ListViewService, {MinMax} from "../../../services/list-view-service";
import {AllEventsEvent} from "../../../services/data-handlers/data-handler-base";
import {SidebarGroups, wrapWithSidebarGroup} from "../triplan-sidebar";
import ReactModalService, {ReactModalRenderHelper} from "../../../services/react-modal-service";
import DistanceCalculator from "../distance-calculator/distance-calculator";
import {observer, Observer} from "mobx-react";
import {TripDataSource, TriplanCurrency, TriplanPriority} from "../../../utils/enums";
import {CalendarEvent, SidebarEvent, TriplanTask, TriplanTaskStatus} from "../../../utils/interfaces";
import {hotelColor, priorityToColor} from "../../../utils/consts";
import {EventInput} from "@fullcalendar/react";
import { withPlacesFinder } from "../../../config/config"
import {eventStoreContext} from "../../../stores/events-store";
// @ts-ignore
import * as _ from 'lodash';
import {runInAction} from "mobx";
import {formatFromISODateString, israelDateFormatToUSA} from "../../../utils/time-utils";
import {DBService} from "../../../services/data-handlers/db-service";
import moment from "moment/moment";
import TriplanSearch from "../../triplan-header/triplan-search/triplan-search";
import TriplanSidebarShareTripButton from "../sidebar-share-trip-button/triplan-sidebar-share-trip-button";
import {renderLineWithText} from "../../../utils/ui-utils";
import TriplanSidebarDraggableEvent from "../sidebar-draggable-event/triplan-sidebar-draggable-event";
import {modalsStoreContext} from "../../../stores/modals-store";

interface TriplanSidebarCollapsableMenuProps {
    removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
    addToEventsToCategories: (event: SidebarEvent) => void;
    addEventToSidebar: (event: SidebarEvent) => boolean;
}

function TriplanSidebarCollapsableMenu(props: TriplanSidebarCollapsableMenuProps){

    const {removeEventFromSidebarById, addToEventsToCategories, addEventToSidebar} = props;
    const eventStore = useContext(eventStoreContext);
    const modalsStore = useContext(modalsStoreContext);

    const renderClearAll = () => {
        let isDisabled = eventStore.calendarEvents.length === 0;
        let disabledReason = undefined;
        if (eventStore.isTripLocked) {
            isDisabled = true;
            disabledReason = TranslateService.translate(eventStore, 'TRIP_IS_LOCKED');
        }
        return (
            <Button
                disabled={isDisabled}
                icon={'fa-trash'}
                text={TranslateService.translate(eventStore, 'CLEAR_CALENDAR_EVENTS.BUTTON_TEXT')}
                disabledReason={disabledReason}
                onClick={() => {
                    const orderedEvents = eventStore.orderedCalendarEvents;
                    if (orderedEvents.length > 0){
                        const descriptionKey = orderedEvents.length == 1 ? 'CLEAR_CALENDAR_EVENTS.LOCKED_ITEM.DESCRIPTION' : 'CLEAR_CALENDAR_EVENTS.LOCKED_ITEMS.DESCRIPTION';

                        const content = () => (
                            <div className="flex-col align-items-center justify-content-center gap-10">
                                <div>{TranslateService.translate(eventStore, descriptionKey, {
                                    count2: orderedEvents.length
                                })}</div>
                                <Button
                                    flavor={ButtonFlavor.secondary}
                                    // className={className}
                                    onClick={() => {
                                        eventStore.clearCalendarEvents();
                                        ReactModalService.internal.closeModal(eventStore);
                                    }}
                                    text={TranslateService.translate(eventStore, 'CLEAR_ALL')}
                                />
                            </div>
                        )

                        ReactModalService.openConfirmModalContent(eventStore, eventStore.clearNonOrderedCalendarEvents.bind(eventStore), undefined, content, 'CLEAR_ONLY_NON_ORDERED');
                    } else {
                        ReactModalService.openConfirmModal(eventStore, eventStore.clearCalendarEvents.bind(eventStore));
                    }
                }}
                flavor={ButtonFlavor['movable-link']}
            />
        );
    };

    const renderLockTrip = () => {
        // const isDisabled = eventStore.calendarEvents.length === 0;
        return (
            <Button
                // disabled={isDisabled}
                icon={eventStore.isTripLocked ? 'fa-unlock-alt' : 'fa-lock'}
                text={TranslateService.translate(
                    eventStore,
                    eventStore.isTripLocked ? 'UNLOCK_TRIP.BUTTON_TEXT' : 'LOCK_TRIP.BUTTON_TEXT'
                )}
                onClick={() => {
                    eventStore.toggleTripLocked();
                }}
                flavor={ButtonFlavor['movable-link']}
                disabled={!eventStore.canWrite}
                disabledReason={TranslateService.translate(eventStore, 'NOTE.SHARED_TRIP_IS_LOCKED')}
            />
        );
    };

    const renderImportButtons = () => {
        if (eventStore.isMobile) return;

        const isDisabled = eventStore.isTripLocked;
        const disabledReason = isDisabled ? TranslateService.translate(eventStore, 'TRIP_IS_LOCKED') : undefined;

        return (
            <>
                <Button
                    icon={'fa-download'}
                    text={TranslateService.translate(eventStore, 'IMPORT_EVENTS.DOWNLOAD_BUTTON_TEXT')}
                    onClick={() => {
                        ReactModalService.openImportEventsModal(eventStore);
                    }}
                    flavor={ButtonFlavor['movable-link']}
                    disabled={isDisabled}
                    disabledReason={disabledReason}
                />
                <Button
                    icon={'fa-upload'}
                    text={TranslateService.translate(eventStore, 'IMPORT_EVENTS.BUTTON_TEXT')}
                    onClick={() => {
                        ReactModalService.openImportEventsStepTwoModal(eventStore);
                    }}
                    flavor={ButtonFlavor['movable-link']}
                    disabled={isDisabled}
                    disabledReason={disabledReason}
                />
            </>
        );
    };

    const renderTasksNavbar = () => {
        const eyeIcon = eventStore.hideDoneTasks ? 'fa-eye' : 'fa-eye-slash';
        const groupIcon = 'fa-sitemap'; // eventStore.groupTasksByEvent ? 'fa-object-group' : 'fa-object-ungroup';
        const flex = 'flex-col'; // eventStore.isMobile ? 'flex-col' : 'flex-row';
        return (
            <div className={getClasses('triplan-tasks-navbar padding-block-10', flex)}>
                {renderTasksSearch()}
                <Button
                    className={getClasses(
                        ['padding-inline-start-10 pointer padding-inline-end-10'],
                        eventStore.hideDoneTasks && 'blue-color'
                    )}
                    onClick={() => {
                        runInAction(() => (eventStore.hideDoneTasks = !eventStore.hideDoneTasks));
                    }}
                    flavor={ButtonFlavor.link}
                    icon={eyeIcon}
                    text={TranslateService.translate(
                        eventStore,
                        // eventStore.hideDoneTasks ? 'SHOW_DONE_TASKS' : 'HIDE_DONE_TASKS'
                        'HIDE_DONE_TASKS'
                    )}
                />
                <Button
                    className={getClasses(
                        ['padding-inline-start-10 pointer padding-inline-end-10'],
                        eventStore.groupTasksByEvent && 'blue-color'
                    )}
                    onClick={() => {
                        runInAction(() => (eventStore.groupTasksByEvent = !eventStore.groupTasksByEvent));
                    }}
                    flavor={ButtonFlavor.link}
                    icon={groupIcon}
                    text={TranslateService.translate(
                        eventStore,
                        // eventStore.groupTasksByEvent ? 'SHOW_TASKS_UNGROUPPED' : 'GROUP_TASKS_BY_EVENT'
                        'GROUP_TASKS_BY_EVENT'
                    )}
                />
            </div>
        );
    };

    const renderTasksInner = (_tasks: TriplanTask[] | null) => {
        function sortTasks(tasks: TriplanTask[]): TriplanTask[] {
            const statusOrder = [
                TriplanTaskStatus.TODO,
                TriplanTaskStatus.IN_PROGRESS,
                TriplanTaskStatus.DONE,
                TriplanTaskStatus.CANCELLED,
            ];

            return tasks.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        }

        function sortDeadlines(deadlineStrings: string[]) {
            return deadlineStrings.sort((a, b) => {
                const aDate =
                    a == getDeadlineString(0) ? Number.MAX_SAFE_INTEGER : new Date(israelDateFormatToUSA(a)).getTime();
                const bDate =
                    b == getDeadlineString(0) ? Number.MAX_SAFE_INTEGER : new Date(israelDateFormatToUSA(b)).getTime();
                return aDate - bDate;
            });
        }

        const renderTask = (task: TriplanTask) => {
            const title = TranslateService.translate(eventStore, task.title);
            const fullTitle = TranslateService.translate(eventStore, task.content ?? task.title);

            return (
                <div
                    className={getClasses(
                        'triplan-history space-between padding-inline-8 gap-8 align-items-center opacity-1-hover-important',
                        task.status == TriplanTaskStatus.CANCELLED && 'opacity-0-6'
                    )}
                    title={fullTitle}
                    onClick={() => {
                        ReactModalService.openViewTaskModal(eventStore, task, title);
                    }}
                    key={task.id}
                >
                    <i
                        className={getClasses(
                            'fa cursor-pointer',
                            task.status == TriplanTaskStatus.DONE ? 'fa-check-square-o' : 'fa-square-o'
                        )}
                        onClick={() => {
                            (eventStore.dataService as DBService)
                                .updateTaskStatus(
                                    task.id,
                                    task.status == TriplanTaskStatus.DONE
                                        ? TriplanTaskStatus.TODO
                                        : TriplanTaskStatus.DONE
                                )
                                .then(() => {
                                    runInAction(() => {
                                        eventStore.reloadTasks();
                                    });
                                });
                        }}
                        aria-hidden="true"
                    />
                    <div className="flex-row gap-4 align-items-center flex-1-1-0 min-width-0">
                        <div
                            className={getClasses(
                                'history-title flex-row align-items-center flex-1-1-0 min-width-0 text-align-start',
                                (task.status == TriplanTaskStatus.CANCELLED || task.status == TriplanTaskStatus.DONE) &&
                                'text-decoration-strike-through'
                            )}
                        >
                            {title}
                        </div>
                    </div>
                    <i
                        className={getClasses(
                            'fa cursor-pointer',
                            task.status == TriplanTaskStatus.CANCELLED ? 'fa-undo' : 'fa-trash-o'
                        )}
                        onClick={() => {
                            (eventStore.dataService as DBService)
                                .updateTaskStatus(
                                    task.id,
                                    task.status == TriplanTaskStatus.CANCELLED
                                        ? TriplanTaskStatus.TODO
                                        : TriplanTaskStatus.CANCELLED
                                )
                                .then(() => {
                                    runInAction(() => {
                                        eventStore.reloadTasks();
                                    });
                                });
                        }}
                        aria-hidden="true"
                    />
                </div>
            );
        };

        const getDeadlineString = (deadline: number) => {
            return deadline == 0
                ? TranslateService.translate(eventStore, 'TODOLIST.NO_DEADLINE')
                : formatFromISODateString(new Date(deadline * 1000).toISOString(), true).split(',')[0];
        };

        const renderTasksByDeadline = (deadlineString: string, tasksByDeadline: Record<string, TriplanTask[]>) => {
            const currTasks = tasksByDeadline[deadlineString];
            const doneTasks = currTasks.filter((t) =>
                [TriplanTaskStatus.DONE, TriplanTaskStatus.CANCELLED].includes(t.status)
            );

            const isPassed = (deadlineString: string) => {
                if (deadlineString == getDeadlineString(0)) return false;
                const timestamp = new Date(israelDateFormatToUSA(deadlineString)).getTime() / 1000;
                const endOfToday = moment().endOf('day').unix();
                return endOfToday > timestamp;
            };

            const isSoon = (deadlineString: string) => {
                if (deadlineString == getDeadlineString(0)) return false;
                const timestamp = new Date(israelDateFormatToUSA(deadlineString)).getTime() / 1000;
                const endOfToday = moment().endOf('day').unix();
                const startOfToday = moment().startOf('day').unix();
                return timestamp > endOfToday && timestamp - startOfToday <= 86400 * 3; // in the last 3 days
            };

            let title = `${TranslateService.translate(eventStore, 'DEADLINE')}: ${deadlineString} (${
                doneTasks.length
            }/${currTasks.length})`;

            let colorClass;
            if (doneTasks.length != currTasks.length) {
                if (isPassed(deadlineString)) {
                    colorClass = 'red-color';
                } else if (isSoon(deadlineString)) {
                    colorClass = 'orange-color';
                    title = TranslateService.translate(eventStore, 'SOON') + ': ' + title;
                }
            }

            return (
                <div key={`todolist-${deadlineString}`}>
                    {renderLineWithText(title, colorClass)}
                    <div className="flex-col gap-8">{sortTasks(tasksByDeadline[deadlineString]).map(renderTask)}</div>
                </div>
            );
        };

        if (_tasks == undefined) {
            return TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE');
        }

        const tasksClone = _tasks.filter((t) => {
            if (eventStore.hideDoneTasks && [TriplanTaskStatus.CANCELLED, TriplanTaskStatus.DONE].includes(t.status)) {
                return false;
            }

            if (eventStore.tasksSearchValue.length) {
                return (
                    t.title.includes(eventStore.tasksSearchValue) || t.content?.includes(eventStore.tasksSearchValue)
                );
            }
            return true;
        });

        const hasEventTasks = !!tasksClone.filter((t) => t.eventId);

        const tasksByEventByDeadline: Record<number, Record<string, TriplanTask[]>> = {};
        const tasksByDeadline: Record<string, TriplanTask[]> = {};
        tasksClone.forEach((t) => {
            const deadlineString: string = getDeadlineString(t.mustBeDoneBefore ?? 0);
            tasksByDeadline[deadlineString] ||= [];
            tasksByDeadline[deadlineString].push(t);

            tasksByEventByDeadline[t.eventId ?? 0] ||= {};
            tasksByEventByDeadline[t.eventId ?? 0][deadlineString] ||= [];
            tasksByEventByDeadline[t.eventId ?? 0][deadlineString].push(t);
        });

        if (!hasEventTasks || !eventStore.groupTasksByEvent) {
            return sortDeadlines(Object.keys(tasksByDeadline)).map((deadlineString: string) => (
                <div key={`tasks-by-deadline-${deadlineString}`}>
                    {renderTasksByDeadline(deadlineString, tasksByDeadline)}
                </div>
            ));
        } else {
            return Object.keys(tasksByEventByDeadline).map((eventId: string) => {
                const title =
                    eventStore.allEventsComputed.find((e) => e.id == eventId)?.title ??
                    TranslateService.translate(eventStore, 'NOT_ASSIGNED_TO_ANY_EVENT');
                const all = Object.values(tasksByEventByDeadline[Number(eventId)]).flat();
                const total = all.length;
                const completed = all.filter((t) =>
                    [TriplanTaskStatus.CANCELLED, TriplanTaskStatus.DONE].includes(t.status)
                ).length;
                return (
                    <div key={`tasks-by-event-by-deadline-${eventId}`}>
                        {wrapWithSidebarGroup(
                            <>
                                {Object.keys(tasksByEventByDeadline[Number(eventId)]).map((deadlineString) =>
                                    renderTasksByDeadline(deadlineString, tasksByEventByDeadline[Number(eventId)])
                                )}
                            </>,
                            undefined,
                            `tasks-by-event-by-deadline-${eventId}`,
                            title,
                            total,
                            undefined,
                            undefined,
                            `(${completed}/${total})`
                        )}
                    </div>
                );
            });
        }
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

        const separator = ' '; // eventStore.isEnglish ? '\n' : ' ';
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
                undefined,
                true
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
                                                <div
                                                    className="nearby-result cursor-pointer flex-col gap-3"
                                                    key={`unscheduled-events-${x.event.category}-${idx}`}
                                                >
                                                    <TriplanSidebarDraggableEvent
                                                        event={x.event} categoryId={x.event.category} fullActions={false} addToEventsToCategories={addToEventsToCategories} removeEventFromSidebarById={removeEventFromSidebarById} eventTitleSuffix={toDistanceString(eventStore, x, true, x.travelMode, true)} />
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
                                            <div
                                                className="nearby-result cursor-pointer flex-col gap-3"
                                                key={`scheduled-event-${x.event.category}-${idx}`}
                                            >
                                                <TriplanSidebarDraggableEvent event={x.event} categoryId={x.event.category} fullActions={false} eventTitleSuffix={<div className="flex-col gap-5">
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
                                                </div>} addToEventsToCategories={addToEventsToCategories} removeEventFromSidebarById={removeEventFromSidebarById} _onClick={() => {
                                                    const calendarEvent = eventStore.calendarEvents.find(
                                                        (y) => y.id == x.event.id
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
                                                        addEventToSidebar,
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
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
                            undefined,
                            // 'fa-map-signs',
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
                {renderLockTrip()}
                {(eventStore.isCalendarView || eventStore.isCombinedView || eventStore.isMobile) && renderClearAll()}
                {renderImportButtons()}
                <TriplanSidebarShareTripButton />
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

    const renderTasks = () => {
        // supported only on the db version
        if (eventStore.dataService.getDataSourceName() != TripDataSource.DB) {
            return;
        }
        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.TASKS');

        const tasksBlock = wrapWithSidebarGroup(
            <div className="text-align-center white-space-pre-line flex-col gap-8">
                <div className="opacity-0-5">
                    {TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.TASKS.DESCRIPTION')}
                </div>
                {renderTasksNavbar()}
                {renderTasksInner(eventStore.tasks)}
                {renderAddTaskButton()}
            </div>,
            undefined,
            SidebarGroups.TASKS,
            groupTitle,
            10 + (eventStore.tasks?.length ?? 0)
        );
        return (
            <>
                <hr className={'margin-block-2'} />
                {tasksBlock}
            </>
        );
    };

    const renderCalendarSidebarStatistics = () => {
        // const groupTitleKey = eventStore.isMobile
        // 	? 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS.SHORT'
        // 	: 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS';
        const groupTitleKey = 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS.DETAILS';
        const groupTitle = TranslateService.translate(eventStore, groupTitleKey);

        const separator = ' '; // eventStore.isEnglish ? '\n' : ' ';

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

        const getEstimatedPrice = () => {
            const errors: string[] = [];
            // @ts-ignore
            const priceList: Record<TriplanCurrency, number> = {};

            // @ts-ignore
            const unscheduledPriceList: Record<TriplanCurrency, number> = {};

            const seen: Record<string, { price: number; currency: TriplanCurrency }> = {};
            eventStore.calendarEvents
                .filter((e) => e.price && e.currency)
                .forEach((e) => {
                    const { currency } = e;
                    const price = e.price ? Number(e.price) : 0;

                    if (price == null || currency == null) {
                        return;
                    }
                    const locKey = locationToString(e.location);

                    priceList[currency] = priceList[currency] || 0;
                    priceList[currency] += price;

                    // if already seen
                    /*if ((locKey.length && seen[locKey]) || seen[e.title]) {
                        const prevDetails = locKey.length ? seen[locKey] : seen[e.title];
                        if (prevDetails.currency != currency) {
                            errors.push(`${e.title} - currency changed [${prevDetails.currency}, ${currency}]`);
                        }
                        if (prevDetails.price != price) {
                            errors.push(`${e.title} - price changed [${prevDetails.price}, ${price}]`);

                            // take the highest price
                            if (prevDetails.currency == currency && prevDetails.price < price) {
                                priceList[currency] = priceList[currency] || 0;
                                priceList[currency] += price - prevDetails.price;
                            }
                        }
                    } else {
                        seen[locKey.length ? locKey : e.title] = {
                            price,
                            currency,
                        };

                        priceList[currency] = priceList[currency] || 0;
                        priceList[currency] += price;
                    }*/
                });

            eventStore.allSidebarEvents
                .filter((e) => e.price && e.currency)
                .forEach((e) => {
                    const { currency } = e;
                    const price = e.price ? Number(e.price) : 0;

                    if (price == null || currency == null) {
                        return;
                    }
                    const locKey = locationToString(e.location);

                    // if already seen
                    if ((locKey.length && seen[locKey]) || seen[e.title]) {
                        const prevDetails = locKey.length ? seen[locKey] : seen[e.title];
                        if (prevDetails.currency != currency) {
                            errors.push(
                                `[sidebar] ${e.title} - currency changed [${prevDetails.currency}, ${currency}]`
                            );
                        }
                        if (prevDetails.price != price) {
                            errors.push(`[sidebar] ${e.title} - price changed [${prevDetails.price}, ${price}]`);

                            // take the highest price
                            if (prevDetails.currency == currency && prevDetails.price < price) {
                                unscheduledPriceList[currency] = unscheduledPriceList[currency] || 0;
                                unscheduledPriceList[currency] += price - prevDetails.price;
                            }
                        }
                    } else {
                        seen[locKey.length ? locKey : e.title] = {
                            price,
                            currency,
                        };

                        unscheduledPriceList[currency] = unscheduledPriceList[currency] || 0;
                        unscheduledPriceList[currency] += price;
                    }
                });

            Object.keys(priceList).forEach((currency) => {
                priceList[currency as TriplanCurrency] = Number(priceList[currency as TriplanCurrency].toFixed(2));
            });

            Object.keys(unscheduledPriceList).forEach((currency) => {
                unscheduledPriceList[currency as TriplanCurrency] = Number(
                    unscheduledPriceList[currency as TriplanCurrency].toFixed(2)
                );
            });

            return {
                priceList,
                unscheduledPriceList,
                errors,
            };
        };

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

        // todo complete - add event with price and currency - not saving them.
        // todo complete - edit sidebar event setting price and currency - not working
        // todo complete - update all events - do not update ALL events with the price/currency. especially currency.

        const renderPriceList = () => {
            const { priceList, unscheduledPriceList, errors } = getEstimatedPrice();

            function getContent(priceList: Record<TriplanCurrency, number>, titleKey: string) {
                const title = TranslateService.translate(eventStore, titleKey);
                if (errors.length > 0) {
                    console.log(errors);
                }


                // build total booked prices, total calendar prices, total sidebar prices.
                const orderedKeywords = ['הוזמן', 'הזמנתי', 'ordered', 'booked', 'reserved'];
                const calendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
                    eventStore,
                    eventStore.calendarEvents
                );
                const bookedCalendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
                    eventStore,
                    eventStore.calendarEvents.filter((c) => orderedKeywords.filter((k) => (c.description ?? '').includes(k)).length > 0 || isFlightCategory(eventStore, Number(c.category!)))
                );
                const desiredCurrency = eventStore.isHebrew ? TriplanCurrency.ils : TriplanCurrency.usd;
                const calendarTotalPricePerDay: Record<String, MinMax> = ListViewService._getEstimatedCosts(eventStore, calendarEventsPerDay, desiredCurrency, false);
                const bookedTotalPricePerDay: Record<String, MinMax> = ListViewService._getEstimatedCosts(eventStore, bookedCalendarEventsPerDay, desiredCurrency, false);
                let bookedTotal = Object.values(bookedTotalPricePerDay).reduce((prev, iter) => prev + iter.max, 0).toFixed(2);
                let calendarMinTotal = Object.values(calendarTotalPricePerDay).reduce((prev, iter) => prev + iter.min, 0).toFixed(2);
                let calendarMaxTotal = Object.values(calendarTotalPricePerDay).reduce((prev, iter) => prev + iter.max, 0).toFixed(2);
                const nonCalendarTotalPricePerDay: Record<String, MinMax> = ListViewService._getEstimatedCosts(eventStore, {
                    "fakeDate": eventStore.allSidebarEvents
                }, desiredCurrency, false);
                let nonCalendarMaxTotal = Object.values(nonCalendarTotalPricePerDay).reduce((prev, iter) => prev + iter.max, 0).toFixed(2);
                let nonCalendarMinTotal = Object.values(nonCalendarTotalPricePerDay).reduce((prev, iter) => prev + iter.min, 0).toFixed(2);

                bookedTotal = formatNumberWithCommas(bookedTotal);
                nonCalendarMaxTotal = formatNumberWithCommas(nonCalendarMaxTotal);
                nonCalendarMinTotal = formatNumberWithCommas(nonCalendarMinTotal);
                calendarMaxTotal = formatNumberWithCommas(calendarMaxTotal);
                calendarMinTotal = formatNumberWithCommas(calendarMinTotal);

                const isMultiCurrencies = false;
                let isUnknown = false;
                if (titleKey == 'ESTIMATED_PRICE_OF_SCHEDULED_ACTIVITIES') {
                    isUnknown = Object.keys(calendarTotalPricePerDay).length == 0;
                    // @ts-ignore
                    priceList = {
                        // @ts-ignore
                        [desiredCurrency]: calendarMinTotal == calendarMaxTotal ? calendarMaxTotal : `${calendarMinTotal} - ${calendarMaxTotal}`
                    }
                }
                else if (titleKey == 'ESTIMATED_PRICE_OF_UNSCHEDULED_ACTIVITIES') {
                    isUnknown = Object.keys(nonCalendarTotalPricePerDay).length == 0;
                    // @ts-ignore
                    priceList = {
                        // @ts-ignore
                        [desiredCurrency]: nonCalendarMinTotal == nonCalendarMaxTotal ? nonCalendarMaxTotal : `${nonCalendarMinTotal} - ${nonCalendarMaxTotal}`
                    }
                }
                else if (titleKey == 'ESTIMATED_PRICE_OF_BOOKED_ACTIVITIES') {
                    isUnknown = Object.keys(bookedTotalPricePerDay).length == 0;
                    // @ts-ignore
                    priceList = {
                        // @ts-ignore
                        [desiredCurrency]: bookedTotal
                    }
                }
                const shouldShowPriceInline = (isUnknown || !Object.values(priceList)[0].includes("-")) && !eventStore.isMobile;
                const unknownText = TranslateService.translate(eventStore, 'UNKNOWN_PRICE');

                const pricesSections = isUnknown
                    ? [<div className="font-weight-bold">{unknownText}</div>]
                    : Object.keys(priceList).map((currency) => (
                        <div className="font-weight-bold" key={`price-list-${currency}`}>
                            {priceList[currency as TriplanCurrency]}{' '}
                            {TranslateService.translate(eventStore, `${currency}_sign`)}
                        </div>
                    ));


                // const isUnknown = Object.keys(priceList).length == 0;
                // const isMultiCurrencies = Object.keys(priceList).length > 1;
                //
                // const shouldShowPriceInline = isUnknown; // || !isMultiCurrencies; <- here we'll still want the total price in the desired currency
                // const unknownText = TranslateService.translate(eventStore, 'UNKNOWN_PRICE');
                //
                // const pricesSections = isUnknown
                // 	? [<div className="font-weight-bold">{unknownText}</div>]
                // 	: Object.keys(priceList).map((currency) => (
                // 			<div className="font-weight-bold" key={`price-list-${currency}`}>
                // 				{priceList[currency as TriplanCurrency]}{' '}
                // 				{TranslateService.translate(eventStore, `${currency}_sign`)}
                // 			</div>
                // 	  ));

                const currency = eventStore.isHebrew ? TriplanCurrency.ils : TriplanCurrency.usd;
                return (
                    <div className="flex-col gap-4">
                        <div className="flex-row gap-8 align-items-center">
                            <i className="fa fa-money" aria-hidden="true" />{' '}
                            {TranslateService.translate(eventStore, title)}
                            {shouldShowPriceInline && ' ' && pricesSections}
                        </div>
                        {!shouldShowPriceInline && (
                            <div className="flex-row gap-4 margin-inline-start-25">
                                {pricesSections.map((x, i) => (i > 0 ? <>+ {x}</> : x))}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div className={'sidebar-statistics margin-block-10'} key={`sidebar-statistics-money-title`}>
                    <div className="flex-col gap-8">
                        {getContent(priceList, 'ESTIMATED_PRICE_OF_SCHEDULED_ACTIVITIES')}
                        {getContent(unscheduledPriceList, 'ESTIMATED_PRICE_OF_BOOKED_ACTIVITIES')}
                        {getContent(unscheduledPriceList, 'ESTIMATED_PRICE_OF_UNSCHEDULED_ACTIVITIES')}
                    </div>
                </div>
            );
        };

        const statsBlock = wrapWithSidebarGroup(
            <>
                {calendarSidebarStatistics}
                <hr className={'margin-block-2'} />
                {renderPriceList()}
                <hr className={'margin-block-2'} />
                {renderPrioritiesStatistics()}
            </>,
            undefined,
            SidebarGroups.CALENDAR_STATISTICS,
            groupTitle,
            2,
            undefined,
            540
        );
        return (
            <>
                <hr className={'margin-block-2'} />
                {statsBlock}
            </>
        );
    };

    function renderRecommendations() {
        if (!withPlacesFinder){
            return null;
        }

        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.RECOMMENDATIONS');
        const recommendationsBlock = wrapWithSidebarGroup(
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
                {recommendationsBlock}
            </>
        );
    }

    function renderTasksSearch() {
        const searchPlacholderKey = eventStore.isMobile ? 'TASKS_SEARCH_PLACEHOLDER.FULL' : 'TASKS_SEARCH_PLACEHOLDER';
        return (
            <div className="tasks-search-container flex-row width-100-percents justify-content-center">
                <TriplanSearch
                    value={eventStore.tasksSearchValue}
                    onChange={(val: any) => {
                        runInAction(() => (eventStore.tasksSearchValue = val));
                    }}
                    placeholder={TranslateService.translate(eventStore, searchPlacholderKey)}
                />
            </div>
        );
    }

    const renderAddTaskButton = () => {
        return (
            <Button
                flavor={ButtonFlavor.secondary}
                style={{
                    width: '100%',
                    marginBlock: '10px',
                }}
                onClick={() => {
                    ReactModalService.openAddTaskModal(eventStore, eventStore.tripId);
                }}
                text={TranslateService.translate(eventStore, 'ADD_TASK.BUTTON_TEXT')}
                icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
                disabled={eventStore.isTripLocked}
                disabledReason={TranslateService.translate(eventStore, 'TRIP_IS_LOCKED')}
            />
        );
    };

    return (
        <div className="triplan-sidebar-collapsable-menu">
            {renderWarnings()}
            {renderDistances()}
            {renderActions()}
            {renderTasks()}
            {renderRecommendations()}
            {renderCalendarSidebarStatistics()}
        </div>
    )
}

export default observer(TriplanSidebarCollapsableMenu);