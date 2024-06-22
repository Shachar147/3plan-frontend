import React, { useState, useEffect, useMemo } from "react";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import { EventStore } from "../../stores/events-store";
import FeedViewApiService, {allSources} from "./services/feed-view-api-service";
import CategoryFilter from "./components/category-filter";
import { getClasses } from "../../utils/utils";
import TranslateService from "../../services/translate-service";
import './feed-view.scss';
import LazyLoadComponent from "./components/lazy-load-component";

interface FeedViewProps {
    eventStore: EventStore;
}

const cacheThreshold = 400;

function FeedView({ eventStore }: FeedViewProps) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
    const [finishedSources, setFinishedSources] = useState([]);
    const [reachedEnd, setReachedEnd] = useState(false);

    const apiService = useMemo(() => new FeedViewApiService(), []);
    const destination = "Dubai";

    useEffect(() => {
        const fetchCounts = async () => {
            const counts = await apiService.getCount(destination);
            setSourceCounts(counts);
            setIsLoading(false);
        };
        fetchCounts();
    }, [apiService, destination]);

    const fetchItems = async (page, setLoading) => {
        setLoading(true);

        const sources = allSources.filter(
            source => (source === "Local" || (sourceCounts[source] ?? 0) < cacheThreshold) && !finishedSources.includes(source)
        );

        if (sources.length === 0) {
            setLoading(false);
            setReachedEnd(true);
            return;
        }

        const responses = await Promise.all(
            sources.map(source => apiService.getItems(source, destination, page))
        );

        const _finishedSources = [];
        const newItems = responses.reduce((acc, response) => {
            const source = response.source;
            acc.push(...response.results);
            if (response.isFinished) {
                _finishedSources.push(source);
            }
            return acc;
        }, []);

        // Function to filter duplicates based on name, url, source combination
        const filterUniqueItems = (items) => {
            const seen = new Map();
            return items.filter(item => {
                const key = item.name + item.url + item.source;
                return seen.has(key) ? false : seen.set(key, true);
            });
        };

        const uniqueNewItems = filterUniqueItems(newItems);

        setFinishedSources((prevFinishedSources) => {
            return [...new Set([...prevFinishedSources, ..._finishedSources])];
        });

        setItems(prevItems => [...prevItems, ...uniqueNewItems]);
        handleCategoryChange(selectedCategory, [...items, ...uniqueNewItems]);

        const uniqueCategories = Array.from(
            new Set(uniqueNewItems.map(item => item.category))
        );
        setCategories(prevCategories => [...new Set([...prevCategories, ...uniqueCategories])]);

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

    return (
        isLoading ? <span>{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</span> : <LazyLoadComponent fetchData={(page, setLoading) => fetchItems(page, setLoading)} isLoading={isLoading}>
            <div className="flex-column gap-4">
                <div className={getClasses("feed-view-filter-bar flex-row justify-content-space-between", eventStore.isHebrew && 'hebrew-mode')}>
                    <CategoryFilter
                        categories={categories}
                        onFilterChange={(category) => handleCategoryChange(category, items)}
                    />
                    {items.length !== filteredItems.length && <span className="flex-1-1-0 min-width-max-content">{TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y', {
                        0: filteredItems.length,
                        1: items.length
                    })}</span>}
                </div>
                {filteredItems.map((item, idx) => (
                    <div className="flex-row width-100-percents align-items-center">
                        {idx+1}
                        <PointOfInterest key={item.id} item={item} eventStore={eventStore} />
                    </div>
                ))}
                {reachedEnd && filteredItems.length > 0 && (
                    <div className="width-100-percents text-align-center">
                        {TranslateService.translate(eventStore, 'NO_MORE_ITEMS')}
                    </div>
                )}
            </div>
        </LazyLoadComponent>
    );
}

export default FeedView;
