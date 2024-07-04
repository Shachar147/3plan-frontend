import { EventStore, eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './triplan-search.scss';
import TextInput from '../../inputs/text-input/text-input';
import { getClasses } from '../../../utils/utils';

interface TriplanSearchProps {
	isHidden?: boolean;
	value?: string;
	onChange?: (e: string) => void;
	placeholder?: string;
	className?: string;
}

function TriplanSearch(props: TriplanSearchProps) {
	const { isHidden = false, value, onChange } = props;
	const eventStore = useContext(eventStoreContext);
	return (
		<div className={getClasses('search-container', isHidden && 'hidden', props.className)}>
			<TextInput
				modalValueName={'fc-search'}
				type={'text'}
				name={'fc-search'}
				value={value ?? eventStore.searchValue}
				onChange={(e) => {
					if (onChange) {
						onChange(e.target.value);
					} else {
						eventStore.setSearchValue(e.target.value);
					}
				}}
				placeholder={props.placeholder ?? TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
			/>
		</div>
	);
}

export default observer(TriplanSearch);
