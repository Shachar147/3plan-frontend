import MobileNavbar from './mobile-navbar/mobile-navbar';
import React from 'react';
import { observer } from 'mobx-react';
import { TriplanHeaderProps } from '../triplan-header/triplan-header';
import { Link } from 'react-router-dom';
import './mobile-header.scss';

function MobileHeader(options:TriplanHeaderProps) {
	const { withLogo = false } = options;
	return (
			<div className="mobile-header">
				<div className="mobile-header-row">
					<div className="flex-row align-items-center">
						{withLogo && <Link to={"/"}><img src="/images/logo/new-logo.png" height={60} /></Link>}
					</div>
					<div className="flex-row align-items-center gap-15">
						<MobileNavbar {...options} />
					</div>
				</div>
			</div>
	);
}

export default observer(MobileHeader);