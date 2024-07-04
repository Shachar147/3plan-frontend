import React, {useContext} from 'react';
import {observer} from "mobx-react";
import './main-page.scss';
import TriplanHeaderBanner from "./components/triplan-header-banner/triplan-header-banner";
import {eventStoreContext} from "../../../stores/events-store";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";

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
                        name: "Explore",
                        icon: "fa-search",
                        render: () => <TriplanTabContent title={"explore"} />
                    },
                    {
                        name: "Saved Collections",
                        icon: "fa-save",
                        render: () => <TriplanTabContent title={"users"} />
                    },
                    {
                        name: "Your trips",
                        icon: "fa-plane",
                        render: () => <TriplanTabContent title={"trips"} />
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