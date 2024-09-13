import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
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
import {getClasses, LOADER_DETAILS} from "../../../utils/utils";
import {
    exploreTabId,
    mainPageContentTabLsKey,
    myTripsTabId,
    savedCollectionsTabId,
    searchResultsTabId,
    specificItemTabId
} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";
import {getParameterFromHash} from "../../utils/utils";
import {
    useCreateRandomTemplate,
    useLoadRandomPlacePOIs,
    useMyTrips,
    useSavedCollections,
    useScrollWhenTabChanges
} from "../../hooks/main-page-hooks";
import {TabData} from "../../utils/interfaces";
import FeedViewApiService, {allSources} from "../../services/feed-view-api-service";
import {useParams} from "react-router-dom";
import {runInAction} from "mobx";
import DataServices, {LocaleCode} from "../../../services/data-handlers/data-handler-base";
import {TripDataSource} from "../../../utils/enums";
import LoadingComponent from "../../../components/loading/loading-component";
import MainPage from "../../../pages/main-page/main-page";

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

    const loaderDetails = useRef(LOADER_DETAILS());
    const { tripName } = useParams();

    useEffect(() => {
        if (tripName && eventStore.tripName != tripName && !eventStore.isLoading) {
            eventStore.setTripName(tripName);
            // eventStore.setTripName(tripName).then(() => {
            //     runInAction(() => {
            //         eventStore.isLoading = false;
            //     });
            // });

            // // must put it here, otherwise dates are incorrect
            // if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
            //     eventStore.setCustomDateRange(DataServices.LocalStorageService.getDateRange(tripName));
            // }
        }
    }, [tripName, eventStore.isLoading]);

    const isShort = eventStore.isMobile ? '.SHORT' : '';
    const searchKeyword = getParameterFromHash('q');
    const isInSearch = (searchKeyword?.length ?? 0) > 0;

    const viewItemId = window.location.hash.includes(specificItemTabId) ? getParameterFromHash('id') : undefined;
    const isInViewItem = (viewItemId?.length ?? 0) > 0;

    const tabs: TabData[] = getTabs();
    const tabIdToIdx = useMemo<Record<string, number>>(getTabIdToIndexMapping, [tabs]);

    const tabFromHash = window.location.hash.replace('#', '');

    function getActiveTab(){
        const isInAddItem = window.location.hash.includes('createTrip');

        if (isInViewItem) {
            return specificItemTabId;
        }
        if (isInSearch) {
            return searchResultsTabId;
        }
        if (isInAddItem) {
            return myTripsTabId;
        }
        if (localStorage.getItem(mainPageContentTabLsKey)){
            return localStorage.getItem(mainPageContentTabLsKey);
        }
        if (tabs.map((x) => x.id).includes(tabFromHash)){
            return tabFromHash;
        }
        return defaultTab;
    }
    const activeTab = useMemo(getActiveTab, [isInSearch, tabs, tabFromHash, rootStore.tabMenuReRenderCounter]);
    const [activeTabIdx, setActiveTabIdx] = useState(tabIdToIdx[activeTab]);

    useEffect(() => {
        setActiveTabIdx(tabIdToIdx[activeTab]);
    }, [activeTab]);

    useHandleWindowResize();
    useSavedCollections();
    useMyTrips();
    useScrollWhenTabChanges(tabs);
    useLoadRandomPlacePOIs();
    useCreateRandomTemplate();

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
                id: exploreTabId,
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
                icon: "fa-bookmark-o",
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

    if (eventStore.isLoading || (tripName && tripName != eventStore.tripName)){
        return (
            <LoadingComponent
                title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
                message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
                loaderDetails={loaderDetails.current}
            />
        )
    }

    if (tripName && tripName == eventStore.tripName) {
        // todo complete: make it appear with a tab viewer
        return (
            <>
                <div className="plan-trip-tab-menu">
                <TabMenu
                    activeTab="planTrip"
                    tabs={[
                        {
                            id: 'planTrip',
                            order: 1,
                            name: tripName,
                            icon: "fa-plane",
                            render: () => null
                        }
                    ]}
                    onChange={() => {}}
                />
                </div>
                <MainPage/>
            </>
        )
    }

    return (
        <div className={getClasses("triplan-header-banner-footer", eventStore.isMobile && activeTabIdx === tabs.length -1 && 'padding-inline-end-10', isInViewItem && 'view-item-content', searchKeyword && 'search-results-content')} key={rootStore.tabMenuReRenderCounter}>
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