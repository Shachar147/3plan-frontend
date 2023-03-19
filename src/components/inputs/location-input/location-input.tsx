import TextInput, { TextInputProps, TextInputRef } from '../text-input/text-input';
import React, { Ref, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';

function LocationInput(props: TextInputProps, ref: Ref<TextInputRef> | any) {
	const [showIcon, setShowIcon] = useState(false);
	const eventStore = useContext(eventStoreContext);

	useEffect(() => {
		// @ts-ignore
		// console.log('here', 'changed', eventStore.modalValues['location']);

		// @ts-ignore
		const shouldShow =
			eventStore.modalValues['location'] &&
			eventStore.modalValues['location']['latitude'] &&
			eventStore.modalValues['location']['longitude'];
		setShowIcon(shouldShow);

		// @ts-ignore
	}, [eventStore.forceUpdate]); // Empty array ensures that effect is only run on mount

	// console.log('value', props.modalValueName, eventStore.modalValues['selectedLocation']);

	// console.log({
	// 	modalValues: eventStore.modalValues,
	// 	props,
	// 	value: eventStore.modalValues[props.modalValueName]?.address,
	// });

	return (
		<div key={`location-input-${eventStore.modalValues[props.modalValueName]?.address}`}>
			<TextInput
				id={`location-${eventStore.forceUpdate}`}
				{...props}
				value={eventStore.modalValues[props.modalValueName]?.address}
				icon={showIcon ? 'fa fa-map-marker' : undefined}
			/>
		</div>
	);
}

export default observer(LocationInput);
