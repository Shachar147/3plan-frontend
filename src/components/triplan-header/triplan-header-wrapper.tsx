import React, { useContext } from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { eventStoreContext } from '../../stores/events-store';
import MobileMenu from './mobile-menu/mobile-menu';
import MobileHeader from '../mobile-header/mobile-header';
import TriplanSearch from './triplan-search/triplan-search';

function TriplanHeaderWrapper(props: TriplanHeaderProps) {
	const navigate = useNavigate();
	const eventStore = useContext(eventStoreContext);

	if (eventStore.isMobile){
		return (
			<>
				<MobileHeader {...props} />
				<TriplanSearch isHidden={!eventStore.isSearchOpen} />
			</>)
	}

	return (
		<div className="triplan-header-spacer padding-20" style={{ width: '100%' }}>
			<TriplanHeader onLogoClick={() => navigate('/')} onMyTripsClick={() => navigate('/my-trips')} {...props} />
		</div>
	);
}

// @ts-ignore
export default observer(TriplanHeaderWrapper);
