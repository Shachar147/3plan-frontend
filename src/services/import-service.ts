import {EventStore} from "../stores/events-store";
import TranslateService from "./translate-service";
import {TriplanEventPreferredTime, TriplanPriority} from "../utils/enums";
import {ImportEventsConfirmInfo, SidebarEvent, TriPlanCategory} from "../utils/interfaces";
import ModalService from "./modal-service";
import {defaultTimedEventDuration} from "../utils/defaults";
import {formatDuration, validateDuration} from "../utils/time-utils";
import ReactModalService from "./react-modal-service";

const ImportService = {

    // ref: http://stackoverflow.com/a/1293163/2343
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    // CSVToArray: (strData: string, strDelimiter: string ) => {
    //     // Check to see if the delimiter is defined. If not,
    //     // then default to comma.
    //     strDelimiter = (strDelimiter || ",");
    //
    //     // Create a regular expression to parse the CSV values.
    //     var objPattern = new RegExp(
    //         (
    //             // Delimiters.
    //             "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
    //
    //             // Quoted fields.
    //             "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
    //
    //             // Standard fields.
    //             "([^\"\\" + strDelimiter + "\\r\\n]*))"
    //         ),
    //         "gi"
    //     );
    //
    //
    //     // Create an array to hold our data. Give the array
    //     // a default empty first row.
    //     var arrData = [[]];
    //
    //     // Create an array to hold our individual pattern
    //     // matching groups.
    //     var arrMatches = null;
    //
    //
    //     // Keep looping over the regular expression matches
    //     // until we can no longer find a match.
    //     while (arrMatches = objPattern.exec( strData )){
    //
    //         // Get the delimiter that was found.
    //         var strMatchedDelimiter = arrMatches[ 1 ];
    //
    //         // Check to see if the given delimiter has a length
    //         // (is not the start of string) and if it matches
    //         // field delimiter. If id does not, then we know
    //         // that this delimiter is a row delimiter.
    //         if (
    //             strMatchedDelimiter.length &&
    //             strMatchedDelimiter !== strDelimiter
    //         ){
    //
    //             // Since we have reached a new row of data,
    //             // add an empty row to our data array.
    //             arrData.push( [] );
    //
    //         }
    //
    //         var strMatchedValue;
    //
    //         // Now that we have our delimiter out of the way,
    //         // let's check to see which kind of value we
    //         // captured (quoted or unquoted).
    //         if (arrMatches[ 2 ]){
    //
    //             // We found a quoted value. When we capture
    //             // this value, unescape any double quotes.
    //             strMatchedValue = arrMatches[ 2 ].replace(
    //                 new RegExp( "\"\"", "g" ),
    //                 "\""
    //             );
    //
    //         } else {
    //
    //             // We found a non-quoted value.
    //             strMatchedValue = arrMatches[ 3 ];
    //
    //         }
    //
    //
    //         // Now that we have our value string, let's add
    //         // it to the data array.
    //         // @ts-ignore
    //         arrData[ arrData.length - 1 ].push( strMatchedValue );
    //     }
    //
    //     // Return the parsed data.
    //     return arrData ;
    // },

    CSVToArray: (str: string) => {
        const arr: string[][] = [];
        let quote = false;
        let col, c;
        let a = 1;
        for (let row = col = c = 0; c < str.length; c++) {
            var cc = str[c], nc = str[c + 1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            //
            // if (a) {
            //     debugger;
            // }

            if (cc == '"' && quote && nc == '"') {
                arr[row][col] += cc;
                ++c;
                continue;
            }
            if (cc == '"') {
                quote = !quote;
                continue;
            }
            if (cc == ',' && !quote) {
                ++col;
                continue;
            }
            if (cc == '\n' && !quote) {
                ++row;
                col = 0;
                continue;
            }

            arr[row][col] += cc;
        }
        return arr;
    },
    _download: (filename: string, text: string) => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    },
    _buildTemplate: (eventStore: EventStore) => {
        const header = [
            TranslateService.translate(eventStore, "TEMPLATE.ICON"),
            TranslateService.translate(eventStore, "TEMPLATE.TITLE"),
            TranslateService.translate(eventStore, "TEMPLATE.DESCRIPTION"),
            TranslateService.translate(eventStore, "TEMPLATE.DURATION"),
            TranslateService.translate(eventStore, "TEMPLATE.CATEGORY"),
            TranslateService.translate(eventStore, "TEMPLATE.PRIORITY"),
            TranslateService.translate(eventStore, "TEMPLATE.PREFERRED_TIME"),
        ].join(",")

        const content = [
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.ICON"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.TITLE"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.DESCRIPTION"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.DURATION"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.CATEGORY"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.PRIORITY"),
            TranslateService.translate(eventStore, "TEMPLATE_EXAMPLE.PREFERRED_TIME"),
        ].join(",");

        return [
            header,
            content
        ].join("\n");
    },
    handleUploadedFile: (eventStore: EventStore, result: string) => {
        // const lines = result.replace(/\r/ig, '').split('\n').map((l) => l.split(','));

        const lines = ImportService.CSVToArray(result);

        // debugger;

        const keyToAttr = {
            [TranslateService.translate(eventStore, "TEMPLATE.ICON")]: "icon",
            [TranslateService.translate(eventStore, "TEMPLATE.TITLE")]: "title",
            [TranslateService.translate(eventStore, "TEMPLATE.DESCRIPTION")]: "description",
            [TranslateService.translate(eventStore, "TEMPLATE.DURATION")]: "duration",
            [TranslateService.translate(eventStore, "TEMPLATE.CATEGORY")]: "category",
            [TranslateService.translate(eventStore, "TEMPLATE.PRIORITY")]: "priority",
            [TranslateService.translate(eventStore, "TEMPLATE.PREFERRED_TIME")]: "preferredTime",
        };

        // @ts-ignore
        const headerColumns = lines[0].map((col) => keyToAttr[col]);

        // validate
        const eventsToAdd: SidebarEvent[] = [];
        let categoriesToAdd: TriPlanCategory[] = [];
        const newCategoriesTitleToId: Record<string,number> = {};
        let errors: string[] = [];
        let numOfEventsWithErrors: Record<number, number> = {};

        const categoryIcons = {};

        for (let i = 1; i < lines.length; i++) {
            const event = {};

            const line: string[] = lines[i];
            let isValid = true;
            // @ts-ignore
            line.forEach((val, index) => {
                const col = headerColumns[index];
                switch (col) {
                    case "icon":
                        // @ts-ignore
                        event["icon"] = val;
                        break;
                    case "duration":
                        if (val !== "") {
                            if (!validateDuration(val)) {
                                isValid = false;
                                const error = `duration ${val} is not valid`;
                                console.error(error)
                                errors.push(error);
                                numOfEventsWithErrors[i] = 1;
                            } else {
                                // @ts-ignore
                                event["duration"] = formatDuration(val);
                            }
                        } else {
                            // @ts-ignore
                            event["duration"] = defaultTimedEventDuration;
                        }
                        break;
                    case "priority":
                        if (val !== "") {
                            val = val.toLowerCase();

                            const convert = {
                                [TranslateService.translate(eventStore,"must")]: TriplanPriority.must,
                                [TranslateService.translate(eventStore,"maybe")]: TriplanPriority.maybe,
                                [TranslateService.translate(eventStore,"least")]: TriplanPriority.least,
                                [TranslateService.translate(eventStore,"unset")]: TriplanPriority.unset
                            };

                            if (!(Object.keys(convert).includes(val))) {
                                isValid = false;
                                const error = `priority ${val} is not valid`;
                                console.error(error)
                                errors.push(error);
                                numOfEventsWithErrors[i] = 1;
                            } else {
                                // @ts-ignore
                                event["priority"] = convert[val];
                            }
                        } else {
                            // @ts-ignore
                            event["priority"] = TriplanPriority.unset;
                        }
                        break;
                    case "preferredTime":
                        if (val !== "") {
                            val = val.toLowerCase();

                            const convert = {
                                [TranslateService.translate(eventStore,"morning")]: TriplanEventPreferredTime.morning,
                                [TranslateService.translate(eventStore,"unset")]: TriplanEventPreferredTime.unset,
                                [TranslateService.translate(eventStore,"nevermind")]: TriplanEventPreferredTime.nevermind,
                                [TranslateService.translate(eventStore,"noon")]: TriplanEventPreferredTime.noon,
                                [TranslateService.translate(eventStore,"afternoon")]: TriplanEventPreferredTime.afternoon,
                                [TranslateService.translate(eventStore,"sunset")]: TriplanEventPreferredTime.sunset,
                                [TranslateService.translate(eventStore,"evening")]: TriplanEventPreferredTime.evening,
                            };

                            if (!(Object.keys(convert).includes(val))) {
                                isValid = false;
                                const error = `preferred time ${val} is not valid`;
                                console.error(error)
                                errors.push(error);
                                numOfEventsWithErrors[i] = 1;
                            } else {
                                // @ts-ignore
                                event["preferredTime"] = convert[val];
                            }
                        } else {
                            // @ts-ignore
                            event["preferredTime"] = TriplanEventPreferredTime.unset;
                        }
                        break;
                    case "title":
                        if (val === ""){
                            isValid = false;
                            const error = `title cannot be empty - in line #${index}`;
                            console.error(error)
                            errors.push(error);
                            numOfEventsWithErrors[i] = 1;
                        } else {

                            // @ts-ignore
                            event["title"] = val;

                            if (eventStore.allEvents.find((e) => e.title === val)){
                                isValid = false;
                                const error = `${TranslateService.translate(eventStore, 'EVENT_WITH_NAME')} ${val} ${TranslateService.translate(eventStore, 'ALREADY_EXISTS')}.`;
                                console.error(error);
                                errors.push(error);
                                numOfEventsWithErrors[i] = 1;
                            }
                        }
                        break;
                    case "category":
                        if (val === ""){
                            isValid = false;
                            const error = `category cannot be empty - in line #${index}`;
                            console.error(error)
                            errors.push(error);
                            numOfEventsWithErrors[i] = 1;
                        } else {
                            const findCategory = eventStore.categories.find((c) => c.title === val);
                            if (findCategory){
                                // @ts-ignore
                                event["category"] = findCategory.id;
                            }
                            else if (newCategoriesTitleToId[val]){
                                // @ts-ignore
                                event["category"] = newCategoriesTitleToId[val];
                            }
                            else {
                                const newCategory = {
                                    id: eventStore.createCategoryId(),
                                    icon: "",
                                    title: val
                                } as TriPlanCategory;
                                newCategoriesTitleToId[val] = newCategory.id;
                                categoriesToAdd.push(newCategory);

                                // @ts-ignore
                                event["category"] = newCategory.id;
                            }
                        }
                        break;
                    default:
                        // @ts-ignore
                        event[col] = val;
                        break;
                }
            });
            if (!Object.keys(event).includes("title")){
                const error = TranslateService.translate(eventStore, "IMPORT_EVENTS.ERROR.LANGUAGE_MISMATCH")
                // console.error(error)
                errors = [error];
                numOfEventsWithErrors = { [i]: 1 };
            }
            if (!numOfEventsWithErrors[i]){
                eventsToAdd.push(event as SidebarEvent)
            }

            // @ts-ignore
            categoryIcons[event["category"]] = categoryIcons[event["category"]] || {};
            // @ts-ignore
            categoryIcons[event["category"]][event["icon"]] = categoryIcons[event["category"]][event["icon"]] || 0;
            // @ts-ignore
            categoryIcons[event["category"]][event["icon"]]++;
        }

        Object.keys(categoryIcons).forEach((categoryId) => {
            let max = 0;
            let iconMax = "";
            // @ts-ignore
            Object.keys(categoryIcons[categoryId]).forEach((icon) => {
                // @ts-ignore
                if (categoryIcons[categoryId][icon] > max){
                    // @ts-ignore
                    max = categoryIcons[categoryId][icon];
                    iconMax = icon;
                }
            });

            // @ts-ignore
            categoryIcons[categoryId] = iconMax;
        });

        // debugger;
        categoriesToAdd = categoriesToAdd.map((category) => {
            // @ts-ignore
            category.icon = categoryIcons[category.id] && typeof(categoryIcons[category.id]) === 'string' ? categoryIcons[category.id] : "";
            return category;
        });

        eventsToAdd.map((event) => {
            // @ts-ignore
            if (event.category && categoryIcons[event.category] && typeof(categoryIcons[event.category]) === 'string' && event.icon === categoryIcons[event.category]){
                event["icon"] = "";
            }
        })

        ReactModalService.openImportEventsConfirmModal(eventStore, {
            eventsToAdd,
            categoriesToAdd,
            errors,
            numOfEventsWithErrors: Object.keys(numOfEventsWithErrors).length
        })
    },
    import:(eventStore: EventStore, info: ImportEventsConfirmInfo) => {
        let categoriesImported = false;
        let eventsImported = false;
        if (info.categoriesToAdd.length > 0) {
            eventStore.setCategories([
                ...eventStore.categories,
                ...info.categoriesToAdd
            ]);
            categoriesImported = true;
        }
        if (info.eventsToAdd.length > 0) {

            const existingSidebarEvents = eventStore.getSidebarEvents;
            const newSidebarEvents: Record<number, SidebarEvent[]> = {...existingSidebarEvents};
            info.eventsToAdd.forEach((event) => {
                event.id = eventStore.createEventId();
                const category = parseInt(event.category!);
                newSidebarEvents[category] = newSidebarEvents[category] || [];
                newSidebarEvents[category].push(event);
            });
            eventStore.setSidebarEvents(newSidebarEvents)
            eventsImported = true;
        }

        return { categoriesImported, eventsImported };
    }
}

export default ImportService;