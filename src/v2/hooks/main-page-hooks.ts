import {useContext, useEffect, useMemo} from "react";
import {feedStoreContext} from "../stores/feed-view-store";
import {myTripsContext} from "../stores/my-trips-store";
import {TabData} from "../utils/interfaces";
import FeedViewApiService, {allSources} from "../services/feed-view-api-service";
import {top100Cities, top100CitiesOld} from "../utils/consts";
import PlacesPhotosApiService from "../services/places-photos-api-service";
import AiApiService from "../services/ai-api-service";

export function useSavedCollections(){
    const feedStore = useContext(feedStoreContext);
    useEffect(() => {
        if (!feedStore.savedCollections?.length) {
            feedStore.getSavedCollections();
        }
    }, [])
}

export function useMyTrips(){
    const myTripsStore = useContext(myTripsContext);
    useEffect(() => {
        if (!myTripsStore.allTripsSorted.length) {
            myTripsStore.loadMyTrips();
        }
    }, [])
}

export function useScrollWhenTabChanges(tabs: TabData[]) {
    useEffect(() => {
        const scrollContainer: Element = document.querySelector('.ui.tabular.menu')!;
        const scrollItems: NodeListOf<Element> = document.querySelectorAll('.item');

        scrollItems.forEach(item => {
            item.addEventListener('click', (event) => {
                const itemRect = item.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const scrollOffset = itemRect.left - containerRect.left + scrollContainer.scrollLeft;

                scrollContainer.scroll({
                    left: scrollOffset,
                    behavior: 'smooth' // Smooth scrolling
                });
            });
        });
    }, [tabs]);
}

export function useLoadRandomPlacePOIs(){
    // search destinations randomly to increase the content of Triplan
    const apiService = useMemo(() => new FeedViewApiService(), []);
    useEffect(() => {
        const destination = top100Cities[Math.floor(Math.random() * top100Cities.length)];
        Promise.all(
            allSources.map(source => apiService.getItems(source, destination, 1))
        );

        // search photos of that place
        new PlacesPhotosApiService().getPhoto(destination);
    }, []);
}

export function useCreateRandomTemplate(){

    // search destinations randomly to increase the content of Triplan
    const apiService = useMemo(() => new AiApiService(), []);

    useEffect(() => {
        if (window.location.href.includes("localhost")){
            return;
        }

        const destination = top100CitiesOld[Math.floor(Math.random() * top100CitiesOld.length)];
        apiService.createTemplate(destination);
    }, []);
}