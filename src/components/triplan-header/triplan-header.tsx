import { eventStoreContext } from '../../stores/events-store';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import LanguageSelector from './language-selector/language-selector';
import './triplan-header.scss';
import { getClasses } from '../../utils/utils';
import LoginLogout from './login-logout/login-logout';
import TriplanLogo from './logo/triplan-logo';
import MyTrips from './my-trips/my-trips';
import TriplanViewSelector from './view-selector/triplan-view-selector';
import TriplanSearch from './triplan-search/triplan-search';
import FilterIndications from './filter-indications/filter-indications';
import TranslateService from '../../services/translate-service';

export interface TriplanHeaderProps {
	withLogo?: boolean;
	withMyTrips?: boolean;
	withSearch?: boolean;
	withViewSelector?: boolean;
	withFilterTags?: boolean;
	withLoginLogout?: boolean;
	onLogoClick?: () => any;
	onMyTripsClick?: () => any;
	showOnlyEventsWithNoLocation?: boolean; // shouldn't really pass them, only for storybook
	showOnlyEventsWithNoOpeningHours?: boolean; // shouldn't really pass them, only for storybook
	showOnlyEventsWithTodoComplete?: boolean; // shouldn't really pass them, only for storybook
	withLanguageSelector?: boolean;
	showTripName?: boolean;
}

function TriplanHeader(options: TriplanHeaderProps = {}) {
	const {
		withLogo = false,
		withMyTrips = true,
		withSearch = false,
		withFilterTags = false,
		withViewSelector = false,
		withLoginLogout = true,
		onLogoClick,
		onMyTripsClick,
		withLanguageSelector = true,
	} = options;

	const eventStore = useContext(eventStoreContext);

	return (
		<div className={getClasses('triplan-header', eventStore.isRtl ? 'rtl' : 'ltr')}>
			{withLanguageSelector && <LanguageSelector />}
			<div className={'triplan-header-actionbar'}>
				{withFilterTags && <FilterIndications {...options} />}
				<TriplanSearch
					isHidden={!withSearch}
					placeholder={TranslateService.translate(eventStore, 'GENERAL_SEARCH_PLACEHOLDER')}
				/>
				{withViewSelector && <TriplanViewSelector />}
			</div>
			<div className={getClasses('triplan-header-starter', !eventStore.isRtl && 'flex-row-reverse')}>
				{withMyTrips && <MyTrips onClick={onMyTripsClick} />}
				{withLoginLogout && <LoginLogout />}
				{withLogo && <TriplanLogo onClick={onLogoClick} />}
			</div>
		</div>
	);
}

export default observer(TriplanHeader);
