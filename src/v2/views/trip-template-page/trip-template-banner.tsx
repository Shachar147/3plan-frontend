import { getClasses, getEventTitle } from '../../../utils/utils';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { mainPageContentTabLsKey, myTripsTabId, newDesignRootPath } from '../../utils/consts';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import TranslateService from '../../../services/translate-service';
import { CalendarEvent } from '../../../utils/interfaces';
import { MOBILE_SCROLL_TOP } from '../../components/scroll-top/scroll-top';

function TripTemplateBanner({
	baseClass,
	coverImage,
	isShimmering,
}: {
	baseClass: string;
	coverImage: string;
	isShimmering?: boolean;
}) {
	const eventStore = useContext(eventStoreContext);
	const isInTemplate = window.location.href.includes(`${newDesignRootPath}/template/`);

	// @ts-ignore
	const c: CalendarEvent = { title: eventStore.tripName };

	return (
		<div
			className={getClasses('trip-template-page-cover', isShimmering && 'shimmer-animation')}
			style={{
				backgroundImage: isShimmering ? undefined : `url('${coverImage}')`,
			}}
		>
			<div className={`${baseClass}-content-bottom-shadow`}>
				<span
					className={getClasses(isShimmering && 'shimmer-animation')}
					style={
						isShimmering
							? {
									width: '100%',
									minHeight: 40,
							  }
							: {}
					}
				>
					{getEventTitle(c, eventStore, true)}
				</span>
				{isInTemplate && isShimmering ? (
					<div
						className="shimmer-animation border-radius-20"
						style={{
							width: 128,
							height: 38,
						}}
					/>
				) : (
					<Button
						flavor={ButtonFlavor.secondary}
						onClick={() => {
							localStorage.setItem(mainPageContentTabLsKey, myTripsTabId);
							const key = `${newDesignRootPath}/template/`;
							const templateId = Number(window.location.href.split(key)?.[1]?.split('#')?.[0]);
							window.location.assign(`${newDesignRootPath}/#createTrip?tid=${templateId}`);

							window.scrollTo({
								top: eventStore.isMobile ? MOBILE_SCROLL_TOP : 500,
								behavior: 'smooth',
							});
						}}
						className="width-max-content black padding-inline-15"
						text={TranslateService.translate(eventStore, 'CREATE_TRIP_FROM_TEMPLATE.BUTTON.TEXT')}
					/>
				)}
			</div>
		</div>
	);
}

export default observer(TripTemplateBanner);
