import React from 'react';
import { getClasses } from '../../../utils/utils';

export enum ButtonFlavor {
	primary = 'primary',
	success = 'primary-success',
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

	iconPosition?: 'start' | 'end';
	tooltip?: string;
}

const Button = (props: ButtonProps) => {
	const { iconPosition = 'start' } = props;

	return (
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
			title={props.disabled && props.disabledReason ? props.disabledReason : props.tooltip}
		>
			{props.image && <img alt={''} src={props.image} height={props.imageHeight} />}
			{props.icon && iconPosition == 'start' && <i className={`fa ${props.icon}`} aria-hidden="true" />}
			{props.text && props.text.length && <span className="white-space-pre">{props.text}</span>}
			{props.icon && iconPosition == 'end' && <i className={`fa ${props.icon}`} aria-hidden="true" />}
		</button>
	);
};

export default Button;
