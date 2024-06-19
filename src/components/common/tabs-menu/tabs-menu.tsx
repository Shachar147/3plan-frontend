import React from "react";
import { getClasses } from '../../../utils/utils';
import { useState } from 'react';

export interface Tab {
	name: string;
	render: () => React.ReactNode | null;
}
export interface TabMenuProps {
	tabs: Tab[],
	activeTab?: string;
}
export default function TabMenu(props: TabMenuProps){
	const { tabs } = props;
	const [activeTab, setActiveTab] = useState(props.activeTab ?? tabs?.[0].name);
	return (
		<div key={activeTab}>
			<div className="ui top attached tabular menu">
				{tabs.map((tab) => <div className={getClasses(activeTab == tab.name && 'active', "item", activeTab !== tab.name && 'cursor-pointer')} onClick={() => {
					if (activeTab !== tab.name) {
						setActiveTab(tab.name);
					}
				}} >{tab.name}</div>)}
			</div>
			<div className="ui bottom attached active tab segment">
				{tabs.find((t) => t.name === activeTab)?.render()}
			</div>
		</div>
	)
}