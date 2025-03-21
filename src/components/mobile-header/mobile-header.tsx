import MobileNavbar from './mobile-navbar/mobile-navbar';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { TriplanHeaderProps } from '../triplan-header/triplan-header';
import { Link, useNavigate } from 'react-router-dom';
import './mobile-header.scss';
import { eventStoreContext } from '../../stores/events-store';
import { getClasses } from '../../utils/utils';
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import TranslateService from '../../services/translate-service';
import {FeatureFlagsService} from "../../utils/feature-flags";

interface MobileHeaderProps extends TriplanHeaderProps {
	showTripName?: boolean;
	adminMode?: boolean;
}

function MobileHeader(options: MobileHeaderProps) {
	const { withLogo = false, showTripName } = options;
	const eventStore = useContext(eventStoreContext);

	const navigate = useNavigate();

	const homeUrl = options.adminMode ? '/admin' : '/';

	const isModalOpened = eventStore.modalSettings.show || eventStore.secondModalSettings.show;

	return (
		<div className="flex-column width-100-percents align-items-center">
			<div className={getClasses('mobile-header', isModalOpened && 'z-index-1000')}>
				<div className="mobile-header-row">
					<div className="flex-row align-items-center">
						{withLogo && (
							<Link to={homeUrl} className="mobile-header-row-logo">
								<img src={FeatureFlagsService.isNewDesignEnabled() ? "/images/logo/new-logo-white.png" : "/images/logo/new-logo.png"} height={60} />
							</Link>
						)}
					</div>

					{showTripName && (
						<span className="mobile-header-trip-name-text"><EllipsisWithTooltip placement="bottom">{eventStore.tripName}</EllipsisWithTooltip></span>
					)}

					{options.adminMode && !showTripName && (
						<div className="admin-mode-link" onClick={() => navigate('/')}>
							<EllipsisWithTooltip placement="bottom">
								{TranslateService.translate(eventStore, 'SWITCH_TO_USER_SIDE')}
							</EllipsisWithTooltip>
						</div>
					)}

					<div className="flex-row align-items-center gap-15">
						<MobileNavbar {...options} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default observer(MobileHeader);
