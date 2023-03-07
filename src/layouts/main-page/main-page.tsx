// @ts-ignore
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getClasses, Loader, LOADER_DETAILS } from '../../utils/utils';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './main-page.scss';

import TriplanCalendar, { TriPlanCalendarRef } from '../../components/triplan-calendar/triplan-calendar';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import { defaultEventsToCategories } from '../../utils/defaults';
import { getViewSelectorOptions } from '../../utils/ui-utils';
import { useParams } from 'react-router-dom';
import TriplanSidebar from '../../components/triplan-sidebar/triplan-sidebar';
import MapContainer from '../../components/map-container/map-container';
import ListViewService from '../../services/list-view-service';
import DataServices, { LocaleCode } from '../../services/data-handlers/data-handler-base';
import { ListViewSummaryMode, TripDataSource, ViewMode } from '../../utils/enums';
import TranslateService from '../../services/translate-service';
import ToggleButton from '../../components/toggle-button/toggle-button';
import { CalendarEvent, SidebarEvent } from '../../utils/interfaces';
import LoadingComponent from '../../components/loading/loading-component';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import CustomDatesSelector from '../../components/triplan-sidebar/custom-dates-selector/custom-dates-selector';

interface MainPageProps {
	createMode?: boolean;
}

function MainPage(props: MainPageProps) {
	const { createMode } = props;
	const [eventsToCategories, setEventsToCategories] = useState<Record<string, string>>(defaultEventsToCategories);
	const TriplanCalendarRef = useRef<any>(null);
	const TriplanCalendarContainerRef = useRef<HTMLDivElement>(null);
	const eventStore = useContext(eventStoreContext);
	const { tripName = eventStore.tripName, locale = eventStore.calendarLocalCode } = useParams();
	const [loaderDetails, setLoaderDetails] = useState<Loader>(LOADER_DETAILS());

	const [isFetchingData, setIsFetchingData] = useState(false);
	const [defaultCalendarEvents, setDefaultCalendarEvents] = useState<CalendarEvent[]>([]);

	useHandleWindowResize();

	useEffect(() => {
		if (TriplanCalendarRef && TriplanCalendarRef.current) {
			TriplanCalendarRef.current.switchToCustomView();
		}
	}, [TriplanCalendarRef, eventStore.customDateRange]);

	// handle mobile view mode changes
	useEffect(() => {
		if (eventStore.mobileViewMode !== ViewMode.sidebar) {
			eventStore.setViewMode(eventStore.mobileViewMode as ViewMode);
		}
		DataServices.LocalStorageService.setLastViewMode(eventStore.mobileViewMode);
	}, [eventStore.mobileViewMode]);

	const fetchCalendarEvents = useCallback(async () => {
		const data = await eventStore.dataService.getCalendarEvents(tripName);
		setDefaultCalendarEvents(data);
	}, [tripName]);

	useEffect(() => {
		setIsFetchingData(true);
		fetchCalendarEvents();
		setIsFetchingData(false);
	}, [fetchCalendarEvents]);

	useEffect(() => {
		eventStore.setTripName(tripName, locale as LocaleCode, createMode);

		// must put it here, otherwise dates are incorrect
		if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
			eventStore.setCustomDateRange(DataServices.LocalStorageService.getDateRange(tripName));
		}
	}, [tripName, locale]);

	useEffect(() => {
		// update idtoevent, idtocategory and allevents array
		const arr = [...eventStore.allEvents];
		const idToEvent: Record<string, SidebarEvent> = {};
		const idToCategory: Record<string, number> = {};

		const sidebarEvents: Record<number, SidebarEvent[]> = eventStore.getSidebarEvents;

		Object.keys(sidebarEvents).map((category: string) => {
			const categoryId = Number(category);
			const categoryEvents: SidebarEvent[] = sidebarEvents[categoryId];
			categoryEvents.forEach((event) => {
				if (event.priority) {
					event.className = `priority-${event.priority}`;
				}
				const eventId: string = event.id;
				idToEvent[eventId] = event;
				idToCategory[eventId] = categoryId;
			});
		});

		const existingIds = eventStore.allEvents.map((e) => e.id.toString());
		Object.keys(idToEvent).forEach((eventId) => {
			if (existingIds.indexOf(eventId) === -1) {
				arr.push({ ...idToEvent[eventId], category: idToCategory[eventId].toString() });
			}
		});

		setTimeout(() => {
			eventStore.setAllEvents(arr);
		}, 500);
	}, [eventStore.sidebarEvents]);

	function addEventToSidebar(event: any): boolean {
		const newEvents: Record<string, SidebarEvent[]> = { ...eventStore.sidebarEvents };
		let category = eventsToCategories[event.id];
		if (!category) {
			const findEvent = eventStore.allEvents.find((x) => x.id.toString() === event.id.toString());
			if (findEvent) {
				category = findEvent.category;
				if (!category && findEvent && findEvent.extendedProps) {
					category = findEvent.extendedProps.categoryId;
				}
			}
		}

		if (category != undefined) {
			delete event.start;
			delete event.end;

			if (event.extendedProps) {
				event.preferredTime = event.extendedProps.preferredTime;
			}

			newEvents[category] = newEvents[category] || [];
			newEvents[category].push(event);
			eventStore.setSidebarEvents(newEvents);
			return true;
		} else {
			return false;
		}
	}

	function removeEventFromSidebarById(eventId: number | string) {
		const newEvents: Record<number, SidebarEvent[]> = { ...eventStore.sidebarEvents };
		const newEventsToCategories = { ...eventsToCategories };
		Object.keys(newEvents).forEach((category) => {
			const categoryId = Number(category);
			newEvents[categoryId] = newEvents[categoryId].filter((event) => event.id !== eventId);
			if (newEvents[categoryId].length !== eventStore.sidebarEvents[categoryId].length) {
				newEventsToCategories[eventId] = category;
			}
		});
		const newCalendarEvents: CalendarEvent[] = [
			...eventStore.calendarEvents.filter(
				(calendarEvent) => calendarEvent?.id?.toString() !== eventId.toString()
			),
			eventStore.allEvents.find((e) => e.id.toString() === eventId.toString()),
		] as CalendarEvent[];
		eventStore.setCalendarEvents(newCalendarEvents);
		setEventsToCategories(newEventsToCategories);
		setTimeout(() => {
			eventStore.setSidebarEvents(newEvents);
		}, 500);
	}

	function renderListView() {
		if (eventStore.isMobile && eventStore.mobileViewMode !== ViewMode.list) return null;

		const options = [
			// {
			// 	key: ListViewSummaryMode.box,
			// 	name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.BOX'),
			// 	// icon: (<i className="fa fa-map-o black-color" aria-hidden="true" />),
			// 	// iconActive: (<i className="fa fa-list blue-color" aria-hidden="true" />)
			// },
			{
				key: ListViewSummaryMode.noDescriptions,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.NO_DESCRIPTIONS'),
				// icon: (<i className="fa fa-calendar black-color" aria-hidden="true" />),
				// iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true" />)
			},
			{
				key: ListViewSummaryMode.full,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.FULL'),
				// icon: (<i className="fa fa-calendar black-color" aria-hidden="true" />),
				// iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true" />)
			},
		];

		const onChange = (newVal: string) => eventStore.setListViewSummaryMode(newVal);

		return (
			<div
				className={getClasses(
					['list-container flex-1-1-0'],
					!eventStore.isListView && 'opacity-0 position-absolute'
				)}
			>
				<div className="list-view-mode-selector" key={`list-view-summary-mode-${eventStore.calendarLocalCode}`}>
					<ToggleButton
						value={eventStore.listViewSummaryMode}
						onChange={onChange}
						options={options}
						customStyle="white"
					/>
				</div>
				<div
					className={'trip-summary bright-scrollbar padding-top-60'}
					dangerouslySetInnerHTML={{
						__html: eventStore.isListView ? ListViewService.buildHTMLSummary(eventStore) : '',
					}}
				/>
			</div>
		);
	}

	function renderMapView() {
		if (eventStore.isMobile && eventStore.mobileViewMode !== ViewMode.map) {
			return null;
		}

		if (eventStore.viewMode === ViewMode.combined) {
			return (
				<div
					className={getClasses(
						['map-container'],
						!eventStore.isCombinedView && 'opacity-0 position-absolute'
					)}
					style={{
						height: '250px',
						minHeight: '250px',
						resize: 'vertical',
						overflow: 'auto',
					}}
					key={JSON.stringify(eventStore.allEvents)}
				>
					<MapContainer isCombined />
				</div>
			);
		}

		return (
			<div
				className={getClasses(
					['map-container flex-1-1-0'],
					!eventStore.isMapView && 'opacity-0 position-absolute'
				)}
				style={{
					height: 'CALC(100vh - 120px)',
					minHeight: '250px',
					resize: 'vertical',
					overflow: 'auto',
				}}
				key={JSON.stringify(eventStore.allEvents)}
			>
				<MapContainer />
			</div>
		);
	}

	function renderCombinedView() {
		return (
			<div className="content-container width-100-percents flex-col gap-20">
				{renderMapView()}
				{renderCalendarView()}
			</div>
		);
	}

	function addToEventsToCategories(newEvent: any) {
		setEventsToCategories({
			...eventsToCategories,
			[newEvent.id]: newEvent.extendedProps.categoryId,
		});
	}

	function renderCalendarView() {
		if (eventStore.isMobile && eventStore.mobileViewMode !== ViewMode.calendar) return null;

		const renderCustomDates = () => {
			if (!TriplanCalendarRef) return;
			return (
				<CustomDatesSelector
					TriplanCalendarRef={TriplanCalendarRef}
					customDateRange={eventStore.customDateRange}
					setCustomDateRange={(val) => eventStore.setCustomDateRange(val)}
				/>
			);
		};

		const shouldDisplay = eventStore.isCalendarView || eventStore.isCombinedView;

		const content = (
			<div
				className={getClasses(
					['calender-container bright-scrollbar flex-1-1-0'],
					!shouldDisplay && 'opacity-0 position-absolute'
				)}
				ref={TriplanCalendarContainerRef}
			>
				<TriplanCalendar
					ref={TriplanCalendarRef}
					defaultCalendarEvents={defaultCalendarEvents}
					onEventReceive={removeEventFromSidebarById}
					allEvents={eventStore.allEvents}
					addEventToSidebar={addEventToSidebar}
					// updateAllEventsEvent={updateAllEventsEvent}
					customDateRange={eventStore.customDateRange}
					categories={eventStore.categories}
					addToEventsToCategories={addToEventsToCategories}
				/>
			</div>
		);

		// mobile
		if (eventStore.isMobile) {
			return (
				<div className="main-page-calendar-view flex-column gap-20 flex-1-1-0 width-100-percents">
					{renderCustomDates()}
					{content}
				</div>
			);
		}

		// pc
		return content;
	}

	function renderSidebar() {
		if (eventStore.isMobile && eventStore.mobileViewMode !== ViewMode.sidebar) return null;
		return (
			<TriplanSidebar
				addToEventsToCategories={addToEventsToCategories}
				removeEventFromSidebarById={removeEventFromSidebarById}
				customDateRange={eventStore.customDateRange}
				setCustomDateRange={() => {
					eventStore.setCustomDateRange.bind(eventStore);

					if (eventStore.isMobile) {
						TriplanCalendarContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
						TriplanCalendarRef.current?.setMobileDefaultView();
					}
				}}
				TriplanCalendarRef={TriplanCalendarRef}
			/>
		);
	}

	function renderLoading() {
		return (
			<LoadingComponent
				title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
				message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
				loaderDetails={loaderDetails}
			/>
		);
	}

	function renderMobileFooterNavigator() {
		const viewOptions = getViewSelectorOptions(eventStore, true);
		const isModalOpened = eventStore.modalSettings.show || eventStore.secondModalSettings.show;
		return (
			<div className={getClasses('mobile-footer-navigator', isModalOpened && 'z-index-1000')}>
				{viewOptions.map((viewOption) => (
					<a title={viewOption.name} onClick={() => eventStore.setMobileViewMode(viewOption.key as ViewMode)}>
						{eventStore.mobileViewMode === viewOption.key ? viewOption.iconActive : viewOption.icon}
						<span
							title={viewOption.name}
							className={getClasses(eventStore.mobileViewMode === viewOption.key && 'selected-color')}
						>
							{viewOption.name}
						</span>
					</a>
				))}
			</div>
		);
	}

	const headerProps = {
		withLogo: true,
		withSearch: true,
		withViewSelector: !eventStore.isMobile, // in mobile we will render view selector in the footer.
		withRecommended: false,
		withLoginLogout: true,
		withFilterTags: true,
		withMyTrips: true,
	};

	return (
		<div className="main-page" key={JSON.stringify(eventStore.customDateRange)}>
			<div className="padding-inline-8 flex-column align-items-center justify-content-center">
				<TriplanHeaderWrapper
					{...headerProps}
					currentMobileView={eventStore.mobileViewMode}
					showTripName={true}
				/>
			</div>
			<div className={'main-layout-container'}>
				<div className={getClasses('main-layout', eventStore.getCurrentDirection())}>
					{eventStore.isLoading || isFetchingData || !eventStore.tripName?.length ? (
						renderLoading()
					) : (
						<>
							{renderSidebar()}
							{eventStore.isMapView && renderMapView()}
							{eventStore.isListView && renderListView()}
							{eventStore.isCalendarView && renderCalendarView()}
							{eventStore.isCombinedView && renderCombinedView()}
						</>
					)}
				</div>
			</div>
			{eventStore.isMobile && renderMobileFooterNavigator()}
		</div>
	);
}

export default observer(MainPage);
