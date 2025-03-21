import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { TripDataSource } from '../../../utils/enums';
import { DBService } from '../../../services/data-handlers/db-service';
import useAsyncMemo from '../../../custom-hooks/use-async-memo';
import { addHours, formatDate, formatTimeFromISODateString, getOffsetInHours } from '../../../utils/time-utils';
import { TripActions } from '../../../utils/interfaces';
import TranslateService from '../../../services/translate-service';
import { getCurrentUsername } from '../../../utils/utils';
import LogHistoryService from '../../../services/data-handlers/log-history-service';
import ReactModalService from '../../../services/react-modal-service';
import { observer } from 'mobx-react';

// @ts-ignore
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';

interface TriplanSidebarHistoryProps {
	renderPrefix?: () => React.ReactNode;
}
function TriplanSidebarHistory(props: TriplanSidebarHistoryProps) {
	const eventStore = useContext(eventStoreContext);

	const fetchHistory = async (): Promise<any[]> => {
		if (eventStore.dataService.getDataSourceName() == TripDataSource.DB) {
			const data = await (eventStore.dataService as DBService).getHistory(eventStore.tripId);
			return data.history;
		}
		return [];
	};
	const { data: historyRecords } = useAsyncMemo<any[]>(() => {
		// console.log('fetching!', eventStore.reloadHistoryCounter);
		return fetchHistory();
	}, [eventStore.reloadHistoryCounter]);

	const renderHistory = (historyRow: any) => {
		const updatedAt = new Date(historyRow.updatedAt);
		const now = new Date();

		const offset = -1 * getOffsetInHours();

		const updatedAtWithOffset = addHours(updatedAt, offset);

		const when =
			formatDate(updatedAt) == formatDate(now)
				? formatTimeFromISODateString(updatedAtWithOffset.toISOString())
				: formatDate(updatedAt);

		let count = historyRow.actionParams.count;
		if (count == undefined) {
			if (historyRow.action == TripActions.changedCategory) {
				count =
					Object.keys(historyRow.actionParams).filter(
						(c) => ['openingHours', 'images', 'timingError', 'className', 'id'].indexOf(c) == -1
					).length - 1;
			} else {
				count = Object.keys(historyRow.actionParams).filter(
					(c) => ['openingHours', 'images', 'timingError', 'className', 'id'].indexOf(c) == -1
				).length;
			}
		}

		historyRow.actionParams.count2 = historyRow.actionParams.count2 ?? historyRow.actionParams.count;

		const title = TranslateService.translate(
			eventStore,
			historyRow.updatedBy !== getCurrentUsername() ? historyRow.action : historyRow.action + 'You',
			{
				...historyRow.actionParams,
				eventName: historyRow.eventName,
				count,
				categoryName: historyRow.actionParams?.categoryName,
				count2: historyRow.actionParams.count2,
				totalAffected:
					historyRow.action == TripActions.deletedCategory
						? (historyRow.actionParams?.totalAffectedCalendar ?? 0) +
						  (historyRow.actionParams?.totalAffectedSidebar ?? 0)
						: undefined,
				permissions: historyRow.actionParams?.permissions
					? TranslateService.translate(eventStore, historyRow.actionParams?.permissions)
					: '',
			}
		);

		const addition = historyRow.updatedBy !== getCurrentUsername() ? 'Full' : 'FullYou';
		const fullTitle = TranslateService.translate(eventStore, historyRow.action + addition, {
			who: historyRow.updatedBy,
			eventName: historyRow.eventName,
			...historyRow.actionParams,
			was: LogHistoryService.getWas(historyRow) ?? historyRow.actionParams.was,
			count:
				historyRow.actionParams.count ?? historyRow.action == TripActions.changedCategory
					? Object.keys(historyRow.actionParams).filter(
							(c) => ['openingHours', 'images', 'timingError', 'className', 'id'].indexOf(c) == -1
					  ).length - 1
					: Object.keys(historyRow.actionParams).filter(
							(c) => ['openingHours', 'images', 'timingError', 'className', 'id'].indexOf(c) == -1
					  ).length,
			totalAffected:
				historyRow.action == TripActions.deletedCategory
					? (historyRow.actionParams?.totalAffectedCalendar ?? 0) +
					  (historyRow.actionParams?.totalAffectedSidebar ?? 0)
					: undefined,
			permissions: historyRow.actionParams?.permissions
				? TranslateService.translate(eventStore, historyRow.actionParams?.permissions)
				: '',
		});

		return (
			<div
				className="triplan-history space-between padding-inline-8 gap-8 align-items-center cursor-pointer"
				title={fullTitle}
				onClick={() => {
					ReactModalService.openSeeHistoryDetails(eventStore, historyRow, fullTitle);
				}}
			>
				<i className="fa fa-clock-o" aria-hidden="true" />
				<div className="history-when flex-row gap-8">{when}</div>
				<div className="flex-row gap-4 align-items-center flex-1-1-0 min-width-0">
					{historyRow.updatedBy !== getCurrentUsername() && (
						<div className="history-updated-by">{historyRow.updatedBy}</div>
					)}
					<div className="history-title flex-row align-items-center flex-1-1-0 min-width-0 text-align-start">
						<EllipsisWithTooltip>{title}</EllipsisWithTooltip>
					</div>
				</div>
			</div>
		);
	};

	if (historyRecords?.length == 0) {
		return null;
	}

	return (
		<>
			{props.renderPrefix?.()}
			<div className="flex-col align-items-center justify-content-center" key={eventStore.reloadHistoryCounter}>
				<b>
					{TranslateService.translate(eventStore, 'RECENT_CHANGES', {
						count: historyRecords?.length?.toString() ?? '0',
					})}
				</b>
				<div className="flex-col gap-4 width-100-percents margin-top-10 max-height-370 overflow-auto bright-scrollbar">
					{historyRecords?.map(renderHistory)}
				</div>
			</div>
		</>
	);
}

export default observer(TriplanSidebarHistory);
