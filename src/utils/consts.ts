import {TriplanPriority} from "./enums";

export const DEFAULT_EVENT_DURATION = 1;

export const priorityToColor: Record<string, string> = {
    [TriplanPriority.must]: '#E06666FF',
    [TriplanPriority.maybe]: '#ffb752', // '#8E7CC3FF'
    [TriplanPriority.unset]: 'var(--gray)',
    [TriplanPriority.least]: 'var(--black)',
}