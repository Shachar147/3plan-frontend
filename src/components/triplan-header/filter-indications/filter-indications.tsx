import { EventStore, eventStoreContext } from '../../../stores/events-store';
import TriplanTag from '../../common/triplan-tag/triplan-tag';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { getClasses } from '../../../utils/utils';
import './filter-indications.scss';

interface FilterIndicationsProps {
	showOnlyEventsWithNoLocation?: boolean;
	showOnlyEventsWithNoOpeningHours?: boolean;
	showOnlyEventsWithTodoComplete?: boolean;
}
function FilterIndications(props: FilterIndicationsProps) {
	const eventStore = useContext(eventStoreContext);
	const showOnlyEventsWithNoLocation = props.showOnlyEventsWithNoLocation ?? eventStore.showOnlyEventsWithNoLocation;
	const showOnlyEventsWithNoOpeningHours =
		props.showOnlyEventsWithNoOpeningHours ?? eventStore.showOnlyEventsWithNoOpeningHours;
	const showOnlyEventsWithTodoComplete =
		props.showOnlyEventsWithTodoComplete ?? eventStore.showOnlyEventsWithTodoComplete;

	let totalFilters = 0;
	if (showOnlyEventsWithNoLocation) totalFilters += 1;
	if (showOnlyEventsWithNoOpeningHours) totalFilters += 1;
	if (showOnlyEventsWithTodoComplete) totalFilters += 1;

	if (totalFilters === 0) {
		return null;
	}

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
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_NO_OPENING_HOURS.FILTER_TAG')}
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
		</div>
	);
}

export default observer(FilterIndications);
