import React, {CSSProperties, useContext} from "react";
import TranslateService from "../../services/translate-service";
import ModalService from "../../services/modal-service";
import {addLineBreaks, getClasses, ucfirst} from "../../utils/utils";
import {setDefaultCustomDateRange} from "../../utils/defaults";
import modalService from "../../services/modal-service";
import {TriplanEventPreferredTime, TriplanPriority} from "../../utils/enums";
import {getDurationString} from "../../utils/time-utils";
import {eventStoreContext} from "../../stores/events-store";
import {CustomDateRange, SidebarEvent} from "../../utils/interfaces";
import {observer} from "mobx-react";
import './triplan-sidebar.css';
import CustomDatesSelector from "./custom-dates-selector/custom-dates-selector";

export interface TriplanSidebarProps {
    removeEventFromSidebarById: (eventId: string) => void,
    addToEventsToCategories: (event: SidebarEvent) => void,
    customDateRange: CustomDateRange,
    setCustomDateRange: (newRange: CustomDateRange) => void
    TriplanCalendarRef: React.MutableRefObject<HTMLDivElement>,
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

    const renderClearAll = () => (
        <button type="button" disabled={eventStore.calendarEvents.length === 0} onClick={() => {
            ModalService.confirmModal(eventStore,
                eventStore.clearCalendarEvents.bind(eventStore)
            );
        }} className={"clear-calendar-events sidebar-button"}>
            <i className="fa fa-trash" aria-hidden="true"></i>
            {TranslateService.translate(eventStore,'CLEAR_CALENDAR_EVENTS.BUTTON_TEXT')}
        </button>
    )

    const renderImportButtons = () => {
        return (
            <>
                <button type="button" onClick={() => {
                    modalService.openImportEventsModal(eventStore);
                }} className={"sidebar-button"}>
                    <i className="fa fa-download" aria-hidden="true"></i>
                    {TranslateService.translate(eventStore,'IMPORT_EVENTS.DOWNLOAD_BUTTON_TEXT')}
                </button>
                <button type="button" onClick={() => {
                    modalService.openImportEventsStepTwoModal(eventStore);
                }} className={"sidebar-button"}>
                    <i className="fa fa-upload" aria-hidden="true"></i>
                    {TranslateService.translate(eventStore,'IMPORT_EVENTS.BUTTON_TEXT')}
                </button>
            </>
        )
    }

    const renderStatistics = () => {
        return (
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
        )
    }

    const renderCategories = () => {

        const renderExpandCollapse = () => {
            const eyeIcon = eventStore.hideEmptyCategories ? 'fa-eye-slash' : 'fa-eye';
            return (
                <>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className={"link-button padding-inline-start-10 pointer"} onClick={() => {
                            eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);
                        }}>
                            <i className={"fa " + eyeIcon} aria-hidden="true"></i>
                            {TranslateService.translate(eventStore, !eventStore.hideEmptyCategories ? 'SHOW_EMPTY_CATEGORIES' : 'HIDE_EMPTY_CATEGORIES')}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "10px", paddingBlockEnd: "10px" }}>
                        <button className={"link-button padding-inline-start-10 pointer"} onClick={eventStore.openAllCategories.bind(eventStore)}>
                            <i className="fa fa-plus-square-o" aria-hidden="true"></i>
                            {TranslateService.translate(eventStore, 'EXPAND_ALL')}
                        </button>
                        <div className={"sidebar-statistics"}> | </div>
                        <button className={"link-button padding-inline-start-10 pointer"} onClick={eventStore.closeAllCategories.bind(eventStore)}>
                            <i className="fa fa-minus-square-o" aria-hidden="true"></i>
                            {TranslateService.translate(eventStore, 'COLLAPSE_ALL')}
                        </button>
                    </div>
                </>
            )
        }

        return (
            <>
                {renderExpandCollapse()}
                {eventStore.categories.map((category) => {

                    const isOpen = eventStore.openCategories.has(category.id);
                    const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';

                    const itemsCount = (eventStore.sidebarEvents[category.id] || []).filter((e) => e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1).length;

                    if (eventStore.hideEmptyCategories && itemsCount === 0) { return <></> }

                    const openStyle = {
                        maxHeight: (100 * itemsCount) + 50 + 'px', padding: "10px", transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
                    };
                    const closedStyle = {
                        maxHeight: 0, overflowY: "hidden", padding: 0, transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
                    };

                    const editIconStyle = {
                        display: "flex",
                        justifyContent: "flex-end",
                        flexGrow: 1,
                        paddingInline: "10px",
                        gap: "5px",
                        color: "var(--gray)"
                    }

                    const eventsStyle = isOpen ? openStyle : closedStyle;

                    return (
                        <div className={"external-events"}>
                            <div className={"sidebar-statistics"} style={{ paddingInlineStart: "10px", cursor: "pointer", backgroundColor: "#e5e9ef80", borderBottom: "1px solid #e5e9ef", height: "45px" }}  onClick={() => {
                                eventStore.toggleCategory(category.id);
                            }}>
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
                                        ModalService.openDeleteCategoryModal(eventStore, category.id);
                                    }}></i>
                                </div>
                            </div>
                            <div style={eventsStyle as unknown as CSSProperties}>
                                {renderCategoryEvents(category.id)}
                                {renderAddSidebarEventButton(category.id)}
                            </div>
                        </div>
                    )})}
            </>
        )
    }

    const renderAddCategoryButton = () => (
        <button type="button" onClick={() => {
            modalService.openAddCategoryModal(eventStore);
        }} className={"add-category-button"}>{TranslateService.translate(eventStore,'ADD_CATEGORY.BUTTON_TEXT')}
        </button>
    )

    const renderAddEventButton = () => (
        <button type="button" onClick={() => {
            modalService.openAddSidebarEventModal(eventStore, undefined);
        }} className={"add-event-button primary-button"}>{TranslateService.translate(eventStore,'ADD_EVENT.BUTTON_TEXT')}
        </button>
    )

    const onEditCategory = (categoryId: number) => {
        ModalService.openEditCategoryModal(TriplanCalendarRef, eventStore, categoryId);
    }

    const renderAddSidebarEventButton = (categoryId: number) => (
        <button type="button" className={"secondary-button"} style={{
            width: "100%",
            marginTop: "10px"
        }} onClick={() => {
            ModalService.openAddSidebarEventModal(eventStore, categoryId)}
        }>
            {TranslateService.translate(eventStore,'ADD_EVENT.BUTTON_TEXT')}
        </button>
    )

    const renderCategoryEvents = (categoryId: number) => {

        const categoryEvents = eventStore.sidebarEvents[categoryId] || [];

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
                }).filter((x) => x.preferredTime && x.preferredTime.toString() === preferredHour.toString()).filter((e) => {
                    if (e.title == undefined){
                        // debugger;
                    }
                    return e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1
                }).sort(sortByPriority);
        });

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
                    key={event.id}
                >
                        <span className="sidebar-event-title-container" title={"Edit"} onClick={() => {
                            ModalService.openEditSidebarEventModal(eventStore, event, removeEventFromSidebarById, addToEventsToCategories)
                        }}>
                            <span className={"sidebar-event-title-text"}>
                                <span className={"sidebar-event-icon"}>
                                    {event.icon || eventStore.categoriesIcons[categoryId]}
                                </span>
                                {event.title}
                            </span>
                            <span className={"sidebar-event-duration"}>
                                ({getDurationString(event.duration)})
                            </span>
                        </span>
                    <div className="fc-duplicate-event" onClick={() => {
                        ModalService.openDuplicateSidebarEventModal(eventStore, event)
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
            {renderAddEventButton()}
            {renderAddCategoryButton()}
            <div>
                {!eventStore.isListView && renderClearAll()}
                {renderImportButtons()}
                <hr/>
                {renderStatistics()}
                <hr/>
                {renderCategories()}
            </div>
        </div>
    );
}

export default observer(TriplanSidebar);