import React, { forwardRef, Ref, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { getClasses } from '../../../utils/utils';
import Select from 'react-select';
import TranslateService from '../../../services/translate-service';
import { SELECT_STYLE } from '../../../utils/ui-utils';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

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
	onClear?: () => any;
	removeDefaultClass?: boolean;
	value?: any;
	isClearable?: boolean;
	menuPortalTarget?: any;
}
export interface SelectInputRef {
	getValue(): SelectInputOption;
}
function SelectInput(props: SelectInputProps, ref: Ref<SelectInputRef> | any) {
	const eventStore = useContext(eventStoreContext);
	const { wrapperClassName, readOnly, id, name, options, placeholderKey, modalValueName, maxMenuHeight } = props;
	const initialValue = props.value ?? (eventStore.modalValues ? eventStore.modalValues[modalValueName] : undefined);
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		if (modalValueName) {
			setValue(eventStore.modalValues[modalValueName]);
		}
	}, [eventStore.modalValues?.[modalValueName]]);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
	}));

	const content = props.readOnly ? (
		value?.label ?? '-'
	) : (
		<Select
			ref={ref}
			isClearable={props.isClearable ?? !readOnly}
			isSearchable={!readOnly}
			isDisabled={readOnly}
			id={id}
			name={name}
			options={options}
			placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined}
			value={value}
			onChange={(data, triggeredAction) => {
				runInAction(() => {
					eventStore.modalValues[modalValueName] = data;
				});
				setValue(data);

				if (triggeredAction.action === 'clear' && props.onClear) {
					props.onClear();
				} else if (props.onChange) {
					props.onChange(data);
				}
			}}
			maxMenuHeight={maxMenuHeight ?? 45 * 5}
			styles={SELECT_STYLE}
			menuPortalTarget={props.menuPortalTarget ?? document.body}
			menuPlacement={"auto"}
		/>
	);

	return (
		<div className={getClasses(!props.removeDefaultClass && 'triplan-selector', wrapperClassName)}>{content}</div>
	);
}

export default observer(forwardRef<SelectInputRef, SelectInputProps>(SelectInput));
