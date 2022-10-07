import {getClasses} from "../../../utils/utils";
import {setDefaultCustomDateRange} from "../../../utils/defaults";
import TranslateService from "../../../services/translate-service";
import React, {useContext} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {CustomDateRange} from "../../../utils/interfaces";
import Button, {ButtonFlavor} from "../../common/button/button";

export interface CustomDatesSelectorProps {
    customDateRange: CustomDateRange,
    setCustomDateRange: (newRange: CustomDateRange) => void,
    TriplanCalendarRef?: React.MutableRefObject<any>,
}

const CustomDatesSelector = (props: CustomDatesSelectorProps) => {

    const eventStore = useContext(eventStoreContext);
    const { customDateRange, setCustomDateRange, TriplanCalendarRef } = props;

    return (
        <div className={getClasses(["custom-dates-container"], !eventStore.isCalendarView && 'hidden')}>
            <div className={"custom-dates-line"}>
                <input type={"date"} value={customDateRange.start} onChange={(e) => {
                    const value = e.target.value;
                    const newCustomDateRange = {
                        start: value,
                        end: customDateRange.end
                    };
                    console.log(newCustomDateRange);
                    setCustomDateRange(newCustomDateRange);
                    eventStore.setCustomDateRange(newCustomDateRange);
                    setDefaultCustomDateRange(newCustomDateRange, eventStore.tripName);
                    TriplanCalendarRef?.current?.switchToCustomView();
                }}/>
                <input type={"date"} value={customDateRange.end} onChange={(e) => {
                    const value = e.target.value;
                    const newCustomDateRange = {
                        start: customDateRange.start,
                        end: value
                    };
                    console.log(newCustomDateRange);
                    setCustomDateRange(newCustomDateRange);
                    eventStore.setCustomDateRange(newCustomDateRange);
                    setDefaultCustomDateRange(newCustomDateRange, eventStore.tripName);
                    TriplanCalendarRef?.current?.switchToCustomView();
                }}
                />
            </div>
            <div className={"custom-dates-submit"}>
                <Button
                    flavor={ButtonFlavor.secondary}
                    className={"black"}
                    onClick={() => {
                        if (TriplanCalendarRef && TriplanCalendarRef.current) {
                            TriplanCalendarRef.current.switchToCustomView();
                        }
                    }} text={TranslateService.translate(eventStore, 'CUSTOM_DATES.CHANGE_DATES')} />
            </div>
        </div>
    );
}

export default CustomDatesSelector;