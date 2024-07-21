import React, {useContext} from 'react';
import {observer} from "mobx-react";
import {feedStoreContext} from "../../stores/feed-view-store";
import {getClasses} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import {SavedCollection} from "../../utils/interfaces";
import PointOfInterest from "../../components/point-of-interest/point-of-interest";

function SavedCollectionsTab(){
    const eventStore = useContext(eventStoreContext);
    const feedStore = useContext(feedStoreContext);

    function renderCollection(collection: SavedCollection){
        const classList = getClasses("align-items-center", eventStore.isHebrew ? 'flex-row-reverse' : "flex-row");

        let item: any = collection.items?.[0]?.fullDetails ?? {};

        item = {
            ...item,
            collectionId: collection.id,
            images: collection.items?.map((i) => i.fullDetails.images?.[0]),
            name: collection.name,
            destination: collection.destination,
            category: "SAVED_COLLECTION_PREFIX",
            rate: undefined,
            isSystemRecommendation: undefined,
            location: undefined,
            more_info: undefined,
            source: undefined,
            description: TranslateService.translate(eventStore, 'SAVED_COLLECTION.ITEMS', {X: collection.items.length})
        }

        return (
            <div key={item.id} className={classList}>
                <PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed savedCollection />
            </div>
        );
    }

    function renderNoSavedCollectionsPlaceholder(){
        return TranslateService.translate(eventStore, 'NO_SAVED_COLLECTIONS');
    }

    return (
        <div className="flex-row justify-content-center flex-wrap-wrap align-items-start" key={feedStore.savedCollections.length}>
            {feedStore.savedCollections.length == 0 ? renderNoSavedCollectionsPlaceholder() : feedStore.savedCollections.map(renderCollection)}
        </div>
    )

}
export default observer(SavedCollectionsTab)