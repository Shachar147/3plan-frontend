import React, {useContext, useEffect, useRef, useState} from "react";
import { buildHTMLSummary, getClasses } from '../../utils/utils';
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
    getDefaultCalendarEvents, getDefaultCustomDateRange,
} from "../../utils/defaults";
import {renderHeaderLine} from "../../utils/ui-utils";
import {useParams} from "react-router-dom";
import TriplanSidebar from "../../components/triplan-sidebar/triplan-sidebar";

const MainPage = () => {
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

    const renderListView = () => (
        <div className={getClasses(["list-container flex-1-1-0"], !eventStore.isListView && 'opacity-0 position-absolute')}>
            <div className={"trip-summary bright-scrollbar"} dangerouslySetInnerHTML={{__html:buildHTMLSummary(eventStore)}} />
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
        <div className={getClasses(["calender-container bright-scrollbar flex-1-1-0"], eventStore.isListView && 'opacity-0 position-absolute')}>
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
                    withRecommended: false
                })}
            </div>
            <div className={"main-layout-container"}>
                <div className={getClasses("main-layout", eventStore.getCurrentDirection())}>
                    {renderSidebar()}
                    {renderListView()}
                    {renderCalendarView()}
                </div>
            </div>
        </div>
    );

}

export default observer(MainPage);