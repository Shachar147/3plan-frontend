import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import LanguageSelector from './language-selector';

export default {
	title: 'Header/Header Components/Language Selector',
	component: LanguageSelector,
	argTypes: {},
} as ComponentMeta<typeof LanguageSelector>;

const Template: ComponentStory<typeof LanguageSelector> = () => <LanguageSelector />;

export const defaultValue = Template.bind({});
