import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import TriplanHeader from './triplan-header';

export default {
	title: 'Header/Header',
	component: TriplanHeader,
	argTypes: {
		withLogo: { control: 'boolean', defaultValue: true },
		withMyTrips: { control: 'boolean', defaultValue: true },
		withSearch: { control: 'boolean', defaultValue: true },
		withFilterTags: { control: 'boolean', defaultValue: true },
		withViewSelector: { control: 'boolean', defaultValue: true },
		withLoginLogout: { control: 'boolean', defaultValue: true },
		onLogoClick: { defaultValue: () => alert('logo clicked!') },
		onMyTripsClick: { defaultValue: () => alert('my trips clicked!') },
		showOnlyEventsWithNoLocation: { control: 'boolean', defaultValue: true },
		showOnlyEventsWithNoOpeningHours: { control: 'boolean', defaultValue: true },
		showOnlyEventsWithTodoComplete: { control: 'boolean', defaultValue: true },
	},
} as ComponentMeta<typeof TriplanHeader>;

const Template: ComponentStory<typeof TriplanHeader> = (args) => <TriplanHeader {...args} />;

export const defaultValue = Template.bind({});
