import React from 'react';
import { observer } from 'mobx-react';
import './admin-page.scss';
import TriplanHeaderBanner from '../../../components/triplan-header-banner/triplan-header-banner';
import { useHandleWindowResize } from '../../../../custom-hooks/use-window-size';
import AdminPageContent from './admin-page-content';
import TriplanFooter from '../../../components/triplan-footer/triplan-footer';
import ScrollToTopButton from '../../../components/scroll-top/scroll-top';

function AdminPageV2() {
	useHandleWindowResize();

	return (
		<div className="triplan-admin-page-container flex-column">
			<TriplanHeaderBanner />
			<AdminPageContent />
			<TriplanFooter />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(AdminPageV2);
