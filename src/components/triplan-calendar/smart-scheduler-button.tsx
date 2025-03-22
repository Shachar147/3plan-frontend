import React, { useContext, useState } from 'react';
import { eventStoreContext } from '../../stores/events-store';
import Button, { ButtonFlavor } from '../common/button/button';
import TranslateService from '../../services/translate-service';
import { generateSmartSchedule } from '../../utils/smart-scheduler';
import { CalendarEvent, SidebarEvent } from '../../utils/interfaces';
import { runInAction, toJS } from 'mobx';
import ReactModalService from '../../services/react-modal-service';
import { observer } from 'mobx-react';

const SmartSchedulerButton: React.FC = () => {
	const eventStore = useContext(eventStoreContext);
	const [isScheduling, setIsScheduling] = useState(false);

	// Check if there are sidebar events to schedule
	const hasSidebarEvents = Object.values(eventStore.sidebarEvents).some((events) => events && events.length > 0);

	// Check if we have valid calendar events
	const hasCalendarEvents = eventStore.calendarEvents.length > 0;

	// Check if we have a valid date range
	const hasValidDateRange =
		eventStore.customDateRange && eventStore.customDateRange.start && eventStore.customDateRange.end;

	// Function to move calendar events back to sidebar
	const moveCalendarEventsToSidebar = () => {
		// Get all calendar events that aren't special events (like hotel starts)
		const eventsToMove = eventStore.calendarEvents.filter(
			(event) => !event.id.includes('_morning_') // Filter out hotel start events
		);

		// Create deep copies to avoid modifying mobx objects directly
		const eventsCopy = JSON.parse(JSON.stringify(eventsToMove));

		// Move events back to sidebar
		runInAction(() => {
			// For each event, add it back to the appropriate sidebar category
			eventsCopy.forEach((event: CalendarEvent) => {
				const categoryId = typeof event.category === 'string' ? parseInt(event.category, 10) : event.category;

				if (categoryId) {
					// Create a sidebar version of the event
					const sidebarEvent: SidebarEvent = {
						...event,
						// Remove calendar-specific properties that don't exist in SidebarEvent
						id: event.id,
						title: event.title,
						description: event.description,
						category: event.category,
						duration: event.duration,
						openingHours: event.openingHours,
						priority: event.priority,
						preferredTime: event.preferredTime,
						location: event.location,
						images: event.images,
					};

					// Initialize the array if it doesn't exist
					if (!eventStore.sidebarEvents[categoryId]) {
						eventStore.sidebarEvents[categoryId] = [];
					}

					// Add to sidebar if not already there
					const exists = eventStore.sidebarEvents[categoryId].some((e) => e.id === event.id);
					if (!exists) {
						eventStore.sidebarEvents[categoryId].push(sidebarEvent);
					}
				}
			});

			// Remove all events from calendar
			eventStore.setCalendarEvents([]);
		});
	};

	// Function to perform the actual scheduling
	const executeSmartSchedule = async (resetCalendar: boolean) => {
		setIsScheduling(true);

		try {
			// Create a deep copy of sidebar events to avoid modifying the originals
			// Important: Use toJS to properly detach from MobX observables
			const sidebarEventsCopy = toJS(eventStore.sidebarEvents);

			// Get existing calendar events if we're not resetting
			let existingCalendarEvents: CalendarEvent[] = [];
			if (!resetCalendar && hasCalendarEvents) {
				existingCalendarEvents = toJS(eventStore.calendarEvents);
			}

			// Use the smart scheduler to generate a schedule
			const scheduledEvents = await generateSmartSchedule(
				eventStore,
				sidebarEventsCopy,
				eventStore.customDateRange
			);

			if (scheduledEvents && scheduledEvents.length > 0) {
				runInAction(() => {
					// Create a map of scheduled event IDs for quick lookup
					const scheduledIds = new Set(scheduledEvents.map((event) => event.id));

					// Prepare the updated calendar events
					let updatedCalendarEvents: CalendarEvent[];
					if (resetCalendar) {
						updatedCalendarEvents = [...scheduledEvents];
					} else {
						updatedCalendarEvents = [...existingCalendarEvents, ...scheduledEvents];
					}

					// Set the updated calendar events
					eventStore.setCalendarEvents(updatedCalendarEvents);

					// Update sidebar events by removing scheduled ones
					Object.keys(eventStore.sidebarEvents).forEach((categoryIdStr) => {
						const categoryId = parseInt(categoryIdStr, 10);
						if (eventStore.sidebarEvents[categoryId]) {
							// Filter out the events that were scheduled
							const updatedSidebarEvents = eventStore.sidebarEvents[categoryId].filter(
								(event) => !scheduledIds.has(event.id)
							);

							// Update the sidebar category with the filtered events
							eventStore.sidebarEvents[categoryId] = updatedSidebarEvents;
						}
					});

					// Save the updated sidebar events
					eventStore.setSidebarEvents(eventStore.sidebarEvents);
				});

				ReactModalService.openConfirmModal(
					eventStore,
					() => {}, // Empty callback as required prop
					'SMART_SCHEDULER.MODAL_TITLE',
					'SMART_SCHEDULER.SUCCESS',
					'MODALS.OK',
					{ count: scheduledEvents.length }
				);
			} else {
				ReactModalService.openConfirmModal(
					eventStore,
					() => {}, // Empty callback as required prop
					'SMART_SCHEDULER.MODAL_TITLE',
					'SMART_SCHEDULER.NO_EVENTS_SCHEDULED',
					'MODALS.OK'
				);
			}
		} catch (error) {
			console.error('Smart scheduling error:', error);
			ReactModalService.openConfirmModal(
				eventStore,
				() => {}, // Empty callback as required prop
				'SMART_SCHEDULER.MODAL_TITLE',
				'SMART_SCHEDULER.ERROR',
				'MODALS.OK'
			);
		} finally {
			setIsScheduling(false);
		}
	};

	// Main handler for the button click
	const handleSmartSchedule = () => {
		if (!hasSidebarEvents || !hasValidDateRange) {
			// Show error message if no date range or no sidebar events
			ReactModalService.openConfirmModal(
				eventStore,
				() => {}, // Empty callback as required prop
				'SMART_SCHEDULER.MODAL_TITLE',
				!hasSidebarEvents ? 'SMART_SCHEDULER.NO_EVENTS_SCHEDULED' : 'SMART_SCHEDULER.NO_DATE_RANGE',
				'MODALS.OK'
			);
			return;
		}

		// If there are already events in the calendar, we need to ask the user what to do
		if (hasCalendarEvents) {
			// Create custom modal content with both buttons
			const modalContent = (
				<div>
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'SMART_SCHEDULER.CONFIRMATION_TEXT'),
						}}
					/>
					<div className="modal-buttons mt-20">
						<button
							className="btn secondary-button mr-10"
							onClick={() => {
								ReactModalService.internal.closeModal(eventStore);
								executeSmartSchedule(true);
							}}
						>
							{TranslateService.translate(eventStore, 'SMART_SCHEDULER.RESET_AND_RESCHEDULE')}
						</button>
						<button
							className="btn primary-button"
							onClick={() => {
								ReactModalService.internal.closeModal(eventStore);
								executeSmartSchedule(false);
							}}
						>
							{TranslateService.translate(eventStore, 'SMART_SCHEDULER.CONFIRM')}
						</button>
					</div>
				</div>
			);

			// Open modal with custom content
			ReactModalService.internal.openModal(eventStore, {
				title: TranslateService.translate(eventStore, 'SMART_SCHEDULER.MODAL_TITLE'),
				content: modalContent,
				showConfirmButton: false,
				showCancelButton: true,
				cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
				onCancel: () => ReactModalService.internal.closeModal(eventStore),
			});
		} else {
			// If no existing events, show standard confirmation
			ReactModalService.openConfirmModal(
				eventStore,
				() => executeSmartSchedule(false),
				'SMART_SCHEDULER.MODAL_TITLE',
				'SMART_SCHEDULER.CONFIRMATION_TEXT',
				'SMART_SCHEDULER.CONFIRM'
			);
		}
	};

	return (
		<Button
			flavor={ButtonFlavor.secondary}
			icon="fa-magic"
			isLoading={isScheduling}
			onClick={handleSmartSchedule}
			text={TranslateService.translate(eventStore, 'SMART_SCHEDULER.BUTTON_TEXT')}
			className="smart-scheduler-button"
			disabled={!hasSidebarEvents || !hasValidDateRange || eventStore.isTripLocked}
			disabledReason={
				eventStore.isTripLocked
					? TranslateService.translate(eventStore, 'TRIP_IS_LOCKED')
					: !hasSidebarEvents
					? TranslateService.translate(eventStore, 'SMART_SCHEDULER.NO_EVENTS')
					: !hasValidDateRange
					? TranslateService.translate(eventStore, 'SMART_SCHEDULER.NO_DATE_RANGE')
					: undefined
			}
		/>
	);
};

export default observer(SmartSchedulerButton);
