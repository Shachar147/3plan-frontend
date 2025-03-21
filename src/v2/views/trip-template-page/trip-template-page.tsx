import React from 'react';
import { observer } from 'mobx-react';
import './trip-template-page.scss';
import TriplanHeaderBanner from '../../components/triplan-header-banner/triplan-header-banner';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';
import TripTemplatePageContent from './trip-template-page-content';

function TripTemplatePageV2() {
	useHandleWindowResize();

	return (
		<div className="triplan-main-page-container triplan-trip-template-page-container flex-column">
			<TriplanHeaderBanner isAlwaysSticky />
			<TripTemplatePageContent />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(TripTemplatePageV2);
