import { eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import { observer, Observer } from 'mobx-react';
import Select from 'react-select';
import React, { useContext } from 'react';
import { SELECT_STYLE } from '../../../utils/ui-utils';
import './language-selector.scss';
import { getClasses } from '../../../utils/utils';

function LanguageSelector() {
	const eventStore = useContext(eventStoreContext);

	const options: any[] = [
		{ label: TranslateService.translate(eventStore, 'ENGLISH').toString(), value: 'en', direction: 'ltr' },
		{ label: TranslateService.translate(eventStore, 'HEBREW').toString(), value: 'he', direction: 'rtl' },
	];
	const currentLanguage = options.find((x) => x.value == eventStore.calendarLocalCode);

	return (
		<div className={getClasses('language-selector main-font', currentLanguage.direction)}>
			<a>
				{/*<i className="fa fa-globe darkest-blue-color" aria-hidden="true"></i>*/}
				<img alt="" src={'/images/landing-page/icons/choose-lang.png'} />
				{TranslateService.translate(eventStore, 'CHOOSE_LANGUAGE')}
			</a>
			<Select
				key={`locale-selector-${eventStore.calendarLocalCode}`}
				isClearable={false}
				isSearchable={false}
				id={'locale-selector'}
				name={'locale-selector'}
				options={options}
				value={currentLanguage}
				onChange={(e: any) => {
					eventStore.setCalendarLocalCode(e.value);
				}}
				maxMenuHeight={45 * 5}
				styles={SELECT_STYLE}
			/>
		</div>
	);
}

export default observer(LanguageSelector);
