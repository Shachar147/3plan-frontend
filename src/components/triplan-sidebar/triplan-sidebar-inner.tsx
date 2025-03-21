import { observer } from 'mobx-react';
import React, { useContext } from 'react';
import { eventStoreContext } from '../../stores/events-store';
import { TriplanSidebarProps } from './triplan-sidebar';
import './triplan-sidebar-inner.scss';
import TriplanSidebarCollapsableMenu from './sidebar-collapsable-menu/triplan-sidebar-collapsable-menu';
import TriplanSidebarMainButtons from './sidebar-main-buttons/triplan-sidebar-main-buttons';

// @ts-ignore
import EllipsisWithTooltip from 'react-ellipsis-with-tooltip';
import { TriplanSidebarDivider } from './triplan-sidebar-divider';
import TriplanSidebarCategories from './sidebar-categories/triplan-sidebar-categories';
import TriplanSidebarShareTripPlaceholder from './sidebar-share-trip-placeholder/triplan-sidebar-share-trip-placeholder';
import TriplanSidebarHistory from './sidebar-history/triplan-sidebar-history';

const TriplanSidebarInner = (props: TriplanSidebarProps) => {
	const eventStore = useContext(eventStoreContext);

	return (
		<div>
			<TriplanSidebarMainButtons />
			<div>
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
