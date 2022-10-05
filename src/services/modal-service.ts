import Alert from "sweetalert2";
import {EventStore} from "../stores/events-store";
import {
    addLineBreaks,
    ucfirst
} from "../utils/utils";
import {EventInput} from "@fullcalendar/react";
import {CalendarEvent, ImportEventsConfirmInfo, LocationData, SidebarEvent} from "../utils/interfaces";
import {defaultTimedEventDuration, getLocalStorageKeys, LS_CUSTOM_DATE_RANGE} from "../utils/defaults";
import {TriplanEventPreferredTime, TriplanPriority} from "../utils/enums";
import TranslateService from "./translate-service";
import ImportService from "./import-service";
import {
    convertMsToHM,
    formatDuration,
    getEventDueDate,
    getInputDateTimeValue,
    validateDuration
} from "../utils/time-utils";

const ModalService = {
    _categoriesIcons: (eventStore: EventStore): Record<number, string> => {
        const hash: Record<number, string> = {};
        eventStore.categories.forEach(x => hash[x.id] = x.icon);
        return hash;
    },
    _renderPrioritySelect: (eventStore: EventStore, priority?: TriplanPriority) => {
        const values = Object.keys(TriplanPriority);
        const keys = Object.values(TriplanPriority);

        const options = Object.values(TriplanPriority).filter((x) => !Number.isNaN(Number(x))).map((val, index) => {
                let isSelected = priority && priority.toString() === values[index].toString();
                if (values[index] === 'unset' && priority == undefined){
                    isSelected = true;
                }
                const isSelectedString = isSelected ? ' selected' : '';
                return (
                    '<option value="' + values[index] + '"' + isSelectedString +'>' + ucfirst(TranslateService.translate(eventStore, keys[index].toString())) + '</option>'
                )
            });

        return [
            '<select id="new-priority">',
            ...options,
            '</select>'
        ].join("\n");
    },
    _renderPreferredTime: (eventStore: EventStore, preferredTime?: TriplanEventPreferredTime) => {
        const values = Object.keys(TriplanEventPreferredTime);
        const keys = Object.values(TriplanEventPreferredTime);

        const options = Object.values(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x))).map((val, index) => {
            let isSelected = preferredTime && preferredTime.toString() === values[index].toString();
            if (values[index] === 'unset' && preferredTime == undefined){
                isSelected = true;
            }
            const isSelectedString = isSelected ? ' selected' : '';
            return (
                '<option value="' + values[index] + '"' + isSelectedString +'>' + ucfirst(TranslateService.translate(eventStore,keys[index].toString())) + '</option>'
            )
        });

        return [
            '<select id="new-preferred-time">',
            ...options,
            '</select>'
        ].join("\n");
    },
    _renderDescriptionInput: (eventStore: EventStore, description?:string) => {
        // if (description) {
        //     description = addLineBreaks(description, '&#10;');
        // }
        // console.log(description);
      return `<tr >
      <td>${TranslateService.translate(eventStore, 'MODALS.DESCRIPTION')}</td>
      <td><strong>
      <textarea rows="6" id="new-description" placeholder="${TranslateService.translate(eventStore, 'MODALS.DESCRIPTION_PLACEHOLDER')}">${(description || "")}</textarea></strong></td>
      </tr>`;
    },
    openEditCategoryModal: (TriplanCalendarRef: any, eventStore: EventStore, categoryId: number) => {
        const category = eventStore.categories.find((c) => c.id.toString() === categoryId.toString());
        if (!category) return;
        const categoryName = category.title;

        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'EDIT_CATEGORY_MODAL.TITLE.EDIT_CATEGORY')}: ${categoryName}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="` + ModalService._categoriesIcons(eventStore)[categoryId] + `" /></strong></td>
      </tr>
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="` + categoryName + `" />
` +
                `</strong></td>
      </tr>
      </table>
      </div>`,

            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE')
        }).then(result => {

            const oldIcon = ModalService._categoriesIcons(eventStore)[categoryId];
            const oldName = categoryName;
            // @ts-ignore
            const newIcon = document.getElementById("new-icon")!.value;
            // @ts-ignore
            const newName = document.getElementById("new-name")!.value;

            if (result.value) {
                // eventClick.event.remove(); // It will remove event from the calendar
                // setCalendarEvents([
                //     ...calendarEvents.filter((event) => event.id.toString() !== eventId.toString())
                // ])
                //
                // currentEvent.title = currentEvent.title;
                //
                // addEventToSidebar(currentEvent);
                // Alert.fire(TranslateService.translate(eventStore,"MODALS.DELETED.TITLE"), "Your Category have been deleted.", "success");
            } else {
                const iconChanged = oldIcon !== newIcon;
                const titleChanged = oldName !== newName;
                const isChanged = titleChanged || iconChanged;

                if (isChanged) {

                    // validate title not already exist
                    if (eventStore.categories.find((c) =>
                        c.id !== categoryId && c.title === newName
                    )) {
                        Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST"), "error");
                        return;
                    }

                    eventStore.setCategories([
                        ...eventStore.categories.filter((c) => c.id.toString() !== categoryId.toString()),
                        {
                            id: categoryId,
                            title: newName,
                            icon: newIcon
                        },
                    ]);

                    // update our store
                    const updatedCalenderEvents = [...eventStore.getJSCalendarEvents()];
                    updatedCalenderEvents.forEach((e) => {
                        const event = eventStore.allEvents.find((ev) => ev.id.toString() === e.id!.toString());
                        if (event && event.category && event.category === categoryId.toString()){
                            if (e.icon === oldIcon){
                                e.icon = newIcon;
                            }
                        }
                    });

                    eventStore.setCalendarEvents([...updatedCalenderEvents]);

                    // remove from fullcalendar store
                    TriplanCalendarRef.current.refreshSources();
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, "MODALS.UPDATED_CATEGORY.CONTENT"), "success");
                }
            }
        });
    },
    openEditCalendarEventModal: (eventStore: EventStore, addEventToSidebar: (event: SidebarEvent) => void, info: any) => {

        const handleEditEventResult = (eventStore: EventStore, result:any, addEventToSidebar: (event: SidebarEvent) => void, originalEvent: EventInput) => {

            const eventId = originalEvent.id!;
            if (!eventStore) return;

            const oldEvent = eventStore.allEvents.find(e => e.id === eventId);
            if (!oldEvent){
                console.error("old event not found");
                return;
            }
            // @ts-ignore
            let icon = document.getElementById("new-icon").value || "";

            // @ts-ignore
            const title = document.getElementById("new-name").value;

            // @ts-ignore
            const startDate = document.getElementById("starttime").value;

            // @ts-ignore
            const endDate = document.getElementById("endtime").value;

            // @ts-ignore
            const priority = document.getElementById("new-priority").value;

            // @ts-ignore
            let preferredTime = document.getElementById("new-preferred-time").value;

            // @ts-ignore
            const description = document.getElementById("new-description").value;

            // @ts-ignore
            const categoryId = document.getElementById("new-category").value;

            // @ts-ignore
            const locationText = document.querySelector('.location-input').value;
            const prevLocationText = originalEvent.extendedProps && originalEvent.extendedProps.location ?
                originalEvent.extendedProps.location.address : undefined;

            // @ts-ignore
            let location: LocationData | undefined = window.selectedLocation as LocationData;
            if (location != undefined && location.address === ''){
                location = undefined;
            }

            const currentEvent: CalendarEvent = {
                title,
                start: new Date(startDate),
                end: new Date(endDate),
                id: eventId,
                icon,
                priority: priority as TriplanPriority,
                allDay: originalEvent.allDay,
                preferredTime: preferredTime as TriplanEventPreferredTime,
                description,
            };

            // written like this since otherwise, editing without changing anything will reset location to nothing
            // since window.selectedLocation being reset on each modal open.
            if (locationText != prevLocationText){
                currentEvent['location'] = location;
            }

            if (originalEvent.extendedProps) {
                Object.keys(originalEvent.extendedProps).forEach((key) => {
                    if (!Object.keys(currentEvent).includes(key)) {
                        // @ts-ignore
                        currentEvent[key] = originalEvent.extendedProps[key]
                    }
                })
            }

            // @ts-ignore
            const millisecondsDiff = currentEvent.end - currentEvent.start;
            currentEvent.duration = convertMsToHM(millisecondsDiff);

            if (result.value) {
                // add back to sidebar
                addEventToSidebar(currentEvent);

                // remove from calendar
                eventStore.allowRemoveAllCalendarEvents = true;
                eventStore.deleteEvent(eventId);

                // refreshSources();
                Alert.fire(TranslateService.translate(eventStore,"MODALS.DELETED.TITLE"), TranslateService.translate(eventStore, "MODALS.DELETED.CONTENT"), "success");
            } else {

                if (!title){
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.TITLE_CANNOT_BE_EMPTY"), "error");
                    return;
                }

                const durationChanged = originalEvent.start!.toString() !== currentEvent.start.toString() || (originalEvent.end && originalEvent.end.toString() !== currentEvent.end.toString());
                const iconChanged = oldEvent.icon !== currentEvent.icon;
                const titleChanged = originalEvent.title !== currentEvent.title;
                const priorityChanged = originalEvent.extendedProps && originalEvent.extendedProps.priority !== currentEvent.priority;
                const preferredTimeChanged = originalEvent.extendedProps && originalEvent.extendedProps.preferredTime !== currentEvent.preferredTime;
                const descriptionChanged = originalEvent.extendedProps && originalEvent.extendedProps.description !== currentEvent.description;
                const isLocationChanged = originalEvent.extendedProps && originalEvent.extendedProps.location != currentEvent.location;
                const oldCategory = eventStore.allEvents.find((e) => e.id === eventId)!.category;
                const isCategoryChanged = oldCategory != categoryId;
                const isChanged = titleChanged || durationChanged || iconChanged || priorityChanged || preferredTimeChanged || descriptionChanged || isLocationChanged || isCategoryChanged;

                if (isChanged) {
                    // originalEvent.remove(); // It will remove event from the calendar
                    // eventStore.setCalendarEvents([
                    //     ...eventStore.calendarEvents.filter((event) => event!.id!.toString() !== eventId.toString()),
                    //     currentEvent
                    // ]);
                    // refreshSources();
                    // props.updateAllEventsEvent(currentEvent);

                    debugger;
                    const isUpdated = eventStore.changeEvent({
                        event: {
                            id: eventId,
                            title: currentEvent.title,
                            allDay: currentEvent.allDay,
                            start: currentEvent.start,
                            end: currentEvent.end,
                            icon: currentEvent.icon,
                            priority: currentEvent.priority,
                            preferredTime: currentEvent.preferredTime,
                            description: currentEvent.description,
                            location: currentEvent.location,
                            category: categoryId
                        }
                    });
                    if (isUpdated) {
                        Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, "MODALS.UPDATED_EVENT.CONTENT"), "success");
                    } else {
                        Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT_ERROR.CONTENT'), "error");
                    }
                }
            }
        }

        // on event click - show edit event popup
        const eventId = info.event.id;
        const currentEvent = eventStore.allEvents.find((e: any) => e.id === eventId);
        if (!currentEvent) {
            console.error("event not found")
            return;
        }
        const icon = currentEvent.icon || "";

        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${info.event.title}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr style="${info.event.allDay ? 'display:none;' : ''}">
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="` + icon + `" /></strong></td>
      </tr>
      ` + ModalService._renderCategoryLine(eventStore, info.event.extendedProps.categoryId) + `
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="` + info.event.title + `" />
` +
                `</strong></td>
      </tr>
      ` + ModalService._renderDescriptionInput(eventStore, info.event.extendedProps.description) + `
      <tr style="${info.event.allDay ? 'display:none;' : ''}">
      <td>${TranslateService.translate(eventStore, "MODALS.START_TIME")}</td>
      <td><strong>
      <input type="datetime-local" id="starttime" name="starttime" value="` +
                getInputDateTimeValue(info.event.start) +
                `"/>
      </strong></td>
      </tr>
      <tr style="${info.event.allDay ? 'display:none;' : ''}">
      <td>${TranslateService.translate(eventStore, "MODALS.END_TIME")}</td>
      <td><strong>
      <input type="datetime-local" id="endtime" name="endtime" value="` +
                getInputDateTimeValue(getEventDueDate(info.event)) +
                `"/>
      </strong></td>
      </tr>
      <tr style="${info.event.allDay ? 'display:none;' : ''}">
      <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      <td><strong>
      ` + ModalService._renderPrioritySelect(eventStore, info.event.extendedProps.priority) + `
      </strong></td>
      </tr>
      <tr style="${info.event.allDay ? 'display:none;' : ''}">
      <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      <td><strong>
      ` + ModalService._renderPreferredTime(eventStore, info.event.extendedProps.preferredTime) + `
      </strong></td>
      </tr>
      ` + ModalService._renderLocationRow(eventStore, info.event.extendedProps.location) + `
      </table>
      </div>`,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.REMOVE_EVENT'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
        }).then(result => handleEditEventResult(eventStore, result, addEventToSidebar, info.event));
    },
    openDeleteSidebarEventModal: (eventStore: EventStore, removeEventFromSidebarById: (eventId: string) => void, event: SidebarEvent) => {
        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${event.title}`,
            // title: 'Are you sure?',
            html: TranslateService.translate(eventStore, 'MODALS.DELETE_SIDEBAR_EVENT.CONTENT'),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {
                removeEventFromSidebarById(event.id);
            }
        })
    },
    confirmModal: (eventStore: EventStore, callback: () => void) => {
        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.ARE_YOU_SURE')}`,
            html: TranslateService.translate(eventStore, 'MODALS.ARE_YOU_SURE.CONTENT'),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.CONTINUE'),
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {
                callback();
            }
        })
    },
    openDeleteCategoryModal: (eventStore: EventStore, categoryId: number) => {

        const newCategories = eventStore.categories.filter((c) => c.id !== categoryId);
        const newCalendarEvents = eventStore.calendarEvents.filter((c) => c.category !== categoryId && (!c.extendedProps || c.extendedProps.categoryId !== categoryId));
        const newAllEvents = eventStore.allEvents.filter((c) => c.category !== categoryId.toString());
        const newSidebarEvents = {...eventStore.getSidebarEvents};
        delete newSidebarEvents[categoryId];

        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${eventStore.categories.find((c) => c.id.toString() === categoryId.toString())!.title}`,
            // title: 'Are you sure?',
            html: [
                TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT'),
                "",
                TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT.IT_WILL_AFFECT'),
                "<ul>" + [
                    `<li>${eventStore.calendarEvents.length - newCalendarEvents.length} ${TranslateService.translate(eventStore, 'CALENDAR_EVENTS')}</li>`,
                    `<li>${Object.values(eventStore.getSidebarEvents).flat().length - Object.values(newSidebarEvents).flat().length} ${TranslateService.translate(eventStore, 'SIDEBAR_EVENTS')}</li>`,
                    `<li>${eventStore.allEvents.length - newAllEvents.length} ${TranslateService.translate(eventStore, 'TOTAL_EVENTS')}</li>`
                    ].join("") + "</ul>"
            ].join("<br/>"),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {

                // delete from sidebar
                eventStore.setSidebarEvents(newSidebarEvents);

                // delete from categories
                eventStore.setCategories([
                    ...newCategories
                ]);

                // delete from calendar
                if (newCalendarEvents.length === 0){
                    eventStore.allowRemoveAllCalendarEvents = true;
                }
                eventStore.setCalendarEvents([
                    ...newCalendarEvents
                ]);

                // delete from all events
                eventStore.setAllEvents([
                    ...newAllEvents
                ]);
            }
        })
    },
    openImportEventsConfirmModal: (eventStore: EventStore, info: ImportEventsConfirmInfo) => {
        let contentArr = [
            `${info.eventsToAdd.length} ${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.EVENTS_WILL_BE_ADDED')}`,
            `${info.categoriesToAdd.length} ${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.CATEGORIES_WILL_BE_ADDED')}`,
            `${info.numOfEventsWithErrors} ${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.EVENTS_HAVE_ERRORS')}`,
        ];

        if (info.categoriesToAdd.length > 0){
            contentArr = [...contentArr,
                "",
                `<u><b>${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.ABOUT_TO_UPLOAD_CATEGORIES')}</b></u>`,
                ['<ul>',...info.categoriesToAdd.map(x => `<li>${x.title}</li>`),'</ul>'].join("")
            ];
        }

        if (info.eventsToAdd.length > 0){
            contentArr = [...contentArr,
                "",
                `<u><b>${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.ABOUT_TO_UPLOAD_EVENTS')}</b></u>`,
                ['<ul>',...info.eventsToAdd.map(x => `<li>${x.title}</li>`),'</ul>'].join("")
            ];
        }

        if (info.errors.length > 0){
            contentArr = [...contentArr,
                "",
                `<u><b>${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.ERRORS_DETAILS')}</b></u>`,
                ['<ul>',...info.errors.map(x => `<li>${x}</li>`),'</ul>'].join("")
            ];
        }

        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE3')}`,
            html: contentArr.join("<br/>"),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, info.errors.length > 0 ? 'MODALS.UPLOAD_ANYWAY' : 'MODALS.UPLOAD'),
            showConfirmButton: info.categoriesToAdd.length > 0 || info.eventsToAdd.length > 0
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {
                const { categoriesImported, eventsImported } = ImportService.import(eventStore, info);
                if (categoriesImported || eventsImported) {
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.IMPORTED.TITLE"), TranslateService.translate(eventStore, 'MODALS.IMPORTED.CONTENT'), "success");
                } else {
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, 'OOPS_SOMETHING_WENT_WRONG'), "error");
                }
            }
        })
    },
    _importEventsSteps: (eventStore: EventStore, key: string) => {
        return `<div class="import-events-steps">
                ${TranslateService.translate(eventStore, key)}
                </div>
            `;
    },
    openImportEventsModal: (eventStore: EventStore) => {
        Alert.fire({
            title: TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE'),
            html: ModalService._importEventsSteps(eventStore, 'IMPORT_EVENTS_STEPS'),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.DOWNLOAD_TEMPLATE'),
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {
                ImportService._download("TriplanEventsImport.csv", ImportService._buildTemplate(eventStore));
                ModalService.openImportEventsStepTwoModal(eventStore);
            }
        })
    },
    openImportEventsStepTwoModal: (eventStore: EventStore) => {
        Alert.fire({
            title: TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE2'),
            html: ModalService._importEventsSteps(eventStore, 'IMPORT_EVENTS_STEPS2'),
            input: 'file',
            inputAttributes: {
                name: "upload[]",
                id: "fileToUpload",
                accept: "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv",
            },
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.UPLOAD'),
        }).then((result) => {
            if (result.value) {
                // @ts-ignore
                // const file = document.getElementById("fileToUpload").files[0];
                const file = result.value;
                if (file) {
                    const reader = new FileReader();
                    reader.readAsText(file, "UTF-8");
                    // await reader.readAsText(file.value, "UTF-8");
                    // await reader.readAsDataURL(file.value);
                    console.log(reader.result);
                    reader.onload = function (evt) {
                        // @ts-ignore
                        ImportService.handleUploadedFile(eventStore, evt.target.result);
                    }
                    reader.onerror = function (evt) {
                        console.error("error reading file");
                        Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, 'MODALS.IMPORT_EVENTS_ERROR.CONTENT'), "error");
                        // document.getElementById("fileContents").innerHTML = "error reading file";
                    }
                }
            }
        })
    },
    openEditSidebarEventModal: (eventStore: EventStore, event: SidebarEvent, removeEventFromSidebarById: (eventId:string) => void, addToEventsToCategories: (value: any) => void) => {

        const handleEditSidebarEventResult = (eventStore: EventStore, result:any, removeEventFromSidebarById: (eventId:string) => void, originalEvent: SidebarEvent) => {

            const eventId = originalEvent.id!;
            if (!eventStore) return;

            const oldEvent = eventStore.allEvents.find(e => e.id === eventId);
            if (!oldEvent){
                console.error("old event not found");
                return;
            }
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

            // @ts-ignore
            const categoryId = document.getElementById("new-category").value;

            // @ts-ignore
            const location = window.selectedLocation as LocationData;

            let currentEvent: any = {
                title,
                id: eventId,
                icon,
                duration,
                priority: priority as TriplanPriority,
                preferredTime: preferredTime as TriplanEventPreferredTime,
                description,
                location
            };

            const isDurationValid = validateDuration(duration);
            if (!isDurationValid){
                delete currentEvent.duration;
            } else {
                // duration = formatDuration(duration);
                currentEvent.duration = formatDuration(duration);
            }

            if (!title){
                Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.TITLE_CANNOT_BE_EMPTY"), "error");
                return;
            }

            if (originalEvent.extendedProps) {
                Object.keys(originalEvent.extendedProps).forEach((key) => {
                    if (!Object.keys(currentEvent).includes(key)) {
                        // @ts-ignore
                        currentEvent[key] = originalEvent.extendedProps[key]
                    }
                })
            }

            if (result.value) {
                ModalService.openDeleteSidebarEventModal(eventStore, removeEventFromSidebarById, event)
            } else {
                const durationChanged = originalEvent.duration !== currentEvent.duration.toString() && !(originalEvent.duration == undefined && currentEvent.duration == defaultTimedEventDuration);
                const iconChanged = oldEvent.icon !== currentEvent.icon && !(oldEvent.icon == undefined && currentEvent.icon == "");
                const titleChanged = originalEvent.title !== currentEvent.title;
                const priorityChanged = originalEvent.priority != undefined && originalEvent.priority.toString() !== currentEvent.priority.toString();
                const preferredTimeChanged = originalEvent.preferredTime != undefined && originalEvent.preferredTime.toString() !== currentEvent.preferredTime.toString();
                const isDescriptionChanged = originalEvent.description !== currentEvent.description;
                const oldCategory = eventStore.allEvents.find((e) => e.id === event.id)!.category;
                const isCategoryChanged = oldCategory != categoryId;
                const isLocationChanged = originalEvent.location != currentEvent.location;
                const isChanged = titleChanged || durationChanged || iconChanged || priorityChanged || preferredTimeChanged || isDescriptionChanged || isLocationChanged;

                if (isCategoryChanged){

                    // remove it from the old category
                    removeEventFromSidebarById(event.id);

                    // add it to the new category
                    // @ts-ignore
                    currentEvent = {
                        ...currentEvent,
                        id: eventStore.createEventId(),
                        extendedProps: {
                            categoryId
                        }
                    };
                    const existingSidebarEvents = {...eventStore.getSidebarEvents};
                    existingSidebarEvents[parseInt(categoryId)] = existingSidebarEvents[parseInt(categoryId)] || [];
                    existingSidebarEvents[parseInt(categoryId)].push(currentEvent);
                    eventStore.setSidebarEvents(existingSidebarEvents);
                    eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), currentEvent]);

                    addToEventsToCategories(currentEvent);

                    Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, 'MODALS.UPDATED_EVENT.CONTENT'), "success");
                }
                else if (isChanged) {

                    const eventFound = eventStore.allEvents.find((e) => e.id === event.id);
                    if (eventFound) {

                        eventStore.updateSidebarEvent(eventFound, {
                            title,
                            icon,
                            duration,
                            priority,
                            description,
                            location,
                            extendedProps: {
                                categoryId
                            }
                        } as SidebarEvent);
                        eventStore.setAllEvents(eventStore.allEvents);

                        const newSidebarEvents: Record<number, SidebarEvent[]> = {};
                        const existingSidebarEvents = eventStore.getSidebarEvents;
                        Object.keys(existingSidebarEvents).forEach((category) => {
                            const categoryId = parseInt(category);
                            newSidebarEvents[categoryId] = newSidebarEvents[categoryId] || [];
                            existingSidebarEvents[categoryId].forEach((_event) => {
                                if (_event.id === event.id){
                                    eventStore.updateSidebarEvent(_event, {
                                        title,
                                        icon,
                                        duration,
                                        priority,
                                        preferredTime,
                                        description,
                                        location
                                    } as SidebarEvent);
                                }
                                newSidebarEvents[categoryId].push(_event);
                            })
                        });
                        if (isCategoryChanged) {
                            newSidebarEvents[Number(oldCategory)] =
                                newSidebarEvents[Number(oldCategory)].filter((_event) => _event.id !== event.id)
                        }
                        eventStore.setSidebarEvents(newSidebarEvents)

                        Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, 'MODALS.UPDATED_EVENT.CONTENT'), "success");

                    } else {
                        Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT_ERROR.CONTENT'), "error");
                    }
                }
            }
        }
        // on event click - show edit event popup
        const eventId = event.id;
        const currentEvent = eventStore.allEvents.find((e: any) => e.id === eventId);
        if (!currentEvent) {
            console.error("event not found")
            return;
        }
        const icon = currentEvent.icon || "";

        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${event.title}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="` + icon + `" /></strong></td>
      </tr>
      </tr>
      ` + ModalService._renderCategoryLine(eventStore, event.category) + `
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="` + event.title + `" />
` +
                `</strong></td>
      </tr>
      ` + ModalService._renderDescriptionInput(eventStore, event.description) + `
      <tr >
      <td>${TranslateService.translate(eventStore, 'MODALS.DURATION')}</td>
      <td><strong>
      <input type="text" id="duration" name="duration" value="` +
                (event.duration || defaultTimedEventDuration) +
                `"/>
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      <td><strong>
      ` + ModalService._renderPrioritySelect(eventStore, event.priority) + `
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      <td><strong>
      ` + ModalService._renderPreferredTime(eventStore, event.preferredTime) + `
      </strong></td>
      </tr>
      ` + ModalService._renderLocationRow(eventStore, event.location) + `
      </table>
      </div>`,

            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.REMOVE_EVENT'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE')
        }).then(result => handleEditSidebarEventResult(eventStore, result, removeEventFromSidebarById, event));
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
                location
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

                eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), {...currentEvent, category: categoryId.toString()}]);

                Alert.fire(TranslateService.translate(eventStore, "MODALS.ADDED.TITLE"), TranslateService.translate(eventStore, "MODALS.ADDED.CONTENT"), "success");
            }
        }

        const category =
            categoryId ? eventStore.categories.find((c) => c.id.toString() === categoryId.toString()) : undefined;

        const title = category ? `${TranslateService.translate(eventStore,"MODALS.ADD_EVENT_TO_CATEGORY.TITLE")}: ${category.title}` :
        TranslateService.translate(eventStore,"ADD_EVENT_MODAL.TITLE");

        Alert.fire({
            title: title,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="" /></strong></td>
      </tr>
      ` + ModalService._renderCategoryLine(eventStore, categoryId && category ? categoryId.toString() : undefined) + `
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="" /></strong></td>
      </tr>
      ` + ModalService._renderDescriptionInput(eventStore, "") + `
      <tr >
      <td>${TranslateService.translate(eventStore, 'MODALS.DURATION')}</td>
      <td><strong>
      <input type="text" id="duration" name="duration" value="` + defaultTimedEventDuration + `"/>
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      <td><strong>
      ` + ModalService._renderPrioritySelect(eventStore, TriplanPriority.unset) + `
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      <td><strong>
      ` + ModalService._renderPreferredTime(eventStore, TriplanEventPreferredTime.unset) + `
      </strong></td>
      </tr>
      ` + ModalService._renderLocationRow(eventStore, initialData.location) + `
      </table>
      </div>`,

            showCancelButton: true,
            cancelButtonColor: "#d33",
            confirmButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL')
        }).then(result => handleAddSidebarEventResult(eventStore, result, categoryId));
    },
    openAddCalendarEventModal: (eventStore: EventStore, addToEventsToCategories: (value: any) => void, info: any) => {

        const handleAddCalendarEventResult = (eventStore: EventStore, result:any) => {
            if (!eventStore) return;

            // @ts-ignore
            let icon = document.getElementById("new-icon").value || "";

            // @ts-ignore
            const title = document.getElementById("new-name").value;

            // @ts-ignore
            const startDate = document.getElementById("starttime").value;

            // @ts-ignore
            const endDate = document.getElementById("endtime").value;

            // @ts-ignore
            let priority = document.getElementById("new-priority").value;

            // @ts-ignore
            let preferredTime = document.getElementById("new-preferred-time").value;

            // @ts-ignore
            const description = document.getElementById("new-description").value;

            // @ts-ignore
            const categoryId = document.getElementById("new-category").value;

            // @ts-ignore
            const location = window.selectedLocation as LocationData;

            const currentEvent = {
                id: eventStore.createEventId(),
                title,
                icon,
                priority: priority as TriplanPriority,
                preferredTime: preferredTime as TriplanEventPreferredTime,
                description,
                start: new Date(startDate),
                end: new Date(endDate),
                category: categoryId,
                className: priority? `priority-${priority}` : undefined,
                allDay: info.allDay,
                location,
                extendedProps:{
                    title,
                    icon,
                    priority: priority as TriplanPriority,
                    preferredTime: preferredTime as TriplanEventPreferredTime,
                    description,
                    categoryId: categoryId,
                    location
                }
            } as CalendarEvent;

            // @ts-ignore
            const millisecondsDiff = currentEvent.end - currentEvent.start;
            currentEvent.duration = convertMsToHM(millisecondsDiff);

            if (result.value) {

                if (!title){
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.TITLE_CANNOT_BE_EMPTY"), "error");
                    return;
                }

                eventStore.setCalendarEvents([
                    ...eventStore.getJSCalendarEvents(),
                    currentEvent
                ]);

                addToEventsToCategories(currentEvent);

                eventStore.setAllEvents([
                    ...eventStore.allEvents.filter((x) => x.id !== currentEvent.id),
                    {...currentEvent, category: categoryId}
                ]);

                Alert.fire(TranslateService.translate(eventStore, "MODALS.ADDED.TITLE"), TranslateService.translate(eventStore, "MODALS.ADDED.CONTENT"), "success");
            }
        }

        Alert.fire({
            title: `${TranslateService.translate(eventStore,"MODALS.ADD_EVENT_TO_CALENDAR.TITLE")}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="" /></strong></td>
      </tr>
      ` + ModalService._renderCategoryLine(eventStore) + `
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="" /></strong></td>
      </tr>
      ` + ModalService._renderDescriptionInput(eventStore, "") + `
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.START_TIME")}</td>
      <td><strong>
      <input type="datetime-local" id="starttime" name="starttime" value="` +
                getInputDateTimeValue(info.start) +
                `"/>
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.END_TIME")}</td>
      <td><strong>
      <input type="datetime-local" id="endtime" name="endtime" value="` +
                getInputDateTimeValue(info.end) +
                `"/>
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      <td><strong>
      ` + ModalService._renderPrioritySelect(eventStore, TriplanPriority.unset) + `
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      <td><strong>
      ` + ModalService._renderPreferredTime(eventStore, TriplanEventPreferredTime.unset) + `
      </strong></td>
      </tr>
      ` + ModalService._renderLocationRow(eventStore) + `
      </table>
      </div>`,

            showCancelButton: true,
            cancelButtonColor: "#d33",
            confirmButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL')
        }).then(result => handleAddCalendarEventResult(eventStore, result));
    },
    openDuplicateSidebarEventModal: (eventStore: EventStore, event: SidebarEvent) => {

        const handleDuplicateSidebarEventResult = (eventStore: EventStore, result:any, event: SidebarEvent) => {
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

            // @ts-ignore
            let location: LocationData | undefined = window.selectedLocation as LocationData;

            const currentEvent = {
                id: eventStore.createEventId(),
                title,
                icon,
                duration,
                priority: priority as TriplanPriority,
                preferredTime: preferredTime as TriplanEventPreferredTime,
                description,
                location
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

                const foundEvent = eventStore.allEvents.find((e) => e.id.toString() === event.id.toString());
                if (!foundEvent){
                    console.error("event not found");
                    return;
                }
                const categoryId = foundEvent.category || eventStore.categories[0].id.toString();

                const existingSidebarEvents = {...eventStore.getSidebarEvents};
                existingSidebarEvents[parseInt(categoryId)].push(currentEvent);
                eventStore.setSidebarEvents(existingSidebarEvents);

                eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), {...currentEvent, category: categoryId}]);

                Alert.fire(TranslateService.translate(eventStore, "MODALS.ADDED.TITLE"), TranslateService.translate(eventStore, "MODALS.ADDED.CONTENT"), "success");
            }
        }

        const icon = event.icon || "";

        Alert.fire({
            title: `${TranslateService.translate(eventStore, "MODALS.DUPLICATE")}: ${event.title}`,
            // title: event.title,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="` + icon + `" /></strong></td>
      </tr>
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="` + event.title + `" />
` +
                `</strong></td>
      </tr>
      ` + ModalService._renderDescriptionInput(eventStore, event.description) + `
      <tr >
      <td>${TranslateService.translate(eventStore, 'MODALS.DURATION')}</td>
      <td><strong>
      <input type="text" id="duration" name="duration" value="` +
                (event.duration || defaultTimedEventDuration) +
                `"/>
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PRIORITY")}</td>
      <td><strong>
      ` + ModalService._renderPrioritySelect(eventStore, event.priority) + `
      </strong></td>
      </tr>
      <tr >
      <td>${TranslateService.translate(eventStore, "MODALS.PREFERRED_TIME")}</td>
      <td><strong>
      ` + ModalService._renderPreferredTime(eventStore, event.preferredTime) + `
      </strong></td>
      </tr>
      ` + ModalService._renderLocationRow(eventStore, event.location) + `
      </table>
      </div>`,

            showCancelButton: true,
            cancelButtonColor: "#d33",
            confirmButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL')
        }).then(result => handleDuplicateSidebarEventResult(eventStore, result, event));
    },
    openAddCategoryModal: (eventStore: EventStore) => {
        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.TITLE.ADD_CATEGORY')}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
       <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.ICON') + `</td>
      <td><strong>
      <input id="new-icon" type="text" value="" /></strong></td>
      </tr>
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" placeholder="${TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER')}" />
` +
                `</strong></td>
      </tr>
      </table>
      </div>`,

            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE')
        }).then(result => {

            // @ts-ignore
            const newIcon = document.getElementById("new-icon")!.value;

            // @ts-ignore
            const newName = document.getElementById("new-name")!.value;

            // validate not already exist
            if (eventStore.categories.find((c) => c.title === newName)) {
                Alert.fire(TranslateService.translate(eventStore, "MODALS.ERROR.TITLE"), TranslateService.translate(eventStore, "MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST"), "error");
                return;
            }

            if (!result.value) {

                eventStore.setCategories([
                    ...eventStore.categories,
                    {
                        id: eventStore.createCategoryId(),
                        title: newName,
                        icon: newIcon
                    },
                ]);

                Alert.fire(TranslateService.translate(eventStore, "MODALS.CREATE.TITLE"), TranslateService.translate(eventStore, "MODALS.CREATE_CATEGORY.CONTENT"), "success");
            }
        });
    },
    openDeleteTripModal: (eventStore: EventStore, LSTripName: string) => {
        const tripName = LSTripName !== "" ? LSTripName.replaceAll("-"," ") : "";
        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${tripName}`,
            html: TranslateService.translate(eventStore, 'MODALS.DELETE_TRIP.CONTENT'),
            showCancelButton: true,
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.value) {
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
    openEditTripModal: (eventStore: EventStore, LSTripName: string) => {
        const tripName = LSTripName !== "" ? LSTripName.replaceAll("-"," ") : "";
        Alert.fire({
            title: `${TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}: ${tripName}`,
            html:
                `<div class="table-responsive">
      <table class="table">
      <tbody>
      <tr >
      <td>` + TranslateService.translate(eventStore, 'MODALS.TITLE') + `</td>
      <td><strong>
      <input id="new-name" type="text" value="` + tripName + `" />
` +
                `</strong></td>
      </tr>
      </table>
      </div>`,

            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
            cancelButtonText: TranslateService.translate(eventStore, 'MODALS.SAVE')
        }).then(result => {

            const oldName = tripName;

            // @ts-ignore
            const newName = document.getElementById("new-name")!.value;

            if (!result.value) {
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
                        return;
                    }

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
                    Alert.fire(TranslateService.translate(eventStore, "MODALS.UPDATED.TITLE"), TranslateService.translate(eventStore, "MODALS.UPDATED_TRIP.CONTENT"), "success");

                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            }
        });
    },
    _renderLocationRow: (eventStore: EventStore, location?: LocationData) => {

        // @ts-ignore
        window.selectedLocation = location || undefined;

        return `
            <tr key="${location ? location.address : 'no-location'}">
                <td>` + TranslateService.translate(eventStore, 'MODALS.LOCATION') + `</td>
                <td>
                    <strong>
                        <input type="text" class="location-input" onclick="window.initLocationPicker()" onkeyup="window.setManualLocation()" value="${location ? location.address : ""}" autoComplete="off" placeholder="${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}"/>
                    </strong>
                </td>
            </tr>`;
    },
    _renderCategoryLine: (eventStore: EventStore, categoryId?: string) => {

        return `<tr>
                  <td>${TranslateService.translate(eventStore, "MODALS.CATEGORY")}</td>
                  <td><strong>
                  <select id="new-category">
                    ` + eventStore.categories
                        .sort((a,b) => b.id - a.id)
                        .map((x, index) =>
                            (categoryId ?
                                categoryId == x.id.toString() :
                                index == 0) ?
                                `<option value=${x.id} selected>${x.title}</option>` :
                                `<option value=${x.id}>${x.title}</option>`
                        ).join("") + ` 
                  </select>
                  </strong></td>
              </tr>`
    }
}

export default ModalService;