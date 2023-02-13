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
				scrollAmount -= step;
			} else {
				element.scrollLeft += step;
				scrollAmount += step;
			}
			scrollAmount += step;
			console.log(distance, element.scrollLeft);
			if (Math.abs(element.scrollLeft - distance) <= 9) {
				element.scrollLeft = distance;
				window.clearInterval(slideTimer);
			}
		}, speed);
	}

	// useEffect(() => {
	// 	const activeElement = document.getElementsByClassName('active')?.[0];
	// 	if (activeElement) {
	// 		console.log(activeElement.offsetLeft);
	// 		let leftPos = activeElement.offsetLeft;
	// 		leftPos -= 100;
	//
	// 		setInterval(() => {}, 100);
	//
	// 		const scrollingElement = document.getElementsByClassName('destination-slider')[0];
	// 		sideScroll(scrollingElement, 'left', 10, leftPos, 10);
	// 	}
	// }, []);

	return (
		<div className="flex-row align-items-center gap-10">
			<i className={`fa ${backIcon}`} />
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
			<i className={`fa ${nextIcon}`} />
		</div>
	);
};

export default observer(DestinationSlider);
