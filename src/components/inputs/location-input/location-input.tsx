import TextInput, { TextInputProps, TextInputRef } from '../text-input/text-input';
import React, { Ref, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import './location-input.scss';

function LocationInput(props: TextInputProps, ref: Ref<TextInputRef> | any) {
	const [showIcon, setShowIcon] = useState(false);
	const eventStore = useContext(eventStoreContext);

	useEffect(() => {
		const shouldShow =
			eventStore.modalValues[props.modalValueName]?.['latitude'] &&
			eventStore.modalValues[props.modalValueName]?.['longitude'];

		setShowIcon(shouldShow);
	}, [eventStore.forceUpdate]);

	return (
		<div
			className={'location-input-container'}
			key={`location-input-${eventStore.modalValues[props.modalValueName]?.address}`}
		>
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
