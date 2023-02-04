import MobileNavbar from './mobile-navbar/mobile-navbar';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { TriplanHeaderProps } from '../triplan-header/triplan-header';
import { Link } from 'react-router-dom';
import './mobile-header.scss';
import { eventStoreContext } from '../../stores/events-store';
import { getClasses, ucfirst } from '../../utils/utils';
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';

interface MobileHeaderProps extends TriplanHeaderProps {
	showTripName?: boolean;
}

function MobileHeader(options: MobileHeaderProps) {
	const { withLogo = false, showTripName } = options;
	const eventStore = useContext(eventStoreContext);

	return (
		<div className="mobile-header">
			<div className="mobile-header-row">
				<div className="flex-row align-items-center">
					{withLogo && (
						<Link to={'/'}>
							<img src="/images/logo/new-logo.png" height={60} />
						</Link>
					)}
				</div>

				{showTripName && (
					<div className={getClasses('mobile-trip-name', eventStore.isMenuOpen && 'no-z-index')}>
						{/*{TranslateService.translate(eventStore, 'YOU_ARE_LOOKING_AT')} {eventStore.tripName}*/}
						<EllipsisWithTooltip placement="bottom">
							{ucfirst(eventStore.tripName.replaceAll('-', ' '))}
						</EllipsisWithTooltip>
					</div>
				)}

				<div className="flex-row align-items-center gap-15">
					<MobileNavbar {...options} isSearchOpen={eventStore.isSearchOpen} />
				</div>
			</div>
		</div>
	);
}

export default observer(MobileHeader);
