import {useContext, useEffect, useMemo, useRef} from "react";
import {eventStoreContext} from "../../stores/events-store";
import {cityImage} from "../utils/consts";
import {SearchSuggestion} from "../components/search-component/triplan-search-v2";
import FeedViewApiService from "../services/feed-view-api-service";
import {CityOrCountry, fetchCitiesAndSetOptions} from "../components/destination-selector/destination-selector";

export function useMobileLockScroll(rerenderCounter: number, setReRenderCounter: (num: number) => void, shouldShowSuggestions: boolean, showSuggestions: boolean, suggestions: any[]){
    const eventStore = useContext(eventStoreContext);
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
}

export function useLoadSuggestions(searchQuery: string, setSuggestions: (suggestions: SearchSuggestion[]) => void, setShowSuggestions: (show: boolean) => void, isInPlan: boolean) {
    const eventStore = useContext(eventStoreContext);

    function searchInTrip(){
        const allOptions = eventStore.allEventsComputed;

        const categoryIdToName = eventStore.categories.reduce((hash, category) => {
            hash[category.id] = category.title;
            return hash;
        }, {})

        const results = allOptions.filter((e) => {
                //console.log(e.title, e.description, e.category, categoryIdToName[e.category]);
                return e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                categoryIdToName[e.category]?.toLowerCase().includes(searchQuery.toLowerCase())
            }
        ).map((e) => ({
            name: e.title,
            category: categoryIdToName[e.category],
            destination: "test",
            id: e.id,
            image: e.images ? Array.isArray(e.images) ? e.images[0] : e.images.split(',')[0] : undefined,
            hideImage: false
        } as unknown as SearchSuggestion));

        console.log(results);

        setSuggestions(results);
        setShowSuggestions(true);
    }

    if (isInPlan){
        useEffect(() => {
            searchInTrip();
        }, [searchQuery])
        return;
    }

    console.log("hereeee");
    const searchSuggestionsCaching = useRef<Record<string, SearchSuggestion[]>>({});
    const apiService = useMemo(() => new FeedViewApiService(), []);

    const citiesAndCountries = useMemo<CityOrCountry[]>(() => fetchCitiesAndSetOptions(), []);

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

            const others = citiesAndCountries.filter((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) && c.type !== "city" && c.type !== "country").map((c) => ({
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
        loadSuggestions();
    }, [searchQuery])
}