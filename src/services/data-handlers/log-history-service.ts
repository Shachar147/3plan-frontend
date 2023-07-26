import { TripActions } from '../../utils/interfaces';
import { formatFromISODateString } from '../../utils/time-utils';

const LogHistoryService = {
	getWas(historyRow: any) {
		switch (historyRow.action) {
			case TripActions.deletedCalendarEvent:
				const start = historyRow.actionParams.was.start
					? formatFromISODateString(historyRow.actionParams.was.start)
					: 'N/A';

				const end = historyRow.actionParams.was.end
					? formatFromISODateString(historyRow.actionParams.was.end)
					: 'N/A';
				return `${start} - ${end}`;
			default:
				return historyRow.actionParams.was;
		}
	},
};

export default LogHistoryService;
