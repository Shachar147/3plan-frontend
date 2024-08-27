import TranslateService from "../../../services/translate-service";
import Button, {ButtonFlavor} from "../../common/button/button";
import ReactModalService from "../../../services/react-modal-service";
import TriplanSidebarShareTripButton from "../sidebar-share-trip-button/triplan-sidebar-share-trip-button";
import React, {useContext} from "react";
import {observer} from "mobx-react";
import {eventStoreContext} from "../../../stores/events-store";
import {TripDataSource} from "../../../utils/enums";
import {DBService} from "../../../services/data-handlers/db-service";
import useAsyncMemo from "../../../custom-hooks/use-async-memo";

const TriplanSidebarShareTripPlaceholder = () => {
    const eventStore = useContext(eventStoreContext);

    const fetchCollaborators = async (): Promise<any[]> => {
        if (eventStore.dataService.getDataSourceName() != TripDataSource.DB) {
            return [];
        }
        const dbService: DBService = (eventStore.dataService as DBService)
        return await dbService.getCollaborators(eventStore);
    };

    const { data: collaborators } = useAsyncMemo<any[]>(
        () => fetchCollaborators(),
        [eventStore.reloadCollaboratorsCounter]
    );

    const renderCollaborator = (collaborator: any) => {
        return (
            <div className="triplan-collaborator space-between padding-inline-8">
                <div className="flex-row gap-8 align-items-center">
                    <i className="fa fa-users" aria-hidden="true" />
                    <div className="collaborator-name">{collaborator.username}</div>
                    <div className="collaborator-permissions-icons flex-row gap-8 align-items-center">
                        {collaborator.canRead && (
                            <i
                                className="fa fa-eye"
                                title={TranslateService.translate(eventStore, 'CAN_VIEW')}
                                aria-hidden="true"
                            />
                        )}
                        {collaborator.canWrite && (
                            <i
                                className="fa fa-pencil"
                                title={TranslateService.translate(eventStore, 'CAN_EDIT')}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                </div>
                <div className="collaborator-permissions flex-row gap-8">
                    <Button
                        flavor={ButtonFlavor.link}
                        text={TranslateService.translate(eventStore, 'CHANGE_PERMISSIONS')}
                        onClick={() => ReactModalService.openChangeCollaboratorPermissionsModal(eventStore, collaborator)}
                    />
                    <Button
                        flavor={ButtonFlavor.link}
                        text="X"
                        onClick={() => ReactModalService.openDeleteCollaboratorPermissionsModal(eventStore, collaborator)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex-col align-items-center justify-content-center">
            <b>{TranslateService.translate(eventStore, 'SHARE_TRIP.DESCRIPTION.TITLE')}</b>
            <span className="white-space-pre-line text-align-center width-100-percents opacity-0-5">
                {TranslateService.translate(eventStore, 'SHARE_TRIP.DESCRIPTION.CONTENT')}
            </span>
            <TriplanSidebarShareTripButton isMoveAble={false} className="width-100-percents" />
            {!!collaborators?.length && (
                <div className="flex-col align-items-center justify-content-center margin-block-10 width-100-percents">
                    <b>{TranslateService.translate(eventStore, 'COLLABORATORS.TITLE')}</b>
                    <div className="flex-col gap-4 width-100-percents justify-content-center margin-top-10">
                        {collaborators?.map(renderCollaborator)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(TriplanSidebarShareTripPlaceholder)