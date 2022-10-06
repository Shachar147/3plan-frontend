import {GoogleTravelMode, TriplanEventPreferredTime, TriplanPriority} from "./enums";
import {EventStore} from "../stores/events-store";
import moment from "moment";
import {EventInput} from "@fullcalendar/react";
import TranslateService from "../services/translate-service";
import {getEventDueDate} from "./time-utils";
import {Coordinate, DistanceResult, LocationData} from "./interfaces";
import {runInAction} from "mobx";
import {priorityToColor} from "./consts";

export function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

export function ucfirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// loaders
export const LOADERS = {
    'plane1.gif': {
        backgroundColor: "#fcfff5", // done
        top: '30px',
    },
    'plane2.gif': {
        backgroundColor: "#e2f5fc", // done
        top: '30px',
    },
    'plane3.gif': {
        backgroundColor: "#ffffff", // done
        top: '30px',
    },
    'travel1.gif': {
        backgroundColor: "#676f80", // done
        top: '30px',
        textColor: 'white'
    },
    'travel2.gif': {
        backgroundColor: "#41aeb4", // done
        top: '30px',
        textColor: "white"
    },
    'travel3.gif': {
        backgroundColor: "#c0e2e0", // done
        top: '30px',
    },
    'travel4.gif': {
        backgroundColor: "#a7f1fb", // done
        top: '30px',
    },
    'hotel1.gif': {
        backgroundColor: "#100c33", // done
        top: '30px',
    },
    'hotel2.gif': {
        backgroundColor: "#ef9cc8", // done
        top: '30px',
        textColor: "white"
    },
    'hotel3.gif': {
        backgroundColor: "#ffcb3c", // done
        top: '30px',
    },
    'hotel4.gif': {
        backgroundColor: "#cee7e9", // done
        top: '30px',
    },
    // 'curry.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Griffin.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Harden.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Lebron.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Durant.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Davis.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Love.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Howard.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Westbrook.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'CP3.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Simmons1.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Simmons2.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'GPNt.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'CP3-2.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Ja.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Zion.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'DRose.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Embid.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Giannis.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Kawaii.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Klay.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'KD.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Lebron2.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Wall.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'PG13.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Booker.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Doncic.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'Embid2.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'MJ.gif': {
    //     backgroundColor: 'rgb(200,200,200)',
    //     top: '0px',
    // },
    // 'Griffin3.gif': {
    //     backgroundColor: 'white',
    //     top: '0px',
    // },
    // 'cant.touch.this.gif': {
    //     backgroundColor: "#72AE71",
    //     top: '0px',
    // },
    // 'cp3.fun.size.gif': {
    //     backgroundColor: "#FF6B4A",
    //     top: '0px',
    // },
    // 'curry.lebron.gif': {
    //     backgroundColor: "#283D93",
    //     top: '10px',
    //     textColor: 'white',
    // },
    // 'dunk.gif': {
    //     backgroundColor: "#101F33",
    //     top: '0px',
    //     textColor: 'white',
    // },
    // 'harden-orange.gif': {
    //     backgroundColor: "#FBB24F",
    //     top: '0px',
    // },
    // 'injured.gif': {
    //     backgroundColor: "white",
    //     top: '10px',
    // },
    // 'jordan.gif': {
    //     backgroundColor: "#FF003C",
    //     top: '10px',
    // },
    // 'knowhow.gif': {
    //     backgroundColor: "#FFAD4A",
    //     top: '10px',
    // },
    // 'kobe.gif': {
    //     backgroundColor: "#FFD61B",
    //     top: '10px',
    // },
    // 'legendary.gif': {
    //     backgroundColor: "#5E97DB",
    //     top: '30px',
    //     textColor: 'white',
    // },
    // 'motion.gif': {
    //     backgroundColor: "#FFCE31",
    //     top: '10px',
    // },
    // 'nba51.gif': {
    //     backgroundColor: "#64BAE9",
    //     top: '10px',
    // },
    // 'pg-unlimited.gif': {
    //     backgroundColor: "#F8F7F8",
    //     top: '10px',
    // },
    // 'say.it.to.my.face.gif': {
    //     backgroundColor: "#7BBD73",
    //     top: '0px',
    // },
    // 'shaq.gif': {
    //     backgroundColor: "#FFFFFF",
    //     top: '0px',
    // },
    // 'spin.gif': {
    //     backgroundColor: "#E7524A",
    //     top: '0px',
    //     textColor: "white",
    // },
    // 'undersized.gif': {
    //     backgroundColor: "#FFB247",
    //     top: '10px',
    // },
    // 'wilt.gif': {
    //     backgroundColor: "#102031",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'winner.gif': {
    //     backgroundColor: "#FF6342",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'magic.gif': {
    //     backgroundColor: "#31121A",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'Kareem.gif': {
    //     backgroundColor: "#102031",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'moon.gif': {
    //     backgroundColor: "#102031",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'lebron-king.gif': {
    //     backgroundColor: "#FEA521",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'kd-dude.gif': {
    //     backgroundColor: "#FFB247",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'rocket.gif': {
    //     backgroundColor: "#60BBFF",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'rain.gif': {
    //     backgroundColor: "#4A5A7B",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'nba-colors.gif': {
    //     backgroundColor: "#D2C7D8",
    //     top: '-30px',
    //     textColor: 'black',
    // },
    // 'cheff-curry.gif': {
    //     backgroundColor: "#E6F7F5",
    //     top: '20px',
    //     textColor: 'black',
    // },
    // 'cheff-curry-2.gif': {
    //     backgroundColor: "#A9D5E2",
    //     top: '-20px',
    //     textColor: 'white',
    // },
    // 'burger.gif': {
    //     backgroundColor: "#5E97DB",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'between-the-legs.gif': {
    //     backgroundColor: "#1A75CF",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'coach.gif': {
    //     backgroundColor: "#B4C8D3",
    //     top: '-20px',
    //     textColor: 'white',
    // },
    // 'derozen.gif': {
    //     backgroundColor: "#B9444C",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'girl.gif': {
    //     backgroundColor: "#B9444C",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'lebron-pixel.gif': {
    //     backgroundColor: "#B61936",
    //     top: '20px',
    //     textColor: 'white',
    // },
    // 'girl2.gif': {
    //     backgroundColor: "#FC5F60",
    //     top: '20px',
    //     textColor: 'white',
    // },
}
export function shuffle(array: any[]) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}
export const LOADER_DETAILS = () => {
    const options = shuffle(Object.keys(LOADERS));

    // @ts-ignore
    let option = LOADERS[options[0]];

    option.loader = `/loaders/${options[0]}`;
    return option;
}

export function getClasses(...classes: any[]): string {
    return classes.filter(Boolean).join(" ");
    // return _.flatten(classes).filter(Boolean).join(' ');
}

export function priorityKeyToValue(priority: string){
    const values = Object.keys(TriplanPriority).filter((x) => !Number.isNaN(Number(x)));
    const keys = Object.values(TriplanPriority).filter((x) => Number.isNaN(Number(x)));

    let result = TriplanPriority.unset;

    keys.forEach((key, index) => {
        if (priority && priority.toString() === keys[index].toString()) {
            result = values[index] as unknown as TriplanPriority;
        }
    });
    return result;
}

export function preferredTimeKeyToValue(preferredTime: string){
    const values = Object.keys(TriplanEventPreferredTime).filter((x) => !Number.isNaN(Number(x)));
    const keys = Object.values(TriplanEventPreferredTime).filter((x) => Number.isNaN(Number(x)));

    let result = TriplanEventPreferredTime.unset;

    keys.forEach((key, index) => {
        if (preferredTime && preferredTime.toString() === keys[index].toString()) {
            result = values[index] as unknown as TriplanEventPreferredTime;
        }
    });
    return result;
}

export function addLineBreaks(str: string, replaceWith: string){
    return str.replace(/\\n/ig, replaceWith)
}

export function buildHTMLSummary(eventStore: EventStore) {

    const getDayName = (dateStr: string, locale: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale, { weekday: 'long' });
    }

    const formatTime = (timeString: string) =>  moment(timeString, ["h:mm A"]).format("HH:mm");

    const randomElement = (array:any[]) => array[Math.floor(Math.random() * array.length)];

    const formatDescription = (description: string) =>
        description.replaceAll('&#10;', '<br/>')
            .replaceAll('\n',"<br/>")
            .replaceAll('<br/><br/>',"<br/>");

    const calendarEvents = eventStore.calendarEvents;

    const summaryPerDay: Record<string, string[]> = {};

    // todo complete - lokalise
    const startPrefix = TranslateService.translate(eventStore, 'TRIP_SUMMARY.START_PREFIX');
    const lastPrefix = TranslateService.translate(eventStore, 'TRIP_SUMMARY.LAST_PREFIX');
    const middlePrefixes = [
        TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX1'),
        TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX2'),
        TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX3'),
        TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX4'),
        "",
        "",
        "",
        "",
        ""
    ];
    const or = TranslateService.translate(eventStore, 'TRIP_SUMMARY.OR');
    const tripSummaryTitle = TranslateService.translate(eventStore, 'TRIP_SUMMARY.TITLE');
    const taskKeywords = [
        "לברר",
        "לבדוק",
        "להזמין",
        "להשלים",
        "צריך להחליט",
        "צריך לנסות",
        "need to decide",
        "todo",
        "need to check",
    ];
    const todoComplete = TranslateService.translate(eventStore, 'TRIP_SUMMARY.TODO_COMPLETE');

    const calendarEventsPerDay:Record<string, EventInput> = {};

    let lastDayTitle = "";
    let lastStart = 0;
    let lastEnd = 0;

    let sortedEvents = calendarEvents.sort((a,b) => {
        const aTime = (a.start as Date).getTime();
        const bTime = (b.start as Date).getTime();
        if (aTime === bTime){
            const aEndTime = (a.end as Date).getTime();
            const bEndTime = (b.end as Date).getTime();
            return bEndTime - aEndTime;
        }
        return aTime - bTime;
    });

    // sortedEvents = sortedEvents.filter((x) => new Date(x.start!.toString()).toLocaleDateString() === '12/6/2022');
    // console.log(sortedEvents);
    // debugger;

    sortedEvents.forEach((event) => {
        event.extendedProps = event.extendedProps || {};

        const clonedEvent = {...event, ...event.extendedProps};
        const dtStartName = getDayName(clonedEvent.start!.toString(), eventStore.calendarLocalCode);

        const parts = (clonedEvent.start! as Date).toLocaleDateString().replace(/\//ig,'-').split('-')
        const dtStart = [padTo2Digits(Number(parts[1])), padTo2Digits(Number(parts[0])), parts[2]].join("/")

        const dayTitle = `${dtStartName} - ${dtStart}`;

        calendarEventsPerDay[dayTitle] = calendarEventsPerDay[dayTitle] || [];

        if (lastDayTitle === dayTitle && (event.start as Date).getTime() === lastStart && (event.end as Date).getTime() === lastEnd) {
            calendarEventsPerDay[dayTitle].push({});
        }
        // @ts-ignore
        calendarEventsPerDay[dayTitle].push(clonedEvent);

        lastDayTitle = dayTitle;
        lastStart = (event.start as Date).getTime();
        lastEnd = getEventDueDate(event).getTime();
    });

    const highlightsPerDay: Record<string, string> = {};

    const notesColor = "#52a4ff"; // "#ff5252";
    const todoCompleteColor = "#ff5252";

    const showIcons = true;

    Object.keys(calendarEventsPerDay).forEach((dayTitle) => {
        const events = calendarEventsPerDay[dayTitle];
        const eventDistanceKey: Record<number, string> = {};

        let prevLocation: LocationData | undefined;
        for (let i=0; i< events.length; i++){
            const event = events[i];
            if (Object.keys(event).length === 0) { continue; }
            const thisLocation = event.extendedProps.location;
            // @ts-ignore
            if (thisLocation && prevLocation &&
                prevLocation.longitude && prevLocation.latitude &&
                thisLocation.longitude && thisLocation.latitude &&
                !(thisLocation.longitude === prevLocation.longitude && thisLocation.latitude === prevLocation.latitude)
            ){

                const prevCoordinate = {
                    lng: prevLocation.longitude!,
                    lat: prevLocation.latitude!
                };
                const thisCoordinate = {
                    lng: thisLocation.longitude!,
                    lat: thisLocation.latitude!
                };

                const key = getCoordinatesRangeKey(eventStore.travelMode, prevCoordinate, thisCoordinate);
                eventDistanceKey[event.id] = key;
                if (!eventStore.distanceResults.has(key)){
                    runInAction(() => {
                        console.log(`checking distance between`,prevLocation?.address,` and `,thisLocation.address, prevCoordinate, thisCoordinate);
                        eventStore.calculatingDistance = eventStore.calculatingDistance + 1;

                        // @ts-ignore
                        window.calculateMatrixDistance(eventStore, prevCoordinate, thisCoordinate);
                    });
                } else {

                    if (event.start.toLocaleDateString() === '12/6/2022') {
                        console.log(`already have distance between`, prevLocation.address, ` and `, thisLocation.address);
                    }
                }
            }

            // set prev location to this location only if next line is not OR.
            if (!(i+1 < events.length && Object.keys(events[i+1]).length === 0)){
                prevLocation = thisLocation;
            }
        }

        let highlightEvents = events.filter((x:EventInput) => x.priority && x.priority == TriplanPriority.must).map((x: EventInput) => x.title!.split('-')[0].split('?')[0].trim());
        // @ts-ignore
        highlightEvents = [...new Set(highlightEvents)];
        highlightsPerDay[dayTitle] = highlightEvents.join(", ");

        let previousLineWasOr = false;
        let previousEndTime = 0;
        let prevEventTitle: string;
        let counter = 0;
        prevLocation = undefined;
        const orBackgroundStyle = '; background-color: #f2f2f2; padding-block: 2.5px;';
        events.forEach((event: EventInput, index: number) => {
            summaryPerDay[dayTitle] = summaryPerDay[dayTitle] || [];

                if (Object.keys(event).length === 0){
                    summaryPerDay[dayTitle].push(`<span style="padding-inline-start: 20px; font-weight:bold ${orBackgroundStyle}"><u>${or}</u></span>`);
                    previousLineWasOr = true;
                    return;
                }

                const nextLineIsOr = index + 1 < events.length && Object.keys(events[index+1]).length === 0;

                if (event.allDay){
                    summaryPerDay[dayTitle].push(`<span style="color:${notesColor}; font-size:10px; font-weight:bold;">${formatDescription(event.description)}</span>`);
                    return;
                }

                const startTime = formatTime((event.start! as Date).toLocaleTimeString());
                const endTime = formatTime((getEventDueDate(event)).toLocaleTimeString());
                const title = event.title;

                const priority = event.priority;
                const color =
                    [TriplanPriority.must.toString(), TriplanPriority.maybe.toString()].indexOf(priority) !== -1 &&
                    Object.keys(priorityToColor).includes(priority) ?
                        priorityToColor[priority] :
                        'inherit';
                const fontWeight = color !== 'inherit' ? 'bold' : 'normal';

                const icon = showIcons ? event.icon || eventStore.categoriesIcons[event.category] || "" : "";
                const iconIndent = icon ? " " : "";

                const subItemIcon = eventStore.getCurrentDirection() === 'rtl' ? '↵' : '↳';
                const indent = !previousLineWasOr && (previousEndTime > (event.start! as Date).getTime()) ? subItemIcon + " " : "";
                previousEndTime = (event.end! as Date).getTime();

                const prefix = previousLineWasOr || nextLineIsOr || indent ? "" : counter === 0 ? startPrefix : index === events.length -1 ? lastPrefix : `${randomElement(middlePrefixes)} `;

                const description = event.description ? `<br><span style="opacity:0;">${indent}</span><span style="color:#999999">${formatDescription(event.description)}</span>` : "";

                let rowStyle = indent ? "color: #999999" : "color:black";

                let backgroundStyle = "";
                if (previousLineWasOr || (index+1 < events.length && Object.keys(events[index+1]).length === 0)) {
                    backgroundStyle = orBackgroundStyle;
                    rowStyle += backgroundStyle;
                }

                const taskIndication = taskKeywords.find((x) => title!.toLowerCase().indexOf(x.toLowerCase()) !== -1 || description.toLowerCase().indexOf(x.toLowerCase()) !== -1) ?
                    `<span style="font-size: 22px; padding-inline: 5px; color:${todoCompleteColor}; font-weight:bold;">&nbsp;<u>${todoComplete}</u></span>` : "";

                let distanceKey = Object.keys(eventDistanceKey).includes(event.id!) ?
                    eventDistanceKey[Number(event.id!)] : undefined;

                // test
                let travelMode = eventStore.travelMode;
                if (distanceKey && eventStore.distanceResults.has(distanceKey) && eventStore.distanceResults.has(distanceKey.replace('DRIVING','WALKING'))) {
                    if (
                        eventStore.distanceResults.get(distanceKey)!.duration_value! >
                        eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!.duration_value!
                         ||
                        (eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!.duration_value! < 10 * 60)
                    ) {
                        distanceKey = distanceKey.replace('DRIVING', 'WALKING');
                        travelMode = GoogleTravelMode.WALKING;
                    }
                }

                let distanceToNextEvent =
                    distanceKey ?
                        eventStore.distanceResults.has(distanceKey) ?
                            toDistanceString(eventStore, eventStore.distanceResults.get(distanceKey)!, travelMode) :
                        TranslateService.translate(eventStore, 'CALCULATING_DISTANCE')
                    : "";

                // const from = previousLineWasOr ? `${TranslateService.translate(eventStore, 'FROM')} ${prevEventTitle} ` : "";

                if (distanceToNextEvent !== "") {
                    const arrow = eventStore.getCurrentDirection() === 'rtl' ? '✈' : '✈'
                    const distanceColor = distanceToNextEvent.indexOf(TranslateService.translate(eventStore,'DISTANCE.ERROR.NO_POSSIBLE_WAY')) !== -1 ? '#ff5252' : 'rgba(55,181,255,0.6)';
                    distanceToNextEvent = `<span style="color: ${distanceColor}; ${backgroundStyle}">
                                ${arrow}
                                ${distanceToNextEvent} ${TranslateService.translate(eventStore, 'FROM')}${prevLocation?.address.split(' - ')[0]} ${TranslateService.translate(eventStore, 'TO')}${event.location.address.split(' - ')[0]}
                            </span>`;
                }

                if (distanceToNextEvent !== "") {
                    summaryPerDay[dayTitle].push(distanceToNextEvent);
                }

                summaryPerDay[dayTitle].push(`
                    <span class="eventRow" style="${rowStyle}">
                        ${icon}${iconIndent}${indent}${startTime} - ${endTime} ${prefix}<span style="color: ${color}; font-weight:${fontWeight};">${title}${taskIndication}</span>${description}
                    </span>
                `);

                if (!previousLineWasOr && !nextLineIsOr) {
                    prevLocation = event.location;
                }

                previousLineWasOr = false;
                counter++;
                prevEventTitle = title!;
            })
        })

    return `
        <div style="max-width: 990px;">
            <h3><b><u>${tripSummaryTitle}</b></u></h3>
            ${Object.keys(summaryPerDay).map((dayTitle) => {
                const highlights = highlightsPerDay[dayTitle] ? ` (${highlightsPerDay[dayTitle]})` : "";
                return `
                    <b>${dayTitle}</b><span style="font-size:9px;">${highlights}</span><br>
                    ${summaryPerDay[dayTitle].join("<br/>")}
                `
            }).join("<br/><hr/><br/>")}
        </div>
    `
}

export function getCoordinatesRangeKey(travelMode: string, startDestination: Coordinate, endDestination: Coordinate){
    return `[${travelMode}] ${startDestination.lat},${startDestination.lng}-${endDestination.lat},${endDestination.lng}`;
}

export function toDistanceString(eventStore: EventStore, distanceResult: DistanceResult, travelMode?: GoogleTravelMode){
    let duration = distanceResult.duration;
    let distance = distanceResult.distance;

    if (duration.indexOf('day') !== -1){
        return '';
    }

    if (!travelMode){
        travelMode = eventStore.travelMode
    }

    const reachingTo = TranslateService.translate(eventStore, 'REACHING_TO_NEXT_DESTINATION');

    // means there are no ways to get there in this travel mode
    if (distance === "-" || duration === "-"){
        return (
            `${reachingTo}: ${TranslateService.translate(eventStore, 'DISTANCE.ERROR.NO_POSSIBLE_WAY')}${TranslateService.translate(eventStore, 'TRAVEL_MODE.' + eventStore.travelMode.toUpperCase())}`
        )
    }

    duration = duration.replaceAll("mins", TranslateService.translate(eventStore, 'DURATION.MINS'));
    duration = duration.replaceAll("min", TranslateService.translate(eventStore, 'DURATION.MIN'));
    duration = duration.replaceAll("hours", TranslateService.translate(eventStore, 'DURATION.HOURS'));
    duration = duration.replaceAll("hour", TranslateService.translate(eventStore, 'DURATION.HOUR'));

    duration = duration.replaceAll("1 שעה","שעה");
    duration = duration.replaceAll("1 דקה","דקה");

    distance = distance.replaceAll("km", TranslateService.translate(eventStore, 'DISTANCE.KM'));
    distance = distance.replaceAll("m", TranslateService.translate(eventStore, 'DISTANCE.M'));

    let prefix, suffix;

    switch(travelMode){
        case GoogleTravelMode.TRANSIT:
            prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.DRIVING');
            suffix = TranslateService.translate(eventStore, 'DISTANCE.SUFFIX.TRANSIT');
            return `${reachingTo}: ${prefix} ${duration} (${distance}) ${suffix}`;
        case GoogleTravelMode.DRIVING:
            prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.DRIVING');
            return `${reachingTo}: ${prefix} ${duration} (${distance})`;
        case GoogleTravelMode.WALKING:
            prefix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.WALKING');
            return `${reachingTo}: ${prefix} ${duration} (${distance})`;
        default:
            return '';
    }
}

export function containsDuplicates(array: any[]) {
    return array.length !== new Set(array).size;


}