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
import DestinationBox from '../../components/destination-box/destination-box';
import AdminDashboardWrapper from '../admin-dashboard-wrapper/admin-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import { useNavigate, useParams } from 'react-router-dom';
import { countriesFlags } from '../../components/destination-box/flags';
import ActivityBox from '../../components/activity-box/activity-box';

interface AdminManageDestinationItemsProps {
	createMode?: boolean;
}

function AdminManageDestinationItems(props: AdminManageDestinationItemsProps) {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const { destination: currDestination } = useParams();

	function renderContent() {
		if (!currDestination) return;

		if (adminStore.placesByDestination.size === 0) {
			return (
				<div className="no-destinations-placeholder">{TranslateService.translate(eventStore, 'NO_ITEMS')}</div>
			);
		}

		const destinations = Array.from(adminStore.placesByDestination.keys());
		const activities = adminStore.placesByDestination.get(currDestination) ?? [];

		return (
			<div className="manage-destination-items bright-scrollbar">
				<div className="flex-column gap-10">
					<div className="destinations-content">
						{destinations.map((destination) => {
							const places = adminStore.placesByDestination.get(destination)!;
							return (
								<DestinationBox
									name={destination}
									numOfItems={places.length}
									onClick={() => {
										navigate(`/admin/destination/${destination}`);
									}}
									isActive={destination === currDestination}
								/>
							);
						})}
					</div>
				</div>
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
