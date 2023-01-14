import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import TriplanSearch from './triplan-search';

export default {
	title: 'Header/Header Components/Search',
	component: TriplanSearch,
	argTypes: {},
} as ComponentMeta<typeof TriplanSearch>;

const Template: ComponentStory<typeof TriplanSearch> = () => <TriplanSearch />;

export const defaultValue = Template.bind({});
defaultValue.args = {};
