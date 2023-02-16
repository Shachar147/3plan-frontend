import React, { useContext } from 'react';
import './activity-box.scss';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { TinderItem } from '../../helpers/interfaces';
import { observer } from 'mobx-react';

interface ActivityBoxProps {
	activity: TinderItem;
	onClick: () => void;
}

const ActivityBox = ({ activity, onClick }: ActivityBoxProps) => {
	const { name, isVerified, category, images, videos, description, icon, destination, id } = activity;
	const eventStore = useContext(eventStoreContext);

	const errors = [];
	if (!category) {
		errors.push(TranslateService.translate(eventStore, 'MISSING_CATEGORY'));
	}
	if (!images?.length && !videos?.length) {
		errors.push(TranslateService.translate(eventStore, 'MISSING_IMAGES'));
	}
	if (name.indexOf('http') !== -1) {
		errors.push(TranslateService.translate(eventStore, 'MISSING_ACTIVITY_NAME'));
	}
	if (!description) {
		errors.push(TranslateService.translate(eventStore, 'MISSING_DESCRIPTION'));
	}
	if (destination === 'N/A') {
		errors.push(TranslateService.translate(eventStore, 'MISSING_DESTINATION'));
	}

	const errorText =
		errors.length === 1
			? TranslateService.translate(eventStore, 'THERE_IS_ONE_PROBLEM')
			: TranslateService.translate(eventStore, 'THERE_ARE_X_ERRORS').replace('{X}', errors.length.toString());

	return (
		<div className="activity-box" onClick={onClick}>
			{icon}
			<div className="activity-box-name">{TranslateService.translate(eventStore, name)}</div>
			<div className="activity-box-status">
				{errors.length > 0 ? (
					<div className="activity-box-error" title={errors.join('\n')}>
						{errorText}
					</div>
				) : (
					<div className="activity-box-all-good">{TranslateService.translate(eventStore, 'ALL_GOOD')}</div>
				)}
			</div>
			<div className="activity-box-is-verified">
				<img src={isVerified ? '/images/admin/verified.png' : '/images/admin/unverified.png'} />
				{TranslateService.translate(eventStore, isVerified ? 'VERIFIED' : 'UNVERIFIED')}
			</div>
		</div>
	);
};

export default observer(ActivityBox);
