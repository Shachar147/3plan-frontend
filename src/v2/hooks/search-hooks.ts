import {useContext, useEffect, useMemo, useRef} from "react";
import {eventStoreContext} from "../../stores/events-store";
import {cityImage} from "../utils/consts";
import {SearchSuggestion} from "../components/search-component/triplan-search-v2";
import FeedViewApiService from "../services/feed-view-api-service";
import {CityOrCountry, fetchCitiesAndSetOptions} from "../components/destination-selector/destination-selector";
import {CalendarEvent, SidebarEvent} from "../../utils/interfaces";
import TranslateService from "../../services/translate-service";
import {formatDate, formatTime, getDurationString, toDate} from "../../utils/time-utils";
import {searchStoreContext} from "../stores/search-store";

export function useMobileLockScroll(rerenderCounter: number, setReRenderCounter: (num: number) => void, shouldShowSuggestions: boolean, showSuggestions: boolean, suggestions: any[]){
    const eventStore = useContext(eventStoreContext);
    const searchStore = useContext(searchStoreContext);
    const prevShouldShowSuggestions = useRef(shouldShowSuggestions);

    useEffect(() => {
        if (eventStore.isMobile) {
            if (shouldShowSuggestions !== prevShouldShowSuggestions.current) {
                if (prevShouldShowSuggestions.current && !shouldShowSuggestions) {
                    setReRenderCounter(rerenderCounter + 1);
                }
                prevShouldShowSuggestions.current = shouldShowSuggestions;
            }

            if (searchStore.shouldShowSuggestions && showSuggestions && suggestions.length > 0) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }

        return () => {
            document.body.style.overflow = 'auto';
        };

    }, [shouldShowSuggestions, suggestions]);
}

export function useLoadSuggestions(searchQuery: string, setSuggestions: (suggestions: SearchSuggestion[]) => void, setShowSuggestions: (show: boolean) => void, isInPlan: boolean) {
    const eventStore = useContext(eventStoreContext);

    const translatedSearchQuery = TranslateService.translateFromTo(eventStore, searchQuery, undefined, 'he', 'en');
    // if (translatedSearchQuery != searchQuery) {
    //     console.log("heree", searchQuery, ' -> ', translatedSearchQuery);
    // }

    function scheduledOn(e: SidebarEvent | CalendarEvent) {
        const calendarEvent = e as CalendarEvent;
        if (!calendarEvent.start || !calendarEvent.end) {
            return;
        }
        const dtStart = toDate(calendarEvent.start);
        const dtEnd = toDate(calendarEvent.end);
        const dt = formatDate(dtStart);
        const startTime = dtStart?.toLocaleTimeString('en-US', { hour12: false });
        const endTime = dtEnd?.toLocaleTimeString('en-US', { hour12: false });
        const start = formatTime(startTime);
        const end = formatTime(endTime);

        const duration = getDurationString(eventStore, calendarEvent.duration);
        return { date: dt, start, end, duration }
    }

    function searchInTrip(){
        const allOptions = eventStore.allEventsComputed;

        const categoryIdToName = eventStore.categories.reduce((hash, category) => {
            hash[category.id] = category.title;
            return hash;
        }, {});

        const results = allOptions.filter((e) => {
                //console.log(e.title, e.description, e.category, categoryIdToName[e.category]);
                return e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                categoryIdToName[e.category]?.toLowerCase().includes(searchQuery.toLowerCase())
            }
        ).map((e) => ({
            name: e.title,
            category: categoryIdToName[e.category],
            destination: scheduledOn(e) ? TranslateService.translate(eventStore, 'SCHEDULED_ON', scheduledOn(e)) : undefined,
            id: e.id,
            image: e.images ? Array.isArray(e.images) ? e.images[0] : e.images.split('\n')[0] : undefined,
            hideImage: false
        } as unknown as SearchSuggestion));

        setSuggestions(results);
        setShowSuggestions(true);
    }

    const searchSuggestionsCaching = useRef<Record<string, SearchSuggestion[]>>({});
    const apiService = useMemo(() => new FeedViewApiService(), []);

    const citiesAndCountries = useMemo<CityOrCountry[]>(() => fetchCitiesAndSetOptions(), []);

    function isMatchQuery(c: CityOrCountry) {
        return c.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) || (translatedSearchQuery && c.label.toLowerCase().includes(translatedSearchQuery.toLowerCase().trim()));

    }

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

            const countries = citiesAndCountries.filter((c) => isMatchQuery(c) && c.type === "country").map((c) => ({
                name: c.value,
                category: c.type,
                destination: c.label,
                image: cityImage
            }));

            const cities = citiesAndCountries.filter((c) => isMatchQuery(c) && c.type === "city").map((c) => ({
                name: c.value,
                category: c.type,
                destination: c.label,
                image: cityImage
            }));

            const others = citiesAndCountries.filter((c) => isMatchQuery(c) && c.type !== "city" && c.type !== "country").map((c) => ({
                name: c.value,
                category: c.type,
                destination: c.label,
                image: cityImage
            }));

            results = [
                ...countries,
                ...cities,
                ...others,
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
        if (isInPlan) {
            searchInTrip();
        } else {
            loadSuggestions();
        }
    }, [searchQuery, isInPlan])
}