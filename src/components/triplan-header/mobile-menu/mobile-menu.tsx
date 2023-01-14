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
		<>
			<div className="mobile-menu">{hamburgerIcon()}</div>
			<MenuContent items={items} />
		</>
	);
}

export default observer(MobileMenu);
