import React from 'react';
import InfiniteCalendar from 'react-infinite-calendar';
import 'react-infinite-calendar/styles.css';
import './triplan-infinite-calendar.scss';

const TriplanInfiniteCalendar = ({ start, end }: { start: string; end: string }) => {
	const theme = {
		selectionColor: '#37b5ff',
		textColor: {
			default: '#333',
			active: '#fff',
		},
		weekdayColor: '#37b5ff',
		headerColor: '#37b5ff',
	};

	return (
		<InfiniteCalendar
			width={'100%'}
			height={220}
			selected={start}
			// min={start}
			// max={end}
			// minDate={start}
			// maxDate={end}
			theme={theme}
			displayOptions={{
				showHeader: false,
				showTodayHelper: false,
				// showOverlay: false,
			}}
		/>
	);
};

export default TriplanInfiniteCalendar;
