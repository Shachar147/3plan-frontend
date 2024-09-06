import { getCurrentUsername } from './utils';
import {newDesignRootPath} from "../v2/utils/consts";

export const FeatureFlagsService = {
    isNewDesignEnabled: (skipUrlCheck: boolean = false) => {
        const username = getCurrentUsername();
        if (!username){
            return localStorage.getItem("triplan-new-design-enabled") == "1";
        }
        const isEnabled = (username === 'Shachar' || username.includes("Test")) && (skipUrlCheck || window.location.href.includes(newDesignRootPath));
        if (isEnabled) {
            localStorage.setItem("triplan-new-design-enabled", "1");
        }
    },
};
