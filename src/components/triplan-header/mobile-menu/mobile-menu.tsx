import React from 'react';
import { observer } from 'mobx-react';
import './mobile-menu.scss';
import hamburgerIcon from './hamburger-icon/hamburger-icon';
import MenuContent, { MenuContentItem } from './menu-content/menu-content';

export interface MobileMenuProps {
	items: MenuContentItem[];
}

function MobileMenu({ items }: MobileMenuProps) {
	return (
		<div className="margin-bottom-10">
			<div className="mobile-menu">
				{hamburgerIcon()}
				<img src={'/images/logo/new-logo-white.png'} height={45} />
			</div>
			<MenuContent items={items} />
		</div>
	);
}

export default observer(MobileMenu);
