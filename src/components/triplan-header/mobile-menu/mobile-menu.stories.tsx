import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import MobileMenu from './mobile-menu';

export default {
	title: 'Header/Header Components/Mobile Menu',
	component: MobileMenu,
	argTypes: {
		height: { control: 'number' },
		items: {
			defaultValue: [
				{ text: 'Item 1', onClick: () => alert('item1!') },
				{ text: 'Item 2', onClick: () => alert('item2!') },
				{ text: 'Item 3', onClick: () => alert('item3!') },
			],
		},
	},
} as ComponentMeta<typeof MobileMenu>;

const Template: ComponentStory<typeof MobileMenu> = (args) => <MobileMenu {...args} />;

export const defaultValue = Template.bind({});
defaultValue.args = {};
