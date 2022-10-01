import TranslateService from "../services/translate-service";
import React from "react";
import {EventStore} from "../stores/events-store";
import {Link, useNavigate} from "react-router-dom";
import Button, {ButtonFlavor} from "../components/common/button/button";
import ToggleButton from "../components/toggle-button/toggle-button";
import {ViewMode} from "./enums";
import {getClasses} from "./utils";
import TriplanTag from "../components/common/triplan-tag/triplan-tag";

const renderLanguageSelector = (eventStore: EventStore) => (
    <select id="locale-selector" className={"main-font"} onChange={(e) => {
        // @ts-ignore
        eventStore.setCalendarLocalCode(e.target.value);
    }} value={eventStore.calendarLocalCode}>
        <option value="en">{TranslateService.translate(eventStore, 'ENGLISH')}</option>
        <option value="he">{TranslateService.translate(eventStore, 'HEBREW')}</option>
    </select>
)

export interface HeaderLineOptions {
    withLogo?: boolean
    withRecommended?: boolean
    withSearch?: boolean
    withViewSelector?: boolean
    withFilterTags?: boolean
}

export const renderHeaderLine = (eventStore: EventStore, options: HeaderLineOptions = {}) => {

    const {
        withLogo = false,
        withRecommended = true,
        withSearch = false,
        withFilterTags = false,
        withViewSelector = false,
    } = options;

    const navigate = useNavigate();

    return (
        <div className={"header"} style={{height: 'fit-content'}}>
            <div className={"start-side"}>
                <div className={"choose-language main-font"}>
                    <a>
                        <img alt="" src={"/images/landing-page/icons/choose-lang.png"}/> {TranslateService.translate(eventStore, 'CHOOSE_LANGUAGE')}
                    </a>
                    {renderLanguageSelector(eventStore)}
                </div>
            </div>
            {/*<div className={"middle"}>*/}
            {/*    */}
            {/*</div>*/}
            <div className={"end-side"}>
                {withFilterTags && renderFilterTags(eventStore)}
                {withSearch && renderSearch(eventStore)}
                {withViewSelector && renderViewSelector(eventStore)}
                {withLogo && <div
                    className="header-logo"
                    onClick={() => {
                        navigate('/');
                    }}
                    style={{ cursor:"pointer", display: "flex", maxHeight: "40px", height: "40px"}}>
                        <img alt={""} src={"/images/logo/logo-icon.png"}/>
                    </div>
                }
                {withRecommended && renderMyTrips(eventStore)}
            </div>
        </div>
    );
}

const renderMyTrips = (eventStore: EventStore) => (
    <div className={"recommended-destinations main-font"}>
        <Link to={"/my-trips"} style={{
            textDecoration: "none"
        }}>
            <Button
                flavor={ButtonFlavor.link}
                image={"/images/landing-page/icons/map.png"}
                text={TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS')}
                onClick={() => {}}
            />
        </Link>
    </div>
);

const renderSearch = (eventStore: EventStore) => {
    return (
        <div className={"search-container"}>
            <input type={"text"} name={"fc-search"} value={eventStore.searchValue} onChange={(e) => {
                eventStore.setSearchValue(e.target.value);
            }} placeholder={TranslateService.translate(eventStore,"SEARCH_PLACEHOLDER")} />
        </div>
    )
}

const renderFilterTags = (eventStore: EventStore) => {
    return (
        <div className={"filter-tags-container"}>
            {
                eventStore.showOnlyEventsWithNoLocation && (
                    <TriplanTag
                        text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION.FILTER_TAG')}
                        onDelete={() => {
                            eventStore.setShowOnlyEventsWithNoLocation(false);
                        }}/>
                )
            }
        </div>
    )
}

const renderViewSelector = (eventStore: EventStore) => {
    return (
        <div className={"view-selector"} key={`view-selector-${eventStore.calendarLocalCode}`}>
            <ToggleButton
                value={eventStore.viewMode}
                onChange={(newVal) => eventStore.setViewMode(newVal as ViewMode)}
                options={[
                    {
                        key: ViewMode.calendar,
                        name: TranslateService.translate(eventStore, 'BUTTON_TEXT.CALENDAR_VIEW'),
                        icon: (<i className="fa fa-calendar black-color" aria-hidden="true"></i>),
                        // iconActive: (<i className="fa fa-calendar blue-color" aria-hidden="true"></i>)
                    },
                    {
                        key: ViewMode.list,
                        name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW'),
                        icon: (<i className="fa fa-list black-color" aria-hidden="true"></i>),
                        // iconActive: (<i className="fa fa-list blue-color" aria-hidden="true"></i>)
                    }
                ]}
                customStyle="white"
            />
        </div>
    )
}

export const renderFooterLine = (eventStore: EventStore, classList?: string) => (
    <div className={getClasses(["footer main-font"], classList)}>
        <a><img alt="" src={"/images/landing-page/icons/checklist.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.LIST')}</a>
        <a><img alt="" src={"/images/landing-page/icons/calendar.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.ORGANIZE')}</a>
        <a><img alt="" src={"/images/landing-page/icons/organized-list.png"}/> {TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.SUMMARY')}</a>
    </div>
)