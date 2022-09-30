import {DEFAULT_EVENT_DURATION} from "./consts";
import {convertMsToHM, padTo2Digits} from "./utils";

export function getDateRangeString(start: Date, end: Date){
    const startDay = start.getDate();
    const endDay = end.getDate();

    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear){
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (startMonth !== endMonth){
        return `${startDay}.${startMonth} - ${endDay}.${endMonth}`
    } else {
        return `${startDay}-${endDay}.${startMonth}`;
    }
}

export function getDurationString(duration: string) {
    if (!duration) {
        return `${DEFAULT_EVENT_DURATION}h`
    } else {
        const minutes = Number(duration.split(':')[1]);
        const hours = Number(duration.split(':')[0]);

        if (minutes) {
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

export function formatDuration(duration: string) {
    const hours = parseInt(duration.split(':')[0]);
    const minutes = parseInt(duration.split(':')[1]);
    const milliseconds = (minutes * 60000) + (hours * 3600000);
    return convertMsToHM(milliseconds);
}

export function getInputDateTimeValue(date: Date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('.')[0];
}

export function getEventDueDate(event: any) {
    const hoursToAdd = 1;
    return event.end ? event.end : addHoursToDate(new Date(event.start), hoursToAdd);
}

export function addHoursToDate(date: Date, hoursToAdd: number) {
    const hourToMilliseconds = 60 * 60 * 1000;
    return new Date(date.setTime(date.getTime() + hoursToAdd * hourToMilliseconds))
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