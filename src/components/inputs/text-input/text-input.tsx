import React, { forwardRef, Ref, useContext, useImperativeHandle, useState } from 'react';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';

interface TextInputProps {
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
	disabled?: boolean;
	icon?: string;

	value?: string | number;
	error?: boolean;

	onChange?: (e: any) => void;
	onKeyDown?: (e: any) => void;
	type?: 'text' | 'password' | 'number';
	onlyInput?: boolean;
	key?: string;
}
export interface TextInputRef {
	getValue(): string;
}
function TextInput(props: TextInputProps, ref: Ref<TextInputRef> | any) {
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
		disabled,
		icon,
		error,
		type,
		onlyInput,
		key,
		autoComplete = 'true',
	} = props;
	const initialValue = props.value
		? props.value
		: eventStore.modalValues
		? eventStore.modalValues[modalValueName]
		: undefined;
	const [value, setValue] = useState(initialValue);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
	}));

	const icon_block = !icon ? undefined : (
		<i data-testid={`data-test-id-${modalValueName}`} className={`${icon} icon`} />
	);
	const style = error ? { border: '1px solid var(--red)' } : undefined;

	const input = (
		<input
			key={key}
			id={id}
			name={name}
			className={getClasses(['textInput'], className)}
			ref={ref}
			type={type || 'text'}
			value={value}
			onKeyDown={props.onKeyDown}
			onClick={() => {
				onClick && onClick();
			}}
			onKeyUp={() => {
				onKeyUp && onKeyUp();
			}}
			onChange={(e) => {
				setValue(e.target.value);
				eventStore.modalValues[modalValueName] = e.target.value;
				props.onChange && props.onChange(e);
			}}
			placeholder={
				placeholder
					? placeholder
					: placeholderKey
					? TranslateService.translate(eventStore, placeholderKey)
					: undefined
			}
			autoComplete={autoComplete}
			disabled={disabled}
			style={style}
		/>
	);

	if (onlyInput) return input;

	return (
		<div className={getClasses('triplan-text-input', wrapperClassName)}>
			{icon_block}
			{input}
		</div>
	);
}

export default observer(forwardRef<TextInputRef, TextInputProps>(TextInput));
