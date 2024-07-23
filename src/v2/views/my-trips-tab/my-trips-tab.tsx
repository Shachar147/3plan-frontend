import {observer} from "mobx-react";
import TranslateService from "../../../services/translate-service";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import React, {useContext, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import DataServices, {
    DBTrip,
    SharedTrip,
    Trip,
    tripNameToLSTripName
} from "../../../services/data-handlers/data-handler-base";
import {getUser} from "../../../helpers/auth";
import {formatShortDateStringIsrael, getAmountOfDays} from "../../../utils/time-utils";
import {getClasses, LOADER_DETAILS} from "../../../utils/utils";
import {runInAction} from "mobx";
import {useNavigate} from "react-router-dom";
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import {fetchCitiesAndSetOptions} from "../../components/destination-selector/destination-selector";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import {myTripsContext} from "../../stores/my-trips-store";
import LoadingComponent from "../../../components/loading/loading-component";
import ReactModalService from "../../../services/react-modal-service";
import LogHistoryService from "../../../services/data-handlers/log-history-service";
import {TripActions} from "../../../utils/interfaces";
import './my-trips-tab.scss';

function MyTripsTabOld(){
    const [lsTrips, setLsTrips] = useState<Trip[] | DBTrip[]>([]);
    const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);
    const [showHidden, setShowHidden] = useState(false);

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

        const destinations = trip.destinations;

        if (tripName === '') return <></>;

        const classList = getClasses(
            ['sidebar-statistics main-font trips-list-trip'],
            dataSource.toLowerCase(),
            getUser() && 'logged-in'
        );

        function renderDestinationIcon(destination: string) {
            const found = fetchCitiesAndSetOptions().find((c) => c.value === destination);
            if (found) {
                return (
                    <i title={found.value} alt={found.value} className={found.flagClass} />
                );
            }
        }

        function renderTripInfo() {
            return (
                <>
                    <i
                        className={getClasses('fa', isSharedTrip ? 'fa-users' : 'fa-plane')}
                        title={isSharedTrip ? TranslateService.translate(eventStore, 'SHARED_TRIP') : undefined}
                        aria-hidden="true"
                    />
                    {destinations && <div className="flex-row gap-3">{destinations.map(renderDestinationIcon)}</div>}
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

function MyTripsTab(){
    const eventStore = useContext(eventStoreContext);
    const myTripsStore = useContext(myTripsContext);
    const navigate = useNavigate();

    function renderTrip(trip: Trip){
        const classList = getClasses("align-items-center", eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

        const itemsWithImages = trip.allEvents.filter((i) => i?.images?.length).filter((i) => {
            const images = i.images.split(",");
            return !images[0].includes("googleapis");
        });

        const images: string[] = itemsWithImages.map((i) => i.images.split(",")[0]);
        const idxToDetails = {};
        itemsWithImages?.forEach((i, idx) =>
            idxToDetails[idx] = i
        );

        if (images.length == 0){
            images.push("/images/trip-photo-1.jpg");
        }

        const isSharedTrip = myTripsStore.mySharedTrips.find((s) => s.id == trip.id);
        const item = {
            tripId: trip.id,
            images: images,
            name: trip.name.replaceAll("-", " "),
            destination: trip.destinations?.join(", "),
            category: undefined,
            rate: undefined,
            isSystemRecommendation: undefined,
            location: undefined,
            more_info: undefined,
            source: undefined,
            description: undefined,
            idxToDetails,
            isSharedTrip
        }

        return (
            <div key={item.id} className={classList}>
                <PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed myTrips onClick={() => navigate('/plan/' + trip.name, {})} renderTripActions={() => renderTripActions(trip)} renderTripInfo={() => renderTripInfo(trip)} namePrefix={isSharedTrip ? <span>{TranslateService.translate(eventStore, 'SHARED_TRIP')}:&nbsp;</span> : undefined} />
            </div>
        );
    }

    function renderNoTripsPlaceholder(){
        return TranslateService.translate(eventStore, 'NO_SAVED_COLLECTIONS');
    }

    if (myTripsStore.isLoading) {
        const loaderDetails = LOADER_DETAILS();
        return (
            <LoadingComponent
                title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
                message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
                loaderDetails={loaderDetails}
            />
        )
    }

    function onEditTrip(e: any, LSTripName: any) {
        e.preventDefault();
        e.stopPropagation();

        if (Object.keys(eventStore.modalValues).length === 0) {
            eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
        }
        ReactModalService.openEditTripModal(eventStore, LSTripName);
    }

    function onDuplicateTrip(e: any, LSTripName: any) {
        e.preventDefault();
        e.stopPropagation();

        if (Object.keys(eventStore.modalValues).length === 0) {
            eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
        }
        ReactModalService.openDuplicateTripModal(eventStore, LSTripName);
    }

    function onDeleteTrip(e: any, LSTripName: any) {
        e.preventDefault();
        e.stopPropagation();
        ReactModalService.openDeleteTripModal(eventStore, LSTripName, myTripsStore.dataSource);
    }

    function onHideUnhideTrip(e: any, LSTripName: any) {
        e.preventDefault();
        e.stopPropagation();
        if (myTripsStore.showHidden) {
            const tripName = LSTripName.replaceAll('-', ' ');

            DataServices.DBService.unHideTripByName(tripName)
                .then(() => {
                    LogHistoryService.logHistory(eventStore, TripActions.unhideTrip, {
                        tripName,
                    });

                    myTripsStore.loadMyTrips()
                })
                .catch(() => {
                    ReactModalService.internal.openOopsErrorModal(eventStore);
                });
        } else {
            ReactModalService.openHideTripModal(eventStore, LSTripName, myTripsStore.dataSource, () =>
                myTripsStore.loadMyTrips()
            );
        }
        // ReactModalService.openDeleteTripModal(eventStore, LSTripName, dataSource);
    }

    function renderTripInfo(trip: Trip) {
        const dates = trip.dateRange;
        const start = formatShortDateStringIsrael(dates.start!);
        const end = formatShortDateStringIsrael(dates.end!);
        const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

        const totalSidebarEvents = Object.values(trip.sidebarEvents).flat().length;
        const totalCalendarEvents = trip.calendarEvents.length;

        return (
            <>
                <span>
                    {TranslateService.translate(eventStore, 'MY_TRIPS.ITEMS', {X: totalSidebarEvents + totalCalendarEvents})}
                </span>
                <span>
                    {TranslateService.translate(eventStore, 'SCHEDULED_EVENTS')}: {totalCalendarEvents}
                </span>
                <span>
                    {TranslateService.translate(eventStore, 'SIDEBAR_EVENTS')}: {totalSidebarEvents}
                </span>
            <div className="flex-row gap-3 flex-wrap-wrap">
                <div id="when">
                    {TranslateService.translate(eventStore, 'DATES')}: {end} - {start}
                </div>
                <div id="amount-of-days">
                    ({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})
                </div>
            </div>
            </>
        );
    }

    function renderTripActions(trip: Trip) {
        // @ts-ignore
        const { isSharedTrip } = trip;
        const LSTripName = tripNameToLSTripName(trip.name);

        return (
            <div className="trips-list-trip-actions-v2">
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
                        className={getClasses('fa', myTripsStore.showHidden ? 'fa-eye' : 'fa-eye-slash')}
                        aria-hidden="true"
                        title={TranslateService.translate(eventStore, myTripsStore.showHidden ? 'UNHIDE_TRIP' : 'HIDE_TRIP')}
                        onClick={(e) => onHideUnhideTrip(e, LSTripName)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex-row justify-content-center flex-wrap-wrap align-items-start" key={myTripsStore.myTrips?.length}>
            {myTripsStore.allTripsSorted?.length == 0 ? renderNoTripsPlaceholder() : myTripsStore.allTripsSorted.map(renderTrip)}
        </div>
    )

}

export default observer(MyTripsTab);