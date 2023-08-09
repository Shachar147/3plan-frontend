// @ts-ignore
import React, { useContext, useEffect, useMemo, useState } from 'react';
import './my-trips.scss';
import { useNavigate } from 'react-router-dom';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import { renderFooterLine } from '../../utils/ui-utils';
import { getClasses } from '../../utils/utils';
import ReactModalService from '../../services/react-modal-service';
import DataServices, {
	DBTrip,
	SharedTrip,
	Trip,
	tripNameToLSTripName,
} from '../../services/data-handlers/data-handler-base';
import ToggleButton from '../../components/toggle-button/toggle-button';
import { TripDataSource } from '../../utils/enums';
import { getUser, isLoggedOn } from '../../helpers/auth';
import Button, { ButtonFlavor } from '../../components/common/button/button';
import { formatShortDateStringIsrael, getAmountOfDays } from '../../utils/time-utils';
import { runInAction } from 'mobx';
import { LocalStorageService } from '../../services/data-handlers/local-storage-service';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';

import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import LogHistoryService from '../../services/data-handlers/log-history-service';
import { TripActions } from '../../utils/interfaces';

const noTripsPlaceholderIcon = './images/search-placeholder.png';

function MyTrips() {
	const [dataSource, setDataSource] = useState<TripDataSource>(
		LocalStorageService.getLastDataSource() === TripDataSource.DB && getUser()
			? TripDataSource.DB
			: LocalStorageService.getLastDataSource() === TripDataSource.LOCAL
			? TripDataSource.LOCAL
			: getUser()
			? TripDataSource.DB
			: TripDataSource.LOCAL
	);
	const [applyPageIntro, setApplyPageIntro] = useState(false);
	const [applyFadeIn, setApplyFadeIn] = useState(false);
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const [lsTrips, setLsTrips] = useState<Trip[] | DBTrip[]>([]);
	const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);

	const [error, setError] = useState<any>(undefined);
	const [isLoadingTrips, setIsLoadingTrips] = useState(false);

	const [showHidden, setShowHidden] = useState(false);

	const [reloadCounter, setReloadCounter] = useState(0);

	const dataService = useMemo(() => DataServices.getService(dataSource), [dataSource]);

	useHandleWindowResize();

	useEffect(() => {
		setLsTrips([]);
		setSharedTrips([]);
		setIsLoadingTrips(true);
		setError(undefined);

		dataService
			.getTripsShort(eventStore)
			.then((result) => {
				const { trips, sharedTrips } = result;
				setLsTrips(trips);
				setSharedTrips(sharedTrips);
				setIsLoadingTrips(false);
			})
			.catch((error) => {
				setError(error);
				setIsLoadingTrips(false);
			});
	}, [dataService, dataSource, reloadCounter]);

	useEffect(() => {
		setTimeout(() => {
			setApplyPageIntro(true);

			setTimeout(() => {
				setApplyFadeIn(true);
			}, 200);
		}, 500);

		document.getElementById('root')!.classList.add('overflow-hidden');
		document.getElementById('root')!.classList.add('height-100vh');

		return () => {
			document.getElementById('root')!.classList.remove('overflow-hidden');
			document.getElementById('root')!.classList.remove('height-100vh');
		};
	}, []);

	useEffect(() => {
		document.querySelector('body').classList.remove('rtl');
		document.querySelector('body').classList.remove('ltr');
		document.querySelector('body').classList.add(eventStore.getCurrentDirection());
		dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	useEffect(() => {
		if (dataSource === TripDataSource.DB && !getUser()) {
			setDataSource(TripDataSource.LOCAL);
		}
	}, [dataSource, getUser()]);

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
				<div className="flex-row gap-8">
					<Button
						text={TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}
						flavor={ButtonFlavor.primary}
						className="padding-inline-15"
						onClick={() => navigate('/getting-started')}
					/>
					{!isLoggedOn() && (
						<Button
							text={TranslateService.translate(eventStore, 'LOGIN')}
							flavor={ButtonFlavor.secondary}
							className="padding-inline-15"
							onClick={() => navigate('/login')}
						/>
					)}
				</div>
			</div>
		);
	}

	function renderLoadingTrips() {
		return (
			<div
				className={getClasses(
					['my-trips min-height-300 flex-column gap-20 no-trips-placeholder'],
					eventStore.isListView && 'hidden'
				)}
			>
				<img src={noTripsPlaceholderIcon} className="opacity-0-3" />
				{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}
			</div>
		);
	}

	function returnErrorPlaceholder() {
		return (
			<div
				className={getClasses(
					['my-trips min-height-300 flex-column gap-20 no-trips-placeholder'],
					eventStore.isListView && 'hidden'
				)}
			>
				<img src="images/oops.png" className="oops-placeholder" />
				<span
					style={{
						color: '#d2105b',
					}}
				>
					{TranslateService.translate(eventStore, 'OOPS_SOMETHING_WENT_WRONG')}
				</span>
			</div>
		);
	}

	function onEditTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();

		if (Object.keys(eventStore.modalValues).length === 0) {
			eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		}
		ReactModalService.openEditTripModal(eventStore, LSTripName);
	}

	function onDuplicateTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();

		if (Object.keys(eventStore.modalValues).length === 0) {
			eventStore.modalValues.name = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		}
		ReactModalService.openDuplicateTripModal(eventStore, LSTripName);
	}

	function onDeleteTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();
		ReactModalService.openDeleteTripModal(eventStore, LSTripName, dataSource);
	}

	function onHideUnhideTrip(e: any, LSTripName: any) {
		e.preventDefault();
		e.stopPropagation();
		if (showHidden) {
			const tripName = LSTripName.replaceAll('-', ' ');

			DataServices.DBService.unHideTripByName(tripName)
				.then(() => {
					LogHistoryService.logHistory(eventStore, TripActions.unhideTrip, {
						tripName,
					});

					setReloadCounter(reloadCounter + 1);
				})
				.catch(() => {
					ReactModalService.internal.openOopsErrorModal(eventStore);
				});
		} else {
			ReactModalService.openHideTripModal(eventStore, LSTripName, dataSource, () =>
				setReloadCounter(reloadCounter + 1)
			);
		}
		// ReactModalService.openDeleteTripModal(eventStore, LSTripName, dataSource);
	}

	function renderTrip(trip: Trip | DBTrip) {
		const tripName = trip.name;
		// let tripName = trip.name;
		// if (trip.id) {
		// 	tripName = `#${trip.id} - ${tripName}`;
		// }
		const LSTripName = tripNameToLSTripName(tripName);
		const dates = trip.dateRange;
		const start = formatShortDateStringIsrael(dates.start!);
		const end = formatShortDateStringIsrael(dates.end!);
		const amountOfDays = getAmountOfDays(dates.start!, dates.end!);

		const sharedTripData = sharedTrips.find((s) => s.name == trip.name);
		const isSharedTrip = !!sharedTripData;
		const canRead = isSharedTrip ? sharedTripData.canRead : true;
		const canWrite = isSharedTrip ? sharedTripData.canWrite : true;

		if (tripName === '') return <></>;

		const classList = getClasses(
			['sidebar-statistics main-font trips-list-trip'],
			dataSource.toLowerCase(),
			getUser() && 'logged-in'
		);

		function renderTripInfo() {
			return (
				<>
					<i
						className={getClasses('fa', isSharedTrip ? 'fa-users' : 'fa-plane')}
						title={isSharedTrip ? TranslateService.translate(eventStore, 'SHARED_TRIP') : undefined}
						aria-hidden="true"
					/>
					<span className="my-trips-trip-name">
						<EllipsisWithTooltip placement="bottom">{tripName}</EllipsisWithTooltip>
					</span>
					<div id="when">
						{end} - {start}
					</div>
					<div id="amount-of-days">
						({amountOfDays} {TranslateService.translate(eventStore, 'DAYS')})
					</div>
				</>
			);
		}

		function renderTripActions() {
			return (
				<div className="trips-list-trip-actions">
					{!isSharedTrip && (
						<i
							className="fa fa-pencil-square-o"
							aria-hidden="true"
							title={TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}
							onClick={(e) => onEditTrip(e, LSTripName)}
						/>
					)}
					{!isSharedTrip && (
						<i
							className="fa fa-files-o"
							aria-hidden="true"
							title={TranslateService.translate(eventStore, 'DUPLICATE_TRIP_MODAL.TITLE')}
							onClick={(e) => onDuplicateTrip(e, LSTripName)}
						/>
					)}
					{!isSharedTrip && (
						<i
							className="fa fa-trash-o position-relative top--1"
							aria-hidden="true"
							title={TranslateService.translate(eventStore, 'DELETE_TRIP')}
							onClick={(e) => onDeleteTrip(e, LSTripName)}
						/>
					)}
					{!isSharedTrip && (
						<i
							className={getClasses('fa', showHidden ? 'fa-eye' : 'fa-eye-slash')}
							aria-hidden="true"
							title={TranslateService.translate(eventStore, showHidden ? 'UNHIDE_TRIP' : 'HIDE_TRIP')}
							onClick={(e) => onHideUnhideTrip(e, LSTripName)}
						/>
					)}
				</div>
			);
		}

		return (
			<div
				key={trip.name}
				className={classList}
				onClick={() => {
					runInAction(() => {
						// manually set loading before redirect to the page to prevent a bug of
						// glimpse view of the previous trip before updating to this one.
						eventStore.isLoading = true;
						eventStore.setTripName(tripName);
					});
					navigate('/plan/' + tripName, {});
				}}
			>
				{renderTripInfo()}
				{renderTripActions()}
			</div>
		);
	}

	function renderListOfTrips() {
		const hiddenTripsEnabled = dataSource === 'DB';

		const filteredList = [...lsTrips, ...sharedTrips].filter((x) =>
			hiddenTripsEnabled ? !!x.isHidden == showHidden : true
		);

		return (
			<div className="flex-column gap-10">
				<div className="my-trips bright-scrollbar">
					{filteredList
						.sort((a, b) => {
							const b_timestamp = b.lastUpdateAt ? new Date(b.lastUpdateAt).getTime() : 0;
							const a_timestamp = a.lastUpdateAt ? new Date(a.lastUpdateAt).getTime() : 0;
							return b_timestamp - a_timestamp;
						})
						.map(renderTrip)}
					{hiddenTripsEnabled && filteredList.length == 0 && showHidden && (
						<div className="width-100-percents text-align-center padding-block-5 background-white">
							{TranslateService.translate(eventStore, 'NO_HIDDEN_TRIPS')}
						</div>
					)}
					{hiddenTripsEnabled && (
						<Button
							onClick={() => {
								setShowHidden(!showHidden);
							}}
							flavor={ButtonFlavor.link}
							className="width-100-percents text-align-center"
							text={TranslateService.translate(
								eventStore,
								showHidden ? 'SHOW_TRIPS_LIST' : 'SHOW_HIDDEN_TRIPS_LIST'
							)}
						/>
					)}
				</div>
				<Button
					text={TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}
					flavor={ButtonFlavor.primary}
					className="padding-inline-15"
					onClick={() => navigate('/getting-started')}
				/>
			</div>
		);
	}

	function renderForm() {
		if (error) return returnErrorPlaceholder();
		if (isLoadingTrips) return renderLoadingTrips();
		return lsTrips.length + sharedTrips.length === 0 ? renderNoTripsPlaceholder() : renderListOfTrips();
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
		const onChange = (newVal: TripDataSource) => {
			const dataService =
				newVal === TripDataSource.DB ? DataServices.DBService : DataServices.LocalStorageService;

			runInAction(() => {
				eventStore.dataService = dataService;
			});

			LocalStorageService.setLastDataSource(newVal);

			setDataSource(newVal as TripDataSource);
		};

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
				style={{ width: '50%', minWidth: '150px', maxWidth: '200px' }}
				onClick={() => {
					navigate('/home');
				}}
				alt=""
			/>
		);
	}

	return (
		<div className="landing-page-layout my-trips-page">
			<TriplanHeaderWrapper />
			<div className={getClasses('main-part', eventStore.isMobile && 'mobile')}>
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
			{renderFooterLine(eventStore, applyPageIntro ? 'hidden' : '')}
		</div>
	);
}

export default observer(MyTrips);
