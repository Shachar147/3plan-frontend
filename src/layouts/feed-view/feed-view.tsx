// src/components/feed-view/FeedView.tsx
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import CategoryFilter from "./components/category-filter/category-filter";
import LazyLoadComponent from "../../components/lazy-load-component/lazy-load-component";
import TranslateService from "../../services/translate-service";
import { getClasses } from "../../utils/utils";
import { EventStore } from "../../stores/events-store";
import feedViewStore from "../../stores/feed-view-store";
import "./feed-view.scss";

interface FeedViewProps {
    eventStore: EventStore;
}

const FeedView: React.FC<FeedViewProps> = ({ eventStore }) => {
    useEffect(() => {
        // Fetch initial items only if they have not been fetched yet
        if (feedViewStore.items.length === 0) {
            feedViewStore.fetchCounts().then(() => feedViewStore.fetchItems(1));
        }
    }, []);

    return feedViewStore.isLoading ? (
        <span>{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</span>
    ) : (
        <LazyLoadComponent
            fetchData={(page, setLoading) => feedViewStore.fetchItems(page)}
            isLoading={feedViewStore.isLoading}
        >
            <div className="flex-column gap-4">
                <div
                    className={getClasses(
                        "feed-view-filter-bar flex-row justify-content-space-between",
                        eventStore.isHebrew && "hebrew-mode"
                    )}
                >
                    <CategoryFilter
                        categories={feedViewStore.categories}
                        onFilterChange={(category) =>
                            feedViewStore.handleCategoryChange(category, feedViewStore.items)
                        }
                    />
                    {feedViewStore.items.length !== feedViewStore.filteredItems.length && (
                        <span className="flex-1-1-0 min-width-max-content">
                            {TranslateService.translate(eventStore, "SHOWING_X_FROM_Y", {
                                0: feedViewStore.filteredItems.length,
                                1: feedViewStore.items.length,
                            })}
                        </span>
                    )}
                </div>
                {feedViewStore.filteredItems.map((item, idx) => (
                    <div
                        key={item.id}
                        className={getClasses(
                            "width-100-percents align-items-center",
                            eventStore.isHebrew ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {idx + 1}
                        <PointOfInterest item={item} eventStore={eventStore} />
                    </div>
                ))}
                {feedViewStore.reachedEnd && feedViewStore.filteredItems.length > 0 && (
                    <div className="width-100-percents text-align-center">
                        {TranslateService.translate(eventStore, "NO_MORE_ITEMS")}
                    </div>
                )}
            </div>
        </LazyLoadComponent>
    );
};

export default observer(FeedView);