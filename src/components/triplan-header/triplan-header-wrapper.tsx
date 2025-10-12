import React, { useContext } from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { eventStoreContext } from '../../stores/events-store';
import MobileHeader from '../mobile-header/mobile-header';
import TriplanSearch from './triplan-search/triplan-search';
import { ViewMode } from '../../utils/enums';
import TranslateService from '../../services/translate-service';
import { getClasses } from '../../utils/utils';
import { myTripsTabId } from '../../v2/utils/consts';
import { FeatureFlagsService } from '../../utils/feature-flags';
import { rootStoreContext } from '../../v2/stores/root-store';

interface TriplanHeaderWrapperProps extends TriplanHeaderProps {
	currentMobileView?: ViewMode;
	showTripName?: boolean;
	adminMode?: boolean;
}

function TriplanHeaderWrapper(props: TriplanHeaderWrapperProps) {
	const navigate = useNavigate();
	const eventStore = useContext(eventStoreContext);
	const rootStore = useContext(rootStoreContext);
	let { withSearch, currentMobileView, showTripName } = props;

	if (eventStore.isMobile) {
		return null;

		let showing, from;
		if (currentMobileView === ViewMode.calendar) {
			showing = eventStore.filteredCalendarEvents.length;
			from = eventStore.calendarEvents.length;
		} else if (currentMobileView === ViewMode.sidebar) {
			showing = eventStore.allFilteredSidebarEvents.length;
			from = eventStore.allSidebarEvents.length;
		}

		if (currentMobileView === ViewMode.map) {
			// withSearch = false;
		}

		return (
			<>
				<MobileHeader {...props} withSearch={withSearch} showTripName={showTripName} />
				<div
					className={getClasses(
						'mobile-header-search-container',
						!eventStore.isSearchOpen && 'search-closed'
					)}
				>
					{withSearch && (
						<TriplanSearch
							isHidden={!eventStore.isSearchOpen}
							placeholder={TranslateService.translate(eventStore, 'GENERAL_SEARCH_PLACEHOLDER')}
						/>
					)}
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

	const homeUrl = props.adminMode ? '/admin' : '/';

	return (
		<div className="triplan-header-spacer padding-20" style={{ width: '100%' }}>
			<TriplanHeader
				onLogoClick={() => navigate(homeUrl)}
				onMyTripsClick={() => {
					if (FeatureFlagsService.isNewDesignEnabled()) {
						rootStore.navigateToTab(myTripsTabId);
					} else {
						navigate('/my-trips');
					}
				}}
				{...props}
			/>
		</div>
	);
}

export default observer(TriplanHeaderWrapper);
