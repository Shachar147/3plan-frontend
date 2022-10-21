import {GoogleTravelMode, TriplanEventPreferredTime, TriplanPriority} from "./enums";
import {EventStore} from "../stores/events-store";
import moment from "moment";
import {EventInput} from "@fullcalendar/react";
import TranslateService from "../services/translate-service";
import {getEventDueDate} from "./time-utils";
import {CalendarEvent, Coordinate, DistanceResult, LocationData} from "./interfaces";
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
            suffix = TranslateService.translate(eventStore, 'DISTANCE.PREFIX.TRANSIT.SUFFIX');
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

export function isMatching(str: string, options: string[]){
    let isMatch = false;
    let idx = 0;
    while (!isMatch && idx < options.length){
        isMatch = str.indexOf(options[idx]) !== -1
        idx++;
    }
    return isMatch;
}

export function containsDuplicates(array: any[]) {
    return array.length !== new Set(array).size;
}

export function lockOrderedEvents(calendarEvent: EventInput) {
    // const isOrdered = isEventAlreadyOrdered(calendarEvent);
    // if (isOrdered) {
    //     calendarEvent.editable = false;
    //     calendarEvent.durationEditable = false;
    //     calendarEvent.disableDragging = true;
    //     calendarEvent.classNames = calendarEvent.classNames ? `${calendarEvent.classNames.toString().replace(' locked','')} locked` : 'locked';
    // } else {
    //     calendarEvent.editable = true;
    //     calendarEvent.durationEditable = true;
    //     calendarEvent.disableDragging = false;
    //     console.log(calendarEvent.classNames)
    //     // try {
    //     //     calendarEvent.classNames = calendarEvent.classNames ? calendarEvent.classNames.replaceAll(/\s*locked/ig, '') : undefined;
    //     // } catch {
    //     //     debugger;
    //     // }
    // }
    return calendarEvent;
}

export function isEventAlreadyOrdered(calendarEvent: EventInput) {
    return calendarEvent?.extendedProps?.description && isMatching(calendarEvent?.extendedProps?.description?.toLowerCase(), ["הוזמן", "ordered"]);
}

export function isDefined (value: any){
    return typeof(value) !== 'undefined';
}