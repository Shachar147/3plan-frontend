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
import AdminDashboardWrapper from '../admin-dashboard-wrapper/admin-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import DestinationSlider from '../destinations-slider/destination-slider';
import TriplanSearch from '../../../components/triplan-header/triplan-search/triplan-search';

function AdminDashboard() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);

	function renderContent() {
		if (adminStore.placesByDestination.size === 0) {
			return (
				<div className="no-destinations-placeholder">{TranslateService.translate(eventStore, 'NO_ITEMS')}</div>
			);
		}

		const itemsAmount = Array.from(adminStore.placesByDestination.values()).flat().length;
		const destinationsAmount = Array.from(adminStore.placesByDestination.keys()).filter(
			(des) => des !== 'N/A'
		).length;

		return (
			<div className="destinations-content">
				<div>
					{TranslateService.translate(eventStore, 'THERE_ARE_{X}_ACTIVITIES_FROM_{Y}_DESTINATIONS')
						.replace('{X}', itemsAmount.toString())
						.replace('{Y}', destinationsAmount.toString())}
					:
				</div>
				<DestinationSlider />
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AdminDashboard);
