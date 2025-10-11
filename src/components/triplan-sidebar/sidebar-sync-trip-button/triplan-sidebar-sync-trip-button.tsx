import Button, { ButtonFlavor } from '../../common/button/button';
import { getClasses } from '../../../utils/utils';
import ReactModalService from '../../../services/react-modal-service';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';

interface TriplanSidebarSyncTripButtonProps {
	isMoveAble: boolean;
	className?: string;
	textKey: string;
}

const TriplanSidebarSyncTripButton = (props: TriplanSidebarSyncTripButtonProps) => {
	const eventStore = useContext(eventStoreContext);

	const { isMoveAble = true, className, textKey = 'SYNC_TRIP_TO_REMOTE' } = props;
	return (
		<Button
			flavor={isMoveAble ? ButtonFlavor['movable-link'] : ButtonFlavor.link}
			className={getClasses('black', className)}
			onClick={() => {
				ReactModalService.openSyncTripModal(eventStore, textKey);
			}}
			text={TranslateService.translate(eventStore, textKey)}
			icon="fa-refresh"
		/>
	);
};

export default observer(TriplanSidebarSyncTripButton);
