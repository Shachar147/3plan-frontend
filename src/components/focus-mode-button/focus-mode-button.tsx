import TranslateService from '../../services/translate-service';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import './focus-mode-button.scss';
import Button, { ButtonFlavor } from '../common/button/button';

function FocusModeButton() {
	const eventStore = useContext(eventStoreContext);
	return (
		<Button
			flavor={ButtonFlavor.secondary}
			className="focus-mode-button brown"
			onClick={() => eventStore.toggleFocusMode()}
			text={TranslateService.translate(eventStore, eventStore.focusMode ? 'OUT_OF_FOCUS_MODE' : 'FOCUS_MODE')}
			icon="fa-expand"
		/>
	);
}

export default observer(FocusModeButton);
