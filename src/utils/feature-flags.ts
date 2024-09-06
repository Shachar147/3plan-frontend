import { getCurrentUsername } from './utils';
import {newDesignRootPath} from "../v2/utils/consts";

export const FeatureFlagsService = {
    isNewDesignEnabled: (skipUrlCheck: boolean = false) => {
        return true;

        const username = getCurrentUsername();
        // if (!username?.length){
        //     return localStorage.getItem("triplan-new-design-enabled").toString() == "1";
        // }
        const isEnabled = (username === 'Shachar' || username.includes("Test")) && (skipUrlCheck || localStorage.getItem("triplan-new-design-enabled").toString() == "1" || window.location.href.includes(newDesignRootPath));
        // if (isEnabled) {
        //     localStorage.setItem("triplan-new-design-enabled", "1");
        // }

        return isEnabled;
    },
};
