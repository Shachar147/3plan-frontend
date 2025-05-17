import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import './main-page.scss';
import TriplanHeaderBanner from '../../components/triplan-header-banner/triplan-header-banner';
import { useHandleWindowResize } from '../../../custom-hooks/use-window-size';
import MainPageContent from './main-page-content';
import TriplanFooter from '../../components/triplan-footer/triplan-footer';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';

function MainPageV2() {
	useHandleWindowResize();
	const [run, setRun] = useState(false);

	useEffect(() => {
		// Start the walkthrough after a short delay to ensure DOM is ready
		const timer = setTimeout(() => {
			setRun(true);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const steps: Step[] = [
		{
			target: '.system-recommendations-tab',
			content: 'Here you can see places we recommend to visit based on your interests and preferences.',
			// disableBeacon: true,
			placement: 'bottom',
		},
		{
			target: '.save-button',
			content: 'Click the heart button to save places you like to your collection for later.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.saved-collections-tab',
			content: 'View all your saved places here, organized by destination and popularity.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.create-trip-from-collection',
			content: 'Easily create a new trip from your saved places collection.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.create-trip-form',
			content: 'Customize your trip details here. Add hotels, flights, and other important information.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.create-trip-button',
			content: 'Click here to create your trip and start planning!',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.map-view',
			content:
				'View all your trip items on the map. Items are gray by default, but you can color-code them by priority.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.trip-sidebar',
			content:
				'Manage all your trip events here. Set priorities, move between categories, add times, descriptions, and photos.',
			placement: 'right',
			// disableBeacon: true,
		},
		{
			target: '.calendar-view',
			content: 'Schedule your activities using drag & drop or click to add events to your calendar.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.list-view',
			content: 'Get a text summary of your trip that you can easily copy and share.',
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.itinerary-view',
			content: "See your daily schedule with a map view of the day's activities and a modern summary.",
			placement: 'bottom',
			// disableBeacon: true,
		},
		{
			target: '.explore-tab',
			content:
				'Discover more recommended places based on your trip destinations. Add them to your current trip or save for later.',
			placement: 'bottom',
			// disableBeacon: true,
		},
	];

	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status } = data;
		if (status === 'finished' || status === 'skipped') {
			setRun(false);
		}
	};

	return (
		<div className="triplan-main-page-container flex-column">
			<Joyride
				steps={steps}
				run={run}
				continuous
				showSkipButton
				showProgress
				styles={{
					options: {
						primaryColor: '#ff0074',
						zIndex: 10000,
						arrowColor: '#fff',
						backgroundColor: '#fff',
						overlayColor: 'rgba(0, 0, 0, 0.5)',
						textColor: '#333',
					},
					tooltip: {
						padding: '8px 12px',
						fontSize: '14px',
						maxWidth: '85vw',
						width: 'auto',
					},
					tooltipContainer: {
						textAlign: 'center',
					},
					buttonNext: {
						padding: '6px 12px',
						fontSize: '14px',
					},
					buttonBack: {
						padding: '6px 12px',
						fontSize: '14px',
					},
					buttonSkip: {
						padding: '6px 12px',
						fontSize: '14px',
					},
				}}
				floaterProps={{
					offset: 20,
					disableFlip: false,
				}}
				callback={handleJoyrideCallback}
				locale={{
					last: 'Finish',
					next: 'Next',
					skip: 'Skip',
				}}
			/>
			<TriplanHeaderBanner />
			<MainPageContent />
			<TriplanFooter />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(MainPageV2);
