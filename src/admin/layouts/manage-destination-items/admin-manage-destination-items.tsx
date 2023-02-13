// @ts-ignore
import React, { useContext, useEffect, useRef, useState } from 'react';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin-manage-destination-items.scss';

import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { adminStoreContext } from '../../stores/admin-store';
import AdminDashboardWrapper from '../admin-dashboard-wrapper/admin-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import { useParams } from 'react-router-dom';
import ActivityBox from '../../components/activity-box/activity-box';
import DestinationSlider from '../destinations-slider/destination-slider';

function AdminManageDestinationItems() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	let { destination: currDestination } = useParams();

	if (currDestination == 'NA') {
		currDestination = 'N/A';
	}

	function renderContent() {
		if (!currDestination) return;

		if (adminStore.placesByDestination.size === 0) {
			return (
				<div className="no-destinations-placeholder">{TranslateService.translate(eventStore, 'NO_ITEMS')}</div>
			);
		}

		const activities = adminStore.placesByDestination.get(currDestination) ?? [];

		return (
			<div className="manage-destination-items bright-scrollbar">
				<DestinationSlider currDestination={currDestination} />
				<div className="flex-column gap-10">
					<div className="activities-content">
						{activities.map((activity) => (
							<ActivityBox activity={activity} />
						))}
					</div>
				</div>
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AdminManageDestinationItems);
