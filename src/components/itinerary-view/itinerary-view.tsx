import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../stores/events-store';
import { getClasses } from '../../utils/utils';
import MapContainer from '../map-container/map-container';
import { CalendarEvent } from '../../utils/interfaces';
import { formatDate } from '../../utils/time-utils';
import './itinerary-view.scss';
import TranslateService from '../../services/translate-service';
import { runInAction } from 'mobx';

interface ItineraryViewProps {
	events: CalendarEvent[];
}

function ItineraryView({ events }: ItineraryViewProps) {
	const eventStore = useContext(eventStoreContext);
	const [selectedDay, setSelectedDay] = useState(0);

	// Group events by day
	const eventsByDay = events.reduce((acc, event) => {
		const date = formatDate(new Date(event.start));
		if (!acc[date]) {
			acc[date] = [];
		}
		acc[date].push(event);
		return acc;
	}, {} as Record<string, CalendarEvent[]>);

	// Sort days by actual date, not string representation
	const days = Object.keys(eventsByDay).sort((a, b) => {
		const [dayA, monthA, yearA] = a.split('/').map(Number);
		const [dayB, monthB, yearB] = b.split('/').map(Number);
		const dateA = new Date(yearA, monthA - 1, dayA);
		const dateB = new Date(yearB, monthB - 1, dayB);
		return dateA.getTime() - dateB.getTime();
	});

	if (days.length === 0) {
		return null;
	}

	// Sort events by start time for the current day
	const currentDayEvents = [...(eventsByDay[days[selectedDay]] || [])].sort((a, b) => {
		return new Date(a.start).getTime() - new Date(b.start).getTime();
	});

	const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
		e.currentTarget.src = '/images/no-image-fallback.png';
	};

	const formatTime = (dateStr: Date | string) => {
		const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	};

	// const formatDuration = (duration: number | string | undefined) => {
	//   if (!duration) return '';
	//   const durationNum = typeof duration === 'string' ? parseInt(duration, 10) : duration;
	//   const hours = Math.floor(durationNum / 60).toString().padStart(2, '0');
	//   const minutes = (durationNum % 60).toString().padStart(2, '0');
	//   return `${hours}:${minutes}`;
	// };

	const formatDuration = (duration) => {
		if (!duration) return null;

		const [hours, minutes] = duration.split(':').map(Number);
		if (hours == 24) {
			return TranslateService.translate(eventStore, 'ONE_DAY');
		}
		if (hours > 24) {
			return TranslateService.translate(eventStore, 'X_DAYS', { X: Math.ceil(hours / 24) });
		}

		if (hours === 0 && minutes > 0) return TranslateService.translate(eventStore, 'X_MINUTES', { X: minutes });
		if (hours === 1 && minutes === 0) return TranslateService.translate(eventStore, 'ONE_HOUR');
		if (hours > 0 && minutes === 0) return TranslateService.translate(eventStore, 'X_HOURS', { X: hours });
		if (hours === 1 && minutes === 30) return TranslateService.translate(eventStore, 'ONE_AND_A_HALF_HOUR');
		if (hours > 0 && minutes === 30)
			return TranslateService.translate(eventStore, 'X_AND_A_HALF_HOURS', { X: hours });
		if (hours > 0 && minutes > 0)
			return TranslateService.translate(eventStore, 'X_HOURS_Y_MINUTES', { X: hours, Y: minutes });

		return TranslateService.translate(eventStore, 'X_HOURS');
	};

	const viewClasses = getClasses('itinerary-view', eventStore.isMobile && 'mobile', eventStore.isHebrew && 'hebrew');

	let idxCounter = 0;

	return (
		<div className={viewClasses}>
			{/* Day tabs */}
			<div className="day-tabs-wrapper">
				<div className="day-tabs">
					{days.map((day, index) => (
						<button
							key={day}
							className={getClasses('day-tab', selectedDay === index && 'active')}
							onClick={() => setSelectedDay(index)}
						>
							<span className="day-number">Day {index + 1}</span>
							<span className="day-date">{day}</span>
						</button>
					))}
				</div>
			</div>

			{/* Map and list container */}
			<div className="content-container">
				{/* Map section */}
				<div className="map-section">
					<MapContainer
						key={`${selectedDay}-${eventStore.showEventOnMap}`}
						events={currentDayEvents}
						showNumbers={true}
						isItineraryView={true}
						noHeader={true}
						noFilters={true}
					/>
				</div>

				{/* List section */}
				<div className="list-section bright-scrollbar">
					{currentDayEvents.map((event, index) => (
						<div
							key={event.id}
							className={getClasses('event-card', eventStore.isHebrew && 'direction-rtl')}
						>
							{event.allDay ? (
								<div className="event-number">!</div>
							) : (
								<div className="event-number">{++idxCounter}</div>
							)}
							<div className="event-content">
								<div className="event-text">
									<h3 className="event-title">{event.title}</h3>
									{event.description && <p className="event-description">{event.description}</p>}
									<div className="event-details">
										{event.start && event.end && !event.allDay && (
											<div className="event-time">
												<i className="fa fa-clock-o" aria-hidden="true" />
												<span>
													{formatTime(event.start)} - {formatTime(event.end)}
												</span>
											</div>
										)}
										{event.duration && !event.allDay && (
											<div className="event-duration">
												<i className="fa fa-hourglass-half" aria-hidden="true" />
												<span>{formatDuration(event.duration)}</span>
											</div>
										)}
									</div>
								</div>
								{event.images && (
									<div className="event-image-wrapper">
										<img
											src={event.images.split(',')[0]}
											alt={event.title}
											className="event-image"
											onError={handleImageError}
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default observer(ItineraryView);
