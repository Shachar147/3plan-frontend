// @ts-ignore
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getClasses, Loader, LOADER_DETAILS } from '../../utils/utils';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './manage-triplan-tinder-places.scss';

import { TriPlanCalendarRef } from '../../components/triplan-calendar/triplan-calendar';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import TranslateService from '../../services/translate-service';
import { SidebarEvent } from '../../utils/interfaces';
import LoadingComponent from '../../components/loading/loading-component';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import TriplanAdminSidebar from '../components/admin-sidebar/admin-sidebar';
import { adminStoreContext } from '../stores/admin-store';
import DestinationBox from '../components/destination-box/destination-box';

interface ManageTinderPlacesProps {
	createMode?: boolean;
}

function ManageTinderPlaces(props: ManageTinderPlacesProps) {
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

	function renderContent() {
		if (adminStore.placesByDestination.size === 0) {
			return (
				<div className="no-destinations-placeholder">{TranslateService.translate(eventStore, 'NO_ITEMS')}</div>
			);
		}

		const destinations = Array.from(adminStore.placesByDestination.keys());

		return (
			<div className="destinations-content">
				{destinations.map((destination) => {
					const places = adminStore.placesByDestination.get(destination)!;
					return <DestinationBox name={destination} numOfItems={places.length} />;
				})}
			</div>
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
		withMyTrips: true,
	};

	return (
		<div className="main-page" key={JSON.stringify(eventStore.customDateRange)}>
			<div className="padding-inline-8 flex-column align-items-center justify-content-center">
				<TriplanHeaderWrapper {...headerProps} currentMobileView={undefined} showTripName={false} />
			</div>
			<div className={'main-layout-container'}>
				<div className={getClasses('main-layout', `direction-${eventStore.getCurrentDirection()}`)}>
					{eventStore.isLoading || !adminStore.hasInit ? (
						renderLoading()
					) : (
						<>
							{renderSidebar()}
							{renderContent()}
						</>
					)}
				</div>
			</div>
			{/*{eventStore.isMobile && renderMobileFooterNavigator()}*/}
		</div>
	);
}

export default observer(ManageTinderPlaces);
