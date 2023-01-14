import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import MyTrips from './my-trips';

export default {
	title: 'Header/Header Components/My Trips',
	component: MyTrips,
	argTypes: {
		height: { control: 'number' },
	},
} as ComponentMeta<typeof MyTrips>;

const Template: ComponentStory<typeof MyTrips> = (args) => <MyTrips {...args} />;

export const defaultValue = Template.bind({});
defaultValue.args = {
	onClick: () => {
		alert('my trips clicked!');
	},
};
