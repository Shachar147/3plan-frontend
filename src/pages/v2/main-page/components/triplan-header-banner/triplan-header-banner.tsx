import TriplanLogo from "../../../../../components/triplan-header/logo/triplan-logo";
import TriplanSearch from "../../../../../components/triplan-header/triplan-search/triplan-search";
import Button, {ButtonFlavor} from "../../../../../components/common/button/button";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import {eventStoreContext} from "../../../../../stores/events-store";
import TranslateService from "../../../../../services/translate-service";
import ReactModalService from "../../../../../services/react-modal-service";

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
                    text="Wishlist"
                    onClick={() => {
                        alert("wishlist");
                    }}
                    flavor={ButtonFlavor.link}
                />
                <Button
                    icon="fa-plane"
                    text="Plan"
                    onClick={() => {
                        alert("plan");
                    }}
                    flavor={ButtonFlavor.link}
                />
                <Button
                    icon="fa-user"
                    text="Profile"
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
    return (
        <div className={baseClass}>
            <div className={`${baseClass}-shadow`} />
            <TriplanHeaderLine />
            <div className={`${baseClass}-slogan`}>
                <span>Trips planning</span>
                <span>was never easier</span>
            </div>
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);