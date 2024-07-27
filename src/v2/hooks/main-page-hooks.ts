import {useContext, useEffect} from "react";
import {feedStoreContext} from "../stores/feed-view-store";
import {myTripsContext} from "../stores/my-trips-store";
import {TabData} from "../utils/interfaces";

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