import React, {forwardRef, Ref, useContext, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {CalendarEvent, SidebarEvent, TriPlanCategory} from "../../utils/interfaces";
import {addHoursToDate} from "../../utils/utils";
import {observer} from 'mobx-react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list"
import interactionPlugin, {Draggable} from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {eventStoreContext} from "../../stores/events-store";
import './triplan-calendar.css'
import ModalService from "../../services/modal-service";
import {defaultTimedEventDuration} from "../../utils/defaults";
import TranslateService from "../../services/translate-service";
import {getDateRangeString, getTimeStringFromDate} from "../../utils/time-utils";

export interface TriPlanCalendarProps {
    defaultCalendarEvents?: CalendarEvent[],
    onEventReceive?: (eventId: string) => void,
    onEventClick?: (info: any) => void
    allEvents: SidebarEvent[],
    addEventToSidebar: (event: SidebarEvent) => void,
    updateAllEventsEvent: (event: SidebarEvent) => void,
    customDateRange: { start?: string, end?: string },
    categories: TriPlanCategory[],
    addToEventsToCategories: (newEvent: CalendarEvent) => void,
}

export interface TriPlanCalendarRef {
    refreshSources(): void;
}

function TriplanCalendar (props: TriPlanCalendarProps, ref: Ref<TriPlanCalendarRef>) {
    const { allEvents, customDateRange, defaultCalendarEvents = [] } = props;
    const [draggables, setDraggables] = useState<any[]>([])
    const calendarComponentRef = useRef<FullCalendar>(null);
    const eventStore = useContext(eventStoreContext);

    // make our ref know myFunction function so we can use it outside.
    useImperativeHandle(ref, () => ({
        refreshSources: refreshSources,
        switchToCustomView: switchToCustomView
    }));

    useEffect(() => {
        // custom dates
        if (calendarComponentRef && calendarComponentRef.current){
            if (!switchToCustomView()){
                // @ts-ignore
                calendarComponentRef.current.getApi().changeView('timeGridWeek');
            }
        }
    }, [props.customDateRange, calendarComponentRef]);

    useEffect(() => {
        // adding dragable properties to external events through javascript
        draggables.forEach((d) => d.destroy());

        const draggablesArr: any[] = [];
        let elements = document.getElementsByClassName("external-events");
        Array.from(elements).forEach((draggableEl: any) => {
            draggablesArr.push(new Draggable(draggableEl, {
                itemSelector: ".fc-event",
                eventData: getEventData
            }));
        })

        setDraggables(draggablesArr);

    }, [props.categories]);

    useEffect(() => {
        calendarComponentRef.current!.render();
    }, [eventStore.calendarLocalCode]);

    const getEventData = (eventEl: any) => {
        let title = eventEl.getAttribute("title");
        let id = eventEl.getAttribute("data-id");
        let duration = eventEl.getAttribute("data-duration");
        let categoryId = eventEl.getAttribute("data-category");
        let eventIcon = eventEl.getAttribute("data-icon");
        let description = eventEl.getAttribute("data-description");
        let priority = eventEl.getAttribute("data-priority");
        let preferredTime = eventEl.getAttribute("data-preferred-time");

        return {
            title,
            id,
            duration,
            className: priority? `priority-${priority}` : undefined,
            extendedProps:{
                id,
                categoryId,
                description,
                priority,
                icon: eventIcon,
                preferredTime
            }
        };
    }

    function switchToCustomView() {
        if (calendarComponentRef && calendarComponentRef.current) {

            if (customDateRange && customDateRange.start && customDateRange.end) {

                const dt = addHoursToDate(new Date(customDateRange.end), 24)
                const year = dt.getFullYear();
                const month = dt.getMonth() < 9 ? `0${dt.getMonth() + 1}` : dt.getMonth() + 1;
                const day = dt.getDate();

                // @ts-ignore
                calendarComponentRef.current.getApi().changeView('timeGrid', {
                    start: customDateRange.start,
                    end: [year, month, day].join('-')
                });

                return true;
            }
        }
        return false;
    }

    const onEventReceive = (info: any) => {
        // on event recieved (dropped) - keep its category and delete it from the sidebar.
        if (!eventStore) return;

        // callback
        props.onEventReceive && props.onEventReceive(info.event.id)

        const { start, end, title, id, classNames, extendedProps, allDay } = info.event;
        const event = { start, end, title, id, className: classNames ? classNames.join(" ") : undefined, extendedProps, allDay };

        // remove event from Fullcalendar internal store
        info.event.remove();

        // add it to our store (so it'll be updated on fullcalendar via calendarEvents prop)
        eventStore.setCalendarEvents([
            ...eventStore.calendarEvents,
            event
        ])

        refreshSources();
    }

    const onEventClick = (info: any) => {
       ModalService.openEditCalendarEventModal(eventStore, props.addEventToSidebar, info)
    };

    const handleEventChange = (changeInfo: any) => {
        eventStore.changeEvent(changeInfo);
    }

    // todo remove
    function refreshSources(){
        if (calendarComponentRef.current) {
            // @ts-ignore
            calendarComponentRef.current.getApi().getEventSources().forEach(function (item: EventApi) {
                item.remove();
            });

            // @ts-ignore
            calendarComponentRef.current.getApi().addEventSource(eventStore.calendarEvents);
        }
    }

    function onCalendarSelect(selectionInfo: any) {
        ModalService.openAddCalendarEventModal(eventStore, props.addToEventsToCategories, selectionInfo);
        // // set values in inputs
        // $('#event-modal').find('input[name=evtStart]').val(
        //     start.format('YYYY-MM-DD HH:mm:ss')
        // );
        // $('#event-modal').find('input[name=evtEnd]').val(
        //     end.format('YYYY-MM-DD HH:mm:ss')
        // );
        //
        // // show modal dialog
        // $('#event-modal').modal('show');
    }

    return (
        <FullCalendar
            initialView={"timeGridWeek"}
            // defaultView="timeGridWeek"
            headerToolbar={{
                left: 'prev,next today',
                center: 'customTitle',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            titleFormat={{ year: 'numeric', month: 'short', day: 'numeric' }}
            customButtons={{
                customTitle: {
                    text: `${eventStore.tripName} (${getDateRangeString(new Date(eventStore.customDateRange.start), new Date(eventStore.customDateRange.end))})`,
                    click: function() {}
                }
            }}
            buttonText={{
                today:    TranslateService.translate(eventStore,'BUTTON_TEXT.TODAY'),
                month:    TranslateService.translate(eventStore,'BUTTON_TEXT.MONTH'),
                week:     TranslateService.translate(eventStore,'BUTTON_TEXT.WEEK'),
                day:      TranslateService.translate(eventStore,'BUTTON_TEXT.DAY'),
                list:     TranslateService.translate(eventStore,'BUTTON_TEXT.LIST'),
            }}
            allDayText={TranslateService.translate(eventStore,'ALL_DAY_TEXT')}
            weekText={TranslateService.translate(eventStore,'WEEK_TEXT')}
            scrollTime={"07:00"}
            slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short',
                hour12: false,
            }}
            rerenderDelay={10}
            defaultTimedEventDuration={defaultTimedEventDuration}
            eventDurationEditable={true}
            editable={true}
            droppable={true}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            ref={calendarComponentRef}
            // weekends={calendarWeekends}
            events={eventStore.filteredCalendarEvents}
            // drop={eventDrop}
            // drop={drop}
            eventReceive={onEventReceive}
            eventClick={onEventClick}
            eventChange={handleEventChange}
            eventResizableFromStart={true}
            // selectable={true}
            locale={eventStore.calendarLocalCode}
            direction={eventStore.getCurrentDirection()}
            buttonIcons={false} // show the prev/next text
            weekNumbers={true}
            navLinks={true} // can click day/week names to navigate views
            dayMaxEvents={true} // allow "more" link when too many events
            selectable={true}
            select={onCalendarSelect}
            eventContent={function(eventContentArg) {
                let eventEl = document.createElement('div')
                eventEl.classList.add("triplan-calendar-event");

                const event = eventContentArg.event;
                const info = event.extendedProps;

                const category = info.categoryId;
                const icon = info.icon || eventStore.categoriesIcons[category];

                eventEl.innerHTML = `
                    <div>${icon} ${event.title}</div>
                    ${event.allDay ? "" : `<div class="fc-event-time">${event.start ? getTimeStringFromDate(event.start) : ""}${event.end ? "-" + getTimeStringFromDate(event.end) : ""}</div>`}
                `;

                let arrayOfDomNodes = [ eventEl ]
                return { domNodes: arrayOfDomNodes }
            }}
        />
    )
}

export default observer(forwardRef<TriPlanCalendarRef, TriPlanCalendarProps>(
    TriplanCalendar
));