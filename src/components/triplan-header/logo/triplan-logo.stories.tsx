import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import TriplanLogo from './triplan-logo';

export default {
	title: 'Header/Header Components/Logo',
	component: TriplanLogo,
	argTypes: {
		height: { control: 'number' },
	},
} as ComponentMeta<typeof TriplanLogo>;

const Template: ComponentStory<typeof TriplanLogo> = (args) => <TriplanLogo {...args} />;

export const Logout = Template.bind({});
Logout.args = {
	onClick: () => {
		alert('logo clicked!');
	},
};
