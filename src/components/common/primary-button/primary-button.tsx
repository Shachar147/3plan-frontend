import React from "react";
import {getClasses} from "../../../utils/utils";

export interface PrimaryButtonProps {
    text: string,
    onClick: () => void,
    className?: string
}

const PrimaryButton = (props: PrimaryButtonProps) => (
    <button className={getClasses(["primary-button main-font"], props.className)} onClick={props.onClick}>{props.text}</button>
);

export default PrimaryButton;