import { getCurrentUsername } from './utils';
import {newDesignRootPath} from "../v2/utils/consts";

export const FeatureFlagsService = {
    isNewDesignEnabled: () => {
        const username = getCurrentUsername();
        return username === 'Shachar' && window.location.href.includes(newDesignRootPath);
    },
};
