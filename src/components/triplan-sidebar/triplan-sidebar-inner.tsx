import {observer} from "mobx-react";
import React, {useContext} from "react";
import {eventStoreContext} from "../../stores/events-store";
import {TripDataSource} from "../../utils/enums";
import {DBService} from "../../services/data-handlers/db-service";
import useAsyncMemo from "../../custom-hooks/use-async-memo";
import TranslateService from "../../services/translate-service";
import ReactModalService from "../../services/react-modal-service";
import {getCurrentUsername,} from "../../utils/utils";
import {TripActions} from "../../utils/interfaces";
import {
    addHours,
    formatDate,
    formatTimeFromISODateString,
    getOffsetInHours,
} from "../../utils/time-utils";
import LogHistoryService from "../../services/data-handlers/log-history-service";
import {TriplanSidebarProps} from "./triplan-sidebar";
import './triplan-sidebar-inner.scss';
import TriplanSidebarCollapsableMenu from "./sidebar-collapsable-menu/triplan-sidebar-collapsable-menu";
import TriplanSidebarMainButtons from "./sidebar-main-buttons/triplan-sidebar-main-buttons";

// @ts-ignore
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import {TriplanSidebarDivider} from "./triplan-sidebar-divider";
import TriplanSidebarCategories from "./sidebar-categories/triplan-sidebar-categories";
import TriplanSidebarShareTripPlaceholder
    from "./sidebar-share-trip-placeholder/triplan-sidebar-share-trip-placeholder";
import TriplanSidebarHistory from "./sidebar-history/triplan-sidebar-history";

const TriplanSidebarInner = (props: TriplanSidebarProps) => {
    const eventStore = useContext(eventStoreContext);

    return (
        <div>
            <TriplanSidebarMainButtons />
            <div>
                <TriplanSidebarCollapsableMenu {...props} />
                <TriplanSidebarDivider />
                <TriplanSidebarCategories {...props} />
                {!eventStore.isSharedTrip && (
                    <>
                        <TriplanSidebarDivider />
                        <TriplanSidebarShareTripPlaceholder />
                    </>
                )}
                <TriplanSidebarHistory renderPrefix={() => <TriplanSidebarDivider />} />
            </div>
        </div>
    )
};

export default observer(TriplanSidebarInner);
