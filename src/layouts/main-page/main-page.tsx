// @ts-ignore
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { generate_uuidv4, getClasses, isHotelsCategory, Loader, LOADER_DETAILS } from '../../utils/utils';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './main-page.scss';

import TriplanCalendar from '../../components/triplan-calendar/triplan-calendar';
import { eventStoreContext } from '../../stores/events-store';
import { Observer, observer } from 'mobx-react';
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
import _ from 'lodash';
import { runInAction } from 'mobx';
import { getWebSocketsServerAddress } from '../../config/config';
import { getUserId } from '../../helpers/auth';
import Toast from '../../components/react-toastr/react-toastr';
import axios from 'axios';
import { BiEventsService } from '../../services/bi-events.service';
import Button, { ButtonFlavor } from '../../components/common/button/button';
import { formatDate } from '../../utils/time-utils';

interface MainPageProps {
	createMode?: boolean;
}

function MainPage(props: MainPageProps) {
	const { createMode } = props;
	const [eventsToCategories, setEventsToCategories] = useState<Record<string, string>>(defaultEventsToCategories);
	const TriplanCalendarRef = useRef<any>(null);
	const MapContainerRef = useRef<any>(null);
	const TriplanCalendarContainerRef = useRef<HTMLDivElement>(null);
	const eventStore = useContext(eventStoreContext);
	const { tripName = eventStore.tripName, locale = eventStore.calendarLocalCode } = useParams();
	const [loaderDetails, setLoaderDetails] = useState<Loader>(LOADER_DETAILS());

	const [isFetchingData, setIsFetchingData] = useState(false);
	const [defaultCalendarEvents, setDefaultCalendarEvents] = useState<CalendarEvent[]>([]);

	// list view on mobile
	const todayIndex = eventStore.tripDaysArray.indexOf(formatDate(new Date()));
	const [currentListViewPage, setCurrentListViewPage] = useState(Math.max(todayIndex, 0));

	useHandleWindowResize();

	useEffect(() => {
		setCurrentListViewPage(Math.max(todayIndex, 0));
	}, [todayIndex]);

	// sockets - listen to server updates and update the data on all tabs.
	useEffect(() => {
		// Creating client id
		const client_id = generate_uuidv4();

		// Connect to the WebSocket server
		const url = `${getWebSocketsServerAddress()}?uid=${getUserId()}&cid=${client_id}&tid=${eventStore.tripId}`;
		console.log({ webSocketsUrl: url });
		const socket = new WebSocket(url);

		// keep a uuid of this client, to be able to know for each change we made if we're the ones that did it or not.
		axios.defaults.headers['cid'] = client_id;

		// Listen for messages from the server
		socket.addEventListener('message', (event: MessageEvent) => {
			// Parse the received data
			const data = JSON.parse(event.data);

			const tripData = JSON.parse(data.message);
			if (eventStore.tripName == tripData.name) {
				console.log('new message', tripData);

				setTimeout(() => {
					runInAction(() => {
						eventStore.reloadHistoryCounter += 1;
						// console.log('hereee');
					});
				}, 2000);

				const { initiatedByClientId } = data;
				const isItMe = initiatedByClientId == axios.defaults.headers['cid'];
				const toastrKey = isItMe ? 'SAVED_SUCCESSFULLY' : 'UPDATED_ON_SERVER';
				const toastrIcon = isItMe ? 'icons8-done.gif' : 'icons8-error.gif';
				const toastrDuration = isItMe ? 1500 : 5000;

				eventStore.showToastr(TranslateService.translate(eventStore, toastrKey), toastrIcon, toastrDuration);

				eventStore.updateTripData(tripData);

				if (eventStore.isMobile) {
					TriplanCalendarRef.current?.setMobileDefaultView();
				}
			}
		});

		// Close the WebSocket connection when the component unmounts
		return () => {
			socket.close();
		};
	}, [eventStore.tripId]);

	useEffect(() => {
		if (TriplanCalendarRef && TriplanCalendarRef.current) {
			TriplanCalendarRef.current.switchToCustomView();
		}
	}, [TriplanCalendarRef, eventStore.customDateRange]);

	// handle mobile view mode changes
	useEffect(() => {
		if (eventStore.isMobile) {
			if (eventStore.mobileViewMode !== ViewMode.sidebar) {
				eventStore.setViewMode(eventStore.mobileViewMode as ViewMode);
			}
			DataServices.LocalStorageService.setLastMobileViewMode(eventStore.mobileViewMode);
		}
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
		if (eventStore.mapContainerRef == null && MapContainerRef.current) {
			runInAction(() => {
				eventStore.mapContainerRef = MapContainerRef;
				// alert('here!');
			});
		}
	}, [MapContainerRef.current, eventStore.viewMode]);

	useEffect(() => {
		eventStore.setTripName(tripName, locale as LocaleCode, createMode);

		// must put it here, otherwise dates are incorrect
		if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
			eventStore.setCustomDateRange(DataServices.LocalStorageService.getDateRange(tripName));
		}
	}, [tripName, locale]);

	// todo: see if it's possible to achieve it with sockets, it could be performance issue
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (eventStore.isSharedTrip) {
			console.log('started shared trip interval');
			interval = setInterval(() => eventStore.verifyUserHavePermissionsOnTrip(tripName, createMode), 5000);
		}

		return () => {
			if (interval) {
				console.log('stopped shared trip interval');
				clearInterval(interval);
			}
		};
	}, [eventStore.isSharedTrip]);

	// ERROR HANDLING: todo add try/catch & show a message if fails
	function addEventToSidebar(event: any): boolean {
		const newEvents: Record<string, SidebarEvent[]> = _.cloneDeep(eventStore.sidebarEvents);

		let categoryObject = eventStore.categories.find((c) => c.id === event.category);
		if (!categoryObject) {
			const findEvent = eventStore.allEventsComputed.find((x) => x.id!.toString() === event.id.toString());
			if (findEvent) {
				categoryObject = eventStore.categories.find((c) => c.id.toString() === findEvent.category.toString());
			}
		}

		if (categoryObject != undefined) {
			const category = categoryObject.id.toString();

			if (isHotelsCategory(categoryObject)) {
				if (eventStore.allSidebarEvents.find((x) => x.title === event.title)) {
					// no need to update.
					return true;
				}
			}

			delete event.start;
			delete event.end;
			newEvents[category] = newEvents[category] || [];
			newEvents[category].push(event);
			eventStore.setSidebarEvents(newEvents);
			return true;
		} else {
			return false;
		}
	}

	// ERROR HANDLING: todo add try/catch & show a message if fails
	async function removeEventFromSidebarById(eventId: number | string): Promise<Record<number, SidebarEvent[]>> {
		const newEvents: Record<number, SidebarEvent[]> = { ...eventStore.sidebarEvents };
		const newEventsToCategories = { ...eventsToCategories };
		Object.keys(newEvents).forEach((category) => {
			const categoryId = Number(category);
			newEvents[categoryId] = newEvents[categoryId].filter((event) => event.id !== eventId);
			if (newEvents[categoryId].length !== eventStore.sidebarEvents[categoryId].length) {
				newEventsToCategories[eventId] = category;
			}
		});

		setEventsToCategories(newEventsToCategories);

		await eventStore.setSidebarEvents(newEvents);

		return newEvents;
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
				key: ListViewSummaryMode.full,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.FULL'),
				// icon: (<i className="fa fa-calendar black-color" aria-hidden="true" />),
				// iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true" />)
			},
			{
				key: ListViewSummaryMode.noDescriptions,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW_SUMMARY_MODE.NO_DESCRIPTIONS'),
				// icon: (<i className="fa fa-calendar black-color" aria-hidden="true" />),
				// iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true" />)
			},
		];

		const onChange = (newVal: string) => eventStore.setListViewSummaryMode(newVal);

		let content = null;
		const paddingClass = eventStore.isMobile ? 'padding-top-70' : 'padding-top-60';
		if (eventStore.isMobile && eventStore.listViewShowDaysNavigator) {
			const arr = ListViewService.buildHTMLSummary(eventStore, true);

			const backIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-right' : 'fa-chevron-left';
			const nextIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-left' : 'fa-chevron-right';

			let navigation: React.ReactNode | null = (
				<div className="flex-row buttons-group align-items-center justify-content-center position-relative margin-top-5 margin-bottom-2">
					<Button
						flavor={ButtonFlavor.secondary}
						onClick={() => {
							if (currentListViewPage - 1 >= 0) {
								setCurrentListViewPage(currentListViewPage - 1);
							}
						}}
						disabled={currentListViewPage <= 0}
						text={TranslateService.translate(eventStore, 'NAVIGATION.BACK')}
						icon={backIcon}
						className={'black flex-row gap-5 align-items-center justify-content-center'}
					/>
					<Button
						flavor={ButtonFlavor.secondary}
						onClick={() => {
							if (currentListViewPage + 1 <= arr.length - 1) {
								setCurrentListViewPage(currentListViewPage + 1);
							}
						}}
						disabled={currentListViewPage >= arr.length - 1}
						text={TranslateService.translate(eventStore, 'NAVIGATION.NEXT')}
						icon={nextIcon}
						className={'black flex-row gap-5 align-items-center justify-content-center'}
						iconPosition={'end'}
					/>
				</div>
			);

			if (arr.length <= 1) {
				navigation = null;
			}

			content = (
				<div className={getClasses('trip-summary bright-scrollbar', paddingClass)}>
					<div className="flex-col gap-5">
						{navigation}
						<div dangerouslySetInnerHTML={{ __html: arr[currentListViewPage] }} />
						{arr[currentListViewPage]?.length > 0 ? navigation : null}
					</div>
				</div>
			);
		} else {
			content = (
				<div
					className={getClasses('trip-summary bright-scrollbar', paddingClass)}
					dangerouslySetInnerHTML={{
						__html: eventStore.isListView ? (ListViewService.buildHTMLSummary(eventStore) as string) : '',
					}}
				/>
			);
		}

		return (
			<div
				className={getClasses(
					['list-container flex-1-1-0'],
					!eventStore.isListView && 'opacity-0 position-absolute',
					!eventStore.isMobile && 'pc'
				)}
			>
				<div className="list-view-mode-selector" key={`list-view-summary-mode-${eventStore.calendarLocalCode}`}>
					<ToggleButton
						value={eventStore.listViewSummaryMode}
						onChange={onChange}
						options={options}
						customStyle="white"
					/>
					{eventStore.isMobile && (
						<Button
							icon="fa-list-ol"
							className={getClasses('min-width-38', !eventStore.listViewShowDaysNavigator && 'black')}
							flavor={ButtonFlavor.secondary}
							tooltip={TranslateService.translate(
								eventStore,
								eventStore.listViewShowDaysNavigator ? 'SHOW_DAYS_NAVIGATOR' : 'HIDE_DAYS_NAVIGATOR'
							)}
							onClick={() => {
								runInAction(() => {
									eventStore.listViewShowDaysNavigator = !eventStore.listViewShowDaysNavigator;
								});
							}}
							text={''}
						/>
					)}
					<Button
						icon="fa-paper-plane"
						className={getClasses('min-width-38', !eventStore.listViewShowNavigateTo && 'black')}
						flavor={ButtonFlavor.secondary}
						tooltip={TranslateService.translate(
							eventStore,
							eventStore.listViewShowNavigateTo ? 'SHOW_NAVIGATE_TO' : 'HIDE_NAVIGATE_TO'
						)}
						onClick={() => {
							runInAction(() => {
								eventStore.listViewShowNavigateTo = !eventStore.listViewShowNavigateTo;
							});
						}}
						text={''}
					/>

					{/*{eventStore.isMobile && (*/}
					{/*	<label className="list-view-checkbox-options">*/}
					{/*		<input*/}
					{/*			type="checkbox"*/}
					{/*			checked={eventStore.listViewShowDaysNavigator}*/}
					{/*			onChange={(e) => {*/}
					{/*				runInAction(() => {*/}
					{/*					eventStore.listViewShowDaysNavigator = e.target.checked;*/}
					{/*				});*/}
					{/*			}}*/}
					{/*		/>*/}
					{/*		{TranslateService.translate(eventStore, 'SHOW_DAYS_NAVIGATOR')}*/}
					{/*	</label>*/}
					{/*)}*/}

					{/*<label className="list-view-checkbox-options">*/}
					{/*	<input*/}
					{/*		type="checkbox"*/}
					{/*		checked={eventStore.listViewShowNavigateTo}*/}
					{/*		onChange={(e) => {*/}
					{/*			runInAction(() => {*/}
					{/*				eventStore.listViewShowNavigateTo = e.target.checked;*/}
					{/*			});*/}
					{/*		}}*/}
					{/*	/>*/}
					{/*	{TranslateService.translate(eventStore, 'SHOW_NAVIGATE_TO')}*/}
					{/*</label>*/}
				</div>
				{content}
			</div>
		);
	}

	function reportMapRenderedEvent() {
		BiEventsService.reportEvent('google_map:rendered', `${eventStore.viewMode}-view`, eventStore.isMobile);
	}

	function renderMapView(shouldShow: boolean = true) {
		if (eventStore.isMobile && eventStore.mobileViewMode !== ViewMode.map) {
			shouldShow = false;
		}

		if (!eventStore.isMobile && eventStore.viewMode === ViewMode.combined) {
			reportMapRenderedEvent();
			return (
				<div
					className={getClasses(
						['map-container'],
						!eventStore.isCombinedView && 'opacity-0 position-absolute',
						!shouldShow && 'display-none'
					)}
					style={{
						height: '310px',
						minHeight: '310px',
						resize: 'vertical',
						overflow: 'auto',
					}}
					key={`combined-${JSON.stringify(eventStore.allEventsFilteredComputed)}`}
				>
					<MapContainer ref={MapContainerRef} isCombined addToEventsToCategories={addToEventsToCategories} />
				</div>
			);
		}

		reportMapRenderedEvent();

		return (
			<div
				className={getClasses(
					['map-container flex-1-1-0'],
					!eventStore.isMapView && 'opacity-0 position-absolute',
					!shouldShow && 'display-none'
				)}
				style={{
					height: 'CALC(100vh - 180px)',
					minHeight: '260px',
					resize: 'vertical',
					overflow: 'auto',
				}}
				key={JSON.stringify(eventStore.allEventsFilteredComputed)}
			>
				<Observer>
					{() => <MapContainer ref={MapContainerRef} addToEventsToCategories={addToEventsToCategories} />}
				</Observer>
			</div>
		);
	}

	function renderCombinedView() {
		return (
			<div className="combined-container width-100-percents flex-col gap-20">
				{renderMapView()}
				{renderCalendarView()}
			</div>
		);
	}

	function addToEventsToCategories(newEvent: any) {
		setEventsToCategories({
			...eventsToCategories,
			[newEvent.id]: newEvent.category,
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
					!shouldDisplay && 'opacity-0 position-absolute',
					!eventStore.isMobile && 'pc'
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
				addEventToSidebar={addEventToSidebar}
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

	function renderTripIsLockedHeaderLine() {
		if (eventStore.isMobile && eventStore.isListView) {
			return null;
		}

		let text = eventStore.isMobile
			? TranslateService.translate(eventStore, 'NOTE.TRIP_IS_LOCKED.SHORT')
			: TranslateService.translate(eventStore, 'NOTE.TRIP_IS_LOCKED');

		const linkText = eventStore.isMobile
			? TranslateService.translate(eventStore, 'NOTE.TRIP_IS_LOCKED.SHORT.LINK')
			: TranslateService.translate(eventStore, 'GENERAL.CLICK_HERE');

		if (!eventStore.canWrite) {
			text = eventStore.isMobile
				? TranslateService.translate(eventStore, 'NOTE.SHARED_TRIP_IS_LOCKED.SHORT')
				: TranslateService.translate(eventStore, 'NOTE.SHARED_TRIP_IS_LOCKED');
		}

		return (
			<div
				className={getClasses(
					'trip-is-locked-header gap-8',
					eventStore.calendarLocalCode == 'he' ? 'direction-rtl' : 'flex-row'
				)}
			>
				<i className={'fa fa-lock'} />
				<div
					className={getClasses(
						'align-items-center justify-content-center',
						eventStore.isMobile ? 'flex-col' : 'flex-row'
					)}
				>
					{text}
					{eventStore.canWrite && (
						<Button
							flavor={ButtonFlavor.link}
							className={'text-decoration-underline min-height-20'}
							onClick={() => {
								eventStore.toggleTripLocked();
							}}
							text={linkText}
						/>
					)}
				</div>
			</div>
		);
	}

	return (
		<>
			<div
				className={getClasses('main-page', eventStore.mobileViewMode)}
				key={JSON.stringify(eventStore.customDateRange)}
			>
				<div className="padding-inline-8 flex-column align-items-center justify-content-center">
					<TriplanHeaderWrapper
						{...headerProps}
						currentMobileView={eventStore.mobileViewMode}
						showTripName={true}
					/>
				</div>
				{eventStore.isTripLocked && renderTripIsLockedHeaderLine()}
				<div
					className={getClasses(
						'main-layout-container',
						eventStore.isMobile ? eventStore.mobileViewMode : eventStore.viewMode
					)}
				>
					<div className={getClasses('main-layout', eventStore.getCurrentDirection())}>
						{eventStore.isLoading || isFetchingData || !eventStore.tripName?.length ? (
							renderLoading()
						) : (
							<>
								{renderSidebar()}
								{eventStore.isMapView && renderMapView(eventStore.isMapView)}
								{eventStore.isListView && renderListView()}
								{eventStore.isCalendarView && renderCalendarView()}
								{eventStore.isCombinedView && renderCombinedView()}
							</>
						)}
					</div>
				</div>
				{eventStore.isMobile && renderMobileFooterNavigator()}
			</div>
			<Toast {...eventStore.toastrSettings} />
		</>
	);
}

export default observer(MainPage);
