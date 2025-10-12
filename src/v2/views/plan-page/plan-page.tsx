import React from 'react';
import { observer } from 'mobx-react';
import './plan-page.scss';
import TriplanHeaderBanner from '../../components/triplan-header-banner/triplan-header-banner';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import TriplanFooter from '../../components/triplan-footer/triplan-footer';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';
import PlanPageContent from './plan-page-content';

function PlanPageV2() {
	useHandleWindowResize();

	return (
		<div className="triplan-main-page-container triplan-plan-page-container flex-column">
			<TriplanHeaderBanner />
			<PlanPageContent />
			<TriplanFooter />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(PlanPageV2);
