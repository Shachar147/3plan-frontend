import React, { useContext, useEffect, useState } from 'react';
import './draggable-list.scss';
import { eventStoreContext } from '../../stores/events-store';
import { addDays, formatDate, getEndDate } from '../../utils/time-utils';
import { CalendarEvent } from '../../utils/interfaces';
import { observer } from 'mobx-react';
import _ from 'lodash';
import ReactModalService from '../../services/react-modal-service';
import TranslateService from '../../services/translate-service';

// list of cursor, each representing a day in our calendar
const DraggableList = () => {
	const eventStore = useContext(eventStoreContext);
	const startDate = eventStore.currentStart!; // eventStore.customDateRange.start;
	const allDays = [];
	// for (let i = 0; i < eventStore.tripTotalDaysNum; i++) {
	for (let i = 0; i < eventStore.tripTotalCurrentDaysNum; i++) {
		allDays.push({
			id: i,
			date: addDays(new Date(startDate), i),
			text: formatDate(addDays(new Date(startDate), i)),
		});
	}
	const [items, setItems] = useState(allDays);

	useEffect(() => {
		const allDays = [];
		// for (let i = 0; i < eventStore.tripTotalDaysNum; i++) {
		for (let i = 0; i < eventStore.tripTotalCurrentDaysNum; i++) {
			allDays.push({
				id: i,
				date: addDays(new Date(startDate), i),
				text: formatDate(addDays(new Date(startDate), i)),
			});
		}
		setItems(allDays);
	}, [eventStore.currentEnd, eventStore.currentStart]);

	const handleDragStart = (event: React.DragEvent<HTMLElement>, index: number) => {
		event.dataTransfer.setData('text/plain', index.toString());

		// Set the drag effect to move
		event.dataTransfer.effectAllowed = 'move';

		// Set the cursor to 'move'
		event.dataTransfer.dropEffect = 'move';
	};

	const handleDragOver = (event: React.DragEvent<HTMLElement>, index: number) => {
		event.preventDefault();
		// @ts-ignore
		event.target.style.backgroundColor = '#eee'; // Change background color of second element
	};

	const handleDragLeave = (event: React.DragEvent<HTMLElement>, index: number) => {
		// Handle drag leave event
		// @ts-ignore
		event.target.style.backgroundColor = ''; // Reset background color of second element
	};

	const handleDrop = async (event: React.DragEvent<HTMLElement>, index: number) => {
		// @ts-ignore
		event.target.style.backgroundColor = ''; // Reset background color of second element

		// Prevent default behavior
		event.preventDefault();

		// Get the index of the dragged item from the dataTransfer object
		const draggedIndex = event.dataTransfer.getData('text/plain');

		// If the dragged item is dropped on itself, do nothing
		if (draggedIndex === index.toString()) {
			return;
		}
		const draggedItem = items[Number(draggedIndex)];

		ReactModalService.openSwitchDaysModal(eventStore, items[index], draggedItem);
	};

	if (!startDate) {
		return null;
	}

	function isInRange(date: Date) {
		return date.getTime() <= eventStore.activeEnd!.getTime() && date.getTime() >= eventStore.activeStart!.getTime();
	}

	return (
		<div
			className="triplan-draggable-list-container flex-row align-items-center justify-content-center"
			key={`triplan-draggable-list-container-${eventStore.activeStart!}`}
		>
			<ul className="triplan-draggable-list">
				{items.map((item, index) =>
					isInRange(item.date) ? (
						<li
							key={item.id}
							className="triplan-draggable-list-item"
							draggable
							onDragStart={(event) => handleDragStart(event, index)}
							onDragOver={(event) => handleDragOver(event, index)}
							onDragLeave={(event) => handleDragLeave(event, index)}
							onDrop={(event) => handleDrop(event, index)}
						>
							{/*{item.text}*/}
							<i
								className="fa fa-arrows"
								aria-hidden="true"
								title={TranslateService.translate(eventStore, 'DRAG_TO_SWITCH_DAYS')}
							/>
							{/*<img src={'/images/switch-days.png'} width={50} />*/}
							{/*<i className="fa fa-exchange" aria-hidden="true" />*/}
						</li>
					) : (
						<li className={'triplan-draggable-list-item disabled'} />
					)
				)}
			</ul>
		</div>
	);
};

export default observer(DraggableList);
