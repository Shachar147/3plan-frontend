import React, {useContext, useEffect, useState} from 'react';
import {observer} from "mobx-react";
import {getClasses, getEventDescription, getEventTitle} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import PointOfInterest, {PointOfInterestShimmering} from "../point-of-interest/point-of-interest";
import {feedStoreContext} from "../../stores/feed-view-store";
import {runInAction} from "mobx";
import './system-recommendations-view.scss';
import FeedViewApiService from "../../services/feed-view-api-service";
import {CalendarEvent} from "../../../utils/interfaces";

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

    useEffect( () => {
        loadRecommendations();
    }, [])

    async function loadRecommendations(){
        const apiService = new FeedViewApiService();
        const responses = await Promise.all(
            [
                apiService.getSystemRecommendations()
            ]);

        const systemRecommendations = [];
        responses.forEach(response => {
            systemRecommendations.push(...response.results);
        });
        feedStore.systemRecommendations = systemRecommendations;

        setIsLoading(false);
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

    return (
        <>
            <div className={getClasses('system-recommendations-view', eventStore.isMobile && 'with-divider')}>
                <div className="flex-col">
                    <h3 className="main-feed-header width-100-percents">{title}</h3>
                    <span className="main-feed-description text-align-start" dangerouslySetInnerHTML={{ __html: description}} />}
                </div>
                <div className={getClasses("justify-content-center flex-wrap-wrap align-items-start", eventStore.isMobile ? 'flex-col' : 'flex-row')}>
                    {isLoading ? <SystemRecommendationsShimmeringPlaceholder/> : (
                        <>
                            {feedStore.systemRecommendations.map((item, idx) => (
                                <div key={item.id} className={classList}>
                                    <PointOfInterest key={item.id} item={{
                                        ...item,
                                        name: getEventTitle({
                                            title: item.name
                                        } as unknown as CalendarEvent, eventStore, true)!,
                                        description: getEventDescription(item as unknown as CalendarEvent, eventStore, true),
                                    }} eventStore={eventStore} mainFeed={mainFeed} isSearchResult={!!searchKeyword} isViewItem={!!viewItemId} />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default observer(SystemRecommendationsView);