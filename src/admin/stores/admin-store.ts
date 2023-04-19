import { createContext } from 'react';
import { TriplanTinderApiService } from '../services/triplan-tinder-api-service';
import { action, computed, observable, runInAction } from 'mobx';
import { GetPlacesByDestinationResult, TinderItem } from '../helpers/interfaces';
import { AdminViewMode, ViewMode } from '../../utils/enums';
import DataServices from '../../services/data-handlers/data-handler-base';

export class AdminStore {
	@observable hasInit: boolean = false;
	@observable placesByDestination = observable.map<string, TinderItem[]>({});

	@observable viewMode = AdminViewMode.list;

	@observable searchValue: string = '';

	// sidebar actions
	@observable isDownloading: boolean = false;
	@observable isFixing: boolean = false;
	@observable isScraping: boolean = false;
	@observable userStats = observable.array<any[]>([]);

	constructor() {
		this.init();
	}

	// --- init -------------------------------------------------
	init() {
		const promises = [TriplanTinderApiService.getPlacesByDestination(), DataServices.DBService.getUserStats()];
		Promise.all(promises).then((results) => {
			// @ts-ignore
			const places: GetPlacesByDestinationResult = results[0];
			// @ts-ignore
			const stats: any[] = results[1];
			runInAction(() => {
				this.placesByDestination = observable.map<string, TinderItem[]>(places?.data);
				this.userStats = observable.array<any[]>(stats);
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

	@action
	setSearchValue(serachvalue: string) {
		this.searchValue = serachvalue;
	}

	// ----------------------------------------------------------
	findItemById(id: number): TinderItem | undefined {
		return this.allItems.find((i) => i.id === id);
	}
}
export const adminStoreContext = createContext(new AdminStore());
