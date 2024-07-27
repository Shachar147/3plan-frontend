import React, {useContext, useState} from 'react';
import './search-component.scss';
import TranslateService from "../../../services/translate-service";
import { eventStoreContext } from "../../../stores/events-store";
import { getClasses } from "../../../utils/utils";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import {observer} from "mobx-react";

// @ts-ignore
import onClickOutside from 'react-onclickoutside';
import {cityImage} from "../../utils/consts";
import {useLoadSuggestions, useMobileLockScroll} from "../../hooks/search-hooks";
import {getParameterFromHash} from "../../utils/utils";
import {rootStoreContext} from "../../stores/root-store";
import {feedStoreContext} from "../../stores/feed-view-store";

export interface SearchSuggestion {
    name: string;
    category: string;
    destination: string;
    image?: string;
    hideImage?: boolean;
}

const AUTO_COMPLETE_MIN_CHARACTERS = 3;

const TriplanSearchV2 = () => {
    const [searchQuery, setSearchQuery] = useState<string>(getParameterFromHash('q') ?? '');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [chosenName, setChosenItem] = useState('');
    const [rerenderCounter, setReRenderCounter] = useState(0);
    const [searchValueFromHash, setSearchValueFromHash] = useState((getParameterFromHash('q')?.length ?? 0) > 0)

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

    const rootStore = useContext(rootStoreContext);
    const feedStore = useContext(feedStoreContext);
    const shouldShowSuggestions = suggestions.length > 0 && searchQuery.length >= AUTO_COMPLETE_MIN_CHARACTERS && (chosenName == "" || !searchQuery.includes(chosenName) || searchQuery.trim().length > chosenName.length) && (!chosenName.includes(searchQuery)) && showSuggestions && !searchValueFromHash;
    useMobileLockScroll(rerenderCounter, setReRenderCounter, shouldShowSuggestions, showSuggestions, suggestions);

    useLoadSuggestions(searchQuery, setSuggestions, setShowSuggestions);

    // Function to handle input change
    const handleInputChange = (event: any) => {
        const query = event.target.value;
        setSearchValueFromHash(false);
        setSearchQuery(query);
        // Mocked suggestions for demo purpose
        const filteredSuggestions = [{ name: TranslateService.translate(eventStore, "LOADING_TRIPS.TEXT"), category: "", destination: "", hideImage: true}];
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        rootStore.triggerTabsReRender();
    };

    // Function to handle suggestion click
    const handleSuggestionClick = (suggestion: any) => {
        document.body.style.overflow = 'auto';
        setSearchQuery(suggestion.name);
        setShowSuggestions(false);
        setChosenItem(suggestion.name);
        window.location.hash = `q=${suggestion.name}`;

        // clear existing items & categories.
        // todo - change to a different store of search results.
        feedStore.setCategories([]);
        feedStore.setItems([]);

        rootStore.triggerTabsReRender();
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
                    }
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
