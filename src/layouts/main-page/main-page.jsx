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
    getDefaultCalendarEvents, getDefaultCustomDateRange, setAllEvents,
} from "../../utils/defaults";
import {renderHeaderLine} from "../../utils/ui-utils";
import {useParams} from "react-router-dom";
import TriplanSidebar from "../../components/triplan-sidebar/triplan-sidebar";
import MapContainer from "../../components/map-container/map-container";
import _ from "lodash";
import ListViewService from "../../services/list-view-service";
import SweetAlert from 'react-bootstrap-sweetalert';

const MainPage = () => {
    const [eventsToCategories, setEventsToCategories] = useState(defaultEventsToCategories)
    const TriplanCalendarRef = useRef(null)
    let { tripName, locale } = useParams();

    const eventStore = useContext(eventStoreContext);
    const [customDateRange, setCustomDateRange] = useState(getDefaultCustomDateRange(eventStore.tripName));
    const [allEventsFixed, setAllEventsFixed] = useState(false);

    // useEffect(() => {
    //
    //     const newEvents = eventStore.allEvents.filter((x) => eventStore.calendarEvents.map(e => e.id).indexOf(x.id) === -1);
    //     newEvents.push(
    //         ...[...eventStore.calendarEvents].map((x) => {
    //             delete x.start;
    //             delete x.end;
    //             return x;
    //         })
    //     )
    //     eventStore.setAllEvents(newEvents);
    //
    // },[eventStore.calendarEvents])

    // useEffect(() => {
    //
    //     const { allEvents, sidebarEvents, calendarEvents } = eventStore;
    //
    //     if (!allEventsFixed && allEvents.length && Object.values(sidebarEvents).flat().length && calendarEvents.length) {
    //
    //         setAllEventsFixed(true);
    //
    //         debugger;
    //         const allEventsIds = allEvents.map((x) => x.id);
    //         const visibleEvents = [...Object.values(sidebarEvents).flat(), ...calendarEvents];
    //         const visibleIds = visibleEvents.map((x) => x.id);
    //         const missingEvents = allEvents.filter((x) => visibleIds.indexOf(x.id) === -1 && !visibleEvents.find((y) => y.title === x.title));
    //
    //         console.log("missing:", missingEvents.length, allEvents.filter((x) => missingEvents.indexOf(x.id) !== -1))
    //
    //         console.log("all events ids", allEventsIds.length);
    //         console.log("all events ids unified", _.uniq(allEventsIds).length);
    //         console.log("visible ids", visibleIds.length);
    //
    //         if (missingEvents.length === 0){
    //             const newEvents = visibleEvents.map((x) => {
    //                 if (!x.category && x.extendedProps && x.extendedProps.categoryId){
    //                     x.category = x.extendedProps.categoryId;
    //                 }
    //                 return x;
    //             });
    //             if (containsDuplicates(newEvents)){
    //                 debugger;
    //             }
    //             eventStore.setAllEvents(newEvents)
    //         }
    //     }
    //
    // }, [eventStore.calendarEvents, eventStore.sidebarEvents, eventStore.allEvents])

    useEffect(() => {
        eventStore.setTripName(tripName, locale);
        setCustomDateRange(getDefaultCustomDateRange(eventStore.tripName));

        if (TriplanCalendarRef && TriplanCalendarRef.current) {
            TriplanCalendarRef.current.switchToCustomView();
        }
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
            <div className={"trip-summary bright-scrollbar"} dangerouslySetInnerHTML={{__html: eventStore.isListView ? ListViewService.buildHTMLSummary(eventStore) : ""}} />
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
                defaultCalendarEvents={getDefaultCalendarEvents()}
                onEventReceive={removeEventFromSidebarById}
                allEvents={eventStore.allEvents}
                addEventToSidebar={addEventToSidebar}
                // updateAllEventsEvent={updateAllEventsEvent}
                customDateRange={customDateRange}
                categories={eventStore.categories}
                addToEventsToCategories={addToEventsToCategories}
            />
        </div>)

    const renderSidebar = () => (
        <TriplanSidebar
            addToEventsToCategories={addToEventsToCategories}
            removeEventFromSidebarById={removeEventFromSidebarById}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            TriplanCalendarRef={TriplanCalendarRef}
        />
    )

    // console.log('date range', customDateRange);

    return (
        <div className={"main-page"} key={JSON.stringify(customDateRange)}>
            <div className={"header-container"}>
                {renderHeaderLine(eventStore, {
                    withLogo: true,
                    withSearch: true,
                    withViewSelector: true,
                    withRecommended: false,
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