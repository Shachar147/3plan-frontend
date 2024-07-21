import React, {useContext, useEffect} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import TranslateService from "../../../services/translate-service";
import {observer} from "mobx-react";
import FeedView from "../../components/feed-view/feed-view";
import './main-page-content.scss'
import MyTrips from "../my-trips/my-trips";
import {feedStoreContext} from "../../stores/feed-view-store";
import SavedCollectionsTab from "../saved-collections/saved-collections";

function TriplanTabContent({ content }: { content: string | React.ReactNode}) {
    return (
        <div className="main-page-content">
            {content}
        </div>
    )
}

function MainPageContent(){
    const eventStore = useContext(eventStoreContext);
    const feedStore = useContext(feedStoreContext);
    useHandleWindowResize();

    useEffect(() => {
        feedStore.getSavedCollections();
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

    const isShort = eventStore.isMobile ? '.SHORT' : '';
    return (
        <div className="triplan-header-banner-footer">
            <TabMenu
                tabs={[
                    {
                        id: "default",
                        name: TranslateService.translate(eventStore, `BUTTON_TEXT.FEED_VIEW${isShort}`),
                        icon: "fa-search",
                        render: () => <TriplanTabContent content={<FeedView eventStore={eventStore} mainFeed />} />
                    },
                    {
                        id: "saved-collections",
                        name: TranslateService.translate(eventStore, `SAVED_COLLECTIONS${isShort}`, {
                            X: feedStore.savedItems.length
                        }),
                        icon: "fa-save",
                        render: () => <TriplanTabContent content={<SavedCollectionsTab />} />
                    },
                    {
                        id: "my-trips",
                        name: TranslateService.translate(eventStore, `LANDING_PAGE.MY_TRIPS${isShort}`),
                        icon: "fa-plane",
                        render: () => <TriplanTabContent content={<MyTrips />} />
                    },
                ]}
            />
        </div>
    );
}

export default observer(MainPageContent);