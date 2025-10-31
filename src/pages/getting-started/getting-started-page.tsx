import React, { useContext, useEffect, useState } from 'react';
import './getting-started-page.css';
import { useNavigate } from 'react-router-dom';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import { defaultCalendarEvents, defaultDateRange, defaultEvents, getDefaultCategories } from '../../utils/defaults';
import { renderFooterLine } from '../../utils/ui-utils';
import { getClasses } from '../../utils/utils';
import Button, { ButtonFlavor } from '../../components/common/button/button';
import ReactModalService from '../../services/react-modal-service';
import DataServices from '../../services/data-handlers/data-handler-base';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import { TripDataSource } from '../../utils/enums';
import { upsertTripProps } from '../../services/data-handlers/db-service';
import { validateDateRange } from '../../utils/time-utils';
import { DEFAULT_VIEW_MODE_FOR_NEW_TRIPS, TRIP_MAX_SIZE_DAYS } from '../../utils/consts';
import LogHistoryService from '../../services/data-handlers/log-history-service';
import { TripActions } from '../../utils/interfaces';
import DestinationSelector from '../../v2/components/destination-selector/destination-selector';

const GettingStartedPage = () => {
	const [applyPageIntro, setApplyPageIntro] = useState(false);
	const [applyFadeIn, setApplyFadeIn] = useState(false);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const [errors, setErrors] = useState<Record<string, boolean>>({});

	useHandleWindowResize();

	const [customDateRange, setCustomDateRange] = useState(defaultDateRange());
	const [selectedDestinations, setSelectedDestinations] = useState([]);
	const [tripName, setTripName] = useState<string>('');

	useEffect(() => {
		if (eventStore.isMobile) {
			setApplyPageIntro(true);
			setApplyFadeIn(true);
		} else {
			setTimeout(() => {
				setApplyPageIntro(true);

				setTimeout(() => {
					setApplyFadeIn(true);
				}, 200);
			}, 500);
		}
	}, []);

	useEffect(() => {
		document.querySelector('body').classList.remove('rtl');
		document.querySelector('body').classList.remove('ltr');
		document.querySelector('body').classList.add(eventStore.getCurrentDirection());
		eventStore.dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	function updateErrorsOnDateChange(start: string, end: string) {
		// means user already clicked on submit at least once.
		if (Object.keys(errors).length) {
			const isValid = validateDateRange(eventStore, start, end, undefined, undefined, undefined, false);

			setErrors({
				...errors,
				start: !isValid,
				end: !isValid,
			});
		}
	}

	const renderForm = () => {
		return (
			<div
				className="custom-dates-container align-items-center"
				style={{
					backgroundColor: 'transparent',
					border: 0,
				}}
			>
				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
				</div>
				<div className="trip-name-line">
					<input
						type="text"
						style={{
							paddingInline: '15px',
							height: '40px',
							maxWidth: '300px',
						}}
						placeholder={TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
						value={tripName}
						onChange={(e) => {
							const value = e.target.value;
							setTripName(value);

							if (errors['title']) {
								setErrors({
									...errors,
									title: value.length == 0,
								});
							}
						}}
						className={getClasses(errors['title'] && 'red-border')}
					/>
				</div>

				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_ARE_YOU_GOING_TO')}
				</div>
				<div className="custom-dates-line flex-row align-items-center">
					<DestinationSelector onChange={setSelectedDestinations} />
				</div>

				<div className="main-font font-size-20">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHEN_IS_YOUR_TRIP')}
				</div>
				<div className="custom-dates-line flex-row align-items-center">
					<input
						type="date"
						onKeyDown={(e) => {
							e.preventDefault();
							return false;
						}}
						value={customDateRange.start}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: value,
								end: customDateRange.end,
							});
							updateErrorsOnDateChange(value, customDateRange.end);
						}}
						className={getClasses(errors['start'] && 'red-border')}
					/>
					{TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.UNTIL')}
					<input
						type="date"
						onKeyDown={(e) => {
							e.preventDefault();
							return false;
						}}
						value={customDateRange.end}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: customDateRange.start,
								end: value,
							});
							updateErrorsOnDateChange(customDateRange.start, value);
						}}
						className={getClasses(errors['end'] && 'red-border')}
					/>
				</div>
			</div>
		);
	};

	async function createNewTrip(tripName: string) {
		const areDatesValid = validateDateRange(eventStore, customDateRange.start, customDateRange.end);
		errors.start = !areDatesValid;
		errors.end = !areDatesValid;

		if (tripName.length == 0) {
			ReactModalService.internal.alertMessage(eventStore, 'MODALS.ERROR.TITLE', 'TRIP_NAME_EMPTY', 'error');
			setErrors({
				...errors,
				title: true,
			});
			return;
		}

		if (!areDatesValid) {
			setErrors({
				...errors,
				start: true,
				end: true,
			});
			return;
		}

		if (new Date(customDateRange.end).getTime() < new Date(customDateRange.start).getTime()) {
			setErrors({
				start: true,
				end: true,
			});
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.START_DATE_SMALLER',
				'error'
			);
			return;
		}

		setErrors({});

		const TripName = tripName.replace(/\s/gi, '-');

		// local mode
		if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
			eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
			eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
			eventStore.setCustomDateRange(customDateRange);
			eventStore.dataService.setDateRange(customDateRange, TripName);
			navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
		} else {
			const tripData: upsertTripProps = {
				name: TripName,
				dateRange: customDateRange,
				calendarLocale: eventStore.calendarLocalCode,
				allEvents: [],
				sidebarEvents: defaultEvents,
				calendarEvents: defaultCalendarEvents,
				categories: getDefaultCategories(eventStore),
				destinations: selectedDestinations,
			};

			// backup
			let { viewMode, mobileViewMode } = eventStore;

			// @ts-ignore
			await DataServices.DBService.createTrip(
				tripData,
				(res: any) => {
					// switch to map view as  the default view.
					eventStore.setViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);
					eventStore.setMobileViewMode(DEFAULT_VIEW_MODE_FOR_NEW_TRIPS);

					eventStore.setCustomDateRange(customDateRange);
					eventStore.dataService.setDateRange(customDateRange, TripName);

					// keep to history:
					LogHistoryService.logHistory(eventStore, TripActions.createdTrip, {
						tripName: TripName,
					});

					navigate(`/plan/${res.data.name}`);
					// navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
				},
				(e) => {
					// restore to backup
					eventStore.setViewMode(viewMode);
					eventStore.setMobileViewMode(mobileViewMode);

					if (e.response.data.statusCode === 409) {
						setErrors({
							title: true,
						});
						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.ERROR.TITLE',
							'TRIP_ALREADY_EXISTS',
							'error'
						);
					} else {
						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.ERROR.TITLE',
							'OOPS_SOMETHING_WENT_WRONG',
							'error'
						);
					}
				},
				() => {}
			);
		}
	}

	function renderMainPart() {
		return (
			<div className="main-part">
				<div
					className={getClasses(
						['plan-your-trip-header main-font'],
						!eventStore.isMobile && 'visible',
						!eventStore.isMobile && applyPageIntro && 'hidden',
						eventStore.isMobile && 'opacity-0'
					)}
				>
					{TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
					<br />
					<div className="trip main-font-heavy">
						{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}
					</div>
				</div>
				<img
					className={getClasses(['logo-container pointer'], applyPageIntro && 'up')}
					src="/images/logo/new-logo.png"
					style={{ width: '50%', minWidth: '150px', maxWidth: '200px' }}
					onClick={() => {
						navigate('/home');
					}}
				/>
				<div
					className={getClasses(
						['create-new-trip-form display-none'],
						applyPageIntro && 'shown',
						applyFadeIn && 'fadeIn'
					)}
				>
					{renderForm()}
				</div>
				<div className={getClasses(['slogan main-font'], applyPageIntro && 'up2')}>
					<span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE1')}</span>
					<span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE2')}</span>
				</div>

				<div
					className={getClasses(['start-now-button'], applyPageIntro && 'up2')}
					style={{
						display: 'flex',
						alignContent: 'center',
						justifyContent: 'center',
						gap: '10px',
					}}
				>
					<Button
						text={TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.CREATE_NEW_TRIP')}
						flavor={ButtonFlavor.primary}
						// disabled={
						// 	tripName.length === 0 ||
						// 	new Date(customDateRange.start).getTime() > new Date(customDateRange.end).getTime()
						// }
						// disabledReason={TranslateService.translate(
						// 	eventStore,
						// 	tripName.length === 0
						// 		? 'GETTING_STARTED_PAGE.CREATE_NEW_TRIP.PLEASE_SET_TRIPNAME_FIRST'
						// 		: 'MODALS.ERROR.START_DATE_SMALLER'
						// )}
						onClick={() => createNewTrip(tripName)}
						data-walkthrough="create-trip-btn"
					/>
					<Button
						text={TranslateService.translate(eventStore, 'CHECK_OUT_EXISTING_TRIPS')}
						flavor={ButtonFlavor.secondary}
						onClick={() => {
							navigate('/my-trips');
						}}
						className="black"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="landing-page-layout getting-started-page">
			<TriplanHeaderWrapper />
			{renderMainPart()}
			{renderFooterLine(eventStore, getClasses('visible', applyPageIntro && 'hidden'))}
		</div>
	);
};

export default observer(GettingStartedPage);
