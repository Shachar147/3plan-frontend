import React, { useContext } from 'react';
import './destination-box.scss';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { countriesFlags } from './flags';
import { getClasses } from '../../../utils/utils';

interface DestinationBoxProps {
	name: string;
	numOfItems: number;
	onClick: () => void;
	isActive?: boolean;
}

const DestinationBox = ({ name, numOfItems, onClick, isActive = false }: DestinationBoxProps) => {
	const eventStore = useContext(eventStoreContext);
	const flag = countriesFlags[name]?.mini;

	return (
		<div className={getClasses('destination-box', isActive && 'active')} onClick={onClick}>
			{flag && (
				<div className="destination-box-flag">
					<img src={flag} />
				</div>
			)}
			<div className="destination-box-name">{TranslateService.translate(eventStore, name)}</div>
			<div className="destination-box-num-of-items">
				{TranslateService.translate(eventStore, 'X_ACTIVITIES').replace('{X}', numOfItems.toString())}
			</div>
		</div>
	);
};

export default DestinationBox;
