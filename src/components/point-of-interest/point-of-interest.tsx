import React, { useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { FaHeart, FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import Button, { ButtonFlavor } from '../common/button/button'; // Import your Button component
import './point-of-interest.scss';
import ReactModalService from "../../services/react-modal-service";
import {TripActions} from "../../utils/interfaces";
import {TriplanPriority} from "../../utils/enums";
import {extractCategory} from "../../utils/utils";
import TranslateService from "../../services/translate-service";
import {EventStore} from "../../stores/events-store";

interface PointOfInterestProps {
    item: any, // getyourguide result
    eventStore: EventStore,
}

const PointOfInterest = ({ item, eventStore }: PointOfInterestProps) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const isHebrew = eventStore.isHebrew;
    const feedId = `${item.source}-${item.name}-${item.url}`;

    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${item.location?.latitude},${item.location?.longitude}`;

    const handleFavoriteClick = () => {
        setIsFavorite(!isFavorite);
    };

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
        let categoryId = undefined;

        const category = extractCategory([
            item.name ?? '',
            item.description ?? '',
        ].filter(Boolean))
        item.category = item.category || category || "כללי";

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
                            title: item.category,
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
                extra: {
                    ...item.extra,
                    feedId
                }
            },
            true,
            undefined,
            TripActions.addedNewSidebarEventFromTinder
        );
    };

    const alreadyInPlan = !![...eventStore.calendarEvents, ...eventStore.allSidebarEvents].find((i) => i.extra?.feedId == feedId);


    return (
        <div className={`point-of-interest ${isHebrew ? 'hebrew-mode' : ''}`}>
            <div className="poi-left">
                <div className="carousel-wrapper">
                    <Carousel showThumbs={false}>
                        {item.images.map((image, index) => (
                            <div key={index}>
                                <img src={image} alt={item.name} />
                            </div>
                        ))}
                    </Carousel>
                    {/*<FaHeart*/}
                    {/*    className={`heart-icon ${isFavorite ? 'filled' : ''}`}*/}
                    {/*    onClick={handleFavoriteClick}*/}
                    {/*/>*/}
                </div>
            </div>
            <div className="poi-right">
                {item.priority === 'high' && <div className="top-pick-label">{TranslateService.translate(eventStore, 'TOP_PICK')}</div>}
                {item.category && <div className="category-label">{item.category}</div>}
                <h2>{item.name}</h2>
                <span className="description">{item.description}</span>
                <div className="poi-details">
                    {durationText && <span className="duration">{durationText}</span>}
                    {item.extra?.price && <span className="price">{TranslateService.translate(eventStore, 'POINT_OF_INTEREST.PRICE', {
                        price: item.extra.price
                    })}</span>}
                    <div className="rate">
                        {renderStars(item.rate.rating)}
                        <span>{TranslateService.translate(eventStore, 'POINT_OF_INTEREST.REVIEWS', {
                            rate: item.rate.rating.toFixed(1),
                            rateMax: 5,
                            quantity: item.rate.quantity
                        })}
                        </span>
                    </div>
                    {eventStore.isMobile && (
                        <div className="poi-footer-links">
                            <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>
                            {item.location && (
                                <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                            )}
                        </div>
                    )}
                    <div className="poi-footer">
                        <div className="source-logo">
                            <img src="/images/getyourguide.png" alt="GetYourGuide" />
                        </div>
                        {!eventStore.isMobile && <a href={item.more_info} className="more-info" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'MORE_INFO')}</a>}
                        {item.location && !eventStore.isMobile && (
                            <a href={googleMapsLink} className="google-maps-link" target="_blank" rel="noopener noreferrer">{TranslateService.translate(eventStore, 'VIEW_ON_GOOGLE_MAPS')}</a>
                        )}
                        <Button
                            flavor={ButtonFlavor.primary}
                            onClick={handleAddToPlan}
                            text={alreadyInPlan ? TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADDED_TO_PLAN') : TranslateService.translate(eventStore, 'POINT_OF_INTEREST.ADD_TO_PLAN')}
                            disabled={alreadyInPlan}
                            className="button-custom"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointOfInterest;
