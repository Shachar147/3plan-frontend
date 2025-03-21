import { createContext } from 'react';
import { action, computed, observable, runInAction } from 'mobx';
import { IPointOfInterest, SavedCollection } from '../utils/interfaces';
import FeedViewApiService from '../services/feed-view-api-service';

export class FeedStore {
	@observable items: IPointOfInterest[] = [];
	@observable categories: string[] = [];
	@observable selectedCategory: string = '';
	@observable isLoading: boolean = true;
	@observable sourceCounts: Record<string, number[]> = {};
	@observable finishedSources: string[] = [];
	@observable reachedEndPerDestination: Record<string, boolean> = {};
	@observable reachedEndForDestinations: boolean = false;
	@observable allReachedEnd: boolean = false;
	@observable savedCollections: SavedCollection[] = [];
	@observable reRenderCounter = 0;

	@observable systemRecommendations: IPointOfInterest[] = [];

	@observable activeTab: string = 'default';

	@action
	getSavedCollections = async () => {
		new FeedViewApiService().getSavedCollections().then((response) => {
			runInAction(() => {
				this.savedCollections = [...response];
				this.reRenderCounter += 1;
			});
		});
	};

	@action
	setItems = (items: any[]) => {
		this.items = items;
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

	@action
	setActiveTab = (activeTab: string) => {
		this.activeTab = activeTab;
	};

	@computed
	get savedItems() {
		return this.savedCollections.map((c) => c.items).flat();
	}

	@computed
	get filteredItems() {
		if (this.selectedCategory == '') {
			return this.items;
		}
		return this.items.filter((item) => item.category === this.selectedCategory);
	}
}

export const feedStoreContext = createContext(new FeedStore());
