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

	enforceMinMax?: boolean;
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
		placeholderKey,
		modalValueName,
		className,
		onClick,
		onKeyUp,
		placeholder,
		enforceMinMax = false,
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

	// TODO for some reason placeholder not working well on mobile, need to fix.
	const handleFocus = (event: any) => {
		if (eventStore.isMobile) return;
		event.target.type = 'datetime-local';
		event.target.value = '';
	};

	// TODO for some reason placeholder not working well on mobile, need to fix.
	const handleBlur = (event: any) => {
		if (eventStore.isMobile) return;
		if (!event.target.value) {
			event.target.type = 'text';
			event.target.value = props.placeholder || 'YYYY-MM-DDTHH:MM';
		}
	};

	return (
		<div className={getClasses('triplan-date-picker-input', wrapperClassName)}>
			<input
				id={id}
				name={name}
				className={getClasses(['datePickerInput'], className)}
				ref={ref}
				type={eventStore.isMobile ? 'datetime-local' : 'text'}
				value={value}
				onClick={(e) => {
					onClick && onClick();
					handleFocus(e);
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
				min={enforceMinMax ? `${eventStore.customDateRange.start}T00:00` : undefined}
				max={enforceMinMax ? `${eventStore.customDateRange.end}T23:59` : undefined}
				onFocus={handleFocus}
				onBlur={handleBlur}
			/>
		</div>
	);
}

export default observer(forwardRef<DatePickerRef, DatePickerProps>(DatePicker));
