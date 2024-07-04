import TriplanLogo from "../../../../../components/triplan-header/logo/triplan-logo";
import TriplanSearch from "../../../../../components/triplan-header/triplan-search/triplan-search";
import Button, {ButtonFlavor} from "../../../../../components/common/button/button";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import './triplan-header-banner.scss';
import TranslateService from "../../../../../services/translate-service";
import TabMenu from "../../../../../components/common/tabs-menu/tabs-menu";
import {eventStoreContext} from "../../../../../stores/events-store";

function TriplanHeaderLine(){
    const baseClass = "triplan-header-banner-header-line";
    return (
        <div className={baseClass}>
            <div className={`${baseClass}-top-shadow`} />
            <div className={`${baseClass}-left-side`}>
                <TriplanLogo onClick={() => alert("here")} white height={60} />
                <TriplanSearch />
            </div>
            <div className={`${baseClass}-right-side`}>
                <Button
                    icon="fa-heart"
                    text="Wishlist"
                    onClick={() => {
                        alert("wishlist");
                    }}
                    flavor={ButtonFlavor['movable-link']}
                />
                <Button
                    icon="fa-plane"
                    text="Plan"
                    onClick={() => {
                        alert("plan");
                    }}
                    flavor={ButtonFlavor['movable-link']}
                />
                <Button
                    icon="fa-user"
                    text="Profile"
                    onClick={() => {
                        alert("profile");
                    }}
                    flavor={ButtonFlavor['movable-link']}
                />
            </div>
        </div>
    );
}

function TriplanHeaderFooter(){
    const eventStore = useContext(eventStoreContext);
    const isShort = eventStore.isMobile ? '.SHORT' : '';
    return (
        <div className="triplan-header-banner-footer">
            <TabMenu
                tabs={[
                    {
                        name: TranslateService.translate(eventStore, `ADMIN_DASHBOARD.TRIP_STATS.TITLE${isShort}`),
                        render: () => "trips",
                    },
                    {
                        name: TranslateService.translate(eventStore, `ADMIN_DASHBOARD.USER_STATS.TITLE${isShort}`),
                        render: () => "users",
                    },
                    {
                        name: TranslateService.translate(eventStore, `ADMIN_DASHBOARD.TINDER_WIDGET.TITLE${isShort}`),
                        render: () => "tinder",
                    },
                ]}
            />
        </div>
    )
}

function TriplanHeaderBanner(){
    const baseClass = "triplan-header-banner";
    return (
        <div className={baseClass}>
            <div className={`${baseClass}-shadow`} />
            <TriplanHeaderLine />

            <TriplanHeaderFooter />
            <div className={`${baseClass}-bottom-shadow`} />
        </div>
    );
}

export default observer(TriplanHeaderBanner);