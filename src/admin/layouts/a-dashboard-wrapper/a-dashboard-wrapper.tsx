// @ts-ignore
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getClasses, Loader, LOADER_DETAILS } from '../../../utils/utils';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './a-dashboard-wrapper.scss';

import { TriPlanCalendarRef } from '../../../components/triplan-calendar/triplan-calendar';
import { eventStoreContext } from '../../../stores/events-store';
import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { SidebarEvent } from '../../../utils/interfaces';
import LoadingComponent from '../../../components/loading/loading-component';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import TriplanHeaderWrapper from '../../../components/triplan-header/triplan-header-wrapper';
import TriplanAdminSidebar from '../../components/admin-sidebar/admin-sidebar';
import { adminStoreContext } from '../../stores/admin-store';

interface AdminDashboardWrapperProps {
	createMode?: boolean;
	children: React.ReactNode;
}

function ADashboardWrapper(props: AdminDashboardWrapperProps) {
	const TriplanCalendarRef = useRef<TriPlanCalendarRef>(null);
	const eventStore = useContext(eventStoreContext);
	const adminStore = useContext(adminStoreContext);
	const [loaderDetails, setLoaderDetails] = useState<Loader>(LOADER_DETAILS());

	useHandleWindowResize();

	useEffect(() => {
		if (TriplanCalendarRef && TriplanCalendarRef.current) {
			TriplanCalendarRef.current.switchToCustomView();
		}
	}, [TriplanCalendarRef, eventStore.customDateRange]);

	function renderSidebar() {
		return (
			<TriplanAdminSidebar
				removeEventFromSidebarById={function (eventId: string): void {
					alert('remove!');
				}}
				addToEventsToCategories={function (event: SidebarEvent): void {
					alert('add!');
				}}
				TriplanCalendarRef={undefined}
			/>
		);
	}

	function renderLoading() {
		return (
			<LoadingComponent
				title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
				message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
				loaderDetails={loaderDetails}
			/>
		);
	}

	const headerProps = {
		withLogo: true,
		withSearch: false,
		withViewSelector: false,
		withRecommended: false,
		withLoginLogout: true,
		withFilterTags: false,
		withMyTrips: false,
	};

	return (
		<div className="main-page" key={JSON.stringify(eventStore.customDateRange)}>
			<div className="padding-inline-8 flex-column align-items-center justify-content-center">
				<TriplanHeaderWrapper
					{...headerProps}
					currentMobileView={undefined}
					showTripName={false}
					adminMode={true}
				/>
			</div>
			<div className={'main-layout-container a-dashboard-wrapper'}>
				<div className={getClasses('main-layout', `direction-${eventStore.getCurrentDirection()}`)}>
					{eventStore.isLoading || !adminStore.hasInit ? (
						renderLoading()
					) : (
						<>
							{renderSidebar()}
							{props.children}
						</>
					)}
				</div>
			</div>
			{/*{eventStore.isMobile && renderMobileFooterNavigator()}*/}
		</div>
	);
}

export default observer(ADashboardWrapper);
