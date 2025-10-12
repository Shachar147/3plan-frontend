import React, { useState, useEffect, useContext } from 'react';
import './scroll-top.scss';
import { newDesignRootPath } from '../../utils/consts';
import { getClasses } from '../../../utils/utils';
import { eventStoreContext } from '../../../stores/events-store';

export const MOBILE_SCROLL_TOP = 115;
export const DESKTOP_SCROLL_TOP = 61;

interface ScrollTopButtonProps {
	scrollDistance?: number;
	containerRef?: React.RefObject<HTMLElement>;
	isSticky?: boolean;
}

const ScrollToTopButton = ({ scrollDistance, containerRef, isSticky }: ScrollTopButtonProps) => {
	const [isVisible, setIsVisible] = useState(false);

	const eventStore = useContext(eventStoreContext);

	if (!scrollDistance) {
		scrollDistance = eventStore.isMobile ? 4000 : 1600;
	}

	const isInPlan = window.location.href.includes(`${newDesignRootPath}/plan/`);

	useEffect(() => {
		const scrollContainer = containerRef?.current || window;

		const toggleVisibility = () => {
			const scrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;

			if (scrollTop > scrollDistance) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		scrollContainer.addEventListener('scroll', toggleVisibility);

		return () => scrollContainer.removeEventListener('scroll', toggleVisibility);
	}, [scrollDistance]);

	const scrollToTop = () => {
		const scrollContainer = containerRef?.current || window;
		if (scrollContainer === window) {
			window.scrollTo({
				top: isInPlan ? 0 : eventStore.isMobile ? MOBILE_SCROLL_TOP : DESKTOP_SCROLL_TOP,
				behavior: 'smooth',
			});
		} else {
			scrollContainer.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};

	return (
		isVisible && (
			<div
				className={getClasses(
					'scroll-top-container',
					eventStore.isMobile && isInPlan && 'bottom-70',
					isSticky && 'position-sticky margin-inline-end-10'
				)}
			>
				<button onClick={scrollToTop}>
					<i className="fa fa-arrow-up" />
				</button>
			</div>
		)
	);
};

export default ScrollToTopButton;
