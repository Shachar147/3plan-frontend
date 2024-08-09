export const endpoints: Record<string, any> = {
    v1: {
        admin: {
          statistics: '/admin-statistics'
        },
        tinderPlacesFinder: {
            placesByDestination: '/item/by-destination',
            downloadMedia: '/item/download-media',
            fixItems: '/item/fix',
            createInstagramItems: '/instagram/json',
            updateItemById: (itemId: number) => `/item/${itemId}`,
            deleteItemById: (itemId: number) => `/item/${itemId}`,
        },
        trips: {
            createTrip: '/trip', 
            duplicateTrip: '/trip/duplicate',
            getAllTrips: '/trip/',
            getAllTripsShort: '/trip/short',

            updateTripByName: (tripName: string) => `/trip/name/${tripName}`,
            hideTripByName: (tripName: string) => `/trip/hide/name/${tripName}`,
            unhideTripByName: (tripName: string) => `/trip/unhide/name/${tripName}`,
            lockTripByName: (tripName: string) => `/trip/lock/name/${tripName}`,
            unlockTripByName: (tripName: string) => `/trip/unlock/name/${tripName}`,
            deleteTripByName: (tripName: string) => `/trip/name/${tripName}`,
            getTripByName: (tripName: string) => `/trip/name/${tripName}`,
        },
        sharedTrips: {
            createInviteLink: '/shared-trips/create-invite-link',
            useInviteLink: '/shared-trips/use-invite-link',
            deleteCollaboratorPermissions: (permissionsId: any) => `/shared-trips/${permissionsId}`,
            updateCollaboratorPermissions: (permissionsId: any) => `/shared-trips/${permissionsId}`,
            getTripCollaborators: (tripName: string) => `/shared-trips/collaborators/name/${tripName}`
        },
        history: {
            logHistory: '/history',
            getHistoryById: (tripId: number, limit: number) => `/history/by-trip/${tripId}/${limit}`
        },
        tasks: {
            createTask: `/todolist/task`,
            getTripTasks: (tripId: number) => `/todolist/task/${tripId}`,
            updateTaskStatus: (taskId: number) => `/todolist/task/${taskId}`,
        },
        backgroundTasks: {
            getTask: (taskId: any) => `/task/${taskId}`,
        },
        auth: {
            isAdmin: '/auth/isAdmin',
            signIn: '/auth/signin'
        },
        distance: {
            calculateDistances: '/distance',
            getPlacesNearby: (coordinateString: string) => `/distance/near/${coordinateString}`,
            getDistanceResults: (tripName: string) => `/distance/trip/${tripName}`
        },
        biEvents: '/bi-events'
    },
    v2: {
        poi: {
            getPoiById: (poiId: number) => `/poi/${poiId}`,
            count: '/poi/count/by-source',
            local: (destination: string, page: number) => `/poi/by-destination?destination=${destination}&page=${page}`,
            external: {
                getyourguide: (destination: string, page: number) => `/poi/external-source/getyourguide?destination=${destination}&page=${page}`,
                tripadvisor: (destination: string, page: number) => `/poi/external-source/tripadvisor?destination=${destination}&page=${page}`,
                dubaicoil: (destination: string, page: number) => `/poi/external-source/dubaicoil?destination=${destination}&page=${page}`
            },
            feed: '/poi/feed/',
            searchSuggestions: '/poi/search-suggestions',
            freeTextSearch: (searchKeyword: string, page: number) => `/poi/search?q=${searchKeyword}&page=${page}`
        },
        savedCollections: {
            get: '/saved-collections/',
            upsert: '/saved-collections/upsert/',
            deleteItem: (cid: number, pid: number) => `/saved-collections-item/delete/cid/${cid}/pid/${pid}`
        },
        statistics: {
            summaries: '/admin-statistics/summaries'
        }
    },
}