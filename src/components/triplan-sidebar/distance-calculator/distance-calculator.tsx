import TranslateService from '../../../services/translate-service';
import React, { useContext, useState } from 'react';
import { getCoordinatesRangeKey, toDistanceString } from '../../../utils/utils';
import { DistanceResult } from '../../../utils/interfaces';
import Button, { ButtonFlavor } from '../../common/button/button';
import ReactModalService, { ReactModalRenderHelper } from '../../../services/react-modal-service';
import { observer, Observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { GoogleTravelMode } from '../../../utils/enums';

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

		const distanceKey = getCoordinatesRangeKey(GoogleTravelMode.DRIVING, from.value, to.value);
		const distanceKey2 = getCoordinatesRangeKey(GoogleTravelMode.WALKING, from.value, to.value);
		const distanceKey3 = getCoordinatesRangeKey(GoogleTravelMode.TRANSIT, from.value, to.value);

		const distanceResult: DistanceResult | undefined = eventStore.distanceResults.has(distanceKey)
			? eventStore.distanceResults.get(distanceKey)
			: undefined;
		const distanceResult2: DistanceResult | undefined = eventStore.distanceResults.has(distanceKey2)
			? eventStore.distanceResults.get(distanceKey2)
			: undefined;
		const distanceResult3: DistanceResult | undefined = eventStore.distanceResults.has(distanceKey3)
			? eventStore.distanceResults.get(distanceKey3)
			: undefined;

		const distanceString = distanceResult
			? toDistanceString(eventStore, distanceResult, true, GoogleTravelMode.DRIVING, true)
			: undefined;
		const distanceString2 = distanceResult2
			? toDistanceString(eventStore, distanceResult2, true, GoogleTravelMode.WALKING, true)
			: undefined;
		const distanceString3 = distanceResult3
			? toDistanceString(eventStore, distanceResult3, true, GoogleTravelMode.TRANSIT, true)
			: undefined;

		if (distanceString == undefined && distanceString2 == undefined && distanceString3 == undefined) {
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
				{distanceString && <div>{distanceString}</div>}
				{distanceString2 && <div>{distanceString2}</div>}
				{distanceString3 && <div>{distanceString3}</div>}
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

			{!!from && !!to && (
				<div className="sidebar-distance-result" key={JSON.stringify(eventStore.modalValues)}>
					<Observer>{() => renderFromToDistanceResult()}</Observer>
				</div>
			)}
		</div>
	);
};

export default observer(DistanceCalculator);
