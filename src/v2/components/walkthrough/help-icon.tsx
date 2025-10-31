import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { walkthroughStoreContext } from '../../stores/walkthrough-store';
import './help-icon.scss';

interface HelpIconProps {
	onClick: () => void;
}

function HelpIcon({ onClick }: HelpIconProps) {
	const walkthroughStore = useContext(walkthroughStoreContext);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Check if we're on the main page (not inside a trip)
		const isOnMainPage = !window.location.pathname.includes('/plan/');
		const shouldShow = isOnMainPage; // && !walkthroughStore.hasCompletedWalkthrough;
		setIsVisible(shouldShow);
	}, [walkthroughStore.hasCompletedWalkthrough]);

	// Listen for route changes
	useEffect(() => {
		const handleRouteChange = () => {
			const isOnMainPage = !window.location.pathname.includes('/plan/');
			const shouldShow = isOnMainPage; // && !walkthroughStore.hasCompletedWalkthrough;
			setIsVisible(shouldShow);
		};

		window.addEventListener('popstate', handleRouteChange);
		window.addEventListener('hashchange', handleRouteChange);

		return () => {
			window.removeEventListener('popstate', handleRouteChange);
			window.removeEventListener('hashchange', handleRouteChange);
		};
	}, [walkthroughStore.hasCompletedWalkthrough]);

	if (!isVisible) {
		return null;
	}

	return (
		<div className="help-icon" onClick={onClick}>
			<div className="help-icon-inner">
				<i className="fa fa-question" />
			</div>
		</div>
	);
}

export default observer(HelpIcon);
