import React, {useContext, useState} from "react";
import './category-filter.scss';
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import {defaultCategoriesKeys, getDefaultCategories} from "../../../utils/defaults";
import {mergeArraysUnique} from "../../../utils/utils";
import {getParameterFromHash} from "../../utils/utils";

const CategoryFilter = ({ categories, onFilterChange }) => {
    const eventStore = useContext(eventStoreContext);
    const [selectedCategory, setSelectedCategory] = useState('');

    const filteredByDestination = getParameterFromHash('d');

    const handleCategoryChange = (event) => {
        const category = event.target.value;
        setSelectedCategory(category);
        onFilterChange(category); // Pass selected category back to parent component
    };

    return (
        <div className="category-filter">
            <span>{TranslateService.translate(eventStore, 'FILTER_BY')}</span>
            <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="category-select"
                placeholder={TranslateService.translate(eventStore, 'MODALS.CATEGORY')}
            >
                <option value="">{TranslateService.translate(eventStore, 'ALL_CATEGORIES')}</option>
                {mergeArraysUnique(categories, defaultCategoriesKeys).map((category) => (
                    <option key={category} value={category}>
                        {TranslateService.translate(eventStore, category)}
                    </option>
                ))}
            </select>
            {!!filteredByDestination && (
                <div>{TranslateService.translate(eventStore, 'DESTINATION')}: {filteredByDestination}</div>
            )}
        </div>
    );
};

export default CategoryFilter;