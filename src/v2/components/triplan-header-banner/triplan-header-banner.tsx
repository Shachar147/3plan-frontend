import React, {useContext} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import {eventStoreContext} from "../../../stores/events-store";
import TranslateService from "../../../services/translate-service";
import {getClasses} from "../../../utils/utils";
import TriplanHeaderLine from "./triplan-header-line";
import {useParams} from "react-router-dom";
import {newDesignRootPath} from "../../utils/consts";
import TriplanSpecificTripHeaderLine from "./triplan-specific-trip-header-line";


function TriplanHeaderBanner({ noHeader = false, withHr = false, isInLogin = false }: { noHeader?: boolean, withHr?: boolean, isInLogin?: boolean }){
    const baseClass = "triplan-header-banner";
    const eventStore = useContext(eventStoreContext);

    const { tripName } = useParams();

    // const bgs = ["6.jpg", "5.jpg", "7.jpg", "8.jpg", "9.jpg"];
    // const bgs = ["6.jpg"]
    const bgs = ["best/10.png"]
    const random = Math.floor(Math.random() * bgs.length);

    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    const slogan = TranslateService.translate(eventStore, 'V2.TRIPLAN_HEADER_BANNER');

    return (
        <div className={getClasses(baseClass, tripName && 'trip-mode', noHeader && 'no-header')} style={{
            backgroundImage: `url('/images/banner/${bgs[random]}')`
        }}>
            <div className={getClasses(`${baseClass}-shadow`, eventStore.isHebrew && 'flip-x')} />
            {!noHeader && (isInPlan ? <TriplanSpecificTripHeaderLine /> : <TriplanHeaderLine isInLogin />)}
            <div className={`${baseClass}-slogan black-text-shadow`} dangerouslySetInnerHTML={{ __html: withHr ? `${slogan}<hr/>` : slogan }}
            />
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);