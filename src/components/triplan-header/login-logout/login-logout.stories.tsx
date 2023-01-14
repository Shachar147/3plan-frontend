import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import LoginLogout from './login-logout';

export default {
	title: 'Header/Header Components/Login Logout',
	component: LoginLogout,
	argTypes: {
		isLoggedIn: { control: 'boolean' },
	},
} as ComponentMeta<typeof LoginLogout>;

const Template: ComponentStory<typeof LoginLogout> = (args) => <LoginLogout {...args} />;

export const Logout = Template.bind({});
Logout.args = {
	isLoggedIn: true,
};

export const Login = Template.bind({});
Login.args = {
	isLoggedIn: false,
};
