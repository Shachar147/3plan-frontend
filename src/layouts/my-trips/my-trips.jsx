import React, {useContext, useEffect, useState} from "react";
import './my-trips.scss';
import { useNavigate } from "react-router-dom";
import TranslateService from "../../services/translate-service";
import {eventStoreContext} from "../../stores/events-store";
import {observer} from "mobx-react";
import {renderFooterLine, renderHeaderLine} from "../../utils/ui-utils";
import {getClasses} from "../../utils/utils";
import ReactModalService from "../../services/react-modal-service";
import DataServices, {Trip, tripNameToLSTripName} from "../../services/data-handlers/data-handler-base";

const dataService = DataServices.LocalStorageService;
const MyTrips = () => {

    const [applyPageIntro, setApplyPageIntro] = useState(false);
    const [applyFadeIn, setApplyFadeIn] = useState(false);
    const eventStore = useContext(eventStoreContext);
    const navigate = useNavigate();

    // const [dbTrips, setDBTrips] = useState([]);

    useEffect(() => {
        setTimeout(() => {
            setApplyPageIntro(true);

            setTimeout(() => {
                setApplyFadeIn(true);
            }, 200)

        }, 500);

        // if (getUser()) {
        //     DBService.getTrips((response) => {
        //         setDBTrips(response.data.data)
        //     });
        // }

    }, []);

    useEffect(() => {
        document.querySelector("body").classList.remove("rtl");
        document.querySelector("body").classList.remove("ltr");
        document.querySelector("body").classList.add(eventStore.getCurrentDirection())
        dataService.setCalendarLocale(eventStore.calendarLocalCode);
    }, [eventStore.calendarLocalCode])

    const renderForm = () => {
        // const getTripName = (x) => {
        //     return x.replace(LS_CUSTOM_DATE_RANGE + "-","");
        // }
        //
        // const lsTrips = Object.keys(localStorage).filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1);

        const lsTrips = dataService.getTrips(eventStore);

        return (
            <div className={getClasses(["my-trips bright-scrollbar"], eventStore.isListView && 'hidden')}>
                {
                    lsTrips.map((trip) => {
                        const tripName = trip.name;
                        const LSTripName = tripNameToLSTripName(tripName);
                        const dates = trip.dateRange;

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
                                        gap: "10px",
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
                                            ReactModalService.openDeleteTripModal(eventStore, LSTripName);
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
            <div className={getClasses(["main-part"])}>
                <div className={getClasses(["plan-your-trip-header main-font visible"], applyPageIntro && 'hidden')}>
                    {TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
                    <br/>
                    <div className={"trip main-font-heavy"}>{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}</div>
                </div>
                <img className={getClasses(["logo-container pointer"], applyPageIntro && 'up')} src={"/images/logo/new-logo.png"} style={{ width: "50%", minWidth: "400px" }} onClick={() => {
                    navigate('/home');
                }} />
                <div className={getClasses(["create-new-trip-form display-none"], applyPageIntro && 'shown', applyFadeIn && 'fadeIn')}>
                    {renderForm()}
                </div>

            </div>
            {renderFooterLine(eventStore, applyPageIntro && 'hidden')}
        </div>
    )
}

export default observer(MyTrips);