import ToggleButton from '../../toggle-button/toggle-button';
import { AdminViewMode, ViewMode } from '../../../utils/enums';
import { getViewSelectorOptions, SELECT_STYLE, ViewOption } from '../../../utils/ui-utils';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import Select from 'react-select';

import './triplan-view-selector.scss';

interface TriplanViewSelectorProps {
	value?: AdminViewMode;
	setViewMode?: (viewMode: AdminViewMode) => void;
	options?: ViewOption[];
}

function TriplanViewSelector(props?: TriplanViewSelectorProps) {
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
					options={props?.options ?? options}
					value={props?.value ?? selectedViewModeOption}
					onChange={(e: any) => {
						if (props?.setViewMode) {
							props.setViewMode(e.value);
						} else {
							eventStore.setViewMode(e.value);
						}
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
				value={props?.value ?? eventStore.viewMode}
				onChange={(newVal) =>
					props?.setViewMode
						? props.setViewMode(newVal as unknown as ViewMode)
						: eventStore.setViewMode(newVal as ViewMode)
				}
				options={props?.options ?? getViewSelectorOptions(eventStore)}
				useActiveButtons={false}
				customStyle="white"
			/>
		</div>
	);
}

export default observer(TriplanViewSelector);
