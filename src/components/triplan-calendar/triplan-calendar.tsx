import React, { forwardRef, Ref, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { buildCalendarEvent, CalendarEvent, SidebarEvent, TripActions, TriPlanCategory } from '../../utils/interfaces';
import { observer } from 'mobx-react';
import FullCalendar, { EventApi, EventContentArg } from '@fullcalendar/react';
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
	addSeconds,
	areDatesOnDifferentDays,
	convertMsToHM,
	formatFromISODateString,
	getDateRangeString,
	getOffsetInHours,
	isTodayInDateRange,
	toDate,
} from '../../utils/time-utils';
import ReactModalService, { getDefaultSettings } from '../../services/react-modal-service';
import { DateRangeFormatted } from '../../services/data-handlers/data-handler-base';
import { getEventDivHtml } from '../../utils/ui-utils';
import { modalsStoreContext } from '../../stores/modals-store';
import { runInAction } from 'mobx';
import DraggableList from '../draggable-list/draggable-list';
import { getClasses, isEventAlreadyOrdered, jsonDiff, lockEvents } from '../../utils/utils';
import { TripDataSource } from '../../utils/enums';
import { DBService } from '../../services/data-handlers/db-service';
import { FeatureFlagsService } from '../../utils/feature-flags';

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
	mostAvailableSlotOnView: () => {
		start: Date | null;
		end: Date | null;
	};
}

function TriplanCalendar(props: TriPlanCalendarProps, ref: Ref<TriPlanCalendarRef>) {
	const eventStore = useContext(eventStoreContext);
	const modalsStore = useContext(modalsStoreContext);

	const [draggables, setDraggables] = useState<any[]>([]);
	const calendarComponentRef = useRef<FullCalendar>(null);
	const { customDateRange } = props;
	const [isDoubleClicked, setIsDoubleClicked] = useState(false);

	const _events = useMemo(() => {
		return eventStore.addSuggestedLeavingTime(eventStore.filteredCalendarEvents, eventStore).map((x) => ({
			...x,
			extendedProps: {
				...x,
			},
			className: x.className ?? `priority-${x.priority}`,
			editable: !eventStore.isMobile && !eventStore.isTripLocked,
		}));
	}, [eventStore.filteredCalendarEvents, eventStore.isMobile]);

	useEffect(() => {
		// for every change in _events, refresh the sources. to prevent the bug of the duplication.
		refreshSources();
	}, [_events]);

	useEffect(() => {
		runInAction(() => {
			eventStore.calendarEvents = eventStore.calendarEvents.map((x: CalendarEvent) => lockEvents(eventStore, x));
		});
	}, [eventStore.isTripLocked]);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		refreshSources: refreshSources,
		switchToCustomView: switchToCustomView,
		setMobileDefaultView: setMobileDefaultView,
		mostAvailableSlotOnView: mostAvailableSlotOnView,
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
		if (!eventStore.isTripLocked) {
			let elements = document.getElementsByClassName('external-events');
			Array.from(elements).forEach((draggableEl: any) => {
				draggablesArr.push(
					new Draggable(draggableEl, {
						itemSelector: '.fc-event',
						eventData: getEventData,
					})
				);
			});
		}

		setDraggables(draggablesArr);
	}, [
		props.categories,
		eventStore.allEventsFilteredComputed,
		eventStore.forceSetDraggable,
		eventStore.isTripLocked,
		eventStore.sidebarSearchValue,
	]);

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
		let price = eventEl.getAttribute('data-price');
		let currency = eventEl.getAttribute('data-currency');

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
			price,
			currency,
		};

		return {
			...event,
			extendedProps: {
				...event,
			},
		};
	};

	const switchToCustomView = () => {
		// added the condition of !isMobile. on mobile we do not want to display all the trip it just looks bad.
		if (eventStore.isMobile) {
			return false;
		}

		if (calendarComponentRef && calendarComponentRef.current) {
			if (customDateRange && customDateRange.start && customDateRange.end) {
				calendarComponentRef.current.getApi().changeView('timeGridAllDays');
				handleViewChange();
				return true;
			}
		}
		return false;
	};

	// ERROR HANDLING: todo add try/catch & show a message if fails
	const onEventReceive = (info: any) => {
		// on event recieved (dropped) - keep its category and delete it from the sidebar.
		if (!eventStore) return;

		if (eventStore.isTripLocked) {
			return;
		}

		// callback
		props.onEventReceive?.(info.event.id);

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
		eventStore.setCalendarEvents([...eventStore.calendarEvents.filter((x) => x.id != id), calendarEvent]);

		if (!eventStore.distanceSectionAutoOpened) {
			eventStore.setSelectedEventForNearBy(calendarEvent);
		}

		refreshSources();

		eventStore.triggerCalendarReRender();
	};

	const onEventClick = (info: any) => {
		modalsStore.switchToViewMode();
		ReactModalService.openEditCalendarEventModal(eventStore, props.addEventToSidebar, info, modalsStore);
	};

	const handleEventChange = async (changeInfo: any) => {
		// // when changing "allDay" event to be regular event, it has no "end".
		// // the following lines fix it by extracting start&end from _instance.range, and converting them to the correct timezone.
		// const hoursToAdd = changeInfo.event._instance.range.start.getTimezoneOffset() / 60;
		// const dtStart = addHours(changeInfo.event._instance.range.start, hoursToAdd);
		// const dtEnd = addHours(changeInfo.event._instance.range.end, hoursToAdd);

		if (eventStore.isTripLocked) {
			return;
		}

		const isEventLocked = changeInfo.oldEvent.classNames.join(' ').indexOf('locked') !== -1;
		if (isEventLocked) {
			ReactModalService.internal.openModal(eventStore, {
				...getDefaultSettings(eventStore),
				title: TranslateService.translate(eventStore, 'MODALS.ERROR.TITLE'),
				content: () => (
					<div className="white-space-pre-line">
						{TranslateService.translate(eventStore, 'MODALS.UPDATE_ORDERED_EVENT.CONTENT')}
					</div>
				),
				confirmBtnText: TranslateService.translate(eventStore, 'GOT_IT'),
				confirmBtnCssClass: 'primary-button red',
				cancelBtnCssClass: 'hidden min-height-0 height-0',
				onConfirm: () => {
					ReactModalService.internal.closeModal(eventStore);
				},
			});
			refreshSources();
			return;
		}

		const isOrdered = isEventAlreadyOrdered(eventStore, changeInfo.oldEvent);
		if (isOrdered) {
			ReactModalService.internal.openModal(eventStore, {
				...getDefaultSettings(eventStore),
				title: TranslateService.translate(eventStore, 'MODALS.ERROR.TITLE'),
				content: () => (
					<div className="white-space-pre-line">
						{TranslateService.translate(eventStore, 'MODALS.UPDATE_ORDERED_EVENT.CONTENT')}
					</div>
				),
				confirmBtnText: TranslateService.translate(eventStore, 'GOT_IT'),
				confirmBtnCssClass: 'primary-button red',
				cancelBtnCssClass: 'hidden min-height-0 height-0',
				onConfirm: () => {
					ReactModalService.internal.closeModal(eventStore);
				},
			});
			refreshSources();
			return;
		}

		// if ((storedEvent.className && storedEvent.className.indexOf('lock') !== -1) || this.isTripLocked) {
		// 	alert('locked!');
		// 	return;
		// }

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
			duration: convertMsToHM(changeInfo.event.end - changeInfo.event.start),
		};

		if (!eventStore.distanceSectionAutoOpened) {
			eventStore.setSelectedEventForNearBy(newEvent); // changeInfo.event);
		}

		// ERROR HANDLING: todo add try/catch & show a message if fails
		return eventStore.changeEvent({ event: newEvent }, changeInfo);
	};

	const refreshSources = () => {
		if (calendarComponentRef.current) {
			calendarComponentRef.current
				.getApi()
				.getEventSources()
				.forEach((item) => {
					item.remove();
				});

			calendarComponentRef.current.getApi().addEventSource(_events);
		}
	};

	var openAddToCalendarDebounced: any = undefined;
	const onCalendarSelect = (selectionInfo: any) => {
		const shouldOpen = !eventStore.isMobile;
		if (!shouldOpen) return;
		if (openAddToCalendarDebounced != undefined) return;

		// debounce
		openAddToCalendarDebounced = setTimeout(() => {
			openAddToCalendarDebounced = undefined;
			_onAddCalendar(selectionInfo);
		}, 300);
	};

	const _onAddCalendar = (selectionInfo: any) => {
		if (!eventStore.distanceSectionAutoOpened) {
			eventStore.setSelectedEventForNearBy(selectionInfo.event);
		}

		if (
			selectionInfo.end &&
			selectionInfo.start &&
			selectionInfo.end.getTime() - selectionInfo.start.getTime() == 1800000
		) {
			selectionInfo.end = addHours(new Date(selectionInfo.start), 1);
		}
		ReactModalService.openAddCalendarEventModal(eventStore, props.addToEventsToCategories, selectionInfo);
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

		// debug
		if (!event.start) {
			console.error('renderEventContent', 'event.start does not exist', event);
		}
		if (!event.end) {
			console.error('renderEventContent', 'event.end does not exist', event);
		}

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
				right: `prev,next${today} timeGridThreeDay,timeGridDay`,
		  }
		: {
				left: `prev,next${today}`,
				center: 'customTitle',
				right: 'dayGridMonth,timeGridWeek,timeGridDay,timeGridAllDays',
		  };

	const customButtons = FeatureFlagsService.isNewDesignEnabled()
		? undefined
		: {
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
		// calendarComponentRef.current?.getApi().changeView('timeGridDay');
	};

	const renderAddEventMobileButton = () => (
		<div
			className="mobile-add-calendar-event-button"
			onClick={() => {
				_onAddCalendar({});
			}}
		>
			+
		</div>
	);

	const getEventsInView = () => {
		if (!calendarComponentRef.current) {
			return [];
		}

		// Access the calendar object via the ref
		const calendar = calendarComponentRef.current.getApi();

		// Get the current view's start and end dates
		const view = calendar.view;
		const viewStartDate = new Date(view.activeStart.setHours(9)); // view.activeStart;
		const viewEndDate = view.activeEnd;

		// Get all events in the current view
		const eventsInView: EventApi[] = calendar.getEvents().filter((event) => {
			if (event.allDay || event._def?.allDay) {
				return false;
			}

			// Filter events based on their start and end dates
			const eventStartDate = event.start!;
			const eventEndDate = event.end! || event.start!; // Use start date as end date for single-day events
			return eventStartDate >= viewStartDate && eventEndDate <= viewEndDate;
		});

		return eventsInView;
	};

	const mostAvailableSlotOnView = (): { start: Date | null; end: Date | null } => {
		const MIN_START_HOUR = 8;
		if (!calendarComponentRef.current) {
			return {
				start: null,
				end: null,
			};
		}

		// Access the calendar object via the ref
		const calendar = calendarComponentRef.current!.getApi();
		const view = calendar.view;
		const viewStartDate = new Date(view.activeStart.setHours(MIN_START_HOUR)); // view.activeStart;
		const viewEndDate = view.activeEnd;
		const eventsInView = getEventsInView();

		// Sort events by their start time
		eventsInView.sort(function (a, b) {
			// @ts-ignore
			return a.start - b.start;
		});

		let mostAvailableSlotStart: Date = viewStartDate;
		let mostAvailableSlotEnd: Date = viewEndDate;
		let foundSlot = false;

		// Loop through events to find the most available slot
		for (let i = 0; i < eventsInView.length; i++) {
			const currentEvent = eventsInView[i];
			const nextEvent = eventsInView[i + 1];

			if (nextEvent) {
				// Calculate the gap between the current event's end and the next event's start
				const gapStart: Date =
					typeof currentEvent.end! == 'string' ? new Date(currentEvent.end!) : currentEvent.end!;
				let gapEnd: Date = typeof nextEvent.start! == 'string' ? new Date(nextEvent.start!) : nextEvent.start!;

				if (gapStart == null || gapEnd == null) {
					console.log('hereeeeee', {
						currentEvent,
						nextEvent,
					});
				}

				if (areDatesOnDifferentDays(gapStart, gapEnd)) {
					gapEnd = new Date(new Date(gapStart.toISOString()).setHours(23, 59));
				}

				// Update the most available slot if the current gap is larger
				// @ts-ignore
				if (
					!foundSlot ||
					gapEnd.getTime() - gapStart.getTime() >
						mostAvailableSlotEnd.getTime() - mostAvailableSlotStart.getTime()
				) {
					if (gapStart.getHours() > MIN_START_HOUR) {
						// console.log({
						// 	gapStart,
						// 	gapEnd,
						// 	gap: gapEnd.getTime() - gapStart.getTime(),
						// 	prevGap: mostAvailableSlotEnd.getTime() - mostAvailableSlotStart.getTime(),
						// });

						mostAvailableSlotStart = gapStart;
						mostAvailableSlotEnd = gapEnd;
						foundSlot = true;
					}
				}
			}
		}

		// alert('Most available slot start:' + mostAvailableSlotStart);
		// alert('Most available slot end:' + mostAvailableSlotEnd);

		// dates are currently in the client's timezone and we want them in utc.
		const offset = -1 * getOffsetInHours(false);
		const dtUTC = addHours(new Date(mostAvailableSlotStart), offset);
		const dtEndUTC = addHours(new Date(mostAvailableSlotEnd), offset);

		return {
			start: dtUTC,
			end: dtEndUTC,
		};
	};

	useEffect(() => {
		runInAction(() => {
			eventStore.mostAvailableSlotInView = mostAvailableSlotOnView();
		});
	}, [calendarComponentRef.current, eventStore.calendarEvents, getEventsInView()]);

	// if changed to timeGridAllDays, change start date
	const handleAllDaysViewSelect = () => {
		calendarComponentRef.current?.getApi().gotoDate(new Date(eventStore.customDateRange.start)); // Replace with the date you want to reset to
	};

	const handleViewChange = () => {
		setTimeout(() => {
			if (!calendarComponentRef.current) {
				return;
			}

			const calendarApi = calendarComponentRef.current.getApi();
			const view = calendarApi.view;
			let { activeStart: start, activeEnd: end, currentStart, currentEnd } = view;
			// const timezoneHours = new Date().getTimezoneOffset() / 60;
			// console.log({ timezoneHours });
			// end = addHours(end, timezoneHours);
			// currentEnd = addHours(currentEnd, timezoneHours);
			// start = addHours(start, timezoneHours);
			// currentStart = addHours(currentStart, timezoneHours);

			// alert('start is: ' + start + ' end is : ' + end);
			// alert('start is: ' + currentStart + ' end is : ' + currentEnd);

			if (view.type == 'timeGridAllDays') {
				handleAllDaysViewSelect();
			}

			runInAction(() => {
				end = addSeconds(end, -1); // cause the end is always the next day at 00:00
				// alert('here!' + end.toISOString());

				eventStore.activeStart = start;
				eventStore.activeEnd = end;
				eventStore.currentStart = currentStart;
				eventStore.currentEnd = currentEnd;
				eventStore.calendarViewType = view.type;
			});

			updateAllowSwitchDays(!eventStore.isMobile && view.type !== 'timeGridDay' && view.type !== 'dayGridMonth');
		}, 100);
	};

	useEffect(() => {
		const viewChangeClasses = [
			'fc-timeGridAllDays-button',
			'fc-timeGridThreeDay-button',
			'fc-dayGridMonth-button',
			'fc-timeGridWeek-button',
			'fc-timeGridDay-button',
			'fc-next-button',
			'fc-prev-button',
		];

		viewChangeClasses.forEach((clsName) => {
			document.getElementsByClassName(clsName)?.[0]?.addEventListener('click', handleViewChange);
		});

		return () => {
			viewChangeClasses.forEach((clsName) => {
				document.getElementsByClassName(clsName)?.[0]?.removeEventListener('click', handleViewChange);
			});
		};
	}, []);

	const updateAllowSwitchDays = (isEnabled: boolean) => {
		runInAction(() => {
			eventStore.isSwitchDaysEnabled = isEnabled;
		});
	};

	useEffect(() => {
		handleViewChange();
	}, [eventStore.customDateRange]);

	return (
		<div className="triplan-calendar-container">
			<div
				className="flex-col width-100-percents position-relative calendar-wrapper"
				key={eventStore.forceCalendarReRender}
			>
				{eventStore.isSwitchDaysEnabled && !eventStore.isTripLocked && <DraggableList />}
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
						timeGridAllDays: {
							type: 'timeGrid',
							duration: { days: eventStore.tripTotalDaysNum },
							buttonText: TranslateService.translate(eventStore, 'BUTTON_TEXT.ALL_DAYS'),
							visibleRange: eventStore.customDateRange,
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
					eventDurationEditable={!eventStore.isTripLocked}
					editable={!eventStore.isMobile && !eventStore.isTripLocked} // to prevent events from moving when scrolling
					droppable={!eventStore.isTripLocked}
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
					ref={calendarComponentRef}
					events={_events}
					eventReceive={onEventReceive}
					eventClick={onEventClick}
					eventChange={(changeInfo) => handleEventChange(changeInfo)}
					eventResizableFromStart={!eventStore.isMobile && !eventStore.isTripLocked}
					locale={eventStore.calendarLocalCode}
					direction={eventStore.getCurrentDirection()}
					buttonIcons={false} // show the prev/next text
					// weekNumbers={true}
					navLinks={true} // can click day/week names to navigate views
					dayMaxEvents={true} // allow "more" link when too many events
					selectable={!eventStore.isMobile && !eventStore.isTripLocked}
					select={onCalendarSelect}
					eventContent={renderEventContent}
					longPressDelay={5}
					validRange={{
						start: eventStore.customDateRange.start,
						// end: fullCalendarFormatDate(addDays(toDate(eventStore.customDateRange.end), 1)),
						end: addDays(toDate(eventStore.customDateRange.end), 0), // addDays(toDate(eventStore.customDateRange.end), 1),
					}}
					slotMinTime={'00:00'}
					scrollTimeReset={false} /* fix bug of calendar being scrolled up after each event change */
					dayHeaderFormat={{
						/* show weekday and date in a format of Sunday 14.3 for example - always - on all views */
						weekday: 'short',
						day: 'numeric',
						month: 'numeric',
					}}
					height="100%"
				/>
				{eventStore.isMobile && !eventStore.isTripLocked && renderAddEventMobileButton()}
			</div>
		</div>
	);
}

export default observer(forwardRef<TriPlanCalendarRef, TriPlanCalendarProps>(TriplanCalendar));
