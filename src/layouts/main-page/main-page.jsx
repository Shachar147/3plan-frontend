import React, {useContext, useEffect, useRef, useState} from "react";
import {containsDuplicates, getClasses} from '../../utils/utils';
import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import './main-page.css';

import TriplanCalendar from "../../components/triplan-calendar/triplan-calendar";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {
    defaultEventsToCategories,
} from "../../utils/defaults";
import {renderHeaderLine} from "../../utils/ui-utils";
import {useParams} from "react-router-dom";
import TriplanSidebar from "../../components/triplan-sidebar/triplan-sidebar";
import MapContainer from "../../components/map-container/map-container";
import ListViewService from "../../services/list-view-service";
import DBService from "../../services/db-service";
import {getUser} from "../../helpers/auth";
import DataServices from "../../services/data-handlers/data-handler-base";
import {ListViewSummaryMode, ViewMode} from "../../utils/enums";
import TranslateService from "../../services/translate-service";
import ToggleButton from "../../components/toggle-button/toggle-button";

const MainPage = (props) => {
    const { createMode } = props;
    const [eventsToCategories, setEventsToCategories] = useState(defaultEventsToCategories)
    const TriplanCalendarRef = useRef(null)
    let { tripName, locale } = useParams();

    const eventStore = useContext(eventStoreContext);
    // const [customDateRange, setCustomDateRange] = useState(DataServices.LocalStorageService.getDateRange(eventStore.tripName));

    // todo complete
    // useEffect(() => {
    //
    //     if (eventStore.tripName !== "") {
    //         if (getUser()) {
    //             DBService.upsertTripByName(eventStore.tripName, eventStore.customDateRange, eventStore, () => {
    //                 console.log("updated db successfully");
    //             }, () => {
    //                 console.log("failed updating db")
    //             });
    //         }
    //     }
    //
    // }, [eventStore.allEvents, eventStore.calendarEvents, eventStore.categories, eventStore.sidebarEvents, eventStore.customDateRange, eventStore.calendarLocalCode, eventStore.tripName])

    useEffect(() => {
        if (TriplanCalendarRef && TriplanCalendarRef.current) {
            TriplanCalendarRef.current.switchToCustomView();
        }
    }, [TriplanCalendarRef, eventStore.customDateRange])

    useEffect(() => {
        eventStore.setTripName(tripName, locale, createMode);
        eventStore.setCustomDateRange(DataServices.LocalStorageService.getDateRange(eventStore.tripName)); // must put it here, otherwise dates are incorrect
    }, [tripName, locale]);

    useEffect(() => {
        // update idtoevent, idtocategory and allevents array
        const arr = [...eventStore.allEvents];
        const idToEvent = {};
        const idToCategory = {};
        Object.keys(eventStore.getSidebarEvents).map((category) => {
            eventStore.getSidebarEvents[category].forEach((event) => {
                if (event.priority){
                    event.className = `priority-${event.priority}`;
                }
                idToEvent[event.id] = event;
                idToCategory[event.id] = category;
            })
        });

        const existingIds = eventStore.allEvents.map(e => e.id.toString());
        Object.keys(idToEvent).forEach((eventId) => {
            if (existingIds.indexOf(eventId) === -1){
                arr.push({...idToEvent[eventId], category: idToCategory[eventId]});
            }
        });
        eventStore.setAllEvents(arr);

    }, [eventStore.sidebarEvents]);

    const addEventToSidebar = (event) => {
        const newEvents = {...eventStore.sidebarEvents};
        let category = eventsToCategories[event.id];
        // console.log("category", category);
        if (!category){
            const findEvent = eventStore.allEvents.find((x) => x.id.toString() === event.id.toString());
            // console.log("category find", findEvent);
            category = findEvent.category;
            if (!category && findEvent && findEvent.extendedProps){
                category = findEvent.extendedProps.categoryId;
                // console.log("category find 2", category);
            }
        }

        if (category != undefined) {
            delete event.start;
            delete event.end;

            if (event.extendedProps){
                event.preferredTime = event.extendedProps.preferredTime;
            }

            newEvents[category] = newEvents[category] || [];
            newEvents[category].push(event)
            eventStore.setSidebarEvents(newEvents);
            return true;
        } else {
            return false;
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

    const renderListView = () => (
        <div className={getClasses(["list-container flex-1-1-0"], !eventStore.isListView && 'opacity-0 position-absolute')}>
            <div className={"list-view-mode-selector"} key={`list-view-summary-mode-${eventStore.calendarLocalCode}`}>
                <ToggleButton
                    value={eventStore.listViewSummaryMode}
                    onChange={(newVal) => eventStore.setListViewSummaryMode(newVal)}
                    options={[
                        {
                            key: ListViewSummaryMode.box,
                            name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.BOX'),
                            // icon: (<i className="fa fa-map-o black-color" aria-hidden="true"></i>),
                            // iconActive: (<i className="fa fa-list blue-color" aria-hidden="true"></i>)
                        },
                        {
                            key: ListViewSummaryMode.noDescriptions,
                            name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.NO_DESCRIPTIONS'),
                            // icon: (<i className="fa fa-calendar black-color" aria-hidden="true"></i>),
                            // iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true"></i>)
                        },
                        {
                            key: ListViewSummaryMode.full,
                            name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.FULL'),
                            // icon: (<i className="fa fa-calendar black-color" aria-hidden="true"></i>),
                            // iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true"></i>)
                        }
                    ]}
                    customStyle="white"
                />
            </div>
            <div className={"trip-summary bright-scrollbar padding-top-60"} dangerouslySetInnerHTML={{__html: eventStore.isListView ? ListViewService.buildHTMLSummary(eventStore) : ""}} />
        </div>
    );

    const renderMapView = () => (
        <div className={getClasses(["map-container flex-1-1-0"], !eventStore.isMapView && 'opacity-0 position-absolute')}>
            <MapContainer />
        </div>
    );

    const addToEventsToCategories = (newEvent) => {
        setEventsToCategories(
            {
                ...eventsToCategories,
                [newEvent.id]: newEvent.extendedProps.categoryId
            }
        )
    }

    const renderCalendarView = () => (
        <div className={getClasses(["calender-container bright-scrollbar flex-1-1-0"], !eventStore.isCalendarView && 'opacity-0 position-absolute')}>
            <TriplanCalendar
                ref={TriplanCalendarRef}
                defaultCalendarEvents={DataServices.LocalStorageService.getCalendarEvents(eventStore.tripName)}
                onEventReceive={removeEventFromSidebarById}
                allEvents={eventStore.allEvents}
                addEventToSidebar={addEventToSidebar}
                // updateAllEventsEvent={updateAllEventsEvent}
                customDateRange={eventStore.customDateRange}
                categories={eventStore.categories}
                addToEventsToCategories={addToEventsToCategories}
            />
        </div>)

    const renderSidebar = () => (
        <TriplanSidebar
            addToEventsToCategories={addToEventsToCategories}
            removeEventFromSidebarById={removeEventFromSidebarById}
            customDateRange={eventStore.customDateRange}
            setCustomDateRange={eventStore.setCustomDateRange.bind(eventStore)}
            TriplanCalendarRef={TriplanCalendarRef}
        />
    )

    // console.log('date range', customDateRange);

    return (
        <div className={"main-page"} key={JSON.stringify(eventStore.customDateRange)}>
            <div className={"header-container"}>
                {renderHeaderLine(eventStore, {
                    withLogo: true,
                    withSearch: true,
                    withViewSelector: true,
                    withRecommended: false,
                    withLoginLogout: true,
                    withFilterTags: true
                })}
            </div>
            <div className={"main-layout-container"}>
                <div className={getClasses("main-layout", eventStore.getCurrentDirection())}>
                    {renderSidebar()}
                    {eventStore.isMapView && renderMapView()}
                    {eventStore.isListView && renderListView()}
                    {eventStore.isCalendarView && renderCalendarView()}
                </div>
            </div>
        </div>
    );

}

export default observer(MainPage);