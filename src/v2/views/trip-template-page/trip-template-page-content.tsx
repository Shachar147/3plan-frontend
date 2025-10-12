import React, { useContext, useEffect, useRef, useState } from 'react';
import { Observer, observer } from 'mobx-react';
import './trip-template-page-content.scss';
import MapContainer from '../../../components/map-container/map-container';
import { eventStoreContext } from '../../../stores/events-store';
import { tripTemplatesContext } from '../../stores/templates-store';
import { useParams } from 'react-router-dom';
import TranslateService from '../../../services/translate-service';
import { runInAction } from 'mobx';
import { EventInput } from '@fullcalendar/react';
import ListViewService from '../../../services/list-view-service';
import { getTripTemplatePhoto } from './utils';
import { getClasses, getEventTitle } from '../../../utils/utils';
import TripTemplateBanner from './trip-template-banner';
import TripTemplateDay from './trip-template-day';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';
import { CalendarEvent, SidebarEvent } from '../../../utils/interfaces';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { TriplanPriority } from '../../../utils/enums';

function TripTemplateDayShimmering({
	baseClass,
	idx = 0,
	counter = 0,
	notesCounter = 0,
	coverImage,
}: {
	baseClass: string;
	idx?: number;
	counter?: number;
	notesCounter?: number;
	coverImage?: string;
}) {
	const eventStore = useContext(eventStoreContext);

	// @ts-ignore
	const events: CalendarEvent[] = [{}, {}, {}, {}, {}];
	return (
		<div className={`${baseClass}-day-container`}>
			<h3 className={`${baseClass}-day-title`}>
				{TranslateService.translate(eventStore, 'DAY_X', { X: idx + 1 })}
			</h3>
			{events.map((e, idx2) => {
				return (
					<div className={`${baseClass}-activity`}>
						<div className={`${baseClass}-activity-marker-icon`}>
							<i className="fa fa-map-marker" />
							<span>{counter + idx2 + 1 - notesCounter}</span>
						</div>
						<div className={`${baseClass}-activity-image shimmer-animation`} />
						<div className={`${baseClass}-activity-content`}>
							<h2 className={`${baseClass}-activity-content-title shimmer-animation`} />
							<div className={`${baseClass}-activity-category-tag shimmer-animation`} />
							<div className={`${baseClass}-activity-content-description shimmer-animation`} />
							<div className={`${baseClass}-activity-content-description shimmer-animation medium`} />
							<div className={`${baseClass}-activity-content-description shimmer-animation small`} />
						</div>
					</div>
				);
			})}
		</div>
	);
}

function ItineraryShimmering({ baseClass, coverImage }: { baseClass: string; coverImage?: string }) {
	return (
		<div className={getClasses(baseClass, 'trip-template-itinerary-shimmering bright-scrollbar')}>
			<TripTemplateBanner baseClass={baseClass} isShimmering coverImage={coverImage} />
			<TripTemplateDayShimmering baseClass={baseClass} coverImage={coverImage} />
			<TripTemplateDayShimmering baseClass={baseClass} idx={1} counter={5} coverImage={coverImage} />
			<TripTemplateDayShimmering baseClass={baseClass} idx={2} counter={10} coverImage={coverImage} />
		</div>
	);
}

function TripTemplateSidebarSuggestions() {
	const eventStore = useContext(eventStoreContext);
	const sidebarEvents = eventStore.allSidebarEvents;
	const categories = eventStore.categories;

	// Group sidebar events by category
	const eventsByCategory: Record<string, SidebarEvent[]> = {};
	sidebarEvents.forEach((event) => {
		const catId = String(event.category);
		if (!eventsByCategory[catId]) eventsByCategory[catId] = [];
		eventsByCategory[catId].push(event);
	});

	if (sidebarEvents.length == 0) {
		return null;
	}

	return (
		<div className="trip-template-sidebar-suggestions">
			<h1>{TranslateService.translate(eventStore, 'YOU_MAY_ALSO_WANT_TO_VISIT')}</h1>
			{Object.keys(eventsByCategory).map((catId) => {
				const catObj = categories.find((c) => String(c.id) === catId);
				const catName = catObj ? TranslateService.translate(eventStore, catObj.title) : catId;
				return (
					<div key={catId} className="sidebar-suggestion-category-block" style={{ marginBottom: 32 }}>
						<h3 style={{ marginBottom: 12 }}>{catName}</h3>
						<div className="sidebar-suggestion-events-list">
							{eventsByCategory[catId].map((event) => {
								const images = event.images
									? Array.isArray(event.images)
										? event.images
										: String(event.images)
												.split(',')
												.map((s) => s.trim())
												.filter(Boolean)
									: [];
								return (
									<div
										key={event.id}
										className="sidebar-suggestion-event"
										style={{
											display: 'flex',
											alignItems: 'flex-start',
											marginBottom: 18,
											background: '#fff',
											borderRadius: 8,
											boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
											padding: 12,
											cursor: 'pointer',
										}}
										onClick={() => {
											eventStore.showEventOnMap = Number(event.id);
											runInAction(() => {
												eventStore.forceMapReRender += 1;
											});
										}}
									>
										<div style={{ width: 110, minWidth: 110, marginInlineEnd: 16, maxWidth: 110 }}>
											{images.length > 0 ? (
												<Carousel
													showThumbs={false}
													showIndicators={false}
													infiniteLoop={true}
													className="event-image-carousel"
												>
													{images.map((img, idx) => (
														<div key={idx}>
															<img
																src={img}
																alt={event.title}
																style={{
																	width: '100%',
																	borderRadius: 8,
																	objectFit: 'cover',
																	maxHeight: 90,
																}}
																onError={(e) => {
																	e.currentTarget.onerror = null;
																	e.currentTarget.src = '/images/no-image.png';
																}}
															/>
														</div>
													))}
												</Carousel>
											) : (
												<img
													src="/images/no-image.png"
													alt={event.title}
													style={{
														width: '100%',
														borderRadius: 8,
														objectFit: 'cover',
														maxHeight: 90,
													}}
												/>
											)}
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
												{getEventTitle(event as CalendarEvent, eventStore, true)}
											</div>
											{event.description && (
												<div
													style={{
														fontSize: 14,
														color: '#555',
														marginBottom: 2,
														whiteSpace: 'pre-line',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
													}}
												>
													{event.description}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function TripTemplatePageContent() {
	const { templateId } = useParams();
	const eventStore = useContext(eventStoreContext);
	const templatesStore = useContext(tripTemplatesContext);

	const containerRef = useRef<any>(null);
	const MapContainerRef = useRef<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState(undefined);
	const [coverImage, setCoverImage] = useState(undefined);

	async function init() {
		if (!templatesStore.tripTemplates.find((t) => t.id == templateId)) {
			await templatesStore.loadTemplates();
		}
		const tripData = templatesStore.tripTemplates.find((t) => t.id == templateId);

		if (!tripData) {
			setErrorMessage(TranslateService.translate(eventStore, 'OOPS_SOMETHING_WENT_WRONG.TRY_REFRESH'));
			setIsLoading(false);
		} else {
			await eventStore.updateTripData(tripData);
			runInAction(() => {
				eventStore.tripName = tripData.name;
			});

			const bgImage = await getTripTemplatePhoto(tripData);
			setCoverImage(bgImage);
			setIsLoading(false);
		}
	}

	useEffect(() => {
		setIsLoading(true);
		init();
	}, []);

	function renderMap() {
		if (eventStore.isMobile) {
			return undefined;
		}

		let content = (
			<div
				className="width-100-percents flex-col align-items-center justify-content-center text-align-center"
				style={{
					backgroundColor: '#fafafa',
					backgroundImage: `url('/loaders/map-loader.gif')`,
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<div className="position-relative top-120">
					{TranslateService.translate(eventStore, 'MAP_VIEW.LOADING_PLACEHOLDER')}
				</div>
			</div>
		);

		if (!isLoading) {
			content = (
				<div
					className="map-container flex-row"
					key={`${eventStore.forceMapReRender}-${JSON.stringify(eventStore.allEventsFilteredComputed)}`}
				>
					<Observer>
						{() => (
							<MapContainer
								allEvents={[
									...eventStore.calendarEvents.map((c) => {
										c.priority = TriplanPriority.must;
										return c;
									}),
									...eventStore.allSidebarEvents.map((c) => {
										c.priority = TriplanPriority.unset;
										return c;
									}),
								]}
								ref={MapContainerRef}
								addToEventsToCategories={() => false}
								noHeader
								noFilters
								isReadOnly
								zoom={eventStore.showEventOnMap ? 14 : 12}
								isTemplate
							/>
						)}
					</Observer>
				</div>
			);
		}

		return <div className="map-container-wrapper flex-1-1-0">{content}</div>;
	}

	function renderItinerary() {
		const baseClass = 'trip-template-itinerary';

		let content = <ItineraryShimmering baseClass={baseClass} coverImage={coverImage} />;

		if (!isLoading) {
			const calendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
				eventStore,
				eventStore.calendarEvents
			);
			const keys = Object.keys(calendarEventsPerDay);
			keys.forEach((k) => (calendarEventsPerDay[k] = calendarEventsPerDay[k].filter((e) => e.title)));

			let counter = 0;
			content = (
				<div className={getClasses(baseClass, 'bright-scrollbar')} ref={containerRef}>
					<TripTemplateBanner baseClass={baseClass} coverImage={coverImage} />
					{Object.keys(calendarEventsPerDay).map((d, idx) => {
						if (idx > 0) {
							counter += calendarEventsPerDay[keys[idx - 1]].filter((x) => !x.allDay).length;
						}
						return (
							<TripTemplateDay
								baseClass={baseClass}
								idx={idx}
								events={calendarEventsPerDay[d]}
								counter={counter}
							/>
						);
					})}
					<ScrollToTopButton containerRef={containerRef} scrollDistance={600} isSticky />
				</div>
			);
		}

		return (
			<div
				className={getClasses(
					'flex-row',
					`${baseClass}-wrapper`,
					eventStore.isMobile && 'max-width-100-percents'
				)}
			>
				{content}
			</div>
		);
	}

	if (!isLoading && errorMessage) {
		return (
			<div
				className="width-100-percents flex-col align-items-center justify-content-center text-align-center"
				style={{
					height: 'CALC(100vh - 100px)',
					maxHeight: '400px',
					backgroundImage: `url('/loaders/error-gif.gif')`,
					backgroundSize: 'contain',
					backgroundPositionX: 'center',
					backgroundPositionY: 'bottom',
					backgroundRepeat: 'no-repeat',
					marginTop: eventStore.isMobile ? 0 : 100,
				}}
			>
				<div
					className="position-relative font-weight-bold"
					style={{
						top: eventStore.isMobile ? 120 : 150,
					}}
				>
					{errorMessage}
				</div>
			</div>
		);
	}

	return (
		<div className="trip-template-page-content">
			<div className="itinerary-and-suggestions-column bright-scrollbar">
				{renderItinerary()}
				<TripTemplateSidebarSuggestions />
			</div>
			{!eventStore.isMobile && renderMap()}
		</div>
	);
}

export default observer(TripTemplatePageContent);
