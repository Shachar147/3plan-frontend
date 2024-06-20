import { getClasses } from '../../../utils/utils';
import React, {useContext, useState} from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import { DateRangeFormatted } from '../../../services/data-handlers/data-handler-base';
import {
	getOffsetInHours,
	getUserDateFormat,
	getUserDateFormatLowercase,
	validateDateRange
} from '../../../utils/time-utils';
import LogHistoryService from '../../../services/data-handlers/log-history-service';
import { TripActions } from '../../../utils/interfaces';
import _ from 'lodash';
// @ts-ignore
import RangePicker from "react-range-picker";
import {formatDateString} from "../../../utils/defaults";
import './custom-dates-selector.scss';
import moment from "moment";


export interface CustomDatesSelectorProps {
	customDateRange: DateRangeFormatted;
	setCustomDateRange: (newRange: DateRangeFormatted) => void;
	TriplanCalendarRef?: React.MutableRefObject<any>;
	disabled?: boolean;
}

const CustomDatesSelector = (props: CustomDatesSelectorProps) => {
	const eventStore = useContext(eventStoreContext);
	const dataService = eventStore.dataService;
	const isDisabled = props.disabled ?? eventStore.isTripLocked;
	const { customDateRange, setCustomDateRange, TriplanCalendarRef } = props;
	const [reRenderCounter, setReRenderCounter] = useState(0);

	const dateFormat = getUserDateFormat(eventStore);

	function InnerContentOld(){
		const arrowIcon = eventStore.getCurrentDirection() === 'rtl' ? 'left' : 'right';
		return (
			<div className="custom-dates-line">
				<input
					type="date"
					onKeyDown={(e) => {
						e.preventDefault();
						return false;
					}}
					key={`date-range-selector-${customDateRange.start}`}
					value={customDateRange.start}
					onChange={(e) => {
						const value = e.target.value;
						const newCustomDateRange = {
							start: value,
							end: customDateRange.end!,
						};

						if (!validateDateRange(eventStore, newCustomDateRange.start, newCustomDateRange.end)) {
							return;
						}

						setCustomDateRange(newCustomDateRange);
						eventStore.setCustomDateRange(newCustomDateRange);
						dataService.setDateRange(newCustomDateRange, eventStore.tripName);

						TriplanCalendarRef?.current?.switchToCustomView();
					}}
					disabled={props.disabled}
				/>
				<i className={`fa fa-arrow-${arrowIcon} flex-row align-items-center dark-color`} aria-hidden="true" />
				<input
					type="date"
					onKeyDown={(e) => {
						e.preventDefault();
						return false;
					}}
					key={`date-range-selector-${customDateRange.end}`}
					value={customDateRange.end}
					onChange={(e) => {
						const value = e.target.value;
						const newCustomDateRange = {
							start: customDateRange.start!,
							end: value,
						};

						if (!validateDateRange(eventStore, newCustomDateRange.start, newCustomDateRange.end)) {
							return;
						}

						const original = _.cloneDeep(customDateRange);

						setCustomDateRange(newCustomDateRange);
						eventStore.setCustomDateRange(newCustomDateRange);
						dataService.setDateRange(newCustomDateRange, eventStore.tripName);

						LogHistoryService.logHistory(eventStore, TripActions.changedTripDates, {
							startDate: {
								was: original.start,
								now: newCustomDateRange.start,
							},
							endDate: {
								was: original.end,
								now: newCustomDateRange.end,
							},
						});

						TriplanCalendarRef?.current?.switchToCustomView();
					}}
					disabled={props.disabled}
				/>
			</div>
		)
	}

	function InnerContentDisabled() {
		return (
			<div className="default-placeholder grayscale">
				<div className="text">
					<div className="dates-container"><span className="date"> {moment(props.customDateRange.start, 'YYYY-MM-DD').format(dateFormat)} </span><b> ~ </b><span
						className="date"> {moment(props.customDateRange.end, 'YYYY-MM-DD').format(dateFormat)} </span></div>
				</div>
				<div className="icon">
					<div className="calendar-hooks">
						<div className="hook"/>
						<div className="hook"/>
					</div>
					<div className="date-dots">
						<div className="dot"/>
						<div className="dot"/>
						<div className="dot"/>
						<div className="dot"/>
						<div className="dot"/>
					</div>
				</div>
			</div>
		)
	}

	function InnerContent() {
		return (
			isDisabled ? InnerContentDisabled() :
			<RangePicker
				key={reRenderCounter}
				defaultValue={{
					startDate: new Date(props.customDateRange.start),
					endDate: new Date(props.customDateRange.end)
				}}
				dateFormat={getUserDateFormatLowercase(eventStore)}
				onDateSelected={(from: Date, to: Date) => {
					// to.setDate(to.getDate() + 1)
					const newCustomDateRange = {
						start: formatDateString(from),
						end: formatDateString(to),
					};

					if (!validateDateRange(eventStore, newCustomDateRange.start, newCustomDateRange.end)) {
						setReRenderCounter(reRenderCounter + 1);
						return;
					}

					setCustomDateRange(newCustomDateRange);
					eventStore.setCustomDateRange(newCustomDateRange);
					dataService.setDateRange(newCustomDateRange, eventStore.tripName);

					TriplanCalendarRef?.current?.switchToCustomView();
				}}
				disabled={props.disabled}
				rangeTillEndOfDay
			/>
		)
	}

	return (
		<div
			className={getClasses(
				['custom-dates-container'],
				!(eventStore.isCalendarView || eventStore.isCombinedView) && 'display-none'
			)}
		>
			{eventStore.isMobile ? InnerContent() : InnerContentOld()}
		</div>
	);
};

export default CustomDatesSelector;
