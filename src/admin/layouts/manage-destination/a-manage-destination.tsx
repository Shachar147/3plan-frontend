// @ts-ignore
import React, { useContext, useEffect, useRef, useState } from 'react';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './a-manage-destination.scss';

import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { adminStoreContext } from '../../stores/admin-store';
import AdminDashboardWrapper from '../a-dashboard-wrapper/a-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityBox from '../../components/activity-box/activity-box';
import DestinationSlider from '../../components/destinations-slider/destination-slider';
import { TinderItem } from '../../helpers/interfaces';

import MapContainer from '../../../components/map-container/map-container';
import { AllEventsEvent } from '../../../services/data-handlers/data-handler-base';
import { AdminViewMode, TriplanEventPreferredTime, TriplanPriority } from '../../../utils/enums';
import { LocationData, WeeklyOpeningHoursData } from '../../../utils/interfaces';
import _ from 'lodash';
import { getTinderServerAddress } from '../../../config/config';
import TriplanViewSelector from '../../../components/triplan-header/view-selector/triplan-view-selector';
import { getAdminViewSelectorOptions } from '../../../utils/ui-utils';

function AManageDestination() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	let { destination: currDestination } = useParams();
	const navigate = useNavigate();

	if (currDestination == 'NA') {
		currDestination = 'N/A';
	}

	useEffect(() => {
		eventStore.setSearchValue('');
	}, []);

	function renderContent() {
		if (!currDestination) return;

		if (adminStore.placesByDestination.size === 0) {
			return (
				<div className="no-destinations-placeholder">{TranslateService.translate(eventStore, 'NO_ITEMS')}</div>
			);
		}

		const activities = adminStore.placesByDestination.get(currDestination) ?? [];

		function renderNavigation() {
			return (
				<div className="manage-destination-navigation">
					<a href="" onClick={() => navigate('/admin')}>
						{TranslateService.translate(eventStore, 'ADMIN_PANEL')}
					</a>
					<span className="navigation-spacer">{' > '}</span>
					{TranslateService.translate(eventStore, currDestination!)}
				</div>
			);
		}

		function getScore(item: TinderItem) {
			const moveLater = JSON.parse(localStorage.getItem('triplan-move_later') ?? '{}');
			const arr = moveLater[item.destination] ?? [];
			if (arr.indexOf(item.id)) {
				return item.id - arr.indexOf(item.id) * 100000;
			}
			return item.id;
		}

		function buildMediaUrl(media: string) {
			if (media.indexOf('http') !== -1) {
				return media;
			}
			if (!media.startsWith('/')) {
				media = '/' + media;
			}
			return `${getTinderServerAddress()}${media}`;
		}

		return (
			<div className="manage-destination-items bright-scrollbar">
				{renderNavigation()}
				<DestinationSlider currDestination={currDestination} />
				<div className="flex-row justify-content-center width-100-percents direction-ltr">
					<TriplanViewSelector
						value={adminStore.viewMode}
						setViewMode={(value) => adminStore.setViewMode(value)}
						options={getAdminViewSelectorOptions(eventStore)}
					/>
				</div>
				{adminStore.viewMode === AdminViewMode.map && (
					<div className="manage-destination-items-map-container" key={currDestination}>
						<MapContainer
							allEvents={Array.from(adminStore.placesByDestination.get(currDestination)!)
								.filter((x) => x.location)
								.map((x) => {
									return {
										...x,
										id: x.id,
										title: x.name,
										duration: x.duration,
										icon: x.icon,
										category:
											x.category || TranslateService.translate(eventStore, 'MISSING_CATEGORY'),
										description: x.description,
										priority: _.isUndefined(x.priority)
											? TriplanPriority.unset
											: (x.priority as unknown as TriplanPriority) ?? TriplanPriority.unset,
										preferredTime: TriplanEventPreferredTime.unset, // todo complete
										extendedProps: {},
										// className: ,
										location: x.location as LocationData,
										allDay: false,
										openingHours: _.isUndefined(x.openingHours)
											? undefined
											: (x.openingHours as WeeklyOpeningHoursData),
										images: x.downloadedImages
											? x.downloadedImages.map((y) => buildMediaUrl(y))
											: x.images, // string?
										moreInfo: x.more_info,
									} as unknown as AllEventsEvent;
								})}
							getNameLink={(event: AllEventsEvent) => {
								return `/admin/item/${event.id}`;
							}}
						/>
					</div>
				)}
				{adminStore.viewMode === AdminViewMode.list && (
					<div className="flex-column gap-10">
						<div className="activities-content">
							{activities
								.sort((a, b) => getScore(b) - getScore(a))
								.map((activity) => (
									<ActivityBox
										activity={activity}
										onClick={() => {
											navigate(`/admin/item/${activity.id}`);
										}}
									/>
								))}
						</div>
					</div>
				)}
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AManageDestination);
