import React, { useContext } from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { eventStoreContext } from '../../stores/events-store';
import MobileHeader from '../mobile-header/mobile-header';
import TriplanSearch from './triplan-search/triplan-search';
import { getClasses, ucfirst } from '../../utils/utils';
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import { ViewMode } from '../../utils/enums';
import TranslateService from '../../services/translate-service';

interface TriplanHeaderWrapperProps extends TriplanHeaderProps {
	currentMobileView: ViewMode;
}

function TriplanHeaderWrapper(props: TriplanHeaderWrapperProps) {
	const navigate = useNavigate();
	const eventStore = useContext(eventStoreContext);
	let { withSearch, currentMobileView } = props;

	if (eventStore.isMobile) {
		let showing, from;
		if (currentMobileView === ViewMode.calendar) {
			showing = eventStore.filteredCalendarEvents.length;
			from = eventStore.calendarEvents.length;
		} else if (currentMobileView === ViewMode.sidebar) {
			showing = eventStore.allFilteredSidebarEvents.length;
			from = eventStore.allSidebarEvents.length;
		}

		if (currentMobileView === ViewMode.map) {
			withSearch = false;
		}

		return (
			<>
				<MobileHeader {...props} withSearch={withSearch} />
				<div className={getClasses('mobile-trip-name', eventStore.isMenuOpen && 'no-z-index')}>
					{/*{TranslateService.translate(eventStore, 'YOU_ARE_LOOKING_AT')} {eventStore.tripName}*/}
					<EllipsisWithTooltip placement="bottom">
						{ucfirst(eventStore.tripName.replaceAll('-', ' '))}
					</EllipsisWithTooltip>
				</div>
				<div className="mobile-header-search-container">
					{withSearch && <TriplanSearch isHidden={!eventStore.isSearchOpen} />}
					{showing != null &&
						from != null &&
						eventStore.searchValue &&
						TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y')
							.replace('{0}', showing.toString())
							.replace('{1}', from.toString())}
				</div>
			</>
		);
	}

	return (
		<div className="triplan-header-spacer padding-20" style={{ width: '100%' }}>
			<TriplanHeader onLogoClick={() => navigate('/')} onMyTripsClick={() => navigate('/my-trips')} {...props} />
		</div>
	);
}

export default observer(TriplanHeaderWrapper);
