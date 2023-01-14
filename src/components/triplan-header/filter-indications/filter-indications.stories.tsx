import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import FilterIndications from './filter-indications';

export default {
	title: 'Header/Header Components/Filter Indications',
	component: FilterIndications,
	argTypes: {
		showOnlyEventsWithNoLocation: { control: 'boolean', defaultValue: true },
		showOnlyEventsWithNoOpeningHours: { control: 'boolean', defaultValue: true },
		showOnlyEventsWithTodoComplete: { control: 'boolean', defaultValue: true },
	},
} as ComponentMeta<typeof FilterIndications>;

const Template: ComponentStory<typeof FilterIndications> = (args) => <FilterIndications {...args} />;

export const defaultValue = Template.bind({});
