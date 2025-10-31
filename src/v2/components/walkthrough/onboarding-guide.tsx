import React, { useContext, useEffect, useState, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { myTripsContext } from '../../stores/my-trips-store';
import { rootStoreContext } from '../../stores/root-store';
import { walkthroughStoreContext } from '../../stores/walkthrough-store';
import TranslateService from '../../../services/translate-service';
import { getOnboardingGuideSteps } from './steps';
import './onboarding-guide.scss';

function OnboardingGuide() {
	const eventStore = useContext(eventStoreContext);
	const myTripsStore = useContext(myTripsContext);
	const rootStore = useContext(rootStoreContext);
	const walkthroughStore = useContext(walkthroughStoreContext);

	const [run, setRun] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);

	// Helper function to scroll to element with -100px offset
	const scrollToElementWithOffset = (element: HTMLElement, offset = -150) => {
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset + offset;

		window.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

	// Get walkthrough steps
	const steps = useMemo(
		() => getOnboardingGuideSteps(eventStore, rootStore),
		[eventStore, rootStore, eventStore.isMobile]
	);

	// Auto-start walkthrough for new users
	useEffect(() => {
		if (walkthroughStore.shouldAutoStart && myTripsStore.totalTrips === 0) {
			// Small delay to ensure page is fully loaded
			const timer = setTimeout(() => {
				setRun(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [walkthroughStore.shouldAutoStart, myTripsStore.totalTrips]);

	// Handle walkthrough callbacks
	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status, type, index, action } = data;

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
			setRun(false);
			walkthroughStore.completeWalkthrough();
		}

		console.log('heree', data);

		if (type === 'step:before') {
			const currentStep = steps[index];
			if (currentStep && currentStep.beforeAction) {
				currentStep.beforeAction();
			}
		}

		if (type === 'step:after') {
			const currentStep = steps[index];
			if (currentStep && currentStep.afterAction) {
				currentStep.afterAction();
			}

			if (action === 'prev') {
				setStepIndex(index - 1);
			} else if (action === 'next') {
				setStepIndex(index + 1);
			}
		}

		// After tooltip is shown, scroll to target element with offset
		if (type === 'tooltip') {
			const currentStep = steps[index];

			setTimeout(() => {
				if (currentStep && currentStep.target) {
					const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
					if (targetElement) {
						scrollToElementWithOffset(targetElement);
					}
				}
			}, 100);

			if (currentStep) {
				setTimeout(() => {
					currentStep.duringAction?.();
				}, 1000);
			}
		}
	};

	// Start walkthrough manually
	const startWalkthrough = () => {
		setRun(true);
		setStepIndex(0);
	};

	// Expose start function for help icon
	useEffect(() => {
		// @ts-ignore
		window.startWalkthrough = startWalkthrough;
	}, []);

	// Fix button text translation after Joyride renders
	useEffect(() => {
		if (!run) return;

		const updateButtonText = () => {
			const nextButton = document.querySelector(
				'.react-joyride__tooltip button[data-action="primary"]'
			) as HTMLElement;
			if (nextButton) {
				const currentText = nextButton.textContent || '';
				// Replace "Next" with Hebrew translation if current language is Hebrew
				if (eventStore.calendarLocalCode === 'he') {
					const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');

					// On mobile, show only "Next" without step count for cleaner look
					if (eventStore.isMobile) {
						nextButton.textContent = nextText;
					} else {
						// On desktop, show step count
						// Check if button shows progress format like "Next (Step 1 of 23)"
						if (currentText.includes('(Step') || currentText.includes('(שלב')) {
							const match = currentText.match(/\((.+)\)/);
							if (match) {
								// Extract step number part and replace "Step" with Hebrew equivalent
								const stepPart = match[1]
									.replace(/Step/g, 'שלב')
									.replace(/step/g, 'שלב')
									.replace(/of/g, 'מתוך');
								nextButton.textContent = `${nextText} (${stepPart})`;
							}
						} else {
							// Simple replacement if no progress text
							nextButton.textContent = nextText;
						}
					}
				} else if (eventStore.isMobile) {
					// For non-Hebrew languages on mobile, also hide step count
					const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');
					if (currentText.includes('(Step') || currentText.includes('(')) {
						nextButton.textContent = nextText;
					}
				}
			}
		};

		// Update immediately and also after delays to catch dynamic updates
		updateButtonText();
		const timers = [
			setTimeout(updateButtonText, 50),
			setTimeout(updateButtonText, 150),
			setTimeout(updateButtonText, 300),
		];

		// Use MutationObserver to watch for button text changes
		const observer = new MutationObserver(updateButtonText);
		const tooltip = document.querySelector('.react-joyride__tooltip');
		if (tooltip) {
			observer.observe(tooltip, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		return () => {
			timers.forEach((timer) => clearTimeout(timer));
			observer.disconnect();
		};
	}, [run, stepIndex, eventStore.calendarLocalCode, eventStore.isMobile]);

	// Get translated strings
	const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');
	const backText = TranslateService.translate(eventStore, 'WALKTHROUGH.BACK');
	const skipText = TranslateService.translate(eventStore, 'WALKTHROUGH.SKIP');
	const finishText = TranslateService.translate(eventStore, 'WALKTHROUGH.FINISH');

	// Create custom locale object with proper translations
	const joyrideLocale = {
		back: backText,
		close: skipText,
		last: finishText,
		next: nextText,
		skip: skipText,
	};

	return (
		<Joyride
			steps={steps}
			run={run}
			stepIndex={stepIndex}
			callback={handleJoyrideCallback}
			continuous
			showProgress
			showSkipButton
			disableScrolling={true}
			styles={{
				options: {
					primaryColor: '#007bff',
					textColor: '#333',
					backgroundColor: '#fff',
					overlayColor: 'rgba(0, 0, 0, 0.5)',
					arrowColor: '#fff',
					width: 400,
				},
			}}
			locale={joyrideLocale}
		/>
	);
}

export default observer(OnboardingGuide);
