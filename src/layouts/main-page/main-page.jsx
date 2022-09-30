import React, {useContext, useEffect, useRef, useState} from "react";
import {addLineBreaks, buildHTMLSummary, getClasses, getDurationString, ucfirst} from '../../utils/utils';
import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import './main-page.css';
import './rtl.css'

import LoadingPage from "../loading-page/loading-page";
import TriplanCalendar from "../../components/triplan-calendar/triplan-calendar";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {
    defaultEventsToCategories,
    getDefaultCalendarEvents, getDefaultCustomDateRange, setAllEvents,
    setDefaultCalendarEvents, setDefaultCalendarLocale,
    setDefaultCategories, setDefaultCustomDateRange,
    setDefaultEvents
} from "../../utils/defaults";
import {TriplanEventPreferredTime, TriplanPriority, ViewMode} from "../../utils/enums";
import ModalService from "../../services/modal-service";
import TranslateService from "../../services/translate-service";
import modalService from "../../services/modal-service";
import {renderHeaderLine} from "../../utils/uiUtils";
import {useParams} from "react-router-dom";

const MainPage = () => {
    const [isLoading, _setIsLoading] = useState(false);
    const [eventsToCategories, setEventsToCategories] = useState(defaultEventsToCategories)
    const TriplanCalendarRef = useRef(null)
    let { tripName, locale } = useParams();

    const eventStore = useContext(eventStoreContext);
    const [customDateRange, setCustomDateRange] = useState(getDefaultCustomDateRange(eventStore.tripName));

    useEffect(() => {
        eventStore.setTripName(tripName, locale);
        setCustomDateRange(getDefaultCustomDateRange(eventStore.tripName));

        TriplanCalendarRef.current.switchToCustomView();
    }, [tripName, locale]);

    useEffect(() => {
        setDefaultEvents(eventStore.sidebarEvents, eventStore.tripName);
    },[eventStore.sidebarEvents]);

    useEffect(() => {
        if (eventStore.calendarEvents.length === 0 && !eventStore.allowRemoveAllCalendarEvents) return;
        eventStore.allowRemoveAllCalendarEvents = false;
        const defaultEvents = eventStore.getJSCalendarEvents();
        setDefaultCalendarEvents(defaultEvents, eventStore.tripName);
    },[eventStore.calendarEvents]);

    useEffect(() => {
        setDefaultCategories(eventStore.categories, eventStore.tripName);
    },[eventStore.categories]);

    useEffect(() => {
        if (eventStore.allEventsTripName === eventStore.tripName) {
            setAllEvents(eventStore.allEvents, eventStore.tripName);
        }
    },[eventStore.allEvents, eventStore.tripName, eventStore.allEventsTripName]);

    useEffect(() => {
        setTimeout(() => {
            if (eventStore.isListView){
                eventStore.setHideCustomDates(true);
            } else {
                eventStore.setHideCustomDates(false);
            }
        }, 300);
    }, [eventStore.isListView]);

    useEffect(() => {
        document.querySelector("body").classList.remove("rtl")
        document.querySelector("body").classList.remove("ltr")
        document.querySelector("body").classList.add(eventStore.getCurrentDirection())
        setDefaultCalendarLocale(eventStore.calendarLocalCode, eventStore.tripName);
    }, [eventStore.calendarLocalCode])

    useEffect(() => {
        // update idtoevent, idtocategory and allevents array
        const arr = [...eventStore.allEvents];
        const idToEvent = {};
        const idToCategory = {};
        Object.keys(eventStore.sidebarEvents).map((category) => {
            eventStore.sidebarEvents[category].forEach((event) => {
                if (event.priority){
                    event.className = `priority-${event.priority}`;
                }
                idToEvent[event.id] = event;
                idToCategory[event.id] = category;
            })
        });

        const existingIds = eventStore.allEvents.map(e => e.id);
        Object.keys(idToEvent).forEach((eventId) => {
            if (!existingIds.includes(eventId)){
                arr.push({...idToEvent[eventId], category: idToCategory[eventId]});
            }
        });
        eventStore.setAllEvents(arr);

    }, [eventStore.sidebarEvents]);

    const updateAllEventsEvent = (event) => {
        const updatedEvent =
            {
                ...eventStore.allEvents.find((e) => e.id === event.id),
                ...event
            };

        eventStore.setAllEvents([
            ...eventStore.allEvents.filter((e) => e.id !== event.id),
            updatedEvent
        ]);
    }

    const onEditCategory = (categoryId) => {
        ModalService.openEditCategoryModal(TriplanCalendarRef, eventStore, categoryId);
    }

    const renderEvents = () => {

        const categoryIdToName = {};
        eventStore.categories.forEach((c) => categoryIdToName[c.id] = c.title);

        return (
            <div className={"sidebar-events"}>
                {
                    eventStore.categories.sort((a,b) => a.id - b.id).map(x => x.id).map((categoryId) => {

                        const categoryEvents = renderCategoryEvents(categoryId);

                        let visibleStyle = {};
                        if (eventStore.searchValue && !categoryEvents) {
                            visibleStyle = {
                                display: "none"
                            }
                        }

                        return (
                            <div className="external-events" style={visibleStyle}>
                                <div className={"fc-category"}>
                                    <span onClick={() => { onEditCategory(categoryId) }}><strong>{eventStore.categoriesIcons[categoryId]} {categoryIdToName[categoryId]} {eventStore.categoriesIcons[categoryId]}</strong></span>
                                    <a title={TranslateService.translate(eventStore,'DELETE')} className={"fc-remove-event"} onClick={() => {
                                        ModalService.openDeleteCategoryModal(eventStore, categoryId);
                                    }}>X</a>
                                </div>
                                {categoryEvents}
                                {renderAddSidebarEventButton(categoryId)}
                            </div>
                        );

                    })
                }
            </div>
        );
    }

    const renderAddSidebarEventButton = (categoryId) => (
        <button type="button" className={"secondary-button"} style={{
            width: "100%",
            marginTop: "10px"
        }} onClick={() => {
            ModalService.openAddSidebarEventModal(eventStore, categoryId)}
        }>
            {TranslateService.translate(eventStore,'ADD_EVENT.BUTTON_TEXT')}
        </button>
    )

    const addEventToSidebar = (event) => {
        const newEvents = {...eventStore.sidebarEvents};
        let category = eventsToCategories[event.id];
        if (!category){
            const findEvent = eventStore.allEvents.flat().find((x) => x.id = event.id);
            if (findEvent && findEvent.extendedProps){
                category = findEvent.extendedProps.categoryId;
            }
        }

        if (category && newEvents[category]) {
            delete event.start;
            delete event.end;

            if (event.extendedProps){
                event.preferredTime = event.extendedProps.preferredTime;
            }

            newEvents[category].push(event)
            eventStore.setSidebarEvents(newEvents);
        }
    }

    const removeEventFromSidebarById = (eventId) => {
        const newEvents = {...eventStore.sidebarEvents};
        const newEventsToCategories = {...eventsToCategories};
        Object.keys(newEvents).forEach((c) => {
            newEvents[c] = newEvents[c].filter((e) => e.id !== eventId);
            if (newEvents[c].length !== eventStore.sidebarEvents[c].length){
                newEventsToCategories[eventId] = c;
            }
        });
        eventStore.setCalendarEvents([
            ...eventStore.calendarEvents.filter(e => e.id.toString() !== eventId.toString()),
            eventStore.allEvents.find(e => e.id.toString() === eventId.toString())
        ]);
        setEventsToCategories(newEventsToCategories);
        eventStore.setSidebarEvents(newEvents);
    }

    const renderCustomDates = () => {
        return (
            <div className={getClasses(["custom-dates-container"], eventStore.isListView && 'hidden')}>
                <div className={"custom-dates-line"}>
                    <input type={"date"} value={customDateRange.start} onChange={(e) => {
                        const value = e.target.value;
                        const newCustomDateRange = {
                            start: value,
                            end: customDateRange.end
                        };
                        console.log(newCustomDateRange);
                        setCustomDateRange(newCustomDateRange);
                        eventStore.setCustomDateRange(newCustomDateRange);
                        setDefaultCustomDateRange(newCustomDateRange, eventStore.tripName);
                        TriplanCalendarRef.current.switchToCustomView();
                    }}/>
                    <input type={"date"} value={customDateRange.end} onChange={(e) => {
                        const value = e.target.value;
                        const newCustomDateRange ={
                            start: customDateRange.start,
                            end: value
                        };
                        console.log(newCustomDateRange);
                        setCustomDateRange(newCustomDateRange);
                        eventStore.setCustomDateRange(newCustomDateRange);
                        setDefaultCustomDateRange(newCustomDateRange, eventStore.tripName);
                        TriplanCalendarRef.current.switchToCustomView();
                        }}
                    />
                </div>
                <div className={"custom-dates-submit"}>
                    <button type="button" onClick={() => {
                    if (TriplanCalendarRef && TriplanCalendarRef.current) {
                        TriplanCalendarRef.current.switchToCustomView();
                    }
                }}>
                        {TranslateService.translate(eventStore,'CUSTOM_DATES.CHANGE_DATES')}
                    </button>
                </div>
            </div>
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

    const sortByPriority = (a,b) => {
        if (!a.priority) a.priority = TriplanPriority.unset;
        if (!b.priority) b.priority = TriplanPriority.unset;
        return a.priority - b.priority;
    }

    const renderPreferredHourEvents = (categoryId, events) => {
        events = events.map((event) => { event.category = categoryId; return event });
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


    const renderCategoryEvents = (categoryId) => {

        const categoryEvents = eventStore.sidebarEvents[categoryId] || [];

        const preferredHoursHash = {};
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
                }).filter((x) => x.preferredTime.toString() === preferredHour.toString()).filter((e) => {
                    if (e.title == undefined){
                        // debugger;
                    }
                    return e.title.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1
                }).sort(sortByPriority);
        });

        if (eventStore.searchValue && Object.values(preferredHoursHash).flat().length === 0){
            return undefined;
        }

        return Object.keys(preferredHoursHash).filter((x) => preferredHoursHash[x].length > 0).map((preferredHour) => {
            return (
                <>
                    <div className={"preferred-time"}>
                        <div className={"preferred-time-divider"} style={{ maxWidth: "20px" }}></div>
                        <div className={"preferred-time-title"}>{TranslateService.translate(eventStore,'TIME')}: {ucfirst(TranslateService.translate(eventStore, TriplanEventPreferredTime[preferredHour]))} ({preferredHoursHash[preferredHour].length})</div>
                        <div className={"preferred-time-divider"}></div>
                    </div>
                    <div>
                        {renderPreferredHourEvents(categoryId, preferredHoursHash[preferredHour])}
                    </div>
                </>
            )
        });
    }

    const renderCategories = () => {

        const renderExpandCollapse = () => {
            const eyeIcon = eventStore.hideEmptyCategories ? 'fa-eye-slash' : 'fa-eye';
            return (
                <>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className={"link-button padding-inline-start-10"} style={{ cursor: "pointer" }} onClick={() => {
                        eventStore.setHideEmptyCategories(!eventStore.hideEmptyCategories);
                    }}>
                        <i className={"fa " + eyeIcon} aria-hidden="true"></i>
                        {TranslateService.translate(eventStore, !eventStore.hideEmptyCategories ? 'SHOW_EMPTY_CATEGORIES' : 'HIDE_EMPTY_CATEGORIES')}
                    </button>
                </div>
                <div style={{ display: "flex", gap: "10px", paddingBlockEnd: "10px" }}>
                    <button className={"link-button padding-inline-start-10"} style={{ cursor: "pointer" }} onClick={eventStore.openAllCategories.bind(eventStore)}>
                        <i className="fa fa-plus-square-o" aria-hidden="true"></i>
                        {TranslateService.translate(eventStore, 'EXPAND_ALL')}
                    </button>
                    <div className={"sidebar-statistics"}> | </div>
                    <button className={"link-button padding-inline-start-10"} style={{ cursor: "pointer" }} onClick={eventStore.closeAllCategories.bind(eventStore)}>
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
                        maxHeight: (100 * itemsCount) + 'px', padding: "10px", transition: "padding 0.2s ease, max-height 0.3s ease-in-out"
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
                        <div style={isOpen? openStyle : closedStyle}>
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

    const renderListView = () => <div className={"trip-summary"} dangerouslySetInnerHTML={{__html:buildHTMLSummary(eventStore)}} />;

    const renderLoading = () => <LoadingPage title={"loading"} message={"Please wait while loading..."} />;

    const addToEventsToCategories = (newEvent) => {
        setEventsToCategories(
            {
                ...eventsToCategories,
                [newEvent.id]: newEvent.extendedProps.categoryId
            }
        )
    }

    const renderCalendarView = () => (<TriplanCalendar
        ref={TriplanCalendarRef}
        defaultCalendarEvents={getDefaultCalendarEvents()}
        onEventReceive={removeEventFromSidebarById}
        allEvents={eventStore.allEvents}
        addEventToSidebar={addEventToSidebar}
        updateAllEventsEvent={updateAllEventsEvent}
        customDateRange={customDateRange}
        categories={eventStore.categories}
        addToEventsToCategories={addToEventsToCategories}
    />)

    console.log('date range', customDateRange);

    return isLoading ? renderLoading () : (
        <div className={"main-page"}>
            <div className={"header-container"} style={{
                backgroundColor: "#eaeff5",
                position: "sticky",
                top: 0,
                zIndex: 999
            }}>
                {renderHeaderLine(eventStore, {
                    withLogo: true,
                    withSearch: true,
                    withViewSelector: true,
                    withRecommended: false
                })}
            </div>
            <div style={{ padding: 30, paddingTop: 0 }}>
                <div className={getClasses("main-layout", eventStore.getCurrentDirection())} style={{
                    height: "CALC(100vh - 120px)",
                    display: "flex",
                    gap: "10px"
                }}>
                    <div className={"external-events-container bright-scrollbar"} style={{
                        paddingInlineEnd: "10px",
                        maxWidth: "400px"
                    }}>
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
                        {/*{renderEvents()}*/}
                    </div>

                    <div style={{
                        display: "flex",
                        flex: "1 1 0",
                    }} className={getClasses(["list-container bright-scrollbar"], !eventStore.isListView && 'opacity-0 position-absolute')}>
                        {renderListView()}
                    </div>

                    <div className={getClasses(["calender-container bright-scrollbar"], eventStore.isListView && 'opacity-0 position-absolute')}
                    style={{
                        display: "flex",
                        flex: "1 1 0",
                    }}>
                        {renderCalendarView()}
                    </div>
                </div>
            </div>
        </div>
    );

}

export default observer(MainPage);