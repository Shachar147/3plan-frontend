import React, {useContext, useEffect, useState} from 'react';
import {observer} from "mobx-react";
import {tripTemplatesContext} from "../../stores/templates-store";
import {getClasses, getEventTitle} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import './templates-view.scss';
import {newDesignRootPath} from "../../utils/consts";
import {getTripTemplatePhoto} from "../../views/trip-template-page/utils";

function TemplateShimmeringPlaceholder() {
    const baseClass = "trip-template";
    function renderItem() {
        return (
            <div className={baseClass}>
                <div className={`${baseClass}-background shimmer-animation`}/>
            </div>
        )
    }
    return (
        <>
            {renderItem()}
            {renderItem()}
            {renderItem()}
            {renderItem()}
            {renderItem()}
        </>
    )
}

function Template({ trip }) {
    const [isLoading, setIsLoading] = useState(true);
    const defaultBanner = "/images/banner/best/10.png";
    const [backgroundImage, setBackgroundImage] = useState(defaultBanner)
    const eventStore = useContext(eventStoreContext);

    const baseClass = "trip-template";

    useEffect(() => {
        getTripTemplatePhoto(trip).then((bgImage: string | undefined) => {
            if (bgImage){
                setBackgroundImage(bgImage);
                setIsLoading(false);
            }
        })
    }, [])

    return (
        <div className={baseClass} onClick={() => {
            window.location.href = `${newDesignRootPath}/template/${trip.id}`;
        }}>
            <div className={getClasses(`${baseClass}-background`, isLoading && 'shimmer-animation')} style={{
                backgroundImage: isLoading ? undefined : `url('${backgroundImage}')`,
            }}/>

            {!isLoading && <div className={getClasses(`${baseClass}-content`)}>
                <div className={`${baseClass}-content-bottom-shadow`}>
                    {getEventTitle({ title: trip.name }, eventStore, true)}
                </div>
            </div>}
        </div>
    )
}

function TemplatesView(){
    const tripTemplatesStore = useContext(tripTemplatesContext)
    const eventStore = useContext(eventStoreContext);

    useEffect(() => {
        tripTemplatesStore.loadTemplates();
    }, []);

    const title = TranslateService.translate(eventStore, 'SUGGESTED_TRIP_TEMPLATES');
    const description = TranslateService.translate(eventStore, 'SUGGESTED_TRIP_TEMPLATES.DESCRIPTION');

    const baseClass = "templates-view"

    return (
        <>
            {!eventStore.isMobile && <div className={`${baseClass}-gray-bg`}/>}
            <div className={getClasses(baseClass, eventStore.isMobile && 'with-divider')}>
                <div className={`${baseClass}-title`}>
                    <h3 className="main-feed-header width-100-percents">{title}</h3>
                    <span className="main-feed-description text-align-start" dangerouslySetInnerHTML={{ __html: description}} />
                </div>
                <div className={getClasses("main-feed-header gap-20 width-100-percents align-items-center justify-content-center", eventStore.isMobile ? 'flex-col' : 'flex-row')}>
                    {tripTemplatesStore.isLoading ? <TemplateShimmeringPlaceholder/> : (
                        <>
                            {tripTemplatesStore.tripTemplates.map((t, idx) => <Template key={idx} trip={t} />)}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default observer(TemplatesView);