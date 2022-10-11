import React, {useContext, useEffect, useState} from "react";
import './my-trips.scss';
import { useNavigate } from "react-router-dom";
import TranslateService from "../../services/translate-service";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {
    LS_CUSTOM_DATE_RANGE,
    setDefaultCalendarLocale,
} from "../../utils/defaults";
import {renderFooterLine, renderHeaderLine} from "../../utils/ui-utils";
import {getClasses} from "../../utils/utils";
import ModalService from "../../services/modal-service";
import ReactModalService from "../../services/react-modal-service";
import {runInAction} from "mobx";

const MyTrips = () => {

    const [applyPageIntro, setApplyPageIntro] = useState(false);
    const [applyFadeIn, setApplyFadeIn] = useState(false);
    const eventStore = useContext(eventStoreContext);
    const navigate = useNavigate();

    useEffect(() => {
        setTimeout(() => {
            setApplyPageIntro(true);
            console.log("here");

            setTimeout(() => {
                setApplyFadeIn(true);
                console.log("there");
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
            <div className={getClasses(["my-trips"], eventStore.isListView && 'hidden')}>
                {
                    Object.keys(localStorage).filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1).map((x) => x.replace(LS_CUSTOM_DATE_RANGE + "-","")).map((LSTripName) => {
                        LSTripName = LSTripName === LS_CUSTOM_DATE_RANGE ? "" : LSTripName;
                        const tripName = LSTripName !== "" ? LSTripName.replaceAll("-"," ") : "";
                        const key = tripName.length ? [LS_CUSTOM_DATE_RANGE,LSTripName].join("-") : LS_CUSTOM_DATE_RANGE;
                        const dates = JSON.parse(localStorage.getItem(key));

                        const start = `${dates.start.split('-')[2]}.${dates.start.split('-')[1]}`;
                        const end = `${dates.end.split('-')[2]}.${dates.end.split('-')[1]}`;
                        const amountOfDays = parseInt(((new Date(dates.end) - new Date(dates.start)) / 86400000).toString()) + 1;

                        if (tripName === "") return <></>

                        return (
                            <div className="sidebar-statistics main-font"
                                 onClick={() => {
                                     navigate("/plan/" + LSTripName);
                                 }}
                                 style={{
                                     paddingInlineStart: "10px",
                                     cursor: "pointer",
                                     backgroundColor: "rgba(229, 233, 239, 0.5)",
                                     borderBottom: "1px solid rgb(229, 233, 239)",
                                     minHeight: "45px"
                                 }}>
                                <i className="fa fa-plane" aria-hidden="true"></i>
                                <span style={{
                                    maxWidth: "200px"
                                }}>{tripName}</span>
                                <div>{end} - {start}</div>
                                <div>({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})</div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        flexGrow: 1,
                                        paddingInline: "10px",
                                        gap: "5px",
                                        color: "var(--gray)"
                                    }}>
                                        <i className="fa fa-pencil-square-o" aria-hidden="true"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                if (Object.keys(eventStore.modalValues).length === 0) {
                                                    eventStore.modalValues.name = LSTripName !== "" ? LSTripName.replaceAll("-", " ") : "";
                                                }
                                                ReactModalService.openEditTripModal(eventStore, LSTripName);
                                        }}></i>
                                        <i className="fa fa-trash-o" aria-hidden="true" style={{
                                            position: "relative",
                                            top: "-1px"
                                        }} onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            ModalService.openDeleteTripModal(eventStore, LSTripName);
                                        }}></i>
                                </div>
                            </div>
                        )
                    })
                }
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
                <img className={getClasses(["logo-container pointer"], applyPageIntro && 'up')} src={"/images/landing-page/main-centered.png"} onClick={() => {
                    navigate('/');
                }} />
                <div className={getClasses(["create-new-trip-form display-none"], applyPageIntro && 'shown', applyFadeIn && 'fadeIn')}>

                    {renderForm()}

                </div>

            </div>
            {renderFooterLine(eventStore, applyPageIntro && 'up2')}
        </div>
    )
}

export default observer(MyTrips);