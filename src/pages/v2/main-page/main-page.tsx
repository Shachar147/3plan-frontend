import React, {useContext} from 'react';
import {observer} from "mobx-react";
import './main-page.scss';
import TriplanHeaderBanner from "./components/triplan-header-banner/triplan-header-banner";
import {eventStoreContext} from "../../../stores/events-store";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import TranslateService from "../../../services/translate-service";

function TriplanTabContent({ title }: { title: string}) {
    return (
        <div style={{
            height: 600
        }}>
            {title}
        </div>
    )
}

function Content(){
    const eventStore = useContext(eventStoreContext);
    const isShort = eventStore.isMobile ? '.SHORT' : ''; // todo complete - shorter text in mobile?
    return (
        <div className="triplan-header-banner-footer">
            <TabMenu
                tabs={[
                    {
                        name: TranslateService.translate(eventStore, "BUTTON_TEXT.FEED_VIEW"),
                        icon: "fa-search",
                        render: () => <TriplanTabContent title={TranslateService.translate(eventStore, "BUTTON_TEXT.FEED_VIEW")} />
                    },
                    {
                        name: TranslateService.translate(eventStore, "SAVED_COLLECTIONS"),
                        icon: "fa-save",
                        render: () => <TriplanTabContent title={TranslateService.translate(eventStore, "SAVED_COLLECTIONS")} />
                    },
                    {
                        name: TranslateService.translate(eventStore, "LANDING_PAGE.MY_TRIPS"),
                        icon: "fa-plane",
                        render: () => <TriplanTabContent title={TranslateService.translate(eventStore, "LANDING_PAGE.MY_TRIPS")} />
                    },
                ]}
            />
        </div>
    );
}

function TriplanFooter(){
    return (
        <div className="triplan-footer">test</div>
    )
}

function MainPageV2(){
    return (
        <div className="triplan-main-page-container flex-column">
            <TriplanHeaderBanner />
            <Content />
            <TriplanFooter />
        </div>
    )
}

export default observer(MainPageV2)