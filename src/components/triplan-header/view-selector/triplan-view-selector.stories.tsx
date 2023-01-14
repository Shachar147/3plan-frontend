import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import TriplanViewSelector from './triplan-view-selector';

export default {
	title: 'Header/Header Components/View Selector',
	component: TriplanViewSelector,
	argTypes: {},
} as ComponentMeta<typeof TriplanViewSelector>;

const Template: ComponentStory<typeof TriplanViewSelector> = () => <TriplanViewSelector />;

export const defaultValue = Template.bind({});
defaultValue.args = {};
