import {DEFAULT_EVENT_DURATION} from "./consts";
import {TriplanEventPreferredTime, TriplanPriority} from "./enums";
import {EventStore} from "../stores/events-store";
import moment from "moment";
import {EventInput} from "@fullcalendar/react";
import TranslateService from "../services/translate-service";

export function getInputDateTimeValue (date: Date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('.')[0];
}

export function getEventDueDate (event: any){
    const hoursToAdd = 1;
    return event.end ? event.end : addHoursToDate(new Date(event.start), hoursToAdd);
}

export function addHoursToDate (date: Date, hoursToAdd: number) {
    const hourToMilliseconds = 60 * 60 * 1000;
    return new Date(date.setTime(date.getTime() + hoursToAdd * hourToMilliseconds))
}

export function getDurationString (duration: string) {
    if (!duration) {
        return `${DEFAULT_EVENT_DURATION}h`
    } else {
        const minutes = Number(duration.split(':')[1]);
        const hours = Number(duration.split(':')[0]);

        if (minutes){
            return `${hours}h ${minutes}m`;
        }
        return `${Number(hours)}h`;
    }
}

export function getTimeStringFromDate(date: Date) {
    const hours = padTo2Digits(date.getHours());
    const minutes = padTo2Digits(date.getMinutes());
    return `${hours}:${minutes}`;
}

export function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

export function ucfirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function convertMsToHM(milliseconds: number): string {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds = seconds % 60;
    // 👇️ if seconds are greater than 30, round minutes up (optional)
    minutes = seconds >= 30 ? minutes + 1 : minutes;

    minutes = minutes % 60;

    // 👇️ If you don't want to roll hours over, e.g. 24 to 00
    // 👇️ comment (or remove) the line below
    // commenting next line gets you `24:00:00` instead of `00:00:00`
    // or `36:15:31` instead of `12:15:31`, etc.
    hours = hours % 24;

    return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}`;
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

export function validateDuration(duration: string) {
    return (
        duration.split(':').length == 2
        && !Number.isNaN(duration.split(':')[0])
        && !Number.isNaN(duration.split(':')[1])
        && parseInt(duration.split(':')[0]) >= 0
        && parseInt(duration.split(':')[1]) >= 0
        && (parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1])) > 0
    )
}

export function formatDuration(duration: string) {
    const hours = parseInt(duration.split(':')[0]);
    const minutes = parseInt(duration.split(':')[1]);
    const milliseconds = (minutes * 60000) + (hours * 3600000);
    return convertMsToHM(milliseconds);
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

    const priorityToColor: Record<string, string> = {
        [TriplanPriority.must]: '#E06666FF',
        [TriplanPriority.maybe]: '#8E7CC3FF'
    }

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
    calendarEvents.sort((a,b) => (a.start as Date).getTime() - (b.start as Date).getTime()).forEach((event) => {
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

    const notesColor = "#ff5252";
    const todoCompleteColor = "#ff5252";

    Object.keys(calendarEventsPerDay).forEach((dayTitle) => {
        const events = calendarEventsPerDay[dayTitle];
        let highlightEvents = events.filter((x:EventInput) => x.priority && x.priority == TriplanPriority.must).map((x: EventInput) => x.title!.split('-')[0].split('?')[0].trim());
        // @ts-ignore
        highlightEvents = [...new Set(highlightEvents)];
        highlightsPerDay[dayTitle] = highlightEvents.join(", ");

        let previousLineWasOr = false;
        let previousEndTime = 0;
        let counter = 0;
        events.forEach((event: EventInput, index: number) => {
            summaryPerDay[dayTitle] = summaryPerDay[dayTitle] || [];

                if (Object.keys(event).length === 0){
                    summaryPerDay[dayTitle].push(`<span style="padding-inline-start: 20px; font-weight:bold"><u>${or}</u></span>`);
                    previousLineWasOr = true;
                    return;
                }

                if (event.allDay){
                    summaryPerDay[dayTitle].push(`<span style="color:${notesColor}; font-size:10px; font-weight:bold;">${formatDescription(event.description)}</span>`);
                    return;
                }

                const startTime = formatTime((event.start! as Date).toLocaleTimeString());
                const endTime = formatTime((getEventDueDate(event)).toLocaleTimeString());
                const title = event.title;

                const priority = event.priority;
                const color = Object.keys(priorityToColor).includes(priority) ? priorityToColor[priority] : 'inherit';
                const fontWeight = color !== 'inherit' ? 'bold' : 'normal';

                const icon = event.icon || eventStore.categoriesIcons[event.category] || "";
                const iconIndent = icon ? " " : "";

                const indent = !previousLineWasOr && (previousEndTime > (event.start! as Date).getTime()) ? "... " : "";
                previousEndTime = (event.end! as Date).getTime();

                const prefix = previousLineWasOr || indent ? "" : counter === 0 ? startPrefix : index === events.length -1 ? lastPrefix : `${randomElement(middlePrefixes)} `;

                const description = event.description ? `<br>${indent}<span style="color:#999999">${formatDescription(event.description)}</span>` : "";

                const rowStyle = indent ? "color: #999999" : "color:black";

                const taskIndication = taskKeywords.find((x) => title!.toLowerCase().indexOf(x.toLowerCase()) !== -1 || description.toLowerCase().indexOf(x.toLowerCase()) !== -1) ?
                    `<span style="font-size: 22px; padding-inline: 5px; color:${todoCompleteColor}; font-weight:bold;">&nbsp;<u>${todoComplete}</u></span>` : "";

                summaryPerDay[dayTitle].push(`
                    <span class="eventRow" style="${rowStyle}">
                        ${indent}${startTime} - ${endTime} ${prefix}<span style="color: ${color}; font-weight:${fontWeight};">${icon}${iconIndent}${title}${iconIndent}${icon}${taskIndication}</span>${description}
                    </span>
                `);
                previousLineWasOr = false;
                counter++;
            })
        })

    return `
        <div>
            <h3><b><u>${tripSummaryTitle}</b></u></h3>
            ${Object.keys(summaryPerDay).map((dayTitle) => {
                return `
                    <b>${dayTitle}${highlightsPerDay[dayTitle] ? ` (${highlightsPerDay[dayTitle]})` : ""}</b><br>
                    ${summaryPerDay[dayTitle].join("<br/>")}
                `
            }).join("<br/><hr/><br/>")}
        </div>
    `
}