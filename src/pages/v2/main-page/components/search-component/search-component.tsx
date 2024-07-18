import React, {useContext, useState} from 'react';
import './search-component.scss';
import TranslateService from "../../../../../services/translate-service";
import {eventStoreContext} from "../../../../../stores/events-store";
import {getClasses} from "../../../../../utils/utils";

const SearchComponent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const eventStore = useContext(eventStoreContext);

    // Function to handle input change
    const handleInputChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        // Mocked suggestions for demo purpose
        const mockSuggestions = [
            { name: 'Dubai', descriptor: 'City in United Arab Emirates' },
            { name: 'Dubai Airport', descriptor: 'Attraction in Dubai, UAE' },
            { name: 'Dubai Marina', descriptor: 'Neighborhood in Dubai, UAE' },
            { name: 'Dubai Mall', descriptor: 'Shopping Mall in Dubai, UAE' },
            { name: 'Dubai Frame', descriptor: 'Attraction in Dubai, UAE' },
            { name: 'Skydive Dubai', descriptor: 'Adventure Sports in Dubai, UAE' }
        ];

        // Filter suggestions based on query (mocked example)
        const filteredSuggestions = mockSuggestions.filter((suggestion) =>
            suggestion.name.toLowerCase().includes(query.toLowerCase())
        );

        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
    };

    // Function to handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion.name);
        setShowSuggestions(false);
    };

    const isShort = eventStore.isMobile ? '.SHORT' : ''; // todo complete - shorter text in mobile?


    return (
        <div className={getClasses("search-container", searchQuery.length > 0 && 'has-values')}>
            <div className="search-box">
                <input
                    className="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={TranslateService.translate(eventStore, `HEADER_SEARCH_PLACEHOLDER${isShort}`)}
                    autoComplete="off"
                />
                <button className="search-button" type="button">
                    {TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH')}
                </button>
            </div>
            {searchQuery.length > 0 && showSuggestions && (
                <div className="suggestions-container bright-scrollbar">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <p className="suggestion-name">{suggestion.name}</p>
                            <small className="suggestion-descriptor">{suggestion.descriptor}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchComponent;
