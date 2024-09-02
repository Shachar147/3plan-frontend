import { getCurrentUsername } from './utils';
import {newDesignRootPath} from "../v2/utils/consts";

export const FeatureFlagsService = {
    isNewDesignEnabled: (skipUrlCheck: boolean = false) => {
        const username = getCurrentUsername();
        return (username === 'Shachar' || username.includes("Test")) && (skipUrlCheck || window.location.href.includes(newDesignRootPath));
    },
};
