import {observer} from "mobx-react";
import TranslateService from "../../../services/translate-service";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import DataServices, {
    DBTrip,
    SharedTrip,
    Trip,
    tripNameToLSTripName
} from "../../../services/data-handlers/data-handler-base";
import {TripDataSource} from "../../../utils/enums";
import {LocalStorageService} from "../../../services/data-handlers/local-storage-service";
import {getUser} from "../../../helpers/auth";
import {formatShortDateStringIsrael, getAmountOfDays} from "../../../utils/time-utils";
import {getClasses} from "../../../utils/utils";
import {runInAction} from "mobx";
import {useNavigate} from "react-router-dom";
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';

function MyTrips(){
    const eventStore = useContext(eventStoreContext);
    const navigate = useNavigate();

    const [dataSource, setDataSource] = useState<TripDataSource>(
        LocalStorageService.getLastDataSource() === TripDataSource.DB && getUser()
            ? TripDataSource.DB
            : LocalStorageService.getLastDataSource() === TripDataSource.LOCAL
            ? TripDataSource.LOCAL
            : getUser()
                ? TripDataSource.DB
                : TripDataSource.LOCAL
    );
    const [lsTrips, setLsTrips] = useState<Trip[] | DBTrip[]>([]);
    const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);
    const [error, setError] = useState<any>(undefined);
    const [isLoadingTrips, setIsLoadingTrips] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const dataService = useMemo(() => DataServices.getService(dataSource), [dataSource]);
    const [reloadCounter, setReloadCounter] = useState(0);

    useEffect(() => {
        setLsTrips([]);
        setSharedTrips([]);
        setIsLoadingTrips(true);
        setError(undefined);

        dataService
            .getTripsShort(eventStore)
            .then((result) => {
                const { trips, sharedTrips } = result;
                setLsTrips(trips);
                setSharedTrips(sharedTrips);
                setIsLoadingTrips(false);
            })
            .catch((error) => {
                setError(error);
                setIsLoadingTrips(false);
            });
    }, [dataService, dataSource, reloadCounter]);

    const hiddenTripsEnabled = dataSource === 'DB';
    const filteredList = [...lsTrips, ...sharedTrips].filter((x) =>
        hiddenTripsEnabled ? !!x.isHidden == showHidden : true
    );

    function renderTrip(trip: Trip | DBTrip) {
        const tripName = trip.name;
        // let tripName = trip.name;
        // if (trip.id) {
        // 	tripName = `#${trip.id} - ${tripName}`;
        // }
        const LSTripName = tripNameToLSTripName(tripName);
        const dates = trip.dateRange;
        const start = formatShortDateStringIsrael(dates.start!);
        const end = formatShortDateStringIsrael(dates.end!);
        const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

        const sharedTripData = sharedTrips.find((s) => s.name == trip.name);
        const isSharedTrip = !!sharedTripData;
        const canRead = isSharedTrip ? sharedTripData.canRead : true;
        const canWrite = isSharedTrip ? sharedTripData.canWrite : true;

        if (tripName === '') return <></>;

        const classList = getClasses(
            ['sidebar-statistics main-font trips-list-trip'],
            dataSource.toLowerCase(),
            getUser() && 'logged-in'
        );

        function renderTripInfo() {
            return (
                <>
                    <i
                        className={getClasses('fa', isSharedTrip ? 'fa-users' : 'fa-plane')}
                        title={isSharedTrip ? TranslateService.translate(eventStore, 'SHARED_TRIP') : undefined}
                        aria-hidden="true"
                    />
                    <span className="my-trips-trip-name">
						<EllipsisWithTooltip placement="bottom">{tripName}</EllipsisWithTooltip>
					</span>
                    <div id="when">
                        {end} - {start}
                    </div>
                    <div id="amount-of-days">
                        ({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})
                    </div>
                </>
            );
        }

        function renderTripActions() {
            return (
                <div className="trips-list-trip-actions">
                    {!isSharedTrip && (
                        <i
                            className="fa fa-pencil-square-o"
                            aria-hidden="true"
                            title={TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}
                            onClick={(e) => onEditTrip(e, LSTripName)}
                        />
                    )}
                    {!isSharedTrip && (
                        <i
                            className="fa fa-files-o"
                            aria-hidden="true"
                            title={TranslateService.translate(eventStore, 'DUPLICATE_TRIP_MODAL.TITLE')}
                            onClick={(e) => onDuplicateTrip(e, LSTripName)}
                        />
                    )}
                    {!isSharedTrip && (
                        <i
                            className="fa fa-trash-o position-relative top--1"
                            aria-hidden="true"
                            title={TranslateService.translate(eventStore, 'DELETE_TRIP')}
                            onClick={(e) => onDeleteTrip(e, LSTripName)}
                        />
                    )}
                    {!isSharedTrip && (
                        <i
                            className={getClasses('fa', showHidden ? 'fa-eye' : 'fa-eye-slash')}
                            aria-hidden="true"
                            title={TranslateService.translate(eventStore, showHidden ? 'UNHIDE_TRIP' : 'HIDE_TRIP')}
                            onClick={(e) => onHideUnhideTrip(e, LSTripName)}
                        />
                    )}
                </div>
            );
        }

        return (
            <div
                key={trip.name}
                className={classList}
                onClick={() => {
                    runInAction(() => {
                        // manually set loading before redirect to the page to prevent a bug of
                        // glimpse view of the previous trip before updating to this one.
                        eventStore.isLoading = true;
                        eventStore.setTripName(tripName);
                    });
                    navigate('/plan/' + tripName, {});
                }}
            >
                {renderTripInfo()}
                {renderTripActions()}
            </div>
        );
    }

    return (
        <div className="flex-column gap-10">
            <div className="my-trips width-100-percents-important bright-scrollbar">
                {filteredList
                    .sort((a, b) => {
                        const b_timestamp = b.lastUpdateAt ? new Date(b.lastUpdateAt).getTime() : 0;
                        const a_timestamp = a.lastUpdateAt ? new Date(a.lastUpdateAt).getTime() : 0;
                        return b_timestamp - a_timestamp;
                    })
                    .map(renderTrip)}
                {hiddenTripsEnabled && filteredList.length == 0 && showHidden && (
                    <div className="width-100-percents text-align-center padding-block-5 background-white">
                        {TranslateService.translate(eventStore, 'NO_HIDDEN_TRIPS')}
                    </div>
                )}
                {hiddenTripsEnabled && (
                    <Button
                        onClick={() => {
                            setShowHidden(!showHidden);
                        }}
                        flavor={ButtonFlavor.link}
                        className="width-100-percents text-align-center"
                        text={TranslateService.translate(
                            eventStore,
                            showHidden ? 'SHOW_TRIPS_LIST' : 'SHOW_HIDDEN_TRIPS_LIST'
                        )}
                    />
                )}
            </div>
            <Button
                text={TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}
                flavor={ButtonFlavor.primary}
                className="padding-inline-15"
                onClick={() => navigate('/getting-started')}
            />
        </div>
    );
}

export default observer(MyTrips);