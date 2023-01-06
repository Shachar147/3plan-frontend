import React, { forwardRef, Ref, useContext, useImperativeHandle, useState } from 'react';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';
import { runInAction } from 'mobx';

interface TextAreaInputProps {
	modalValueName: string;
	ref?: any;

	wrapperClassName?: string;
	id?: string;
	name?: string;
	placeholder?: string;
	placeholderKey?: string;
	maxMenuHeight?: number;

	className?: string;
	rows?: number;
}
export interface TextAreaInputRef {
	getValue(): string;
}
function TextAreaInput(props: TextAreaInputProps, ref: Ref<TextAreaInputRef> | any) {
	const eventStore = useContext(eventStoreContext);
	const { wrapperClassName, id, name, placeholder, placeholderKey, modalValueName, className, rows } = props;
	const initialValue = eventStore.modalValues ? eventStore.modalValues[modalValueName] : undefined;
	const [value, setValue] = useState(initialValue);

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getValue: () => {
			return value;
		},
	}));

	return (
		<div className={getClasses('triplan-textarea-input', wrapperClassName)}>
			<textarea
				rows={rows || 3}
				id={id}
				name={name}
				className={getClasses(['textAreaInput'], className)}
				ref={ref}
				onChange={(e) => {
					setValue(e.target.value);
					runInAction(() => {
						eventStore.modalValues[modalValueName] = e.target.value;
					});
				}}
				placeholder={
					placeholder
						? placeholder
						: placeholderKey
						? TranslateService.translate(eventStore, placeholderKey)
						: undefined
				}
			>
				{value}
			</textarea>
		</div>
	);
}

export default observer(forwardRef<TextAreaInputRef, TextAreaInputProps>(TextAreaInput));
