import React, {useContext, useEffect, useState} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import {eventStoreContext} from "../../../stores/events-store";
import TranslateService from "../../../services/translate-service";
import {getClasses} from "../../../utils/utils";
import TriplanHeaderLine from "./triplan-header-line";
import {useParams} from "react-router-dom";
import {newDesignRootPath} from "../../utils/consts";
import PlacesPhotosApiService from "../../services/places-photos-api-service";
import {getParameterFromHash} from "../../utils/utils";
import {fetchCitiesAndSetOptions} from "../destination-selector/destination-selector";
import {feedStoreContext} from "../../stores/feed-view-store";


function TriplanHeaderBanner({ noHeader = false, withHr = false, isInLogin = false, isAlwaysSticky = false }: { noHeader?: boolean, withHr?: boolean, isInLogin?: boolean, isAlwaysSticky?: boolean }){
    const baseClass = "triplan-header-banner";
    const eventStore = useContext(eventStoreContext);
    const feedStore = useContext(feedStoreContext);

    const { tripName } = useParams();

    // const bgs = ["6.jpg", "5.jpg", "7.jpg", "8.jpg", "9.jpg"];
    // const bgs = ["6.jpg"]
    let isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);
    const defaultBanner = "/images/banner/best/10.png";
    const [backgroundImage, setBackgroundImage] = useState(defaultBanner)

    // ------------------------------------------------------------
    // load picture for the destination we're looking at right now
    // ------------------------------------------------------------
    useEffect(() => {
        isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);
        const searchKeyword = getParameterFromHash('q');
        const citiesAndCountries = fetchCitiesAndSetOptions();
        const inPlanWithDestinations = isInPlan && eventStore.destinations;
        const inSearchOfKnownCountryOrCity = searchKeyword && citiesAndCountries.find((c) => c.value.toLowerCase().trim() == searchKeyword.toLowerCase().trim());
        if ((inPlanWithDestinations || inSearchOfKnownCountryOrCity)) {
            if (backgroundImage == defaultBanner) {
                const destinations = searchKeyword ? [searchKeyword] : eventStore.destinations;
                Promise.all(destinations.map((d) => new PlacesPhotosApiService().getPhoto(d))).then((results) => {
                    // const bgs = results.map((r) => r["data"]?.[0]?.["photo"]).filter(Boolean);
                    const bgs = results.map((r) => r["data"]?.[0]?.["other_photos"]).filter(Boolean).map((b) => JSON.parse(b)).flat();
                    if (bgs.length) {
                        let random = Math.floor(Math.random() * bgs.length);
                        setBackgroundImage(bgs[random]);
                    }
                });
            }
        } else {
            setBackgroundImage(defaultBanner);
        }
    }, [eventStore.destinations, feedStore.activeTab]);
    // ------------------------------------------------------------

    const slogan = TranslateService.translate(eventStore, 'V2.TRIPLAN_HEADER_BANNER');

    return (
        <div className={getClasses(baseClass, tripName && 'trip-mode', noHeader && 'no-header')} style={{
            backgroundImage: `url('${backgroundImage}')`
        }}>
            <div className={getClasses(`${baseClass}-shadow`, eventStore.isHebrew && 'flip-x')} />
            {!noHeader && <TriplanHeaderLine isInLogin={isInLogin} isAlwaysSticky={isAlwaysSticky} />}
            <div className={`${baseClass}-slogan black-text-shadow`} dangerouslySetInnerHTML={{ __html: isInPlan ? `<div class="trip-name-in-banner">${eventStore.formattedTripName}</div>` : withHr ? `${slogan}<hr/>` : slogan }}
            />
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);