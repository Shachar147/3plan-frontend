import React, { useContext, useEffect, useState, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { myTripsContext } from '../../stores/my-trips-store';
import { rootStoreContext } from '../../stores/root-store';
import { walkthroughStoreContext } from '../../stores/walkthrough-store';
import TranslateService from '../../../services/translate-service';
import { getOnboardingGuideSteps, GuideMode } from './steps';
import './onboarding-guide.scss';
import { CustomStep } from './steps';

const DEFAULT_ONBOARDING_Z_INDEX = 100000; // Default z-index for onboarding tooltips

interface OnboardingGuideProps {
	mode?: GuideMode;
}

function OnboardingGuide({ mode }: OnboardingGuideProps) {
	const eventStore = useContext(eventStoreContext);
	const myTripsStore = useContext(myTripsContext);
	const rootStore = useContext(rootStoreContext);
	const walkthroughStore = useContext(walkthroughStoreContext);

	const [run, setRun] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);

	// Determine mode from route if not provided as prop
	const [detectedMode, setDetectedMode] = useState<GuideMode>(() => {
		if (mode) {
			return mode;
		}
		const isOnPlanPage = window.location.pathname.includes('/plan/');
		return isOnPlanPage ? GuideMode.PLAN : GuideMode.MAIN_PAGE;
	});

	// Listen for route changes to update mode
	useEffect(() => {
		if (mode) {
			// If mode is provided as prop, use it
			setDetectedMode(mode);
			return;
		}

		const detectMode = () => {
			const isOnPlanPage = window.location.pathname.includes('/plan/');
			setDetectedMode(isOnPlanPage ? GuideMode.PLAN : GuideMode.MAIN_PAGE);
		};

		detectMode(); // Initial check

		// Listen for route changes
		window.addEventListener('popstate', detectMode);
		window.addEventListener('hashchange', detectMode);

		// Use MutationObserver to detect route changes (for SPAs)
		const observer = new MutationObserver(() => {
			detectMode();
		});
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			window.removeEventListener('popstate', detectMode);
			window.removeEventListener('hashchange', detectMode);
			observer.disconnect();
		};
	}, [mode]);

	const guideMode = mode || detectedMode;

	// Helper function to scroll to element with -100px offset
	const scrollToElementWithOffset = (element: HTMLElement, offset = -150) => {
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset + offset;

		window.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

	// Helper function to scroll element to middle of viewport
	const scrollToElementCenter = (element: HTMLElement, container = window) => {
		const elementRect = element.getBoundingClientRect();
		const offset = -200; // -1 * (elementRect.height / 2);

		// const elementPosition = element.getBoundingClientRect().top;
		// const offsetPosition = elementPosition + (container.pageYOffset ?? 0) + (offset ?? 0);

		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + (container.pageYOffset ?? 0) + offset;

		// console.log("hereee", elementPosition, container.pageYOffset, offsetPosition, offset);
		// console.log('hereee', elementPosition, offsetPosition);

		container.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

	// Get walkthrough steps based on mode
	const steps = useMemo(
		() => getOnboardingGuideSteps(eventStore, rootStore, walkthroughStore, guideMode),
		[
			eventStore,
			rootStore,
			walkthroughStore,
			eventStore.isMobile,
			guideMode,
			eventStore.viewMode,
			eventStore.mobileViewMode,
		]
	);

	// Auto-start walkthrough for new users (only in FULL mode)
	useEffect(() => {
		if (
			(walkthroughStore.shouldAutoStart && myTripsStore.totalTrips === 0 && guideMode === GuideMode.MAIN_PAGE) ||
			eventStore.tripName.includes(TranslateService.translate(eventStore, 'WALKTHROUGH.EXAMPLE'))
		) {
			// Small delay to ensure page is fully loaded
			const timer = setTimeout(() => {
				setRun(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [walkthroughStore.shouldAutoStart, myTripsStore.totalTrips, guideMode, eventStore.tripName]);

	// Handle walkthrough callbacks
	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status, type, index, action } = data;

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
			setRun(false);
			walkthroughStore.completeWalkthrough();
		}

		if (type === 'step:before') {
			const currentStep = steps[index];
			if (currentStep && currentStep.beforeAction) {
				currentStep.beforeAction().then(() => {
					// Auto-advance if this step has autoAdvance enabled
					if (currentStep && (currentStep as any).autoAdvance === true) {
						setTimeout(() => {
							setStepIndex(index + 1);
						}, 300); // Small delay to ensure UI is updated
					}
				});
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
			const currentStep = steps[index] as CustomStep;

			// Apply custom z-index if specified for this step (after positioning is done)
			if (currentStep && currentStep.customZIndex !== undefined) {
				setTimeout(() => {
					const zIndex = currentStep.customZIndex!;
					const tooltip = document.querySelector('.react-joyride__tooltip') as HTMLElement;
					const tooltipContainer = document.querySelector('.react-joyride__tooltipContainer') as HTMLElement;
					const overlay = document.querySelector('.react-joyride__overlay') as HTMLElement;
					const spotlight = document.querySelector('.react-joyride__spotlight') as HTMLElement;

					if (tooltip) {
						// Apply z-index - this shouldn't affect transform/position
						tooltip.style.zIndex = `${zIndex}`;
					}
					if (tooltipContainer) tooltipContainer.style.zIndex = `${zIndex}`;
					if (overlay) overlay.style.zIndex = `${zIndex - 1}`;
					if (spotlight) spotlight.style.zIndex = `${zIndex - 2}`;

					console.log('[Walkthrough] Applied custom z-index:', zIndex, 'for step', index);
				}, 150); // Delay to ensure Joyride has finished initial positioning
			}

			// Disable Next button if step has autoAdvance enabled
			if (currentStep && currentStep.autoAdvance === true) {
				setTimeout(() => {
					const nextButton = document.querySelector(
						'.react-joyride__tooltip button[data-action="primary"]'
					) as HTMLButtonElement;
					if (nextButton) {
						nextButton.disabled = true;
						nextButton.style.opacity = '0.5';
						nextButton.style.cursor = 'not-allowed';
						console.log('[Walkthrough] Disabled Next button for auto-advance step');
					}
				}, 150);
			}

			setTimeout(() => {
				// Handle custom position offset (for tooltips that need horizontal offset)
				// This runs after z-index is applied to ensure positioning is correct
				const tooltip = document.querySelector('.react-joyride__tooltip') as HTMLElement;
				const spotlight = document.querySelector('.react-joyride__spotlight') as HTMLElement;

				// Fix spotlight alignment with arrow by repositioning it based on target element
				const fixSpotlightPosition = () => {
					if (currentStep && currentStep.target && currentStep.target !== 'body') {
						const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
						const spotlightElement = document.querySelector('.react-joyride__spotlight') as HTMLElement;

						if (targetElement && spotlightElement) {
							// Get the target element's bounding box
							const targetRect = targetElement.getBoundingClientRect();

							// Joyride uses fixed positioning for spotlight, so we need to use viewport coordinates
							// Apply padding/margin if needed (Joyride often adds padding around the spotlight)
							const padding = 10;

							// Set spotlight position to match target element (using fixed positioning like Joyride does)
							spotlightElement.style.position = 'fixed';
							spotlightElement.style.top = `${targetRect.top - padding}px`;
							spotlightElement.style.left = `${targetRect.left - padding}px`;
							spotlightElement.style.width = `${targetRect.width + padding * 2}px`;
							spotlightElement.style.height = `${targetRect.height + padding * 2}px`;
							spotlightElement.style.transform = 'none'; // Remove any transforms that might be applied

							console.log('[Walkthrough] Repositioned spotlight to match target element:', {
								top: targetRect.top - padding,
								left: targetRect.left - padding,
								width: targetRect.width + padding * 2,
								height: targetRect.height + padding * 2,
							});
						}
					}
				};

				// Fix spotlight position multiple times with delays to catch Joyride's positioning updates
				if (currentStep && currentStep.target && currentStep.target !== 'body') {
					if (currentStep.fixSpotlightPosition) {
						fixSpotlightPosition();
						setTimeout(fixSpotlightPosition, 200);
						setTimeout(fixSpotlightPosition, 400);
						setTimeout(fixSpotlightPosition, 600);

						// Also use MutationObserver to watch for changes to the spotlight element
						const spotlightObserver = new MutationObserver(() => {
							fixSpotlightPosition();
						});

						const spotlightElement = document.querySelector('.react-joyride__spotlight') as HTMLElement;
						if (spotlightElement) {
							spotlightObserver.observe(spotlightElement, {
								attributes: true,
								attributeFilter: ['style', 'class'],
								childList: false,
								subtree: false,
							});

							// Also observe the target element in case it moves
							const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
							if (targetElement) {
								spotlightObserver.observe(targetElement, {
									attributes: true,
									attributeFilter: ['style', 'class'],
									childList: false,
									subtree: false,
								});
							}

							// Clean up observer after 5 seconds (step should have moved on by then)
							setTimeout(() => {
								spotlightObserver.disconnect();
							}, 5000);
						}
					}
				}

				if (currentStep && (currentStep as any).customPositionOffset !== undefined && tooltip) {
					const offset = (currentStep as any).customPositionOffset;
					const isPercent = (currentStep as any).customPositionOffsetPercent === true;
					let offsetValue: string;

					if (isPercent) {
						// Calculate offset as percentage of screen width
						// offset is already a percentage (e.g., -33.33 or +33.33)
						const screenWidth = window.innerWidth;
						const offsetPixels = (screenWidth * offset) / 100;
						offsetValue = `${offsetPixels}px`;
						console.log(
							'[Walkthrough] Applied percentage offset:',
							offset,
							'% of',
							screenWidth,
							'px =',
							offsetPixels,
							'px'
						);
					} else {
						// Use pixels directly
						offsetValue = `${offset}px`;
					}

					// Add transition for smooth animation
					tooltip.style.transition = 'transform 0.4s ease-out';

					// Get current transform (may already have translateX/Y from Joyride or z-index step)
					const currentTransform = tooltip.style.transform || '';
					const translateXMatch = currentTransform.match(/translateX\(([^)]+)\)/);
					const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);

					// Build transform with translateX and preserve translateY if it exists
					let transforms: string[] = [];
					transforms.push(`translateX(${offsetValue})`);

					// Preserve translateY if it exists
					if (translateYMatch) {
						transforms.push(`translateY(${translateYMatch[1]})`);
					}

					const newTransform = transforms.join(' ');

					// Use requestAnimationFrame to ensure smooth animation start
					requestAnimationFrame(() => {
						tooltip.style.transform = newTransform;
						console.log(
							'[Walkthrough] Applied custom position offset:',
							offsetValue,
							'Total transform:',
							newTransform
						);
					});
				}

				if (currentStep && currentStep.target && currentStep.target !== 'body') {
					const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
					if (targetElement) {
						console.log('currentStep', currentStep);
						// For sidebar-categories, scroll to center; otherwise use offset
						if (currentStep.scrollToCenter) {
							if (currentStep.container) {
								const container = document.querySelector(currentStep.container) as HTMLElement;
								if (container) {
									scrollToElementCenter(targetElement, container as any);
								} else {
									scrollToElementCenter(targetElement);
								}
							} else {
								scrollToElementCenter(targetElement);
							}
						} else {
							scrollToElementWithOffset(targetElement);
						}
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

	// Get current step's z-index (use custom if specified, otherwise use default)
	const currentStep = steps[stepIndex] as CustomStep | undefined;
	const currentZIndex = currentStep?.customZIndex ?? DEFAULT_ONBOARDING_Z_INDEX;

	return (
		<Joyride
			key={walkthroughStore.onboardingRerenderKey}
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
					zIndex: currentZIndex,
				},
				tooltip: {
					zIndex: currentZIndex,
				},
				tooltipContainer: {
					zIndex: currentZIndex,
				},
				overlay: {
					zIndex: currentZIndex - 1,
				},
				spotlight: {
					zIndex: currentZIndex - 2,
				},
			}}
			locale={joyrideLocale}
		/>
	);
}

export default observer(OnboardingGuide);
