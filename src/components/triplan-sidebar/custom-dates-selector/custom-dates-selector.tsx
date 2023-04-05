import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../../stores/events-store';
import Button, { ButtonFlavor } from '../../common/button/button';
import DataServices, { DateRangeFormatted } from '../../../services/data-handlers/data-handler-base';
import { validateDateRange } from '../../../utils/time-utils';

export interface CustomDatesSelectorProps {
	customDateRange: DateRangeFormatted;
	setCustomDateRange: (newRange: DateRangeFormatted) => void;
	TriplanCalendarRef?: React.MutableRefObject<any>;
}

const CustomDatesSelector = (props: CustomDatesSelectorProps) => {
	const eventStore = useContext(eventStoreContext);
	const dataService = eventStore.dataService;
	const { customDateRange, setCustomDateRange, TriplanCalendarRef } = props;

	const arrowIcon = eventStore.getCurrentDirection() === 'rtl' ? 'left' : 'right';

	return (
		<div
			className={getClasses(
				['custom-dates-container'],
				!(eventStore.isCalendarView || eventStore.isCombinedView) && 'display-none'
			)}
		>
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

						if (!eventStore.isMobile) {
							TriplanCalendarRef?.current?.switchToCustomView();
						}
					}}
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

						setCustomDateRange(newCustomDateRange);
						eventStore.setCustomDateRange(newCustomDateRange);
						dataService.setDateRange(newCustomDateRange, eventStore.tripName);

						if (!eventStore.isMobile) {
							TriplanCalendarRef?.current?.switchToCustomView();
						}
					}}
				/>
			</div>
			{!eventStore.isMobile && (
				<div className={'custom-dates-submit'}>
					<Button
						flavor={ButtonFlavor.secondary}
						className={'black'}
						onClick={() => {
							if (TriplanCalendarRef && TriplanCalendarRef.current) {
								TriplanCalendarRef.current.switchToCustomView();
							}
						}}
						text={TranslateService.translate(eventStore, 'CUSTOM_DATES.CHANGE_DATES')}
					/>
				</div>
			)}
		</div>
	);
};

export default CustomDatesSelector;
