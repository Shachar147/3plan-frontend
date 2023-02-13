// @ts-ignore
import React, { useContext, useEffect, useRef, useState } from 'react';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin-dashboard.scss';

import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { adminStoreContext } from '../../stores/admin-store';
import DestinationBox from '../../components/destination-box/destination-box';
import AdminDashboardWrapper from '../admin-dashboard-wrapper/admin-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
	createMode?: boolean;
}

function AdminDashboard(props: AdminDashboardProps) {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

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
					return (
						<DestinationBox
							name={destination}
							numOfItems={places.length}
							onClick={() => {
								navigate(`/admin/destination/${destination}`);
							}}
						/>
					);
				})}
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AdminDashboard);
