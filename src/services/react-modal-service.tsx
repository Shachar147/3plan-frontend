import {EventStore} from "../stores/events-store";
import TranslateService from "./translate-service";
import React from "react";
import {runInAction} from "mobx";
import IconSelector from "../components/icon-selector/icon-selector";
import {getClasses} from "../utils/utils";

import Alert from "sweetalert2";

const ReactModalRenderHelper = {
    renderInputWithLabel: (eventStore:EventStore, textKey: string, input: JSX.Element, className?: string) => {
        return (
            <div className={getClasses(["input-with-label flex-row gap-30 align-items-center"], className)}>
                <label>{TranslateService.translate(eventStore, textKey)}</label>
                {input}
            </div>
        )
    }
}

const getDefaultSettings = (eventStore: EventStore) => {
    return {
        show: true,
        showCancel: true,
        cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
        confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
        confirmBtnCssClass: 'primary-button',
        cancelBtnCssClass: 'link-button'
    }
}

const ReactModalService = {
    openAddCategoryModal: (eventStore: EventStore) => {

        const title = TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.TITLE.ADD_CATEGORY');

        const onConfirm = () => {

            // @ts-ignore
            const newIcon = eventStore.modalValues.icon;

            // @ts-ignore
            const newName = eventStore.modalValues.name;

            let isOk = true;

            // validate not already exist
            if (!newName || newName.length === 0) {
                isOk = false;
                Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.CATEGORY_NAME_CANT_BE_EMPTY"), "error");
                return;
            }
            else if (eventStore.categories.find((c) => c.title === newName)) {
                isOk = false;
                Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST"), "error");
                return;
            }

            if (isOk) {
                runInAction(() => {

                    eventStore.setCategories([
                        ...eventStore.categories,
                        {
                            id: eventStore.createCategoryId(),
                            title: newName,
                            icon: newIcon
                        },
                    ]);

                    eventStore.modalSettings.show = false;
                    eventStore.modalValues = {};
                });

                Alert.fire(TranslateService.translate(eventStore, "MODALS.CREATE.TITLE"), TranslateService.translate(eventStore, "MODALS.CREATE_CATEGORY.CONTENT"), "success");
            }
        }

        const onCancel = () => {
            runInAction(() =>{
                eventStore.modalSettings.show = false;
                eventStore.modalValues = {};
            });
        }

        const content = (
            <div className={"flex-col gap-20 align-layout-direction react-modal"}>
                {ReactModalRenderHelper.renderInputWithLabel(
                    eventStore,
                    'MODALS.ICON',
                    <IconSelector
                        id={"new-icon"}
                        value={eventStore.modalValues?.icon}
                        onChange={(data) => eventStore.modalValues.icon = data.label }
                    />,
                    'border-top-gray'
                )}
                {ReactModalRenderHelper.renderInputWithLabel(
                    eventStore,
                    'MODALS.TITLE',
                    <input
                        id="new-name"
                        className={"textInput"}
                        type="text"
                        value={eventStore.modalValues?.name}
                        onChange={(e) => eventStore.modalValues.name = e.target.value}
                        placeholder={TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER')}
                    />,
                    'border-top-gray border-bottom-gray padding-bottom-20'
                )}
            </div>
        )

        return {
            ...getDefaultSettings(eventStore),
            title,
            onConfirm,
            onCancel,
            content,
            type: 'controlled',
            dependencies: [eventStore.modalValues],
        }
     },

}

export default ReactModalService;