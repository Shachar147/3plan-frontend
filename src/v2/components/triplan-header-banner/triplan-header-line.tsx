import React, {useContext, useEffect, useMemo, useState} from "react";
import {eventStoreContext} from "../../../stores/events-store";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import {getClasses, isAdmin} from "../../../utils/utils";
import TriplanLogo from "../../../components/triplan-header/logo/triplan-logo";
import TriplanSearchV2 from "../search-component/triplan-search-v2";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import TranslateService from "../../../services/translate-service";
import ReactModalService from "../../../services/react-modal-service";
import {observer} from "mobx-react";
import {
    mainPageContentTabLsKey,
    myTripsTabId,
    newDesignRootPath,
    savedCollectionsTabId,
    specificItemTabId
} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";
import {useNavigate, useParams} from "react-router-dom";
import {getUser, isLoggedOn} from "../../../helpers/auth";
import {DESKTOP_SCROLL_TOP, MOBILE_SCROLL_TOP} from "../scroll-top/scroll-top";
import {getParameterFromHash} from "../../utils/utils";


function TriplanHeaderLine({ isInLogin = false, isAlwaysSticky = false }: { isInLogin?: boolean, isAlwaysSticky?: boolean }){
    const rootStore = useContext(rootStoreContext);
    const eventStore = useContext(eventStoreContext);
    const { tripName } = useParams();

    useHandleWindowResize();

    const isLoggedIn = isLoggedOn() && !isInLogin;
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
    const isSticky = (!isMobile && scrollY > 60) || (tripName && scrollY > 60) || isAlwaysSticky;
    const isShort = isAdmin() && eventStore.isMobile ? '.SHORT' : ''; // because only admin have a lot of buttons here.

    const isInAdmin = window.location.href.includes(`${newDesignRootPath}/admin`);
    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    const hideSearch = !isLoggedIn; // || (eventStore.isMobile && scrollY > 160);

    const wishlistBtn = (
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
                    top: isInPlan ? 0 : eventStore.isMobile ? MOBILE_SCROLL_TOP : DESKTOP_SCROLL_TOP,
                    behavior: 'smooth' // Optional: for smooth scrolling
                });
            }}
            disabled={!isLoggedIn}
            flavor={ButtonFlavor.link}
        />
    );

    const searchKeyword = getParameterFromHash('q') ?? getParameterFromHash('d');

    const myTripsBtn = (
        <Button
            icon="fa-plane"
            text={isInPlan ? TranslateService.translate(eventStore, `BACK_TO_MY_TRIPS`) : TranslateService.translate(eventStore, `MY_TRIPS${isShort}`)}
            className={isLoggedIn && !searchKeyword && !isInPlan && localStorage.getItem(mainPageContentTabLsKey) === myTripsTabId && !isInAdmin && 'active'}
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
                    top: isInPlan ? 0 : eventStore.isMobile ? MOBILE_SCROLL_TOP : DESKTOP_SCROLL_TOP,
                    behavior: 'smooth' // Optional: for smooth scrolling
                });
            }}
            disabled={!isLoggedIn}
            flavor={ButtonFlavor.link}
        />
    )

    const languageBtn = (
        <Button
            icon="fa-globe"
            text={TranslateService.translate(eventStore, `LANGUAGE${isShort}`)}
            onClick={() => {
                ReactModalService.openChangeLanguageModal(eventStore);
            }}
            flavor={ButtonFlavor.link}
        />
    );

    const signInOutBtn = (
        <Button
            // icon="fa-user"
            // text={TranslateService.translate(eventStore, 'PROFILE')}
            icon={isLoggedIn ? "fa-sign-out" : "fa-sign-in"}
            text={isLoggedIn ? eventStore.isMobile ? TranslateService.translate(eventStore, 'LOGOUT') : `${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}` : `${TranslateService.translate(eventStore, 'LOGIN')}`}
            className={window.location.href.includes("/login") && !(window.location.hash.includes("register")) && 'active'}
            onClick={() => {
                const path = isLoggedIn ? '/logout' : `${newDesignRootPath}/login`;
                if (isInLogin){
                    rootStore.navigateToTabOnLoginPage('login');
                    return;
                }
                navigate(path)
            }}
            flavor={ButtonFlavor.link}
        />
    );

    const registerBtn = (
        <Button
            icon={"fa-user-plus"}
            text={TranslateService.translate(eventStore, 'REGISTER_BUTTON')}
            className={window.location.href.includes("/login") && window.location.hash.includes("register") && 'active'}
            onClick={() => {
                rootStore.navigateToTabOnLoginPage(`register`);
                // window.location.href = `${newDesignRootPath}/register`;
            }}
            flavor={ButtonFlavor.link}
        />
    );

    const renderHeaderButtons = () => {
        const containerClass = "flex-row align-items-center justify-content-center gap-4";
        if (isInLogin){
            return (
                <div className={containerClass}>
                    {signInOutBtn}
                    {registerBtn}
                    {languageBtn}
                </div>
            )
        }

        const goToAdminSideBtn = (
            <Button
                icon="fa-star"
                text={TranslateService.translate(eventStore, 'MOBILE_NAVBAR.ADMIN_SIDE.SHORT')}
                onClick={() => {
                    window.location.href = `${newDesignRootPath}/admin`;
                }}
                flavor={ButtonFlavor.link}
            />
        )

        const goToUserSideBtn = (
            <Button
                icon="fa-home"
                text={TranslateService.translate(eventStore, 'MOBILE_NAVBAR.HOME')}
                onClick={() => {
                    window.location.href = `${newDesignRootPath}`;
                }}
                flavor={ButtonFlavor.link}
            />
        )

        const searchKeyword = getParameterFromHash('q') ?? getParameterFromHash('d');
        const isInSearch = (searchKeyword?.length ?? 0) > 0;
        const viewItemId = window.location.hash.includes(specificItemTabId) ? getParameterFromHash('id') : undefined;
        const isInViewItem = (viewItemId?.length ?? 0) > 0;

        if (isInSearch || isInViewItem) {
            return (
                <div className={containerClass}>
                    {goToUserSideBtn}
                    {isAdmin() && goToAdminSideBtn}
                    {languageBtn}
                    {signInOutBtn}
                </div>
            )
        }

        return (
            <div className={containerClass}>
                {isInPlan && goToUserSideBtn}
                {isAdmin() ? (isInAdmin ? goToUserSideBtn : goToAdminSideBtn) : undefined}
                {!isInPlan && wishlistBtn}
                {!eventStore.isMobile && myTripsBtn}
                {languageBtn}
                {signInOutBtn}
            </div>
        )
    }

    const isInTemplate = window.location.href.includes(`${newDesignRootPath}/template/`);
    const shouldHaveSearch = isLoggedIn && !isInTemplate;

    const search = useMemo(() => <TriplanSearchV2 />, [eventStore.isMobile]);

    const condition1 = !eventStore.isMobile && !hideSearch;
    const condition2 = shouldHaveSearch && eventStore.isMobile && scrollY >= 142 && !hideSearch;
    const condition3 = eventStore.isMobile && shouldHaveSearch && !hideSearch;

    return (
        <>
            <div className={`${baseClass}-top-shadow`} />
            <div className={getClasses(baseClass, !isMobile && 'sticky', isSticky && 'is-sticky')}>
                {<div className={`${baseClass}-left-side`}>
                    {!eventStore.isMobile && <TriplanLogo onClick={() => window.location.href = newDesignRootPath } white={!isSticky} height={60} />}
                    {condition1 && !condition2 && <div>{search}</div>}
                </div>}
                <div className={`${baseClass}-right-side`} key={rootStore.headerReRenderCounter}>
                    <div className="flex-column gap-4">
                        {renderHeaderButtons()}
                        {condition2 && <div className="sticky-search-line">{search}</div>}
                    </div>
                </div>
            </div>
            {condition3 && !condition1 && !condition2 && <div className="mobile-search">
                {search}
            </div>}
        </>
    );
}

export default observer(TriplanHeaderLine)