import React, { useContext } from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { eventStoreContext } from '../../stores/events-store';
import MobileMenu from './mobile-menu/mobile-menu';
import MobileHeader from '../mobile-header/mobile-header';
import TriplanSearch from './triplan-search/triplan-search';
import { getClasses, ucfirst } from '../../utils/utils';
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';

function TriplanHeaderWrapper(props: TriplanHeaderProps) {
	const navigate = useNavigate();
	const eventStore = useContext(eventStoreContext);

	if (eventStore.isMobile) {
		return (
			<>
				<MobileHeader {...props} />
				<div className={getClasses('mobile-trip-name', eventStore.isMenuOpen && 'no-z-index')}>
					{/*{TranslateService.translate(eventStore, 'YOU_ARE_LOOKING_AT')} {eventStore.tripName}*/}
					<EllipsisWithTooltip placement="bottom">
						{ucfirst(eventStore.tripName.replaceAll('-', ' '))}
					</EllipsisWithTooltip>
				</div>
				<TriplanSearch isHidden={!eventStore.isSearchOpen} />
			</>
		);
	}

	return (
		<div className="triplan-header-spacer padding-20" style={{ width: '100%' }}>
			<TriplanHeader onLogoClick={() => navigate('/')} onMyTripsClick={() => navigate('/my-trips')} {...props} />
		</div>
	);
}

// @ts-ignore
export default observer(TriplanHeaderWrapper);
