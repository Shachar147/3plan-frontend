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
	showOnlyEventsWithDistanceProblems?: boolean;
	showOnlyEventsWithOpeningHoursProblems?: boolean;
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
		
	const showOnlyEventsWithSpecificSidebarPriorities = !!Array.from(eventStore.filterSidebarPriorities.values()).length;
	const showOnlyEventsWithSpecificSidebarCategories = !!Array.from(eventStore.filterSidebarCategories.values()).length;
	const showOnlyEventsWithSpecificSidebarPreferredTimes = !!Array.from(eventStore.filterSidebarPreferredTimes.values()).length;

	const showOnlyEventsWithDistanceProblems =
		props.showOnlyEventsWithDistanceProblems ?? eventStore.showOnlyEventsWithDistanceProblems;

	const showOnlyEventsWithOpeningHoursProblems =
		props.showOnlyEventsWithOpeningHoursProblems ?? eventStore.showOnlyEventsWithOpeningHoursProblems;

	let totalFilters = 0;
	if (showOnlyEventsWithOpeningHoursProblems) totalFilters += 1;
	if (showOnlyEventsWithDistanceProblems) totalFilters += 1;
	if (showOnlyEventsWithNoLocation) totalFilters += 1;
	if (showOnlyEventsWithNoOpeningHours) totalFilters += 1;
	if (showOnlyEventsWithTodoComplete) totalFilters += 1;
	if (showOnlyEventsWithSpecificPriorities) totalFilters += 1;
	if (showOnlyEventsWithSpecificSidebarPriorities) totalFilters += 1;
	if (showOnlyEventsWithSpecificSidebarCategories) totalFilters += 1;
	if (showOnlyEventsWithSpecificSidebarPreferredTimes) totalFilters += 1;
	if (eventStore.hideScheduled) totalFilters += 1;
	if (eventStore.hideUnScheduled) totalFilters += 1;

	function renderSingleFilter() {
		return (
			<div className={getClasses('filter-tags-container flex-row gap-8', eventStore.isRtl && 'direction-rtl')}>
				{showOnlyEventsWithOpeningHoursProblems && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_OPENING_HOURS_PROBLEMS.FILTER_TAG'
						)}
						onDelete={() => {
							eventStore.setShowOnlyEventsWithOpeningHoursProblems(false);
						}}
					/>
				)}
				{showOnlyEventsWithDistanceProblems && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_DISTANCE_PROBLEMS.FILTER_TAG'
						)}
						onDelete={() => {
							eventStore.setShowOnlyEventsWithDistanceProblems(false);
						}}
					/>
				)}
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
				{showOnlyEventsWithSpecificSidebarPriorities && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_SPECIFIC_SIDEBAR_PRIORITIES.FILTER_TAG'
						)}
						onDelete={() => {
							runInAction(() => {
								eventStore.filterSidebarPriorities = observable.map({});
							});
						}}
					/>
				)}
				{showOnlyEventsWithSpecificSidebarCategories && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_SPECIFIC_CATEGORIES.FILTER_TAG'
						)}
						onDelete={() => {
							runInAction(() => {
								eventStore.filterSidebarCategories = observable.map({});
							});
						}}
					/>
				)}
				{showOnlyEventsWithSpecificSidebarPreferredTimes && (
					<TriplanTag
						text={TranslateService.translate(
							eventStore,
							'SHOW_ONLY_EVENTS_WITH_SPECIFIC_PREFERRED_TIMES.FILTER_TAG'
						)}
						onDelete={() => {
							runInAction(() => {
								eventStore.filterSidebarPreferredTimes = observable.map({});
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
						eventStore.setShowOnlyEventsWithOpeningHoursProblems(false);
						eventStore.setShowOnlyEventsWithDistanceProblems(false);
						eventStore.setShowOnlyEventsWithNoOpeningHours(false);
						eventStore.setShowOnlyEventsWithTodoComplete(false);
						eventStore.setShowOnlyEventsWithNoLocation(false);

						runInAction(() => {
							eventStore.filterOutPriorities = observable.map({});
							eventStore.filterSidebarPriorities = observable.map({});
							eventStore.filterSidebarCategories = observable.map({});
							eventStore.filterSidebarPreferredTimes = observable.map({});
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
