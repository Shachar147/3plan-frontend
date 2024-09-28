import React, {useContext, useMemo, useRef, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import TranslateService from "../../../services/translate-service";
import {observer} from "mobx-react";
import './admin-page-content.scss'
import {getClasses, LOADER_DETAILS} from "../../../utils/utils";
import {rootStoreContext} from "../../stores/root-store";
import {TabData} from "../../utils/interfaces";
import LoadingComponent from "../../../components/loading/loading-component";
import POIForm from "../../../components/add-poi-form/add-poi-form";
import useIsAdminV2 from "../../../custom-hooks/use-is-admin-v2";

function TriplanTabContent({ content }: { content: string | React.ReactNode}) {
    return (
        <div className="admin-page-content">
            {content}
        </div>
    )
}

const addPoisTabId = "add-pois";

function AdminPageContent(){
    const rootStore = useContext(rootStoreContext);
    const eventStore = useContext(eventStoreContext);

    const isShort = eventStore.isMobile ? '.SHORT' : '';
    const loaderDetails = useRef(LOADER_DETAILS());

    // useIsAdminV2();

    const tabs: TabData[] = getTabs();
    const tabIdToIdx = useMemo<Record<string, number>>(getTabIdToIndexMapping, [tabs]);

    const activeTab = addPoisTabId;
    const [activeTabIdx, setActiveTabIdx] = useState(tabIdToIdx[activeTab]);

    useHandleWindowResize();

    function getTabs():TabData[] {
        return [
            {
                id: addPoisTabId,
                order: 0,
                name: TranslateService.translate(eventStore, `ADMIN_PAGE_V2.ADD_POIS${isShort}`),
                icon: "fa-plus",
                render: () => <TriplanTabContent content={
                    <div className="flex-row align-items-center justify-content-center width-100-percents">
                        <POIForm />
                    </div>
                } />
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

    if (eventStore.isLoading){
        return (
            <LoadingComponent
                title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
                message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
                loaderDetails={loaderDetails.current}
            />
        )
    }

    return (
        <div className={getClasses("triplan-header-banner-footer", eventStore.isMobile && activeTabIdx === tabs.length -1 && 'padding-inline-end-10')} key={rootStore.tabMenuReRenderCounter}>
            <TabMenu
                activeTab={activeTab}
                tabs={tabs}
                onChange={(tabId) => {
                    setActiveTabIdx(tabIdToIdx[tabId]);
                    rootStore.triggerHeaderReRender();
                    window.location.hash = tabId;
                }}
            />
        </div>
    );
}

export default observer(AdminPageContent);