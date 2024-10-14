
import {createContext} from "react";
import {action, computed, observable, runInAction} from "mobx";
import {getParameterFromHash} from "../utils/utils";
import {SearchSuggestion} from "../components/search-component/triplan-search-v2";
import TranslateService from "../../services/translate-service";

const AUTO_COMPLETE_MIN_CHARACTERS = 3;

export class SearchStore {
    @observable _searchQuery: string = "";
    @observable searchQuery: string = "";
    @observable suggestions: SearchSuggestion[] = [];
    @observable showSuggestions: boolean = false;
    @observable chosenName = "";
    @observable rerenderCounter = 0;
    @observable searchValueFromHash: boolean = false;

    constructor() {
        runInAction(() => {
            this._searchQuery = getParameterFromHash('q') ?? "";
            this.searchQuery = getParameterFromHash('q') ?? "";
            this.searchValueFromHash = (getParameterFromHash('q')?.length ?? 0) > 0;
        });

        this._setSearchQuery = this._setSearchQuery.bind(this);
        this.setSearchQuery = this.setSearchQuery.bind(this);
        this.setSuggestions = this.setSuggestions.bind(this);
        this.setShowSuggestions = this.setShowSuggestions.bind(this);
        this.setChosenItem = this.setChosenItem.bind(this);
        this.setReRenderCounter = this.setReRenderCounter.bind(this);
        this.setSearchValueFromHash = this.setSearchValueFromHash.bind(this);
    }

    @action
    _setSearchQuery(value: string) {
        this._searchQuery = value;
    }

    @action
    setSearchQuery(value: string) {
        this.searchQuery = value;
    }

    @action
    setSuggestions(suggestions: SearchSuggestion[]) {
        this.suggestions = suggestions;
    }

    @action
    setShowSuggestions(value: boolean){
        this.showSuggestions = value;
    }

    @action
    setChosenItem(value: string){
        this.chosenName = value;
    }

    @action
    setReRenderCounter(value: number){
        this.rerenderCounter = value;
    }

    @action
    setSearchValueFromHash(value: boolean){
        this.searchValueFromHash = value;
    }

    @computed
    get shouldShowSuggestions(): boolean{
        const haveSuggestions = this.suggestions.length > 0 && !this.suggestions[0].name.includes("Loading")&& !this.suggestions[0].name.includes("המתינו");

        return !!(this.suggestions.length &&
               this.searchQuery.length >= AUTO_COMPLETE_MIN_CHARACTERS &&
               (this.chosenName == "" || !this.searchQuery.includes(this.chosenName) || this.searchQuery.trim().length > this.chosenName.length) &&
               (!this.chosenName.includes(this.searchQuery)) &&
               this.showSuggestions &&
               haveSuggestions &&
               !this.searchValueFromHash);
    }
}

export const searchStoreContext = createContext(new SearchStore());
