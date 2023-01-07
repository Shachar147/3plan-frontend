import { TriplanPriority } from './enums';

export const DEFAULT_EVENT_DURATION = 1;

export const priorityToColor: Record<string, string> = {
	[TriplanPriority.must]: '#E06666FF',
	[TriplanPriority.maybe]: '#ffb752', // '#8E7CC3FF'
	[TriplanPriority.unset]: 'var(--gray)',
	[TriplanPriority.least]: 'var(--black)',
};

export const priorityToMapColor: Record<string, string> = {
	[TriplanPriority.must]: '#FF5252',
	[TriplanPriority.maybe]: '#ffb752', // '#8E7CC3FF'
	[TriplanPriority.unset]: '#b4b4b4',
	[TriplanPriority.least]: '#000000',
};

export const LOGIN_DELAY: number = 300; // to be able to see the loader
