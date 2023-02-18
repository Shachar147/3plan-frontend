import { observer } from 'mobx-react';
import DestinationBox from '../destination-box/destination-box';
import React, { useContext, useEffect } from 'react';
import { adminStoreContext } from '../../stores/admin-store';
import { useNavigate } from 'react-router-dom';
import './destination-slider.scss';
import { eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';

export interface DestinationSliderProps {
	currDestination?: string;
}

const DestinationSlider = ({ currDestination }: DestinationSliderProps) => {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	const destinations = Array.from(adminStore.placesByDestination.keys()).filter((x) => {
		return (
			x.toLowerCase().indexOf(eventStore.searchValue.toLowerCase()) !== -1 ||
			TranslateService.translate(eventStore, x).indexOf(eventStore.searchValue.toLowerCase()) !== -1
		);
	});

	const navigate = useNavigate();

	const backIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-right' : 'fa-chevron-left';
	const nextIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-left' : 'fa-chevron-right';

	function sideScroll(element, direction, speed, distance, step) {
		var scrollAmount = 0;
		var slideTimer = setInterval(function () {
			if (direction == 'left') {
				element.scrollLeft -= step;
			} else {
				element.scrollLeft += step;
			}
			scrollAmount += step;
			if (scrollAmount === distance) {
				// element.scrollLeft = distance;
				window.clearInterval(slideTimer);
			}
		}, speed);
	}

	const slideBack = () => {
		const direction = eventStore.getCurrentDirection() === 'rtl' ? 'right' : 'left';
		const scrollingElement = document.getElementsByClassName('destination-slider')[0];
		sideScroll(scrollingElement, direction, 10, 300, 10);
	};
	const slideNext = () => {
		const direction = eventStore.getCurrentDirection() === 'rtl' ? 'left' : 'right';
		const scrollingElement = document.getElementsByClassName('destination-slider')[0];
		sideScroll(scrollingElement, direction, 10, 300, 10);
	};

	return (
		<div className="flex-row align-items-center gap-10">
			<i className={`slider-navigator fa ${backIcon}`} onClick={() => slideBack()} />
			<div className="destination-slider">
				<div className="destinations-content">
					{destinations
						.sort(
							(a, b) =>
								adminStore.placesByDestination.get(b)!.length -
								adminStore.placesByDestination.get(a)!.length
						)
						.map((destination) => {
							const places = adminStore.placesByDestination.get(destination)!;
							const mediaError = places.filter(
								(i) =>
									(i.images.length > 0 && !i.downloadedImages?.length) ||
									(i.videos.length > 0 && !i.downloadedVideos?.length)
							);
							const nameError = places.filter((i) => i.name.indexOf('http') !== -1);
							const categoryError = places.filter((i) => !i.category.length);
							return (
								<DestinationBox
									name={destination}
									numOfItems={places.length}
									numOfMediaError={mediaError.length}
									numOfNameError={nameError.length}
									numOfCategoryError={categoryError.length}
									onClick={() => {
										navigate(`/admin/destination/${destination.replace('/', '')}`);
									}}
									isActive={destination === currDestination}
								/>
							);
						})}
				</div>
			</div>
			<i className={`slider-navigator fa ${nextIcon}`} onClick={() => slideNext()} />
		</div>
	);
};

export default observer(DestinationSlider);
