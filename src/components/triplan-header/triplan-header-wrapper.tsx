import React, { useContext } from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { eventStoreContext } from '../../stores/events-store';
import MobileMenu from './mobile-menu/mobile-menu';

function TriplanHeaderWrapper(props: TriplanHeaderProps) {
	const navigate = useNavigate();
	const eventStore = useContext(eventStoreContext);

	console.log('here', eventStore.isMobile);

	if (eventStore.isMobile) {
		return (
			<div className="padding-20">
				<MobileMenu items={[{ text: 'Yahav', onClick: () => {} }]} />
			</div>
		);
	}

	return (
		<div className="padding-20">
			<TriplanHeader onLogoClick={() => navigate('/')} onMyTripsClick={() => navigate('/my-trips')} {...props} />
		</div>
	);
}

// @ts-ignore
export default observer(TriplanHeaderWrapper);
