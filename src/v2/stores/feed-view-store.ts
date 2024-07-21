import { createContext } from "react";
import {action, observable} from "mobx";

export class FeedStore {
    @observable items: any[] = [];
    @observable filteredItems: any[] = [];
    @observable categories: string[] = [];
    @observable selectedCategory: string = "";
    @observable isLoading: boolean = true;
    @observable sourceCounts: Record<string, number[]> = {};
    @observable finishedSources: string[] = [];
    @observable reachedEndPerDestination: Record<string, boolean> = {};
    @observable reachedEndForDestinations: boolean = false;
    @observable allReachedEnd: boolean = false;

    @action
    setItems = (items: any[]) => {
        this.items = items;
    };

    @action
    setFilteredItems = (filteredItems: any[]) => {
        this.filteredItems = filteredItems;
    };

    @action
    setCategories = (categories: string[]) => {
        this.categories = categories;
    };

    @action
    setSelectedCategory = (selectedCategory: string) => {
        this.selectedCategory = selectedCategory;
    };

    @action
    setIsLoading = (isLoading: boolean) => {
        this.isLoading = isLoading;
    };

    @action
    setSourceCounts = (sourceCounts: Record<string, number[]>) => {
        this.sourceCounts = sourceCounts;
    };

    @action
    setFinishedSources = (finishedSources: string[]) => {
        this.finishedSources = finishedSources;
    };

    @action
    setReachedEndPerDestination = (reachedEndPerDestination: Record<string, boolean>) => {
        this.reachedEndPerDestination = reachedEndPerDestination;
    };

    @action
    setReachedEndForDestinations = (reachedEndForDestinations: boolean) => {
        this.reachedEndForDestinations = reachedEndForDestinations;
    };

    @action
    setAllReachedEnd = (allReachedEnd: boolean) => {
        this.allReachedEnd = allReachedEnd;
    };
}

export const feedStoreContext = createContext(new FeedStore());
