import {EventStore} from "../stores/events-store";
import TranslateService from "./translate-service";
import React from "react";
import {runInAction} from "mobx";
import IconSelector from "../components/icon-selector/icon-selector";
import {getClasses} from "../utils/utils";

import Alert from "sweetalert2";
import {getLocalStorageKeys, LS_CUSTOM_DATE_RANGE} from "../utils/defaults";
import { Observer } from "mobx-react";

const ReactModalRenderHelper = {
    renderInputWithLabel: (eventStore:EventStore, textKey: string, input: JSX.Element, className?: string) => {
        return (
            <div className={getClasses(["input-with-label flex-row gap-30 align-items-center"], className)}>
                <label>{TranslateService.translate(eventStore, textKey)}</label>
                {input}
            </div>
        )
    },
    renderInput: (eventStore: EventStore, modalValueName: string, extra: { placeholderKey?: string, id?:string}) => {
        return (
            <input
                id={extra.id}
                className={"textInput"}
                type="text"
                value={eventStore.modalValues[modalValueName]}
                onChange={(e) => {
                    runInAction(() => {
                        eventStore.modalValues[modalValueName] = e.target.value;
                    })
                }}
                placeholder={extra.placeholderKey ? TranslateService.translate(eventStore, extra.placeholderKey) : undefined}
            />
        );
    },
}

const getDefaultSettings = (eventStore: EventStore) => {
    return {
        show: true,
        showCancel: true,
        cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
        confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
        confirmBtnCssClass: 'primary-button',
        cancelBtnCssClass: 'link-button',
        dependencies: [eventStore.modalSettings, eventStore.modalValues],
        customClass: 'triplan-react-modal',
        reverseButtons: eventStore.getCurrentDirection() === 'rtl',
        onCancel: () => {
            runInAction(() =>{
                eventStore.modalSettings.show = false;
                eventStore.modalValues = {};
            });
        }
    }
}

const ReactModalService = {
    _openModal: (eventStore: EventStore, settings: any) => {
        eventStore.setModalSettings(settings);
    },
    openAddCategoryModal: (eventStore: EventStore) => {

        const onConfirm = () => {

            // @ts-ignore
            const newIcon = eventStore.modalValues.icon?.label;

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

        const content = <Observer>{() => (
            <div className={"flex-col gap-20 align-layout-direction react-modal"}>
                {ReactModalRenderHelper.renderInputWithLabel(
                    eventStore,
                    'MODALS.ICON',
                    <IconSelector
                        id={"new-icon"}
                        value={eventStore.modalValues?.icon}
                        onChange={(data) => eventStore.modalValues.icon = data }
                    />,
                    'border-top-gray'
                )}
                {ReactModalRenderHelper.renderInputWithLabel(
                    eventStore,
                    'MODALS.TITLE',
                    ReactModalRenderHelper.renderInput(
                        eventStore,
                        'name',
                        {
                            placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
                            id: 'new-name'
                        }
                    ),
                    'border-top-gray border-bottom-gray padding-bottom-20'
                )}
            </div>
        )}</Observer>

        ReactModalService._openModal(eventStore, {
            ...getDefaultSettings(eventStore),
            title: TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.TITLE.ADD_CATEGORY'),
            type: 'controlled',
            onConfirm,
            content,
        });
     },
    openEditTripModal: (eventStore: EventStore, LSTripName: string) => {
        const tripName = LSTripName !== "" ? LSTripName.replaceAll("-"," ") : "";
        const title = `${TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}: ${tripName}`

        const onConfirm = () => {

            // @ts-ignore
            const newName = eventStore.modalValues.name;

            let isOk = true;

            const oldName = tripName;
            if (oldName !== newName) {
                // validate title not already exist
                if(Object.keys(localStorage)
                    .filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1)
                    .map((x) => x.replace(LS_CUSTOM_DATE_RANGE + "-",""))
                    .filter((LSTripName) => {
                        LSTripName = LSTripName === LS_CUSTOM_DATE_RANGE ? "" : LSTripName;
                        const _tripName = LSTripName !== "" ? LSTripName.replaceAll("-", " ") : "";
                        return _tripName === newName
                    }).length > 0) {
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.TRIP_NAME_ALREADY_EXIST"), "error");
                    isOk = false;
                    return;
                }
            }

            if (isOk) {

                const newLSTripName = newName.replaceAll(" ","-");

                const lsKeys = getLocalStorageKeys();
                const separator = (LSTripName === "") ? "" : "-";
                const separator2 = (newLSTripName === "") ? "" : "-";
                Object.values(lsKeys).forEach((localStorageKey) => {
                    const key = [localStorageKey,LSTripName].join(separator);
                    const newKey = [localStorageKey,newLSTripName].join(separator2);
                    const value = localStorage.getItem(key);
                    if (value != undefined) {
                        localStorage.setItem(newKey, value);
                        localStorage.removeItem(key);
                    }
                });

                runInAction(() => {
                    eventStore.modalSettings.show = false;
                    eventStore.modalValues = {};
                });

                Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, "MODALS.UPDATED_TRIP.CONTENT"), "success");

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }

        const content = <Observer>{() => (
            <div className={"flex-col gap-20 align-layout-direction react-modal"}>
                {ReactModalRenderHelper.renderInputWithLabel(
                    eventStore,
                    'MODALS.TITLE',
                    ReactModalRenderHelper.renderInput(
                        eventStore,
                        'name',
                        {
                            placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
                            id: 'new-name',
                        }
                    ),
                    'border-top-gray border-bottom-gray padding-bottom-20'
                )}
            </div>
        )}</Observer>

        ReactModalService._openModal(eventStore, {
            ...getDefaultSettings(eventStore),
            title,
            onConfirm,
            content,
            type: 'controlled',
        });
    },
    openDeleteTripModal: (eventStore: EventStore, LSTripName: string) => {
        const tripName = LSTripName !== "" ? LSTripName.replaceAll("-"," ") : "";
        ReactModalService._openModal(eventStore, {
            ...getDefaultSettings(eventStore),
            title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${tripName}`,
            content: (
                <div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, 'MODALS.DELETE_TRIP.CONTENT') }} />
            ),
            cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
            confirmBtnCssClass: 'primary-button red',
            onConfirm: () => {
                const lsKeys = getLocalStorageKeys();
                const separator = (LSTripName === "") ? "" : "-";
                Object.values(lsKeys).forEach((localStorageKey) => {
                    const key = [localStorageKey,LSTripName].join(separator);
                    localStorage.removeItem(key);
                });
                window.location.reload();
            }
        })
    },
}

export default ReactModalService;