import TranslateService from '../../../services/translate-service';
import React, { useContext, useState } from 'react';
import { getCoordinatesRangeKey, toDistanceString } from '../../../utils/utils';
import { DistanceResult } from '../../../utils/interfaces';
import Button, { ButtonFlavor } from '../../common/button/button';
import ReactModalService, { ReactModalRenderHelper } from '../../../services/react-modal-service';
import { observer, Observer } from 'mobx-react';
import { SidebarGroups, wrapWithSidebarGroup } from '../triplan-sidebar';
import { eventStoreContext } from '../../../stores/events-store';

const UNKNOWN_DISTANCE_RESULT = 'N/A';

const DistanceCalculator = () => {
	const eventStore = useContext(eventStoreContext);

	const options = eventStore.allEventsLocationsWithDuplicates.map((x) => ({
		label: x.eventName,
		value: x,
	}));

	const [from, setFrom] = useState<any>(null);
	const [to, setTo] = useState<any>(null);

	const renderFromToDistanceResult = () => {
		if (!from || !to) {
			return null;
		}

		const distanceKey = getCoordinatesRangeKey(eventStore.travelMode, from.value, to.value);

		const distanceResult: DistanceResult | undefined = eventStore.distanceResults.has(distanceKey)
			? eventStore.distanceResults.get(distanceKey)
			: undefined;

		const distanceString = distanceResult
			? toDistanceString(eventStore, distanceResult, true, eventStore.travelMode, true)
			: UNKNOWN_DISTANCE_RESULT;

		if (distanceString === UNKNOWN_DISTANCE_RESULT) {
			return (
				<div className="flex-col gap-8 sidebar-distances-block-result">
					<div className="flex-row align-items-center">
						{TranslateService.translate(eventStore, 'SIDEBAR.DISTANCES_BLOCK.ROUTE_NOT_CALCULATED.PREFIX')}
						<Button
							flavor={ButtonFlavor.link}
							onClick={() => ReactModalService.openCalculateDistancesModal(eventStore)}
							text={TranslateService.translate(eventStore, 'GENERAL.CLICK_HERE')}
							className="padding-inline-3-important"
						/>
						{TranslateService.translate(eventStore, 'SIDEBAR.DISTANCES_BLOCK.ROUTE_NOT_CALCULATED.SUFFIX')}
					</div>
				</div>
			);
		}

		return (
			<div className="flex-col gap-8 sidebar-distances-block-result">
				<div>{distanceString}</div>
			</div>
		);
	};

	return (
		<div className="sidebar-distances-block">
			{ReactModalRenderHelper.renderInputWithLabel(
				eventStore,
				'SIDEBAR.DISTANCES_BLOCK.FROM',
				ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'from',
					{
						options: options.filter((x) => (to ? JSON.stringify(x) !== JSON.stringify(to) : true)),
						placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER',
						onChange: (data: any) => setFrom(data),
					},
					'distance-selector',
					undefined
				),
				'sidebar-distances-select-row'
			)}

			{ReactModalRenderHelper.renderInputWithLabel(
				eventStore,
				'SIDEBAR.DISTANCES_BLOCK.TO',
				ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'to',
					{
						options: options.filter((x) => (from ? JSON.stringify(x) !== JSON.stringify(from) : true)),
						placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER',
						onChange: (data: any) => setTo(data),
					},
					'distance-selector',
					undefined
				),
				'sidebar-distances-select-row'
			)}

			<div className="sidebar-distance-result" key={JSON.stringify(eventStore.modalValues)}>
				<Observer>{() => renderFromToDistanceResult()}</Observer>
			</div>
		</div>
	);
};

export default observer(DistanceCalculator);
