import React, {useContext, useState, useEffect, useRef, useMemo} from 'react';
import './search-component.scss';
import TranslateService from "../../../services/translate-service";
import { eventStoreContext } from "../../../stores/events-store";
import { getClasses } from "../../../utils/utils";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import FeedViewApiService from "../../services/feed-view-api-service";
import {observer} from "mobx-react";
import onClickOutside from 'react-onclickoutside';
import {CityOrCountry, fetchCitiesAndSetOptions} from "../destination-selector/destination-selector";
import {cityImage} from "../../utils/consts";

export interface SearchSuggestion {
    name: string;
    category: string;
    destination: string;
    image?: string;
    hideImage?: boolean;
}

const TriplanSearchV2 = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [chosenName, setChosenItem] = useState('');
    const [rerenderCounter, setReRenderCounter] = useState(0);

    const citiesAndCountries = useMemo<CityOrCountry[]>(() => fetchCitiesAndSetOptions(), []);
    const searchSuggestionsCaching = useRef<Record<string, SearchSuggestion[]>>({});

    const eventStore = useContext(eventStoreContext);
    useHandleWindowResize();

    // @ts-ignore
    TriplanSearchV2.handleClickOutside = () => handleClickOutside();

    function handleClickOutside() {
        if (!eventStore.isMobile) {
            setTimeout(() => {
                setShowSuggestions(false);
            }, 100);
        }
    }

    const shouldShowSuggestions = suggestions.length > 0 && searchQuery.length > 3 && (chosenName == "" || !searchQuery.includes(chosenName) || searchQuery.trim().length > chosenName.length) && (!chosenName.includes(searchQuery)) && showSuggestions;
    const prevShouldShowSuggestions = useRef(shouldShowSuggestions);
    useEffect(() => {
        if (eventStore.isMobile) {
            if (shouldShowSuggestions !== prevShouldShowSuggestions.current) {
                if (prevShouldShowSuggestions.current && !shouldShowSuggestions) {
                    setReRenderCounter(rerenderCounter + 1);
                }
                prevShouldShowSuggestions.current = shouldShowSuggestions;
            }

            if (showSuggestions && suggestions.length > 0) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }

        return () => {
            document.body.style.overflow = 'auto';
        };

    }, [shouldShowSuggestions, suggestions]);

    const apiService = useMemo(() => new FeedViewApiService(), []);

    async function loadSuggestions() {
        if (searchQuery.length >= 3) {
            const cachedKey = Object.keys(searchSuggestionsCaching.current).find((s) => s.includes(searchQuery.trim()));
            if (cachedKey) {
                // console.log(searchSuggestionsCaching.current)
                console.log("returned from cache!");
                setSuggestions(searchSuggestionsCaching.current[cachedKey]);
                return searchSuggestionsCaching.current[cachedKey];
            }

            let results: SearchSuggestion[] = await apiService.getSearchSuggestions(searchQuery.trim());

            const countries = citiesAndCountries.filter((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) && c.type === "country").map((c) => ({
                name: c.value,
                category: c.type,
                destination: c.label,
                image: cityImage
            }));

            const cities = citiesAndCountries.filter((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) && c.type === "city").map((c) => ({
                name: c.value,
                category: c.type,
                destination: c.label,
                image: cityImage
            }));

            results = [
                ...countries,
                ...cities,
                ...results,
            ]

            searchSuggestionsCaching.current = {
                ...searchSuggestionsCaching.current,
                [searchQuery.trim()]: results
            };
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
        }
    }

    useEffect(() => {
        loadSuggestions();
    }, [searchQuery])

    // Function to handle input change
    const handleInputChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        // Mocked suggestions for demo purpose
        const filteredSuggestions = [{ name: TranslateService.translate(eventStore, "LOADING_TRIPS.TEXT"), category: "", destination: "", hideImage: true}];

        //     [
        //     { name: 'Dubai', descriptor: 'City in United Arab Emirates' },
        //     { name: 'Dubai Airport', descriptor: 'Attraction in Dubai, UAE' },
        //     { name: 'Dubai Marina', descriptor: 'Neighborhood in Dubai, UAE' },
        //     { name: 'Dubai Mall', descriptor: 'Shopping Mall in Dubai, UAE' },
        //     { name: 'Dubai Frame', descriptor: 'Attraction in Dubai, UAE' },
        //     { name: 'Skydive Dubai', descriptor: 'Adventure Sports in Dubai, UAE' }
        // ];

        // Filter suggestions based on query (mocked example)
        // const filteredSuggestions = mockSuggestions.filter((suggestion) =>
        //     suggestion.name.toLowerCase().includes(query.toLowerCase())
        // );

        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
    };

    // Function to handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        document.body.style.overflow = 'auto';
        setSearchQuery(suggestion.name);
        setShowSuggestions(false);
        setChosenItem(suggestion.name);
        setSuggestions([]);
    };

    const isShort = eventStore.isMobile ? '.SHORT' : '';

    function getDescription(suggestion: SearchSuggestion) {
        const isCityOrCountry = suggestion.image == cityImage;
        if (isCityOrCountry) {
            return suggestion.destination;
        }
        return suggestion.destination ? TranslateService.translate(eventStore, 'X_IN_Y', {
            X: TranslateService.translate(eventStore, suggestion.category),
            Y: TranslateService.translate(eventStore, suggestion.destination)
        }) : "";
    }

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
                                {!suggestion.hideImage && <div className="suggestion-item-image" style={{
                                    // backgroundImage: `url(${suggestion.image})`
                                    backgroundImage: `url(${suggestion.image ?? "images/no-image.png"})`
                                }}/>}
                                <div className="suggestion-item-text">
                                    <p className="suggestion-name">{TranslateService.translate(eventStore,suggestion.name)}</p>
                                    <small className="suggestion-descriptor">{getDescription(suggestion)}</small>
                                </div>
                            </div>
                        ))
                    }}
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

var clickOutsideConfig = {
    handleClickOutside: function (instance: any) {
        // There aren't any "instances" when dealing with functional
        // components, so we ignore the instance parameter entirely,
        //  and just return the handler that we set up for Menu:

        // @ts-ignore
        return TriplanSearchV2.handleClickOutside;
    },
};

export default observer(onClickOutside(TriplanSearchV2, clickOutsideConfig));
