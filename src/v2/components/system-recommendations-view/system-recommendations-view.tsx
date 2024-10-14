import React, {useContext, useEffect, useRef, useState} from 'react';
import {observer} from "mobx-react";
import {getClasses, getEventDescription, getEventTitle} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import PointOfInterest, {PointOfInterestShimmering} from "../point-of-interest/point-of-interest";
import {feedStoreContext} from "../../stores/feed-view-store";
import {runInAction} from "mobx";
import './system-recommendations-view.scss';
import FeedViewApiService, {allSources} from "../../services/feed-view-api-service";
import {CalendarEvent} from "../../../utils/interfaces";
import LazyLoadComponent from "../lazy-load-component/lazy-load-component";
import ReactModalService from "../../../services/react-modal-service";
import {IPointOfInterest} from "../../utils/interfaces";
import {FeatureFlagsService} from "../../../utils/feature-flags";

function SystemRecommendationsShimmeringPlaceholder() {
    function renderItem(index: number) {
        return (
            <PointOfInterestShimmering key={index} isSmall />
        )
    }
    return (
        <>
            {renderItem(0)}
            {renderItem(1)}
            {renderItem(2)}
            {renderItem(3)}
        </>
    )
}

function SystemRecommendationsView(){
    const feedStore = useContext(feedStoreContext);
    const eventStore = useContext(eventStoreContext);
    const [isLoading, setIsLoading] = useState(true);
    const currentPage = useRef(1);
    const prevPageTotalResults = useRef(0);
    const [isReachedEnd, setIsReachedEnd] = useState(!eventStore.isMobile);
    const [isEditMode, setIsEditMode] = useState<Record<number, boolean>>({});

    const fetchItems = async (page, setLoading) => {
        if (isReachedEnd) {
            return;
        }
        currentPage.current = page;
        prevPageTotalResults.current = feedStore.systemRecommendations.length;

        setLoading(true);
        const updatedResults = await loadRecommendations(page);
        setLoading(false);
        setIsReachedEnd(updatedResults.length === prevPageTotalResults.current);
    };

    useEffect( () => {
        if (eventStore.isMobile) {
            setIsLoading(false);
            // fetchItems(1, setIsLoading)
        } else {
            loadRecommendations();
        }
    }, [])

    async function loadRecommendations(page?: number){
        const apiService = new FeedViewApiService();
        const responses = await Promise.all(
            [
                apiService.getSystemRecommendations(page)
            ]);

        const systemRecommendations = page ? [...feedStore.systemRecommendations] : [];
        responses.forEach(response => {
            systemRecommendations.push(...response.results);
        });
        runInAction(() => {
            feedStore.systemRecommendations = systemRecommendations;
        })

        setIsLoading(false);

        return systemRecommendations;
    }

    // useEffect(() => {
    //     // todo: replace with action in the store + in separate fetch from the server
    //     runInAction(() => {
    //         let systemRecommendations = feedStore.filteredItems.filter((x) => x.isSystemRecommendation);
    //         if (systemRecommendations.length > 8) {
    //             systemRecommendations = systemRecommendations.slice(0, 8);
    //         }
    //
    //         feedStore.systemRecommendations = systemRecommendations;
    //     })
    // }, [feedStore.filteredItems]);

    const title = TranslateService.translate(eventStore, 'SYSTEM_RECOMMENDATIONS');
    let description = TranslateService.translate(eventStore, 'SYSTEM_RECOMMENDATIONS.DESCRIPTION');

    const mainFeed = true;
    const searchKeyword = false;
    const viewItemId = false;
    const classList = getClasses("align-items-center", (!mainFeed && !searchKeyword) && 'width-100-percents', eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

    if (!isLoading && !feedStore.systemRecommendations?.length) {
        if (eventStore.isMobile){
            description = TranslateService.translate(eventStore, 'NO_SYSTEM_RECOMMENDATIONS')
        } else {
            return null;
        }
    }

    async function onPoiDescriptionChanged(poiId: number, oldDescription: string, newDescription: string){
        if (newDescription.length == 0){
            return;
        }
        if (oldDescription != newDescription) {
            const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
                description: newDescription
            });
            if (updatedResponse.description != newDescription) {
                ReactModalService.internal.openOopsErrorModal(eventStore);
            } else {
                runInAction(() => {
                    feedStore.items.find((s) => s.id == poiId).description = updatedResponse.description;
                })

                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.CREATE.TITLE',
                    'POI_UPDATED_SUCCESSFULLY',
                    'success'
                );
            }
        }
        setIsEditMode({
            ...isEditMode,
            [poiId]: false
        });
    }

    async function onPoiRenamed(poiId: number, oldName: string, newName: string){
        if (newName.length == 0){
            return;
        }
        if (oldName != newName) {
            const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
                name: newName
            });

            if (updatedResponse.name != newName) {
                ReactModalService.internal.openOopsErrorModal(eventStore);
            } else {
                runInAction(() => {
                    feedStore.systemRecommendations.find((s) => s.id == poiId).name = updatedResponse.name;
                })

                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.CREATE.TITLE',
                    'POI_UPDATED_SUCCESSFULLY',
                    'success'
                );
            }
        }
        setIsEditMode({
            ...isEditMode,
            [poiId]: false
        });
    }

    function renderContent() {
        if (eventStore.isMobile) {
            return (
                <LazyLoadComponent className="width-100-percents flex-column align-items-center" fetchData={(page, setLoading) => fetchItems(page, setLoading)} isLoading={isLoading} isReachedEnd={isReachedEnd}>
                    {feedStore.systemRecommendations.map((item, idx) => (
                        <div key={item.id} className={classList}>
                            {renderPoi(item)}
                        </div>
                    ))}
                </LazyLoadComponent>
            )
        }
        return (
            <>
                {feedStore.systemRecommendations.map((item, idx) => (
                    <div key={item.id} className={classList}>
                        {renderPoi(item)}
                    </div>
                ))}
            </>
        );
    }

    function renderPoi(item: IPointOfInterest) {

        return (
            <PointOfInterest key={item.id} item={{
                ...item,
                name: isEditMode[item.id] ? item.name : getEventTitle({
                    title: item.name
                } as unknown as CalendarEvent, eventStore, true)!,
                description: getEventDescription(item as unknown as CalendarEvent, eventStore, true),
            }} eventStore={eventStore} mainFeed={mainFeed} isSearchResult={!!searchKeyword} isViewItem={!!viewItemId}
                             onLabelClick={() => {
                                 FeatureFlagsService.isDeleteEnabled() && setIsEditMode({
                                     ...isEditMode,
                                     [item.id]: !!!isEditMode[item.id]
                                 })
                             }}
                             isEditMode={!FeatureFlagsService.isDeleteEnabled() ? false : (isEditMode[item.id] ?? false)}
                             onEditSave={(newName: string) => {
                                 if (!FeatureFlagsService.isDeleteEnabled()){
                                     return;
                                 }
                                 onPoiRenamed(item.id, item.name, newName)
                             }}
                             onEditDescriptionSave={(newDescription: string) => {
                                 if (!FeatureFlagsService.isDeleteEnabled()){
                                     return;
                                 }
                                 onPoiDescriptionChanged(item.id, item.description, newDescription)
                             }}
                             onClick={FeatureFlagsService.isDeleteEnabled() ? async () => {
                                 await new FeedViewApiService().deletePoi(item.id);
                                 runInAction(() => {
                                     feedStore.systemRecommendations = feedStore.systemRecommendations.filter((s) => s.id != item.id);
                                 })
                             } : undefined}
                             onClickText={FeatureFlagsService.isDeleteEnabled() ? TranslateService.translate(eventStore, 'DELETE') : undefined}
                             onClickIcon="fa-times"
            />
        )
    }

    return (
        <>
            <div className={getClasses('system-recommendations-view', eventStore.isMobile && 'with-divider')}>
                <div className="flex-col">
                    <h3 className="main-feed-header width-100-percents">{title}</h3>
                    <span className="main-feed-description text-align-start" dangerouslySetInnerHTML={{ __html: description }} />
                </div>
                <div className={getClasses("justify-content-center flex-wrap-wrap align-items-start", eventStore.isMobile ? 'flex-col' : 'flex-row')}>
                    {isLoading ? <SystemRecommendationsShimmeringPlaceholder/> : renderContent()}
                </div>
            </div>
        </>
    )
}

export default observer(SystemRecommendationsView);