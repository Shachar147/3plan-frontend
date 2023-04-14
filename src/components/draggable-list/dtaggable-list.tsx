import React, { useContext, useState } from 'react';
import './draggable-list.scss';
import { eventStoreContext } from '../../stores/events-store';
import { addDays, formatDate, getEndDate } from '../../utils/time-utils';
import { CalendarEvent } from '../../utils/interfaces';
import { observer } from 'mobx-react';
import _ from 'lodash';
import ReactModalService from '../../services/react-modal-service';

const DraggableList = () => {
	const eventStore = useContext(eventStoreContext);
	const startDate = eventStore.customDateRange.start;
	const allDays = [];
	for (let i = 0; i < eventStore.tripTotalDaysNum; i++) {
		allDays.push({
			id: i,
			date: addDays(new Date(startDate), i),
			text: formatDate(addDays(new Date(startDate), i)),
		});
	}
	const [items, setItems] = useState(allDays);

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
		// Swap the positions of the dragged item and the drop target item
		// const updatedItems = [...items];
		const draggedItem = items[Number(draggedIndex)];
		// alert(`Replacing ${items[index].text} with ${draggedItem.text}`);

		ReactModalService.openSwitchDaysModal(eventStore, items[index], draggedItem);

		// await eventStore.setCalendarEvents(updatedEvents, false); // remove the false

		// updatedItems[Number(draggedIndex)] = updatedItems[index];
		// updatedItems[index] = draggedItem;
		//
		// setItems(updatedItems);
	};

	return (
		<div className="triplan-draggable-list-container flex-row align-items-center justify-content-center">
			<ul className="triplan-draggable-list">
				{items.map((item, index) => (
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
						<i className="fa fa-arrows" aria-hidden="true" />
						{/*<i className="fa fa-exchange" aria-hidden="true" />*/}
					</li>
				))}
			</ul>
		</div>
	);
};

export default observer(DraggableList);
