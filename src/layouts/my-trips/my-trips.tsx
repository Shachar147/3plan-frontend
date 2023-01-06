// @ts-ignore
import React, {useContext, useEffect, useMemo, useState} from 'react';
import './my-trips.scss';
import {useNavigate} from 'react-router-dom';
import TranslateService from '../../services/translate-service';
import {eventStoreContext} from '../../stores/events-store';
import {observer} from 'mobx-react';
import {renderFooterLine, renderHeaderLine} from '../../utils/ui-utils';
import {getClasses} from '../../utils/utils';
import ReactModalService from '../../services/react-modal-service';
import DataServices, {Trip, tripNameToLSTripName} from '../../services/data-handlers/data-handler-base';
import ToggleButton from '../../components/toggle-button/toggle-button';
import {TripDataSource} from '../../utils/enums';
import {getUser} from '../../helpers/auth';
import Button, {ButtonFlavor} from '../../components/common/button/button';
import {formatShortDateStringIsrael, getAmountOfDays} from "../../utils/time-utils";
import {runInAction} from "mobx";

const noTripsPlaceholderIcon = "./images/search-placeholder.png";

function MyTrips() {
	const [dataSource, setDataSource] = useState<TripDataSource>(getUser() ? TripDataSource.DB : TripDataSource.LOCAL);
	const [applyPageIntro, setApplyPageIntro] = useState(false);
	const [applyFadeIn, setApplyFadeIn] = useState(false);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const [lsTrips, setLsTrips] = useState<Trip[]>([]);

	const dataService = useMemo(() => DataServices.getService(dataSource), [dataSource]);

	useEffect(() => {
		setLsTrips([]);
		dataService.getTrips(eventStore).then((trips: Trip[]) => {
			setLsTrips(trips);
		});
	}, [dataService, dataSource]);

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
		dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	function getNoTripPlaceholderText() {
		const key = dataSource === TripDataSource.LOCAL ? 'NO_TRIPS_PLACEHOLDER.LOCAL' : 'NO_TRIPS_PLACEHOLDER.DB';
		return TranslateService.translate(eventStore, key);
	}

	function renderNoTripsPlaceholder() {
		return (
			<div
				className={getClasses(
					['my-trips bright-scrollbar min-height-300 flex-column gap-20 no-trips-placeholder'],
					eventStore.isListView && 'hidden'
				)}
			>
				<img src={noTripsPlaceholderIcon} className="opacity-0-1" />
				{getNoTripPlaceholderText()}
				<Button
					text={TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}
					flavor={ButtonFlavor.primary}
					className="padding-inline-15"
					onClick={() => navigate('/getting-started') }
				/>
			</div>
		);
	}

	function onEditTrip(e: any, LSTripName: any){
		e.preventDefault();
		e.stopPropagation();

		if (Object.keys(eventStore.modalValues).length === 0) {
			eventStore.modalValues.name =
				LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		}
		ReactModalService.openEditTripModal(eventStore, LSTripName);
	}

	function onDeleteTrip(e: any, LSTripName: any){
		e.preventDefault();
		e.stopPropagation();
		ReactModalService.openDeleteTripModal(eventStore, LSTripName, dataSource);
	}

	function renderTrip(trip: Trip) {
		const tripName = trip.name;
		const LSTripName = tripNameToLSTripName(tripName);
		const dates = trip.dateRange;
		const start = formatShortDateStringIsrael(dates.start!);
		const end = formatShortDateStringIsrael(dates.end!);
		const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

		if (tripName === '') return <></>;

		const classList = getClasses(['sidebar-statistics main-font trips-list-trip'], dataSource.toLowerCase(), getUser() && 'logged-in');

		function renderTripInfo(){
			return (
				<>
					<i className="fa fa-plane" aria-hidden="true"></i>
					<span style={{ maxWidth: '200px' }}>{tripName}</span>
					<div>{end} - {start}</div>
					<div>({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})</div>
				</>
			)
		}

		function renderTripActions(){
			return (
				<div className="trips-list-trip-actions">
					<i
						className="fa fa-pencil-square-o"
						aria-hidden="true"
						onClick={(e) => onEditTrip(e, LSTripName)}
					></i>
					<i
						className="fa fa-trash-o position-relative top--1"
						aria-hidden="true"
						onClick={(e) => onDeleteTrip(e, LSTripName)}
					></i>
				</div>
			);
		}

		return (
			<div
				className={classList}
				onClick={() => {
					const dataService =
						dataSource === TripDataSource.DB ? DataServices.DBService : DataServices.LocalStorageService;
					runInAction(() => {
						eventStore.dataService = dataService;
					})
					eventStore.setTripName(tripName);
					navigate('/plan/' + LSTripName, {});
				}}
			>
				{renderTripInfo()}
				{renderTripActions()}
			</div>
		);
	}

	function renderListOfTrips() {
		return <div className="my-trips bright-scrollbar">{lsTrips.map(renderTrip)}</div>;
	}

	function renderForm() {
		return lsTrips.length === 0 ? renderNoTripsPlaceholder() : renderListOfTrips();
	}

	function renderDataSourceSelector() {
		const options = [
			{
				key: TripDataSource.LOCAL,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.TRIP_DATA_SOURCE.LOCAL'),
			},
			{
				key: TripDataSource.DB,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.TRIP_DATA_SOURCE.DB'),
			},
		];
		const onChange = (newVal) => setDataSource(newVal as TripDataSource);

		return (
			<div className="my-trips-header" key={`my-trips-header-${eventStore.calendarLocalCode}`}>
				<ToggleButton value={dataSource} onChange={onChange} options={options} customStyle="tabs_underline" />
			</div>
		);
	}

	function renderLogo() {
		return (
			<img
				className={getClasses(['logo-container pointer'], applyPageIntro && 'up')}
				src="/images/logo/new-logo.png"
				style={{ width: '50%', minWidth: '400px' }}
				onClick={() => {
					navigate('/home');
				}}
			/>
		);
	}

	return (
		<div className="landing-page-layout">
			{renderHeaderLine(eventStore)}
			<div className="main-part">
				<div className={getClasses(['plan-your-trip-header main-font visible'], applyPageIntro && 'hidden')}>
					{TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
					<br />
					<div className="trip main-font-heavy">
						{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}
					</div>
				</div>
				{renderLogo()}
				<div
					className={getClasses(
						['create-new-trip-form flex-column display-none'],
						applyPageIntro && 'shown',
						applyFadeIn && 'fadeIn'
					)}
				>
					{getUser() && renderDataSourceSelector()}
					{renderForm()}
				</div>
			</div>
			{renderFooterLine(eventStore, applyPageIntro && 'hidden')}
		</div>
	);
}

export default observer(MyTrips);
