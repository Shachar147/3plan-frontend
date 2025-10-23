import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { EventStore } from '../../../stores/events-store';
import { SuggestedCombination, SidebarEvent } from '../../../utils/interfaces';
import { TriplanPriority } from '../../../utils/enums';
import TranslateService from '../../../services/translate-service';
import MapContainer from '../../map-container/map-container';
import { CombinationsService } from '../../../services/combinations-service';
import './sidebar-suggested-combinations.scss';

interface SidebarSuggestedCombinationsProps {
	eventStore: EventStore;
}

export const SidebarSuggestedCombinations: React.FC<SidebarSuggestedCombinationsProps> = observer(({ eventStore }) => {
	const [expandedCombinations, setExpandedCombinations] = useState<Set<string>>(new Set());
	const [shownCombinationIds, setShownCombinationIds] = useState<Set<string>>(new Set());
	const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);

	const toggleExpanded = (combinationId: string) => {
		const newExpanded = new Set(expandedCombinations);
		if (newExpanded.has(combinationId)) {
			newExpanded.delete(combinationId);
		} else {
			newExpanded.add(combinationId);
		}
		setExpandedCombinations(newExpanded);
	};

	const generateMoreCombinations = () => {
		if (isGeneratingMore) return; // Prevent multiple clicks

		// Get all current combinations and mark them as shown
		const currentCombinations = eventStore.suggestedCombinations;
		const newShownIds = new Set(Array.from(shownCombinationIds).concat(currentCombinations.map((c) => c.id)));
		setShownCombinationIds(newShownIds);

		// Generate new combinations excluding the shown ones
		const allSidebarEvents = Object.values(eventStore.sidebarEvents).flat();
		CombinationsService.generateMoreCombinations(
			allSidebarEvents,
			eventStore.calendarEvents,
			eventStore.distanceResults,
			eventStore.categories,
			newShownIds,
			eventStore
		)
			.then((newCombinations) => {
				if (newCombinations.length > 0) {
					// Add new combinations to existing ones
					eventStore.setSuggestedCombinations([...currentCombinations, ...newCombinations]);
				}
			})
			.finally(() => {
				setIsGeneratingMore(false);
			});
	};

	const formatDuration = (minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0 && mins > 0) {
			return `${hours}h ${mins}m`;
		} else if (hours > 0) {
			return `${hours}h`;
		} else {
			return `${mins}m`;
		}
	};

	const getEventDuration = (event: SidebarEvent): number => {
		if (!event.duration) {
			return 60; // Default 1 hour
		}

		const durationStr = event.duration.toLowerCase();
		let totalMinutes = 0;

		// First check for "XX:YY" format (e.g., "09:45")
		const timeFormatMatch = durationStr.match(/^(\d{1,2}):(\d{2})$/);
		if (timeFormatMatch) {
			const hours = parseInt(timeFormatMatch[1]);
			const minutes = parseInt(timeFormatMatch[2]);
			totalMinutes = hours * 60 + minutes;
			return totalMinutes;
		}

		// Parse duration string (e.g., "2h 30m", "90m", "1.5h")
		// Extract hours
		const hourMatch = durationStr.match(/(\d+(?:\.\d+)?)h/);
		if (hourMatch) {
			totalMinutes += parseFloat(hourMatch[1]) * 60;
		}

		// Extract minutes
		const minuteMatch = durationStr.match(/(\d+)m/);
		if (minuteMatch) {
			totalMinutes += parseInt(minuteMatch[1]);
		}

		return totalMinutes || 60; // Default to 1 hour if parsing fails
	};

	const getPriorityColor = (priority: TriplanPriority | string | undefined): string => {
		const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
		switch (priorityNum) {
			case TriplanPriority.must:
				return '#E06666FF';
			case TriplanPriority.high:
				return '#d2105b';
			case TriplanPriority.maybe:
				return '#ffb752';
			default:
				return '#b4b4b4';
		}
	};

	const getCombinationTitle = (combination: SuggestedCombination): string => {
		if (combination.suggestedName.startsWith('ACTIVITIES_IN_AREA:')) {
			const mustActivityName = combination.suggestedName.replace('ACTIVITIES_IN_AREA:', '');
			return TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.ACTIVITIES_IN_AREA', {
				MUST_ACTIVITY_NAME: mustActivityName,
			});
		}
		return combination.suggestedName;
	};

	const getCategoryEmoji = (event: SidebarEvent): string => {
		const category = eventStore.categories.find((c) => c.id.toString() === event.category);
		return category?.icon || '';
	};

	const renderCombinationCard = (combination: SuggestedCombination) => {
		const isExpanded = expandedCombinations.has(combination.id);
		const mustCount = combination.events.filter((e) => {
			const priority = typeof e.priority === 'string' ? parseInt(e.priority) : e.priority;
			return priority === TriplanPriority.must;
		}).length;
		const totalTravelTime = combination.travelTimeBetween.reduce((sum, time) => {
			const validTime = isNaN(time) ? 0 : time;
			return sum + validTime;
		}, 0);

		return (
			<div
				key={combination.id}
				className={`combination-card fc-event ${combination.hasScheduledEvents ? 'has-scheduled-events' : ''}`}
				draggable={true}
				title={getCombinationTitle(combination)}
				data-combination-id={combination.id}
				data-combination-events={JSON.stringify(combination.events.map((e) => e.id))}
				data-combination-id-prop={combination.id}
			>
				<div className="combination-header" onClick={() => toggleExpanded(combination.id)}>
					<div className="combination-title">
						<h4>{getCombinationTitle(combination)}</h4>
						{combination.hasScheduledEvents && (
							<span
								className="warning-badge"
								title={TranslateService.translate(
									eventStore,
									'SUGGESTED_COMBINATIONS.CONTAINS_SCHEDULED'
								)}
							>
								⚠️
							</span>
						)}
					</div>
					<div className="combination-meta">
						<span className="event-count">
							{TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.EVENT_COUNT', {
								COUNT: combination.events.length,
							})}
						</span>
						<span className="total-time">
							🕐{' '}
							{(() => {
								const duration = isNaN(combination.totalDuration) ? 0 : combination.totalDuration;
								/*console.log(
									'Debug - combination totalDuration:',
									combination.totalDuration,
									'formatted:',
									formatDuration(duration)
								);*/
								return formatDuration(duration);
							})()}
						</span>
						{totalTravelTime > 0 && (
							<span className="travel-time">
								{combination.travelModeBetween && combination.travelModeBetween.includes('WALKING')
									? '🚶‍♂️'
									: '🚗'}{' '}
								{TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.TRAVEL_TIME', {
									TIME: formatDuration(totalTravelTime),
								})}
							</span>
						)}
					</div>
					{/* <div className="combination-priority">
						{mustCount > 1 && (
							<span className="must-count" title={`${mustCount} must-see activities`}>
								⭐ {mustCount}
							</span>
						)}
					</div> */}
					<div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>
				</div>

				{isExpanded && (
					<div className="combination-events">
						{combination.events.map((event, index) => (
							<div key={event.id} className="combination-event">
								<div
									className="event-priority-dot"
									style={{
										backgroundColor: getPriorityColor(event.priority || TriplanPriority.unset),
									}}
								/>
								<span className="event-title">
									{getCategoryEmoji(event)}&nbsp;{event.title}
								</span>
								<div className="event-duration">🕒 {formatDuration(getEventDuration(event))}</div>
								{index < combination.events.length - 1 && combination.travelTimeBetween[index] > 0 && (
									<div className="travel-indicator">
										{combination.travelModeBetween[index] === 'WALKING' ? '🚶‍♂️' : '🚗'}{' '}
										{formatDuration(combination.travelTimeBetween[index])}
									</div>
								)}
							</div>
						))}

						{/* Small map showing all locations with numbers */}
						<div className="combination-map">
							<MapContainer
								events={
									combination.events.map((event) => ({
										...event,
										start: new Date(),
										end: new Date(),
										allDay: false,
									})) as any
								}
								noHeader={true}
								noFilters={true}
								isReadOnly={true}
								zoom={13}
								isItineraryView={true}
								hideVisibleItems={true}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	const combinations = eventStore.suggestedCombinationsComputed;

	if (combinations.length === 0) {
		return (
			<div className="sidebar-suggested-combinations">
				<div className="no-combinations">
					<p>{TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.NO_COMBINATIONS')}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="sidebar-suggested-combinations">
			<div className="combinations-list external-events">{combinations.map(renderCombinationCard)}</div>
			<div className="more-combinations-section">
				<button
					className="more-combinations-btn"
					onClick={() => {
						setIsGeneratingMore(true);
						setTimeout(() => {
							generateMoreCombinations();
						}, 1000);
					}}
					disabled={combinations.length >= 50 || isGeneratingMore} // Disable if at limit or generating
				>
					{isGeneratingMore ? (
						<>
							<span className="loader">⏳</span>
							{TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.GENERATING_MORE')}
						</>
					) : combinations.length >= 50 ? (
						TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.MAXIMUM_REACHED')
					) : (
						TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.MORE_COMBINATIONS')
					)}
				</button>
			</div>
		</div>
	);
});
