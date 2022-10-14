import React, {CSSProperties, useContext} from "react";
import TranslateService from "../../services/translate-service";
import ModalService from "../../services/modal-service";
import modalService from "../../services/modal-service";
import {addLineBreaks, getClasses, padTo2Digits, ucfirst} from "../../utils/utils";
import {TriplanEventPreferredTime, TriplanPriority} from "../../utils/enums";
import {getDurationString} from "../../utils/time-utils";
import {eventStoreContext} from "../../stores/events-store";
import {CalendarEvent, CustomDateRange, SidebarEvent} from "../../utils/interfaces";
import {observer} from "mobx-react";
import './triplan-sidebar.css';
import CustomDatesSelector from "./custom-dates-selector/custom-dates-selector";
import Button, {ButtonFlavor} from "../common/button/button";
// @ts-ignore
import * as _ from 'lodash';
import {priorityToColor} from "../../utils/consts";
import {EventInput} from "@fullcalendar/react";
import ListViewService from "../../services/list-view-service";
import ReactModalService from "../../services/react-modal-service";

export interface TriplanSidebarProps {
    removeEventFromSidebarById: (eventId: string) => void,
    addToEventsToCategories: (event: SidebarEvent) => void,
    customDateRange: CustomDateRange,
    setCustomDateRange: (newRange: CustomDateRange) => void
    TriplanCalendarRef: React.MutableRefObject<HTMLDivElement>,
}

enum SidebarGroups {
    CALENDAR_STATISTICS = "CALENDAR_STATISTICS",
    WARNINGS = "WARNINGS",
    ACTIONS = "ACTIONS",
    PRIORITIES_LEGEND = "PRIORITIES_LEGEND"
}

const TriplanSidebar = (props: TriplanSidebarProps) => {
    const eventStore = useContext(eventStoreContext);
    const {
        removeEventFromSidebarById,
        addToEventsToCategories,
        customDateRange,
        setCustomDateRange,
        TriplanCalendarRef
    } = props;

    const renderCustomDates = () => {
        return (
            <CustomDatesSelector
                 TriplanCalendarRef={TriplanCalendarRef}
                 customDateRange={customDateRange}
                setCustomDateRange={setCustomDateRange}
            />
        )
    }

    const renderClearAll = () => {
        const isDisabled = eventStore.calendarEvents.length === 0;
        return(
            <Button
                disabled={isDisabled}
                icon={"fa-trash"}
                text={TranslateService.translate(eventStore,'CLEAR_CALENDAR_EVENTS.BUTTON_TEXT')}
                onClick={() => {
                    ModalService.confirmModal(eventStore,
                        eventStore.clearCalendarEvents.bind(eventStore)
                    );
                }}
                flavor={ButtonFlavor["movable-link"]}
            />
        )
    }

    const renderImportButtons = () => {
        return (
            <>
                <Button
                    icon={"fa-download"}
                    text={TranslateService.translate(eventStore,'IMPORT_EVENTS.DOWNLOAD_BUTTON_TEXT')}
                    onClick={() => { modalService.openImportEventsModal(eventStore)}}
                    flavor={ButtonFlavor["movable-link"]}
                />
                <Button
                    icon={"fa-upload"}
                    text={TranslateService.translate(eventStore,'IMPORT_EVENTS.BUTTON_TEXT')}
                    onClick={() => { modalService.openImportEventsStepTwoModal(eventStore)}}
                    flavor={ButtonFlavor["movable-link"]}
                />
            </>
        )
    }

    const wrapWithSidebarGroup = (children: JSX.Element, groupIcon: string | undefined = undefined, groupKey: string, groupTitle: string, itemsCount: number, textColor: string = 'inherit') => {
        const isOpen = eventStore.openSidebarGroups.has(groupKey);
        const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';

        const openStyle = {
            maxHeight: (100 * itemsCount) + 90 + 'px', padding: "10px", transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
        };
        const closedStyle = {
            maxHeight: 0, overflowY: "hidden", padding: 0, transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
        };

        const eventsStyle = isOpen ? openStyle : closedStyle;

        return (
            <>
                <div className={"sidebar-statistics"} style={{ color: textColor, paddingInlineStart: "10px", cursor: "pointer", backgroundColor: "#e5e9ef80", borderBottom: "1px solid #e5e9ef", height: "45px" }}  onClick={() => {
                    eventStore.toggleSidebarGroups(groupKey);
                }}>
                    <i className={isOpen ? "fa fa-angle-double-down" : "fa fa-angle-double-" + arrowDirection} aria-hidden="true"></i>
                    <span className={"flex-gap-5 align-items-center"}>{groupIcon ? <i className={`fa ${groupIcon}`} aria-hidden="true" /> : null} {groupTitle}</span>
                </div>
                <div style={eventsStyle as unknown as CSSProperties}>
                    {children}
                </div>
            </>
        );
    }

    const renderWarnings = () => {

        const renderNoLocationEventsStatistics = () => {
            const eventsWithNoLocationArr = eventStore.allEvents
                .filter((x) => {

                    const eventHaveNoLocation = !(x.location || (x.extendedProps && x.extendedProps.location));
                    const eventIsInCalendar = eventStore.calendarEvents.find((y) => y.id === x.id);
                    const eventIsANote = (x.allDay || (eventIsInCalendar && eventIsInCalendar.allDay)); // in this case location is irrelevant.

                    return eventHaveNoLocation && !eventIsANote;
                });

            const eventsWithNoLocation = _.uniq(eventsWithNoLocationArr.map(x => x.id));

            // console.log('events with no location', eventsWithNoLocationArr);

            const eventsWithNoLocationKey = eventStore.showOnlyEventsWithNoLocation ?
                'SHOW_ALL_EVENTS' : 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION';

            return (!!eventsWithNoLocation.length) ?
                (
                    <div className={getClasses(["sidebar-statistics padding-inline-0"], eventStore.showOnlyEventsWithNoLocation && 'blue-color')}>
                        <Button
                            icon={"fa-exclamation-triangle"}
                            text={`${eventsWithNoLocation.length} ${TranslateService.translate(eventStore,'EVENTS_WITH_NO_LOCATION')} (${TranslateService.translate(eventStore, eventsWithNoLocationKey)})`}
                            onClick={() => {
                                eventStore.toggleShowOnlyEventsWithNoLocation();
                            }}
                            flavor={ButtonFlavor['movable-link']}
                            className={getClasses(eventStore.showOnlyEventsWithNoLocation && 'blue-color')}
                        />
                    </div>
                ) : null;
        }

        const renderNoOpeningHoursEventsStatistics = () => {
            const eventsWithNoHoursArr = eventStore.allEvents
                .filter((x) => {

                    const eventHaveNoHours = !(x.openingHours || (x.extendedProps && x.extendedProps.openingHours));
                    const eventIsInCalendar = eventStore.calendarEvents.find((y) => y.id === x.id);
                    const eventIsANote = (x.allDay || (eventIsInCalendar && eventIsInCalendar.allDay)); // in this case location is irrelevant.

                    return eventHaveNoHours && !eventIsANote;
                });

            const eventsWithNoHours = _.uniq(eventsWithNoHoursArr.map(x => x.id));

            // console.log('events with no location', eventsWithNoLocationArr);

            const eventsWithNoHoursKey = eventStore.showOnlyEventsWithNoOpeningHours ?
                'SHOW_ALL_EVENTS' : 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION';

            return (!!eventsWithNoHours.length) ?
                (
                    <div className={getClasses(["sidebar-statistics padding-inline-0"], eventStore.showOnlyEventsWithNoOpeningHours && 'blue-color')}>
                        <Button
                            icon={"fa-exclamation-triangle"}
                            text={`${eventsWithNoHours.length} ${TranslateService.translate(eventStore,'EVENTS_WITH_NO_OPENING_HOURS')} (${TranslateService.translate(eventStore, eventsWithNoHoursKey)})`}
                            onClick={() => {
                                eventStore.toggleShowOnlyEventsWithNoOpeningHours();
                            }}
                            flavor={ButtonFlavor['movable-link']}
                            className={getClasses(eventStore.showOnlyEventsWithNoOpeningHours && 'blue-color')}
                        />
                    </div>
                ) : null;
        }

        const renderEventsWithTodoCompleteStatistics = () => {
            const { taskKeywords } = ListViewService._initSummaryConfiguration();
            let todoCompleteEvents = eventStore.allEvents
                .filter((x) => {
                    const { title, allDay, description = '' } = x;
                    const isTodoComplete = taskKeywords.find((k) => title!.toLowerCase().indexOf(k.toLowerCase()) !== -1 || description.toLowerCase().indexOf(k.toLowerCase()) !== -1)
                    return isTodoComplete && !allDay;
                });

            todoCompleteEvents = _.uniq(todoCompleteEvents.map(x => x.id));

            // console.log('events with no location', eventsWithNoLocationArr);

            const todoCompleteEventsKey = eventStore.showOnlyEventsWithTodoComplete ?
                'SHOW_ALL_EVENTS' : 'SHOW_ONLY_EVENTS_WITH_TODO_COMPLETE';

            return (!!todoCompleteEvents.length) ?
                (
                    <div className={getClasses(["sidebar-statistics padding-inline-0"], eventStore.showOnlyEventsWithTodoComplete && 'blue-color')}>
                        <Button
                            icon={"fa-exclamation-triangle"}
                            text={`${todoCompleteEvents.length} ${TranslateService.translate(eventStore,'EVENTS_WITH_TODO_COMPLETE')} (${TranslateService.translate(eventStore, todoCompleteEventsKey)})`}
                            onClick={() => {
                                eventStore.toggleShowOnlyEventsWithTodoComplete();
                            }}
                            flavor={ButtonFlavor['movable-link']}
                            className={getClasses(eventStore.showOnlyEventsWithTodoComplete && 'blue-color')}
                        />
                    </div>
                ) : null;
        }

        const noLocationWarning = renderNoLocationEventsStatistics();
        const noOpeningHoursWarning = renderNoOpeningHoursEventsStatistics();
        const eventsWithTodoComplete = renderEventsWithTodoCompleteStatistics();
        const numOfItems = [noLocationWarning, noOpeningHoursWarning].filter((x) => x != null).length;
        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.WARNING')
        const warningsBlock = (noLocationWarning || noOpeningHoursWarning) ?
            wrapWithSidebarGroup(<>
                {noLocationWarning}
                {noOpeningHoursWarning}
                {eventsWithTodoComplete}
            </>,'fa-exclamation-triangle', SidebarGroups.WARNINGS, groupTitle, numOfItems, 'var(--red)') : null;

        return warningsBlock ? <><hr className={"margin-block-2"}/>{warningsBlock}</> : undefined;
    }

    const renderActions = () => {
        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.ACTIONS')
        const actionsBlock = wrapWithSidebarGroup(
            <>
                {eventStore.isCalendarView && renderClearAll()}
                {renderImportButtons()}
            </>,
            undefined, SidebarGroups.ACTIONS, groupTitle,3
        );
        return <><hr className={"margin-block-2"}/>{actionsBlock}</>;
    }

    const renderCalendarSidebarStatistics = () => {
        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.SIDEBAR_STATISTICS')

        const calendarSidebarStatistics = (
            <>
                <div className={"sidebar-statistics"}>
                    <i className="fa fa-calendar-check-o" aria-hidden="true"></i>
                    {eventStore.calendarEvents.length} {TranslateService.translate(eventStore,'EVENTS_ON_THE_CALENDAR')}
                </div>
                <div className={"sidebar-statistics"}>
                    <i className="fa fa-calendar-times-o" aria-hidden="true"></i>
                    {Object.values(eventStore.sidebarEvents).flat().length} {TranslateService.translate(eventStore,'EVENTS_ON_THE_SIDEBAR')}
                </div>
            </>
        );

        const statsBlock = wrapWithSidebarGroup(calendarSidebarStatistics, undefined, SidebarGroups.CALENDAR_STATISTICS, groupTitle, 2);
        return <><hr className={"margin-block-2"}/>{statsBlock}</>;
    }

    const renderPrioritiesLegend = () => {

        const renderPrioritiesStatistics = () => {
            const eventsByPriority: Record<string, SidebarEvent[] & CalendarEvent[]> = {};
            // eventStore.allEvents.forEach((iter) => {
            [...Object.values(eventStore.sidebarEvents).flat(), ...eventStore.calendarEvents].forEach((iter) => {
                const priority = iter.priority || TriplanPriority.unset;
                eventsByPriority[priority] = eventsByPriority[priority] || [];

                // @ts-ignore
                eventsByPriority[priority].push(iter);
            });

            const calendarEventsByPriority: Record<string, SidebarEvent[]> = {};
            eventStore.calendarEvents.forEach((iter) => {
                const priority = iter.extendedProps && iter.extendedProps.priority ? iter.extendedProps.priority : (iter.priority || TriplanPriority.unset);
                calendarEventsByPriority[priority] = calendarEventsByPriority[priority] || [];
                calendarEventsByPriority[priority].push(iter as SidebarEvent);
            });

            const getPriorityTotalEvents = (priorityVal: string) => {
                const priority = priorityVal as unknown as TriplanPriority;
                return eventsByPriority[priority] ? eventsByPriority[priority].length : 0;
            }

            return Object.keys(TriplanPriority)
                .filter((x) => !Number.isNaN(Number(x)))
                .sort((a,b) => getPriorityTotalEvents(b) - getPriorityTotalEvents(a))
                .map((priorityVal) => {
                const priority = priorityVal as unknown as TriplanPriority;
                const priorityText = TriplanPriority[priority];

                const total = getPriorityTotalEvents(priorityVal);
                const totalInCalendar = calendarEventsByPriority[priority] ? calendarEventsByPriority[priority].length : 0;
                const notInCalendar = TranslateService.translate(eventStore, 'NOT_IN_CALENDAR');
                const prefix = TranslateService.translate(eventStore, 'EVENTS_ON_PRIORITY');

                const color = priorityToColor[priority];

                return (
                <div className={"sidebar-statistics"} key={`sidebar-statistics-for-${priorityText}`}>
                    <i className="fa fa-sticky-note" aria-hidden="true" style={{ color: color }}></i>
                    <div>
                        {`${total} ${prefix} `}
                        <span>{TranslateService.translate(eventStore,priorityText)}</span>
                        {` (${total - totalInCalendar} ${notInCalendar})`}
                    </div>
                </div>
            )})
        }

        const groupTitle = TranslateService.translate(eventStore, 'SIDEBAR_GROUPS.GROUP_TITLE.PRIORITIES_LEGEND')
        const prioritiesBlock = wrapWithSidebarGroup(<>{renderPrioritiesStatistics()}</>, undefined, SidebarGroups.PRIORITIES_LEGEND, groupTitle, Object.keys(TriplanPriority).length);

        return <><hr className={"margin-block-2"}/>{prioritiesBlock}</>;
    }

    const renderCategories = () => {

        const renderExpandCollapse = () => {
            const eyeIcon = eventStore.hideEmptyCategories ? 'fa-eye' : 'fa-eye-slash';
            const expandMinimizedEnabled =
                eventStore.hideEmptyCategories ? Object.values(eventStore.getSidebarEvents).flat().length > 0 :
                    eventStore.categories.length > 0;

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
                    <div style={{ display: "flex", gap: "5px", paddingBlockEnd: "10px" }}>
                        <Button
                            disabled={!expandMinimizedEnabled}
                            flavor={ButtonFlavor.link}
                            // className={"padding-inline-start-10"}
                            onClick={eventStore.openAllCategories.bind(eventStore)}
                            icon={"fa-plus-square-o"}
                            text={TranslateService.translate(eventStore, 'EXPAND_ALL')}
                        />
                        <div className={"sidebar-statistics"} style={{ padding: 0 }}> | </div>
                        <Button
                            disabled={!expandMinimizedEnabled}
                            flavor={ButtonFlavor.link}
                            className={"padding-inline-start-10"}
                            onClick={eventStore.closeAllCategories.bind(eventStore)}
                            icon={"fa-minus-square-o"}
                            text={TranslateService.translate(eventStore, 'COLLAPSE_ALL')}
                        />
                        <div className={"sidebar-statistics"} style={{ padding: 0 }}> | </div>
                        <Button
                            className={getClasses(["padding-inline-start-10 pointer padding-inline-end-10"], eventStore.hideEmptyCategories && 'blue-color')}
                            onClick={() => {
                                eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);
                            }}
                            flavor={ButtonFlavor.link}
                            icon={eyeIcon}
                            text={TranslateService.translate(eventStore, !eventStore.hideEmptyCategories ? 'SHOW_EMPTY_CATEGORIES' : 'HIDE_EMPTY_CATEGORIES')}
                        />
                    </div>
                </>
            )
        }

        const renderNoDisplayedCategoriesPlaceholder = () => {
            return <div className={"sidebar-statistics"}>
                {TranslateService.translate(eventStore, 'NO_DISPLAYED_CATEGORIES')}
            </div>
        }

        const closedStyle = {
            maxHeight: 0, overflowY: "hidden", padding: 0, transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
        };
        const editIconStyle = {
            display: "flex",
            justifyContent: "flex-end",
            flexGrow: 1,
            paddingInline: "10px",
            gap: "10px",
            color: "var(--gray)"
        }
        const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';
        const borderStyle = "1px solid rgba(0, 0, 0, 0.05)";

        let totalDisplayedCategories = 0;
        const categoriesBlock = eventStore.categories.map((category, index) => {
                const itemsCount = (eventStore.getSidebarEvents[category.id] || []).filter((e) => e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1).length;
                if (eventStore.hideEmptyCategories && itemsCount === 0) { return <></> }
                totalDisplayedCategories++;

                const openStyle = {
                    maxHeight: (100 * itemsCount) + 90 + 'px', padding: "10px", transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
                };

                const isOpen = eventStore.openCategories.has(category.id);
                const eventsStyle = isOpen ? openStyle : closedStyle;

                return (
                    <div className={"external-events"} key={category.id}>
                        <div className={"sidebar-statistics"}
                             style={{
                                 paddingInlineStart: "10px", cursor: "pointer", backgroundColor: "#e5e9ef80", borderBottom: borderStyle, height: "45px",
                                 borderTop: index === 0 ? borderStyle : "0"
                             }}
                             onClick={() => {
                                 eventStore.toggleCategory(category.id);
                             }}
                        >
                            <i className={isOpen ? "fa fa-angle-double-down" : "fa fa-angle-double-" + arrowDirection} aria-hidden="true"></i>
                            <span>{category.icon ? `${category.icon} ` : ''}{category.title}</span>
                            <div>({itemsCount})</div>
                            <div style={editIconStyle}>
                                <i className="fa fa-pencil-square-o" aria-hidden="true" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditCategory(category.id)
                                }}></i>
                                <i className="fa fa-trash-o" style={{ position: "relative", top: "-1px"}} aria-hidden="true" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ReactModalService.openDeleteCategoryModal(eventStore, category.id);
                                }}></i>
                            </div>
                        </div>
                        <div style={eventsStyle as unknown as CSSProperties}>
                            {renderCategoryEvents(category.id)}
                            {renderAddSidebarEventButton(category.id)}
                        </div>
                    </div>
                )})

        return (
            <>
                {renderExpandCollapse()}
                {categoriesBlock}
                {totalDisplayedCategories === 0 && renderNoDisplayedCategoriesPlaceholder()}
            </>
        )
    }

    const renderAddCategoryButton = () => (
        <div
            style={{
                backgroundColor: "#f2f5f8",
                display: "flex",
                flex: "1 1 0",
                maxHeight: "40px"
            }}
        >
            <Button
                flavor={ButtonFlavor.secondary}
                className={"black"}
                onClick={() => {
                    ReactModalService.openAddCategoryModal(eventStore);
                }}
                style={{
                    width: "100%"
                }}
                text={TranslateService.translate(eventStore,'ADD_CATEGORY.BUTTON_TEXT')}
            />
        </div>
    )

    const renderAddEventButton = () => (
        <div
            style={{
                backgroundColor: "#f2f5f8",
                display: "flex",
                flex: "1 1 0",
                maxHeight: "40px"
            }}
        >
            <Button
                flavor={ButtonFlavor.primary}
                onClick={() => {
                    ReactModalService.openAddSidebarEventModal(eventStore, undefined);
                    // modalService.openAddSidebarEventModal(eventStore, undefined);
                }}
                style={{
                    width: "100%"
                }}
                text={TranslateService.translate(eventStore,'ADD_EVENT.BUTTON_TEXT')}
                disabled={eventStore.categories.length === 0}
                disabledReason={TranslateService.translate(eventStore, 'DISABLED_REASON.THERE_ARE_NO_CATEGORIES')}
            />
        </div>
    )

    const onEditCategory = (categoryId: number) => {
        ReactModalService.openEditCategoryModal(TriplanCalendarRef, eventStore, categoryId);
    }

    const renderAddSidebarEventButton = (categoryId: number) => (
        <Button
            flavor={ButtonFlavor.secondary}
            style={{
                width: "100%",
                marginBlock: "10px"
            }}
            onClick={() => {
                // ModalService.openAddSidebarEventModal(eventStore, categoryId)
                ReactModalService.openAddSidebarEventModal(eventStore, categoryId)
            }}
            text={TranslateService.translate(eventStore,'ADD_EVENT.BUTTON_TEXT')}
        />
    )

    const renderCategoryEvents = (categoryId: number) => {

        const categoryEvents = eventStore.getSidebarEvents[categoryId] || [];

        const preferredHoursHash: Record<string, SidebarEvent[]> = {};
        // console.log(Object.keys(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x))));
        Object.keys(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x))).forEach((preferredHour) => {
            preferredHoursHash[preferredHour] =
                categoryEvents.map((x) => {
                    if (!x.preferredTime){
                        x.preferredTime = TriplanEventPreferredTime.unset;
                    }
                    x.title = addLineBreaks(x.title, ', ');
                    if (x.description) {
                        x.description = addLineBreaks(x.description, '&#10;');
                    }
                    return x;
                }).filter((x) => x.preferredTime != undefined && x.preferredTime.toString() === preferredHour.toString()).filter((e) => {
                    if (e.title == undefined){
                        // debugger;
                    }
                    return e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1
                }).sort(sortByPriority);
        });

        // console.log("category events", categoryEvents, "by hour", preferredHoursHash);

        if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0){
            return undefined;
        }

        return Object.keys(preferredHoursHash).filter((x) => preferredHoursHash[x].length > 0).map((preferredHour: string) => {
            // @ts-ignore
            const preferredHourString: string = TriplanEventPreferredTime[preferredHour];
            return (
                <>
                    <div className={"preferred-time"}>
                        <div className={"preferred-time-divider"} style={{ maxWidth: "20px" }}></div>
                        <div className={"preferred-time-title"}>{TranslateService.translate(eventStore,'TIME')}: {ucfirst(TranslateService.translate(eventStore,preferredHourString))} ({preferredHoursHash[preferredHour].length})</div>
                        <div className={"preferred-time-divider"}></div>
                    </div>
                    <div>
                        {renderPreferredHourEvents(categoryId, preferredHoursHash[preferredHour])}
                    </div>
                </>
            )
        });
    }

    const sortByPriority = (a: SidebarEvent, b:SidebarEvent) => {
        if (!a.priority) a.priority = TriplanPriority.unset;
        if (!b.priority) b.priority = TriplanPriority.unset;
        return a.priority - b.priority;
    }

    const renderPreferredHourEvents = (categoryId: number, events: SidebarEvent[]) => {
        events = events.map((event) => { event.category = categoryId.toString(); return event });
        return <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {events.map(event => (
                <div
                    className={`fc-event priority-${event.priority}`}
                    title={event.title}
                    data-id={event.id}
                    data-duration={event.duration}
                    data-category={categoryId}
                    data-icon={event.icon}
                    data-description={event.description}
                    data-priority={event.priority !== undefined ? event.priority : event.extendedProps ? event.extendedProps.priority : undefined}
                    data-preferred-time={event.preferredTime !== undefined ? event.preferredTime : event.extendedProps ? event.extendedProps.preferredTime : undefined}
                    data-location={Object.keys(event).includes("location") ? JSON.stringify(event.location) : event.extendedProps && event.extendedProps.location ? JSON.stringify(event.extendedProps.location) : undefined}
                    key={event.id}
                >
                        <span className="sidebar-event-title-container" title={"Edit"} onClick={() => {
                            ReactModalService.openEditSidebarEventModal(eventStore, event, removeEventFromSidebarById, addToEventsToCategories)
                        }}>
                            <span className={"sidebar-event-title-text"}>
                                <span className={"sidebar-event-icon"}>
                                    {event.icon || eventStore.categoriesIcons[categoryId]}
                                </span>
                                {event.title}
                            </span>
                            <span className={"sidebar-event-duration"}>
                                ({getDurationString(eventStore, event.duration)})
                            </span>
                        </span>
                    <div className="fc-duplicate-event" onClick={() => {
                        ReactModalService.openDuplicateSidebarEventModal(eventStore, event)
                    }}>
                        <img title={TranslateService.translate(eventStore,'DUPLICATE')} alt={TranslateService.translate(eventStore,'DUPLICATE')} src="/images/duplicate.png"/>
                    </div>
                    <a title={TranslateService.translate(eventStore,'DELETE')} className={"fc-remove-event"} onClick={() => {
                        ModalService.openDeleteSidebarEventModal(eventStore, removeEventFromSidebarById, event);
                    }}>X</a>
                </div>
            ))}
        </div>
    }

    return (
        <div className={"external-events-container bright-scrollbar"}>
            {renderCustomDates()}
            <div className={"flex-row gap-10 sticky-0"} style={{ backgroundColor: "#f2f5f8", zIndex: 1, minHeight: 50 }}>
                {renderAddEventButton()}
                {renderAddCategoryButton()}
            </div>
            <div>
                {renderWarnings()}
                {renderActions()}
                {renderCalendarSidebarStatistics()}
                {renderPrioritiesLegend()}
                <hr className={"margin-block-2"}/>
                {/*<div className={"spacer margin-top-40"}/>*/}
                <hr style={{ marginBlock: "20px 10px" }}/>
                {renderCategories()}
            </div>
        </div>
    );
}

export default observer(TriplanSidebar);