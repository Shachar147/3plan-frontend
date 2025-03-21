import React, { CSSProperties, useContext } from 'react';
import { getClasses } from '../../utils/utils';
import { eventStoreContext } from '../../stores/events-store';
import { SidebarEvent } from '../../utils/interfaces';
import { observer } from 'mobx-react';
import './triplan-sidebar-inner.scss';
import CustomDatesSelector from './custom-dates-selector/custom-dates-selector';
import { DateRangeFormatted } from '../../services/data-handlers/data-handler-base';
import './triplan-sidebar.scss';
import MinimizeExpandSidebarButton from './minimze-expand-sidebar-button/minimize-expand-sidebar-button';
import TriplanSidebarInner from './triplan-sidebar-inner';

export interface TriplanSidebarProps {
	removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
	addToEventsToCategories: (event: SidebarEvent) => void;
	customDateRange: DateRangeFormatted;
	setCustomDateRange: (newRange: DateRangeFormatted) => void;
	TriplanCalendarRef: React.MutableRefObject<HTMLDivElement>;
	addEventToSidebar: (event: SidebarEvent) => boolean;
}

export enum SidebarGroups {
	CALENDAR_STATISTICS = 'CALENDAR_STATISTICS',
	WARNINGS = 'WARNINGS',
	ACTIONS = 'ACTIONS',
	RECOMMENDATIONS = 'RECOMMENDATIONS',
	PRIORITIES_LEGEND = 'PRIORITIES_LEGEND',
	PRIORITIES_FILTER = 'PRIORITIES_FILTER',
	CATEGORIES_FILTER = 'CATEGORIES_FILTER',
	PREFERRED_TIME_FILTER = 'PREFERRED_TIME_FILTER',
	SETTINGS = 'SETTINGS',
	DISTANCES = 'DISTANCES',
	DISTANCES_NEARBY = 'DISTANCES_NEARBY',
	DISTANCES_FROMTO = 'DISTANCES_FROMTO',
	TASKS = 'TASKS',
}

export const wrapWithSidebarGroup = (
	children: JSX.Element,
	groupIcon: string | undefined = undefined,
	groupKey: string,
	groupTitle: string,
	itemsCount: number,
	textColor: string = 'inherit',
	maxHeight?: number,
	titleSuffix?: string
) => {
	const eventStore = useContext(eventStoreContext);
	const isOpen = eventStore.openSidebarGroups.has(groupKey);
	const arrowDirection = eventStore.getCurrentDirection() === 'ltr' ? 'right' : 'left';

	// Calculate max height for open state
	const num = maxHeight ?? 100 * itemsCount + 90;

	// Set custom max height via style attribute, but use classes for all other styling
	const customMaxHeight = isOpen ? { maxHeight: num + 'px' } : {};

	return (
		<>
			<div
				className="sidebar-statistics sidebar-group"
				style={{ color: textColor }}
				onClick={() => eventStore.toggleSidebarGroups(groupKey)}
			>
				<i
					className={isOpen ? 'fa fa-angle-double-down' : 'fa fa-angle-double-' + arrowDirection}
					aria-hidden="true"
				/>
				<span className="flex-gap-5 align-items-center">
					{groupIcon ? <i className={`fa ${groupIcon}`} aria-hidden="true" /> : null} {groupTitle}
				</span>
				{!!titleSuffix && <div>{titleSuffix}</div>}
			</div>
			<div className={getClasses('sidebar-group-content', isOpen ? 'open' : 'closed')} style={customMaxHeight}>
				{children}
			</div>
		</>
	);
};

function TriplanSidebar(props: TriplanSidebarProps) {
	const eventStore = useContext(eventStoreContext);
	const { customDateRange, setCustomDateRange, TriplanCalendarRef } = props;

	return (
		<>
			<div
				className={getClasses(
					'external-events-container bright-scrollbar',
					!eventStore.isMobile && eventStore.viewMode,
					!eventStore.isMobile && 'pc',
					eventStore.isSidebarMinimized && 'sidebar-minimized'
				)}
			>
				<CustomDatesSelector
					TriplanCalendarRef={TriplanCalendarRef}
					customDateRange={customDateRange}
					setCustomDateRange={setCustomDateRange}
					disabled={eventStore.isTripLocked}
				/>
				<TriplanSidebarInner {...props} />
			</div>
			{eventStore.isSidebarMinimized && <MinimizeExpandSidebarButton />}
		</>
	);
}

export default observer(TriplanSidebar);
