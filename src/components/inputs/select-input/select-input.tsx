import React, { forwardRef, Ref, useContext, useImperativeHandle, useState } from 'react';
import { getClasses } from '../../../utils/utils';
import Select from 'react-select';
import TranslateService from '../../../services/translate-service';
import { SELECT_STYLE } from '../../../utils/ui-utils';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';

export interface SelectInputOption {
	value: string;
	label: string;
}
interface SelectInputProps {
	ref?: any;
	wrapperClassName?: string;
	readOnly?: boolean;
	id?: string;
	name?: string;
	options: SelectInputOption[];
	placeholderKey?: string;
	modalValueName: string;
	maxMenuHeight?: number;
	onChange?: (value: any) => any;
	removeDefaultClass?: boolean;
	value?: any;
}
export interface SelectInputRef {
	getValue(): SelectInputOption;
}
function SelectInput(props: SelectInputProps, ref: Ref<SelectInputRef> | any) {
	const eventStore = useContext(eventStoreContext);
	const { wrapperClassName, readOnly, id, name, options, placeholderKey, modalValueName, maxMenuHeight } = props;
	const initialValue = props.value ?? (eventStore.modalValues ? eventStore.modalValues[modalValueName] : undefined);
	const [value, setValue] = useState(initialValue);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
	}));

	return (
		<div className={getClasses(!props.removeDefaultClass && 'triplan-selector', wrapperClassName)}>
			<Select
				ref={ref}
				isClearable={!readOnly}
				isSearchable={!readOnly}
				isDisabled={readOnly}
				id={id}
				name={name}
				options={options}
				placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined}
				value={value}
				onChange={(data) => {
					eventStore.modalValues[modalValueName] = data;
					setValue(data);
					if (props.onChange) {
						props.onChange(data);
					}
				}}
				maxMenuHeight={maxMenuHeight || 45 * 5}
				styles={SELECT_STYLE}
			/>
		</div>
	);
}

export default observer(forwardRef<SelectInputRef, SelectInputProps>(SelectInput));
