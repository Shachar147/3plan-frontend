import TranslateService from "../../../services/translate-service";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import DataServices, {Trip, tripNameToLSTripName} from "../../../services/data-handlers/data-handler-base";
import {
    addDays,
    formatShortDateStringIsrael,
    getAmountOfDays,
    getUserDateFormat,
    validateDateRange
} from "../../../utils/time-utils";
import {getClasses, getEventDescription, getEventTitle, isTemplateUsername, LOADER_DETAILS} from "../../../utils/utils";
import {useNavigate} from "react-router-dom";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import {myTripsContext} from "../../stores/my-trips-store";
import LoadingComponent from "../../../components/loading/loading-component";
import ReactModalService from "../../../services/react-modal-service";
import LogHistoryService from "../../../services/data-handlers/log-history-service";
import {CalendarEvent, TripActions, TriPlanCategory} from "../../../utils/interfaces";
import './my-trips-tab.scss';
import moment from "moment";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import {
    defaultCalendarEvents,
    defaultDateRange,
    defaultEvents,
    formatDateString,
    getDefaultCategories
} from "../../../utils/defaults";
import {TripDataSource} from "../../../utils/enums";
import {DEFAULT_VIEW_MODE_FOR_NEW_TRIPS} from "../../../utils/consts";
import {upsertTripProps} from "../../../services/data-handlers/db-service";
import {observer} from "mobx-react";
import DestinationSelector from "../../components/destination-selector/destination-selector";
import {getParameterFromHash} from "../../utils/utils";
import {feedStoreContext} from "../../stores/feed-view-store";
import {IPointOfInterestToTripEvent} from "../../utils/interfaces";
import {myTripsTabId, newDesignRootPath} from "../../utils/consts";
import MainPage from "../../../pages/main-page/main-page";
import {tripTemplatesContext} from "../../stores/templates-store";

function MyTripsTab(){
    const eventStore = useContext(eventStoreContext);
    const myTripsStore = useContext(myTripsContext);
    const feedStore = useContext(feedStoreContext);
    const templatesStore = useContext(tripTemplatesContext)
    const navigate = useNavigate();

    const [addNewTripMode, setAddNewTripMode] = useState(window.location.hash.includes("createTrip"));
    const savedCollectionId = window.location.hash.includes('createTrip') ? getParameterFromHash('id') : undefined;
    const savedCollection = savedCollectionId ? feedStore.savedCollections.find((c) => c.id == savedCollectionId) : undefined;

    const templateId = window.location.hash.includes('createTrip') ? getParameterFromHash('tid') : undefined;
    const [template, setTemplate] = useState(templateId ? templatesStore.tripTemplates.find((t) => t.id == templateId) : undefined);

    const [planTripMode, setPlanTripMode] = useState(window.location.hash.includes("planTrip"));
    const [planTripName, setPlanTripName] = useState(undefined);

    const [errors, setErrors] = useState<Record<string, boolean>>({});
    useHandleWindowResize();
    const [customDateRange, setCustomDateRange] = useState(defaultDateRange());

    const [tripName, setTripName] = useState<string>("");
    const [selectedDestinations, setSelectedDestinations] = useState([]);

    useEffect(() => {
        if (savedCollection?.destination) {
            setTripName(TranslateService.translate(eventStore,'MY_TRIP_TO_X', { X: TranslateService.translate(eventStore, savedCollection.destination) }));
            setSelectedDestinations([savedCollection.destination]);
        }
    }, [savedCollection]);

    useEffect(() => {
        if (templatesStore.tripTemplates.length == 0) {
            templatesStore.loadTemplates().then(() => {
                setTemplate(templateId ? templatesStore.tripTemplates.find((t) => t.id == templateId) : undefined);
            });
        }
    }, [])

    useEffect(() => {
        if (template) {

            // @ts-ignore
            setTripName(getEventTitle({
                title: template.name
            }, eventStore, true));

            setSelectedDestinations(template.destinations);

            const dateDiff = daysBetween(new Date(template.dateRange.start), new Date(template.dateRange.end), false)
            const dateRange = {
                start: formatDateString(addDays(new Date(), 7)),
                end: formatDateString(addDays(new Date(), 7 + dateDiff))
            };
            setCustomDateRange(dateRange);

        }
    }, [template])

    useEffect(() => {
        document.querySelector('body').classList.remove('rtl');
        document.querySelector('body').classList.remove('ltr');
        document.querySelector('body').classList.add(eventStore.getCurrentDirection());
        eventStore.dataService.setCalendarLocale(eventStore.calendarLocalCode);
    }, [eventStore.calendarLocalCode]);

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
            const images = Array.isArray(i.images) ? i.images : i.images.split(",");
            return !images[0].includes("googleapis");
        });

        const images: string[] = itemsWithImages.map((i) => Array.isArray(i.images) ? i.images[0] : i.images.split(",")[0].split("\n")[0]);
        const idxToDetails = {};
        itemsWithImages?.forEach((i, idx) =>
            idxToDetails[idx] = i
        );

        if (images.length == 0){
            images.push("/images/trip-photo-1.jpg");
        }

        const isSharedTrip = myTripsStore.mySharedTrips.find((s) => s.id == trip.id);

        const numOfDestinations = trip.destinations?.length ?? 0

        const item = {
            ...trip,
            tripId: trip.id,
            images: images,
            imagesNames: images.map((i) => itemsWithImages.find((item) => item.images.includes(i))?.title),
            name: trip.name.replaceAll("-", " "),
            destination: trip.destinations?.join(", "),
            category: numOfDestinations > 1 ? "DESTINATIONS" : numOfDestinations == 1 ? "DESTINATION" : undefined,
            rate: undefined,
            isSystemRecommendation: undefined,
            location: undefined,
            more_info: undefined,
            source: undefined,
            description: undefined,
            idxToDetails,
            isSharedTrip,
        }

        const isEditMode = myTripsStore.isTripOnEditMode(trip.id);
        return (
            <div key={`${trip.id}-${isEditMode}`} className={classList}>
                <PointOfInterest
                    key={trip.id}
                    item={item}
                    eventStore={eventStore}
                    mainFeed
                    myTrips
                    onClick={() => {
                        // window.location.hash = `planTrip?name=${trip.name}`;
                        // setPlanTripName(trip.name);
                        // setPlanTripMode(true);
                        feedStore.setItems([]);
                        navigate(`${newDesignRootPath}/plan/${trip.name}`, {})
                    }}
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

    const loaderDetails = useMemo(() => LOADER_DETAILS(), []);
    if (myTripsStore.isLoading) {
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

    function daysBetween(date1, date2, isAbs: boolean = true) {
        // Parse the dates
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Calculate the difference in milliseconds
        const diffTime = isAbs ? Math.abs(d2 - d1) : d2 - d1;

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

    function getHideUnHideIcon(){
        if (isTemplateUsername()) {
            if (myTripsStore.showHidden) {
                return 'fa-thumbs-o-up';
            } else {
                return 'fa-thumbs-o-down';
            }
        }
        else {
            if (myTripsStore.showHidden) {
                return 'fa-eye';
            } else {
                return 'fa-eye-slash';
            }
        }
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
                        className={getClasses('fa', getHideUnHideIcon())}
                        aria-hidden="true"
                        title={TranslateService.translate(eventStore, myTripsStore.showHidden ? `UNHIDE_${what}` : `HIDE_${what}`)}
                        onClick={(e) => onHideUnhideTrip(e, LSTripName)}
                    />
                )}
            </div>
        );
    }

    function formatTemplateEvent(e: CalendarEvent, diff?: number) {
        e.description = getEventDescription(e, eventStore, true);
        e.title = getEventTitle(e, eventStore, true);

        if (e.start && diff){
            e.start = addDays(new Date(e.start), diff);
            e.end = addDays(new Date(e.end), diff);
        }

        return e;
    }

    function formatTemplateCategory(c: TriPlanCategory) {
        if (eventStore.isHebrew) {
            c.title = TranslateService.translateFromTo(eventStore, c.title, undefined, 'en', 'he') ?? c.title
        }

        return c;
    }

    function splitTitleAndIcons(input: string) {
        const iconRegex = /^[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]+/u;
        const iconMatch = input.match(iconRegex);
        const icon = iconMatch ? iconMatch[0] : '';
        const title = icon ? input.replace(icon, '').trim() : input;

        return { title, icon };
    }

    async function createNewTrip(tripName: string) {
        const areDatesValid = validateDateRange(eventStore, customDateRange.start, customDateRange.end);
        errors.start = !areDatesValid;
        errors.end = !areDatesValid;

        if (tripName.length == 0) {
            ReactModalService.internal.alertMessage(eventStore, 'MODALS.ERROR.TITLE', 'TRIP_NAME_EMPTY', 'error');
            setErrors({
                ...errors,
                title: true,
            });
            return;
        }

        if (!areDatesValid) {
            setErrors({
                ...errors,
                start: true,
                end: true,
            });
            return;
        }

        if (new Date(customDateRange.end).getTime() < new Date(customDateRange.start).getTime()) {
            setErrors({
                start: true,
                end: true,
            });
            ReactModalService.internal.alertMessage(
                eventStore,
                'MODALS.ERROR.TITLE',
                'MODALS.ERROR.START_DATE_SMALLER',
                'error'
            );
            return;
        }

        setErrors({});

        const TripName = tripName.replace(/\s/gi, '-');

        // local mode
        if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
            eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
            eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
            eventStore.setCustomDateRange(customDateRange);
            eventStore.dataService.setDateRange(customDateRange, TripName);
            navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
        } else {
            const tripData: upsertTripProps = {
                name: TripName,
                dateRange: customDateRange,
                calendarLocale: eventStore.calendarLocalCode,
                allEvents: [],
                sidebarEvents: defaultEvents,
                calendarEvents: defaultCalendarEvents,
                categories: getDefaultCategories(eventStore),
                destinations: selectedDestinations
            };

            const categoryNameToId = tripData.categories.reduce((hash, category) => {
                hash[category.title] = category.id;
                return hash;
            }, {})

            if (savedCollection){
                const items = savedCollection.items.map((i) => i.fullDetails);

                const sidebarEvents = {};

                const allEvents = items.map((i, idx) => {
                    const parsedItem = IPointOfInterestToTripEvent(i, idx);

                    i.category = i.category || "CATEGORY.GENERAL";

                    // @ts-ignore
                    parsedItem.images = i.images?.join("\n");

                    const {title, icon} = splitTitleAndIcons(i.category);

                    let categoryId = categoryNameToId[title] ?? categoryNameToId[TranslateService.translate(eventStore, title)] ??
                        categoryNameToId[TranslateService.translateFromTo(eventStore, title, {}, 'en', eventStore.calendarLocalCode)] ??
                        categoryNameToId[TranslateService.translateFromTo(eventStore, title, {}, 'he', eventStore.calendarLocalCode)];

                    if (!categoryId) {
                        const maxCategoryId = Math.max(...Object.values(categoryNameToId));
                        categoryId = maxCategoryId + 1;

                        tripData.categories.push({
                            id: maxCategoryId + 1,
                            title,
                            icon
                            // title: i.category,
                            // icon: ''
                        });
                        categoryNameToId[i.category] = categoryId;
                    }
                    parsedItem.category = categoryId;

                    sidebarEvents[categoryId] ||= [];
                    sidebarEvents[categoryId].push(parsedItem);

                    return parsedItem;
                });

                tripData.allEvents = allEvents;
                tripData.sidebarEvents = sidebarEvents;
            }

            if (template){

                const dayOne = new Date(customDateRange.start);
                const templateDayOne = new Date(template.dateRange.start);
                const diff = daysBetween(templateDayOne, dayOne, false);

                tripData.allEvents = template.allEvents.map(formatTemplateEvent);
                const sidebarEvents = {};
                Object.keys(template.sidebarEvents).forEach((c) => {
                    sidebarEvents[c] = template.sidebarEvents[c].map(formatTemplateEvent)
                })

                tripData.sidebarEvents = sidebarEvents;
                tripData.calendarEvents = template.calendarEvents.map((c) => formatTemplateEvent(c, diff));
                tripData.categories = template.categories.map(formatTemplateCategory);
            }

            // backup
            let { viewMode, mobileViewMode } = eventStore;

            // @ts-ignore
            await DataServices.DBService.createTrip(
                tripData,
                (res: any) => {
                    // switch to map view as  the default view.
                    eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
                    eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);

                    eventStore.setCustomDateRange(customDateRange);
                    eventStore.dataService.setDateRange(customDateRange, TripName);

                    // keep to history:
                    LogHistoryService.logHistory(eventStore, TripActions.createdTrip, {
                        tripName: TripName,
                    });

                    navigate(`${newDesignRootPath}/plan/${res.data.name}`);
                    // navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
                },
                (e) => {
                    // restore to backup
                    eventStore.setViewMode(viewMode);
                    eventStore.setMobileViewMode(mobileViewMode);

                    if (e.response.data.statusCode === 409) {
                        setErrors({
                            title: true,
                        });
                        ReactModalService.internal.alertMessage(
                            eventStore,
                            'MODALS.ERROR.TITLE',
                            'TRIP_ALREADY_EXISTS',
                            'error'
                        );
                    } else {
                        ReactModalService.internal.alertMessage(
                            eventStore,
                            'MODALS.ERROR.TITLE',
                            'OOPS_SOMETHING_WENT_WRONG',
                            'error'
                        );
                    }
                },
                () => {}
            );
        }
    }

    function updateErrorsOnDateChange(start: string, end: string) {
        // means user already clicked on submit at least once.
        if (Object.keys(errors).length) {
            const isValid = validateDateRange(eventStore, start, end, undefined, undefined, undefined, false);

            setErrors({
                ...errors,
                start: !isValid,
                end: !isValid,
            });
        }
    }

    function renderGoBackButton() {
        return (
            <Button
                text={eventStore.isMobile ? undefined : TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS')}
                flavor={ButtonFlavor.secondary}
                className="padding-inline-15 font-size-14 font-weight-normal black"
                icon={`fa-chevron-${eventStore.getCurrentDirectionStart()}`}
                onClick={() => {
                    window.location.hash = myTripsTabId;
                    setAddNewTripMode(false);
                }}
            />
        )
    }

    function renderAddTripButton(flavor: ButtonFlavor = ButtonFlavor.secondary){

        function getBtnText(){
            if (myTripsStore.showHidden){
                return TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS');
            }
            if (addNewTripMode) {
                return TranslateService.translate(eventStore, 'CREATE_TRIP');
            }
            if (!eventStore.isMobile) {
                return TranslateService.translate(eventStore, what == "TRIP" ? 'LANDING_PAGE.START_NOW' : "CREATE_NEW_TEMPLATE");
            }
            return undefined; // on my trips tab if mobile
        }

        return (
            <>
                <Button
                    text={getBtnText()}
                    flavor={flavor}
                    className={getClasses("padding-inline-15 font-size-14 font-weight-normal", eventStore.isMobile && 'black')}
                    icon={myTripsStore.showHidden ? `fa-chevron-${eventStore.getCurrentDirectionStart()}` : "fa-plus-square-o"}
                    onClick={() => {
                        if (myTripsStore.showHidden) {
                            myTripsStore.setShowHidden(false);
                        }
                        else if (addNewTripMode) {
                            createNewTrip(tripName);
                        } else {
                            setAddNewTripMode(true);
                        }
                        // navigate('/getting-started');

                        window.scrollTo({
                            top: eventStore.isMobile ? 250 : 500,
                            behavior: 'smooth',
                        });
                    }}
                />
                {addNewTripMode && myTripsStore.allTripsSorted.length > 0 && (
                    <Button
                        text={eventStore.isMobile ? undefined : TranslateService.translate(eventStore, 'BACK_TO_MY_TRIPS')}
                        flavor={ButtonFlavor.link}
                        onClick={() => {
                            window.location.hash = myTripsTabId;
                            setAddNewTripMode(false);
                        }}
                    />
                )}
            </>
        )
    }

    function renderDescription(){
        return (
            <span className="white-space-pre-line margin-bottom-20" dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, `CREATE_NEW_${what}_TITLE.DESCRIPTION`)}} />
        );
    }

    function renderNoTripsPlaceholder(){
        return (
            <div className="my-trips-actionbar width-100-percents align-items-center">
                <hr className="width-100-percents"/>
                <img src="/images/new-trip.png" className="border-radius-round" width="200" />
                <div className="flex-column gap-5">
                    <h3>{TranslateService.translate(eventStore, `CREATE_NEW_${what}_TITLE`)}</h3>
                    {renderDescription()}
                    {renderAddTripButton()}
                </div>
                <br/><br/><br/>
                <hr className="width-100-percents"/>
            </div>
        );
    }

    function renderCreateTripPlaceholder(){
        return (
            <div className="my-trips-actionbar width-100-percents align-items-center">
                <hr className="width-100-percents"/>
                <img src="/images/new-trip.png" className={getClasses('border-radius-round', 'fa-spin-reverse')} width="200" />
                <div className="flex-column gap-5 form-content">
                    <h3>{TranslateService.translate(eventStore, 'CREATE_NEW_TRIP_TITLE.ADD_NEW_TRIP')}</h3>
                    {renderCreateTripForm()}
                    {renderAddTripButton()}
                </div>
                <br/><br/><br/>
                <hr className="width-100-percents"/>
            </div>
        );
    }

    function renderCreateTripForm(){
        return (
            <div
                className="custom-dates-container align-items-center margin-bottom-15"
                style={{
                    backgroundColor: 'transparent',
                    border: 0,
                }}
            >
                <div className="main-font font-size-20">
                    {TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
                </div>
                <div className="trip-name-line margin-bottom-5">
                    <input
                        type={'text'}
                        style={{
                            paddingInline: '15px',
                            height: '40px',
                            maxWidth: '300px',
                        }}
                        placeholder={TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
                        value={tripName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setTripName(value);

                            if (errors['title']) {
                                setErrors({
                                    ...errors,
                                    title: value.length == 0,
                                });
                            }
                        }}
                        className={getClasses(errors['title'] && 'red-border')}
                    />
                </div>

                <div className="main-font font-size-20">
                    {TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_ARE_YOU_GOING_TO')}
                </div>
                <div className="custom-dates-line flex-row align-items-center margin-bottom-5">
                    <DestinationSelector onChange={setSelectedDestinations} selectedDestinations={selectedDestinations} />
                </div>

                <div className="main-font font-size-20">
                    {TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHEN_IS_YOUR_TRIP')}
                </div>
                <div className="custom-dates-line flex-row align-items-center margin-bottom-5">
                    <input
                        type="date"
                        onKeyDown={(e) => {
                            e.preventDefault();
                            return false;
                        }}
                        value={customDateRange.start}
                        onChange={(e) => {
                            const value = e.target.value;
                            setCustomDateRange({
                                start: value,
                                end: customDateRange.end,
                            });
                            updateErrorsOnDateChange(value, customDateRange.end);
                        }}
                        className={getClasses(errors['start'] && 'red-border')}
                    />
                    {TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.UNTIL')}
                    <input
                        type="date"
                        onKeyDown={(e) => {
                            e.preventDefault();
                            return false;
                        }}
                        value={customDateRange.end}
                        onChange={(e) => {
                            const value = e.target.value;
                            setCustomDateRange({
                                start: customDateRange.start,
                                end: value,
                            });
                            updateErrorsOnDateChange(customDateRange.start, value);
                        }}
                        className={getClasses(errors['end'] && 'red-border')}
                    />
                </div>
            </div>
        );
    }

    function getPageTitle(){
        let key = 'MY_TRIPS';
        if (myTripsStore.showHidden) {
            key = 'HIDDEN_TRIPS';
        }

        if (isTemplateUsername()) {
            if (myTripsStore.showHidden) {
                key = 'UNAPPROVED_TEMPLATES';
            } else {
                key = 'TRIP_TEMPLATES';
            }
        }

        return TranslateService.translate(eventStore, key);
    }

    const what = isTemplateUsername() ? 'TEMPLATE' : 'TRIP';

    return (
        <div className="flex-column align-items-start margin-top-10">
            <div className="flex-column align-items-center width-100-percents">
                <h3 className={getClasses("main-feed-header width-100-percents", eventStore.isMobile && 'flex-row')}>
                    <span>{TranslateService.translate(eventStore, getPageTitle())}</span>
                    {myTripsStore.allTripsSorted.length > 0 && !addNewTripMode && renderAddTripButton()}
                    {addNewTripMode && renderGoBackButton()}
                </h3>
                {!addNewTripMode && <span className="main-feed-description text-align-start" dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, myTripsStore.showHidden ? `MY_${what}S_HIDDEN_TAB.DESCRIPTION` : `MY_${what}S_TAB.DESCRIPTION`)}} />}
            </div>

            <div className="flex-row justify-content-center flex-wrap-wrap align-items-start width-100-percents" key={myTripsStore.myTrips?.length}>
                {
                    planTripMode ? <MainPage /> :
                    addNewTripMode ? renderCreateTripPlaceholder() :
                <>
                    {myTripsStore.allTripsSorted?.length == 0 ? renderNoTripsPlaceholder() : myTripsStore.allTripsSorted.map(renderTrip)}
                    {myTripsStore.hiddenTripsEnabled && (
                        <Button
                            onClick={() => {
                                myTripsStore.setShowHidden(!myTripsStore.showHidden);
                            }}
                            flavor={ButtonFlavor.link}
                            className="width-100-percents text-align-center"
                            text={TranslateService.translate(
                                eventStore,
                                myTripsStore.showHidden ? `SHOW_${what}S_LIST` : `SHOW_HIDDEN_${what}S_LIST`
                            )}
                        />
                    )}
                </>}
            </div>
        </div>
    )

}

export default observer(MyTripsTab);