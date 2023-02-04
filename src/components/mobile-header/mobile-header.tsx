import MobileNavbar from './mobile-navbar/mobile-navbar';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { TriplanHeaderProps } from '../triplan-header/triplan-header';
import { Link } from 'react-router-dom';
import './mobile-header.scss';
import { eventStoreContext } from '../../stores/events-store';

function MobileHeader(options: TriplanHeaderProps) {
	const { withLogo = false } = options;
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
				<div className="flex-row align-items-center gap-15">
					<MobileNavbar {...options} isSearchOpen={eventStore.isSearchOpen} />
				</div>
			</div>
		</div>
	);
}

export default observer(MobileHeader);
