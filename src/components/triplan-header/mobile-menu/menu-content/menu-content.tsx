import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../../stores/events-store';
import { getClasses } from '../../../../utils/utils';
import './menu-content.scss';

export interface MenuContentItem {
	text: string;
	onClick?: () => any;
}

export interface MenuContentProps {
	items: MenuContentItem[];
}

const MenuContent = ({ items }: MenuContentProps) => {
	const eventStore = useContext(eventStoreContext);
	return (
		<div className={getClasses('menu-content', eventStore.isMenuOpen && 'open')}>
			{items.map((item, index) => (
				<div className="menu-item" onClick={item.onClick}>
					<div className="menu-item-text">{item.text}</div>
					{index + 1 < items.length && <div className="menu-item-followup"></div>}
				</div>
			))}
		</div>
	);
};

export default observer(MenuContent);
