import React, { useContext, useEffect } from 'react';
import { getClasses } from '../../../utils/utils';
import { useState } from 'react';
import { observer } from 'mobx-react';
import { feedStoreContext } from '../../../v2/stores/feed-view-store';

export interface Tab {
	id: string;
	name: string;
	icon?: string;
	renderIcon?: () => React.ReactNode | null;
	render: () => React.ReactNode | null;
}
export interface TabMenuProps {
	tabs: Tab[];
	activeTab?: string;
	onChange?: (tabId) => void;
}

function TabMenu(props: TabMenuProps) {
	const { tabs, onChange } = props;
	const feedStore = useContext(feedStoreContext);

	useEffect(() => {
		if (props.activeTab) {
			feedStore.setActiveTab(props.activeTab);
		}
	}, [props.activeTab]);

	useEffect(() => {
		scrollToDiv(feedStore.activeTab);
	}, [feedStore.activeTab]);

	function scrollToDiv(tabId: string) {
		const element = document.querySelector(`[data-tab-id='${tabId}']`);
		if (!element) {
			return;
		}
		const container = element.parentElement;
		if (!container) {
			return;
		}
		const containerScrollPosition = container.scrollLeft;
		const elementOffsetLeft = element.offsetLeft;

		container.scroll({
			left: containerScrollPosition + elementOffsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2,
			behavior: 'smooth',
		});
	}

	return (
		<div key={feedStore.activeTab}>
			<div className="ui top attached tabular menu">
				{tabs.map((tab) => (
					<div
						key={`tab-${tab.id}`}
						data-tab-id={tab.id}
						className={getClasses(
							feedStore.activeTab == tab.id && 'active',
							'item',
							feedStore.activeTab !== tab.id && 'cursor-pointer',
							'flex-row gap-8 align-items-center'
						)}
						onClick={(element) => {
							if (feedStore.activeTab !== tab.id) {
								feedStore.setActiveTab(tab.id);
								onChange?.(tab.id);
							}
						}}
					>
						{tab.renderIcon
							? tab.renderIcon()
							: tab.icon && <i className={`fa ${tab.icon}`} aria-hidden="true" />}
						{tab.name}
					</div>
				))}
			</div>
			<div className="ui bottom attached active tab segment">
				{tabs.find((t) => t.id === feedStore.activeTab)?.render()}
			</div>
		</div>
	);
}

export default observer(TabMenu);
