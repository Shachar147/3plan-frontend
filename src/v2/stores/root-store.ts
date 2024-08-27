import {createContext} from "react";
import {action, observable} from "mobx";
import {mainPageContentTabLsKey, myTripsTabId, newDesignRootPath} from "../utils/consts";

export class RootStore {
    @observable headerReRenderCounter = 0;
    @observable tabMenuReRenderCounter = 0;

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
}

export const rootStoreContext = createContext(new RootStore());
