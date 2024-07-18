import React, {useContext, useState, useEffect, useRef} from 'react';
import './search-component.scss';
import TranslateService from "../../../../../services/translate-service";
import { eventStoreContext } from "../../../../../stores/events-store";
import { getClasses } from "../../../../../utils/utils";
import {useHandleWindowResize} from "../../../../../custom-hooks/use-window-size";

const SearchComponent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [chosenName, setChosenItem] = useState('');
    const [rerenderCounter, setReRenderCounter] = useState(0);

    const eventStore = useContext(eventStoreContext);
    useHandleWindowResize();

    useEffect(() => {
        if (showSuggestions) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showSuggestions]);

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
        setChosenItem(suggestion.name);
    };

    const isShort = eventStore.isMobile ? '.SHORT' : '';

    const shouldShowSuggestions = suggestions.length > 0 && searchQuery.length > 0 && (chosenName == "" || !searchQuery.includes(chosenName) || searchQuery.trim().length > chosenName.length) && (!chosenName.includes(searchQuery)) && showSuggestions;
    const prevShouldShowSuggestions = useRef(shouldShowSuggestions);
    useEffect(() => {
        if (shouldShowSuggestions !== prevShouldShowSuggestions.current) {
            if (prevShouldShowSuggestions.current && !shouldShowSuggestions) {
                setReRenderCounter(rerenderCounter+1);
            }
            prevShouldShowSuggestions.current = shouldShowSuggestions;
        }
    }, [shouldShowSuggestions]);

    return (
        <div className={getClasses("search-container", shouldShowSuggestions && 'has-values')} key={`search-box-${rerenderCounter}`}>
            <div className="search-box">
                <input
                    className="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={TranslateService.translate(eventStore, `HEADER_SEARCH_PLACEHOLDER${isShort}`)}
                    autoComplete="off"
                />
                <button className="search-button" type="button" onClick={() => setChosenItem(searchQuery)}>
                    {TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH')}
                </button>
            </div>
            {shouldShowSuggestions && (
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
                    {suggestions.length === 0 && (
                        <span className="margin-top-20">
                            {TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.NO_SEARCH_RESULTS')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchComponent;
