import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';

export interface TriplanLogoProps {
	onClick?: () => void;
	height?: number;
}

function TriplanLogo({ onClick, height = 40 }: TriplanLogoProps) {
	const eventStore = useContext(eventStoreContext);
	return (
		<div className="header-logo cursor-pointer flex flex-shrink-0 flex-grow-0" onClick={onClick}>
			<img
				alt={TranslateService.translate(eventStore, 'TRIPLAN')}
				src={'/images/logo/new-logo.png'}
				style={{ height: `${height}px` }}
			/>
		</div>
	);
}

export default observer(TriplanLogo);
