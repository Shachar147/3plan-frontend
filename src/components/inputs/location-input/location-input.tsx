import TextInput, { TextInputProps, TextInputRef } from '../text-input/text-input';
import React, { Ref, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import './location-input.scss';
import TranslateService from '../../../services/translate-service';
import { ViewMode } from '../../../utils/enums';
import ReactModalService from '../../../services/react-modal-service';
import Button, { ButtonFlavor } from '../../common/button/button';

interface LocationInputProps extends TextInputProps {
	showOnMapLink?: boolean;
	eventId?: number;
}

function LocationInput(props: LocationInputProps, ref: Ref<TextInputRef> | any) {
	const [showIcon, setShowIcon] = useState(false);
	const eventStore = useContext(eventStoreContext);

	useEffect(() => {
		const shouldShow =
			eventStore.modalValues[props.modalValueName]?.['latitude'] &&
			eventStore.modalValues[props.modalValueName]?.['longitude'];

		setShowIcon(shouldShow);
	}, [eventStore.forceUpdate]);

	const address = eventStore.modalValues[props.modalValueName]?.address ?? '-';

	const content = props.readOnly ? (
		<div className="flex-row gap-4 text-align-left align-items-start">
			<div>{address}</div>
			{showIcon && (
				<i data-testid={`data-test-id-${props.modalValueName}`} className={`fa fa-map-marker margin-top-3`} />
			)}
		</div>
	) : (
		<TextInput
			id={`location-${eventStore.forceUpdate}`}
			{...props}
			value={eventStore.modalValues[props.modalValueName]?.address}
			icon={showIcon ? 'fa fa-map-marker' : undefined}
		/>
	);

	return (
		<div
			className="location-input-container flex-column"
			key={`location-input-${eventStore.modalValues[props.modalValueName]?.address}`}
		>
			{content}
			{props.showOnMapLink && props.eventId && showIcon && (
				<Button
					flavor={ButtonFlavor.link}
					className="show-on-map-link"
					onClick={() => {
						ReactModalService.internal.closeModal(eventStore);
						eventStore.setViewMode(ViewMode.map);
						eventStore.setMobileViewMode(ViewMode.map);
						eventStore.showEventOnMap = props.eventId!;
					}}
					text={TranslateService.translate(eventStore, 'SHOW_ON_MAP')}
				/>
			)}
		</div>
	);
}

export default observer(LocationInput);
