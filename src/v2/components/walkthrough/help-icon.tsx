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

	const checkVisibility = () => {
		// Show help icon on both main page and plan pages
		// OnboardingGuide will auto-detect the mode based on route
		setIsVisible(true);
	};

	useEffect(() => {
		checkVisibility();
	}, [walkthroughStore.hasCompletedWalkthrough]);

	// Listen for route changes
	useEffect(() => {
		const handleRouteChange = () => {
			checkVisibility();
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
