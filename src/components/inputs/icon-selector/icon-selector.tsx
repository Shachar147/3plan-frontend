import React, { useContext, useEffect, useImperativeHandle, useState } from 'react';
import { icons } from './icons';
import Select from 'react-select';
import { eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import './icon-selector.scss';
import { SELECT_STYLE } from '../../../utils/ui-utils';

export interface IconSelectorProps {
	id?: string;
	name?: string;
	value?: string;
	onChange?: (data: any) => void;
	modalValueName: string;
	disabled?: boolean;
	className?: string;
	readOnly?: boolean;
}
const IconSelector = (props: IconSelectorProps, ref: any) => {
	const optionsList = icons.map((icon) => ({
		value: icon.text,
		label: icon.icon,
	}));

	const initialSelectedOption = props.value ? optionsList.find((x) => x.label === props.value) : undefined;

	const [selectedOption, setSelectedOptions] = useState(initialSelectedOption);
	const eventStore = useContext(eventStoreContext);

	useEffect(() => {
		eventStore.modalValues[props.modalValueName] = selectedOption;
	}, [selectedOption]);

	const handleSelect = (data: any) => {
		setSelectedOptions(data);

		if (props.onChange) {
			props.onChange(data);
		}
	};

	const content = props.readOnly ? (
		selectedOption?.label ?? '-'
	) : (
		<Select
			isClearable
			isSearchable
			id={props.id}
			name={props.name}
			options={optionsList}
			placeholder={TranslateService.translate(eventStore, 'SELECT_ICON_PLACEHOLDER')}
			value={selectedOption}
			onChange={handleSelect}
			maxMenuHeight={42 * 3}
			styles={SELECT_STYLE}
			ref={ref}
			isDisabled={props.disabled || props.readOnly}
			className={props.className}
		/>
	);

	return <div className={'icon-selector'}>{content}</div>;
};

export default React.forwardRef(IconSelector);
