import React, { useState, useEffect } from "react";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import { EventStore } from "../../stores/events-store";
import FeedViewApiService from "./services/feed-view-api-service";
import CategoryFilter from "./components/category-filter";
import {getClasses} from "../../utils/utils";
import TranslateService from "../../services/translate-service";
import './feed-view.scss';
import LazyLoadComponent from "./components/lazy-load-component";

interface FeedViewProps {
    eventStore: EventStore;
}

function FeedView({ eventStore }: FeedViewProps) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    // useEffect(() => {
    //     const fetchItems = async () => {
    //         const response = await (new FeedViewApiService().getItems("Dubai", 1));
    //         setItems(response.results);
    //         setFilteredItems(response.results); // Initially set filtered items to all items
    //         const uniqueCategories = Array.from(
    //             new Set(response.results.map((item) => item.category))
    //         );
    //         setCategories(uniqueCategories);
    //     };
    //
    //     fetchItems();
    // }, []);

    const fetchItems = async (page, setLoading) => {
        setLoading(true);

        // console.log("loading!");
        const response = await (new FeedViewApiService().getItems("Dubai", page));
        // console.log(response);
        const newItems = [...items, ...response.results];
        setItems(newItems);
        // setFilteredItems([...items, ...response.results]); // Initially set filtered items to all items
        handleCategoryChange(selectedCategory, newItems);

        const uniqueCategories = Array.from(
            new Set(response.results.map((item) => item.category))
        );
        setCategories(uniqueCategories);

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
        <LazyLoadComponent fetchData={(page, setLoading) => fetchItems(page, setLoading)}>
            <div className="flex-column gap-4">
                <div className={getClasses("feed-view-filter-bar flex-row justify-content-space-between", eventStore.isHebrew && 'hebrew-mode')}>
                    <CategoryFilter
                        categories={categories}
                        onFilterChange={(category) => handleCategoryChange(category, items)}
                    />
                    {items.length != filteredItems.length && <span className="flex-1-1-0 min-width-max-content">{TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y', {
                        0: filteredItems.length,
                        1: items.length
                    })}</span>}
                </div>
                {filteredItems.map((item) => (
                    <PointOfInterest key={item.id} item={item} eventStore={eventStore} />
                ))}
            </div>
        </LazyLoadComponent>
    );
}

export default FeedView;
