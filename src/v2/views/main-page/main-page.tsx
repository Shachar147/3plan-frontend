import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './main-page.scss';
import TriplanHeaderBanner from '../../components/triplan-header-banner/triplan-header-banner';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import MainPageContent from './main-page-content';
import TriplanFooter from '../../components/triplan-footer/triplan-footer';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';
import OnboardingGuide from '../../components/walkthrough/onboarding-guide';
import HelpIcon from '../../components/walkthrough/help-icon';
import { eventStoreContext } from '../../../stores/events-store';

function MainPageV2() {
	const eventStore = useContext(eventStoreContext);
	useHandleWindowResize();

	const handleStartWalkthrough = () => {
		// @ts-ignore
		if (window.startWalkthrough) {
			// @ts-ignore
			window.startWalkthrough();
		}
	};

	return (
		<div className="triplan-main-page-container flex-column">
			<TriplanHeaderBanner />
			<MainPageContent />
			<TriplanFooter />
			<ScrollToTopButton />
			{!eventStore.isMobile && <OnboardingGuide />}
			{!eventStore.isMobile && <HelpIcon onClick={handleStartWalkthrough} />}
		</div>
	);
}

export default observer(MainPageV2);
