import React, {useContext, useEffect, useMemo, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import TranslateService from "../../../services/translate-service";
import {observer} from "mobx-react";
import FeedView from "../../components/feed-view/feed-view";
import './main-page-content.scss'
import MyTrips from "../my-trips-tab/my-trips-tab";
import {feedStoreContext} from "../../stores/feed-view-store";
import SavedCollectionsTab from "../saved-collections-tab/saved-collections-tab";
import {myTripsContext} from "../../stores/my-trips-store";
import {getClasses} from "../../../utils/utils";
import {mainPageContentTabLsKey, myTripsTabId, savedCollectionsTabId} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";

function TriplanTabContent({ content }: { content: string | React.ReactNode}) {
    return (
        <div className="main-page-content">
            {content}
        </div>
    )
}

function MainPageContent(){
    const rootStore = useContext(rootStoreContext);
    const eventStore = useContext(eventStoreContext);
    const feedStore = useContext(feedStoreContext);
    const myTripsStore = useContext(myTripsContext);

    const isShort = eventStore.isMobile ? '.SHORT' : '';
    const tabs = [
        {
            id: "default",
            order: 0,
            name: TranslateService.translate(eventStore, `BUTTON_TEXT.FEED_VIEW${isShort}`),
            icon: "fa-search",
            render: () => <TriplanTabContent content={<FeedView eventStore={eventStore} mainFeed />} />
        },
        {
            id: savedCollectionsTabId,
            order: 1,
            name: TranslateService.translate(eventStore, `SAVED_COLLECTIONS${isShort}`, {
                X: feedStore.savedItems.length
            }),
            icon: "fa-save",
            // icon: "fa-heart",
            render: () => <TriplanTabContent content={<SavedCollectionsTab />} />
        },
        {
            id: myTripsTabId,
            order: 2,
            name: TranslateService.translate(eventStore, `MY_TRIPS_X${isShort}`, {
                X: myTripsStore.myTrips.length + myTripsStore.mySharedTrips.length
            }),
            icon: "fa-plane",
            render: () => <TriplanTabContent content={<MyTrips />} />
        },
    ];

    const tabsIdsByOrder = tabs.map((i) => i.id);

    const tabIdToIdx = useMemo(() => {
        const toReturn = {};
        tabs.forEach((tab, idx) => {
            toReturn[tab.id] = idx
        });
        return toReturn;
    }, [tabs]);

    const activeTab = localStorage.getItem(mainPageContentTabLsKey) ?? "default";
    const [activeTabIdx, setActiveTabIdx] = useState(tabIdToIdx[activeTab]);
    useHandleWindowResize();

    useEffect(() => {
        feedStore.getSavedCollections();
        myTripsStore.loadMyTrips();
    }, [])

    useEffect(() => {
        const scrollContainer = document.querySelector('.ui.tabular.menu');
        const scrollItems = document.querySelectorAll('.item');

        scrollItems.forEach(item => {
            item.addEventListener('click', (event) => {
                const itemRect = item.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const scrollOffset = itemRect.left - containerRect.left + scrollContainer.scrollLeft;

                scrollContainer.scroll({
                    left: scrollOffset,
                    behavior: 'smooth' // Smooth scrolling
                });
            });
        });
    }, [])

    // const orderedTabs = eventStore.isMobile ? tabs.sort((a, b) => {
    //     if (a.id === activeTab) {
    //         return -1;
    //     } else if (b.id === activeTab) {
    //         return 1;
    //     } else {
    //         const activeIdx = tabsIdsByOrder.indexOf(activeTab);
    //         const aIdx = tabsIdsByOrder.indexOf(a.id);
    //         const bIdx = tabsIdsByOrder.indexOf(b.id);
    //
    //         if (aIdx > activeIdx && bIdx > activeIdx) {
    //             if (bIdx > aIdx){
    //                 return -1;
    //             } else {
    //                 return 1;
    //             }
    //         }
    //         else if (aIdx > activeIdx){
    //             return -1;
    //         } else {
    //             return 1;
    //         }
    //     }
    // }) : tabs;
    const orderedTabs = tabs;

    return (
        <div className={getClasses("triplan-header-banner-footer", eventStore.isMobile && activeTabIdx === tabs.length -1 && 'padding-inline-end-10')} key={rootStore.tabMenuReRenderCounter}>
            <TabMenu
                activeTab={activeTab}
                tabs={orderedTabs}
                onChange={(tabId) => {
                    localStorage.setItem(mainPageContentTabLsKey, tabId);
                    setActiveTabIdx(tabIdToIdx[tabId]);
                    rootStore.triggerHeaderReRender();
                }}
            />
        </div>
    );
}

export default observer(MainPageContent);