import React, { forwardRef, Ref, useContext, useImperativeHandle, useState } from 'react';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';

interface DatePickerProps {
	modalValueName: string;
	ref?: any;

	wrapperClassName?: string;
	readOnly?: boolean;
	id?: string;
	name?: string;
	placeholder?: string;
	placeholderKey?: string;
	maxMenuHeight?: number;

	className?: string;
	onClick?: () => void;
	onKeyUp?: () => void;
	autoComplete?: string;
}
export interface DatePickerRef {
	getValue(): string;
}
function DatePicker(props: DatePickerProps, ref: Ref<DatePickerRef> | any) {
	const eventStore = useContext(eventStoreContext);
	const {
		wrapperClassName,
		id,
		name,
		placeholder,
		placeholderKey,
		modalValueName,
		className,
		onClick,
		onKeyUp,
		autoComplete = 'true',
	} = props;
	const initialValue = eventStore.modalValues ? eventStore.modalValues[modalValueName] : undefined;
	const [value, setValue] = useState(initialValue);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
	}));

	return (
		<div className={getClasses('triplan-date-picker-input', wrapperClassName)}>
			<input
				id={id}
				name={name}
				className={getClasses(['datePickerInput'], className)}
				ref={ref}
				type="datetime-local"
				value={value}
				onClick={() => {
					onClick && onClick();
				}}
				onKeyUp={() => {
					onKeyUp && onKeyUp();
				}}
				onChange={(e) => {
					setValue(e.target.value);
					eventStore.modalValues[modalValueName] = e.target.value;
				}}
				placeholder={
					placeholder
						? placeholder
						: placeholderKey
						? TranslateService.translate(eventStore, placeholderKey)
						: undefined
				}
				autoComplete={autoComplete}
			/>
		</div>
	);
}

export default observer(forwardRef<DatePickerRef, DatePickerProps>(DatePicker));
