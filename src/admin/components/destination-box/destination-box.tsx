import React, { useContext } from 'react';
import './destination-box.scss';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { countriesFlags } from './flags';
import { getClasses } from '../../../utils/utils';
import { observer } from 'mobx-react';

interface DestinationBoxProps {
	name: string;
	numOfItems: number;
	numOfMediaError: number;
	numOfNameError: number;
	numOfCategoryError: number;
	numOfLocationError: number;
	onClick: () => void;
	isActive?: boolean;
}

const DestinationBox = ({
	name,
	numOfItems,
	onClick,
	isActive = false,
	numOfMediaError,
	numOfNameError,
	numOfCategoryError,
	numOfLocationError,
}: DestinationBoxProps) => {
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
			<div className="destination-box-errors">
				{!!numOfMediaError && (
					<span>
						{TranslateService.translate(eventStore, 'X_MEDIA_ERRORS').replace(
							'{X}',
							numOfMediaError.toString()
						)}
					</span>
				)}
				{!!numOfNameError && (
					<span>
						{TranslateService.translate(eventStore, 'X_NAME_ERRORS').replace(
							'{X}',
							numOfNameError.toString()
						)}
					</span>
				)}
				{!!numOfLocationError && (
					<span>
						{TranslateService.translate(eventStore, 'X_LOCATION_ERRORS').replace(
							'{X}',
							numOfLocationError.toString()
						)}
					</span>
				)}
				{!!numOfCategoryError && (
					<span>
						{TranslateService.translate(eventStore, 'X_CATEGORY_ERRORS').replace(
							'{X}',
							numOfCategoryError.toString()
						)}
					</span>
				)}
			</div>
		</div>
	);
};

export default observer(DestinationBox);
