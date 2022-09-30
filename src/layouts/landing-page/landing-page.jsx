import React, {useContext, useEffect, useRef, useState} from "react";
import './landing-page.css';
import {useNavigate} from "react-router-dom";
import TranslateService from "../../services/translate-service";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {setDefaultCalendarLocale} from "../../utils/defaults";
import {renderHeaderLine} from "../../utils/ui-utils";

const LandingPage = () => {

    const eventStore = useContext(eventStoreContext);
    const navigate = useNavigate();

    useEffect(() => {
        document.querySelector("body").classList.remove("rtl");
        document.querySelector("body").classList.remove("ltr");
        document.querySelector("body").classList.add(eventStore.getCurrentDirection())
        setDefaultCalendarLocale(eventStore.calendarLocalCode);
    }, [eventStore.calendarLocalCode])

    return (
        <div className={"landing-page-layout"}>
            {renderHeaderLine(eventStore)}
            <div className={"main-part"}>
                <div className={"plan-your-trip-header main-font"}>
                    {TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
                    <br/>
                    <div className={"trip main-font-heavy"}>{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}</div>
                </div>
                <img className="logo-container" src={"/images/landing-page/main-centered.png"} />
                <div className={"slogan main-font"}>
                    <span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE1')}</span>
                    <span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE2')}</span>
                </div>
                <div className={"start-now-button"} style={{
                    display: "flex",
                    alignContent: "center",
                    justifyContent: "center",
                    gap: "10px"
                }}>
                    <button className={"primary-button main-font"} onClick={() => {
                        navigate('/getting-started')
                    }}>{TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}</button>
                    <button className={"secondary-button black"} onClick={() => {
                        navigate('/my-trips')
                    }}>{TranslateService.translate(eventStore, 'CHECK_OUT_EXISTING_TRIPS')}</button>
                </div>
            </div>
            <div className={"footer main-font"}>
                <a><img src={"/images/landing-page/icons/checklist.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.LIST')}</a>
                <a><img src={"/images/landing-page/icons/calendar.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.ORGANIZE')}</a>
                <a><img src={"/images/landing-page/icons/organized-list.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.SUMMARY')}</a>
            </div>
        </div>
    )
}

export default observer(LandingPage);