import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { CalendarEvent } from '../../../utils/interfaces';
import { observer } from 'mobx-react';
import { getEventDescription, getEventTitle } from '../../../utils/utils';
import { Image } from '../../components/point-of-interest/point-of-interest';
import { runInAction } from 'mobx';

function wrapLinks(text: string | undefined): React.ReactNode {
	if (!text) {
		return text;
	}

	// Regex to match URLs (basic version, can be improved for edge cases)
	const urlRegex = /(https?:\/\/[^\s]+)/g;

	// Split the text by URLs and map them
	const parts = text.split(urlRegex);

	return (
		<>
			{parts.map((part, index) =>
				urlRegex.test(part) ? (
					<a key={index} href={part} target="_blank" rel="noopener noreferrer">
						{part}
					</a>
				) : (
					<span key={index}>{part}</span>
				)
			)}
		</>
	);
}

function TripTemplateDay({
	events,
	baseClass,
	idx,
	counter,
}: {
	events: CalendarEvent[];
	baseClass: string;
	idx: number;
	counter: number;
}) {
	const eventStore = useContext(eventStoreContext);
	let notesCounter = 0;
	return (
		<div className={`${baseClass}-day-container`}>
			<h3 className={`${baseClass}-day-title`}>
				{TranslateService.translate(eventStore, 'DAY_X', { X: idx + 1 })}
			</h3>
			{events
				.filter((e) => e.title)
				.map((e, idx2) => {
					let description: React.JSX | undefined = wrapLinks(getEventDescription(e, eventStore, true));

					if (e.allDay) {
						notesCounter++;

						return (
							<div className={`${baseClass}-activity notes-background`}>
								<div className={`${baseClass}-activity-marker-icon`}>
									<i className="fa fa-map-marker blue-color" />
								</div>
								<div className={`${baseClass}-activity-content`}>
									<h4 className={`${baseClass}-activity-content-title`}>
										{getEventTitle(e, eventStore, true)}
									</h4>
									<div className={`${baseClass}-activity-content-description notes-description`}>
										{description}
									</div>
								</div>
							</div>
						);
					}

					function markActivityOnMap() {
						eventStore.showEventOnMap = Number(e.id);
						runInAction(() => {
							eventStore.forceMapReRender += 1;
						});
					}

					const categoryTagEng = eventStore.categories.find((c) => c.id == e.category).title;
					const categoryTag = TranslateService.translateFromTo(
						eventStore,
						categoryTagEng,
						{},
						'en',
						eventStore.calendarLocalCode
					);

					return (
						<div
							className={`${baseClass}-activity`}
							onClick={() => !eventStore.isMobile && markActivityOnMap()}
						>
							<div className={`${baseClass}-activity-marker-icon`}>
								<i className="fa fa-map-marker" />
								<span>{counter + idx2 + 1 - notesCounter}</span>
							</div>
							<Image
								className={`${baseClass}-activity-image`}
								image={e.images?.split('\n')?.[0] ?? '/images/no-image-fallback.png'}
								isSmall
								alt=""
								key={e.id + idx2}
								idx={`item-${e.id}-idx-${idx2}`}
								backgroundImage
							/>
							<div className={`${baseClass}-activity-content`}>
								<h2 className={`${baseClass}-activity-content-title`}>
									{getEventTitle(e, eventStore, true)}
								</h2>
								<div className={`${baseClass}-activity-category-tag`}>
									{categoryTag ?? categoryTagEng}
								</div>
								<div className={`${baseClass}-activity-content-description`}>{description}</div>
							</div>
						</div>
					);
				})}
		</div>
	);
}

export default observer(TripTemplateDay);
