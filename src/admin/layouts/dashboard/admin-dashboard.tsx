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
import AdminDashboardWrapper from '../a-dashboard-wrapper/a-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import DestinationSlider from '../../components/destinations-slider/destination-slider';
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
		const itemsWithoutDownloadedMediaAmount = Array.from(adminStore.placesByDestination.values())
			.flat()
			.filter(
				(i) =>
					(i.images.length > 0 && !i.downloadedImages?.length) ||
					(i.videos.length > 0 && !i.downloadedVideos?.length)
			).length;
		const destinationsAmount = Array.from(adminStore.placesByDestination.keys()).filter(
			(des) => des !== 'N/A'
		).length;

		return (
			<div className="destinations-content">
				<div className="sub-title">
					{TranslateService.translate(eventStore, 'THERE_ARE_{X}_ACTIVITIES_FROM_{Y}_DESTINATIONS')
						.replace('{X}', itemsAmount.toString())
						.replace('{Y}', destinationsAmount.toString())}
					:
				</div>
				{!!itemsWithoutDownloadedMediaAmount && (
					<div className="sub-title red-color">
						(
						{TranslateService.translate(
							eventStore,
							'THERE_ARE_{X}_ACTIVITIES_WITHOUT_DOWNLOADED_MEDIA'
						).replace('{X}', itemsWithoutDownloadedMediaAmount.toString())}
						)
					</div>
				)}
				<DestinationSlider />
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AdminDashboard);
