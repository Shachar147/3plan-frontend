import React, {useRef, useState, useMemo, useEffect} from 'react';
import './toggle-button.css';
import {getClasses} from "../../utils/utils";

export function useIntervalWhile(action: () => boolean, interval: number, maxTries: number, deps?: any[]) {
	return useEffect(() => {
		const intervalId = setIntervalWhile(action, interval, maxTries);
		return () => clearInterval(intervalId);
	}, deps);
}

// @ts-ignore
function setIntervalWhile(action: () => boolean, interval: number, maxTries: number): NodeJS.Timeout {
	/*
		This function gets an action to run and run it as long as it returns false and not reached max tries.
	 */
	let triesCounter = 0;
	let intervalId = setInterval(function () {
		triesCounter++;
		if (action() || triesCounter === maxTries) {
			if (triesCounter === maxTries) {
				console.log('reached max tries');
			}
			clearInterval(intervalId);
			triesCounter = 0;
		}
	}, interval);
	return intervalId;
}

export interface OptionToggleButton {
	key: string;
	name: string;
	icon?: Element | string;
	iconActive?: string;
}

interface MultipleOptionsToggleButtonProps {
	value: string;
	onChange(value: string): void;
	options: OptionToggleButton[];
	customStyle?: 'default' | 'white' | 'tabs_underline' | string;
	direction?: 'rtl' | 'ltr';
	fontAwesomeIcons?: boolean;
}

export default function ToggleButton(props: MultipleOptionsToggleButtonProps) {
	const { value, onChange, customStyle = 'default', direction = 'ltr', fontAwesomeIcons = true } = props;
	const [left, setLeft] = useState<number | undefined>(0);
	const [right, setRight] = useState<number | undefined>(0);
	const [width, setWidth] = useState(0);
	const [updateCount, setUpdateCount] = useState(0);
	const containerRef = useRef() as React.MutableRefObject<HTMLDivElement>;
	const refs = useMemo<(HTMLDivElement | null)[]>(() => [], []);

	useIntervalWhile(initSelectedCircle, 100, 50, [props.value]);

	function initSelectedCircle() {
		const index = props.options.map((option) => option.key).indexOf(value);
		const containerRect = containerRef.current.getBoundingClientRect();
		const childRect = refs[index]!.getBoundingClientRect();
		const width = Math.floor(childRect.width);

		// take left / right based on current direction (for different languages)
		const left =
			direction === 'ltr' ? Math.abs(Math.floor(childRect.left) - Math.floor(containerRect.left) - 1) : undefined;
		const right =
			direction === 'rtl'
				? Math.abs(Math.floor(childRect.right) - Math.floor(containerRect.right) - 1)
				: undefined;

		// fixing a race-condition in which we got here before ref was rendered so its width is 0.
		const isRendered = width !== 0;
		if (isRendered) {
			setLeft(left);
			setRight(right);
			setWidth(width);
			setUpdateCount((old) => old + 1);
		}
		return isRendered;
	}

	function renderIcon(icon?: string | Element) {
		if (!icon) {
			return undefined;
		}
		if (fontAwesomeIcons){
			return icon;
		}
		if (typeof icon === 'string') {
			return (
				<div className="multiple-options-toggle-button-item-icon-container">
					<img className="icon-image" src={icon}/>
				</div>
			);
		}
		return <></>
	}

	function renderOption(option: OptionToggleButton, index: number) {
		const { name, icon, iconActive, key } = option;
		const isSelected = value === key;
		// @ts-ignore
		return (
			<div
				onClick={() => onChange(key)}
				className={getClasses('multiple-options-toggle-button-item', isSelected && 'selected')}
				ref={(ref) => (refs[index] = ref)}
				key={index}
			>
				{renderIcon(isSelected ? iconActive || icon : icon)}
				<span className={'multiple-options-toggle-button-item-text'}>{name}</span>
			</div>
		);
	}

	return (
		<div className={getClasses('multiple-options-toggle-button', customStyle && customStyle)} ref={containerRef}>
			<div className="multiple-options-toggle-button-items-container">{props.options.map(renderOption)}</div>
			<div
				className="background-circle"
				style={{ left, right, width, transitionDuration: updateCount <= 1 ? '0s' : undefined }}
			/>
		</div>
	);
}
