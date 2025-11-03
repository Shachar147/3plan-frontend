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

	const [detectedMode, setDetectedMode] = useState<GuideMode>(() => {
		if (mode) {
			return mode;
		}
		const isOnPlanPage = window.location.pathname.includes('/plan/');
		return isOnPlanPage ? GuideMode.PLAN : GuideMode.MAIN_PAGE;
	});

	useEffect(() => {
		if (mode) {
			setDetectedMode(mode);
			return;
		}

		const detectMode = () => {
			const isOnPlanPage = window.location.pathname.includes('/plan/');
			setDetectedMode(isOnPlanPage ? GuideMode.PLAN : GuideMode.MAIN_PAGE);
		};

		detectMode();

		window.addEventListener('popstate', detectMode);
		window.addEventListener('hashchange', detectMode);

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

	const scrollToElementWithOffset = (element: HTMLElement, offset = -150) => {
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset + offset;

		window.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

	const scrollToElementCenter = (element: HTMLElement, container = window) => {
		const elementRect = element.getBoundingClientRect();
		const offset = -200;
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + (container.pageYOffset ?? 0) + offset;

		container.scrollTo({
			top: offsetPosition,
			behavior: 'smooth',
		});
	};

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

	useEffect(() => {
		if (
			(walkthroughStore.shouldAutoStart && myTripsStore.totalTrips === 0 && guideMode === GuideMode.MAIN_PAGE) ||
			eventStore.tripName.includes(
				TranslateService.translate(eventStore, 'WALKTHROUGH.EXAMPLE', undefined, 'en')
			) ||
			eventStore.tripName.includes(TranslateService.translate(eventStore, 'WALKTHROUGH.EXAMPLE', undefined, 'he'))
		) {
			const timer = setTimeout(() => {
				setRun(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [walkthroughStore.shouldAutoStart, myTripsStore.totalTrips, guideMode, eventStore.tripName]);

	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status, type, index, action } = data;

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
			setRun(false);
			walkthroughStore.completeWalkthrough();
		}

		if (type === 'step:before') {
			const currentStep = steps[index];
			const nextStep = steps[index + 1];
			if (currentStep && currentStep.beforeAction) {
				currentStep.beforeAction().then(() => {
					// Auto-advance if this step has autoAdvance enabled
					if (currentStep && (currentStep as any).autoAdvance === true) {
						const delay = (nextStep as CustomStep)?.delay ?? 0;
						if (delay > 0) {
							setStepIndex(index + 1);
							setRun(false);
							setTimeout(() => {
								setRun(true);
							}, 300 + delay);
						} else {
							setTimeout(() => {
								setStepIndex(index + 1);
							}, 300);
						}
					}
				});
			}
		}

		if (type === 'step:after') {
			const currentStep = steps[index];
			const nextStep = steps[index + 1];
			if (currentStep && currentStep.afterAction) {
				currentStep.afterAction();
			}

			if (action === 'prev') {
				setStepIndex(index - 1);
			} else if (action === 'next') {
				const delay = (nextStep as CustomStep)?.delay ?? 0;
				if (delay > 0) {
					setStepIndex(index + 1);
					setRun(false);
					setTimeout(() => {
						setRun(true);
					}, delay);
				} else {
					setStepIndex(index + 1);
				}
			}
		}

		if (type === 'tooltip') {
			const currentStep = steps[index] as CustomStep;

			if (currentStep && currentStep.customZIndex !== undefined) {
				setTimeout(() => {
					const zIndex = currentStep.customZIndex!;
					const tooltip = document.querySelector('.react-joyride__tooltip') as HTMLElement;
					const tooltipContainer = document.querySelector('.react-joyride__tooltipContainer') as HTMLElement;
					const overlay = document.querySelector('.react-joyride__overlay') as HTMLElement;
					const spotlight = document.querySelector('.react-joyride__spotlight') as HTMLElement;

					if (tooltip) tooltip.style.zIndex = `${zIndex}`;
					if (tooltipContainer) tooltipContainer.style.zIndex = `${zIndex}`;
					if (overlay) overlay.style.zIndex = `${zIndex - 1}`;
					if (spotlight) spotlight.style.zIndex = `${zIndex - 2}`;
				}, 150);
			}

			if (currentStep && currentStep.autoAdvance === true) {
				setTimeout(() => {
					const nextButton = document.querySelector(
						'.react-joyride__tooltip button[data-action="primary"]'
					) as HTMLButtonElement;
					if (nextButton) {
						nextButton.disabled = true;
						nextButton.style.opacity = '0.5';
						nextButton.style.cursor = 'not-allowed';
					}
				}, 150);
			}

			setTimeout(() => {
				const tooltip = document.querySelector('.react-joyride__tooltip') as HTMLElement;
				const spotlight = document.querySelector('.react-joyride__spotlight') as HTMLElement;

				const fixSpotlightPosition = () => {
					if (currentStep && currentStep.target && currentStep.target !== 'body') {
						const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
						const spotlightElement = document.querySelector('.react-joyride__spotlight') as HTMLElement;

						if (targetElement && spotlightElement) {
							const targetRect = targetElement.getBoundingClientRect();
							const padding = 10;

							spotlightElement.style.position = 'fixed';
							spotlightElement.style.top = `${targetRect.top - padding}px`;
							spotlightElement.style.left = `${targetRect.left - padding}px`;
							spotlightElement.style.width = `${targetRect.width + padding * 2}px`;
							spotlightElement.style.height = `${targetRect.height + padding * 2}px`;
							spotlightElement.style.transform = 'none';
						}
					}
				};

				if (currentStep && currentStep.target && currentStep.target !== 'body') {
					if (currentStep.fixSpotlightPosition) {
						fixSpotlightPosition();
						setTimeout(fixSpotlightPosition, 200);
						setTimeout(fixSpotlightPosition, 400);
						setTimeout(fixSpotlightPosition, 600);

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

							const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
							if (targetElement) {
								spotlightObserver.observe(targetElement, {
									attributes: true,
									attributeFilter: ['style', 'class'],
									childList: false,
									subtree: false,
								});
							}

							setTimeout(() => {
								spotlightObserver.disconnect();
							}, 5000);
						}
					}
				}

				if (currentStep && (currentStep as any).customPositionOffset !== undefined && tooltip) {
					const offset = (currentStep as any).customPositionOffset;
					const isPercent = (currentStep as any).customPositionOffsetPercent === true;
					const offsetValue = isPercent ? `${(window.innerWidth * offset) / 100}px` : `${offset}px`;

					tooltip.style.transition = 'transform 0.4s ease-out';

					const currentTransform = tooltip.style.transform || '';
					const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);

					const transforms = [
						`translateX(${offsetValue})`,
						...(translateYMatch ? [`translateY(${translateYMatch[1]})`] : []),
					];

					requestAnimationFrame(() => {
						tooltip.style.transform = transforms.join(' ');
					});
				}

				if (currentStep && currentStep.target && currentStep.target !== 'body') {
					const targetElement = document.querySelector(currentStep.target as string) as HTMLElement;
					if (targetElement) {
						if (currentStep.scrollToCenter) {
							const container = currentStep.container
								? (document.querySelector(currentStep.container) as HTMLElement)
								: undefined;
							scrollToElementCenter(targetElement, (container as any) || window);
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

	const startWalkthrough = () => {
		setRun(true);
		setStepIndex(0);
	};

	useEffect(() => {
		// @ts-ignore
		window.startWalkthrough = startWalkthrough;
	}, []);

	useEffect(() => {
		if (!run) return;

		const updateButtonText = () => {
			const nextButton = document.querySelector(
				'.react-joyride__tooltip button[data-action="primary"]'
			) as HTMLElement;
			if (nextButton) {
				const currentText = nextButton.textContent || '';
				const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');

				if (eventStore.calendarLocalCode === 'he') {
					if (eventStore.isMobile) {
						nextButton.textContent = nextText;
					} else {
						if (currentText.includes('(Step') || currentText.includes('(שלב')) {
							const match = currentText.match(/\((.+)\)/);
							if (match) {
								const stepPart = match[1]
									.replace(/Step/g, 'שלב')
									.replace(/step/g, 'שלב')
									.replace(/of/g, 'מתוך');
								nextButton.textContent = `${nextText} (${stepPart})`;
							}
						} else {
							nextButton.textContent = nextText;
						}
					}
				} else if (eventStore.isMobile) {
					if (currentText.includes('(Step') || currentText.includes('(')) {
						nextButton.textContent = nextText;
					}
				}
			}
		};

		updateButtonText();
		const timers = [
			setTimeout(updateButtonText, 50),
			setTimeout(updateButtonText, 150),
			setTimeout(updateButtonText, 300),
		];

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

	const nextText = TranslateService.translate(eventStore, 'WALKTHROUGH.NEXT');
	const backText = TranslateService.translate(eventStore, 'WALKTHROUGH.BACK');
	const skipText = TranslateService.translate(eventStore, 'WALKTHROUGH.SKIP');
	const finishText = TranslateService.translate(eventStore, 'WALKTHROUGH.FINISH');

	const joyrideLocale = {
		back: backText,
		close: skipText,
		last: finishText,
		next: nextText,
		skip: skipText,
	};

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
