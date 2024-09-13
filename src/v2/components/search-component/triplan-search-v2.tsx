import React, {useContext, useEffect, useRef} from 'react';
import './search-component.scss';
import TranslateService from "../../../services/translate-service";
import { eventStoreContext } from "../../../stores/events-store";
import { getClasses } from "../../../utils/utils";
import {observer} from "mobx-react";

// @ts-ignore
// import onClickOutside from 'react-onclickoutside';
import {cityImage, newDesignRootPath, specificItemTabId} from "../../utils/consts";
import {useLoadSuggestions, useMobileLockScroll} from "../../hooks/search-hooks";
import {rootStoreContext} from "../../stores/root-store";
import ReactModalService from "../../../services/react-modal-service";
import {ViewMode} from "../../../utils/enums";
import {searchStoreContext} from "../../stores/search-store";

export interface SearchSuggestion {
    name: string;
    category: string;
    destination: string;
    id?: number; // when its' loaded from the server
    image?: string;
    hideImage?: boolean;
    rating?: number;
}

const TriplanSearchV2 = () => {
    const searchStore = useContext(searchStoreContext);
    const debounceInputChange = useRef<NodeJS.Timeout | undefined>(undefined);

    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    useEffect(() => {
        searchStore._setSearchQuery(searchStore.searchQuery);
    }, [searchStore.searchQuery])

    const eventStore = useContext(eventStoreContext);
    // useHandleWindowResize();

    // @ts-ignore
    TriplanSearchV2.handleClickOutside = () => handleClickOutside();

    function handleClickOutside() {
        if (!eventStore.isMobile) {
            setTimeout(() => {
                searchStore.setShowSuggestions(false);
            }, 100);
        }
    }

    const rootStore = useContext(rootStoreContext);
    useMobileLockScroll(searchStore.rerenderCounter, searchStore.setReRenderCounter, searchStore.shouldShowSuggestions, searchStore.showSuggestions, searchStore.suggestions);

    useLoadSuggestions(searchStore.searchQuery, searchStore.setSuggestions, searchStore.setShowSuggestions, isInPlan);

    // useEffect(() => {
    //     if (isInPlan) {
    //         eventStore.setSearchValue(searchQuery);
    //     }
    // }, [searchQuery]);

    useEffect(() => {
        if (isInPlan && eventStore.searchValue == "") {
            handleResetSearchClick();
        }
    }, [eventStore.searchValue])

    // Function to handle input change
    const handleInputChange = (event: any) => {
        const query = event.target.value;
        searchStore._setSearchQuery(query);

        clearTimeout(debounceInputChange.current);
        debounceInputChange.current = setTimeout(() => {
            searchStore.setSearchValueFromHash(false);
            searchStore.setSearchQuery(query);
            // Mocked suggestions for demo purpose
            if (isInPlan) {
                return;
            }
            const filteredSuggestions = [{ name: TranslateService.translate(eventStore, "LOADING_TRIPS.TEXT"), category: "", destination: "", hideImage: true}];
            searchStore.setSuggestions(filteredSuggestions);
            searchStore.setShowSuggestions(true);

            // rootStore.triggerTabsReRender();

        }, 300);
    };

    const handleResetSearchClick = () => {
        clearTimeout(debounceInputChange.current);

        searchStore.setSearchValueFromHash(false);
        searchStore.setSearchQuery("");
        searchStore.setSuggestions([]);
        searchStore.setShowSuggestions(true);
        window.location.hash = "";
        eventStore.resetFilters();
        rootStore.triggerTabsReRender();
    }

    // Function to handle suggestion click
    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        if (isInPlan) {
            ReactModalService.internal.closeModal(eventStore);
            eventStore.setViewMode(ViewMode.map);
            eventStore.setMobileViewMode(ViewMode.map);
            eventStore.showEventOnMap = suggestion.id!;

            handleResetSearchClick();
            return;
        }

        document.body.style.overflow = 'auto';
        searchStore.setShowSuggestions(false);
        // setChosenItem(suggestion.name);
        if (suggestion.id) {
            searchStore.setSearchQuery('');
            localStorage.setItem(`item-${suggestion.id}-name`, suggestion.name);
            window.location.hash = `${specificItemTabId}?id=${suggestion.id}`;
        } else {
            searchStore.setSearchQuery(suggestion.name);
            window.location.hash = `q=${suggestion.name}`;

        }

        window.location.reload();

        // // clear existing items & categories.
        // // todo - change to a different store of search results.
        // feedStore.setCategories([]);
        // feedStore.setItems([]);
        //
        // rootStore.triggerTabsReRender();
        // setSuggestions([]);
    };

    const isShort = eventStore.isMobile ? '.SHORT' : '';

    function getRating(suggestion: SearchSuggestion) {
        if (suggestion.rating){
            return ` (${TranslateService.translate(eventStore,'RATED_X_OF_Y', {
                X: suggestion.rating,
                Y: 5
            })})`;
        }
    }

    function getDescription(suggestion: SearchSuggestion) {
        if (isInPlan){
            return suggestion.destination || TranslateService.translate(eventStore, 'ON_CATEGORY', {
                category: suggestion.category
            });
        }

        const isCityOrCountry = suggestion.image == cityImage;
        if (isCityOrCountry) {
            return suggestion.destination;
        }
        return suggestion.destination ? TranslateService.translate(eventStore, 'X_IN_Y', {
            X: TranslateService.translate(eventStore, suggestion.category),
            Y: TranslateService.translate(eventStore, suggestion.destination)
        }) : "";
    }

    function handleSearchClick(){
        if (searchStore._searchQuery.length == 0){
            return;
        }

        if (isInPlan) {
            // todo: check why sidebar events are not displayed correctly on this state.
            eventStore.setSidebarSearchValue(searchStore._searchQuery);
            eventStore.setSearchValue(searchStore._searchQuery);
            searchStore.setShowSuggestions(false);
        } else {
            handleSuggestionClick({ name: searchStore._searchQuery, type: 'city' } as unknown as SearchSuggestion);
        }
    }

    const placeholder = isInPlan ? `HEADER_SPECIFIC_TRIP_SEARCH_PLACEHOLDER${isShort}` : `HEADER_SEARCH_PLACEHOLDER${isShort}`;

    return (
        <div className={getClasses("search-container", searchStore.shouldShowSuggestions && 'has-values')} key={`search-box-${searchStore.rerenderCounter}`}>
            <div className="search-box">
                <input
                    className="search-input"
                    type="text"
                    value={searchStore._searchQuery}
                    onChange={handleInputChange}
                    placeholder={TranslateService.translate(eventStore, placeholder)}
                    autoComplete="off"
                />
                {searchStore._searchQuery.length > 0 && <i className="fa fa-times" aria-hidden="true" onClick={() => handleResetSearchClick()} />}
                <button className="search-button no-disabled-style" type="button" onClick={() => handleSearchClick()} disabled={searchStore._searchQuery.length == 0}>
                    {TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH')}
                </button>
            </div>
            {searchStore.shouldShowSuggestions && (
                <div className="suggestions-container bright-scrollbar">
                    {searchStore.suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {!suggestion.hideImage && <div className="suggestion-item-image" style={{
                                    // backgroundImage: `url(${suggestion.image})`
                                    backgroundImage: `url(${suggestion.image ?? "/images/no-image.png"})`
                                }}/>}
                                <div className="suggestion-item-text">
                                    <p className="suggestion-name">{TranslateService.translate(eventStore,suggestion.name)}</p>
                                    <small className="suggestion-descriptor">
                                        {getDescription(suggestion)}
                                        {getRating(suggestion)}
                                    </small>
                                </div>
                            </div>
                        ))
                    }
                    {searchStore.suggestions.length === 0 && (
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

export default observer(TriplanSearchV2);
// export default observer(onClickOutside(TriplanSearchV2, clickOutsideConfig));
