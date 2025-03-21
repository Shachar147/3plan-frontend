import Button, { ButtonFlavor } from '../../common/button/button';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';

export interface MyTripsProps {
	onClick?: () => void;
	height?: number;
}

function MyTrips({ onClick = () => {}, height = 25 }: MyTripsProps) {
	const eventStore = useContext(eventStoreContext);
	return (
		<Button
			className={eventStore.isRtl ? 'flex-row-reverse' : 'flex-row'}
			flavor={ButtonFlavor.link}
			image="/images/landing-page/icons/map.png"
			imageHeight={height}
			text={TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS')}
			onClick={onClick}
		/>
	);
}

export default observer(MyTrips);
