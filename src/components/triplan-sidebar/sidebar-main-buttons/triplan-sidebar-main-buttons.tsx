import MinimizeExpandSidebarButton from '../minimze-expand-sidebar-button/minimize-expand-sidebar-button';
import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import Button, { ButtonFlavor } from '../../common/button/button';
import ReactModalService from '../../../services/react-modal-service';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { getClasses } from '../../../utils/utils';
import './triplan-sidebar-main-buttons.scss';
import AutoScheduleApiService from '../../../v2/services/auto-schedule-api-service';

function TriplanSidebarMainButtons() {
	const eventStore = useContext(eventStoreContext);
	const [isAutoScheduling, setIsAutoScheduling] = useState(false);
	const [autoScheduleMessage, setAutoScheduleMessage] = useState<string | null>(null);
	const autoScheduleApiService = new AutoScheduleApiService();

	async function handleAutoSchedule() {
		setIsAutoScheduling(true);
		setAutoScheduleMessage(null);
		try {
			const response = await autoScheduleApiService.autoScheduleTrip(eventStore.tripName);
			setAutoScheduleMessage('הלו"ז נבנה בהצלחה!');
			// Optionally, reload events here if needed
		} catch (error) {
			setAutoScheduleMessage('אירעה שגיאה בעת בניית הלו"ז');
		} finally {
			setIsAutoScheduling(false);
		}
	}

	function renderAutoScheduleButton() {
		return (
			<div className="auto-schedule-button">
				<Button
					flavor={ButtonFlavor.primary}
					className="width-100-percents blue"
					onClick={handleAutoSchedule}
					text={isAutoScheduling ? TranslateService.translate(eventStore, 'LOADING') : 'תזמן אוטומטית'}
					disabled={isAutoScheduling || eventStore.isTripLocked}
					icon={isAutoScheduling ? 'fa-spinner fa-spin' : 'fa-magic'}
				/>
				{autoScheduleMessage && <div className="auto-schedule-message">{autoScheduleMessage}</div>}
			</div>
		);
	}

	function renderAddCategoryButton() {
		return (
			<div className="add-category-button">
				<Button
					flavor={ButtonFlavor.secondary}
					className="width-100-percents black"
					onClick={() => ReactModalService.openAddCategoryModal(eventStore)}
					text={TranslateService.translate(eventStore, 'ADD_CATEGORY.BUTTON_TEXT')}
					disabled={eventStore.isTripLocked}
					disabledReason={
						eventStore.isTripLocked ? TranslateService.translate(eventStore, 'TRIP_IS_LOCKED') : undefined
					}
					icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
				/>
			</div>
		);
	}

	function renderAddEventButton() {
		const isMapViewAndNoEventsYet = eventStore.isMapView && eventStore.calendarEvents.length == 0;
		const disabledReason = eventStore.isTripLocked
			? TranslateService.translate(eventStore, 'TRIP_IS_LOCKED')
			: TranslateService.translate(eventStore, 'DISABLED_REASON.THERE_ARE_NO_CATEGORIES');

		return (
			<div className="add-activity-button">
				<Button
					flavor={isMapViewAndNoEventsYet ? ButtonFlavor.secondary : ButtonFlavor.primary}
					onClick={() => ReactModalService.openAddSidebarEventModal(eventStore)}
					className={getClasses('width-100-percents', isMapViewAndNoEventsYet && 'black')}
					text={TranslateService.translate(eventStore, 'ADD_EVENT.BUTTON_TEXT')}
					disabled={eventStore.categories.length === 0 || eventStore.isTripLocked}
					disabledReason={disabledReason}
					icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
				/>
			</div>
		);
	}

	return (
		<div className="triplan-sidebar-main-buttons flex-row gap-10 sticky-0">
			<MinimizeExpandSidebarButton />
			{renderAddEventButton()}
			{renderAddCategoryButton()}
			{renderAutoScheduleButton()}
		</div>
	);
}

export default observer(TriplanSidebarMainButtons);
