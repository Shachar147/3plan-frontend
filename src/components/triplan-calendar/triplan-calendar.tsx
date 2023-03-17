import React, { forwardRef, Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { buildCalendarEvent, CalendarEvent, SidebarEvent, TriPlanCategory } from '../../utils/interfaces';
import { observer } from 'mobx-react';
import FullCalendar, { EventContentArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { eventStoreContext } from '../../stores/events-store';
import './triplan-calendar.scss';
import { defaultTimedEventDuration } from '../../utils/defaults';
import TranslateService from '../../services/translate-service';
import {
	addDays,
	addHours,
	addHoursToDate,
	getDateRangeString,
	isTodayInDateRange,
	toDate,
} from '../../utils/time-utils';
import ReactModalService from '../../services/react-modal-service';
import { DateRangeFormatted } from '../../services/data-handlers/data-handler-base';
import { getEventDivHtml } from '../../utils/ui-utils';
import { trace } from 'mobx';

export interface TriPlanCalendarProps {
	defaultCalendarEvents?: CalendarEvent[];
	onEventReceive?: (eventId: string) => void;
	onEventClick?: (info: any) => void;
	allEvents: SidebarEvent[];
	addEventToSidebar: (event: SidebarEvent) => boolean;
	updateAllEventsEvent?: (event: SidebarEvent) => void;
	customDateRange: DateRangeFormatted;
	categories: TriPlanCategory[];
	addToEventsToCategories: (newEvent: CalendarEvent) => void;
}

export interface TriPlanCalendarRef {
	refreshSources: () => void;
	switchToCustomView: () => boolean;
	setMobileDefaultView: () => void;
}

function TriplanCalendar(props: TriPlanCalendarProps, ref: Ref<TriPlanCalendarRef>) {
	const eventStore = useContext(eventStoreContext);
	const [draggables, setDraggables] = useState<any[]>([]);
	const calendarComponentRef = useRef<FullCalendar>(null);
	const { customDateRange } = props;
	const [isDoubleClicked, setIsDoubleClicked] = useState(false);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		refreshSources: refreshSources,
		switchToCustomView: switchToCustomView,
		setMobileDefaultView: setMobileDefaultView,
	}));

	useEffect(() => {
		// custom dates
		if (calendarComponentRef && calendarComponentRef.current) {
			if (!switchToCustomView()) {
				// @ts-ignore
				calendarComponentRef.current.getApi().changeView('timeGridWeek');
			}
		}
	}, [props.customDateRange, calendarComponentRef]);

	useEffect(() => {
		// adding dragable properties to external events through javascript
		draggables.forEach((d) => d.destroy());

		const draggablesArr: any[] = [];
		let elements = document.getElementsByClassName('external-events');
		Array.from(elements).forEach((draggableEl: any) => {
			draggablesArr.push(
				new Draggable(draggableEl, {
					itemSelector: '.fc-event',
					eventData: getEventData,
				})
			);
		});

		setDraggables(draggablesArr);
	}, [props.categories]);

	useEffect(() => {
		calendarComponentRef.current!.render();
	}, [eventStore.calendarLocalCode]);

	const getEventData = (eventEl: any) => {
		let title = eventEl.getAttribute('title');
		let id = eventEl.getAttribute('data-id');
		let duration = eventEl.getAttribute('data-duration');
		let categoryId = eventEl.getAttribute('data-category');
		let eventIcon = eventEl.getAttribute('data-icon');
		let description = eventEl.getAttribute('data-description');
		let priority = eventEl.getAttribute('data-priority');
		let preferredTime = eventEl.getAttribute('data-preferred-time');
		let location = eventEl.getAttribute('data-location');
		let openingHours = eventEl.getAttribute('data-opening-hours');
		let images = eventEl.getAttribute('data-images'); // add column 1

		let moreInfo = eventEl.getAttribute('data-more-info');

		const event = {
			title,
			id,
			duration,
			className: priority ? `priority-${priority}` : undefined,
			category: categoryId,
			description,
			priority,
			icon: eventIcon,
			preferredTime,
			location: location ? JSON.parse(location) : undefined,
			openingHours: openingHours ? JSON.parse(openingHours) : undefined,
			images, // add column 2
			moreInfo,
		};

		return {
			...event,
			extendedProps: {
				...event,
			},
		};
	};

	const switchToCustomView = () => {
		if (calendarComponentRef && calendarComponentRef.current) {
			if (customDateRange && customDateRange.start && customDateRange.end) {
				const dt = addHoursToDate(new Date(customDateRange.end), 24);
				const year = dt.getFullYear();
				const month = dt.getMonth() < 9 ? `0${dt.getMonth() + 1}` : dt.getMonth() + 1;
				const day = dt.getDate();

				// @ts-ignore
				calendarComponentRef.current.getApi().changeView('timeGrid', {
					start: customDateRange.start,
					end: [year, month, day].join('-'),
				});

				return true;
			}
		}
		return false;
	};

	// ERROR HANDLING: todo add try/catch & show a message if fails
	const onEventReceive = (info: any) => {
		// on event recieved (dropped) - keep its category and delete it from the sidebar.
		if (!eventStore) return;

		// callback
		props.onEventReceive && props.onEventReceive(info.event.id);

		const { id, classNames } = info.event;
		const event = {
			...info.event._def,
			start: info.event.start,
			end: info.event.end,
			id: info.event._def.publicId,
			...info.event,
			...info.event.extendedProps,
			className: classNames ? classNames.join(' ') : undefined,
		};

		const calendarEvent = buildCalendarEvent(event) as CalendarEvent;

		// remove event from Fullcalendar internal store
		info.event.remove();

		// add it to our store (so it'll be updated on fullcalendar via calendarEvents prop)
		eventStore.setCalendarEvents([...eventStore.calendarEvents.filter((x) => x.id !== id), calendarEvent]);

		refreshSources();
	};

	const onEventClick = (info: any) => {
		ReactModalService.openEditCalendarEventModal(eventStore, props.addEventToSidebar, info);
	};

	const handleEventChange = async (changeInfo: any) => {
		// // when changing "allDay" event to be regular event, it has no "end".
		// // the following lines fix it by extracting start&end from _instance.range, and converting them to the correct timezone.
		// const hoursToAdd = changeInfo.event._instance.range.start.getTimezoneOffset() / 60;
		// const dtStart = addHours(changeInfo.event._instance.range.start, hoursToAdd);
		// const dtEnd = addHours(changeInfo.event._instance.range.end, hoursToAdd);

		const newEvent = {
			...changeInfo.event._def,
			...changeInfo.event.extendedProps,
			...changeInfo.event,
			allDay: changeInfo.event.allDay,
			// start: dtStart,
			// end: dtEnd,
			hasEnd: !changeInfo.event.allDay,
			start: changeInfo.event.start,
			end: changeInfo.event.end,
		};

		// ERROR HANDLING: todo add try/catch & show a message if fails
		return eventStore.changeEvent({ event: newEvent });
	};

	const refreshSources = () => {
		// todo - check if we still need this function. if not - remove
		if (calendarComponentRef.current) {
			calendarComponentRef.current
				.getApi()
				.getEventSources()
				.forEach((item) => {
					item.remove();
				});

			calendarComponentRef.current.getApi().addEventSource(eventStore.calendarEvents);
		}
	};

	const onCalendarSelect = (selectionInfo: any) => {
		let shouldOpen = true;
		// if (eventStore.isMobile) {
		shouldOpen = false;
		if (!isDoubleClicked) {
			// console.log("not clicked yet!");
			setIsDoubleClicked(true);
			setTimeout(() => {
				// console.log("oops too long");
				setIsDoubleClicked(false);
			}, 1000);
		} else {
			// console.log("double clicked!");
			setIsDoubleClicked(false);
			shouldOpen = true;
		}
		// }

		if (shouldOpen) {
			ReactModalService.openAddCalendarEventModal(eventStore, props.addToEventsToCategories, selectionInfo);
		}
	};

	const renderEventContent = (info: EventContentArg) => {
		let eventEl = document.createElement('div');
		eventEl.classList.add('triplan-calendar-event');

		const event = info.event;

		const json = {
			// id: event._def.publicId,
			...event,
			...event.extendedProps,
			...event._def,
			start: event.start ?? event._instance?.range?.start,
			end: event.end ?? event._instance?.range?.end,
		};
		const calendarEvent = buildCalendarEvent(json) as CalendarEvent;

		eventEl.innerHTML = getEventDivHtml(eventStore, calendarEvent);

		let arrayOfDomNodes = [eventEl];
		return { domNodes: arrayOfDomNodes };
	};

	const buttonTexts = {
		today: TranslateService.translate(eventStore, 'BUTTON_TEXT.TODAY'),
		month: TranslateService.translate(eventStore, 'BUTTON_TEXT.MONTH'),
		week: TranslateService.translate(eventStore, 'BUTTON_TEXT.WEEK'),
		day: TranslateService.translate(eventStore, 'BUTTON_TEXT.DAY'),
		list: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST'),
	};

	// show today button only if today is in the range of this trip
	const showTodayButton = isTodayInDateRange(customDateRange);
	const today = showTodayButton ? ' today' : '';

	// on mobile - organize all the calendar navigators on the same line
	// also trip name will appear on all tabs in mobile view, so no need to render it here either.
	const headerToolbar = eventStore.isMobile
		? {
				left: '',
				center: '',
				right: `prev,next${today} dayGridMonth,timeGridThreeDay,timeGridDay`,
		  }
		: {
				left: `prev,next${today}`,
				center: 'customTitle',
				right: 'dayGridMonth,timeGridWeek,timeGridDay',
		  };

	const customButtons = {
		customTitle: {
			text: `${eventStore.tripName.replaceAll('-', ' ')} (${getDateRangeString(
				new Date(eventStore.customDateRange.start),
				new Date(eventStore.customDateRange.end)
			)})`,
			click: function () {},
		},
	};

	// set view mode as time grid three day on mobile
	useEffect(() => {
		if (!calendarComponentRef.current) return;
		if (!eventStore.isMobile) return;
		setMobileDefaultView();
	}, [eventStore.isMobile]);

	const setMobileDefaultView = () => {
		calendarComponentRef.current?.getApi().changeView('timeGridThreeDay');
	};

	return (
		<FullCalendar
			initialView={'timeGridWeek'}
			headerToolbar={headerToolbar}
			titleFormat={{ year: 'numeric', month: 'short', day: 'numeric' }}
			customButtons={customButtons}
			views={{
				timeGridThreeDay: {
					type: 'timeGrid',
					duration: { days: 3 },
					buttonText: TranslateService.translate(eventStore, 'BUTTON_TEXT.3_DAYS'),
				},
			}}
			buttonText={buttonTexts}
			allDayText={TranslateService.translate(eventStore, 'ALL_DAY_TEXT')}
			weekText={TranslateService.translate(eventStore, 'WEEK_TEXT')}
			scrollTime={'07:00'}
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
			events={eventStore.filteredCalendarEvents.map((x) => ({
				...x,
				extendedProps: {
					...x,
				},
				className: x.className ?? `priority-${x.priority}`,
			}))}
			eventReceive={onEventReceive}
			eventClick={onEventClick}
			eventChange={handleEventChange}
			eventResizableFromStart={true}
			locale={eventStore.calendarLocalCode}
			direction={eventStore.getCurrentDirection()}
			buttonIcons={false} // show the prev/next text
			// weekNumbers={true}
			navLinks={true} // can click day/week names to navigate views
			dayMaxEvents={true} // allow "more" link when too many events
			selectable={true}
			select={onCalendarSelect}
			eventContent={renderEventContent}
			longPressDelay={5}
			validRange={{
				start: eventStore.customDateRange.start,
				// end: fullCalendarFormatDate(addDays(toDate(eventStore.customDateRange.end), 1)),
				end: addDays(toDate(eventStore.customDateRange.end), 1),
			}}
			slotMinTime={'07:00'}
			scrollTimeReset={false} /* fix bug of calendar being scrolled up after each event change */
		/>
	);
}

export default observer(forwardRef<TriPlanCalendarRef, TriPlanCalendarProps>(TriplanCalendar));
