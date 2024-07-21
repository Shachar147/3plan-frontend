export const ENDPOINTS = {
    poi: {
        count: '/poi/count/by-source',
        local: '/poi/by-destination',
        external: {
            getyourguide: '/poi/external-source/getyourguide',
            tripadvisor: '/poi/external-source/tripadvisor',
            dubaicoil: '/poi/external-source/dubaicoil'
        },
        feed: '/poi/feed/',
        searchSuggestions: '/poi/search-suggestions'
    },
    savedCollections: {
        get: '/saved-collections/',
        upsert: '/saved-collections/upsert/',
        deleteItem: '/saved-collections-item/'
    }
}