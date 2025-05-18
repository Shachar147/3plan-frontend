import React, { useContext, useState } from 'react';
import { Observer } from 'mobx-react';
import { EventStore, eventStoreContext } from '../../../stores/events-store';
import { modalsStoreContext } from '../../../stores/modals-store';
import TranslateService from '../../../services/translate-service';
import ReactModalService, { ReactModalRenderHelper } from '../../../services/react-modal-service';
import { CalendarEvent, SidebarEvent } from '../../../utils/interfaces';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Image } from '../../../v2/components/point-of-interest/point-of-interest';
import { FaTrash, FaPen } from 'react-icons/fa';
import { runInAction } from 'mobx';

interface SaveTemplateModalProps {
	defaultTripName: string;
	onConfirm: () => void;
	addEventToSidebar: (event: SidebarEvent) => boolean;
	removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
	addToEventsToCategories: (event: SidebarEvent) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
	defaultTripName,
	onConfirm,
	addEventToSidebar,
	removeEventFromSidebarById,
	addToEventsToCategories,
}) => {
	const eventStore = useContext(eventStoreContext);
	const modalsStore = useContext(modalsStoreContext);
	const [currentCalendarSlides, setCurrentCalendarSlides] = useState<{ [id: string]: number }>({});
	const [currentSidebarSlides, setCurrentSidebarSlides] = useState<{ [id: string]: number }>({});
	const [calendarSearch, setCalendarSearch] = useState('');
	const [sidebarSearch, setSidebarSearch] = useState('');

	// Helper to parse images (string or array)
	const parseImages = (images: any): string[] => {
		if (!images) return [];
		if (Array.isArray(images)) return images;
		if (typeof images === 'string') {
			// Try to split by comma or whitespace
			if (images.includes(','))
				return images
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
			if (images.includes(' '))
				return images
					.split(' ')
					.map((s) => s.trim())
					.filter(Boolean);
			return [images];
		}
		return [];
	};

	const filterEvents = (events: (SidebarEvent | CalendarEvent)[], query: string) => {
		if (!query) return events;
		const q = query.toLowerCase();
		return events.filter(
			(e) =>
				(e.title && e.title.toLowerCase().includes(q)) ||
				(e.description && e.description.toLowerCase().includes(q))
		);
	};

	const filteredCalendarEvents = filterEvents(eventStore.calendarEvents, calendarSearch);
	const filteredSidebarEvents = filterEvents(eventStore.allSidebarEvents, sidebarSearch);

	return (
		<Observer>
			{() => (
				<div
					className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar"
					key={`save-template-modal-${eventStore.forceUpdate}`}
				>
					{ReactModalRenderHelper.renderInputWithLabel(
						eventStore,
						'MODALS.TITLE',
						ReactModalRenderHelper.renderTextInput(eventStore, 'template-name', {
							placeholderKey: 'TEMPLATE_NAME_PLACEHOLDER',
							id: 'template-name',
							value: defaultTripName,
						}),
						'border-top-gray border-bottom-gray padding-bottom-20'
					)}
					<div className="flex-col gap-10">
						<h3>
							{TranslateService.translate(eventStore, 'CALENDAR_EVENTS')} ({filteredCalendarEvents.length}
							)
						</h3>
						<input
							type="text"
							className="event-search-input"
							placeholder={TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH')}
							value={calendarSearch}
							onChange={(e) => setCalendarSearch(e.target.value)}
							style={{ marginBottom: 8, width: '100%' }}
						/>
						<div className="calendar-events-list bright-scrollbar">
							{filteredCalendarEvents
								.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
								.map((event) => {
									const images = parseImages(event.images);
									return (
										<div key={event.id} className="calendar-event-item">
											<div className="event-image-col">
												{images.length > 0 && (
													<Carousel
														showThumbs={false}
														showIndicators={false}
														infiniteLoop={true}
														selectedItem={currentCalendarSlides[event.id] || 0}
														onChange={(idx) =>
															setCurrentCalendarSlides((prev) => ({
																...prev,
																[event.id]: idx,
															}))
														}
														className="event-image-carousel"
													>
														{images.map((image, index) => (
															<div key={`calendar-${event.id}-image-${index}`}>
																<Image
																	image={image}
																	alt={event.title}
																	key={event.id + '-' + index}
																	idx={index}
																	isSmall={true}
																/>
															</div>
														))}
													</Carousel>
												)}
											</div>
											<div className="event-info-col">
												<div className="event-header">
													<span className="event-title">{event.title}</span>
													<span className="event-action-icons">
														<i
															className="fa fa-pencil edit-icon"
															title={TranslateService.translate(eventStore, 'EDIT')}
															onClick={() => {
																eventStore.isModalMinimized = false;
																modalsStore.switchToEditMode();
																ReactModalService.openEditCalendarEventModal(
																	eventStore,
																	addEventToSidebar,
																	{
																		event: {
																			...event,
																			start: new Date(event.start),
																			end: new Date(event.end),
																			_def: event,
																		},
																	},
																	modalsStore,
																	true
																);
															}}
														/>
														<i
															className="fa fa-trash delete-icon"
															title={TranslateService.translate(eventStore, 'DELETE')}
															onClick={async () => {
																await eventStore.deleteEvent(event.id);
																runInAction(() => {
																	eventStore.forceUpdate++;
																});
															}}
															// onClick={() => openDeleteCalendarEventModal(eventStore, event, () => {
															// 	void eventStore.deleteEvent(event.id);
															// }, true)}
														/>
													</span>
												</div>
												<div className="event-details">
													{event.description && <p>{event.description}</p>}
												</div>
											</div>
										</div>
									);
								})}
						</div>
					</div>
					<div className="flex-col gap-10">
						<h3>
							{TranslateService.translate(eventStore, 'SIDEBAR_EVENTS')} ({filteredSidebarEvents.length})
						</h3>
						<input
							type="text"
							className="event-search-input"
							placeholder={TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH')}
							value={sidebarSearch}
							onChange={(e) => setSidebarSearch(e.target.value)}
							style={{ marginBottom: 8, width: '100%' }}
						/>
						<div className="sidebar-events-list bright-scrollbar">
							{filteredSidebarEvents.map((event) => {
								const images = parseImages(event.images);
								return (
									<div key={event.id} className="sidebar-event-item">
										<div className="event-image-col">
											{images.length > 0 && (
												<Carousel
													showThumbs={false}
													showIndicators={false}
													infiniteLoop={true}
													selectedItem={currentSidebarSlides[event.id] || 0}
													onChange={(idx) =>
														setCurrentSidebarSlides((prev) => ({
															...prev,
															[event.id]: idx,
														}))
													}
													className="event-image-carousel"
												>
													{images.map((image, index) => (
														<div key={`sidebar-${event.id}-image-${index}`}>
															<Image
																image={image}
																alt={event.title}
																key={event.id + '-' + index}
																idx={index}
																isSmall={true}
															/>
														</div>
													))}
												</Carousel>
											)}
										</div>
										<div className="event-info-col">
											<div className="event-header">
												<span className="event-title">{event.title}</span>
												<span className="event-action-icons">
													<i
														className="fa fa-pencil edit-icon"
														title={TranslateService.translate(eventStore, 'EDIT')}
														onClick={() => {
															eventStore.isModalMinimized = false;
															modalsStore.switchToEditMode();
															ReactModalService.openEditSidebarEventModal(
																eventStore,
																event,
																removeEventFromSidebarById,
																addToEventsToCategories,
																modalsStore,
																true
															);
														}}
													/>
													<i
														className="fa fa-trash delete-icon"
														title={TranslateService.translate(eventStore, 'DELETE')}
														onClick={async () => {
															const newEvents: Record<number, SidebarEvent[]> = {
																...eventStore.sidebarEvents,
															};
															Object.keys(newEvents).forEach((category) => {
																const categoryId = Number(category);
																newEvents[categoryId] = newEvents[categoryId].filter(
																	(e) => e.id != event.id
																);
															});
															await eventStore.setSidebarEvents(newEvents);
														}}
													/>
												</span>
											</div>
											<div className="event-details">
												{event.description && <p>{event.description}</p>}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</Observer>
	);
};
