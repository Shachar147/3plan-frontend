import React, {useContext, useEffect, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import {getClasses} from "../../../utils/utils";
import TriplanLogo from "../../../components/triplan-header/logo/triplan-logo";
import TriplanSearchV2 from "../search-component/triplan-search-v2";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import TranslateService from "../../../services/translate-service";
import ReactModalService from "../../../services/react-modal-service";
import {observer} from "mobx-react";
import {mainPageContentTabLsKey, myTripsTabId, newDesignRootPath, savedCollectionsTabId} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";
import {useNavigate, useParams} from "react-router-dom";
import {getUser, isLoggedOn} from "../../../helpers/auth";
import {getViewSelectorOptions} from "../../../utils/ui-utils";
import {ViewMode} from "../../../utils/enums";

function TriplanSpecificTripHeaderLine(){
    const rootStore = useContext(rootStoreContext);
    const eventStore = useContext(eventStoreContext);
    const { tripName } = useParams();

    useHandleWindowResize();

    const isLoggedIn = isLoggedOn();
    const navigate = useNavigate();

    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const baseClass = "triplan-header-banner-header-line";
    const isSticky = (!eventStore.isMobile && scrollY > 100) || tripName;

    const viewOptions = getViewSelectorOptions(eventStore, eventStore.isMobile).filter((x) => {
        return !(eventStore.isMobile && (x as any).desktopOnly);
    });

    return (
        <>
            <div className={`${baseClass}-top-shadow`} />
            <div className={getClasses(baseClass, eventStore.isHebrew ? 'padding-inline-150' : 'padding-inline-50', !eventStore.isMobile && 'sticky', isSticky && 'is-sticky')}>
                <div className={`${baseClass}-left-side`}>
                    {!eventStore.isMobile && <TriplanLogo onClick={() => window.location.href = newDesignRootPath } white={!isSticky} height={60} />}
                    <TriplanSearchV2 />
                </div>
                <div className={`${baseClass}-right-side`} key={rootStore.headerReRenderCounter}>
                    {viewOptions.map((v) => (
                        <Button
                            icon={(v as any).iconClass!}
                            text={v.name}
                            className={(eventStore.isMobile ? eventStore.mobileViewMode : eventStore.viewMode) == v.key && 'active'}
                            onClick={() => {
                                if (eventStore.isMobile) {
                                    eventStore.setMobileViewMode(v.key as ViewMode);
                                } else {
                                    eventStore.setViewMode(v.key as ViewMode);
                                }
                            }}
                            flavor={ButtonFlavor.link}
                        />
                    ))}
                    <Button
                        icon="fa-plane"
                        text={TranslateService.translate(eventStore, `BACK_TO_MY_TRIPS`)}
                        onClick={() => {
                            if (window.location.href == newDesignRootPath) {
                                localStorage.setItem(mainPageContentTabLsKey, myTripsTabId);
                                window.location.hash = myTripsTabId;
                                rootStore.triggerTabsReRender();
                                rootStore.triggerHeaderReRender();

                                window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth' // Optional: for smooth scrolling
                                });
                            } else {
                                rootStore.navigateToTab(myTripsTabId);
                            }
                        }}
                        flavor={ButtonFlavor.link}
                    />
                    <Button
                        icon="fa-globe"
                        text={TranslateService.translate(eventStore, 'LANGUAGE')}
                        onClick={() => {
                            ReactModalService.openChangeLanguageModal(eventStore);
                        }}
                        flavor={ButtonFlavor.link}
                    />
                    <Button
                        icon="fa-sign-out"
                        text={isLoggedIn ? eventStore.isMobile ? TranslateService.translate(eventStore, 'LOGOUT') : `${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}` : `${TranslateService.translate(eventStore, 'LOGIN')}`}
                        onClick={() => {
                            navigate(isLoggedIn ? '/logout' : '/login',)
                        }}
                        flavor={ButtonFlavor.link}
                    />
                </div>
            </div>
        </>
    );
}

export default observer(TriplanSpecificTripHeaderLine)