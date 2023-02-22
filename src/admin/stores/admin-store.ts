import { createContext } from 'react';
import { TriplanTinderApiService } from '../services/triplan-tinder-api-service';
import { action, computed, observable, runInAction } from 'mobx';
import { TinderItem } from '../helpers/interfaces';
import { AdminViewMode, ViewMode } from '../../utils/enums';

export class AdminStore {
	@observable hasInit: boolean = false;
	@observable placesByDestination = observable.map<string, TinderItem[]>({});

	@observable viewMode = AdminViewMode.list;

	// sidebar actions
	@observable isDownloading: boolean = false;
	@observable isFixing: boolean = false;
	@observable isScraping: boolean = false;

	constructor() {
		this.init();
	}

	// --- init -------------------------------------------------
	init() {
		TriplanTinderApiService.getPlacesByDestination().then((results) => {
			runInAction(() => {
				this.placesByDestination = observable.map<string, TinderItem[]>(results?.data);
				this.hasInit = true;
			});
		});
	}

	// --- computed ---------------------------------------------
	@computed
	get allItems(): TinderItem[] {
		return Array.from(this.placesByDestination.values())
			.map((x) => x.filter(Boolean))
			.flat();
	}

	@computed
	get verifiedActivities(): TinderItem[] {
		return this.allItems.filter((i) => i.isVerified);
	}

	@computed
	get unverifiedActivities(): TinderItem[] {
		return this.allItems.filter((i) => !i.isVerified);
	}

	// --- actions ----------------------------------------------
	@action
	updateItem(id: number, newItem: TinderItem) {
		const item = this.findItemById(id);
		const destination = item?.destination;
		if (item && destination) {
			const result = this.placesByDestination.get(destination);
			if (result) {
				const existingPlaces = Array.from(result);
				const newPlaces = [...existingPlaces.filter((i) => i.id !== id), newItem];
				this.placesByDestination.set(destination, newPlaces);
			}
		}
	}

	@action
	deleteItem(id: number) {
		const item = this.findItemById(id);
		const destination = item?.destination;
		if (item && destination) {
			const result = this.placesByDestination.get(destination);

			if (result) {
				const existingPlaces = Array.from(result);
				const newPlaces = existingPlaces.filter((i) => i.id !== id);
				this.placesByDestination.set(destination, newPlaces);
			}
		}
	}

	@action
	setIsDownloading(isDownloading: boolean) {
		this.isDownloading = isDownloading;
	}

	@action
	setIsFixing(isFixing: boolean) {
		this.isFixing = isFixing;
	}

	@action
	setIsScraping(isScraping: boolean) {
		this.isScraping = isScraping;
	}

	@action
	setViewMode(newVideMode: AdminViewMode) {
		this.viewMode = newVideMode;
	}

	// ----------------------------------------------------------
	findItemById(id: number): TinderItem | undefined {
		return this.allItems.find((i) => i.id === id);
	}
}
export const adminStoreContext = createContext(new AdminStore());
