import {createContext} from "react";
import {action, observable} from "mobx";

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
}

export const rootStoreContext = createContext(new RootStore());
