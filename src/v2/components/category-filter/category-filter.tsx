import React, {useContext, useState} from "react";
import './category-filter.scss';
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";

const CategoryFilter = ({ categories, onFilterChange }) => {
    const eventStore = useContext(eventStoreContext);
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleCategoryChange = (event) => {
        const category = event.target.value;
        setSelectedCategory(category);
        onFilterChange(category); // Pass selected category back to parent component
    };

    return (
        <div className="category-filter">
            <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="category-select"
                placeholder={TranslateService.translate(eventStore, 'MODALS.CATEGORY')}
            >
                <option value="">{TranslateService.translate(eventStore, 'MODALS.CATEGORY')}</option>
                {categories.map((category) => (
                    <option key={category} value={category}>
                        {TranslateService.translate(eventStore, category)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CategoryFilter;