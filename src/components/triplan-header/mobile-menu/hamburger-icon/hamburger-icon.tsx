import React, { useContext, useState } from 'react';
import './hamburger-icon.scss';
import { getClasses } from '../../../../utils/utils';
import { eventStoreContext } from '../../../../stores/events-store';

const hamburgerIcon = (props: { className?: string; onClick?: () => any; isOpen?: boolean }) => {
	const eventStore = useContext(eventStoreContext);
	return (
		<div
			className={getClasses('hamburger-icon', props.isOpen && 'open')}
			onClick={() => {
				eventStore.setIsMenuOpen(!eventStore.isMenuOpen);
				props.onClick?.();
			}}
		>
			<div className={getClasses('hamburger-line-1', props.className)} />
			<div className={getClasses('hamburger-line-2', props.className)} />
			<div className={getClasses('hamburger-line-3', props.className)} />
		</div>
	);
};

export default hamburgerIcon;
