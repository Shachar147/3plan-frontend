import {createContext} from "react";
import {action, observable} from "mobx";
import {loginPageContentTabLsKey, mainPageContentTabLsKey, myTripsTabId, newDesignRootPath} from "../utils/consts";
import {CityOrCountry} from "../components/destination-selector/destination-selector";

export class RootStore {
    @observable headerReRenderCounter = 0;
    @observable tabMenuReRenderCounter = 0;

    citiesAndCountries: CityOrCountry[] = [];

    @action
    triggerHeaderReRender() {
        this.headerReRenderCounter += 1;
    }

    @action
    triggerTabsReRender() {
        this.tabMenuReRenderCounter += 1;
    }

    @action
    navigateToTab(tabId: string) {
        localStorage.setItem(mainPageContentTabLsKey, tabId);
        window.location.href = `${newDesignRootPath}#${tabId}`;
    }

    @action
    navigateToTabOnLoginPage(tabId: string) {
        localStorage.setItem(loginPageContentTabLsKey, tabId);
        window.location.href = `${newDesignRootPath}/login#${tabId}`;
        this.triggerTabsReRender();
        this.triggerHeaderReRender();
    }
}

export const rootStoreContext = createContext(new RootStore());
