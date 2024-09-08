import React, {useContext, useEffect, useMemo, useState} from 'react';
import { observer } from 'mobx-react';
import {eventStoreContext} from "../../../stores/events-store";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import {rootStoreContext} from "../../stores/root-store";
import {getViewSelectorOptions} from "../../../utils/ui-utils";
import MainPage from "../../../pages/main-page/main-page";
import './plan-page-content.scss';

function PlanPageContent() {
    const eventStore = useContext(eventStoreContext);
    const rootStore = useContext(rootStoreContext);
    const [activeTab, setActiveTab] = useState(eventStore.isMobile ? eventStore.mobileViewMode : eventStore.viewMode);

    useEffect(() => {
        setActiveTab(eventStore.isMobile ? eventStore.mobileViewMode : eventStore.viewMode);
    }, [eventStore.isMobile, eventStore.mobileViewMode, eventStore.viewMode])

    function getTabs(){
        const viewOptions = getViewSelectorOptions(eventStore, eventStore.isMobile).filter((x) => {
            return !(eventStore.isMobile && (x as any).desktopOnly);
        });

        let tabs = viewOptions.map((v, idx) => (
            {
                id: v.key,
                order: idx+1,
                name: v.name,
                renderIcon: () => activeTab == v.key ? v.iconActive : v.icon,
                render: () => null
            }
        ))

        if (eventStore.isMobile){
           tabs = tabs.filter((t) => t.id === activeTab);
        }

        if (eventStore.isHebrew) {
            tabs.reverse();
        }
        return tabs;
    }
    const tabs = useMemo(() => getTabs(), [activeTab]);

    function renderTabView(){
        return (
            <>
                <div className="plan-trip-tab-menu">
                    <TabMenu
                        activeTab={activeTab}
                        tabs={tabs}
                        onChange={(tabId) => {
                            setActiveTab(tabId);
                            eventStore.setViewMode(tabId);
                            // localStorage.setItem(loginPageContentTabLsKey, tabId);
                            // window.location.hash = tabId;
                            rootStore.triggerHeaderReRender();
                            rootStore.triggerTabsReRender();
                        }}
                    />
                    <MainPage/>
                </div>
            </>
        )
    }

    return (
        <div>
            <div className="plan-page-content flex-row align-items-center justify-content-center">
                {renderTabView()}
            </div>
        </div>
    )
}

export default observer(PlanPageContent);
