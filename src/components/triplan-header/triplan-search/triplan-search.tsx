import { EventStore, eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import './triplan-search.scss';
import TextInput from '../../inputs/text-input/text-input';
import { getClasses } from '../../../utils/utils';
import ReactDOM from 'react-dom';

import Autosuggest from 'react-autosuggest';

interface TriplanSearchProps {
	isHidden?: boolean;
	value?: string;
	onChange?: (e: string) => void;
	placeholder?: string;
	withSuggestions?: boolean; // todo complete: finish. not completely ready
}

import { debounce } from 'lodash';

function TriplanSearch(props: TriplanSearchProps) {
	const { isHidden = false, value, onChange, withSuggestions = false } = props;
	const eventStore = useContext(eventStoreContext);
	const [searchValue, setSearchValue] = useState(value ?? eventStore.searchValue);

	const [suggestions, setSuggestions] = useState([]);

	const getSuggestions = (value: string) => {
		return eventStore.allEventsComputed
			.filter((suggestion) => suggestion.title.toLowerCase().includes(value.toLowerCase()))
			.map((x) => x.title);
	};
	const renderSuggestion = (title: number) => {
		const icon = eventStore.isRtl ? '↲' : '↳';
		// const suggestion = eventStore.allEventsComputed.find((x) => x.id.toString() === suggestionId.toString())!;
		// const calendarEvent = eventStore.calendarEvents.find((x) => x.id.toString() === suggestionId.toString());
		const calendarEvent = undefined;
		const where = calendarEvent ? 'בלוח השנה' : 'בתפריט הפעילויות';
		return (
			<div className="flex-col padding-block-5">
				<span>{title}</span>
				<span>
					{icon} {where}
				</span>
			</div>
		);
	};

	const debouncedOnChange = debounce((value, onChange, eventStore) => {
		if (onChange) {
			onChange(value);
		} else {
			eventStore.setSearchValue(value);
		}
	}, 500);

	const renderSuggestionsContainer = ({ containerProps, children }) => (
		<div {...containerProps} className="search-suggestions-container bright-scrollbar">
			{children}
		</div>
	);

	return (
		<div className={getClasses('search-container', isHidden && 'hidden')}>
			{props.withSuggestions ? (
				<Autosuggest
					suggestions={suggestions}
					onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value))}
					onSuggestionsClearRequested={() => setSuggestions([])}
					getSuggestionValue={(suggestion: any) => suggestion}
					onSuggestionSelected={(event, { suggestionValue }) => {
						alert('here');
						const suggestion = eventStore.allEventsComputed.find(
							(x) => x.id.toString() === suggestionValue.toString()
						)!;
						const newValue = suggestion.title;
						setSearchValue(newValue);
						debouncedOnChange(newValue, onChange, eventStore);
					}}
					renderSuggestion={renderSuggestion}
					inputProps={{
						type: 'text',
						name: 'fc-search',
						value: searchValue,
						onChange: (e: any, { newValue }) => {
							setSearchValue(newValue);
							debouncedOnChange(newValue, onChange, eventStore);
						},
						placeholder: props.placeholder ?? TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER'),
					}}
					// appendTo="body"
					renderSuggestionsContainer={renderSuggestionsContainer}
					// renderSuggestionsContainer={({ containerProps, children }) =>
					// 	ReactDOM.createPortal(renderSuggestionsContainer({ containerProps, children }), document.body)
					// }
					suggestionsList="suggestions-list bright-scrollbar"
					alwaysRenderSuggestions
				/>
			) : (
				<TextInput
					type={'text'}
					name={'fc-search'}
					value={value ?? eventStore.searchValue}
					onChange={(e) => {
						debouncedOnChange(e.target.value, onChange, eventStore);
					}}
					placeholder={props.placeholder ?? TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
				/>
			)}
		</div>
	);
}

export default observer(TriplanSearch);
