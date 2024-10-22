import React, {useContext, useState} from 'react';
import {Carousel} from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import {FaRegStar, FaStar, FaStarHalfAlt} from 'react-icons/fa';
import Button, {ButtonFlavor} from '../../../components/common/button/button'; // Import your Button component
import './point-of-interest.scss';
import ReactModalService from "../../../services/react-modal-service";
import {TripActions} from "../../../utils/interfaces";
import {TriplanPriority} from "../../../utils/enums";
import {
    extractCategory,
    getClasses,
    getEventDescription,
    getEventTitle, isAdmin,
    isTemplateUsername
} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {EventStore, eventStoreContext} from "../../../stores/events-store";
import {fetchCitiesAndSetOptions} from "../destination-selector/destination-selector";
import FeedViewApiService from "../../services/feed-view-api-service";
import {IPointOfInterest} from "../../utils/interfaces";
import {runInAction} from "mobx";
import {feedStoreContext} from "../../stores/feed-view-store";
import {observer} from "mobx-react";
import EditableLabel from "../editable-label/editable-label";
import {mainPageContentTabLsKey, myTripsTabId, newDesignRootPath, specificItemTabId} from "../../utils/consts";
import {rootStoreContext} from "../../stores/root-store";
import {MOBILE_SCROLL_TOP} from "../scroll-top/scroll-top";
import {searchStoreContext} from "../../stores/search-store";
import CategorySelector from "../../admin/components/category-selector/category-selector";

interface PointOfInterestProps {
    item: IPointOfInterest, // getyourguide / dubaicoil result
    eventStore: EventStore,
    mainFeed?: boolean;

    // saved collection
    savedCollection?: boolean;

    // my trips
    onClick?: () => void;
    onClickText?: string;
    onClickIcon?: string;
    myTrips?: boolean;
    renderTripActions?: () => void;
    renderTripInfo?: () => void;
    namePrefix?: React.ReactNode;
    isEditMode?: boolean;
    onEditSave?: (newName: string) => void;
    onEditDescriptionSave?: (newDescription: string) => void;
    onEditCategorySave?: (newCategory: string) => void;

    // search result
    isSearchResult?: boolean;

    // specific item
    isViewItem?: boolean;

    onLabelClick?: () => void; // edit mode for POIs
}

const Image = ({ image, idx, isSmall, alt, className, backgroundImage }: { image: string, idx: number, alt:string, isSmall?: boolean, className?: string, backgroundImage?: boolean }) => {
    const [src, setSrc] = useState(image);

    const fallbacks = ["/images/trip-photo-1.jpg", "/images/trip-photo-2.png", "/images/trip-photo-3.png", "/images/trip-photo-4.png", "/images/trip-photo-5.png",  "/images/trip-photo-2.png"]
    const random = Math.floor(Math.random() * fallbacks.length);

    return (
        <>
            <div className={getClasses("shimmer-animation", className)} style={{
                height: isSmall ? 200 : 266, width: isSmall ? 298 : 400 }} />
            <img src={src} alt={alt} onError={() => setSrc(fallbacks[random])} onLoad={(e) => {
                const imgElement = e.target;
                if (backgroundImage) {
                    imgElement.nextSibling.classList.remove('display-none');
                } else {
                    imgElement.classList.remove('display-none');
                }
                const shimmer = imgElement.previousSibling;
                shimmer.style.display = 'none';

            }} className={getClasses("display-none zoomable", className)} key={idx} />
            <div className={getClasses(className, !backgroundImage && 'display-none')} style={{
                backgroundImage: `url('${src}')`,
                backgroundSize: "cover",
                backgroundPosition: "center"
            }} />
        </>
    )
}

const PointOfInterestShimmering = ({ isSmall = false }: { isSmall?: boolean}) => {

    const eventStore = useContext(eventStoreContext);

    let a = Math.random();
    if (a < 0.5){
        a += 0.5;
    }
    const b = Math.random();

    return (
        <div className={getClasses("point-of-interest point-of-interest-shimmering", isSmall && 'main-feed')} style={{
            width: isSmall ? 300 : 1274
        }}>
            <div className="poi-left">
                <div className="carousel-wrapper">
                    <div className="carousel-root">
                        <div className="carousel carousel-slider width-100-percents">
                            <button type="button" aria-label="previous slide / item"
                                    className="control-arrow control-prev control-disabled"/>
                            <div className="slider-wrapper axis-horizontal">
                                <ul className="slider animated">
                                    <div className="shimmer-animation" style={{
                                        height: isSmall ? 200 : 266, width: isSmall ? 298 : 400 }} />
                                </ul>
                            </div>
                            <button type="button" aria-label="next slide / item"
                                    className="control-arrow control-next control-disabled"/>
                            <p className="carousel-status">1 of 1</p></div>
                    </div>
                </div>
            </div>
            <div className="poi-right">
                <div className={getClasses("category-label", eventStore.isMobile && 'is-mobile')}>
                    <div className={getClasses(isSmall && 'padding-bottom-4')}>
                        <div className="flex-row gap-8 flex-wrap-wrap align-items-center"><i className="shimmer-animation" style={{
                            width: 27,
                            height: 22,
                            marginBottom: 0
                        }}/><span className="shimmer-animation" style={{ width: 100, height: 22, borderRadius: 10}} /></div>
                    </div>
                    {isSmall && <i className="fa fa fa-heart-o" aria-hidden="true" />}
                </div>
                {
                    isSmall ? (
                        <div className="flex-column gap-4">
                            <h2 className="shimmer-animation" style={{
                                width: "100%",
                                height: 25,
                                borderRadius: 10
                            }}/>
                            <h2 className="shimmer-animation" style={{
                                width: "90%",
                                height: 25,
                                borderRadius: 10
                            }}/>
                        </div>
                    ) : (
                        <div className="name-container"><h2 className="shimmer-animation" style={{
                            width: 828,
                            height: 40,
                            borderRadius: 10
                        }}/>
                        </div>
                    )
                }

                <div className="flex-column gap-4 margin-top-5">
                    {isSmall ? <>
                        <div className="shimmer-animation" style={{
                            width: "100%",
                            height: 18,
                            borderRadius: 10
                        }}/>
                        <div className="shimmer-animation" style={{
                            width: "100%",
                            height: 18,
                            borderRadius: 10
                        }}/>
                        <div className="shimmer-animation" style={{
                            width: "60%",
                            height: 18,
                            borderRadius: 10
                        }}/>
                        </> : <>
                    <div className="shimmer-animation" style={{
                        width: 828 * Math.max(a,b),
                        height: 22,
                        borderRadius: 10
                    }}/>
                    <div className="shimmer-animation" style={{
                        width: 828 * Math.min(a,b),
                        height: 22,
                        borderRadius: 10
                    }}/>
                    </>}

                </div>

                <div className="poi-details"><span className="shimmer-animation" style={{
                    width: 200,
                    height: 22,
                    borderRadius: 10
                }}/>
                    <div className="rate shimmering" style={{
                        marginTop: 10
                    }}>
                        <svg stroke="currentColor" fill="currentColor" viewBox="0 0 576 512"
                             className="star" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>
                        </svg>
                        <svg stroke="currentColor" fill="currentColor" viewBox="0 0 576 512"
                             className="star" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>
                        </svg>
                        <svg stroke="currentColor" fill="currentColor" viewBox="0 0 576 512"
                             className="star" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>
                        </svg>
                        <svg stroke="currentColor" fill="currentColor" viewBox="0 0 576 512"
                             className="star" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>
                        </svg>
                        <svg stroke="currentColor" fill="currentColor" viewBox="0 0 576 512"
                             className="star" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/>
                        </svg>
                    </div>
                    <div className="poi-footer">
                        {!isSmall && <div className="source-logo shimmer-animation" style={{
                            width: 60,
                            height: 22,
                        }} />}
                        {!isSmall && <div className="source-logo shimmer-animation" style={{
                            width: 40,
                            height: 22,
                        }} />}
                        {!isSmall && <div className="source-logo shimmer-animation" style={{
                            width: 92,
                            height: 22,
                        }} />}

                        <div className="source-logo shimmer-animation" style={{
                            width: 123,
                            height: 38,
                            borderRadius: 18
                        }} />
                        <div className="source-logo shimmer-animation" style={{
                            width: 180,
                            height: 38,
                            borderRadius: 18
                        }} />

                    </div>
                </div>
            </div>
        </div>
    );
}

const PointOfInterest = ({ item, eventStore, mainFeed, isSearchResult, isViewItem, savedCollection, myTrips, onClick, onClickText, onClickIcon, onLabelClick, renderTripActions, renderTripInfo, namePrefix, isEditMode, onEditSave, onEditDescriptionSave, onEditCategorySave }: PointOfInterestProps) => {
    const feedStore = useContext(feedStoreContext);
    const rootStore = useContext(rootStoreContext);
    const searchStore = useContext(searchStoreContext);

    const isHebrew = eventStore.isHebrew;
    const feedId = `${item.source}-${item.name}-${item.url}`;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAddingToSaved, setIsAddingToSaved] = useState(false);

    const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

    const category = extractCategory([
        item.name ?? '',
        item.description ?? '',
    ].filter(Boolean))

    if (!myTrips) {
        item.category = item.category || category || "CATEGORY.GENERAL";
    }

    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${item.location?.latitude},${item.location?.longitude}`;

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={i} className="star" />);
        }

        if (halfStar) {
            stars.push(<FaStarHalfAlt key="half" className="star" />);
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={i + fullStars + halfStar} className="star" />);
        }

        return stars;
    };

    const formatDuration = (duration) => {
        if (!duration) return null;

        const [hours, minutes] = duration.split(':').map(Number);
        if (hours == 24) {
            return TranslateService.translate(eventStore, 'ONE_DAY');
        }
        if (hours > 24) {
            return TranslateService.translate(eventStore, 'X_DAYS', { X: Math.ceil(hours/24) });
        }

        if (hours === 0 && minutes > 0) return TranslateService.translate(eventStore, 'X_MINUTES', { X: minutes });
        if (hours === 1 && minutes === 0) return TranslateService.translate(eventStore, 'ONE_HOUR');
        if (hours > 0 && minutes === 0) return TranslateService.translate(eventStore, 'X_HOURS', { X: hours});
        if (hours === 1 && minutes === 30) return TranslateService.translate(eventStore, 'ONE_AND_A_HALF_HOUR');
        if (hours > 0 && minutes === 30) return TranslateService.translate(eventStore, 'X_AND_A_HALF_HOURS', { X: hours});
        if (hours > 0 && minutes > 0) return TranslateService.translate(eventStore, 'X_HOURS_Y_MINUTES', { X: hours, Y: minutes});

        return TranslateService.translate(eventStore, 'X_HOURS');
    };

    const durationText = formatDuration(item.duration);

    const handleAddToPlan = () => {
        if (mainFeed || isSearchResult || isViewItem){
            return; // since we're not on specific trip.
        }

        let categoryId = undefined;

        if (item.category) {
            const existingCategory = eventStore.categories.filter((c) => c.title === item.category || c.title === TranslateService.translate(eventStore, item.category));
            if (existingCategory.length > 0) {
                categoryId = existingCategory[0].id;
            } else {
                categoryId = eventStore.createCategoryId();
                eventStore.setCategories(
                    [
                        ...eventStore.categories,
                        {
                            id: categoryId,
                            title: TranslateService.translate(eventStore, item.category),
                            icon: '',
                        },
                    ],
                    false
                );
            }
        }
        ReactModalService.openAddSidebarEventModal(
            eventStore,
            categoryId,
            {
                ...item,
                images: item.images?.join(","),
                priority: !item.priority ? TriplanPriority.unset : TriplanPriority[item.priority],
                title: item.name,
                location: item.location ? {
                    ...item.location,
                    address: item.name
                } : undefined,
                category: categoryId,
                currency: item.currency ? TranslateService.translate(eventStore, item.currency) : undefined,
                moreInfo: item.more_info,
                extra: {
                    ...item.extra,
                    feedId,
                    moreInfo: item.more_info,
                }
            },
            true,
            undefined,
            TripActions.addedNewSidebarEventFromExploreTab
        );
    };

    const alreadyInPlan = !![...eventStore.calendarEvents, ...eventStore.allSidebarEvents].find((i) => i.extra?.feedId == feedId);
    const alreadyInSaved = !!feedStore.savedItems.find((i) => i.poiId == item.id);

    function getRating(){
        let rating = item.rate?.rating?.toFixed(1);
        if (rating?.toString()?.endsWith(".0")){
            rating = item.rate?.rating.toFixed(0);
        }
        return rating;
    }

    const rating = getRating();

    const handleAddToSaved = () => {
        return new FeedViewApiService().saveItem(item).then((result) => {
            runInAction(() => {
                feedStore.getSavedCollections()
            })
        })
    }

    const handleRemoveFromSaved = () => {
        const collection = feedStore.savedCollections.find((c) => c.items.map((i) => i.poiId).includes(item.id));
        if (!collection){
            ReactModalService.internal.openOopsErrorModal(eventStore);
            return Promise.resolve();
        }

        // todo complete - if it's saved collection - remove the item we're looking at in the picture right now.
        let idToRemove = item.id;
        if (savedCollection){
            idToRemove = item.idxToDetails[currentSlide].id;
        }

        return new FeedViewApiService().unSaveItem(idToRemove, collection.id).then((result) => {
            runInAction(() => {
                feedStore.getSavedCollections()
            })
        })
    }

    function renderSaveButton() {
        if (myTrips) {
            return;
        }
        const text = alreadyInSaved ? TranslateService.translate(eventStore, "REMOVE_FROM_SAVED") : TranslateService.translate(eventStore, "KEEP_TO_SAVED");

        const flavor = mainFeed ? ButtonFlavor.link : alreadyInSaved ? ButtonFlavor.success : ButtonFlavor.primary;
        if (mainFeed || isSearchResult || isViewItem) {
            return (
                <>
                <Button
                    flavor={flavor}
                    onClick={() => {
                        setIsAddingToSaved(true);
                        if (alreadyInSaved){
                            return handleRemoveFromSaved().then(() => setIsAddingToSaved(false));
                        }
                        return handleAddToSaved().then(() => setIsAddingToSaved(false));
                    }}
                    disabled={!item.id}
                    isLoading={flavor != ButtonFlavor.link && isAddingToSaved}
                    key={`save-button-${item.id}-${feedStore.reRenderCounter}`}
                    icon={alreadyInSaved ? "fa fa-heart" : "fa fa-heart-o"}
                    text={(isSearchResult || isViewItem) ? text : ""}
                    tooltip={mainFeed ? text : ""}
                    className="padding-inline-15"
                />
                    {!isViewItem && !isSmall && !isInPlan && (
                        <div className={getClasses(isSmall && "flex-column align-items-center", isSmall && !eventStore.isMobile && 'margin-bottom-10')}>
                            <Button
                                flavor={ButtonFlavor.secondary}
                                onClick={() => {
                                    localStorage.setItem(`item-${item.id}-name`, item.name);
                                    window.location.hash = `${specificItemTabId}?id=${item.id}`;
                                    window.location.href = `${newDesignRootPath}${window.location.hash}`;
                                    // window.location.assign(`${newDesignRootPath}${window.location.hash}`);
                                    rootStore.triggerTabsReRender();
                                    rootStore.triggerHeaderReRender();
                                }}
                                key={`open-button-${item.id}-${feedStore.reRenderCounter}`}
                                icon={`fa-chevron-${eventStore.getCurrentDirectionEnd()}`}
                                text={TranslateService.translate(eventStore, 'OPEN_ITEM')}
                                className="padding-inline-15 black"
                            />
                        </div>
                    )}
                    {isAdmin() && !isSmall && (
                        <Button
                            icon={onClickIcon ?? `fa-angle-double-${eventStore.getCurrentDirectionEnd()}`}
                            className={getClasses("cursor-pointer", 'black', eventStore.isMobile && 'min-width-150 padding-inline-15')}
                            flavor={ButtonFlavor.secondary}
                            text={onClickText ?? TranslateService.translate(eventStore, isTemplateUsername() ? 'OPEN_TEMPLATE' : 'OPEN_TRIP')}
                            onClick={() => onClick()}
                        />
                    )}
                </>
            );
        }


        return (
            <>
                <Button
                    flavor={alreadyInPlan ? ButtonFlavor.success : ButtonFlavor.primary}
                    onClick={handleAddToPlan}
                    icon={alreadyInPlan ? "fa fa-check" : undefined}
                    text={alreadyInPlan ? TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADDED_TO_PLAN') : TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADD_TO_PLAN')}
                    disabled={alreadyInPlan || eventStore.isTripLocked || !eventStore.canWrite}
                    className="padding-inline-15"
                />
                <Button
                    flavor={flavor}
                    onClick={() => {
                        setIsAddingToSaved(true);
                        if (alreadyInSaved){
                            return handleRemoveFromSaved().then(() => setIsAddingToSaved(false));
                        }
                        return handleAddToSaved().then(() => setIsAddingToSaved(false));
                    }}
                    disabled={!item.id}
                    isLoading={flavor != ButtonFlavor.link && isAddingToSaved}
                    key={`save-button-${item.id}-${feedStore.reRenderCounter}`}
                    icon={alreadyInSaved ? "fa fa-heart" : "fa fa-heart-o"}
                    text={text}
                    tooltip={text}
                    className="padding-inline-15"
                />
                {!isInPlan && <div className={getClasses(isSmall && "flex-column align-items-center", isSmall && !eventStore.isMobile && 'margin-bottom-10')}>
                    <Button
                        flavor={flavor}
                        onClick={() => {
                            localStorage.setItem(`item-${item.id}-name`, item.name);
                            window.location.hash = `${specificItemTabId}?id=${item.id}`;
                            window.location.href = `${newDesignRootPath}${window.location.hash}`;
                            // window.location.assign(`${newDesignRootPath}${window.location.hash}`)
                            rootStore.triggerTabsReRender();
                            rootStore.triggerHeaderReRender();
                        }}
                        key={`open-button-${item.id}-${feedStore.reRenderCounter}`}
                        icon={`fa-chevron-${eventStore.getCurrentDirectionEnd()}`}
                        text={TranslateService.translate(eventStore, 'OPEN_ITEM')}
                        className="padding-inline-15"
                    />
                </div>}
            </>
        );
    }

    function renderCategoryName(){
        if (savedCollection || myTrips){
            return (
                <div className="flex-row gap-3">
                    <span>
                        {TranslateService.translate(eventStore, item.category)}
                    </span>
                    <span>
                        {(item.destination ?? "").split(',').map((d) => TranslateService.translate(eventStore, d.trim())).join(', ')}
                    </span>
                </div>
            )
        }
        const name = TranslateService.translate(eventStore,'X_IN_Y', {
            X: TranslateService.translate(eventStore, item.category),
            Y: TranslateService.translate(eventStore, item.destination)
        }).replace(" בהאיים"," באיים");

        if (isEditMode) {
            const isSaving = false;
            return (
                <div className="flex-row gap-10 justify-content-center align-items-center">
                    <CategorySelector isDisabled={isSaving} name="category" value={item.category} placeholderKey={"CATEGORY"} onChange={(e) => onEditCategorySave?.(e.target.value)} />
                    <i className="fa fa-close cursor-pointer" onClick={onLabelClick}/>
                </div>
            )
        }

        return (
            <span onClick={onLabelClick}>{name}</span>
        )
    }

    function renderDestinationIcon(){
        const destinations = item.destination.split(",");
        const sources = fetchCitiesAndSetOptions();
        return (
            <>
                {destinations.map((destination) => {
                    const found = sources.find((c) => c.value === destination.trim());
                    if (found){
                        return (
                            <i className={found.flagClass} alt={destination.trim()} title={destination.trim()} />
                        )
                    }
                }).filter(Boolean)}
            </>
        )

    }

    const isShrinkedMode = eventStore.isMobile || mainFeed;

    function renderItemCategory(){
        return (
            <div className={getClasses("category-label", mainFeed && 'main-feed')}>
                <div className="flex-row gap-8 flex-wrap-wrap align-items-center">
                    {renderDestinationIcon()}
                    {renderCategoryName()}
                    {!savedCollection && !myTrips && <span className="item-name font-size-12">{item.imagesNames?.[currentSlide]}</span>}
                </div>
                {(mainFeed) && renderSaveButton()}
            </div>
        )
    }

    function renderName() {
        let overridePreview;
        // if (isTemplateUsername() && myTrips) {
        //     if (eventStore.isHebrew) {
        //         overridePreview = item.name.split('|')?.[1]?.trim() ?? item.name;
        //     } else {
        //         overridePreview = item.name.split('|')[0].trim();
        //     }
        // }

        overridePreview = getEventTitle({ title: item.name }, eventStore, true);

        const name = (
            <EditableLabel onLabelClick={onLabelClick} name="trip-name" value={item.name.replaceAll("-", " ")} placeholder={TranslateService.translate(eventStore, 'name')} isEditMode={isEditMode} onEditSave={onEditSave} key={`edit-label-${item.name}`} overridePreview={overridePreview} onCancelClick={onLabelClick} />
        )
        if (isShrinkedMode) {
            return (
                <h4>{namePrefix}{name}</h4>
            );
        }
        return (
            <h2>{namePrefix}{name}</h2>
        );
    }

    const isSmall = eventStore.isMobile || mainFeed || savedCollection || myTrips;

    const getCurrencySign = (item) => {
        if (item.currency === 'ILS' || item.extra?.currency === 'ILS') {
            return '₪';
        }
        else if (item.currency === 'USD' || item.extra?.currency === 'USD') {
            return '$';
        }
        else if (item.currency ?? item.extra?.currency){
            return TranslateService.translate(eventStore, (item.currency ?? item.extra?.currency)?.toString());
        }
        return undefined;
    };

    return (
        <div className={getClasses('point-of-interest', isHebrew && 'hebrew-mode', mainFeed && 'main-feed', savedCollection && 'saved-collection', myTrips && 'my-trips-poi', isSearchResult && 'search-result', isViewItem && 'view-item')}>
            <div className="poi-left">
                <div className="carousel-wrapper" onClick={(e) => (item.images?.length > 1) && e.stopPropagation()}>
                    <Carousel showThumbs={false} showIndicators={false} infiniteLoop={true} onChange={(idx) => {
                        setCurrentSlide(idx);
                    }}>
                        {item.images?.map((image, index) => (
                            <div key={`item-${item.id}-image-${index}`}>
                                <Image image={image} alt={item.name} key={item.id + index} idx={`item-${item.id}-idx-${index}`} isSmall={isSmall} />
                            </div>
                        ))}
                    </Carousel>
                    {(mainFeed) && renderItemCategory()}
                    {renderTripActions?.()}
                </div>
                {/*{myTrips && (*/}
                {/*    <div className="my-trips-current-displayed-place-name">{item?.imagesNames?.[currentSlide]}</div>*/}
                {/*)}*/}
            </div>
            <div className="poi-right">
                {(item.priority === 'high' || item.isSystemRecommendation) && <div className="top-pick-label">{TranslateService.translate(eventStore, 'TOP_PICK')}</div>}
                {item.category && !mainFeed && renderItemCategory()}
                <div className={getClasses("name-container", isEditMode && 'margin-bottom-10')}>
                    {renderName()}
                </div>
                <span className={getClasses("description", isShrinkedMode && !isViewItem && 'max-height-100-ellipsis')}>
                    {onEditDescriptionSave ? <EditableLabel inputType="textarea" onLabelClick={onLabelClick} name={`${item.id}-description`} value={item.description} placeholder={TranslateService.translate(eventStore, 'TEMPLATE.DESCRIPTION')} isEditMode={isEditMode} onEditSave={onEditDescriptionSave} key={`edit-description-${item.description}`} overridePreview={getEventDescription(item, eventStore, true)} onCancelClick={onLabelClick} /> : item.description}
                    {savedCollection && (
                        <>
                            <br/>
                            <br/>
                            <span className="white-space-pre-line">{TranslateService.translate(eventStore, 'SAVED_COLLECTIONS.YOU_ARE_LOOKING_AT', {
                                X: item.imagesNames[currentSlide]
                            })}</span>
                        </>
                    )}
                </span>
                <div className="poi-details">
                    {!savedCollection && durationText && <span className="duration">{durationText}</span>}
                    {!savedCollection && !myTrips && (item.price ?? item.extra?.price) && <span className="price">{TranslateService.translate(eventStore, 'POINT_OF_INTEREST.PRICE', {
                        price: (item.price ?? item.extra?.price),
                        currency: getCurrencySign(item)
                    })}</span>}
                    {!!item.rate && !!item.rate.rating && <div className="rate">
                        {renderStars(item.rate.rating)}
                        <span>{TranslateService.translate(eventStore, item.rate.quantity && item.source !== 'System' ? 'POINT_OF_INTEREST.REVIEWS' : 'POINT_OF_INTEREST.REVIEWS.SHORT', {
                            rate: rating,
                            rateMax: 5,
                            quantity: item.rate.quantity
                        })}
                        </span>
                    </div>}
                    {isShrinkedMode && !savedCollection && !myTrips && (
                        <div className="poi-footer-links">
                            {item.more_info && <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>}
                            {item.location && (
                                <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                            )}
                            <div className="source-logo">
                                <img src={`/images/${item.source?.toLowerCase()?.replaceAll(".", "")}.png`} alt={item.source} />
                            </div>
                        </div>
                    )}
                    {!savedCollection && !myTrips && <div className="poi-footer">
                        {!isShrinkedMode && <div className="source-logo">
                            <img src={`/images/${item.source?.toLowerCase()?.replaceAll(".", "")}.png`} alt={item.source} />
                        </div>}
                        {!isShrinkedMode && <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>}
                        {item.location && !isShrinkedMode && (
                            <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                        )}
                        {!mainFeed && renderSaveButton()}
                    </div>}
                    {renderTripInfo?.()}
                </div>
                {savedCollection && (
                    <div className="margin-bottom-20 margin-top-20 flex-column width-100-percents">
                        <Button
                            icon="fa-rocket"
                            className="cursor-pointer"
                            type={ButtonFlavor.secondary}
                            text={TranslateService.translate(eventStore, 'CREATE_TRIP_FROM_SAVED_COLLECTION')}
                            onClick={() => {
                                // window.location.href = `${newDesignRootPath}/#createTrip`;
                                localStorage.setItem(mainPageContentTabLsKey, myTripsTabId);
                                window.location.hash = `createTrip?id=${item.collectionId}`;
                                rootStore.triggerTabsReRender();
                                rootStore.triggerHeaderReRender();
                                // window.location.reload();

                                window.scrollTo({
                                    top: eventStore.isMobile ? MOBILE_SCROLL_TOP : 500,
                                    behavior: 'smooth',
                                });
                            }}
                        />
                    </div>
                )}
                {mainFeed && !myTrips && !savedCollection && (
                    <div className="margin-bottom-20 flex-column width-100-percents">
                        <Button
                            flavor={alreadyInSaved ? ButtonFlavor.success : ButtonFlavor.secondary}
                            onClick={() => {
                                setIsAddingToSaved(true);
                                if (alreadyInSaved){
                                    return handleRemoveFromSaved().then(() => setIsAddingToSaved(false));
                                }
                                return handleAddToSaved().then(() => setIsAddingToSaved(false));
                            }}
                            disabled={!item.id}
                            isLoading={isAddingToSaved}
                            key={`save-button-${item.id}-${feedStore.reRenderCounter}`}
                            icon={alreadyInSaved ? "fa fa-heart" : "fa fa-heart-o"}
                            text={alreadyInSaved ? TranslateService.translate(eventStore, 'UNLIKE_BUTTON') : TranslateService.translate(eventStore, 'LIKED_BUTTON')}
                            className={getClasses("padding-inline-15", !alreadyInSaved, "black")}
                        />
                    </div>
                )}
                {(mainFeed || (isSearchResult && isSmall)) && !myTrips && !savedCollection && !isInPlan && (
                    <div className={getClasses(isSmall && "flex-column align-items-center", isSmall && !eventStore.isMobile && 'margin-bottom-10')}>
                        <Button
                            flavor={ButtonFlavor.secondary}
                            onClick={() => {
                                localStorage.setItem(`item-${item.id}-name`, item.name);
                                window.location.hash = `${specificItemTabId}?id=${item.id}`;
                                window.location.href = `${newDesignRootPath}${window.location.hash}`;
                                // window.location.assign(`${newDesignRootPath}${window.location.hash}`)
                                rootStore.triggerTabsReRender();
                                rootStore.triggerHeaderReRender();
                            }}
                            key={`open-button-${item.id}-${feedStore.reRenderCounter}`}
                            icon={`fa-chevron-${eventStore.getCurrentDirectionEnd()}`}
                            text={TranslateService.translate(eventStore, 'OPEN_ITEM')}
                            className="min-width-150 width-max-content padding-inline-15 black"
                        />
                    </div>
                )}
                {onClick && (
                    <div className={getClasses("margin-bottom-20 flex-column", (!isSmall || eventStore.isMobile) ? 'margin-top-20 align-items-center' : 'width-100-percents')}>
                        <Button
                            icon={onClickIcon ?? `fa-angle-double-${eventStore.getCurrentDirectionEnd()}`}
                            className={getClasses("cursor-pointer", eventStore.isMobile && 'black', eventStore.isMobile && 'min-width-150 padding-inline-15')}
                            type={ButtonFlavor.secondary}
                            text={onClickText ?? TranslateService.translate(eventStore, isTemplateUsername() ? 'OPEN_TEMPLATE' : 'OPEN_TRIP')}
                            onClick={() => onClick()}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export { PointOfInterestShimmering, Image };

export default observer(PointOfInterest);
