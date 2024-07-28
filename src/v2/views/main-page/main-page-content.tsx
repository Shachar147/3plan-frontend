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
import {
    mainPageContentTabLsKey,
    myTripsTabId,
    savedCollectionsTabId,
    searchResultsTabId,
    specificItemTabId
} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";
import {getParameterFromHash} from "../../utils/utils";
import {useMyTrips, useSavedCollections, useScrollWhenTabChanges} from "../../hooks/main-page-hooks";
import {TabData} from "../../utils/interfaces";

function TriplanTabContent({ content }: { content: string | React.ReactNode}) {
    return (
        <div className="main-page-content">
            {content}
        </div>
    )
}

const defaultTab = "explore";

function MainPageContent(){
    const rootStore = useContext(rootStoreContext);
    const eventStore = useContext(eventStoreContext);
    const feedStore = useContext(feedStoreContext);
    const myTripsStore = useContext(myTripsContext);

    const isShort = eventStore.isMobile ? '.SHORT' : '';
    const searchKeyword = getParameterFromHash('q');
    const isInSearch = (searchKeyword?.length ?? 0) > 0;

    const viewItemId = window.location.hash.includes(specificItemTabId) ? getParameterFromHash('id') : undefined;
    const isInViewItem = (viewItemId?.length ?? 0) > 0;

    const tabs: TabData[] = getTabs();
    const tabIdToIdx = useMemo<Record<string, number>>(getTabIdToIndexMapping, [tabs]);

    const tabFromHash = window.location.hash.replace('#', '');
    const activeTab = useMemo(() => {
        if (isInViewItem) {
            return specificItemTabId;
        }
        if (isInSearch) {
            return searchResultsTabId;
        }
        if (localStorage.getItem(mainPageContentTabLsKey)){
            return localStorage.getItem(mainPageContentTabLsKey);
        }
        if (tabs.map((x) => x.id).includes(tabFromHash)){
            return tabFromHash;
        }
        return defaultTab;
    }, [isInSearch, tabs, tabFromHash, rootStore.tabMenuReRenderCounter]);
    const [activeTabIdx, setActiveTabIdx] = useState(tabIdToIdx[activeTab]);

    useEffect(() => {
        setActiveTabIdx(tabIdToIdx[activeTab]);
    }, [activeTab])

    useHandleWindowResize();
    useSavedCollections();
    useMyTrips();
    useScrollWhenTabChanges(tabs);

    function getTabs():TabData[] {
        if (isInViewItem) {
            const itemName = localStorage.getItem(`item-${viewItemId}-name`)
            return  [{
                id: specificItemTabId,
                order: 0,
                name: TranslateService.translate(eventStore, (isShort || !itemName) ? 'VIEW_ITEM.SHORT' : 'VIEW_ITEM', {
                    X: itemName
                }),
                icon: "fa-info",
                render: () => <TriplanTabContent content={
                    <FeedView eventStore={eventStore} viewItemId={viewItemId} />
                } />
            }];
        }
        if (searchKeyword) {
            const isShort = eventStore.isMobile;
            return  [{
                id: searchResultsTabId,
                order: 0,
                name: TranslateService.translate(eventStore, isShort ? 'SEARCH_RESULTS' : 'SEARCH_RESULTS_FOR_X', {
                    X: searchKeyword
                }),
                icon: "fa-search",
                render: () => <TriplanTabContent content={
                    <FeedView eventStore={eventStore} searchKeyword={searchKeyword} />
                } />
            }];
        }
        return [
            {
                id: "explore",
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
    }

    function getTabIdToIndexMapping(){
        const toReturn = {};
        tabs.forEach((tab, idx) => {
            toReturn[tab.id] = idx
        });
        return toReturn;
    }

    return (
        <div className={getClasses("triplan-header-banner-footer", eventStore.isMobile && activeTabIdx === tabs.length -1 && 'padding-inline-end-10')} key={rootStore.tabMenuReRenderCounter}>
            <TabMenu
                activeTab={activeTab}
                tabs={tabs}
                onChange={(tabId) => {
                    if (tabId != searchResultsTabId && tabId != specificItemTabId) {
                        localStorage.setItem(mainPageContentTabLsKey, tabId);
                    }
                    setActiveTabIdx(tabIdToIdx[tabId]);
                    rootStore.triggerHeaderReRender();
                    window.location.hash = tabId;
                }}
            />
        </div>
    );
}

export default observer(MainPageContent);