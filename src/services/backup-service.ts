import { EventStore } from '../stores/events-store';
import { CalendarEvent, SidebarEvent, TriPlanCategory } from '../utils/interfaces';
import { upsertTripProps } from './data-handlers/db-service';
import TranslateService from './translate-service';
import { sanitizeForFilename } from '../utils/string-sanitizer';
import { TriplanEventPreferredTime, TriplanPriority } from '../utils/enums';

/**
 * Service for backing up trips in different formats
 */
export class BackupService {
	/**
	 * Download a file with the given content
	 */
	private static downloadFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	/**
	 * Export trip as JSON in the format compatible with trip creation API
	 */
	static exportAsJSON(eventStore: EventStore): void {
		const tripData: upsertTripProps = {
			name: eventStore.tripName || 'Untitled Trip',
			dateRange: eventStore.customDateRange,
			categories: eventStore.categories,
			calendarEvents: eventStore.calendarEvents,
			sidebarEvents: eventStore.sidebarEvents,
			allEvents: eventStore.allEvents,
			calendarLocale: eventStore.calendarLocalCode,
			destinations: eventStore.destinations,
		};

		const jsonContent = JSON.stringify(tripData, null, 2);
		const filename = `${sanitizeForFilename(tripData.name)}_backup.json`;

		this.downloadFile(filename, jsonContent, 'application/json');
	}

	/**
	 * Export activities as CSV in the format compatible with import functionality
	 */
	static exportAsCSV(eventStore: EventStore): void {
		// Get all events from both calendar and sidebar
		const allEvents: Array<CalendarEvent | SidebarEvent> = [
			...eventStore.calendarEvents,
			...Object.values(eventStore.sidebarEvents).flat(),
		];

		if (allEvents.length === 0) {
			console.warn('No events to export');
			return;
		}

		// Create header row using the same keys as the import template
		const header = [
			TranslateService.translate(eventStore, 'TEMPLATE.ICON'),
			TranslateService.translate(eventStore, 'TEMPLATE.TITLE'),
			TranslateService.translate(eventStore, 'TEMPLATE.DESCRIPTION'),
			TranslateService.translate(eventStore, 'TEMPLATE.DURATION'),
			TranslateService.translate(eventStore, 'TEMPLATE.CATEGORY'),
			TranslateService.translate(eventStore, 'TEMPLATE.PRIORITY'),
			TranslateService.translate(eventStore, 'TEMPLATE.PREFERRED_TIME'),
		];

		// Create data rows
		const rows = allEvents.map((event) => {
			const categoryName = this.getCategoryName(event.category, eventStore.categories);
			const priorityName = this.getPriorityName(eventStore, event.priority);
			const preferredTimeName = this.getPreferredTimeName(eventStore, event.preferredTime);

			const duration = event.duration == '00:00' ? '24:00' : event.duration;

			return [
				event.icon || '',
				event.title || '',
				event.description || '',
				duration || '01:00',
				categoryName,
				priorityName,
				preferredTimeName,
			];
		});

		// Escape CSV values
		const escapeCSVValue = (value: string): string => {
			if (value.includes(',') || value.includes('"') || value.includes('\n')) {
				return `"${value.replace(/"/g, '""')}"`;
			}
			return value;
		};

		// Convert to CSV format
		const csvContent = [
			header.map(escapeCSVValue).join(','),
			...rows.map((row) => row.map(escapeCSVValue).join(',')),
		].join('\n');

		const filename = `${sanitizeForFilename(eventStore.tripName || 'trip')}_activities.csv`;

		this.downloadFile(filename, csvContent, 'text/csv');
	}

	/**
	 * Get category name by ID
	 */
	private static getCategoryName(categoryId: any, categories: TriPlanCategory[]): string {
		if (!categoryId) return '';

		const category = categories.find((cat) => cat.id.toString() === categoryId.toString());
		return category ? category.title : categoryId.toString();
	}

	/**
	 * Get priority name by value
	 */
	private static getPriorityName(eventStore: EventStore, priority: any): string {
		if (!priority) return '';
		return TranslateService.translate(eventStore, TriplanPriority[priority]);
	}

	/**
	 * Get preferred time name by value
	 */
	private static getPreferredTimeName(eventStore: EventStore, preferredTime: any): string {
		if (!preferredTime) return '';
		return TranslateService.translate(eventStore, TriplanEventPreferredTime[preferredTime]);
	}
}
