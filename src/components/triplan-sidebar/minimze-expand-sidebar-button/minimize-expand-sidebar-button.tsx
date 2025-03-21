import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import Button, { ButtonFlavor } from '../../common/button/button';
import { runInAction } from 'mobx';
import TranslateService from '../../../services/translate-service';
import { getClasses } from '../../../utils/utils';
import { observer } from 'mobx-react';

function MinimizeExpandSidebarButton() {
	const eventStore = useContext(eventStoreContext);
	if (eventStore.isMobile) {
		return null;
	}

	const direction = eventStore.isSidebarMinimized
		? eventStore.getCurrentDirectionEnd()
		: eventStore.getCurrentDirectionStart();

	return (
		<div className="flex-row min-height-40 align-items-center justify-content-center minimize-sidebar-container">
			<Button
				flavor={ButtonFlavor.secondary}
				onClick={() => {
					runInAction(() => {
						eventStore.isSidebarMinimized = !eventStore.isSidebarMinimized;
					});
				}}
				tooltip={TranslateService.translate(
					eventStore,
					eventStore.isSidebarMinimized ? 'MAXIMIZE_SIDEBAR' : 'MINIMIZE_SIDEBAR'
				)}
				className={getClasses('black', 'min-width-38')}
				icon={`fa-angle-double-${direction}`}
				text="" /* :after     content: '\26F6'; */
			/>
		</div>
	);
}

export default observer(MinimizeExpandSidebarButton);
