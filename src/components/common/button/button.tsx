import React from 'react';
import { getClasses } from '../../../utils/utils';

export enum ButtonFlavor {
	primary = 'primary',
	secondary = 'secondary',
	link = 'link',
	'movable-link' = 'movable-link',
}

export interface ButtonProps {
	text: string;
	onClick: () => void;
	flavor: ButtonFlavor;
	className?: string;
	disabled?: boolean;
	disabledReason?: string;
	style?: object;

	icon?: string;
	image?: string;
	imageHeight?: number;
}

const Button = (props: ButtonProps) => (
	<button
		className={getClasses(
			[`${props.flavor}-button main-font`],
			props.className,
			props.disabled && 'cursor-default'
		)}
		onClick={() => {
			!props.disabled && props.onClick();
		}}
		disabled={props.disabled}
		style={props.style}
		title={props.disabled && props.disabledReason ? props.disabledReason : undefined}
	>
		{props.image && <img alt={''} src={props.image} height={props.imageHeight} />}
		{props.icon && <i className={`fa ${props.icon}`} aria-hidden="true" />}
		<span className="white-space-pre">{props.text}</span>
	</button>
);

export default Button;
