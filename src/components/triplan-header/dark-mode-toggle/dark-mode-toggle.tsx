import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import Button, { ButtonFlavor } from '../../common/button/button';
import TranslateService from '../../../services/translate-service';

function DarkModeToggle() {
	const eventStore = useContext(eventStoreContext);

	if (eventStore.isMobile) {
		return null;
	}

	return (
		<Button
			icon={eventStore.isDarkMode ? 'fa-sun-o' : 'fa-moon-o'}
			text={
				eventStore.isDarkMode
					? TranslateService.translate(eventStore, 'TO_LIGHT_MODE')
					: TranslateService.translate(eventStore, 'TO_DARK_MODE')
			}
			className="dark-mode-toggle"
			onClick={() => eventStore.toggleDarkMode()}
			flavor={ButtonFlavor.link}
		/>
	);
}

export default observer(DarkModeToggle);
