import {getClasses, getEventTitle} from "../../../utils/utils";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import {eventStoreContext} from "../../../stores/events-store";

function TripTemplateBanner({ baseClass, coverImage, isShimmering }: { baseClass: string, coverImage: string, isShimmering?: boolean }){
    const eventStore = useContext(eventStoreContext);
    return (
        <div className={getClasses("trip-template-page-cover", isShimmering && 'shimmer-animation')} style={{
            backgroundImage: isShimmering ? undefined : `url('${coverImage}')`,
        }}>
            <div className={`${baseClass}-content-bottom-shadow`}>
                {getEventTitle({ title: eventStore.tripName }, eventStore, true)}
            </div>
        </div>
    );
}

export default observer(TripTemplateBanner);