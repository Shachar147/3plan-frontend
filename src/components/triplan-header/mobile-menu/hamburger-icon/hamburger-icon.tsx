import React, { useContext, useState } from 'react';
import './hamburger-icon.scss';
import { getClasses } from '../../../../utils/utils';
import { eventStoreContext } from '../../../../stores/events-store';

const hamburgerIcon = () => {
	const eventStore = useContext(eventStoreContext);
	return (
		<div
			className={getClasses('hamburger-icon', eventStore.isMenuOpen && 'open')}
			onClick={() => eventStore.setIsMenuOpen(!eventStore.isMenuOpen)}
		>
			<div className="hamburger-line-1" />
			<div className="hamburger-line-2" />
			<div className="hamburger-line-3" />
		</div>
	);
};

export default hamburgerIcon;
