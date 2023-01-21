import ToggleButton from '../../toggle-button/toggle-button';
import { ViewMode } from '../../../utils/enums';
import { getViewSelectorOptions, SELECT_STYLE } from '../../../utils/ui-utils';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import Select from 'react-select';

import './triplan-view-selector.scss';
function TriplanViewSelector() {
	const eventStore = useContext(eventStoreContext);
	if (eventStore.isMobile) {
		const options: any[] = getViewSelectorOptions(eventStore).map((option) => ({
			label: option.name,
			value: option.key,
			icon: option.icon,
		}));

		const selectedViewModeOption = options.find((option) => option.value == eventStore.viewMode);

		return (
			<div className="mobile-view-selector" key={`view-selector-${eventStore.calendarLocalCode}`}>
				<span className="mobile-view-selector-label">{selectedViewModeOption.icon}</span>
				<Select
					key={`view-selector-${eventStore.calendarLocalCode}`}
					isClearable={false}
					isSearchable={false}
					id={'view-selector'}
					name={'view-selector'}
					options={options}
					value={selectedViewModeOption}
					onChange={(e: any) => {
						eventStore.setViewMode(e.value);
					}}
					maxMenuHeight={45 * 5}
					styles={SELECT_STYLE}
				/>
			</div>
		);
	}
	return (
		<div className="view-selector" key={`view-selector-${eventStore.calendarLocalCode}`}>
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
