import { EventStore, eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './triplan-search.scss';
import TextInput from '../../inputs/text-input/text-input';

function TriplanSearch() {
	const eventStore = useContext(eventStoreContext);
	return (
		<div className={'search-container'}>
			<TextInput
				type={'text'}
				name={'fc-search'}
				value={eventStore.searchValue}
				onChange={(e) => {
					eventStore.setSearchValue(e.target.value);
				}}
				placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
			/>
		</div>
	);
}

export default observer(TriplanSearch);
