import TranslateService from '../../../services/translate-service';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { EventStore, eventStoreContext } from '../../../stores/events-store';
import DataServices, { Trip, tripNameToLSTripName } from '../../../services/data-handlers/data-handler-base';
import {
	addDays,
	formatShortDateStringIsrael,
	getAmountOfDays,
	getUserDateFormat,
	validateDateRange,
} from '../../../utils/time-utils';
import {
	getClasses,
	getEventDescription,
	getEventTitle,
	isTemplateUsername,
	LOADER_DETAILS,
} from '../../../utils/utils';
import { useNavigate } from 'react-router-dom';
import PointOfInterest from '../../components/point-of-interest/point-of-interest';
import { myTripsContext } from '../../stores/my-trips-store';
import LoadingComponent from '../../../components/loading/loading-component';
import ReactModalService from '../../../services/react-modal-service';
import LogHistoryService from '../../../services/data-handlers/log-history-service';
import { CalendarEvent, SidebarEvent, TripActions, TriPlanCategory } from '../../../utils/interfaces';
import './my-trips-tab.scss';
import moment from 'moment';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import {
	defaultCalendarEvents,
	defaultDateRange,
	defaultEvents,
	formatDateString,
	getDefaultCategories,
} from '../../../utils/defaults';
import { TripDataSource, TriplanEventPreferredTime, TriplanPriority } from '../../../utils/enums';
import { DEFAULT_VIEW_MODE_FOR_NEW_TRIPS } from '../../../utils/consts';
import { upsertTripProps } from '../../../services/data-handlers/db-service';
import { observer } from 'mobx-react';
import DestinationSelector from '../../components/destination-selector/destination-selector';
import { getParameterFromHash } from '../../utils/utils';
import { feedStoreContext } from '../../stores/feed-view-store';
import { myTripsTabId, newDesignRootPath } from '../../utils/consts';
import MainPage from '../../../pages/main-page/main-page';
import { tripTemplatesContext } from '../../stores/templates-store';

interface FlightDetails {
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
	sourceAirport: string;
	targetAirport: string;
	flightNumber: string;
}

interface HotelDetails {
	name: string;
	startDate: string;
	endDate: string;
}

function MyTripsTab() {
	const eventStore = useContext(eventStoreContext);
	const myTripsStore = useContext(myTripsContext);
	const feedStore = useContext(feedStoreContext);
	const templatesStore = useContext(tripTemplatesContext);
	const navigate = useNavigate();

	const [addNewTripMode, setAddNewTripMode] = useState(window.location.hash.includes('createTrip'));
	const savedCollectionId = window.location.hash.includes('createTrip') ? getParameterFromHash('id') : undefined;
	const savedCollection = savedCollectionId
		? feedStore.savedCollections.find((c) => c.id == savedCollectionId)
		: undefined;

	const templateId = window.location.hash.includes('createTrip') ? getParameterFromHash('tid') : undefined;
	const [template, setTemplate] = useState(
		templateId ? templatesStore.tripTemplates.find((t) => t.id == templateId) : undefined
	);

	const [planTripMode, setPlanTripMode] = useState(window.location.hash.includes('planTrip'));
	const [planTripName, setPlanTripName] = useState(undefined);

	const [errors, setErrors] = useState<Record<string, boolean>>({});
	useHandleWindowResize();
	const [customDateRange, setCustomDateRange] = useState(defaultDateRange());

	const [tripName, setTripName] = useState<string>('');
	const [selectedDestinations, setSelectedDestinations] = useState([]);
	const [flights, setFlights] = useState<FlightDetails[]>([]);
	const [hotels, setHotels] = useState<HotelDetails[]>([]);
	const [activities, setActivities] = useState<string>('');
	const [isProcessingActivities, setIsProcessingActivities] = useState(false);

	useEffect(() => {
		if (savedCollection?.destination) {
			setTripName(
				TranslateService.translate(eventStore, 'MY_TRIP_TO_X', {
					X: TranslateService.translate(eventStore, savedCollection.destination),
				})
			);
			setSelectedDestinations([savedCollection.destination]);
		}
	}, [savedCollection]);

	useEffect(() => {
		if (templatesStore.tripTemplates.length == 0) {
			templatesStore.loadTemplates().then(() => {
				setTemplate(templateId ? templatesStore.tripTemplates.find((t) => t.id == templateId) : undefined);
			});
		}
	}, []);

	useEffect(() => {
		if (template) {
			// @ts-ignore
			setTripName(
				getEventTitle(
					{
						title: template.name,
					},
					eventStore,
					true
				)
			);

			setSelectedDestinations(template.destinations);

			const dateDiff = daysBetween(new Date(template.dateRange.start), new Date(template.dateRange.end), false);
			const dateRange = {
				start: formatDateString(addDays(new Date(), 7)),
				end: formatDateString(addDays(new Date(), 7 + dateDiff)),
			};
			setCustomDateRange(dateRange);
		}
	}, [template]);

	useEffect(() => {
		document.querySelector('body').classList.remove('rtl');
		document.querySelector('body').classList.remove('ltr');
		document.querySelector('body').classList.add(eventStore.getCurrentDirection());
		eventStore.dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	async function onEditTripSave(tripId: number, tripName: string, newName: string) {
		let isOk = true;

		const oldName = tripName; // if name was changed
		if (oldName !== newName) {
			// validate title not already exist
			if (
				myTripsStore.allTripsSorted.find(
					(t) => t.name.replaceAll('-', ' ') === newName.replaceAll('-', ' ') && t.id != tripId
				)
			) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.TRIP_NAME_ALREADY_EXIST',
					'error'
				);
				isOk = false;
				return;
			}
		}

		if (isOk) {
			await eventStore.dataService.setTripName(tripName, newName);
			// DataServices.LocalStorageService.setTripName(tripName, newName)

			ReactModalService.internal.closeModal(eventStore);

			LogHistoryService.logHistory(
				eventStore,
				TripActions.updatedTrip,
				{
					tripName: {
						was: oldName,
						now: newName,
					},
				},
				undefined,
				undefined,
				tripId
			);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.UPDATED.TITLE',
				'MODALS.UPDATED_TRIP.CONTENT',
				'success'
			);

			setTimeout(() => {
				myTripsStore.toggleEditTrip(tripId);
				myTripsStore.loadMyTrips(false);
				// window.location.reload();
			}, 2000);
		}
	}

	function renderTrip(trip: Trip) {
		const classList = getClasses('align-items-center', eventStore.isHebrew ? 'flex-row-reverse' : 'flex-row');

		const itemsWithImages = [...trip.calendarEvents, ...trip.allEvents]
			.filter((i) => i?.images?.length)
			.filter((i) => {
				const images = Array.isArray(i.images) ? i.images : i.images.split(',');
				return !images[0].includes('googleapis');
			});

		const images: string[] = itemsWithImages.map((i) =>
			Array.isArray(i.images) ? i.images[0] : i.images.split(',')[0].split('\n')[0]
		);
		const idxToDetails = {};
		itemsWithImages?.forEach((i, idx) => (idxToDetails[idx] = i));

		if (images.length == 0) {
			images.push('/images/trip-photo-1.jpg');
		}

		const isSharedTrip = myTripsStore.mySharedTrips.find((s) => s.id == trip.id);

		const numOfDestinations = trip.destinations?.length ?? 0;

		const item = {
			...trip,
			tripId: trip.id,
			images: images,
			imagesNames: images.map((i) => itemsWithImages.find((item) => item.images.includes(i))?.title),
			name: trip.name.replaceAll('-', ' '),
			destination: trip.destinations?.join(', '),
			category: numOfDestinations > 1 ? 'DESTINATIONS' : numOfDestinations == 1 ? 'DESTINATION' : undefined,
			rate: undefined,
			isSystemRecommendation: undefined,
			location: undefined,
			more_info: undefined,
			source: undefined,
			description: undefined,
			idxToDetails,
			isSharedTrip,
		};

		const isEditMode = myTripsStore.isTripOnEditMode(trip.id);
		return (
			<div key={`${trip.id}-${isEditMode}`} className={classList}>
				<PointOfInterest
					key={trip.id}
					item={item}
					eventStore={eventStore}
					mainFeed
					myTrips
					onClick={() => {
						// window.location.hash = `planTrip?name=${trip.name}`;
						// setPlanTripName(trip.name);
						// setPlanTripMode(true);
						feedStore.setItems([]);
						navigate(`${newDesignRootPath}/plan/${trip.name}`, {});
					}}
					renderTripActions={() => renderTripActions(trip)}
					renderTripInfo={() => renderTripInfo(trip)}
					namePrefix={
						isSharedTrip ? (
							<span>{TranslateService.translate(eventStore, 'SHARED_TRIP')}:&nbsp;</span>
						) : undefined
					}
					isEditMode={isEditMode}
					onEditSave={(newValue: string) => {
						onEditTripSave(trip.id, trip.name, newValue);
					}}
				/>
			</div>
		);
	}

	const loaderDetails = useMemo(() => LOADER_DETAILS(), []);
	if (myTripsStore.isLoading) {
		return (
			<LoadingComponent
				title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
				message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
				loaderDetails={loaderDetails}
			/>
		);
	}

	function onEditTrip(e: any, LSTripName: string, tripId: number) {
		e.preventDefault();
		e.stopPropagation();

		myTripsStore.toggleEditTrip(tripId);
		// if (!eventStore.isMobile) {
		//     myTripsStore.toggleEditTrip(tripId);
		//     return;
		// }
		//
		// if (Object.keys(eventStore.modalValues).length === 0) {
		//     eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		// }
		// ReactModalService.openEditTripModal(eventStore, LSTripName, tripId);
	}

	function onDuplicateTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();

		if (Object.keys(eventStore.modalValues).length === 0) {
			eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		}
		ReactModalService.openDuplicateTripModal(eventStore, LSTripName);
	}

	function onDeleteTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();
		ReactModalService.openDeleteTripModal(eventStore, LSTripName, myTripsStore.dataSource);
	}

	function onHideUnhideTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();
		if (myTripsStore.showHidden) {
			const tripName = LSTripName.replaceAll('-', ' ');

			DataServices.DBService.unHideTripByName(tripName)
				.then(() => {
					LogHistoryService.logHistory(eventStore, TripActions.unhideTrip, {
						tripName,
					});

					myTripsStore.loadMyTrips();
				})
				.catch(() => {
					ReactModalService.internal.openOopsErrorModal(eventStore);
				});
		} else {
			ReactModalService.openHideTripModal(eventStore, LSTripName, myTripsStore.dataSource, () =>
				myTripsStore.loadMyTrips()
			);
		}
		// ReactModalService.openDeleteTripModal(eventStore, LSTripName, dataSource);
	}

	function daysBetween(date1, date2, isAbs: boolean = true) {
		// Parse the dates
		const d1 = new Date(date1);
		const d2 = new Date(date2);

		// Calculate the difference in milliseconds
		const diffTime = isAbs ? Math.abs(d2 - d1) : d2 - d1;

		// Convert milliseconds to days
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		return diffDays;
	}

	function daysAgo(date1) {
		return daysBetween(date1, new Date());
	}

	function renderTripInfo(trip: Trip) {
		const dates = trip.dateRange;
		const start = formatShortDateStringIsrael(dates.start!);
		const end = formatShortDateStringIsrael(dates.end!);
		const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

		const totalSidebarEvents = Object.values(trip.sidebarEvents).flat().length;
		const totalCalendarEvents = trip.calendarEvents.length;

		// const createdAt = new Date(trip.createdAt).toLocaleDateString();
		const dateFormat = getUserDateFormat(eventStore);
		const createdAt = moment(trip.createdAt, 'YYYY-MM-DD').format(dateFormat);
		const daysAgoNum = daysAgo(new Date(trip.createdAt));

		const updatedAt = moment(trip.lastUpdateAt, 'YYYY-MM-DD').format(dateFormat);
		const uDaysAgoNum = daysAgo(new Date(trip.lastUpdateAt));

		return (
			<>
				<div className="flex-row gap-3 flex-wrap-wrap">
					<div id="when">
						{TranslateService.translate(eventStore, 'DATES')}: {end} - {start}
					</div>
					<div id="amount-of-days">
						({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})
					</div>
				</div>
				<span>
					{TranslateService.translate(eventStore, 'DESTINATIONS_X', {
						X: !trip.destinations?.length
							? '-'
							: trip.destinations.map((d) => TranslateService.translate(eventStore, d)).join(', '),
					})}
				</span>
				<div className="activities-info">
					<span>
						{TranslateService.translate(eventStore, 'MY_TRIPS.ITEMS', {
							X: totalSidebarEvents + totalCalendarEvents,
						})}
					</span>
					<span>
						{TranslateService.translate(eventStore, 'scheduled_events')}: {totalCalendarEvents}
					</span>
					<span>
						{TranslateService.translate(eventStore, 'sidebar_events')}: {totalSidebarEvents}
					</span>
				</div>

				<span>
					{TranslateService.translate(eventStore, 'CREATED_AT_X', {
						X: `${createdAt} (${TranslateService.translate(
							eventStore,
							daysAgoNum == 0 ? 'BUTTON_TEXT.TODAY' : 'DAYS_AGO',
							{
								Y: daysAgoNum,
							}
						)})`,
					})}
				</span>
				<span>
					{TranslateService.translate(eventStore, 'UPDATED_AT_X', {
						X: `${updatedAt} (${TranslateService.translate(
							eventStore,
							uDaysAgoNum == 0 ? 'BUTTON_TEXT.TODAY' : 'DAYS_AGO',
							{
								Y: uDaysAgoNum,
							}
						)})`,
					})}
				</span>
			</>
		);
	}

	function getHideUnHideIcon() {
		if (isTemplateUsername()) {
			if (myTripsStore.showHidden) {
				return 'fa-thumbs-o-up';
			} else {
				return 'fa-thumbs-o-down';
			}
		} else {
			if (myTripsStore.showHidden) {
				return 'fa-eye';
			} else {
				return 'fa-eye-slash';
			}
		}
	}

	function renderTripActions(trip: Trip) {
		// @ts-ignore
		const { isSharedTrip } = trip;
		const LSTripName = tripNameToLSTripName(trip.name);

		return (
			<div className="trips-list-trip-actions-v2">
				{!isSharedTrip && (
					<i
						className={getClasses(
							'fa fa-pencil-square-o',
							myTripsStore.isTripOnEditMode(trip.id) && 'active'
						)}
						aria-hidden="true"
						title={TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}
						onClick={(e) => onEditTrip(e, LSTripName, trip.id)}
					/>
				)}
				{!isSharedTrip && (
					<i
						className="fa fa-files-o"
						aria-hidden="true"
						title={TranslateService.translate(eventStore, 'DUPLICATE_TRIP_MODAL.TITLE')}
						onClick={(e) => onDuplicateTrip(e, LSTripName)}
					/>
				)}
				{!isSharedTrip && (
					<i
						className="fa fa-trash-o position-relative top--1"
						aria-hidden="true"
						title={TranslateService.translate(eventStore, 'DELETE_TRIP')}
						onClick={(e) => onDeleteTrip(e, LSTripName)}
					/>
				)}
				{!isSharedTrip && (
					<i
						className={getClasses('fa', getHideUnHideIcon())}
						aria-hidden="true"
						title={TranslateService.translate(
							eventStore,
							myTripsStore.showHidden ? `UNHIDE_${what}` : `HIDE_${what}`
						)}
						onClick={(e) => onHideUnhideTrip(e, LSTripName)}
					/>
				)}
			</div>
		);
	}

	function formatTemplateEvent(e: CalendarEvent, diff?: number) {
		e.description = getEventDescription(e, eventStore, true);
		e.title = getEventTitle(e, eventStore, true);

		if (e.start && diff) {
			e.start = addDays(new Date(e.start), diff);
			e.end = addDays(new Date(e.end), diff);
		}

		return e;
	}

	function formatTemplateCategory(c: TriPlanCategory) {
		if (eventStore.isHebrew) {
			c.title = TranslateService.translateFromTo(eventStore, c.title, undefined, 'en', 'he') ?? c.title;
		}

		return c;
	}

	function splitTitleAndIcons(input: string) {
		const iconRegex =
			/^[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]+/u;
		const iconMatch = input.match(iconRegex);
		const icon = iconMatch ? iconMatch[0] : '';
		const title = icon ? input.replace(icon, '').trim() : input;

		return { title, icon };
	}

	function validateFlightTimes(flight: FlightDetails): boolean {
		const startDateTime = new Date(`${flight.startDate}T${flight.startTime || '00:00'}`);
		const endDateTime = new Date(`${flight.endDate}T${flight.endTime || '00:00'}`);
		return startDateTime <= endDateTime;
	}

	function validateFlights(): boolean {
		return flights.every(validateFlightTimes);
	}

	async function processActivitiesOld(activities: string): Promise<SidebarEvent[]> {
		const activityLines = activities.split('\n').filter((line) => line.trim());

		const processActivity = async (activity: string) => {
			try {
				return new Promise<any>((resolve, reject) => {
					if (!window.google || !window.google.maps) {
						reject('Google Maps API is not loaded.');
						return;
					}

					const service = new window.google.maps.places.PlacesService(document.createElement('div'));

					service.textSearch(
						{
							query: activity,
						},
						(results, status) => {
							if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
								const place = results[0];

								resolve({
									id: Date.now().toString(),
									title: place.name,
									description: place.formatted_address,
									location: {
										address: place.formatted_address,
										latitude: place.geometry?.location?.lat(),
										longitude: place.geometry?.location?.lng(),
									},
									images: place.photos?.map((photo) => photo.getUrl()).join('\n'),
									category: place.types?.[0] || 'CATEGORY.GENERAL',
									extendedProps: {
										rating: place.rating,
										user_ratings_total: place.user_ratings_total,
										website: place.website,
										phone: place.formatted_phone_number,
									},
								});
							} else {
								resolve(null);
							}
						}
					);
				});
			} catch (error) {
				console.error('Error processing activity:', error);
				return null;
			}
		};

		const results = [];
		for (const activity of activityLines) {
			const result = await processActivity(activity);
			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	async function processActivities(
		activities: string,
		eventStore: EventStore,
		categories: TriPlanCategory[]
	): Promise<SidebarEvent[]> {
		const activityLines = activities.split('\n').filter((line) => line.trim());

		const processActivity = async (activity: string, id: number): Promise<SidebarEvent | null> => {
			try {
				return new Promise<SidebarEvent | null>((resolve, reject) => {
					if (!window.google || !window.google.maps) {
						reject('Google Maps API is not loaded.');
						return;
					}

					const service = new window.google.maps.places.PlacesService(document.createElement('div'));

					service.textSearch(
						{
							query: activity,
						},
						(results, status) => {
							if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
								const place = results[0];

								let category = '1'; // Default to 1 (GENERAL)
								let description = '';
								let moreInfo = place.website ?? '';

								// @ts-ignore
								window.updatePlaceDetails(place, false);

								// @ts-ignore
								const category2 = window.getPlaceCategory(place, categories);
								if (category2) {
									category = category2.value;
								}

								if (eventStore.modalValues['description']) {
									description = eventStore.modalValues['description'];
								}
								if (eventStore.modalValues['more-info']) {
									moreInfo = eventStore.modalValues['more-info'];
								}

								// Extract opening hours
								const openingHours = place.opening_hours?.periods
									? // @ts-ignore
									  window.transformOpeningHours(place.opening_hours)
									: undefined;

								resolve({
									id: id.toString(),
									title: place.name,
									description: description,
									location: {
										address: place.formatted_address,
										latitude: place.geometry?.location?.lat(),
										longitude: place.geometry?.location?.lng(),
									},
									images: place.photos?.map((photo) => photo.getUrl()).join('\n'),
									icon: '',
									category,
									openingHours,
									moreInfo,
									duration: '01:00',
									preferredTime: TriplanEventPreferredTime.unset,
									priority: TriplanPriority.high,
									extendedProps: {
										rating: place.rating,
										user_ratings_total: place.user_ratings_total,
										website: place.website,
										phone: place.formatted_phone_number,
									},
								});
							} else {
								resolve(null);
							}
						}
					);
				});
			} catch (error) {
				console.error('Error processing activity:', error);
				return null;
			}
		};

		const results: SidebarEvent[] = [];
		let idx = 1;
		for (const activity of activityLines) {
			const result = await processActivity(activity, idx);
			idx += 1;
			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	async function createNewTrip(tripName: string) {
		const areDatesValid = validateDateRange(eventStore, customDateRange.start, customDateRange.end);
		const areFlightsValid = validateFlights();

		errors.start = !areDatesValid;
		errors.end = !areDatesValid;
		errors.flights = !areFlightsValid;

		if (tripName.length == 0) {
			ReactModalService.internal.alertMessage(eventStore, 'MODALS.ERROR.TITLE', 'TRIP_NAME_EMPTY', 'error');
			setErrors({
				...errors,
				title: true,
			});
			return;
		}

		if (!areDatesValid) {
			setErrors({
				...errors,
				start: true,
				end: true,
			});
			return;
		}

		if (!areFlightsValid) {
			setErrors({
				...errors,
				flights: true,
			});
			return;
		}

		if (new Date(customDateRange.end).getTime() < new Date(customDateRange.start).getTime()) {
			setErrors({
				start: true,
				end: true,
			});
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.START_DATE_SMALLER',
				'error'
			);
			return;
		}

		setErrors({});

		const TripName = tripName.replace(/\s/gi, '-');
		const categories = getDefaultCategories(eventStore);

		try {
			// Process activities if any
			let processedActivities = [];
			if (activities.trim()) {
				setIsProcessingActivities(true);
				try {
					processedActivities = await processActivities(activities, eventStore, categories);
					if (processedActivities.length > 0) {
						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.SUCCESS.TITLE',
							'ACTIVITIES.SUCCESS',
							'success',
							{ count: processedActivities.length }
						);
					}
				} catch (error) {
					console.error('Error processing activities:', error);
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTIVITIES.ERROR',
						'error'
					);
				} finally {
					setIsProcessingActivities(false);
				}
			}

			// local mode
			if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
				eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
				eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
				eventStore.setCustomDateRange(customDateRange);
				eventStore.dataService.setDateRange(customDateRange, TripName);
				navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
			} else {
				const allEvents = [...defaultCalendarEvents, ...Object.values(defaultEvents).flat()];
				const sidebarEvents = {
					...defaultEvents,
				};
				processedActivities.forEach((a) => {
					const categoryId = Number(a['category']);
					if (!sidebarEvents[categoryId]) {
						sidebarEvents[categoryId] = [];
					}
					sidebarEvents[categoryId].push(a);
					allEvents.push(a);
				});

				const tripData: upsertTripProps = {
					name: TripName,
					dateRange: customDateRange,
					calendarLocale: eventStore.calendarLocalCode,
					allEvents,
					sidebarEvents,
					calendarEvents: defaultCalendarEvents,
					categories,
					destinations: selectedDestinations,
				};

				// Add flight events
				let transferFromAirportEnd;
				flights.forEach((flight, index) => {
					const flightEvent: CalendarEvent = {
						id: tripData.calendarEvents.length + 1,
						title: TranslateService.translate(eventStore, 'FLIGHT_DETAILS.FLIGHT_INFO', {
							flightNumber: flight.flightNumber,
							from: flight.sourceAirport,
							to: flight.targetAirport,
						}),
						start: `${flight.startDate}T${flight.startTime}`,
						end: `${flight.endDate}T${flight.endTime}`,
						category: tripData.categories.find((c) => c.titleKey === 'CATEGORY.FLIGHTS')?.id ?? 1,
						description: '',
						isLocked: true,
						allDay: false,
						priority: TriplanPriority.unset,
						preferredTime: TriplanEventPreferredTime.unset,
						duration: '02:00',
						location: undefined,
						extendedProps: {},
					};

					tripData.calendarEvents.push(flightEvent);

					// Add airport transfer activities
					if (index < flights.length - 1) {
						const nextFlightStart = new Date(
							`${flights[index + 1].startDate}T${flights[index + 1].startTime}`
						);
						const flightEnd = new Date(`${flight.endDate}T${flight.endTime}`);

						// Add transfer from airport to hotel (1 hour after flight arrival)
						const transferFromAirportStart = new Date(flightEnd.getTime());
						transferFromAirportEnd = new Date(transferFromAirportStart.getTime() + 2 * 60 * 60 * 1000);

						if (transferFromAirportEnd <= new Date(customDateRange.end)) {
							tripData.calendarEvents.push({
								id: tripData.calendarEvents.length + 1,
								title: TranslateService.translate(eventStore, 'TRANSFER.FROM_AIRPORT_TO_HOTEL'),
								start: transferFromAirportStart.toISOString(),
								end: transferFromAirportEnd.toISOString(),
								category: tripData.categories.find((c) => c.titleKey === 'CATEGORY.TRANSFERS')?.id ?? 1,
								description: '',
								isLocked: true,
								allDay: false,
								priority: TriplanPriority.unset,
								preferredTime: TriplanEventPreferredTime.unset,
								duration: '02:00',
								location: undefined,
								extendedProps: {},
							});

							// Add transfer to airport (4 hours before next flight)
							const transferToAirportStart = new Date(nextFlightStart.getTime() - 4 * 60 * 60 * 1000);
							const transferToAirportEnd = new Date(nextFlightStart.getTime() - 3 * 60 * 60 * 1000);

							if (transferToAirportStart >= new Date(customDateRange.start)) {
								tripData.calendarEvents.push({
									id: tripData.calendarEvents.length + 1,
									title: TranslateService.translate(eventStore, 'TRANSFER.TO_AIRPORT'),
									start: transferToAirportStart.toISOString(),
									end: transferToAirportEnd.toISOString(),
									category:
										tripData.categories.find((c) => c.titleKey === 'CATEGORY.TRANSFERS')?.id ?? 1,
									description: '',
									isLocked: true,
									allDay: false,
									priority: TriplanPriority.unset,
									preferredTime: TriplanEventPreferredTime.unset,
									duration: '01:00',
									location: undefined,
									extendedProps: {},
								});

								// Add "Be at Airport" activity (3 hours before next flight)
								const beAtAirportStart = new Date(transferToAirportEnd.getTime());
								const beAtAirportEnd = new Date(nextFlightStart.getTime());

								if (beAtAirportStart >= new Date(customDateRange.start)) {
									tripData.calendarEvents.push({
										id: tripData.calendarEvents.length + 1,
										title: TranslateService.translate(eventStore, 'TRANSFER.BE_AT_AIRPORT'),
										start: beAtAirportStart.toISOString(),
										end: beAtAirportEnd.toISOString(),
										category:
											tripData.categories.find((c) => c.titleKey === 'CATEGORY.TRANSFERS')?.id ??
											1,
										description: '',
										isLocked: true,
										allDay: false,
										priority: TriplanPriority.unset,
										preferredTime: TriplanEventPreferredTime.unset,
										duration: '03:00',
										location: undefined,
										extendedProps: {},
									});
								}
							}
						}
					}
				});

				// Add hotel events for each day
				hotels.forEach((hotel) => {
					const hotelStartDate = new Date(hotel.startDate);
					const hotelEndDate = new Date(hotel.endDate);
					const currentDate = new Date(hotelStartDate);

					while (currentDate <= hotelEndDate) {
						const isFirstDay = currentDate.getTime() === hotelStartDate.getTime();
						const isLastDay = currentDate.getTime() === hotelEndDate.getTime();
						const eventStart = new Date(currentDate);
						const eventEnd = new Date(currentDate);

						if (isFirstDay) {
							// On first day, start 1 hour after transfer from airport
							if (transferFromAirportEnd) {
								eventStart.setTime(transferFromAirportEnd.getTime());
								eventEnd.setTime(eventStart.getTime() + 60 * 60 * 1000);
							} else {
								eventStart.setHours(15, 0, 0, 0);
								eventEnd.setHours(16, 0, 0, 0);
							}
						} else if (isLastDay) {
							eventStart.setHours(10, 0, 0, 0);
							eventEnd.setHours(11, 0, 0, 0);
						} else {
							// On other days, set to 8:00-9:00
							eventStart.setHours(8, 0, 0, 0);
							eventEnd.setHours(9, 0, 0, 0);
						}

						tripData.calendarEvents.push({
							id: (tripData.calendarEvents.length + 1).toString(),
							title: `${hotel.name}${
								isFirstDay
									? ` - ${TranslateService.translate(eventStore, 'HOTEL.CHECK_IN')}`
									: isLastDay
									? ` - ${TranslateService.translate(eventStore, 'HOTEL.CHECK_OUT')}`
									: ''
							}`,
							start: eventStart.toISOString(),
							end: eventEnd.toISOString(),
							category: tripData.categories.find((c) => c.titleKey === 'CATEGORY.HOTELS')?.id ?? 1,
							description: '',
							isLocked: true,
							allDay: false,
							priority: TriplanPriority.unset,
							preferredTime: TriplanEventPreferredTime.unset,
							duration: '01:00',
							location: undefined,
							extendedProps: {},
						});

						currentDate.setDate(currentDate.getDate() + 1);
					}
				});

				// backup
				let { viewMode, mobileViewMode } = eventStore;

				// @ts-ignore
				await DataServices.DBService.createTrip(
					tripData,
					(res: any) => {
						// switch to map view as  the default view.
						eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
						eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);

						eventStore.setCustomDateRange(customDateRange);
						eventStore.dataService.setDateRange(customDateRange, TripName);

						// keep to history:
						LogHistoryService.logHistory(eventStore, TripActions.createdTrip, {
							tripName: TripName,
						});

						navigate(`${newDesignRootPath}/plan/${res.data.name}`);
					},
					(e) => {
						// restore to backup
						eventStore.setViewMode(viewMode);
						eventStore.setMobileViewMode(mobileViewMode);

						if (e.response.data.statusCode === 409) {
							setErrors({
								title: true,
							});
							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.ERROR.TITLE',
								'TRIP_ALREADY_EXISTS',
								'error'
							);
						} else {
							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.ERROR.TITLE',
								'OOPS_SOMETHING_WENT_WRONG',
								'error'
							);
						}
					},
					() => {}
				);
			}
		} catch (error) {
			console.error('Error creating new trip:', error);
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'OOPS_SOMETHING_WENT_WRONG',
				'error'
			);
		}
	}

	function updateErrorsOnDateChange(start: string, end: string) {
		// means user already clicked on submit at least once.
		if (Object.keys(errors).length) {
			const isValid = validateDateRange(eventStore, start, end, undefined, undefined, undefined, false);

			setErrors({
				...errors,
				start: !isValid,
				end: !isValid,
			});
		}
	}

	function renderGoBackButton() {
		return (
			<Button
				text={eventStore.isMobile ? undefined : TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS')}
				flavor={ButtonFlavor.secondary}
				className="padding-inline-15 font-size-14 font-weight-normal black"
				icon={`fa-chevron-${eventStore.getCurrentDirectionStart()}`}
				onClick={() => {
					window.location.hash = myTripsTabId;
					setAddNewTripMode(false);
				}}
			/>
		);
	}

	function renderAddTripButton(flavor: ButtonFlavor = ButtonFlavor.secondary) {
		function getBtnText() {
			if (myTripsStore.showHidden) {
				return TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS');
			}
			if (addNewTripMode) {
				return TranslateService.translate(eventStore, 'CREATE_TRIP');
			}
			if (!eventStore.isMobile) {
				return TranslateService.translate(
					eventStore,
					what == 'TRIP' ? 'LANDING_PAGE.START_NOW' : 'CREATE_NEW_TEMPLATE'
				);
			}
			return undefined; // on my trips tab if mobile
		}

		return (
			<>
				<Button
					text={getBtnText()}
					flavor={flavor}
					className={getClasses(
						'padding-inline-15 font-size-14 font-weight-normal',
						eventStore.isMobile && 'black'
					)}
					icon={
						myTripsStore.showHidden
							? `fa-chevron-${eventStore.getCurrentDirectionStart()}`
							: 'fa-plus-square-o'
					}
					onClick={() => {
						if (myTripsStore.showHidden) {
							myTripsStore.setShowHidden(false);
						} else if (addNewTripMode) {
							createNewTrip(tripName);
						} else {
							setAddNewTripMode(true);
						}
						// navigate('/getting-started');

						window.scrollTo({
							top: eventStore.isMobile ? 250 : 500,
							behavior: 'smooth',
						});
					}}
				/>
				{addNewTripMode && myTripsStore.allTripsSorted.length > 0 && (
					<Button
						text={
							eventStore.isMobile ? undefined : TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS')
						}
						flavor={ButtonFlavor.link}
						onClick={() => {
							window.location.hash = myTripsTabId;
							setAddNewTripMode(false);
						}}
					/>
				)}
			</>
		);
	}

	function renderDescription() {
		return (
			<span
				className="white-space-pre-line margin-bottom-20"
				dangerouslySetInnerHTML={{
					__html: TranslateService.translate(eventStore, `CREATE_NEW_${what}_TITLE.DESCRIPTION`),
				}}
			/>
		);
	}

	function renderNoTripsPlaceholder() {
		return (
			<div className="my-trips-actionbar width-100-percents align-items-center">
				<hr className="width-100-percents" />
				<img src="/images/new-trip.png" className="border-radius-round" width="200" />
				<div className="flex-column gap-5">
					<h3>{TranslateService.translate(eventStore, `CREATE_NEW_${what}_TITLE`)}</h3>
					{renderDescription()}
					{renderAddTripButton()}
				</div>
				<br />
				<br />
				<br />
				<hr className="width-100-percents" />
			</div>
		);
	}

	function renderCreateTripPlaceholder() {
		return (
			<div className="my-trips-actionbar width-100-percents align-items-center">
				<hr className="width-100-percents" />
				<img
					src="/images/new-trip.png"
					className={getClasses('border-radius-round', 'fa-spin-reverse')}
					width="200"
				/>
				<div className="flex-column gap-5 form-content">
					<h3>{TranslateService.translate(eventStore, 'CREATE_NEW_TRIP_TITLE.ADD_NEW_TRIP')}</h3>
					{renderCreateTripForm()}
					{renderAddTripButton()}
				</div>
				<br />
				<br />
				<br />
				<hr className="width-100-percents" />
			</div>
		);
	}

	function renderFlightDetailsSection() {
		return (
			<div className="flight-details-section">
				<div className="flight-header">
					<h3 className="flex-row flex-1-1-0">
						{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.TITLE')}
					</h3>
					<button
						className="add-flight-button"
						onClick={() => {
							const newFlight = {
								startDate: flights.length === 0 ? customDateRange.start : customDateRange.end,
								startTime: '',
								endDate: flights.length === 0 ? customDateRange.start : customDateRange.end,
								endTime: '',
								sourceAirport: flights.length > 0 ? flights[flights.length - 1].targetAirport : '',
								targetAirport: flights.length > 0 ? flights[flights.length - 1].sourceAirport : '',
								flightNumber: '',
							};
							setFlights([...flights, newFlight]);
						}}
					>
						{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.ADD_FLIGHT')}
					</button>
				</div>
				<div className="flight-list">
					{flights.length === 0 ? (
						<p>{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.NO_FLIGHTS')}</p>
					) : (
						flights.map((flight, index) => (
							<div key={index} className="flight-item">
								<div className="flight-info">
									<div className="flight-name">
										<p>
											{flight.flightNumber && flight.sourceAirport && flight.targetAirport
												? TranslateService.translate(eventStore, 'FLIGHT_DETAILS.FLIGHT_INFO', {
														flightNumber: flight.flightNumber,
														from: flight.sourceAirport,
														to: flight.targetAirport,
												  })
												: TranslateService.translate(
														eventStore,
														'FLIGHT_DETAILS.DEFAULT_NAME',
														{
															number: index + 1,
														}
												  )}
										</p>
									</div>
									<div className="flight-header-info">
										<div className="flight-number">
											<label>
												{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.FLIGHT_NUMBER')}
											</label>
											<input
												type="text"
												value={flight.flightNumber}
												placeholder={TranslateService.translate(eventStore, 'FOR_EXAMPLE', {
													X: 'IL235',
												})}
												onChange={(e) => {
													const newFlightNumber = e.target.value.toUpperCase();
													const newFlights = [...flights];
													newFlights[index] = {
														...flight,
														flightNumber: newFlightNumber,
													};
													setFlights(newFlights);
												}}
											/>
										</div>
										<div className="flight-airports">
											<div className="airport-input">
												<label>
													{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.FROM')}
												</label>
												<input
													type="text"
													value={flight.sourceAirport}
													placeholder={TranslateService.translate(eventStore, 'FOR_EXAMPLE', {
														X: index === 0 ? 'TLV' : flights[0].targetAirport || 'ATH',
													})}
													maxLength={3}
													onChange={(e) => {
														const newSourceAirport = e.target.value.toUpperCase();
														const newFlights = [...flights];
														newFlights[index] = {
															...flight,
															sourceAirport: newSourceAirport,
														};
														setFlights(newFlights);
													}}
												/>
											</div>
											<div className="airport-input">
												<label>
													{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.TO')}
												</label>
												<input
													type="text"
													value={flight.targetAirport}
													placeholder={TranslateService.translate(eventStore, 'FOR_EXAMPLE', {
														X: index === 0 ? 'ATH' : flights[0].sourceAirport || 'TLV',
													})}
													maxLength={3}
													onChange={(e) => {
														const newTargetAirport = e.target.value.toUpperCase();
														const newFlights = [...flights];
														newFlights[index] = {
															...flight,
															targetAirport: newTargetAirport,
														};
														setFlights(newFlights);
													}}
												/>
											</div>
										</div>
									</div>
									<div className="flight-time">
										<label>
											{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.START_DATE')}
										</label>
										<div className="datetime-input">
											<input
												type="date"
												value={flight.startDate}
												min={customDateRange.start}
												max={customDateRange.end}
												onChange={(e) => {
													const newStartDate = e.target.value;
													const newFlights = [...flights];
													newFlights[index] = {
														...flight,
														startDate: newStartDate,
														endDate:
															new Date(newStartDate) > new Date(flight.endDate)
																? newStartDate
																: flight.endDate,
													};
													setFlights(newFlights);
												}}
											/>
											<input
												type="time"
												value={flight.startTime}
												onChange={(e) => {
													const newStartTime = e.target.value;
													const newFlights = [...flights];
													newFlights[index] = {
														...flight,
														startTime: newStartTime,
														endTime:
															flight.startDate === flight.endDate &&
															new Date(`${flight.startDate}T${newStartTime}`) >
																new Date(`${flight.endDate}T${flight.endTime}`)
																? newStartTime
																: flight.endTime,
													};
													setFlights(newFlights);
												}}
											/>
										</div>
									</div>
									<div className="flight-time">
										<label>
											{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.END_DATE')}
										</label>
										<div className="datetime-input">
											<input
												type="date"
												value={flight.endDate}
												min={flight.startDate}
												max={customDateRange.end}
												onChange={(e) => {
													const newEndDate = e.target.value;
													const newFlights = [...flights];
													newFlights[index] = {
														...flight,
														endDate: newEndDate,
													};
													setFlights(newFlights);
												}}
											/>
											<input
												type="time"
												value={flight.endTime}
												onChange={(e) => {
													const newEndTime = e.target.value;
													const newFlights = [...flights];
													newFlights[index] = {
														...flight,
														endTime: newEndTime,
													};
													setFlights(newFlights);
												}}
											/>
										</div>
									</div>
								</div>
								<div className="flight-actions">
									<button
										className="delete-flight"
										onClick={() => {
											const newFlights = flights.filter((_, i) => i !== index);
											setFlights(newFlights);
										}}
									>
										{TranslateService.translate(eventStore, 'FLIGHT_DETAILS.DELETE')}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		);
	}

	function renderHotelDetailsSection() {
		return (
			<div className="flight-details-section border-bottom-light-gray margin-top-0">
				<div className="flight-header">
					<h3 className="flex-row flex-1-1-0">
						{TranslateService.translate(eventStore, 'HOTEL.HOTEL_DETAILS')}
					</h3>
					<button
						className="add-hotel-button"
						onClick={() => {
							setHotels([
								...hotels,
								{
									name: '',
									startDate: customDateRange.start,
									endDate: customDateRange.end,
								},
							]);
						}}
					>
						{TranslateService.translate(eventStore, 'HOTEL.ADD_HOTEL')}
					</button>
				</div>

				<div className="flight-list">
					{hotels.length === 0 ? (
						<p>{TranslateService.translate(eventStore, 'HOTEL.NO_HOTELS')}</p>
					) : (
						hotels.map((hotel, index) => (
							<div key={index} className="hotel-item">
								<div className="hotel-info">
									<div className="hotel-name">
										<input
											type="text"
											value={hotel.name}
											placeholder={TranslateService.translate(eventStore, 'HOTEL.NAME')}
											onChange={(e) => {
												const newHotels = [...hotels];
												newHotels[index] = {
													...hotel,
													name: e.target.value,
												};
												setHotels(newHotels);
											}}
										/>
									</div>
									<div className="hotel-dates">
										<div className="date-input">
											<label>{TranslateService.translate(eventStore, 'HOTEL.START_DATE')}</label>
											<input
												type="date"
												value={hotel.startDate}
												min={customDateRange.start}
												max={customDateRange.end}
												onChange={(e) => {
													const newStartDate = e.target.value;
													const newHotels = [...hotels];
													newHotels[index] = {
														...hotel,
														startDate: newStartDate,
														endDate:
															new Date(newStartDate) > new Date(hotel.endDate)
																? newStartDate
																: hotel.endDate,
													};
													setHotels(newHotels);
												}}
											/>
										</div>
										<div className="date-input">
											<label>{TranslateService.translate(eventStore, 'HOTEL.END_DATE')}</label>
											<input
												type="date"
												value={hotel.endDate}
												min={hotel.startDate}
												max={customDateRange.end}
												onChange={(e) => {
													const newEndDate = e.target.value;
													const newHotels = [...hotels];
													newHotels[index] = {
														...hotel,
														endDate: newEndDate,
													};
													setHotels(newHotels);
												}}
											/>
										</div>
									</div>
								</div>
								<div className="hotel-actions">
									<button
										className="delete-hotel"
										onClick={() => {
											const newHotels = hotels.filter((_, i) => i !== index);
											setHotels(newHotels);
										}}
									>
										{TranslateService.translate(eventStore, 'HOTEL.DELETE')}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		);
	}

	function renderCreateTripForm() {
		return (
			<div
				className="custom-dates-container align-items-center"
				style={{
					backgroundColor: 'transparent',
					border: 0,
				}}
			>
				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
				</div>
				<div className="trip-name-line margin-bottom-5">
					<input
						type="text"
						style={{
							paddingInline: '15px',
							height: '40px',
							maxWidth: '300px',
						}}
						placeholder={TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
						value={tripName}
						onChange={(e) => {
							const value = e.target.value;
							setTripName(value);

							if (errors['title']) {
								setErrors({
									...errors,
									title: value.length == 0,
								});
							}
						}}
						className={getClasses(errors['title'] && 'red-border')}
					/>
				</div>

				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_ARE_YOU_GOING_TO')}
				</div>
				<div className="custom-dates-line flex-row align-items-center margin-bottom-5">
					<DestinationSelector
						onChange={setSelectedDestinations}
						selectedDestinations={selectedDestinations}
					/>
				</div>

				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHEN_IS_YOUR_TRIP')}
				</div>
				<div className="custom-dates-line flex-row align-items-center margin-bottom-5">
					<input
						type="date"
						onKeyDown={(e) => {
							e.preventDefault();
							return false;
						}}
						value={customDateRange.start}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: value,
								end: customDateRange.end,
							});
							updateErrorsOnDateChange(value, customDateRange.end);
						}}
						className={getClasses('flex-row flex-1-1-0', errors['start'] && 'red-border')}
					/>
					{TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.UNTIL')}
					<input
						type="date"
						onKeyDown={(e) => {
							e.preventDefault();
							return false;
						}}
						min={customDateRange.start}
						value={customDateRange.end}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: customDateRange.start,
								end: value,
							});
							updateErrorsOnDateChange(customDateRange.start, value);
						}}
						className={getClasses('flex-row flex-1-1-0', errors['end'] && 'red-border')}
					/>
				</div>

				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'ACTIVITIES.TITLE')}
				</div>
				<div className="activities-section margin-bottom-5">
					<textarea
						value={activities}
						onChange={(e) => setActivities(e.target.value)}
						placeholder={TranslateService.translate(eventStore, 'ACTIVITIES.PLACEHOLDER')}
						className="activities-textarea"
						rows={5}
					/>
					{isProcessingActivities && (
						<div className="processing-activities">
							{TranslateService.translate(eventStore, 'ACTIVITIES.PROCESSING')}
						</div>
					)}
				</div>

				{renderFlightDetailsSection()}
				{renderHotelDetailsSection()}
			</div>
		);
	}

	function getPageTitle() {
		let key = 'MY_TRIPS';
		if (myTripsStore.showHidden) {
			key = 'HIDDEN_TRIPS';
		}

		if (isTemplateUsername()) {
			if (myTripsStore.showHidden) {
				key = 'UNAPPROVED_TEMPLATES';
			} else {
				key = 'TRIP_TEMPLATES';
			}
		}

		return TranslateService.translate(eventStore, key);
	}

	const what = isTemplateUsername() ? 'TEMPLATE' : 'TRIP';

	return (
		<div className="flex-column align-items-start margin-top-10">
			<div className="flex-column align-items-center width-100-percents">
				<h3 className={getClasses('main-feed-header width-100-percents', eventStore.isMobile && 'flex-row')}>
					<span>{TranslateService.translate(eventStore, getPageTitle())}</span>
					{myTripsStore.allTripsSorted.length > 0 && !addNewTripMode && renderAddTripButton()}
					{addNewTripMode && renderGoBackButton()}
				</h3>
				{!addNewTripMode && (
					<span
						className="main-feed-description text-align-start"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(
								eventStore,
								myTripsStore.showHidden
									? `MY_${what}S_HIDDEN_TAB.DESCRIPTION`
									: `MY_${what}S_TAB.DESCRIPTION`
							),
						}}
					/>
				)}
			</div>
			<div
				className="flex-row justify-content-center flex-wrap-wrap align-items-start width-100-percents"
				key={myTripsStore.myTrips?.length}
			>
				{planTripMode ? (
					<MainPage />
				) : addNewTripMode ? (
					renderCreateTripPlaceholder()
				) : (
					<>
						{myTripsStore.allTripsSorted?.length == 0
							? renderNoTripsPlaceholder()
							: myTripsStore.allTripsSorted.map(renderTrip)}
						{myTripsStore.hiddenTripsEnabled && (
							<Button
								onClick={() => {
									myTripsStore.setShowHidden(!myTripsStore.showHidden);
								}}
								flavor={ButtonFlavor.link}
								className="width-100-percents text-align-center"
								text={TranslateService.translate(
									eventStore,
									myTripsStore.showHidden ? `SHOW_${what}S_LIST` : `SHOW_HIDDEN_${what}S_LIST`
								)}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default observer(MyTripsTab);
