import TranslateService from '../services/translate-service';
import React from 'react';
import { EventStore } from '../stores/events-store';
import { Link, NavigateFunction, useNavigate } from 'react-router-dom';
import Button, { ButtonFlavor } from '../components/common/button/button';
import ToggleButton, { OptionToggleButton } from '../components/toggle-button/toggle-button';
import { ViewMode } from './enums';
import { getClasses, isEventAlreadyOrdered } from './utils';
import TriplanTag from '../components/common/triplan-tag/triplan-tag';
import { getUser } from '../helpers/auth';
import Select from 'react-select';
import { Observer } from 'mobx-react';
import { EventApi, EventInput } from '@fullcalendar/react';
import { getTimeStringFromDate, toDate } from './time-utils';
import { buildCalendarEvent, CalendarEvent } from './interfaces';

export const renderLanguageSelector = (eventStore: EventStore) => {
	const options: any[] = [
		{ label: TranslateService.translate(eventStore, 'ENGLISH').toString(), value: 'en' },
		{ label: TranslateService.translate(eventStore, 'HEBREW').toString(), value: 'he' },
	];

	return (
		<Observer>
			{() => (
				<Select
					key={`locale-selector-${eventStore.calendarLocalCode}`}
					isClearable={false}
					isSearchable={false}
					id={'locale-selector'}
					name={'locale-selector'}
					options={options}
					value={options.find((x) => x.value == eventStore.calendarLocalCode)}
					onChange={(e: any) => {
						eventStore.setCalendarLocalCode(e.value);
					}}
					maxMenuHeight={45 * 5}
					styles={SELECT_STYLE}
				/>
			)}
		</Observer>
		// <select id="locale-selector" className={"main-font"} onChange={(e) => {
		//     // @ts-ignore
		//     eventStore.setCalendarLocalCode(e.target.value);
		// }} value={eventStore.calendarLocalCode}>
		//     <option value="en">{TranslateService.translate(eventStore, 'ENGLISH')}</option>
		//     <option value="he">{TranslateService.translate(eventStore, 'HEBREW')}</option>
		// </select>
	);
};

export interface HeaderLineOptions {
	withLogo?: boolean;
	withRecommended?: boolean;
	withSearch?: boolean;
	withViewSelector?: boolean;
	withFilterTags?: boolean;
	withLoginLogout?: boolean;
}

export const renderHeaderLine = (eventStore: EventStore, options: HeaderLineOptions = {}) => {
	const {
		withLogo = false,
		withRecommended = true,
		withSearch = false,
		withFilterTags = false,
		withViewSelector = false,
		withLoginLogout = true,
	} = options;

	const navigate = useNavigate();

	return (
		<div className="header" style={{ height: 'fit-content' }}>
			<div className="start-side">
				<div className="choose-language main-font">
					<a>
						<img
							className="choose-language-image"
							alt=""
							src={'/images/landing-page/icons/choose-lang.png'}
						/>
						{TranslateService.translate(eventStore, 'CHOOSE_LANGUAGE')}
					</a>
					{renderLanguageSelector(eventStore)}
				</div>
			</div>
			<div className="end-side">
				{withFilterTags && renderFilterTags(eventStore)}
				{withSearch && renderSearch(eventStore)}
				{withViewSelector && renderViewSelector(eventStore)}
				{(withRecommended || withLoginLogout || withLogo) &&
					renderMyTrips(eventStore, withRecommended, withLoginLogout, withLogo, navigate)}
			</div>
		</div>
	);
};

const renderMyTrips = (
	eventStore: EventStore,
	withMyTrips: boolean,
	withLoginLogout: boolean,
	withLogo: boolean,
	navigate: NavigateFunction
) => (
	<div className={'recommended-destinations main-font'}>
		{!withMyTrips ? undefined : (
			<Link
				to={'/my-trips'}
				style={{
					textDecoration: 'none',
				}}
			>
				<Button
					flavor={ButtonFlavor.link}
					image={'/images/landing-page/icons/map.png'}
					text={TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS')}
					onClick={() => {}}
				/>
			</Link>
		)}

		{!withLoginLogout ? undefined : getUser() == undefined ? renderLogin(eventStore) : renderLogout(eventStore)}

		{withLogo && (
			<div
				className="header-logo"
				onClick={() => {
					navigate('/home');
				}}
				style={{ cursor: 'pointer', display: 'flex', maxHeight: '40px', height: '40px' }}
			>
				<img alt={''} src={'/images/logo/new-logo.png'} />
			</div>
		)}
	</div>
);

const renderLogout = (eventStore: EventStore) => (
	<Link
		to={'/logout'}
		style={{
			textDecoration: 'none',
		}}
	>
		<Button
			flavor={ButtonFlavor.link}
			icon={'fa-sign-out darkest-blue-color'}
			text={`${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}`}
			onClick={() => {}}
		/>
	</Link>
);

const renderLogin = (eventStore: EventStore) => (
	<Link
		to={'/login'}
		style={{
			textDecoration: 'none',
		}}
	>
		<Button
			flavor={ButtonFlavor.link}
			icon={'fa-sign-in darkest-blue-color'}
			text={`${TranslateService.translate(eventStore, 'LOGIN')}`}
			onClick={() => {}}
		/>
	</Link>
);

const renderSearch = (eventStore: EventStore) => {
	return (
		<div className={'search-container'}>
			<input
				type={'text'}
				name={'fc-search'}
				value={eventStore.searchValue}
				onChange={(e) => {
					eventStore.setSearchValue(e.target.value);
				}}
				placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
			/>
		</div>
	);
};

const renderFilterTags = (eventStore: EventStore) => {
	const {
		showOnlyEventsWithNoLocation,
		showOnlyEventsWithNoOpeningHours,
		showOnlyEventsWithTodoComplete,
		showOnlyEventsWithDistanceProblems,
		showOnlyEventsWithOpeningHoursProblems,
	} = eventStore;

	if (
		!(
			showOnlyEventsWithNoLocation ||
			showOnlyEventsWithNoOpeningHours ||
			showOnlyEventsWithTodoComplete ||
			showOnlyEventsWithDistanceProblems ||
			showOnlyEventsWithOpeningHoursProblems
		)
	) {
		return null;
	}

	return (
		<div className={'filter-tags-container'}>
			{showOnlyEventsWithOpeningHoursProblems && (
				<TriplanTag
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_DISTANCE_PROBLEMS.FILTER_TAG')}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithOpeningHoursProblems(false);
					}}
				/>
			)}
			{showOnlyEventsWithDistanceProblems && (
				<TriplanTag
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_DISTANCE_PROBLEMS.FILTER_TAG')}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithDistanceProblems(false);
					}}
				/>
			)}
			{showOnlyEventsWithNoLocation && (
				<TriplanTag
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_NO_LOCATION.FILTER_TAG')}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithNoLocation(false);
					}}
				/>
			)}
			{showOnlyEventsWithNoOpeningHours && (
				<TriplanTag
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_NO_OPENING_HOURS.FILTER_TAG')}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithNoOpeningHours(false);
					}}
				/>
			)}
			{showOnlyEventsWithTodoComplete && (
				<TriplanTag
					text={TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_TODO_COMPLETE.FILTER_TAG')}
					onDelete={() => {
						eventStore.setShowOnlyEventsWithTodoComplete(false);
					}}
				/>
			)}
		</div>
	);
};

export const getViewSelectorOptions = (
	eventStore: EventStore,
	withMobileViews: boolean = false
): OptionToggleButton[] => {
	const baseArray = [
		{
			key: ViewMode.map,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.MAP_VIEW'),
			icon: <i className="fa fa-map-o black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-map selected-color" aria-hidden="true" />,
		},
		{
			key: ViewMode.calendar,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.CALENDAR_VIEW'),
			icon: <i className="fa fa-calendar-o black-color" aria-hidden="true" />,
			defaultIcon: <i className="fa fa-calendar black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-calendar selected-color" aria-hidden="true" />,
		},
		{
			key: ViewMode.combined,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.COMBINED_VIEW'),
			icon: <i className="fa fa-compress black-color" aria-hidden="true" />,
			// defaultIcon: <i className="fa fa-calendar black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-compress selected-color" aria-hidden="true" />,
			desktopOnly: true,
		},
		{
			key: ViewMode.list,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW'),
			icon: <i className="fa fa-list black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-th-list selected-color" aria-hidden="true" />,
		},
		{
			key: ViewMode.feed,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.FEED_VIEW'),
			icon: <i className="fa fa-search black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-search selected-color" aria-hidden="true" />,
		},
	];

	if (withMobileViews) {
		return [
			{
				key: ViewMode.sidebar,
				name: TranslateService.translate(eventStore, 'BUTTON_TEXT.SIDEBAR_VIEW'),
				icon: <i className="fa fa-star-o black-color" aria-hidden="true" />,
				iconActive: <i className="fa fa-star selected-color" aria-hidden="true" />,
			},
			...baseArray.filter((x) => !x.desktopOnly),
		];
	}

	return baseArray;
};

export const getAdminViewSelectorOptions = (
	eventStore: EventStore,
	withMobileViews: boolean = false
): OptionToggleButton[] => {
	const baseArray = [
		{
			key: ViewMode.list,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.LIST_VIEW'),
			icon: <i className="fa fa-list black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-th-list selected-color" aria-hidden="true" />,
		},
		{
			key: ViewMode.map,
			name: TranslateService.translate(eventStore, 'BUTTON_TEXT.MAP_VIEW'),
			icon: <i className="fa fa-map-o black-color" aria-hidden="true" />,
			iconActive: <i className="fa fa-map selected-color" aria-hidden="true" />,
		},
	];

	return baseArray;
};

const renderViewSelector = (eventStore: EventStore) => {
	return (
		<div className={'view-selector'} key={`view-selector-${eventStore.calendarLocalCode}`}>
			<ToggleButton
				value={eventStore.viewMode}
				onChange={(newVal) => eventStore.setViewMode(newVal as ViewMode)}
				options={getViewSelectorOptions(eventStore)}
				customStyle="white"
			/>
		</div>
	);
};

export const SELECT_STYLE = {
	control: (provided: any) => ({
		...provided,
		minHeight: '40px',
		height: '40px',
	}),
	valueContainer: (provided: any) => ({
		...provided,
		height: '40px',
		padding: '0 6px',
	}),
	input: (provided: any) => ({
		...provided,
		margin: '0px',
	}),
	indicatorSeparator: () => ({
		display: 'none',
	}),
	indicatorsContainer: (provided: any) => ({
		...provided,
		height: '40px',
	}),
	menuPortal: (base: any) => ({
		...base,
		zIndex: 9999999, // Ensure the menu is above other elements
	}),
};

export const getEventDivHtml = (eventStore: EventStore, calendarEvent: CalendarEvent) => {
	const category = Number(calendarEvent.category!.toString());
	const icon = calendarEvent.icon || eventStore.categoriesIcons[category];

	const isOrdered = isEventAlreadyOrdered(calendarEvent);
	const isTripLocked = eventStore.isTripLocked;

	// locked
	let tooltip = '';
	// // todo: uncomment if we'd like to return the functionality of locked events if already ordered.
	// // todo: uncomment also the code of locking them (look for the places that use isEventAlreadyOrdered)
	// const tooltip = isOrdered || isTripLocked ? TranslateService.translate(eventStore, 'LOCKED_EVENT_TOOLTIP') : '';
	// event.classNames = event.classNames.join(",").replace('locked','').split(",");

	let suggestedTime = '';
	let timingError = '';

	if (calendarEvent.suggestedEndTime) {
		const dt = new Date(calendarEvent.suggestedEndTime.toString());
		const leaveAtStr = `${TranslateService.translate(eventStore, 'LEAVE_AT')} ${getTimeStringFromDate(
			dt
		)} ${TranslateService.translate(eventStore, 'TO_ARRIVE_ON_TIME')}`;
		suggestedTime = `<div class="fc-event-suggested-time">${leaveAtStr}</div>`;

		tooltip = leaveAtStr;
	}

	if (calendarEvent.timingError) {
		suggestedTime = ''; // irrelevant if there's timing error
		timingError = `<div class="fc-event-suggested-time red-color">${calendarEvent.timingError}</div>`;
		tooltip = calendarEvent.timingError;
	}

	let lockIconIfNeeded = '';
	if (isOrdered || isTripLocked) {
		tooltip = TranslateService.translate(eventStore, 'LOCKED_EVENT_TOOLTIP');
		lockIconIfNeeded = '<span class="locked-icon">🔒</span>';
	}

	return `<div title="${tooltip}">${icon} ${calendarEvent.title}${lockIconIfNeeded}</div>
                ${
					calendarEvent.allDay
						? ''
						: `<div class="fc-event-time">${
								calendarEvent.start ? getTimeStringFromDate(toDate(calendarEvent.start)) : ''
						  }${calendarEvent.end ? '-' + getTimeStringFromDate(toDate(calendarEvent.end!)) : ''}</div>`
				}
                ${suggestedTime}
				${timingError}
            `;
};

export const renderFooterLine = (eventStore: EventStore, classList?: string) => (
	<div className={getClasses(['footer main-font'], classList)}>
		<a>
			<img alt="" src={'/images/landing-page/icons/checklist.png'} />{' '}
			{TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.LIST')}
		</a>
		<a>
			<img alt="" src={'/images/landing-page/icons/calendar.png'} />{' '}
			{TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.ORGANIZE')}
		</a>
		<a>
			<img alt="" src={'/images/landing-page/icons/organized-list.png'} />{' '}
			{TranslateService.translate(eventStore, 'LANDING_PAGE.FOOTER.SUMMARY')}
		</a>
	</div>
);
