import {observer} from "mobx-react";
import React, {CSSProperties, useContext} from "react";
import {eventStoreContext} from "../../stores/events-store";
import {modalsStoreContext} from "../../stores/modals-store";
import {TripDataSource, TriplanEventPreferredTime, TriplanPriority} from "../../utils/enums";
import {DBService} from "../../services/data-handlers/db-service";
import useAsyncMemo from "../../custom-hooks/use-async-memo";
import TranslateService from "../../services/translate-service";
import Button, {ButtonFlavor} from "../common/button/button";
import ReactModalService from "../../services/react-modal-service";
import {
    addLineBreaks,
    calendarOrSidebarEventDetails,
    getClasses,
    getCurrentUsername,
    isHotelsCategory,
    ucfirst
} from "../../utils/utils";
import {runInAction} from "mobx";
import {
    CalendarEvent,
    SidebarEvent,
    TripActions,
    TriPlanCategory,
} from "../../utils/interfaces";
import {
    addHours,
    formatDate,
    formatTimeFromISODateString, getDurationString,
    getOffsetInHours,
} from "../../utils/time-utils";
import TriplanSearch from "../triplan-header/triplan-search/triplan-search";
import LogHistoryService from "../../services/data-handlers/log-history-service";
import {TriplanSidebarProps} from "./triplan-sidebar";
import './triplan-sidebar-inner.scss';
import TriplanSidebarCollapsableMenu from "./triplan-sidebar-collapsable-menu/triplan-sidebar-collapsable-menu";
import TriplanSidebarShareTripButton from "./triplan-sidebar-share-trip-button/triplan-sidebar-share-trip-button";
import TriplanSidebarMainButtons from "./triplan-sidebar-main-buttons/triplan-sidebar-main-buttons";

// @ts-ignore
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import {TriplanSidebarDivider} from "./triplan-sidebar-divider";
import TriplanSidebarCategories from "./triplan-sidebar-categories/triplan-sidebar-categories";

const TriplanSidebarInner = (props: TriplanSidebarProps) => {
    const eventStore = useContext(eventStoreContext);
    const { removeEventFromSidebarById, addToEventsToCategories, TriplanCalendarRef } = props;

    const fetchCollaborators = async (): Promise<any[]> => {
        if (eventStore.dataService.getDataSourceName() == TripDataSource.DB) {
            const data = await (eventStore.dataService as DBService).getCollaborators(eventStore);
            return data;
        }
        return [];
    };

    // const { data: collaborators, loading, error } = useAsyncMemo<any[]>(fetchCollaborators, [eventStore.dataService]);
    const { data: collaborators } = useAsyncMemo<any[]>(
        () => fetchCollaborators(),
        [eventStore.reloadCollaboratorsCounter]
    );

    const fetchHistory = async (): Promise<any[]> => {
        if (eventStore.dataService.getDataSourceName() == TripDataSource.DB) {
            const data = await (eventStore.dataService as DBService).getHistory(eventStore.tripId);
            return data.history;
        }
        return [];
    };

    // const { data: collaborators, loading, error } = useAsyncMemo<any[]>(fetchCollaborators, [eventStore.dataService]);
    const { data: historyRecords } = useAsyncMemo<any[]>(() => {
        console.log('fetching!', eventStore.reloadHistoryCounter);
        return fetchHistory();
    }, [eventStore.reloadHistoryCounter]);

    const renderShareTripPlaceholder = () => {
        const renderCollaborator = (collaborator: any) => {
            return (
                <div className="triplan-collaborator space-between padding-inline-8">
                    <div className="flex-row gap-8 align-items-center">
                        <i className="fa fa-users" aria-hidden="true" />
                        <div className="collaborator-name">{collaborator.username}</div>
                        <div className="collaborator-permissions-icons flex-row gap-8 align-items-center">
                            {collaborator.canRead && (
                                <i
                                    className="fa fa-eye"
                                    title={TranslateService.translate(eventStore, 'CAN_VIEW')}
                                    aria-hidden="true"
                                />
                            )}
                            {collaborator.canWrite && (
                                <i
                                    className="fa fa-pencil"
                                    title={TranslateService.translate(eventStore, 'CAN_EDIT')}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    </div>
                    <div className="collaborator-permissions flex-row gap-8">
                        <Button
                            flavor={ButtonFlavor.link}
                            text={TranslateService.translate(eventStore, 'CHANGE_PERMISSIONS')}
                            onClick={() => {
                                ReactModalService.openChangeCollaboratorPermissionsModal(eventStore, collaborator);
                            }}
                        />
                        <Button
                            flavor={ButtonFlavor.link}
                            text={'X'}
                            onClick={() => {
                                ReactModalService.openDeleteCollaboratorPermissionsModal(eventStore, collaborator);
                            }}
                        />
                    </div>
                </div>
            );
        };

        return (
            <div className="flex-col align-items-center justify-content-center">
                <b>{TranslateService.translate(eventStore, 'SHARE_TRIP.DESCRIPTION.TITLE')}</b>
                <span className="white-space-pre-line text-align-center width-100-percents opacity-0-5">
					{TranslateService.translate(eventStore, 'SHARE_TRIP.DESCRIPTION.CONTENT')}
				</span>
                <TriplanSidebarShareTripButton isMoveAble={false} className="width-100-percents" />
                {!!collaborators?.length && (
                    <div className="flex-col align-items-center justify-content-center margin-block-10 width-100-percents">
                        <b>{TranslateService.translate(eventStore, 'COLLABORATORS.TITLE')}</b>
                        <div className="flex-col gap-4 width-100-percents justify-content-center margin-top-10">
                            {collaborators?.map(renderCollaborator)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTripHistory = () => {
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
                if (historyRow.action == TripActions.changedCategory){
                    count = Object.keys(historyRow.actionParams).filter(
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

        return (
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
        );
    };

    return (
        <div>
            <TriplanSidebarMainButtons />
            <div>
                <TriplanSidebarCollapsableMenu />
                <TriplanSidebarDivider />
                <TriplanSidebarCategories addToEventsToCategories={addToEventsToCategories} removeEventFromSidebarById={removeEventFromSidebarById} TriplanCalendarRef={TriplanCalendarRef} />
                {!eventStore.isSharedTrip && <TriplanSidebarDivider />}
                {!eventStore.isSharedTrip && renderShareTripPlaceholder()}
                {!!historyRecords?.length && <TriplanSidebarDivider />}
                {!!historyRecords?.length && renderTripHistory()}
            </div>
        </div>
    )
};

export default observer(TriplanSidebarInner);
