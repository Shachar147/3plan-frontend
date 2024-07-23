import React, {useEffect, useMemo, useContext, useState} from "react";
import { observer } from "mobx-react";
import PointOfInterest from "../point-of-interest/point-of-interest";
import { EventStore, eventStoreContext } from "../../../stores/events-store";
import FeedViewApiService, { allSources } from "../../services/feed-view-api-service";
import CategoryFilter from "../category-filter/category-filter";
import { getClasses } from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import './feed-view.scss';
import LazyLoadComponent from "../lazy-load-component/lazy-load-component";
import DestinationSelector from "../destination-selector/destination-selector";
import Button, { ButtonFlavor } from "../../../components/common/button/button";
import { feedStoreContext } from "../../stores/feed-view-store";

interface FeedViewProps {
    eventStore: EventStore;
    mainFeed?: boolean;
}

const cacheThreshold = 300;

function SelectDestinationPlaceholder() {
    const eventStore = useContext(eventStoreContext);
    const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

    return (
        <div className={getClasses("width-100-percents text-align-center flex-align-items-center justify-content-center flex-column gap-8", eventStore.getCurrentDirection() === 'rtl' && 'direction-rtl')}>
            {TranslateService.translate(eventStore, 'FEED_VIEW.FEED_IS_EMPTY_NO_DESTINATIONS.SELECT')}
            <DestinationSelector onChange={setSelectedDestinations} />
            <Button
                flavor={ButtonFlavor.primary}
                disabled={!selectedDestinations?.length || eventStore.isTripLocked || !eventStore.canWrite}
                text={TranslateService.translate(eventStore, 'UPDATE_TRIP')}
                onClick={() => eventStore.dataService.setDestinations(selectedDestinations, eventStore.tripName).then(() => window.location.reload())}
            />
        </div>
    )
}

const FeedView = ({ eventStore, mainFeed }: FeedViewProps) => {
    const feedStore = useContext(feedStoreContext);
    const apiService = useMemo(() => new FeedViewApiService(), []);
    const haveNoDestinations = eventStore.destinations == "[]" || eventStore.destinations?.[0] == "[]" || eventStore.destinations?.length == 0;

    useEffect(() => {
        const fetchCounts = async () => {
            if (haveNoDestinations) {
                feedStore.setIsLoading(false);
                return;
            }
            const countsPromises = eventStore.destinations.map(destination => apiService.getCount(destination));
            const countsResults = await Promise.all(countsPromises);

            const newSourceCounts = {};
            countsResults.forEach((counts, index) => {
                newSourceCounts[eventStore.destinations[index]] = counts;
            });

            feedStore.setSourceCounts(newSourceCounts);
            feedStore.setIsLoading(false);
        };

        if (mainFeed) {
            feedStore.setIsLoading(false);
        } else {
            fetchCounts();
        }
    }, [apiService, eventStore.destinations]);

    // Function to filter duplicates based on name, url, source combination
    const filterUniqueItems = (items) => {
        const seen = new Map();
        return items.filter(item => {
            const key = item.name + item.url + item.source;
            return seen.has(key) ? false : seen.set(key, true);
        });
    };

    const fetchItems = async (page, setLoading) => {
        setLoading(true);
        const newItems = [];
        let _reachedEndPerDestination = feedStore.reachedEndPerDestination ?? {};

        if (mainFeed) {
            if (page > 1 || feedStore.items.length) {
                return;
            }
            const destination = "MainFeed";
            const responses = await Promise.all(
                [
                    apiService.getMainFeedItems()
                ]);

            responses.forEach(response => {
                newItems.push(...response.results);
                response.isFinished = true;
                feedStore.setFinishedSources([...feedStore.finishedSources, response.source]);
            });

            _reachedEndPerDestination[destination] = true;
            feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
        }
        else {
            for (const destination of eventStore.destinations) {
                const sources = allSources.filter(
                    source => (source === "Local" || (feedStore.sourceCounts[destination]?.[source] ?? 0) < cacheThreshold) && !feedStore.finishedSources.includes(source)
                );

                if (sources.length === 0) {
                    // If no sources left for this destination, continue to the next destination
                    feedStore.setReachedEndPerDestination({
                        ...feedStore.reachedEndPerDestination,
                        [destination]: true
                    });
                }

                let allFinished = false;
                if (destination != "[]") {
                    const responses = await Promise.all(
                        sources.map(source => apiService.getItems(source, destination, page))
                    );

                    responses.forEach(response => {
                        newItems.push(...response.results);
                        if (response.isFinished) {
                            feedStore.setFinishedSources([...feedStore.finishedSources, response.source]);
                        }
                    });

                    // Check if items are finished for this destination
                    allFinished = responses.every(response => response.isFinished);
                }

                if (allFinished) {
                    _reachedEndPerDestination[destination] = true;
                    feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
                }
            }
        }

        let uniqueNewItems = filterUniqueItems(newItems);
        if (mainFeed && feedStore.items.length > 0){
            uniqueNewItems = [];
        }
        feedStore.setItems(filterUniqueItems([...feedStore.items, ...uniqueNewItems]));
        handleCategoryChange(feedStore.selectedCategory, filterUniqueItems([...feedStore.items, ...uniqueNewItems]));

        const uniqueCategories = Array.from(
            new Set(uniqueNewItems.map(item => item.category))
        );
        feedStore.setCategories([...new Set([...feedStore.categories, ...uniqueCategories])]);

        // Check if all destinations have reached the end
        const allReachedEndNow = eventStore.destinations.every(dest => _reachedEndPerDestination[dest]);
        feedStore.setReachedEndForDestinations(allReachedEndNow);

        setLoading(false);
    };

    const handleCategoryChange = (category, items) => {
        feedStore.setSelectedCategory(category);
        if (category === "") {
            feedStore.setFilteredItems(items); // Show all items if no category selected
        } else {
            const filtered = items.filter((item) => item.category === category);
            feedStore.setFilteredItems(filtered);
        }
    };

    // useEffect to update allReachedEnd state based on reachedEndForDestinations and other conditions
    useEffect(() => {
        const allSourcesFinished = allSources.every(source => feedStore.finishedSources.includes(source));

        if (feedStore.reachedEndForDestinations && allSourcesFinished) {
            feedStore.setAllReachedEnd(true);
        } else {
            feedStore.setAllReachedEnd(false);
        }
    }, [feedStore.reachedEndForDestinations, feedStore.finishedSources]);

    function renderShowingResultsText() {
        const isFiltering = feedStore.items.length !== feedStore.filteredItems.length;

        if (!eventStore.destinations?.length || eventStore.destinations == '[]') {
            return;
        }

        return (
            <div className={getClasses("flex-1-1-0 min-width-max-content gap-4", eventStore.getCurrentDirection() === 'rtl' && 'direction-rtl')}>
                <span>{TranslateService.translate(eventStore, "FEED_VIEW.EXPLORING", {
                    destinations: eventStore.destinations?.join(", ") || "-"
                })}</span>
                {isFiltering && <span>({ TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y', {
                    0: feedStore.filteredItems.length,
                    1: feedStore.items.length
                })})</span>}
            </div>
        );
    }

    function renderCategoryFilter() {
        if (mainFeed) {
            return null;
        }
        if (haveNoDestinations) {
            return null;
        }
        return (
            <div className={getClasses("feed-view-filter-bar justify-content-space-between", eventStore.isHebrew ? 'hebrew-mode flex-row-reverse' : 'flex-row')}>
                <CategoryFilter
                    categories={feedStore.categories}
                    onFilterChange={(category) => handleCategoryChange(category, feedStore.items)}
                />
                {renderShowingResultsText()}
            </div>
        );
    }

    function renderItems() {
        const classList = getClasses("align-items-center", !mainFeed && 'width-100-percents', eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

        if (mainFeed) {
            return (
                <div className="flex-column margin-top-10">
                    <h2 className="main-feed-header">{
                        TranslateService.translate(eventStore, 'TOP_PICKS')
                    }</h2>
                    <div className="flex-row justify-content-center flex-wrap-wrap align-items-start">
                        {
                            feedStore.filteredItems.map((item, idx) => (
                                <div key={item.id} className={classList}>
                                    <PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed={mainFeed} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            )
        }

        return feedStore.filteredItems.map((item, idx) => (
            <div key={item.id} className={classList}>
                {idx + 1}
                <PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed={mainFeed} />
            </div>
        ));
    }

    function isFiltered() {
        return feedStore.selectedCategory != "";
    }

    function renderReachedEnd() {
        if (!feedStore.allReachedEnd) {
            return null;
        }
        if (isFiltered() && feedStore.filteredItems.length == 0) {
            return null;
        }

        return (
            <div className="width-100-percents text-align-center">
                {TranslateService.translate(eventStore, 'NO_MORE_ITEMS')}
            </div>
        );
    }

    function renderSelectDestinationPlaceholder() {
        if (haveNoDestinations) {
            return (
                <SelectDestinationPlaceholder />
            );
        }
    }

    return (
        (feedStore.isLoading && !haveNoDestinations) ? <div className="height-60 width-100-percents text-align-center">{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</div> : <LazyLoadComponent className="width-100-percents" disableLoader={mainFeed} fetchData={(page, setLoading) => fetchItems(page, setLoading)} isLoading={feedStore.isLoading}>
            <div className={getClasses(!mainFeed && 'flex-column', "gap-4")}>
                {renderCategoryFilter()}
                {renderItems()}
                {renderReachedEnd()}
                {renderSelectDestinationPlaceholder()}
            </div>
        </LazyLoadComponent>
    );
}

export default observer(FeedView);
