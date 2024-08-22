import {observer} from "mobx-react";
import TranslateService from "../../../services/translate-service";
import React, {useContext} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import DataServices, {
    Trip,
    tripNameToLSTripName
} from "../../../services/data-handlers/data-handler-base";
import {formatShortDateStringIsrael, getAmountOfDays, getUserDateFormat} from "../../../utils/time-utils";
import {getClasses, LOADER_DETAILS} from "../../../utils/utils";
import {useNavigate} from "react-router-dom";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import {myTripsContext} from "../../stores/my-trips-store";
import LoadingComponent from "../../../components/loading/loading-component";
import ReactModalService from "../../../services/react-modal-service";
import LogHistoryService from "../../../services/data-handlers/log-history-service";
import {TripActions} from "../../../utils/interfaces";
import './my-trips-tab.scss';
import moment from "moment";


function MyTripsTab(){
    const eventStore = useContext(eventStoreContext);
    const myTripsStore = useContext(myTripsContext);
    const navigate = useNavigate();

    async function onEditTripSave(tripId: number, tripName: string, newName: string) {
        let isOk = true;

        const oldName = tripName; // if name was changed
        if (oldName !== newName) {
            // validate title not already exist
            if (
                myTripsStore.allTripsSorted.find((t) => t.name.replaceAll("-"," ") === newName.replaceAll("-"," ") && t.id != tripId)
            ) {
                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.ERROR.TITLE',
                    'MODALS.ERROR.TRIP_NAME_ALREADY_EXIST',
                    'error'
                );
                isOk = false;
                return;
            }
        }

        if (isOk) {
            await eventStore.dataService.setTripName(tripName, newName);
            // DataServices.LocalStorageService.setTripName(tripName, newName)

            ReactModalService.internal.closeModal(eventStore);

            LogHistoryService.logHistory(eventStore, TripActions.updatedTrip, {
                tripName: {
                    was: oldName,
                    now: newName,
                }
            }, undefined, undefined, tripId);

            ReactModalService.internal.alertMessage(
                eventStore,
                'MODALS.UPDATED.TITLE',
                'MODALS.UPDATED_TRIP.CONTENT',
                'success'
            );

            setTimeout(() => {
                myTripsStore.toggleEditTrip(tripId);
                myTripsStore.loadMyTrips(false);
                // window.location.reload();
            }, 2000);
        }
    };

    function renderTrip(trip: Trip){
        const classList = getClasses("align-items-center", eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

        const itemsWithImages = [...trip.calendarEvents, ...trip.allEvents].filter((i) => i?.images?.length).filter((i) => {
            const images = i.images.split(",");
            return !images[0].includes("googleapis");
        });

        const images: string[] = itemsWithImages.map((i) => i.images.split(",")[0].split("\n")[0]);
        const idxToDetails = {};
        itemsWithImages?.forEach((i, idx) =>
            idxToDetails[idx] = i
        );

        if (images.length == 0){
            images.push("/images/trip-photo-1.jpg");
        }

        const isSharedTrip = myTripsStore.mySharedTrips.find((s) => s.id == trip.id);
        const item = {
            ...trip,
            tripId: trip.id,
            images: images,
            imagesNames: images.map((i) => itemsWithImages.find((item) => item.images.includes(i))?.title),
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

        const isEditMode = myTripsStore.isTripOnEditMode(trip.id);
        return (
            <div key={`${trip.id}-${isEditMode}`} className={classList}>
                <PointOfInterest
                    key={trip.id}
                    item={item}
                    eventStore={eventStore}
                    mainFeed myTrips onClick={() => navigate('/plan/' + trip.name, {})}
                    renderTripActions={() => renderTripActions(trip)}
                    renderTripInfo={() => renderTripInfo(trip)}
                    namePrefix={isSharedTrip ? <span>{TranslateService.translate(eventStore, 'SHARED_TRIP')}:&nbsp;</span> : undefined}
                    isEditMode={isEditMode}
                    onEditSave={(newValue: string) => {
                        onEditTripSave(trip.id, trip.name, newValue)
                    }}
                />
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

    function onEditTrip(e: any, LSTripName: string, tripId: number) {
        e.preventDefault();
        e.stopPropagation();

        myTripsStore.toggleEditTrip(tripId);
        // if (!eventStore.isMobile) {
        //     myTripsStore.toggleEditTrip(tripId);
        //     return;
        // }
        //
        // if (Object.keys(eventStore.modalValues).length === 0) {
        //     eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
        // }
        // ReactModalService.openEditTripModal(eventStore, LSTripName, tripId);
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

    function daysBetween(date1, date2) {
        // Parse the dates
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Calculate the difference in milliseconds
        const diffTime = Math.abs(d2 - d1);

        // Convert milliseconds to days
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    function daysAgo(date1){
        return daysBetween(date1, new Date());
    }

    function renderTripInfo(trip: Trip) {
        const dates = trip.dateRange;
        const start = formatShortDateStringIsrael(dates.start!);
        const end = formatShortDateStringIsrael(dates.end!);
        const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

        const totalSidebarEvents = Object.values(trip.sidebarEvents).flat().length;
        const totalCalendarEvents = trip.calendarEvents.length;

        // const createdAt = new Date(trip.createdAt).toLocaleDateString();
        const dateFormat = getUserDateFormat(eventStore);
        const createdAt = moment(trip.createdAt, 'YYYY-MM-DD').format(dateFormat);
        const daysAgoNum = daysAgo(new Date(trip.createdAt));

        const updatedAt = moment(trip.lastUpdateAt, 'YYYY-MM-DD').format(dateFormat);
        const uDaysAgoNum = daysAgo(new Date(trip.lastUpdateAt));

        return (
            <>
                <div className="flex-row gap-3 flex-wrap-wrap">
                    <div id="when">
                        {TranslateService.translate(eventStore, 'DATES')}: {end} - {start}
                    </div>
                    <div id="amount-of-days">
                        ({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})
                    </div>
                </div>
                <span>
                        {TranslateService.translate(eventStore, 'DESTINATIONS_X', {X: !trip.destinations?.length ? "-" : trip.destinations.map((d) => TranslateService.translate(eventStore, d)).join(", ")})}
                </span>
                <div className="activities-info">
                    <span>
                        {TranslateService.translate(eventStore, 'MY_TRIPS.ITEMS', {X: totalSidebarEvents + totalCalendarEvents})}
                    </span>
                    <span>
                        {TranslateService.translate(eventStore, 'scheduled_events')}: {totalCalendarEvents}
                    </span>
                    <span>
                        {TranslateService.translate(eventStore, 'sidebar_events')}: {totalSidebarEvents}
                    </span>
                </div>

                <span>
                    {TranslateService.translate(eventStore, 'CREATED_AT_X', {
                        X: `${createdAt} (${TranslateService.translate(eventStore, daysAgoNum == 0 ? 'BUTTON_TEXT.TODAY' : 'DAYS_AGO', {
                            Y: daysAgoNum
                        })})`
                    })}
                </span>
                <span>
                    {TranslateService.translate(eventStore, 'UPDATED_AT_X', {
                        X: `${updatedAt} (${TranslateService.translate(eventStore, uDaysAgoNum == 0 ? 'BUTTON_TEXT.TODAY' : 'DAYS_AGO', {
                            Y: uDaysAgoNum
                        })})`
                    })}
                </span>
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
                        className={getClasses("fa fa-pencil-square-o", myTripsStore.isTripOnEditMode(trip.id) && 'active')}
                        aria-hidden="true"
                        title={TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}
                        onClick={(e) => onEditTrip(e, LSTripName, trip.id)}
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