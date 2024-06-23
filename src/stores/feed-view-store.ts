// src/stores/FeedViewStore.ts
import { observable, action, runInAction } from "mobx";
import FeedViewApiService, { allSources } from "../services/feed-view-api-service";

export interface Item {
    id: string;
    name: string;
    url: string;
    source: string;
    category: string;
}

export type ItemResponse = any; // todo complete

class FeedViewStore {
    @observable isInitiated = false;
    @observable items: Item[] = [];
    @observable filteredItems: Item[] = [];
    @observable categories: string[] = [];
    @observable selectedCategory = "";
    @observable isLoading = true;
    @observable sourceCounts: Record<string, number> = {};
    @observable finishedSources: string[] = [];
    @observable reachedEnd = false;

    destination = "Rome";
    cacheThreshold = 0;
    apiService = new FeedViewApiService();

    constructor() {}

    @action async fetchCounts() {
        this.isLoading = true;
        try {
            const counts = await this.apiService.getCount(this.destination);
            runInAction(() => {
                this.sourceCounts = counts;
                this.isLoading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.isLoading = false;
                // Handle error (optional)
            });
        } finally {
            this.isInitiated = true;
        }
    }

    @action async fetchItems(page: number) {
        this.isLoading = true;

        const sources = allSources.filter(
            source => (source === "Local" || (this.sourceCounts[source] ?? 0) < this.cacheThreshold) && !this.finishedSources.includes(source)
        );

        if (sources.length === 0) {
            runInAction(() => {
                this.isLoading = false;
                this.reachedEnd = true;
            });
            return;
        }

        try {
            const responses: ItemResponse[] = await Promise.all(
                sources.map(source => this.apiService.getItems(source, this.destination, page))
            );

            const _finishedSources: string[] = [];
            const newItems: Item[] = responses.reduce((acc: Item[], response: ItemResponse) => {
                const source = response.source;
                acc.push(...response.results);
                if (response.isFinished) {
                    _finishedSources.push(source);
                }
                return acc;
            }, []);

            const uniqueNewItems = this.filterUniqueItems(newItems);

            runInAction(() => {
                // @ts-ignore
                this.finishedSources = [...new Set([...this.finishedSources, ..._finishedSources])];
                this.items = [...this.items, ...uniqueNewItems];
                this.handleCategoryChange(this.selectedCategory, [...this.items, ...uniqueNewItems]);

                const uniqueCategories = Array.from(new Set(uniqueNewItems.map(item => item.category)));
                // @ts-ignore
                this.categories = [...new Set([...this.categories, ...uniqueCategories])];

                this.isLoading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.isLoading = false;
                // Handle error (optional)
            });
        }
    }

    @action filterUniqueItems(items: Item[]) {
        const seen = new Map<string, boolean>();
        return items.filter(item => {
            const key = `${item.name}${item.url}${item.source}`;
            return seen.has(key) ? false : seen.set(key, true);
        });
    }

    @action handleCategoryChange(category: string, items: Item[]) {
        this.selectedCategory = category;
        if (category === "") {
            this.filteredItems = items; // Show all items if no category is selected
        } else {
            this.filteredItems = items.filter(item => item.category === category);
        }
    }
}

// Export a singleton instance of the store
const feedViewStore = new FeedViewStore();

export default feedViewStore;