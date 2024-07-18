import TriplanLogo from "../../../../../components/triplan-header/logo/triplan-logo";
import TriplanSearch from "../../../../../components/triplan-header/triplan-search/triplan-search";
import Button, {ButtonFlavor} from "../../../../../components/common/button/button";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import {eventStoreContext} from "../../../../../stores/events-store";
import TranslateService from "../../../../../services/translate-service";
import ReactModalService from "../../../../../services/react-modal-service";
import {getClasses} from "../../../../../utils/utils";

function TriplanHeaderLine(){
    const eventStore = useContext(eventStoreContext);

    const baseClass = "triplan-header-banner-header-line";
    return (
        <div className={baseClass}>
            <div className={`${baseClass}-top-shadow`} />
            <div className={`${baseClass}-left-side`}>
                {!eventStore.isMobile && <TriplanLogo onClick={() => alert("here")} white height={60} />}
                <TriplanSearch className={`${baseClass}-search`} />
            </div>
            <div className={`${baseClass}-right-side`}>
                <Button
                    icon="fa-heart"
                    text={TranslateService.translate(eventStore, 'WISHLIST')}
                    onClick={() => {
                        alert("wishlist");
                    }}
                    flavor={ButtonFlavor.link}
                />
                <Button
                    icon="fa-plane"
                    text={TranslateService.translate(eventStore, 'PLAN')}
                    onClick={() => {
                        alert("plan");
                    }}
                    flavor={ButtonFlavor.link}
                />
                <Button
                    icon="fa-user"
                    text={TranslateService.translate(eventStore, 'PROFILE')}
                    onClick={() => {
                        alert("profile");
                    }}
                    flavor={ButtonFlavor.link}
                />
                <Button
                    icon="fa-globe"
                    text={TranslateService.translate(eventStore, 'LANGUAGE')}
                    onClick={() => {
                        ReactModalService.openChangeLanguageModal(eventStore);
                    }}
                    flavor={ButtonFlavor.link}
                />
            </div>
        </div>
    );
}

function TriplanHeaderBanner(){
    const baseClass = "triplan-header-banner";
    const eventStore = useContext(eventStoreContext);

    // const bgs = ["6.jpg", "5.jpg", "7.jpg", "8.jpg", "9.jpg"];
    const bgs = ["9.jpg"]
    const random = Math.floor(Math.random() * bgs.length);

    return (
        <div className={baseClass} style={{
            backgroundImage: `url('http://localhost:3000/images/banner/${bgs[random]}')`
        }}>
            <div className={getClasses(`${baseClass}-shadow`, eventStore.isHebrew && 'flip-x')} />
            <TriplanHeaderLine />
            <div className={`${baseClass}-slogan black-text-shadow`} dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, 'V2.TRIPLAN_HEADER_BANNER')}} />
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);