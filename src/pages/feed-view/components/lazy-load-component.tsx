import React, {useEffect, useState, useRef, useContext} from 'react';
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import {getClasses} from "../../../utils/utils";

interface LazyLoadComponentProps {
    fetchData: (page: number, setLoading: (bool) => void) => Promise<any>;
    children: React.ReactNode;
    isLoading: boolean;
    className?: string;
}

const LazyLoadComponent = ({ children, fetchData, isLoading, className }: LazyLoadComponentProps) => {
    const eventStore = useContext(eventStoreContext);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(isLoading);
    const loader = useRef(null);

    useEffect (() => {
        fetchData(page, setLoading);
    }, [page]);

    useEffect(() => {
        const options = {
            root: null, // Use the viewport as the root
            rootMargin: '0px',
            threshold: 1.0,
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) {
                setPage((prevPage) => prevPage + 1);
            }
        }, options);

        if (loader.current) {
            observer.observe(loader.current);
        }

        return () => {
            if (loader.current) {
                observer.unobserve(loader.current);
            }
        };
    }, [loading]);

    return (
        <div className={className}>
            {children}
            <div ref={loader} className={getClasses("margin-top-10 width-100-percents text-align-center", eventStore.isHebrew && 'direction-rtl')}>
                {loading && <div>{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</div>}
            </div>
        </div>
    );
};

export default LazyLoadComponent;
