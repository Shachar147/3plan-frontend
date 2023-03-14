import { EventStore, eventStoreContext } from '../../../stores/events-store';
import TriplanTag from '../../common/triplan-tag/triplan-tag';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { getClasses } from '../../../utils/utils';
import './filter-indications.scss';
import { observable, runInAction } from 'mobx';

interface FilterIndicationsProps {
	showOnlyEventsWithNoLocation?: boolean;
	showOnlyEventsWithNoOpeningHours?: boolean;
	showOnlyEventsWithTodoComplete?: boolean;
	showOnlyEventsWithSpecificPriorities?: boolean;
}
function FilterIndications(props: FilterIndicationsProps) {
	const eventStore = useContext(eventStoreContext);
	const showOnlyEventsWithNoLocation = props.showOnlyEventsWithNoLocation ?? eventStore.showOnlyEventsWithNoLocation;
	const showOnlyEventsWithNoOpeningHours =
		props.showOnlyEventsWithNoOpeningHours ?? eventStore.showOnlyEventsWithNoOpeningHours;
	const showOnlyEventsWithTodoComplete =
		props.showOnlyEventsWithTodoComplete ?? eventStore.showOnlyEventsWithTodoComplete;

	const showOnlyEventsWithSpecificPriorities =
		props.showOnlyEventsWithSpecificPriorities ?? !!Array.from(eventStore.filterOutPriorities.values()).length;

	let totalFilters = 0;
	if (showOnlyEventsWithNoLocation) totalFilters += 1;
	if (showOnlyEventsWithNoOpeningHours) totalFilters += 1;
	if (showOnlyEventsWithTodoComplete) totalFilters += 1;
	if (showOnlyEventsWithSpecificPriorities) totalFilters += 1;
	if (eventStore.hideScheduled) totalFilters += 1;
	if (eventStore.hideUnScheduled) totalFilters += 1;

	function renderSingleFilter() {
		return (
			<div className={getClasses('filter-tags-container flex-row gap-8', eventStore.isRtl && 'direction-rtl')}>
				{showOnlyEventsWithNoLocation && (
					<TriplanTag
						text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION.FILTER_TAG')}
						onDelete={() => {
							eventStore.setShowOnlyEventsWithNoLocation(false);
						}}
					/>
				)}
				{showOnlyEventsWithNoOpeningHours && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_NO_OPENING_HOURS.FILTER_TAG'
						)}
						onDelete={() => {
							eventStore.setShowOnlyEventsWithNoOpeningHours(false);
						}}
					/>
				)}
				{showOnlyEventsWithTodoComplete && (
					<TriplanTag
						text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_TODO_COMPLETE.FILTER_TAG')}
						onDelete={() => {
							eventStore.setShowOnlyEventsWithTodoComplete(false);
						}}
					/>
				)}
				{showOnlyEventsWithSpecificPriorities && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_SPECIFIC_PRIORITIES.FILTER_TAG'
						)}
						onDelete={() => {
							runInAction(() => {
								eventStore.filterOutPriorities = observable.map({});
							});
						}}
					/>
				)}
				{eventStore.hideScheduled && (
					<TriplanTag
						text={TranslateService.translate(eventStore, 'HIDE_SCHEDULED_EVENTS.FILTER_TAG')}
						onDelete={() => {
							runInAction(() => {
								eventStore.hideScheduled = false;
							});
						}}
					/>
				)}
				{eventStore.hideUnScheduled && (
					<TriplanTag
						text={TranslateService.translate(eventStore, 'HIDE_UNSCHEDULED_EVENTS.FILTER_TAG')}
						onDelete={() => {
							runInAction(() => {
								eventStore.hideUnScheduled = false;
							});
						}}
					/>
				)}
			</div>
		);
	}

	if (totalFilters === 0) {
		return null;
	}
	if (totalFilters === 1) {
		return renderSingleFilter();
	} else {
		return (
			<div className={getClasses('filter-tags-container flex-row gap-8', eventStore.isRtl && 'direction-rtl')}>
				<TriplanTag
					text={TranslateService.translate(eventStore, 'FILTER_INDICATIONS.MULTIPLE_FILTERS').replace(
						'{{num}}',
						totalFilters.toString()
					)}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithNoOpeningHours(false);
						eventStore.setShowOnlyEventsWithTodoComplete(false);
						eventStore.setShowOnlyEventsWithNoLocation(false);

						runInAction(() => {
							eventStore.filterOutPriorities = observable.map({});
							eventStore.hideUnScheduled = false;
							eventStore.hideScheduled = false;
						});
					}}
				/>
			</div>
		);
	}
}

export default observer(FilterIndications);
