import { observer } from 'mobx-react';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../stores/events-store';
import { TriplanSidebarProps } from './triplan-sidebar';
import './triplan-sidebar-inner.scss';
import TriplanSidebarCollapsableMenu from './sidebar-collapsable-menu/triplan-sidebar-collapsable-menu';
import TriplanSidebarMainButtons from './sidebar-main-buttons/triplan-sidebar-main-buttons';

import { TriplanSidebarDivider } from './triplan-sidebar-divider';
import TriplanSidebarCategories from './sidebar-categories/triplan-sidebar-categories';
import TriplanSidebarShareTripPlaceholder from './sidebar-share-trip-placeholder/triplan-sidebar-share-trip-placeholder';
import TriplanSidebarHistory from './sidebar-history/triplan-sidebar-history';
import { isAdmin } from '../../utils/utils';
import TranslateService from '../../services/translate-service';
import { endpoints } from '../../v2/utils/endpoints';
import ReactModalService, { getDefaultSettings } from '../../services/react-modal-service';
import { SaveTemplateModal } from './save-template-modal/save-template-modal';
import { apiPost } from '../../helpers/api';
import { SidebarSuggestedCombinations } from './sidebar-suggested-combinations/sidebar-suggested-combinations';
import { createSidebarGroup, SidebarGroups } from './triplan-sidebar';

const TriplanSidebarInner = (props: TriplanSidebarProps) => {
	const eventStore = useContext(eventStoreContext);

	const handleSaveAsTemplate = async () => {
		const tripName = TranslateService.translate(
			eventStore,
			'TEMPLATE_NAME_FORMAT',
			{
				days: eventStore.tripDaysArray.length,
				destination: eventStore.destinations.join(','),
			},
			'en'
		);
		const hebTripName = TranslateService.translate(
			eventStore,
			'TEMPLATE_NAME_FORMAT',
			{
				days: eventStore.tripDaysArray.length,
				destination: eventStore.destinations
					.map((d) => TranslateService.translate(eventStore, d, {}, 'he'))
					.join(','),
			},
			'he'
		);

		const defaultTripName = [tripName, hebTripName].join('|');

		const onConfirm = async () => {
			try {
				const res = await apiPost(endpoints.v1.trips.saveAsTemplate, {
					tripName: eventStore.tripName,
					newTripName: eventStore.modalValues['template-name'] || defaultTripName,
				});

				const isSaved = res.data.updated || res.data.created;
				if (!isSaved) {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'OOPS_SOMETHING_WENT_WRONG',
						'error'
					);
					return;
				}

				ReactModalService.internal.alertMessage(
					eventStore,
					'SAVED_SUCCESSFULLY',
					res.data.updated ? 'TEMPLATE_UPDATED' : 'TRIP_SAVED_AS_TEMPLATE',
					'success'
				);
			} catch (error) {
				console.error('Error saving trip as template:', error);
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'OOPS_SOMETHING_WENT_WRONG',
					'error'
				);
			}
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'SAVE_AS_TEMPLATE'),
			content: (
				<SaveTemplateModal
					defaultTripName={defaultTripName}
					onConfirm={onConfirm}
					addEventToSidebar={props.addEventToSidebar}
					removeEventFromSidebarById={props.removeEventFromSidebarById}
					addToEventsToCategories={props.addToEventsToCategories}
				/>
			),
			onConfirm,
			type: 'controlled',
		});
	};

	return (
		<div>
			<TriplanSidebarMainButtons />
			<div>
				{isAdmin() && (
					<div className="sidebar-statistics sidebar-group" onClick={handleSaveAsTemplate}>
						<i className="fa fa-save" aria-hidden="true" />
						<span className="flex-gap-5 align-items-center">
							{TranslateService.translate(eventStore, 'SAVE_AS_TEMPLATE')}
						</span>
					</div>
				)}
				{createSidebarGroup(
					<SidebarSuggestedCombinations eventStore={eventStore} />,
					'fa-lastfm-square',
					SidebarGroups.SUGGESTED_COMBINATIONS,
					TranslateService.translate(eventStore, 'SUGGESTED_COMBINATIONS.TITLE'),
					eventStore.suggestedCombinationsComputed.length * 20
				)}
				<TriplanSidebarCollapsableMenu {...props} />
				<TriplanSidebarDivider />
				<TriplanSidebarCategories {...props} />
				{!eventStore.isSharedTrip && (
					<>
						<TriplanSidebarDivider />
						<TriplanSidebarShareTripPlaceholder />
					</>
				)}
				<TriplanSidebarHistory renderPrefix={() => <TriplanSidebarDivider />} />
			</div>
		</div>
	);
};

export default observer(TriplanSidebarInner);
