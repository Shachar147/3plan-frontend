import React, {useState, useEffect, useMemo, useContext} from "react";
import PointOfInterest from "../point-of-interest/point-of-interest";
import {EventStore, eventStoreContext} from "../../../stores/events-store";
import FeedViewApiService, { allSources } from "../../services/feed-view-api-service";
import CategoryFilter from "../category-filter/category-filter";
import { getClasses } from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import './feed-view.scss';
import LazyLoadComponent from "../lazy-load-component/lazy-load-component";
import DestinationSelector from "../../../components/destination-selector/destination-selector";
import Button, {ButtonFlavor} from "../../../components/common/button/button";

interface FeedViewProps {
    eventStore: EventStore;
    mainFeed?: boolean;
}

const cacheThreshold = 300;

function SelectDestinationPlaceholder(){
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

function FeedView({ eventStore, mainFeed }: FeedViewProps) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [sourceCounts, setSourceCounts] = useState<Record<string, number[]>>({});
    const [finishedSources, setFinishedSources] = useState<string[]>([]);
    const [reachedEndPerDestination, setReachedEndPerDestination] = useState<Record<string, boolean>>({});
    const [reachedEndForDestinations, setReachedEndForDestinations] = useState<boolean>(false);
    let destinations = eventStore.destinations;
    const [allReachedEnd, setAllReachedEnd] = useState<boolean>(false);

    const apiService = useMemo(() => new FeedViewApiService(), []);
    const haveNoDestinations = destinations == "[]" || destinations?.[0] == "[]" || destinations?.length == 0;

    useEffect(() => {
        const fetchCounts = async () => {
            if (haveNoDestinations) {
                setIsLoading(false);
                return;
            }
            const countsPromises = destinations.map(destination => apiService.getCount(destination));
            const countsResults = await Promise.all(countsPromises);

            const newSourceCounts = {};
            countsResults.forEach((counts, index) => {
                newSourceCounts[destinations[index]] = counts;
            });

            setSourceCounts(newSourceCounts);
            setIsLoading(false);
        };

        if (mainFeed) {
            setIsLoading(false);
        } else {
            fetchCounts();
        }
    }, [apiService, destinations]);

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

        let _reachedEndPerDestination = reachedEndPerDestination ?? {};

        if (mainFeed) {
            if (page > 1){
                return;
            }
            destinations = ["MainFeed"];
            const destination = destinations[0];
            const responses = await Promise.all(
                [
                    apiService.getMainFeedItems()
                ]);

            responses.forEach(response => {
                newItems.push(...response.results);
                response.isFinished = true;
                setFinishedSources(prev => [...prev, response.source]);
            });

            _reachedEndPerDestination = {
                ..._reachedEndPerDestination,
                [destination]: true
            }
            setReachedEndPerDestination(_reachedEndPerDestination);
        }
        else {
            for (const destination of destinations) {
                const sources = allSources.filter(
                    source => (source === "Local" || (sourceCounts[destination]?.[source] ?? 0) < cacheThreshold) && !finishedSources.includes(source)
                );

                if (sources.length === 0) {
                    // If no sources left for this destination, continue to the next destination
                    setReachedEndPerDestination(prev => ({
                        ...prev,
                        [destination]: true
                    }));
                }

                let allFinished = false;
                if (destination != "[]") {
                    const responses = await Promise.all(
                        sources.map(source => apiService.getItems(source, destination, page))
                    );

                    responses.forEach(response => {
                        newItems.push(...response.results);
                        if (response.isFinished) {
                            setFinishedSources(prev => [...prev, response.source]);
                        }
                    });

                    // Check if items are finished for this destination
                    allFinished = responses.every(response => response.isFinished);
                }

                if (allFinished) {
                    _reachedEndPerDestination = {
                        ..._reachedEndPerDestination,
                        [destination]: true
                    }
                    setReachedEndPerDestination(_reachedEndPerDestination);
                }
            }
        }

        const uniqueNewItems = filterUniqueItems(newItems);

        setItems(prevItems => [...prevItems, ...uniqueNewItems]);
        handleCategoryChange(selectedCategory, [...items, ...uniqueNewItems]);

        const uniqueCategories = Array.from(
            new Set(uniqueNewItems.map(item => item.category))
        );
        setCategories(prevCategories => [...new Set([...prevCategories, ...uniqueCategories])]);

        // Check if all destinations have reached the end
        const allReachedEndNow = destinations.every(dest => _reachedEndPerDestination[dest]);
        setReachedEndForDestinations(allReachedEndNow);

        setLoading(false);
    };

    const handleCategoryChange = (category, items) => {
        setSelectedCategory(category);
        if (category === "") {
            setFilteredItems(items); // Show all items if no category selected
        } else {
            const filtered = items.filter((item) => item.category === category);
            setFilteredItems(filtered);
        }
    };

    // useEffect to update allReachedEnd state based on reachedEndForDestinations and other conditions
    useEffect(() => {
        const allSourcesFinished = allSources.every(source => finishedSources.includes(source));

        if (reachedEndForDestinations && allSourcesFinished) {
            setAllReachedEnd(true);
        } else {
            setAllReachedEnd(false);
        }
    }, [reachedEndForDestinations, finishedSources]);

    function renderShowingResultsText(){
        const isFiltering = items.length !== filteredItems.length;

        if (!eventStore.destinations?.length || eventStore.destinations == '[]') {
            return;
        }

        return (
            <div className={getClasses("flex-1-1-0 min-width-max-content gap-4", eventStore.getCurrentDirection() === 'rtl' && 'direction-rtl')}>
                <span>{TranslateService.translate(eventStore, "FEED_VIEW.EXPLORING", {
                    destinations: eventStore.destinations?.join(", ") || "-"
                })}</span>
                {isFiltering && <span>({ TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y', {
                    0: filteredItems.length,
                    1: items.length
                })})</span>}
            </div>
        );
    }

    function renderCategoryFilter(){
        if (mainFeed) {
            return null;
        }
        if (haveNoDestinations) {
            return null;
        }
        return (
            <div className={getClasses("feed-view-filter-bar justify-content-space-between", eventStore.isHebrew ? 'hebrew-mode flex-row-reverse' : 'flex-row')}>
                <CategoryFilter
                    categories={categories}
                    onFilterChange={(category) => handleCategoryChange(category, items)}
                />
                {renderShowingResultsText()}
            </div>
        );
    }

    function renderItems(){
        const classList = getClasses("align-items-center", !mainFeed && 'width-100-percents', eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

        return filteredItems.map((item, idx) => (
            <div key={item.id} className={classList}>
                {!mainFeed && `${idx+1}`}
                <PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed={mainFeed} />
            </div>
        ))
    }

    function isFiltered(){
        return selectedCategory != "";
    }

    function renderReachedEnd(){
        if (!allReachedEnd) {
            return null;
        }
        if (isFiltered() && filteredItems.length == 0) {
            return null;
        }

        return (
            <div className="width-100-percents text-align-center">
                {TranslateService.translate(eventStore, 'NO_MORE_ITEMS')}
            </div>
        );
    }

    function renderSelectDestinationPlaceholder(){
        if (haveNoDestinations){
            return (
                <SelectDestinationPlaceholder/>
            );
        }
    }

    return (
        (isLoading && !haveNoDestinations) ? <div className="height-60 width-100-percents text-align-center">{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</div> : <LazyLoadComponent className="width-100-percents" disableLoader={mainFeed} fetchData={(page, setLoading) => fetchItems(page, setLoading)} isLoading={isLoading}>
            <div className={getClasses(mainFeed ? 'flex-row justify-content-center flex-wrap-wrap align-items-start' : 'flex-column', "gap-4")}>
                {renderCategoryFilter()}
                {renderItems()}
                {renderReachedEnd()}
                {renderSelectDestinationPlaceholder()}
            </div>
        </LazyLoadComponent>
    );
}

export default FeedView;
