import React, { useContext } from 'react';
import TriplanSearch from '../../triplan-header/triplan-search/triplan-search';
import TranslateService from '../../../services/translate-service';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';

function SidebarSearch() {
	const eventStore = useContext(eventStoreContext);

	return (
		<div className="sidebar-search-container">
			<TriplanSearch
				value={eventStore.sidebarSearchValue}
				onChange={(val: any) => eventStore.setSidebarSearchValue(val)}
				placeholder={TranslateService.translate(eventStore, 'SIDEBAR_SEARCH_PLACEHOLDER')}
				resetCallback={() => {
					eventStore.setSidebarSearchValue('');
				}}
			/>
		</div>
	);
}

export default observer(SidebarSearch);
