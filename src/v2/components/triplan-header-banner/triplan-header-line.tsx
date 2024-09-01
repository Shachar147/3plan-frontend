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


function TriplanHeaderLine(){
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
    const isMobile = false;  // eventStore.isMobile;
    const isSticky = (!isMobile && scrollY > 60) || tripName;
    const isShort = eventStore.isMobile ? '.SHORT' : '';

    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    const hideSearch = eventStore.isMobile && scrollY > 160;

    return (
        <>
            <div className={`${baseClass}-top-shadow`} />
            <div className={getClasses(baseClass, !isMobile && 'sticky', isSticky && 'is-sticky')}>
                {<div className={`${baseClass}-left-side`}>
                    {!eventStore.isMobile && <TriplanLogo onClick={() => window.location.href = newDesignRootPath } white={!isSticky} height={60} />}
                    <div className={getClasses(eventStore.isMobile && "bottom-0", hideSearch && 'display-none')}><TriplanSearchV2 /></div>
                </div>}
                <div className={`${baseClass}-right-side`} key={rootStore.headerReRenderCounter}>
                    <Button
                        icon="fa-heart"
                        text={TranslateService.translate(eventStore, 'WISHLIST')}
                        className={localStorage.getItem(mainPageContentTabLsKey) === savedCollectionsTabId && 'active'}
                        onClick={() => {
                            // if (localStorage.getItem(mainPageContentTabLsKey) === savedCollectionsTabId) {
                            //     return;
                            // }

                            if (window.location.href == savedCollectionsTabId) {
                                localStorage.setItem(mainPageContentTabLsKey, savedCollectionsTabId);
                                window.location.hash = savedCollectionsTabId;
                                rootStore.triggerTabsReRender();
                                rootStore.triggerHeaderReRender();
                            }
                            else {
                                rootStore.navigateToTab(savedCollectionsTabId)
                            }

                            window.scrollTo({
                                top: isInPlan ? 0 : eventStore.isMobile ? 151 : 61,
                                behavior: 'smooth' // Optional: for smooth scrolling
                            });
                        }}
                        flavor={ButtonFlavor.link}
                    />
                    <Button
                        icon="fa-plane"
                        text={TranslateService.translate(eventStore, `MY_TRIPS${isShort}`)}
                        className={localStorage.getItem(mainPageContentTabLsKey) === myTripsTabId && 'active'}
                        onClick={() => {
                            // if (localStorage.getItem(mainPageContentTabLsKey) === myTripsTabId) {
                            //     return;
                            // }

                            if (window.location.href == newDesignRootPath) {
                                localStorage.setItem(mainPageContentTabLsKey, myTripsTabId);
                                window.location.hash = myTripsTabId;
                                rootStore.triggerTabsReRender();
                                rootStore.triggerHeaderReRender();
                            } else {
                                rootStore.navigateToTab(myTripsTabId);
                            }

                            window.scrollTo({
                                top: isInPlan ? 0 : eventStore.isMobile ? 151 : 61,
                                behavior: 'smooth' // Optional: for smooth scrolling
                            });
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
                        // icon="fa-user"
                        // text={TranslateService.translate(eventStore, 'PROFILE')}
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

export default observer(TriplanHeaderLine)