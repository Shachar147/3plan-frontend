import React from "react";
import {getClasses} from "../../../utils/utils";

export enum ButtonFlavor {
    primary= 'primary',
    secondary='secondary',
    link='link',
    "movable-link"="movable-link"
}

export interface ButtonProps {
    text: string,
    onClick: () => void,
    flavor: ButtonFlavor;
    className?: string,
    disabled?: boolean
    icon?: string
}

const Button = (props: ButtonProps) => (
    <button
        className={getClasses([`${props.flavor}-button main-font`], props.className)}
        onClick={props.onClick}
        disabled={props.disabled}
    >
        {props.icon && (<i className={`fa ${props.icon}`} aria-hidden="true"></i>)}
        {props.text}
    </button>
);

export default Button;