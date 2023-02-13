import { createContext } from 'react';
import { TriplanTinderApiService } from '../services/triplan-tinder-api-service';
import { observable, runInAction } from 'mobx';
import { TinderItem } from '../helpers/interfaces';

export class AdminStore {
	@observable hasInit: boolean = false;
	@observable placesByDestination = observable.map<string, TinderItem[]>({});

	constructor() {
		this.init();
	}

	init() {
		TriplanTinderApiService.getPlacesByDestination().then((results) => {
			runInAction(() => {
				this.placesByDestination = observable.map<string, TinderItem[]>(results?.data);
				this.hasInit = true;
			});
		});
	}
}
export const adminStoreContext = createContext(new AdminStore());
