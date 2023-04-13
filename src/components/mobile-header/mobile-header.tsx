import MobileNavbar from './mobile-navbar/mobile-navbar';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { TriplanHeaderProps } from '../triplan-header/triplan-header';
import { Link } from 'react-router-dom';
import './mobile-header.scss';
import { eventStoreContext } from '../../stores/events-store';
import { getClasses } from '../../utils/utils';
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';

interface MobileHeaderProps extends TriplanHeaderProps {
	showTripName?: boolean;
	adminMode?: boolean;
}

function MobileHeader(options: MobileHeaderProps) {
	const { withLogo = false, showTripName } = options;
	const eventStore = useContext(eventStoreContext);

	const homeUrl = options.adminMode ? '/admin' : '/';

	const isModalOpened = eventStore.modalSettings.show || eventStore.secondModalSettings.show;

	return (
		<div className="flex-column width-100-percents align-items-center">
			<div className={getClasses('mobile-header', isModalOpened && 'z-index-1000')}>
				<div className="mobile-header-row">
					<div className="flex-row align-items-center">
						{withLogo && (
							<Link to={homeUrl}>
								<img src="/images/logo/new-logo.png" height={60} />
							</Link>
						)}
					</div>

					{showTripName && (
						<EllipsisWithTooltip placement="bottom">{eventStore.tripName}</EllipsisWithTooltip>
					)}

					<div className="flex-row align-items-center gap-15">
						<MobileNavbar {...options} isSearchOpen={eventStore.isSearchOpen} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default observer(MobileHeader);
