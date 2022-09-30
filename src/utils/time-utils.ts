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