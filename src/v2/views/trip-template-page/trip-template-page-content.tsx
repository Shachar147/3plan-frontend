import React, {useContext, useEffect, useRef, useState} from 'react';
import {Observer, observer} from "mobx-react";
import './trip-template-page-content.scss'
import MapContainer from "../../../components/map-container/map-container";
import {eventStoreContext} from "../../../stores/events-store";
import {tripTemplatesContext} from "../../stores/templates-store";
import {useParams} from "react-router-dom";
import TranslateService from "../../../services/translate-service";
import {runInAction} from "mobx";
import {PointOfInterestShimmering} from "../../components/point-of-interest/point-of-interest";
import {EventInput} from "@fullcalendar/react";
import ListViewService from "../../../services/list-view-service";
import {getTripTemplatePhoto} from "./utils";
import {getClasses} from "../../../utils/utils";
import TripTemplateBanner from "./trip-template-banner";
import TripTemplateDay from "./trip-template-day";

function TripTemplatePageContent(){
    const { templateId } = useParams();
    const eventStore = useContext(eventStoreContext);
    const templatesStore = useContext(tripTemplatesContext);

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
            <span className="width-100-percents flex-col align-items-center justify-content-center text-align-center">{TranslateService.translate(eventStore, 'MAP_VIEW.LOADING_PLACEHOLDER')}</span>
        );

        if (!isLoading) {
            content = (
                <div className="map-container flex-1-1-0" key={`${eventStore.forceMapReRender}-${JSON.stringify(eventStore.allEventsFilteredComputed)}`}>
                    <Observer>
                        {() => <MapContainer allEvents={eventStore.calendarEvents} ref={MapContainerRef} addToEventsToCategories={() => false} noHeader noFilters isReadOnly zoom={eventStore.showEventOnMap ? 14 : 12} />}
                    </Observer>
                </div>
            )
        }

        return (
            <div className="flex-1-1-0 max-width-50-percents">{content}</div>
        )
    }

    function renderItinerary(){

        const baseClass = "trip-template-itinerary";

        let content = <div className="flex-col width-100-percents align-items-center justify-content-center padding-block-10" style={{ transform: 'scale(0.5)'}}>
            <PointOfInterestShimmering />
            <PointOfInterestShimmering />
            <PointOfInterestShimmering />
            <PointOfInterestShimmering />
            <PointOfInterestShimmering />
        </div>;

        if (!isLoading) {
            const calendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
                eventStore,
                eventStore.calendarEvents
            );
            const keys = Object.keys(calendarEventsPerDay);
            keys.forEach((k) => calendarEventsPerDay[k] = calendarEventsPerDay[k].filter((e) => e.title));

            let counter = 0;
            content = (
                <div className={getClasses(baseClass, "bright-scrollbar")}>
                    <TripTemplateBanner baseClass={baseClass} coverImage={coverImage} />
                    {Object.keys(calendarEventsPerDay).map((d, idx) => {
                        if (idx > 0){
                            counter += calendarEventsPerDay[keys[idx-1]].filter((x) => !x.allDay).length;
                        }
                        return (
                            <TripTemplateDay baseClass={baseClass} idx={idx} events={calendarEventsPerDay[d]} counter={counter} />
                        )
                    })}
                </div>
            )
        }

        return (
            <div className={getClasses("flex-1-1-0", !eventStore.isMobile ? "max-width-50-percents" : "max-width-100-percents")}>{content}</div>
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