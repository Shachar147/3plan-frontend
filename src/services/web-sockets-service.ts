import { EventStore } from '../stores/events-store';

export const WebSocketsService = {
	getWebSocketsChangedMessage: (eventStore: EventStore, newTripData: any): string[] => {
		// todo complete
		const changes: string[] = [];

		// calendar events
		if (JSON.stringify(eventStore.calendarEvents) !== JSON.stringify(newTripData.calendarEvents)) {
			// check if deleted
			// check if added
			// check if changed
		}

		// same for sidebar

		// same for categories

		return changes;
	},
};
