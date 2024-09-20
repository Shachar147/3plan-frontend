import React, {useContext, useEffect, useRef, useState} from 'react';
import {Observer, observer} from "mobx-react";
import './trip-template-page-content.scss'
import MapContainer from "../../../components/map-container/map-container";
import {eventStoreContext} from "../../../stores/events-store";
import {tripTemplatesContext} from "../../stores/templates-store";
import {useParams} from "react-router-dom";
import TranslateService from "../../../services/translate-service";
import {runInAction} from "mobx";
import {Image, PointOfInterestShimmering} from "../../components/point-of-interest/point-of-interest";
import {EventInput} from "@fullcalendar/react";
import ListViewService from "../../../services/list-view-service";
import {getTripTemplatePhoto} from "./utils";
import {getClasses, getEventDescription, getEventTitle} from "../../../utils/utils";
import TripTemplateBanner from "./trip-template-banner";
import TripTemplateDay from "./trip-template-day";
import ScrollToTopButton from "../../components/scroll-top/scroll-top";
import {CalendarEvent} from "../../../utils/interfaces";

function TripTemplateDayShimmering({baseClass, idx = 0, counter = 0, notesCounter = 0}){
    const eventStore = useContext(eventStoreContext);

    // @ts-ignore
    const events: CalendarEvent[] = [{},{},{},{},{}];
    return (
        <div className={`${baseClass}-day-container`}>
            <h3 className={`${baseClass}-day-title`}>{TranslateService.translate(eventStore, 'DAY_X', { X: idx+1})}</h3>
            {events.map((e, idx2) => {
                return (
                    (
                        <div className={`${baseClass}-activity`}>
                            <div className={`${baseClass}-activity-marker-icon`}>
                                <i className="fa fa-map-marker" />
                                <span>{counter + idx2 + 1 - notesCounter}</span>
                            </div>
                            <div className={`${baseClass}-activity-image shimmer-animation`} />
                            <div className={`${baseClass}-activity-content`}>
                                <h2 className={`${baseClass}-activity-content-title shimmer-animation`} style={{
                                    width: 90,
                                    height: 33
                                }} />
                                <div className={`${baseClass}-activity-category-tag shimmer-animation`} style={{
                                    width: 50,
                                    height: 18
                                }} />
                                <div className={`${baseClass}-activity-content-description shimmer-animation`} style={{
                                    width: 300,
                                    height: 21
                                }} />
                                <div className={`${baseClass}-activity-content-description shimmer-animation`} style={{
                                    width: 300,
                                    height: 21
                                }} />
                                <div className={`${baseClass}-activity-content-description shimmer-animation`} style={{
                                    width: 220,
                                    height: 21
                                }} />
                            </div>
                        </div>
                    )
                )
            })}
        </div>
    )
}

function ItineraryShimmering({baseClass}) {
    return (
        <div className={getClasses(baseClass, "trip-template-itinerary-shimmering bright-scrollbar")}>
            <TripTemplateBanner baseClass={baseClass} isShimmering />
            <TripTemplateDayShimmering baseClass={baseClass} />
            <TripTemplateDayShimmering baseClass={baseClass} idx={1} counter={5} />
            <TripTemplateDayShimmering baseClass={baseClass} idx={2} counter={10} />
        </div>
    )
}

function TripTemplatePageContent(){
    const { templateId } = useParams();
    const eventStore = useContext(eventStoreContext);
    const templatesStore = useContext(tripTemplatesContext);

    const containerRef = useRef<any>(null);
    const MapContainerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [coverImage, setCoverImage] = useState(undefined);

    async function init(){
        if (!templatesStore.tripTemplates.find((t) => t.id == templateId)){
            await templatesStore.loadTemplates();
        }
        const tripData = templatesStore.tripTemplates.find((t) => t.id == templateId);
        if (!tripData){
            setErrorMessage(TranslateService.translate(eventStore, 'OOPS_SOMETHING_WENT_WRONG'));
            setIsLoading(false);
        } else {
            await eventStore.updateTripData(tripData);
            runInAction(() => {
                eventStore.tripName = tripData.name;
            })

            const bgImage = await getTripTemplatePhoto(tripData);
            setCoverImage(bgImage);
            setIsLoading(false);
        }
    }

    useEffect(() => {
        setIsLoading(true);
        init();
    }, [])

    function renderMap() {
        if (eventStore.isMobile) {
            return undefined;
        }

        let content = (
            <div className="width-100-percents flex-col align-items-center justify-content-center text-align-center" style={{
                backgroundColor: "#fafafa",
                backgroundImage: `url('/loaders/map-loader.gif')`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}>
                <div className="position-relative top-120">{TranslateService.translate(eventStore, 'MAP_VIEW.LOADING_PLACEHOLDER')}</div>
            </div>
        );

        if (!isLoading) {
            content = (
                <div className="map-container flex-row" key={`${eventStore.forceMapReRender}-${JSON.stringify(eventStore.allEventsFilteredComputed)}`}>
                    <Observer>
                        {() => <MapContainer allEvents={eventStore.calendarEvents} ref={MapContainerRef} addToEventsToCategories={() => false} noHeader noFilters isReadOnly zoom={eventStore.showEventOnMap ? 14 : 12} isTemplate />}
                    </Observer>
                </div>
            )
        }

        return (
            <div className="map-container-wrapper flex-1-1-0">{content}</div>
        )
    }

    function renderItinerary(){

        const baseClass = "trip-template-itinerary";

        let content = <ItineraryShimmering baseClass={baseClass} />;

        if (!isLoading) {
            const calendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
                eventStore,
                eventStore.calendarEvents
            );
            const keys = Object.keys(calendarEventsPerDay);
            keys.forEach((k) => calendarEventsPerDay[k] = calendarEventsPerDay[k].filter((e) => e.title));

            let counter = 0;
            content = (
                <div className={getClasses(baseClass, "bright-scrollbar")} ref={containerRef}>
                    <TripTemplateBanner baseClass={baseClass} coverImage={coverImage} />
                    {Object.keys(calendarEventsPerDay).map((d, idx) => {
                        if (idx > 0){
                            counter += calendarEventsPerDay[keys[idx-1]].filter((x) => !x.allDay).length;
                        }
                        return (
                            <TripTemplateDay baseClass={baseClass} idx={idx} events={calendarEventsPerDay[d]} counter={counter} />
                        )
                    })}
                    <ScrollToTopButton containerRef={containerRef} scrollDistance={600} isSticky/>
                </div>
            )
        }

        return (
            <div className={getClasses("flex-row", `${baseClass}-wrapper`, eventStore.isMobile && "max-width-100-percents")}>{content}</div>
        )
    }

    return (
        <div className="trip-template-page-content">
            {renderItinerary()}
            {!eventStore.isMobile && renderMap()}
        </div>
    )
}

export default observer(TripTemplatePageContent);