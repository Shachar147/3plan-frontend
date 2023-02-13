import { observer } from 'mobx-react';
import DestinationBox from '../../components/destination-box/destination-box';
import React, { useContext, useEffect } from 'react';
import { adminStoreContext } from '../../stores/admin-store';
import { useNavigate } from 'react-router-dom';
import './destination-slider.scss';
import { eventStoreContext } from '../../../stores/events-store';

export interface DestinationSliderProps {
	currDestination?: string;
}

const DestinationSlider = ({ currDestination }: DestinationSliderProps) => {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	const destinations = Array.from(adminStore.placesByDestination.keys());

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
		const scrollingElement = document.getElementsByClassName('destination-slider')[0];
		sideScroll(scrollingElement, 'right', 10, 300, 10);
		// scrollingElement.scrollLeft += 60;
	};
	const slideNext = () => {
		const scrollingElement = document.getElementsByClassName('destination-slider')[0];
		// scrollingElement.scrollLeft -= 60;
		sideScroll(scrollingElement, 'left', 10, 300, 10);
	};

	return (
		<div className="flex-row align-items-center gap-10">
			<i className={`slider-navigator fa ${backIcon}`} onClick={() => slideBack()} />
			<div className="destination-slider">
				<div className="destinations-content">
					{destinations.map((destination) => {
						const places = adminStore.placesByDestination.get(destination)!;
						return (
							<DestinationBox
								name={destination}
								numOfItems={places.length}
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
