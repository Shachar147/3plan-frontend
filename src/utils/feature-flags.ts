import { getCurrentUsername } from './utils';

export const FeatureFlagsService = {
    isNewDesignEnabled: () => {
        const username = getCurrentUsername();
        return username === 'Shachar';
    },
};
