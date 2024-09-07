import React, {useState, useEffect, useContext} from 'react';
import './scroll-top.scss';
import {newDesignRootPath} from "../../utils/consts";
import {getClasses} from "../../../utils/utils";
import {eventStoreContext} from "../../../stores/events-store";

export const MOBILE_SCROLL_TOP = 115;
export const DESKTOP_SCROLL_TOP = 61;

const ScrollToTopButton = ({ scrollDistance }) => {
    const [isVisible, setIsVisible] = useState(false);

    const eventStore = useContext(eventStoreContext);

    if (!scrollDistance){
        scrollDistance = eventStore.isMobile ? 4000 : 1600;
    }

    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > scrollDistance) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [scrollDistance]);

    const scrollToTop = () => {
        window.scrollTo({
            top: isInPlan ? 0 : eventStore.isMobile ? MOBILE_SCROLL_TOP : DESKTOP_SCROLL_TOP,
            behavior: 'smooth',
        });
    };

    return (
        isVisible && (
            <div className={getClasses("scroll-top-container", eventStore.isMobile && isInPlan && 'bottom-70')}>
                <button onClick={scrollToTop}>
                    <i className="fa fa-arrow-up" />
                </button>
            </div>
        )
    );
};

export default ScrollToTopButton;
