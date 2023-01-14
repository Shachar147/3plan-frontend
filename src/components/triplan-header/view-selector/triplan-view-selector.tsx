import ToggleButton from '../../toggle-button/toggle-button';
import { ViewMode } from '../../../utils/enums';
import { getViewSelectorOptions } from '../../../utils/ui-utils';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';

function TriplanViewSelector() {
	const eventStore = useContext(eventStoreContext);
	return (
		<div className={'view-selector'} key={`view-selector-${eventStore.calendarLocalCode}`}>
			<ToggleButton
				value={eventStore.viewMode}
				onChange={(newVal) => eventStore.setViewMode(newVal as ViewMode)}
				options={getViewSelectorOptions(eventStore)}
				customStyle="white"
			/>
		</div>
	);
}

export default observer(TriplanViewSelector);
