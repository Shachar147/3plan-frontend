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
import DataServices, { Trip } from '../../services/data-handlers/data-handler-base';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import { TripDataSource } from '../../utils/enums';

const GettingStartedPage = () => {
	const [applyPageIntro, setApplyPageIntro] = useState(false);
	const [applyFadeIn, setApplyFadeIn] = useState(false);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

	useHandleWindowResize();

	const [customDateRange, setCustomDateRange] = useState(defaultDateRange());
	const [tripName, setTripName] = useState<string>('');

	useEffect(() => {
		setTimeout(() => {
			setApplyPageIntro(true);

			setTimeout(() => {
				setApplyFadeIn(true);
			}, 200);
		}, 500);
	}, []);

	useEffect(() => {
		document.querySelector('body').classList.remove('rtl');
		document.querySelector('body').classList.remove('ltr');
		document.querySelector('body').classList.add(eventStore.getCurrentDirection());
		eventStore.dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	const renderForm = () => {
		return (
			<div
				className={getClasses(['custom-dates-container'], eventStore.isListView && 'hidden')}
				style={{
					backgroundColor: 'transparent',
					border: 0,
				}}
			>
				<div className="main-font">
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHERE_IS_YOUR_TRIP')}
				</div>
				<div className={'trip-name-line'}>
					<input
						type={'text'}
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
						}}
					/>
				</div>
				<div className={'main-font font-size-20'}>
					{TranslateService.translate(eventStore, 'GETTING_STARTED_PAGE.WHEN_IS_YOUR_TRIP')}
				</div>
				<div className={'custom-dates-line'}>
					<input
						type={'date'}
						value={customDateRange.start}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: value,
								end: customDateRange.end,
							});
						}}
					/>
					<input
						type={'date'}
						value={customDateRange.end}
						onChange={(e) => {
							const value = e.target.value;
							setCustomDateRange({
								start: customDateRange.start,
								end: value,
							});
						}}
					/>
				</div>
			</div>
		);
	};

	async function createNewTrip(tripName: string) {
		const TripName = tripName.replace(/\s/gi, '-');

		// local mode
		if (eventStore.dataService.getDataSourceName() === TripDataSource.LOCAL) {
			eventStore.setCustomDateRange(customDateRange);
			eventStore.dataService.setDateRange(customDateRange, TripName);
			navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
		} else {
			const tripData = {
				name: TripName,
				dateRange: customDateRange,
				calendarLocale: eventStore.calendarLocalCode,
				allEvents: [],
				sidebarEvents: defaultEvents,
				calendarEvents: defaultCalendarEvents,
				categories: getDefaultCategories(eventStore),
			};
			// @ts-ignore
			await DataServices.DBService.createTrip(
				tripData,
				(res: any) => {
					eventStore.setCustomDateRange(customDateRange);
					eventStore.dataService.setDateRange(customDateRange, TripName);
					navigate(`/plan/${res.data.name}`);
					// navigate('/plan/create/' + TripName + '/' + eventStore.calendarLocalCode);
				},
				() => {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'OOPS_SOMETHING_WENT_WRONG',
						'error'
					);
				},
				() => {}
			);
		}
	}

	function renderMainPart() {
		return (
			<div className="main-part">
				<div className={getClasses(['plan-your-trip-header main-font visible'], applyPageIntro && 'hidden')}>
					{TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
					<br />
					<div className={'trip main-font-heavy'}>
						{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}
					</div>
				</div>
				<img
					className={getClasses(['logo-container pointer'], applyPageIntro && 'up')}
					src={'/images/logo/new-logo.png'}
					style={{ width: '50%', minWidth: '400px' }}
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
						disabled={tripName.length === 0}
						disabledReason={TranslateService.translate(
							eventStore,
							'GETTING_STARTED_PAGE.CREATE_NEW_TRIP.PLEASE_SET_TRIPNAME_FIRST'
						)}
						onClick={() => createNewTrip(tripName)}
					/>
					<Button
						text={TranslateService.translate(eventStore, 'CHECK_OUT_EXISTING_TRIPS')}
						flavor={ButtonFlavor.secondary}
						onClick={() => {
							navigate('/my-trips');
						}}
						className={'black'}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="landing-page-layout">
			<TriplanHeaderWrapper />
			{renderMainPart()}
			{renderFooterLine(eventStore, getClasses('visible', applyPageIntro && 'hidden'))}
		</div>
	);
};

export default observer(GettingStartedPage);
