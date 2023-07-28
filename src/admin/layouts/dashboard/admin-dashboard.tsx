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
import { formatDateString } from '../../../utils/defaults';
import { addHours, getOffsetInHours } from '../../../utils/time-utils';

function AdminDashboard() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);

	function wrapBlockWithTitle(titleKey: string, children: React.ReactNode) {
		const blockTitle = (
			<div className="font-weight-bold text-align-center width-100-percents font-size-20">
				{TranslateService.translate(eventStore, titleKey)}
			</div>
		);

		return (
			<div className="flex-col gap-10">
				{blockTitle}
				{children}
			</div>
		);
	}

	const renderTinderWidget = () => {
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
				<div className="margin-bottom-5 width-100-percents flex-row justify-content-center">
					<TriplanSearch isHidden={false} />
				</div>
				<DestinationSlider />
			</div>
		);
	};

	function renderTripStats() {
		let columns: string[] = [
			'name',
			'num_of_categories',
			'scheduled_events',
			'sidebar_events',
			'username',
			'lastUpdateAt',
		];

		const offset = -1 * getOffsetInHours(false);

		if (eventStore.isMobile) {
			columns = ['lastUpdateAt', 'num_of_categories', 'scheduled_events', 'sidebar_events', 'userId'];
			return (
				<div className="flex-col gap-10 width-100-percents text-align-center max-height-250 overflow-auto bright-scrollbar">
					<table>
						<tbody>
							{adminStore.userStats
								.filter((a: any) => a['lastUpdateAt'] && a['name'])
								.map((row: any) => (
									<>
										<tr>
											<td>
												<b>
													{row['username']} - {row['name']}
												</b>
											</td>
										</tr>
										{columns.map((col: any) => (
											<>
												<tr>
													<td>
														{`${TranslateService.translate(eventStore, col)}: `}
														{!row[col]
															? '-'
															: col == 'lastUpdateAt' || col == 'lastLoginAt'
															? addHours(new Date(row[col]), offset)
																	.toISOString()
																	.split('.')[0]
																	.replace('T', ', ')
															: row[col]}
													</td>
												</tr>
												<tr>
													<td />
												</tr>
											</>
										))}
									</>
								))}
						</tbody>
					</table>
				</div>
			);
		}

		return (
			<div className="flex-col gap-10 width-100-percents text-align-center max-height-250 overflow-auto bright-scrollbar">
				<table>
					<thead>
						{columns.map((x) => (
							<th>{TranslateService.translate(eventStore, x)}</th>
						))}
					</thead>
					<tbody>
						{adminStore.userStats
							.filter((a) => a['name'])
							.sort((a, b) => b['lastUpdateAt'] - a['lastUpdateAt'])
							.map((row: any) => (
								<tr>
									{columns.map((col: any) => (
										<td>
											{!row[col]
												? '-'
												: col == 'lastUpdateAt' || col == 'lastLoginAt'
												? addHours(new Date(row[col]), offset)
														.toISOString()
														.split('.')[0]
														.replace('T', ', ')
												: row[col]}
										</td>
									))}
								</tr>
							))}
					</tbody>
				</table>
			</div>
		);
	}

	function renderUserStats() {
		let columns: string[] = ['userId', 'username', 'lastUpdateAt', 'lastLoginAt', 'numOfLogins'];

		const offset = -1 * getOffsetInHours(false);

		console.log({
			offset,
		});

		const stats: Record<number, any> = {};

		adminStore.userStats.forEach((row: any) => {
			const userId = row['userId'];
			stats[userId] = row;
		});

		if (eventStore.isMobile) {
			columns = ['userId', 'lastLoginAt', 'numOfLogins'];
			return (
				<div className="flex-col gap-10 width-100-percents text-align-center max-height-250 overflow-auto bright-scrollbar">
					<table>
						<tbody>
							{Object.keys(stats)
								.sort()
								.map((userId: any) => {
									const row = stats[userId];
									return (
										<>
											<tr>
												<td>
													<b>{row['username']}</b>
												</td>
											</tr>
											{columns.map((col: any) => (
												<>
													<tr>
														<td>
															{`${TranslateService.translate(eventStore, col)}: `}
															{!row[col]
																? '-'
																: col == 'lastUpdateAt' || col == 'lastLoginAt'
																? addHours(new Date(row[col]), offset)
																		.toISOString()
																		.split('.')[0]
																		.replace('T', ', ')
																: row[col]}
														</td>
													</tr>
													<tr>
														<td />
													</tr>
												</>
											))}
										</>
									);
								})}
						</tbody>
					</table>
				</div>
			);
		}

		const seenUsers: any = {};

		return (
			<div className="flex-col gap-10 width-100-percents text-align-center max-height-250 overflow-auto bright-scrollbar">
				<table>
					<thead>
						{columns.map((x) => (
							<th>{TranslateService.translate(eventStore, x)}</th>
						))}
					</thead>
					<tbody>
						{adminStore.userStats
							// @ts-ignore
							.sort((a, b) => a['userId'] - b['userId'])
							.map((row: any) => {
								if (seenUsers[row['userId']]) {
									return null;
								}
								seenUsers[row['userId']] = 1;
								return (
									<tr>
										{columns.map((col: any) => (
											<td>
												{!row[col]
													? '-'
													: col == 'lastUpdateAt' || col == 'lastLoginAt'
													? addHours(new Date(row[col]), offset)
															.toISOString()
															.split('.')[0]
															.replace('T', ', ')
													: row[col]}
											</td>
										))}
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
		);
	}

	function renderContent() {
		return (
			<div className="flex-col gap-30 width-100-percents">
				{wrapBlockWithTitle('ADMIN_DASHBOARD.TRIP_STATS.TITLE', renderTripStats())}
				{wrapBlockWithTitle('ADMIN_DASHBOARD.USER_STATS.TITLE', renderUserStats())}
				{wrapBlockWithTitle('ADMIN_DASHBOARD.TINDER_WIDGET.TITLE', renderTinderWidget())}
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AdminDashboard);
