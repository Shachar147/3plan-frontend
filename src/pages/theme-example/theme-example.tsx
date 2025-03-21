import React, { useEffect, useState } from 'react';
import Button, { ButtonFlavor } from '../../components/common/button/button';
import CustomDatesSelector from '../../components/triplan-sidebar/custom-dates-selector/custom-dates-selector';
import { defaultDateRange } from '../../utils/defaults';
import { DateRangeFormatted } from '../../services/data-handlers/data-handler-base';
import './theme-example.scss';

const ThemeExample = () => {
	const [customDateRange, setCustomDateRange] = useState(defaultDateRange());

	const renderTitle = (title: string) => {
		return (
			<>
				<hr className="title-separator" />
				<div>
					<b></b>
					{title}
				</div>
				<hr className="title-separator" />
			</>
		);
	};

	const colors = [
		'white',
		'white-blue',
		'white-blue-darker',
		'gray',
		'dark-gray',
		'black',
		'blue',
		'light-blue',
		'dark-blue',
		'red',
	];

	useEffect(() => {
		// document.querySelector("body")!.classList.add("white-background");
	}, []);

	return (
		<div className="theme-example flex-col">
			{renderTitle('Colors')}
			<div className="flex-row gap-10 flex-flow-wrap color-container">
				{colors.sort().map((colorName) => (
					<div className="color-sample" style={{ color: `var(--${colorName})` }}>{colorName}</div>
				))}
			</div>
			{renderTitle('Buttons')}
			<div className="flex-row gap-10">
				<Button
					flavor={ButtonFlavor.primary}
					text={'Primary Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.secondary}
					text={'Secondary Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.secondary}
					text={'Secondary Button Black'}
					className="black"
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.link}
					text={'Link Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
			</div>
			<div className="flex-col gap-10">
				<Button
					icon={'fa-trash'}
					flavor={ButtonFlavor['movable-link']}
					text={'Movable Link Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
			</div>
			{renderTitle('Disabled Buttons')}
			<div className="flex-row gap-10">
				<Button
					flavor={ButtonFlavor.primary}
					disabled
					text={'Primary Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.secondary}
					disabled
					text={'Secondary Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.secondary}
					disabled
					text={'Secondary Button Black'}
					className="black"
					onClick={() => {
						alert('here!');
					}}
				/>
				<Button
					flavor={ButtonFlavor.link}
					disabled
					text={'Link Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
			</div>
			<div className="flex-col gap-10">
				<Button
					disabled
					icon={'fa-trash'}
					flavor={ButtonFlavor['movable-link']}
					text={'Movable Link Button'}
					onClick={() => {
						alert('here!');
					}}
				/>
			</div>
			{renderTitle('Custom Date Range')}
			<div className="flex-col gap-10">
				<CustomDatesSelector
					customDateRange={customDateRange}
					setCustomDateRange={(newRange: DateRangeFormatted) => {
						// @ts-ignore
						setCustomDateRange(newRange);
					}}
					TriplanCalendarRef={undefined}
				/>
			</div>
		</div>
	);
};

export default ThemeExample;
