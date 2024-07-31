import React, {useContext} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import {eventStoreContext} from "../../../stores/events-store";
import TranslateService from "../../../services/translate-service";
import {getClasses} from "../../../utils/utils";
import { getServerAddress } from '../../../config/config';
import TriplanHeaderLine from "./triplan-header-line";


function TriplanHeaderBanner(){
    const baseClass = "triplan-header-banner";
    const eventStore = useContext(eventStoreContext);

    // const bgs = ["6.jpg", "5.jpg", "7.jpg", "8.jpg", "9.jpg"];
    // const bgs = ["6.jpg"]
    const bgs = ["best/10.png"]
    const random = Math.floor(Math.random() * bgs.length);

    return (
        <div className={baseClass} style={{
            backgroundImage: `url('${getServerAddress().replace("3001","3000")}/images/banner/${bgs[random]}')`
        }}>
            <div className={getClasses(`${baseClass}-shadow`, eventStore.isHebrew && 'flip-x')} />
            <TriplanHeaderLine />
            <div className={`${baseClass}-slogan black-text-shadow`} dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, 'V2.TRIPLAN_HEADER_BANNER')}} />
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);