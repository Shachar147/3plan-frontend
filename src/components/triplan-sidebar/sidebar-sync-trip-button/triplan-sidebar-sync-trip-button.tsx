import Button, { ButtonFlavor } from '../../common/button/button';
import { getClasses } from '../../../utils/utils';
import ReactModalService from '../../../services/react-modal-service';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { SyncMode } from '../../../utils/enums';

interface TriplanSidebarSyncTripButtonProps {
	isMoveAble: boolean;
	className?: string;
	mode: SyncMode;
}

const TriplanSidebarSyncTripButton = (props: TriplanSidebarSyncTripButtonProps) => {
	const eventStore = useContext(eventStoreContext);

	const { isMoveAble = true, className, mode } = props;
	const textKey = mode == SyncMode.localToRemote ? 'SYNC_TRIP_TO_REMOTE' : 'SYNC_TRIP_TO_LOCAL';
	return (
		<Button
			flavor={isMoveAble ? ButtonFlavor['movable-link'] : ButtonFlavor.link}
			className={getClasses('black', className)}
			onClick={() => {
				ReactModalService.openSyncTripModal(eventStore, mode);
			}}
			text={TranslateService.translate(eventStore, textKey)}
			icon="fa-refresh"
		/>
	);
};

export default observer(TriplanSidebarSyncTripButton);
