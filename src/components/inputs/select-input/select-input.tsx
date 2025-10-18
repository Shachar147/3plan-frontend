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
	required?: boolean;
}
export interface SelectInputRef {
	getValue(): SelectInputOption;
	isValid(): boolean;
}
function SelectInput(props: SelectInputProps, ref: Ref<SelectInputRef> | any) {
	const eventStore = useContext(eventStoreContext);
	const { wrapperClassName, readOnly, id, name, options, placeholderKey, modalValueName, maxMenuHeight, required } =
		props;
	const initialValue = props.value ?? (eventStore.modalValues ? eventStore.modalValues[modalValueName] : undefined);
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		if (modalValueName) {
			setValue(eventStore.modalValues[modalValueName]);
		}
	}, [eventStore.modalValues?.[modalValueName]]);

	// Check if field is invalid (required but empty)
	const isInvalid = required && (!value || !value.value);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
		isValid: () => {
			return !required || (value && value.value);
		},
	}));

	// Use CSS classes for validation instead of inline styles
	const customStyles = {
		...SELECT_STYLE,
		control: (provided: any, state: any) => {
			const baseStyles = SELECT_STYLE.control ? SELECT_STYLE.control(provided) : provided;
			return {
				...baseStyles,
				// Let CSS handle the styling via classes
			};
		},
	};

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
			styles={customStyles}
			menuPortalTarget={props.menuPortalTarget ?? document.body}
			menuPlacement="auto"
			aria-invalid={isInvalid}
			className={getClasses(isInvalid ? 'react-select--is-invalid' : '')}
		/>
	);

	return (
		<div className={getClasses(!props.removeDefaultClass && 'triplan-selector', wrapperClassName)}>{content}</div>
	);
}

export default observer(forwardRef<SelectInputRef, SelectInputProps>(SelectInput));
