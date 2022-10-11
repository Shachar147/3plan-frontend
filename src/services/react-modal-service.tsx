import {EventStore} from "../stores/events-store";
import TranslateService from "./translate-service";
import React from "react";
import {runInAction} from "mobx";
import IconSelector from "../components/icon-selector/icon-selector";
import {getClasses, ucfirst} from "../utils/utils";

import Alert from "sweetalert2";
import {defaultTimedEventDuration, getLocalStorageKeys, LS_CUSTOM_DATE_RANGE} from "../utils/defaults";
import { Observer } from "mobx-react";
import {LocationData, SidebarEvent, TriPlanCategory, WeeklyOpeningHoursData} from "../utils/interfaces";
import {TriplanEventPreferredTime, TriplanPriority} from "../utils/enums";
import {convertMsToHM} from "../utils/time-utils";
import Select from "react-select";
import {SELECT_STYLE} from "../utils/ui-utils";

const ReactModalRenderHelper = {
    renderInputWithLabel: (eventStore:EventStore, textKey: string, input: JSX.Element, className?: string) => {
        return (
            <div className={getClasses(["input-with-label flex-row gap-30 align-items-center"], className)}>
                <label>{TranslateService.translate(eventStore, textKey)}</label>
                {input}
            </div>
        )
    },
    renderTextInput: (eventStore: EventStore, modalValueName: string, extra: {
        placeholderKey?: string, placeholder?: string, id?:string ,autoComplete?:string, className?: string,
        onKeyUp?: () => any, onClick?: () => any
    }) => {
        return (
            <input
                id={extra.id}
                className={getClasses(["textInput"], extra.className)}
                type="text"
                value={eventStore.modalValues[modalValueName]}
                onClick={extra.onClick && extra.onClick()}
                onKeyUp={extra.onKeyUp && extra.onKeyUp()}
                onChange={(e) => {
                    runInAction(() => {
                        eventStore.modalValues[modalValueName] = e.target.value;
                    })
                }}
                placeholder={
                    extra.placeholder ? extra.placeholder :
                    extra.placeholderKey ? TranslateService.translate(eventStore, extra.placeholderKey) :
                    undefined
                }
                autoComplete={extra.autoComplete}
            />
        );
    },
    renderTextAreaInput: (eventStore: EventStore, modalValueName: string, extra: { rows?: number, placeholderKey?: string, placeholder?: string, id?:string}) => {
        return (
            <textarea
                rows={extra.rows || 3}
                id={extra.id}
                className={"textAreaInput"}
                onChange={(e) => {
                    runInAction(() => {
                        eventStore.modalValues[modalValueName] = e.target.value;
                    })
                }}
                placeholder={
                    extra.placeholder ? extra.placeholder :
                        extra.placeholderKey ? TranslateService.translate(eventStore, extra.placeholderKey) :
                            undefined
                }
            >
                {eventStore.modalValues[modalValueName]}
            </textarea>
        );
    },
    renderSelectInput: (eventStore: EventStore, modalValueName: string, extra: { options: any[], placeholderKey?: string, id?: string, name?: string }, wrapperClassName) => {
        return (
            <div className={getClasses('triplan-selector', wrapperClassName)}>
                <Select
                    isClearable
                    isSearchable
                    id={extra.id}
                    name={extra.name}
                    options={extra.options}
                    placeholder={extra.placeholderKey ? TranslateService.translate(eventStore, extra.placeholderKey) : undefined}
                    value={eventStore.modalValues[modalValueName]}
                    onChange={(data) => {
                        eventStore.modalValues[modalValueName] = data;
                    }}
                    maxMenuHeight={45 * 5}
                    styles={SELECT_STYLE}
                />
            </div>
        )
    },
    renderCategorySelector: (eventStore: EventStore, modalValueName: string, extra: { id?: string, name?: string }) => {

        const options = eventStore.categories
            .sort((a,b) => a.id - b.id)
            .map((x, index) => ({
               value: x.id,
               label: x.icon ? `${x.icon} ${x.title}` : x.title
            }));

        return (
            ReactModalRenderHelper.renderSelectInput(eventStore, modalValueName, {...extra, options, placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER'}, 'category-selector')
        )
    },
    renderPrioritySelector: (eventStore: EventStore, modalValueName: string, extra: { id?: string, name?: string }) => {

        const values = Object.keys(TriplanPriority);
        const keys = Object.values(TriplanPriority);

        const options = Object.values(TriplanPriority).filter((x) => !Number.isNaN(Number(x))).map((val, index) => ({
            value: values[index],
            label: ucfirst(TranslateService.translate(eventStore, keys[index].toString()))
        }))

        return (
            ReactModalRenderHelper.renderSelectInput(eventStore, modalValueName, {...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER'}, 'priority-selector')
        )
    },
    renderPrerferredTimeSelector: (eventStore: EventStore, modalValueName: string, extra: { id?: string, name?: string }) => {

        const values = Object.keys(TriplanEventPreferredTime);
        const keys = Object.values(TriplanEventPreferredTime);

        const options = Object.values(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x))).map((val, index) => ({
            value: values[index],
            label: ucfirst(TranslateService.translate(eventStore, keys[index].toString()))
        }))

        return ReactModalRenderHelper.renderSelectInput(eventStore, modalValueName, {...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER'}, 'preferred-time-selector');
    },
    renderRow: (eventStore: EventStore, row: { settings: any, textKey: string, className?: string }) => {
        let input;
        switch (row.settings.type){
            case 'text':
                input = ReactModalRenderHelper.renderTextInput(
                    eventStore, row.settings.modalValueName, row.settings.extra
                );
                break;
            case 'textarea':
                input = ReactModalRenderHelper.renderTextAreaInput(
                    eventStore, row.settings.modalValueName, row.settings.extra
                );
                break;
            case 'icon-selector':
                input = (
                    <IconSelector
                        id={row.settings?.extra?.id}
                        value={eventStore.modalValues ? eventStore.modalValues[row.settings.modalValueName] : undefined}
                        onChange={(data) => eventStore.modalValues[row.settings.modalValueName] = data }
                    />
                );
                break;
            case 'category-selector':
                input = ReactModalRenderHelper.renderCategorySelector(
                    eventStore, row.settings.modalValueName, row.settings.extra
                );
                break;
            case 'priority-selector':
                input = ReactModalRenderHelper.renderPrioritySelector(
                    eventStore, row.settings.modalValueName, row.settings.extra
                );
                break;
            case 'preferred-time-selector':
                input = ReactModalRenderHelper.renderPrerferredTimeSelector(
                    eventStore, row.settings.modalValueName, row.settings.extra
                );
                break;
            case 'opening-hours':
                // @ts-ignore
                input = (
                    <div dangerouslySetInnerHTML={{ __html: window.renderOpeningHours() }} />
                )
                break;
            default:
                break;
        }

        if (input) {
            return ReactModalRenderHelper.renderInputWithLabel(eventStore, row.textKey, input, row.className)
        }
    }
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
    _AlertMessage: (eventStore:EventStore, titleKey: string, contentKey: string, type: 'error' | 'success') => {
        Alert.fire(TranslateService.translate(eventStore, titleKey), TranslateService.translate(eventStore, contentKey), type);
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
                ReactModalService._AlertMessage(eventStore,"MODALS.ERROR.TITLE", "MODALS.ERROR.CATEGORY_NAME_CANT_BE_EMPTY", "error")
                return;
            }
            else if (eventStore.categories.find((c) => c.title === newName)) {
                isOk = false;
                ReactModalService._AlertMessage(eventStore,"MODALS.ERROR.TITLE", "MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST", "error");
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
                ReactModalService._AlertMessage(eventStore,"MODALS.CREATE.TITLE", "MODALS.CREATE_CATEGORY.CONTENT", "success");
            }
        }

        const inputs = [
            {
                settings: {
                    modalValueName: 'icon',
                    type: 'icon-selector',
                    extra: {
                        id: 'new-icon'
                    }
                },
                textKey: 'MODALS.ICON',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'name',
                    type: 'text',
                    extra: {
                        placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
                        id: 'new-name'
                    }
                },
                textKey: 'MODALS.TITLE',
                className: 'border-top-gray border-bottom-gray padding-bottom-20'
            }
        ]

        const content = <Observer>{() => (
            <div className={"flex-col gap-20 align-layout-direction react-modal"}>
                {
                    inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))
                }
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

                    ReactModalService._AlertMessage(eventStore,"MODALS.ERROR.TITLE", "MODALS.ERROR.TRIP_NAME_ALREADY_EXIST", "error");
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

                ReactModalService._AlertMessage(eventStore,"MODALS.UPDATED.TITLE", "MODALS.UPDATED_TRIP.CONTENT", "success");

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
                    ReactModalRenderHelper.renderTextInput(
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
    openAddSidebarEventModal: (eventStore: EventStore, categoryId?: number, initialData: any = {}) => {

        const handleAddSidebarEventResult = (eventStore: EventStore, result:any, categoryId?: number) => {
            if (!eventStore) return;

            // @ts-ignore
            let icon = document.getElementById("new-icon").value || "";

            // @ts-ignore
            const title = document.getElementById("new-name").value;

            // @ts-ignore
            let duration = document.getElementById("duration").value;

            // @ts-ignore
            let priority = document.getElementById("new-priority").value;

            // @ts-ignore
            let preferredTime = document.getElementById("new-preferred-time").value;

            // @ts-ignore
            const description = document.getElementById("new-description").value;

            if (categoryId == undefined){
                // @ts-ignore
                categoryId = document.getElementById("new-category").value;
            }

            // @ts-ignore
            const location = window.selectedLocation as LocationData;

            // @ts-ignore
            const openingHours = window.openingHours as WeeklyOpeningHoursData;

            if (!categoryId){
                return;
            }

            const currentEvent = {
                id: eventStore.createEventId(),
                title,
                icon,
                duration,
                priority: priority as TriplanPriority,
                preferredTime: preferredTime as TriplanEventPreferredTime,
                description,
                location,
                openingHours
            } as SidebarEvent;

            const isDurationValid = (
                duration.split(':').length == 2
                && !Number.isNaN(duration.split(':')[0])
                && !Number.isNaN(duration.split(':')[1])
                && parseInt(duration.split(':')[0]) >= 0
                && parseInt(duration.split(':')[1]) >= 0
                && (parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1])) > 0
            );
            if (!isDurationValid){
                console.error("duration is not valid");
                currentEvent.duration = defaultTimedEventDuration;
            } else {
                const hours = parseInt(duration.split(':')[0]);
                const minutes = parseInt(duration.split(':')[1]);
                const milliseconds = (minutes * 60000) + (hours * 3600000);
                duration = convertMsToHM(milliseconds);
                currentEvent.duration = duration;
            }

            if (result.value) {

                if (!title){
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.TITLE_CANNOT_BE_EMPTY"), "error");
                    return;
                }

                const existingSidebarEvents = {...eventStore.getSidebarEvents};
                existingSidebarEvents[categoryId] = existingSidebarEvents[categoryId] || [];
                existingSidebarEvents[categoryId].push(currentEvent);
                eventStore.setSidebarEvents(existingSidebarEvents);

                const allEventsEvent = {
                    ...currentEvent,
                    category: categoryId.toString()
                };
                eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), allEventsEvent]);

                Alert.fire(TranslateService.translate(eventStore, "MODALS.ADDED.TITLE"), TranslateService.translate(eventStore, "MODALS.ADDED.CONTENT"), "success");
            }
        }

        const onConfirm = () => {

        }

        const category =
            categoryId ? eventStore.categories.find((c) => c.id.toString() === categoryId.toString()) : undefined;

        const title = category ? `${TranslateService.translate(eventStore,"MODALS.ADD_EVENT_TO_CATEGORY.TITLE")}: ${category.title}` :
            TranslateService.translate(eventStore,"ADD_EVENT_MODAL.TITLE");

        eventStore.modalValues.duration = eventStore.modalValues.duration || defaultTimedEventDuration;

        // @ts-ignore
        const initLocation = window.initLocationPicker;

        // @ts-ignore
        const setManualLocation = window.setManualLocation;

        const inputs = [
            {
                settings: {
                    modalValueName: 'icon',
                    type: 'icon-selector',
                    extra: {
                        id: 'new-icon'
                    }
                },
                textKey: 'MODALS.ICON',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'name',
                    type: 'text',
                    extra: {
                        placeholder: `${TranslateService.translate(eventStore, 'MODALS.PLACEHOLDER.PREFIX')} ${TranslateService.translate(eventStore, 'MODALS.TITLE')}`
                    }
                },
                textKey: 'MODALS.TITLE',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'category',
                    type: 'category-selector',
                    extra: {
                        placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
                    }
                },
                textKey: 'MODALS.CATEGORY',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'description',
                    type: 'textarea',
                    extra: {
                        placeholderKey: 'MODALS.DESCRIPTION_PLACEHOLDER'
                    },
                },
                textKey: 'MODALS.DESCRIPTION',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'duration',
                    type: 'text',
                    extra: {
                        placeholder: `${TranslateService.translate(eventStore, 'MODALS.PLACEHOLDER.PREFIX')} ${TranslateService.translate(eventStore, 'MODALS.DURATION')}`
                    },
                },
                textKey: 'MODALS.DURATION',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'priority',
                    type: 'priority-selector',
                    extra: {}
                },
                textKey: 'MODALS.PRIORITY',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'preferred-time',
                    type: 'preferred-time-selector',
                    extra: {}
                },
                textKey: 'MODALS.PREFERRED_TIME',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'location',
                    type: 'text',
                    extra: {
                        className: 'location-input',
                        value: initialData.location,
                        onClick: initLocation,
                        onKeyUp: setManualLocation,
                        autoComplete: "off",
                        placeholder: `${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}`
                    }
                },
                textKey: 'MODALS.LOCATION',
                className: 'border-top-gray'
            },
            {
                settings: {
                    modalValueName: 'opening-hours',
                    type: 'opening-hours',
                },
                textKey: 'MODALS.OPENING_HOURS',
                className: 'border-top-gray'
            }
        ]

        inputs[inputs.length-1].className += ' border-bottom-gray padding-bottom-20';

        const content = <Observer>{() => (
            <div className={"flex-col gap-20 align-layout-direction react-modal"}>
                {
                    inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))
                }
            </div>
        )}</Observer>

      // <tr >
      // <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      // <td><strong>
      // ` + ModalServiceRenderHelper._renderPrioritySelect(eventStore, TriplanPriority.unset) + `
      // </strong></td>
      // </tr>
      // <tr >
      // <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      // <td><strong>
      // ` + ModalServiceRenderHelper._renderPreferredTime(eventStore, TriplanEventPreferredTime.unset) + `
      // </strong></td>
      // </tr>
      // ` + ModalServiceRenderHelper._renderLocationRow(eventStore, initialData.location) + `
      // ` + ModalServiceRenderHelper._renderOpeningHoursRow(eventStore, initialData.openingHours) + `
      // </table>
      // </div>`,
      //
      //       showCancelButton: true,
      //       cancelButtonColor: "#d33",
      //       confirmButtonColor: "#3085d6",
      //       confirmButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
      //       cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL')
      //   }).then(result => handleAddSidebarEventResult(eventStore, result, categoryId));

        ReactModalService._openModal(eventStore, {
            ...getDefaultSettings(eventStore),
            title,
            content,
            onConfirm
        })
    },
}

export default ReactModalService;