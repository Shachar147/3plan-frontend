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

export interface TriplanHeaderProps {
	withLogo?: boolean;
	withMyTrips?: boolean;
	withSearch?: boolean;
	withViewSelector?: boolean;
	withFilterTags?: boolean;
	withLoginLogout?: boolean;
	onLogoClick?: () => any;
	onMyTripsClick?: () => any;
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
	} = options;

	const eventStore = useContext(eventStoreContext);
	const isRtl = eventStore.calendarLocalCode === 'he';
	// const navigate = useNavigate();

	return (
		<div className={getClasses('triplan-header', isRtl ? 'rtl' : 'ltr')}>
			<LanguageSelector />
			<div className={'triplan-header-actionbar'}>{withViewSelector && <TriplanViewSelector />}</div>
			<div className={getClasses('triplan-header-starter', !isRtl && 'flex-row-reverse')}>
				{withMyTrips && <MyTrips onClick={onMyTripsClick} />}
				{withLoginLogout && <LoginLogout />}
				{withLogo && <TriplanLogo onClick={onLogoClick} />}
			</div>
			{/*<div className="end-side">*/}
			{/*    {withFilterTags && renderFilterTags(eventStore)}*/}
			{/*    {withSearch && renderSearch(eventStore)}*/}
			{/*    {withViewSelector && renderViewSelector(eventStore)}*/}
			{/*    {(withMyTrips || withLoginLogout || withLogo) &&*/}
			{/*        renderMyTrips(eventStore, withMyTrips, withLoginLogout, withLogo, navigate)}*/}
			{/*</div>*/}
		</div>
	);
}

export default observer(TriplanHeader);
