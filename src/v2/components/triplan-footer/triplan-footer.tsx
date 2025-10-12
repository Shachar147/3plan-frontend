import { endpoints } from '../../utils/endpoints';
import { apiGetNew } from '../../../helpers/api';
import React, { useContext, useEffect, useState } from 'react';
import './triplan-footer.scss';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { getClasses, getCurrentUsername, isAdmin } from '../../../utils/utils';
import { newDesignRootPath, TEMPLATES_USER_NAME } from '../../utils/consts';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import { observer } from 'mobx-react';

interface TriplanFooterSummaries {
	avgCalendarItemsInTrip: number;
	avgSidebarItemsInTrip: number;
	avgTripsPerUser: number;
	totalPlacesOnCalendar: number;
	totalPlacesOnSidebar: number;
	totalTrips: number;
	totalUsers: number;
	totalUsersThatLoggedInThisWeek: number;
	totalUsersThatLoggedInToday: number;
	totalUsersWithNoTrip: number;
	totalPois: number;
	totalSavedItems: number;
	avgSavedItemsPerUser: number;
	totalDestinations: number;
	totalSavedCollections: number;
	totalSystemRecommendations: number;

	totalTemplates: number;
	totalApprovedTemplates?: number;
}

function TriplanFooter() {
	const eventStore = useContext(eventStoreContext);
	const [summaries, setSummaries] = useState<TriplanFooterSummaries>(undefined);

	useEffect(() => {
		apiGetNew(endpoints.v2.statistics.summaries).then((response) => {
			setSummaries(response.data);
		});
	}, []);

	const structure: any = [
		{
			'FOOTER.USER_STATS': [
				{ 'FOOTER.TOTAL_USERS': summaries?.totalUsers },
				{ 'FOOTER.LOGGED_IN_TODAY': summaries?.totalUsersThatLoggedInToday },
				{ 'FOOTER.LOGGED_IN_THIS_WEEK': summaries?.totalUsersThatLoggedInThisWeek },
				{ 'FOOTER.TOTAL_USERS_NO_TRIPS': summaries?.totalUsersWithNoTrip }, // todo remove?
			],
		},
		{
			'FOOTER.TRIPS_STATS': [
				{ 'FOOTER.TOTAL_TRIPS': summaries?.totalTrips },
				{ 'FOOTER.AVG_CALENDAR_ITEMS_IN_TRIP': summaries?.avgCalendarItemsInTrip },
				{ 'FOOTER.AVG_SIDEBAR_ITEMS_IN_TRIP': summaries?.avgSidebarItemsInTrip },
				{ 'FOOTER.AVG_TRIPS_PER_USER': summaries?.avgTripsPerUser },
				{ 'FOOTER.TOTAL_PLACES_ON_CALENDAR': summaries?.totalPlacesOnCalendar },
				{ 'FOOTER.TOTAL_PLACES_ON_SIDEBAR': summaries?.totalPlacesOnSidebar },
			],
		},
		{
			'FOOTER.POINT_OF_INTERESTS_STATS': [
				{ 'FOOTER.TOTAL_POIS': summaries?.totalPois },
				{ 'FOOTER.TOTAL_DESTINATIONS_WITH_INTERESTS': summaries?.totalDestinations },
				{ 'FOOTER.TOTAL_SAVED_COLLECTIONS': summaries?.totalSavedCollections },
				{ 'FOOTER.TOTAL_SAVED_ITEMS': summaries?.totalSavedItems },
				{ 'FOOTER.AVG_SAVED_ITEMS_PER_USER': summaries?.avgSavedItemsPerUser },
				{ 'FOOTER.TOTAL_SYSTEM_RECOMMENDATIONS': summaries?.totalSystemRecommendations },
			],
		},
	];

	if (['Shachar', TEMPLATES_USER_NAME].includes(getCurrentUsername())) {
		structure[1]['FOOTER.TRIPS_STATS'].push(
			...[
				{ 'FOOTER.TOTAL_TEMPLATES': summaries?.totalTemplates },
				{ 'FOOTER.TOTAL_APPROVED_TEMPLATES': summaries?.totalApprovedTemplates },
			]
		);
	} else {
		structure[1]['FOOTER.TRIPS_STATS'].push(...[{ 'FOOTER.TOTAL_TEMPLATES': summaries?.totalApprovedTemplates }]);
	}

	function renderStatsBlock(stats: Record<string, any>) {
		const title = Object.keys(stats)[0];
		const values = stats[title];
		return (
			<>
				<h5>{TranslateService.translate(eventStore, title)}</h5>
				{values.map((r, idx) => {
					const key = Object.keys(r)[0];
					const value = r[Object.keys(r)[0]] ?? '-';
					return <div key={idx}>{TranslateService.translate(eventStore, key, { X: value })}</div>;
				})}
			</>
		);
	}

	const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

	const isInAdmin = window.location.href.includes(`${newDesignRootPath}/admin`);

	if (eventStore.focusMode) {
		return;
	}

	return (
		<>
			<div className={getClasses('triplan-footer', eventStore.isMobile && isInPlan && 'padding-bottom-80')}>
				{structure.map((dict, idx) => (
					<div key={idx}>{renderStatsBlock(dict)}</div>
				))}
				<div className="flex-column gap-8">
					<Button
						flavor={ButtonFlavor.link}
						className="white-color"
						onClick={() => (window.location.href = `${newDesignRootPath}/whats-new`)}
						text={TranslateService.translate(eventStore, 'WHATS_NEW.LINK')}
					/>
				</div>
			</div>
			{isAdmin() && (
				<Button
					flavor={ButtonFlavor.link}
					className="white-color"
					onClick={() => {
						window.location.href = isInAdmin ? newDesignRootPath : `${newDesignRootPath}/admin`;
					}}
					text={TranslateService.translate(
						eventStore,
						isInAdmin ? 'MOBILE_NAVBAR.USER_SIDE' : 'MOBILE_NAVBAR.ADMIN_SIDE'
					)}
				/>
			)}
		</>
	);
}

export default observer(TriplanFooter);
