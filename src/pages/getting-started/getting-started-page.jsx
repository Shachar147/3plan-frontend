import React, {useContext, useEffect, useState} from "react";
import './getting-started-page.css';
import { useHistory } from "react-router-dom";
import TranslateService from "../../services/translate-service";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {defaultCustomDateRange, setDefaultCalendarLocale, setDefaultCustomDateRange} from "../../utils/defaults";
import {renderHeaderLine} from "../../utils/uiUtils";
import {getClasses} from "../../utils/utils";

const GettingStartedPage = () => {

    const [applyPageIntro, setApplyPageIntro] = useState(false);
    const [applyFadeIn, setApplyFadeIn] = useState(false);
    const eventStore = useContext(eventStoreContext);
    const history = useHistory();

    const [customDateRange, setCustomDateRange] = useState(defaultCustomDateRange());
    const [tripName, setTripName] = useState(undefined);

    useEffect(() => {
        setTimeout(() => {
            setApplyPageIntro(true);

            setTimeout(() => {
                setApplyFadeIn(true);
            }, 200)

        }, 500)
    }, []);

    useEffect(() => {
        document.querySelector("body").classList.remove("rtl");
        document.querySelector("body").classList.remove("ltr");
        document.querySelector("body").classList.add(eventStore.getCurrentDirection())
        setDefaultCalendarLocale(eventStore.calendarLocalCode);
    }, [eventStore.calendarLocalCode])

    const renderForm = () => {
        return (
            <div className={getClasses(["custom-dates-container"], eventStore.isListView && 'hidden')} style={{
                backgroundColor: "transparent",
                border: 0
            }}>
                <div className={"main-font"} style={{
                    fontSize: "20px"
                }}>
                    {TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
                </div>
                <div className={"custom-dates-line"}>
                    <input type={"text"} style={{
                        paddingInline: "15px",
                        height: "40px"
                    }} placeholder={TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')} value={tripName} onChange={(e) => {
                        const value = e.target.value;
                        setTripName(value);
                    }}/>
                </div>
                <div className={"main-font"} style={{
                    fontSize: "20px"
                }}>
                    {TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHEN_IS_YOUR_TRIP')}
                </div>
                <div className={"custom-dates-line"}>
                    <input type={"date"} value={customDateRange.start} onChange={(e) => {
                        const value = e.target.value;
                        setCustomDateRange({
                            start: value,
                            end: customDateRange.end
                        })
                    }}/>
                    <input type={"date"} value={customDateRange.end} onChange={(e) => {
                        const value = e.target.value;
                        setCustomDateRange({
                            start: customDateRange.start,
                            end: value
                        })}}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={"landing-page-layout"}>
            {renderHeaderLine(eventStore)}
            <div className={getClasses(["main-part"], applyPageIntro && 'overflow-hidden')}>
                <div className={getClasses(["plan-your-trip-header main-font visible"], applyPageIntro && 'hidden')}>
                    {TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
                    <br/>
                    <div className={"trip main-font-heavy"}>{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}</div>
                </div>
                <img className={getClasses(["logo-container"], applyPageIntro && 'up')} style={{ cursor: "pointer" }} src={"/images/landing-page/main-centered.png"} onClick={() => {
                    history.push('/');
                }} />
                <div className={getClasses(["create-new-trip-form display-none"], applyPageIntro && 'shown', applyFadeIn && 'fadeIn')}>

                    {renderForm()}

                </div>
                <div className={getClasses(["slogan main-font"], applyPageIntro && 'up2')}>
                    <span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE1')}</span>
                    <span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE2')}</span>
                </div>

                <div className={getClasses(["start-now-button"], applyPageIntro && 'up2')} style={{
                    display: "flex",
                    alignContent: "center",
                    justifyContent: "center",
                    gap: "10px"
                }}>
                    <button className={"primary-button main-font"} disabled={!tripName} title={!tripName ? TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.FILL_IN_TRIP_NAME') : undefined} onClick={() => {
                        const TripName = tripName.replace(/\s/ig, "-");
                        eventStore.setCustomDateRange(customDateRange);
                        setDefaultCustomDateRange(customDateRange, TripName);
                        history.push('/plan/' + TripName + '/' + eventStore.calendarLocalCode)
                    }}>{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.CREATE_NEW_TRIP')}</button>
                    <button className={"secondary-button black"} onClick={() => {
                        history.push('/my-trips')
                    }}>{TranslateService.translate(eventStore, 'CHECK_OUT_EXISTING_TRIPS')}</button>
                </div>

            </div>
            <div className={getClasses(["footer main-font"], applyPageIntro && 'up2')}>
                <a><img src={"/images/landing-page/icons/checklist.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.LIST')}</a>
                <a><img src={"/images/landing-page/icons/calendar.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.ORGANIZE')}</a>
                <a><img src={"/images/landing-page/icons/organized-list.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.SUMMARY')}</a>
            </div>
        </div>
    )
}

export default observer(GettingStartedPage);