import React, {useContext, useEffect} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import TranslateService from "../../../services/translate-service";
import {observer} from "mobx-react";
import FeedView from "../../feed-view/feed-view";
import {runInAction} from "mobx";

function TriplanTabContent({ content }: { content: string | React.ReactNode}) {
    return (
        <div style={{
            minHeight: 600,
            height: "max-content"
        }}>
            {content}
        </div>
    )
}

function Content(){
    const eventStore = useContext(eventStoreContext);
    useHandleWindowResize();

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
                activeTab={TranslateService.translate(eventStore, `BUTTON_TEXT.FEED_VIEW${isShort}`)}
                tabs={[
                    {
                        name: TranslateService.translate(eventStore, `BUTTON_TEXT.FEED_VIEW${isShort}`),
                        icon: "fa-search",
                        render: () => <TriplanTabContent content={<FeedView eventStore={eventStore} mainFeed />} />
                    },
                    {
                        name: TranslateService.translate(eventStore, `SAVED_COLLECTIONS${isShort}`),
                        icon: "fa-save",
                        render: () => <TriplanTabContent content={TranslateService.translate(eventStore, `SAVED_COLLECTIONS${isShort}`)} />
                    },
                    {
                        name: TranslateService.translate(eventStore, `LANDING_PAGE.MY_TRIPS${isShort}`),
                        icon: "fa-plane",
                        render: () => <TriplanTabContent content={TranslateService.translate(eventStore, `LANDING_PAGE.MY_TRIPS${isShort}`)} />
                    },
                ]}
            />
        </div>
    );
}

export default observer(Content);