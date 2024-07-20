import React, {useState} from 'react';
import {Carousel} from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import {FaHeart, FaRegStar, FaStar, FaStarHalfAlt} from 'react-icons/fa';
import Button, {ButtonFlavor} from '../../../components/common/button/button'; // Import your Button component
import './point-of-interest.scss';
import ReactModalService from "../../../services/react-modal-service";
import {TripActions} from "../../../utils/interfaces";
import {TriplanPriority} from "../../../utils/enums";
import {extractCategory, getClasses} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {EventStore} from "../../../stores/events-store";

interface PointOfInterestProps {
    item: any, // getyourguide / dubaicoil result
    eventStore: EventStore,
    mainFeed?: boolean;
}

const PointOfInterest = ({ item, eventStore, mainFeed }: PointOfInterestProps) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const isHebrew = eventStore.isHebrew;
    const feedId = `${item.source}-${item.name}-${item.url}`;

    const category = extractCategory([
        item.name ?? '',
        item.description ?? '',
    ].filter(Boolean))
    item.category = item.category || category || "CATEGORY.GENERAL";

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
        if (hours === 0 && minutes > 0) return TranslateService.translate(eventStore, 'X_MINUTES', { X: minutes });
        if (hours === 1 && minutes === 0) return TranslateService.translate(eventStore, 'ONE_HOUR');
        if (hours > 0 && minutes === 0) return TranslateService.translate(eventStore, 'X_HOURS', { X: hours});
        if (hours > 0 && minutes > 0) return TranslateService.translate(eventStore, 'X_HOURS_Y_MINUTES', { X: hours, Y: minutes});
        return TranslateService.translate(eventStore, 'X_HOURS');
    };

    const durationText = formatDuration(item.duration);

    const handleAddToPlan = () => {
        if (mainFeed){
            return; // since we're not on specific trip.
        }

        let categoryId = undefined;

        if (item.category) {
            const existingCategory = eventStore.categories.filter((c) => c.title === item.category);
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
            TripActions.addedNewSidebarEventFromTinder
        );
    };

    const alreadyInPlan = !![...eventStore.calendarEvents, ...eventStore.allSidebarEvents].find((i) => i.extra?.feedId == feedId);
    const alreadyInSaved = false; // todo complete

    function getRating(){
        let rating = item.rate?.rating?.toFixed(1);
        if (rating?.toString()?.endsWith(".0")){
            rating = item.rate?.rating.toFixed(0);
        }
        return rating;
    }

    const rating = getRating();

    const handleAddToSaved = () => {
        alert("todo complete!");
    }

    function renderSaveButton() {
        if (mainFeed) {
            return (
                <Button
                    flavor={alreadyInSaved ? ButtonFlavor.success : ButtonFlavor.primary}
                    onClick={handleAddToSaved}
                    icon={alreadyInSaved ? "fa fa-heart" : "fa fa-heart-o"}
                    text={alreadyInSaved ? TranslateService.translate(eventStore, "REMOVE_FROM_SAVED") : TranslateService.translate(eventStore, "KEEP_TO_SAVED")}
                    disabled={alreadyInSaved}
                    className="padding-inline-15"
                />
            );
        }
        return (
            <Button
                flavor={alreadyInPlan ? ButtonFlavor.success : ButtonFlavor.primary}
                onClick={handleAddToPlan}
                icon={alreadyInPlan ? "fa fa-check" : undefined}
                text={alreadyInPlan ? TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADDED_TO_PLAN') : TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADD_TO_PLAN')}
                disabled={alreadyInPlan || eventStore.isTripLocked || !eventStore.canWrite}
                className="padding-inline-15"
            />
        );
    }

    const isShrinkedMode = eventStore.isMobile || mainFeed;

    return (
        <div className={getClasses('point-of-interest', isHebrew && 'hebrew-mode', mainFeed && 'main-feed')}>
            <div className="poi-left">
                <div className="carousel-wrapper">
                    <Carousel showThumbs={false}>
                        {item.images.map((image, index) => (
                            <div key={index}>
                                <img src={image} alt={item.name} />
                            </div>
                        ))}
                    </Carousel>
                </div>
            </div>
            <div className="poi-right">
                {item.priority === 'high' && <div className="top-pick-label">{TranslateService.translate(eventStore, 'TOP_PICK')}</div>}
                {item.category && <div className="category-label">{TranslateService.translate(eventStore, item.category)}</div>}
                {isShrinkedMode ? <h4>{item.name}</h4> : <h2>{item.name}</h2>}
                <span className={getClasses("description", isShrinkedMode && 'max-height-100-ellipsis')}>{item.description}</span>
                <div className="poi-details">
                    {durationText && <span className="duration">{durationText}</span>}
                    {item.extra?.price && <span className="price">{TranslateService.translate(eventStore, 'POINT_OF_INTEREST.PRICE', {
                        price: item.extra.price,
                        currency: item.extra.currency === 'ILS' ? '₪' : item.extra.currency
                    })}</span>}
                    {!!item.rate && !!item.rate.rating && <div className="rate">
                        {renderStars(item.rate.rating)}
                        <span>{TranslateService.translate(eventStore, item.rate.quantity ? 'POINT_OF_INTEREST.REVIEWS' : 'POINT_OF_INTEREST.REVIEWS.SHORT', {
                            rate: rating,
                            rateMax: 5,
                            quantity: item.rate.quantity
                        })}
                        </span>
                    </div>}
                    {isShrinkedMode && (
                        <div className="poi-footer-links">
                            <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>
                            {item.location && (
                                <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                            )}
                            <div className="source-logo">
                                <img src={`/images/${item.source.toLowerCase().replaceAll(".", "")}.png`} alt={item.source} />
                            </div>
                        </div>
                    )}
                    <div className="poi-footer">
                        {!isShrinkedMode && <div className="source-logo">
                            <img src={`/images/${item.source.toLowerCase().replaceAll(".", "")}.png`} alt={item.source} />
                        </div>}
                        {!isShrinkedMode && <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>}
                        {item.location && !isShrinkedMode && (
                            <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                        )}
                        {renderSaveButton()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointOfInterest;
