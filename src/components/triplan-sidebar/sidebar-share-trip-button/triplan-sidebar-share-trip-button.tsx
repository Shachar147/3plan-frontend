import Button, { ButtonFlavor } from '../../common/button/button';
import { getClasses } from '../../../utils/utils';
import ReactModalService from '../../../services/react-modal-service';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';

interface TriplanSidebarShareTripButtonProps {
	isMoveAble: boolean;
	className?: string;
	textKey: string;
}

const TriplanSidebarShareTripButton = (props: TriplanSidebarShareTripButtonProps) => {
	const eventStore = useContext(eventStoreContext);

	const { isMoveAble = true, className, textKey = 'SHARE_TRIP' } = props;
	return (
		<Button
			flavor={isMoveAble ? ButtonFlavor['movable-link'] : ButtonFlavor.link}
			className={getClasses('black', className)}
			onClick={() => {
				ReactModalService.openShareTripModal(eventStore);
			}}
			text={TranslateService.translate(eventStore, textKey)}
			icon="fa-users"
			disabled={eventStore.isSharedTrip}
			disabledReason={TranslateService.translate(eventStore, 'ONLY_TRIP_OWNER_CAN_SHARE_TRIP')}
		/>
	);
};

export default observer(TriplanSidebarShareTripButton);
