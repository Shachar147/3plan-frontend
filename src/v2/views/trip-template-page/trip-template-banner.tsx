import {getEventTitle} from "../../../utils/utils";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import {eventStoreContext} from "../../../stores/events-store";

function TripTemplateBanner({ baseClass, coverImage }: { baseClass: string, coverImage: string }){
    const eventStore = useContext(eventStoreContext);
    return (
        <div className="trip-template-page-cover" style={{
            backgroundImage: `url('${coverImage}')`,
        }}>
            <div className={`${baseClass}-content-bottom-shadow`}>
                {getEventTitle({ title: eventStore.tripName }, eventStore, true)}
            </div>
        </div>
    );
}

export default observer(TripTemplateBanner);