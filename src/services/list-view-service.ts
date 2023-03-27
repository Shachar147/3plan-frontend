import { EventStore } from '../stores/events-store';
import moment from 'moment/moment';
import TranslateService from './translate-service';
import { EventInput } from '@fullcalendar/react';
import { getEventDueDate, toDate } from '../utils/time-utils';
import { CalendarEvent, LocationData } from '../utils/interfaces';
import { runInAction } from 'mobx';
import { GoogleTravelMode, ListViewSummaryMode, TriplanPriority } from '../utils/enums';
import { priorityToColor } from '../utils/consts';
import { BuildEventUrl, getCoordinatesRangeKey, isMatching, padTo2Digits, toDistanceString } from '../utils/utils';
import { getEventDivHtml } from '../utils/ui-utils';
import _ from 'lodash';

const ListViewService = {
	_getDayName: (dateStr: string, locale: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString(locale, { weekday: 'long' });
	},
	_formatTime: (timeString: string) => moment(timeString, ['h:mm A']).format('HH:mm'),
	_randomElement: (array: any[]) => array[Math.floor(Math.random() * array.length)],
	_formatDescription: (description: string) => {
		if (!description) return description;
		return description.replaceAll('&#10;', '<br/>').replaceAll('\n', '<br/>').replaceAll('<br/><br/>', '<br/>');
	},
	_getEventFromEventRow: (eventStore: EventStore, eventRow: string) => {
		const regex = /data-eventId="(\d*)/g;
		const results = eventRow.match(regex);
		if (results) {
			const eventId = results[0].replace('data-eventId="', '');
			return eventStore.calendarEvents.find((e) => e.id === eventId)!;
		}
		return undefined;
	},
	_findLastIndex: (arr: string[], search: string) => {
		let lastIndex = -1;
		arr.forEach((x, index) => {
			if (x.indexOf(search) !== -1) {
				lastIndex = index;
			}
		});
		return lastIndex;
	},
	_handleOrAndIndentRules: (
		eventStore: EventStore,
		summaryPerDay: Record<string, string[]>
	): Record<string, string[]> => {
		Object.keys(summaryPerDay).forEach((dayTitle) => {
			const parents: Record<string, string> = {};
			const indentTextsParents = summaryPerDay[dayTitle]
				.filter((x) => x.indexOf('indent-or-group') === -1 && x.indexOf('or-group') !== -1)
				.map((x) => {
					const regex = /or-group-(\d*)/g;
					const results = x.match(regex);
					if (results) {
						parents[results[0]] = x;
						return results[0];
					}
					return undefined;
				})
				.filter((x) => x != undefined);

			const indentTexts = summaryPerDay[dayTitle].filter((x) => x.indexOf('indent-or-group') !== -1);
			const indentOrGroupKeys: Record<string, string[]> = {}; // for or group that have also indent sub items
			let error = false;
			indentTexts.forEach((indentText) => {
				const regex = /or-group-(\d*)/g;
				const results = indentText.match(regex);
				if (results) {
					const orGroupKey = results[0].toString();
					indentOrGroupKeys[orGroupKey] = indentOrGroupKeys[orGroupKey] || [];
					indentOrGroupKeys[orGroupKey].push(indentText);
				} else {
					error = true;
					console.error('error! or-group regex failed!');
				}
			});

			const changeIndentToOr: Record<string, string[]> = {};
			Object.keys(indentOrGroupKeys).forEach((key) => {
				let start = 0,
					end = 0,
					isOk = true;
				indentOrGroupKeys[key].forEach((x) => {
					const event = ListViewService._getEventFromEventRow(eventStore, x);
					if (event) {
						if (start === 0) {
							start = toDate(event.start).getTime();
							end = toDate(event.end).getTime();
						} else {
							const _start = toDate(event.start).getTime();
							const _end = toDate(event.end).getTime();
							if (_start === end && _end > end) {
								end = _end;
							} else {
								isOk = false;
							}
						}
						// start = Math.min(toDate(event!.start).getTime(), start);
						// end = Math.max(toDate(event!.end).getTime(), end);
						// console.log(event.title, toDate(event.start), toDate(event.end));
					}
				});

				if (isOk) {
					const parentEvent = ListViewService._getEventFromEventRow(eventStore, parents[key])!;
					const pStart = toDate(parentEvent.start).getTime();
					const pEnd = toDate(parentEvent.end).getTime();

					if (pStart === start && pEnd === end) {
						const startTime = ListViewService._formatTime(new Date(pStart).toLocaleTimeString());
						const endTime = ListViewService._formatTime(getEventDueDate(parentEvent).toLocaleTimeString());

						const { orBackgroundStyle } = ListViewService._initSummaryConfiguration();
						const title = `<span class="eventRow ${key}" style="${orBackgroundStyle}">${startTime} - ${endTime} ${TranslateService.translate(
							eventStore,
							'THE_FOLLOWING_EVENTS'
						)}:</span>`;

						changeIndentToOr[key] = [title, ...indentOrGroupKeys[key]];
					}
				}
			});

			if (!error) {
				summaryPerDay[dayTitle] = summaryPerDay[dayTitle]
					.map((row) => {
						const regex = /or-group-(\d*)/g;
						const results = row.match(regex);
						if (results) {
							const orGroupKey = results[0].toString();

							if (indentOrGroupKeys[orGroupKey]) {
								if (row.indexOf('indent-or-group') !== -1) {
									if (indentTextsParents.indexOf(orGroupKey) === -1) {
										return row;
									}
									return '---';
								} else if (Object.keys(changeIndentToOr).indexOf(orGroupKey) !== -1) {
									return row;
								}

								return row + '</br>' + indentOrGroupKeys[orGroupKey].join('<br/>');
							}
						}
						return row;
					})
					.filter((x) => x != '---');

				// remove leading ORs
				summaryPerDay[dayTitle] = summaryPerDay[dayTitle]
					.map((x, index) => {
						if (
							x.indexOf('or-row') !== -1 &&
							index + 1 < summaryPerDay[dayTitle].length &&
							summaryPerDay[dayTitle][index + 1] === ''
						) {
							return '---';
						}
						return x;
					})
					.filter((x) => x != '---');

				// handle indents that should be transformed to ORs
				Object.keys(changeIndentToOr).forEach((groupKey) => {
					const idx = ListViewService._findLastIndex(summaryPerDay[dayTitle], groupKey);
					if (idx === -1) {
						console.error('error!!!');
					} else {
						summaryPerDay[dayTitle][idx] += [
							'',
							ListViewService._renderOrLine(eventStore),
							...changeIndentToOr[groupKey],
						].join('<br/>');
					}
				});
			}
		});
		return summaryPerDay;
	},
	_initTranslateKeys: (eventStore: EventStore) => {
		const todoComplete = TranslateService.translate(eventStore, 'TRIP_SUMMARY.TODO_COMPLETE');
		const ordered = TranslateService.translate(eventStore, 'TRIP_SUMMARY.ORDERED');

		const startPrefix = TranslateService.translate(eventStore, 'TRIP_SUMMARY.START_PREFIX');
		const lastPrefix = TranslateService.translate(eventStore, 'TRIP_SUMMARY.LAST_PREFIX');
		const middlePrefixes = [
			TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX1'),
			TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX2'),
			TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX3'),
			TranslateService.translate(eventStore, 'TRIP_SUMMARY.MIDDLE_PREFIX4'),
			'',
			'',
			'',
			'',
			'',
		];
		const or = TranslateService.translate(eventStore, 'TRIP_SUMMARY.OR');
		const tripSummaryTitle =
			TranslateService.translate(eventStore, 'TRIP_SUMMARY.TITLE') + ' - ' + eventStore.tripName;

		// if we're on no description mode, do not show also prefixes.
		if (eventStore.listViewSummaryMode === ListViewSummaryMode.noDescriptions) {
			return {
				todoComplete,
				ordered,
				startPrefix: '',
				lastPrefix: '',
				middlePrefixes: [''],
				or,
				tripSummaryTitle,
			};
		}

		return {
			todoComplete,
			ordered,
			startPrefix,
			lastPrefix,
			middlePrefixes,
			or,
			tripSummaryTitle,
		};
	},
	_initSummaryConfiguration: () => {
		const taskKeywords = [
			'לברר',
			'לבדוק',
			'להזמין',
			'להשלים',
			'צריך לעשות',
			'צריך להחליט',
			'צריך לנסות',
			'need to decide',
			'todo',
			'need to check',
			'to order',
			'to book',
			'to reserve',
		];

		const noOrderKeywords = [
			'לברר',
			'לבדוק',
			'להשלים',
			'צריך להחליט',
			'צריך לנסות',
			'need to decide',
			'todo',
			'need to check',
		];

		const orderedKeywords = ['הוזמן', 'הזמנתי', 'ordered', 'booked', 'reserved'];

		const notesColor = '#52a4ff'; // "#ff5252";
		const todoCompleteColor = '#ff5252';
		const orBackgroundStyle = '; background-color: #f2f2f2; padding-block: 2.5px;';

		const orderedColor = '#90d2ff';

		const showIcons = true;

		return {
			taskKeywords,
			orderedKeywords,
			notesColor,
			todoCompleteColor,
			orderedColor,
			showIcons,
			noOrderKeywords,
			orBackgroundStyle,
		};
	},
	_sortEvents: (calendarEvents: CalendarEvent[]) => {
		return calendarEvents.sort((a, b) => {
			const aTime = toDate(a.start).getTime();
			const bTime = toDate(b.start).getTime();
			if (aTime === bTime) {
				const aEndTime = toDate(a.end).getTime();
				const bEndTime = toDate(b.end).getTime();
				return bEndTime - aEndTime;
			}
			return aTime - bTime;
		});
	},
	_getEventDayTitle: (eventStore: EventStore, event: any) => {
		const dtStartName = ListViewService._getDayName(event.start!.toString(), eventStore.calendarLocalCode);
		const parts = toDate(event.start).toLocaleDateString().replace(/\//gi, '-').split('-');
		const dtStart = [padTo2Digits(Number(parts[1])), padTo2Digits(Number(parts[0])), parts[2]].join('/');
		const dayTitle = `${dtStartName} - ${dtStart}`;
		return dayTitle;
	},
	_buildCalendarEventsPerDay: (eventStore: EventStore, calendarEvents: CalendarEvent[]) => {
		const calendarEventsPerDay: Record<string, EventInput[]> = {};

		let lastDayTitle = '';
		let lastStart = 0;
		let lastEnd = 0;

		// or item is an empty item.
		// when we'll build the summary itself, we'll consider empty items as OR.
		const OR_ITEM_INDICATION = {};

		const sortedEvents = ListViewService._sortEvents(calendarEvents);
		sortedEvents.forEach((event, index) => {
			// clone event
			const clonedEvent = _.cloneDeep(event);

			// day title
			const dayTitle = ListViewService._getEventDayTitle(eventStore, clonedEvent);

			// init calendar events per day
			calendarEventsPerDay[dayTitle] = calendarEventsPerDay[dayTitle] || [];

			// push OR indication if needed
			const stillSameDay = lastDayTitle === dayTitle;
			const sameStart = toDate(event.start).getTime() === lastStart;
			const sameEnd = toDate(event.end).getTime() === lastEnd;
			if (stillSameDay && sameStart && sameEnd) {
				calendarEventsPerDay[dayTitle].push(OR_ITEM_INDICATION);
			}

			// push our cloned event
			calendarEventsPerDay[dayTitle].push(clonedEvent);

			// deal with items that aren't exactly on the same times but collide with each other
			// for example:
			// current item 06:00 - 08:00
			// next item 07:00 - 09:00
			// on that case, we can't do both items and we need to choose. therefore we push the OR indication
			const isNotLastItem = index + 1 < sortedEvents.length;
			const currentItemEndsAfterNextItemStarts =
				isNotLastItem && toDate(event.end).getTime() > toDate(sortedEvents[index + 1].start).getTime();
			const currentItemEndsBeforeNextItemEnds =
				isNotLastItem && toDate(event.end).getTime() < toDate(sortedEvents[index + 1].end).getTime();
			if (isNotLastItem && currentItemEndsAfterNextItemStarts && currentItemEndsBeforeNextItemEnds) {
				calendarEventsPerDay[dayTitle].push(OR_ITEM_INDICATION);
			}

			// keep current event info to "last" variables.
			lastDayTitle = dayTitle;
			lastStart = toDate(event.start).getTime();
			lastEnd = getEventDueDate(event).getTime();
		});

		// remove OR indications if they appear on the end of the day
		Object.keys(calendarEventsPerDay).forEach((day) => {
			const eventsInDay = calendarEventsPerDay[day];
			if (Object.keys(eventsInDay[eventsInDay.length - 1]).length === 0) {
				eventsInDay.pop();
			}
			calendarEventsPerDay[day] = eventsInDay;
		});

		return calendarEventsPerDay;
	},
	_renderOrLine: (eventStore: EventStore) => {
		const { or } = ListViewService._initTranslateKeys(eventStore);
		const { orBackgroundStyle } = ListViewService._initSummaryConfiguration();
		return `<span class="or-row" style="padding-inline-start: 20px; font-weight:bold ${orBackgroundStyle}"><u>${or}</u></span>`;
	},
	_getSubitemIcon: (eventStore: EventStore) => {
		return eventStore.getCurrentDirection() === 'rtl' ? '↵' : '↳';
	},
	_buildSummaryPerDay: (eventStore: EventStore, calendarEventsPerDay: Record<string, EventInput>) => {
		const highlightsPerDay: Record<string, string> = {};

		const { todoComplete, ordered, startPrefix, lastPrefix, middlePrefixes } =
			ListViewService._initTranslateKeys(eventStore);

		const {
			taskKeywords,
			orderedKeywords,
			noOrderKeywords,
			notesColor,
			todoCompleteColor,
			orderedColor,
			showIcons,
			orBackgroundStyle,
		} = ListViewService._initSummaryConfiguration();

		let summaryPerDay: Record<string, string[]> = {};

		Object.keys(calendarEventsPerDay).forEach((dayTitle) => {
			const events = calendarEventsPerDay[dayTitle];
			const eventDistanceKey: Record<number, string> = {};

			let prevLocation: LocationData | undefined;
			let prevLocationBackup: LocationData | undefined;

			let highlightEvents = events
				.filter(
					(x: EventInput) =>
						x.priority && (x.priority == TriplanPriority.must || x.priority == TriplanPriority.high)
				)
				.map((x: EventInput) => x.title!.split('-')[0].split('?')[0].trim());
			// @ts-ignore
			highlightEvents = [...new Set(highlightEvents)];
			highlightsPerDay[dayTitle] = highlightEvents.join(', ');

			let previousLineWasOr = false;
			let previousLineWasIndent = false;
			let previousEndTime = 0;
			let previousStartTime = 0;
			let prevEventTitle: string;
			let counter = 0;
			let lastGroupNum = 800;
			prevLocation = undefined;
			events.forEach((event: EventInput, index: number) => {
				summaryPerDay[dayTitle] = summaryPerDay[dayTitle] || [];

				if (Object.keys(event).length === 0) {
					summaryPerDay[dayTitle].push(ListViewService._renderOrLine(eventStore));
					previousLineWasOr = true;
					return;
				}

				const nextLineIsOr = index + 1 < events.length && Object.keys(events[index + 1]).length === 0;

				// if ((previousLineWasOr && !nextLineIsOr) && summaryPerDay[dayTitle][-1] !== ''){
				//     summaryPerDay[dayTitle].push(``);
				// }

				if (event.allDay) {
					summaryPerDay[dayTitle].push(
						`<span style="color:${notesColor}; font-size:10px; font-weight:bold;">${ListViewService._formatDescription(
							event.description
						)}</span>`
					);
					return;
				}

				const startTime = ListViewService._formatTime(toDate(event.start!).toLocaleTimeString());
				const endTime = ListViewService._formatTime(getEventDueDate(event).toLocaleTimeString());
				const title = event.title;

				const priority = event.priority;
				const color =
					[
						TriplanPriority.must.toString(),
						TriplanPriority.high.toString(),
						TriplanPriority.maybe.toString(),
					].indexOf(priority) !== -1 && Object.keys(priorityToColor).includes(priority)
						? priorityToColor[priority]
						: 'inherit';
				const fontWeight = color !== 'inherit' ? 'bold' : 'normal';

				const icon = showIcons ? event.icon || eventStore.categoriesIcons[event.category] || '' : '';
				const iconIndent = icon ? ' ' : '';

				const subItemIcon = ListViewService._getSubitemIcon(eventStore);
				const previousAndCurrentExactTimes =
					previousEndTime === toDate(event.end).getTime() &&
					previousStartTime === toDate(event.start).getTime();
				const previousEndTimeAfterCurrentStart = previousEndTime > toDate(event.start).getTime();
				const previousEndTimeAfterCurrentEnd = previousEndTime >= toDate(event.end).getTime();
				const indent =
					previousEndTimeAfterCurrentStart && previousEndTimeAfterCurrentEnd && !previousAndCurrentExactTimes
						? subItemIcon + ' '
						: '';

				if (indent !== '' && summaryPerDay[dayTitle][summaryPerDay[dayTitle].length - 1] == '') {
					previousLineWasOr = true;
					summaryPerDay[dayTitle].pop();
					lastGroupNum--;
					prevLocation = prevLocationBackup;
					prevLocationBackup = undefined;
				}

				if (!indent) {
					previousEndTime = toDate(event.end!).getTime();
					previousStartTime = toDate(event.start!).getTime();
				}

				const prefix =
					previousLineWasOr || nextLineIsOr || indent
						? ''
						: counter === 0
						? startPrefix
						: index === events.length - 1
						? lastPrefix
						: `${ListViewService._randomElement(middlePrefixes)} `;

				const description =
					event.description && eventStore.shouldRenderDescriptionOnListView
						? `<br><span style="opacity:0;">${indent}</span><span style="color:#999999">${ListViewService._formatDescription(
								event.description
						  )}</span>`
						: '';

				let rowStyle = indent ? 'color: #999999' : 'color:black';
				let rowClass = '';

				let firstRowInGroup = false;
				let backgroundStyle = '';
				// if (previousLineWasOr || (index+1 < events.length && Object.keys(events[index+1]).length === 0)) {
				if (previousLineWasOr || nextLineIsOr) {
					backgroundStyle = orBackgroundStyle;
					rowStyle += backgroundStyle;
					if (indent) {
						rowClass += ` indent-or-group-${lastGroupNum}`;
					} else {
						rowClass += ` or-group-${lastGroupNum}`;
					}
					if (nextLineIsOr && !previousLineWasOr) {
						// firstRowInGroup = true;
						summaryPerDay[dayTitle].push(
							`<span style="background-color:white; line-height:33px; text-decoration:underline;">
                                ${TranslateService.translate(eventStore, 'AND_THEN_ONE_OF_THE_FOLLOWING')}:
                            </span>`
						);
					}
				}

				let taskIndication = taskKeywords.find(
					(x) =>
						title!.toLowerCase().indexOf(x.toLowerCase()) !== -1 ||
						description?.toLowerCase().indexOf(x.toLowerCase()) !== -1
				)
					? `<span style="font-size: 22px; padding-inline: 5px; color:${todoCompleteColor}; font-weight:bold;">&nbsp;<u>${todoComplete}</u></span>`
					: '';

				const orderedIndication = orderedKeywords.find(
					(x) =>
						title!.toLowerCase().indexOf(x.toLowerCase()) !== -1 ||
						description?.toLowerCase().indexOf(x.toLowerCase()) !== -1
				)
					? `<span style="font-size: 22px; padding-inline: 5px; color:${orderedColor}; font-weight:bold;">&nbsp;<u>${ordered}</u></span>`
					: '';

				// if there's task indication (todo complete), and ordered, and if we check if there's a task, but without 'order' keywords there's no results - we do not need to show task indication since it was about 'need to order'
				if (
					taskIndication &&
					orderedIndication &&
					!noOrderKeywords.find(
						(x) =>
							title!.toLowerCase().indexOf(x.toLowerCase()) !== -1 ||
							description?.toLowerCase().indexOf(x.toLowerCase()) !== -1
					)
				) {
					taskIndication = '';
				}

				let distanceKey = Object.keys(eventDistanceKey).includes(event.id!)
					? eventDistanceKey[Number(event.id!)]
					: undefined;

				// test
				let travelMode = eventStore.travelMode;
				if (
					distanceKey &&
					eventStore.distanceResults.has(distanceKey) &&
					eventStore.distanceResults.has(distanceKey.replace('DRIVING', 'WALKING'))
				) {
					if (
						eventStore.distanceResults.get(distanceKey)!.duration_value! >
							eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!
								.duration_value! ||
						eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!.duration_value! <
							10 * 60
					) {
						distanceKey = distanceKey.replace('DRIVING', 'WALKING');
						travelMode = GoogleTravelMode.WALKING;
					}
				}

				let distanceToNextEvent = distanceKey
					? eventStore.distanceResults.has(distanceKey)
						? toDistanceString(eventStore, eventStore.distanceResults.get(distanceKey)!, travelMode)
						: TranslateService.translate(eventStore, 'CALCULATING_DISTANCE')
					: '';

				// disable google maps distance calc for now
				distanceToNextEvent = '';

				// const from = previousLineWasOr ? `${TranslateService.translate(eventStore, 'FROM')} ${prevEventTitle} ` : "";

				if (!prevLocation) {
					distanceToNextEvent = '';
				}

				if (distanceToNextEvent !== '') {
					const arrow = eventStore.getCurrentDirection() === 'rtl' ? '✈' : '✈';
					const distanceColor =
						distanceToNextEvent.indexOf(
							TranslateService.translate(eventStore, 'DISTANCE.ERROR.NO_POSSIBLE_WAY')
						) !== -1
							? '#ff5252'
							: 'rgba(55,181,255,0.6)';
					const firstRowClass = firstRowInGroup
						? ` class="first-row-in-group ${rowClass}"`
						: ` class="${rowClass}"`;
					const lineBefore = firstRowInGroup ? '<br/>' : '';

					const url = BuildEventUrl(event.location);
					const urlBlock = `<span><a href="${url}" target="_blank" style="color: inherit">${
						event.location.address.split(' - ')[0]
					}</a></span>`;

					distanceToNextEvent = `${lineBefore}<span style="color: ${distanceColor}; ${backgroundStyle}"${firstRowClass}>
                                ${arrow}
                                ${distanceToNextEvent} ${TranslateService.translate(eventStore, 'FROM')}${
						prevLocation?.address.split(' - ')[0]
					} ${TranslateService.translate(eventStore, 'TO')}${urlBlock}
                            </span>`;
				}

				if (
					previousLineWasIndent &&
					indent === '' &&
					!previousLineWasOr &&
					summaryPerDay[dayTitle][summaryPerDay[dayTitle].length - 1] !== ''
				) {
					summaryPerDay[dayTitle].push(``);
				}

				// distanceToNextEvent = doNotShowImpossibleToGetThereDistanceErrorOnFlights(distanceToNextEvent, title!, prevEventTitle);

				if (distanceToNextEvent && distanceToNextEvent !== '') {
					summaryPerDay[dayTitle].push(distanceToNextEvent);
				}

				if (distanceToNextEvent === '' && firstRowInGroup) {
					rowClass += ' first-row-in-group';
					summaryPerDay[dayTitle].push('');
				}

				summaryPerDay[dayTitle].push(`
                    <span class="eventRow${rowClass}" style="${rowStyle}" data-eventId="${event.id}">
                        ${icon}${iconIndent}${indent}${startTime} - ${endTime} ${prefix}<span style="color: ${color}; font-weight:${fontWeight};">${title}${taskIndication}${orderedIndication}</span>${description}
                    </span>
                `);

				if (
					previousLineWasOr &&
					!nextLineIsOr &&
					summaryPerDay[dayTitle][summaryPerDay[dayTitle].length - 1] !== ''
				) {
					summaryPerDay[dayTitle].push(``);
					lastGroupNum++;
					prevLocationBackup = prevLocation;
					prevLocation = undefined;
				}

				if (!previousLineWasOr && !nextLineIsOr) {
					prevLocation = event.location;
				}

				previousLineWasIndent = indent !== '';
				previousLineWasOr = false;
				counter++;
				prevEventTitle = title!;
			});
		});

		return { summaryPerDay, highlightsPerDay };
	},
	_addReachingNextDestinationInstructions: (
		eventStore: EventStore,
		summaryPerDay: Record<string, string[]>
	): Record<string, string[]> => {
		const orBackgroundStyle = '; background-color: #f2f2f2; padding-block: 2.5px;';

		// @ts-ignore
		window.routes = [];

		// --- functions -----------------------------------------------
		interface ListViewRowDetail {
			or: boolean;
			indent: boolean;
			differentOrGroup: boolean;
			index: number;
			orGroupNum?: string;
			event: EventInput;
		}
		const buildRowsDetails = (htmlRows: string[]): ListViewRowDetail[] => {
			const orGroupsSeparator = TranslateService.translate(eventStore, 'AND_THEN_ONE_OF_THE_FOLLOWING');
			let differentOrGroup = false;

			return htmlRows
				.map((x, index) => {
					const indentIcon = ListViewService._getSubitemIcon(eventStore);
					const indent = x.indexOf(indentIcon) !== -1;

					const regex = /or-group-(\d*)/g;
					const results = x.match(regex);
					const or = !!results && !indent;
					const orGroupNum = results ? results[0] : undefined;

					const event = ListViewService._getEventFromEventRow(eventStore, x);

					const returnValue = { or, indent, differentOrGroup, index, orGroupNum, event } as ListViewRowDetail;

					differentOrGroup = x.indexOf(orGroupsSeparator) !== -1;

					if (!event) return {} as ListViewRowDetail;
					return returnValue;
				})
				.filter((x) => Object.keys(x).length > 0);
		};

		const calculateDistance = (eventStore: EventStore, prevLocation: LocationData, thisLocation: LocationData) => {
			const prevCoordinate = {
				lng: prevLocation.longitude!,
				lat: prevLocation.latitude!,
			};
			const thisCoordinate = {
				lng: thisLocation.longitude!,
				lat: thisLocation.latitude!,
			};

			const travelModes = [GoogleTravelMode.DRIVING];

			let distanceKey: string = '';
			travelModes.forEach((travelMode) => {
				const key = getCoordinatesRangeKey(travelMode, prevCoordinate, thisCoordinate);
				if (!eventStore.distanceResults.has(key)) {
					runInAction(() => {
						console.log(
							`checking distance between`,
							prevLocation?.address,
							` and `,
							thisLocation.address,
							prevCoordinate,
							thisCoordinate,
							`(${travelMode.toString()})`
						);
						eventStore.calculatingDistance = eventStore.calculatingDistance + 1;

						// @ts-ignore
						window.routes.push({
							travelMode,
							prevCoordinate,
							thisCoordinate,
							from: prevLocation?.address,
							to: thisLocation.address,
						});

						// @ts-ignore
						window.calculateMatrixDistance(travelMode, prevCoordinate, thisCoordinate);
					});
				} else {
					if (prevLocation && thisLocation) {
						// console.log(`already have distance between`, prevLocation.address, ` and `, thisLocation.address, `(${travelMode.toString()})`);
					}
				}
				if (distanceKey === '') distanceKey = key;
			});

			let travelMode = GoogleTravelMode.DRIVING;
			if (
				distanceKey &&
				eventStore.distanceResults.has(distanceKey) &&
				eventStore.distanceResults.has(distanceKey.replace('DRIVING', 'WALKING'))
			) {
				if (
					eventStore.distanceResults.get(distanceKey)!.duration_value! >
						eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!.duration_value! ||
					eventStore.distanceResults.get(distanceKey.replace('DRIVING', 'WALKING'))!.duration_value! < 10 * 60
				) {
					distanceKey = distanceKey.replace('DRIVING', 'WALKING');
					travelMode = GoogleTravelMode.WALKING;
				}
			}

			let distanceToNextEvent = distanceKey
				? eventStore.distanceResults.has(distanceKey)
					? toDistanceString(eventStore, eventStore.distanceResults.get(distanceKey)!, travelMode)
					: TranslateService.translate(eventStore, 'CALCULATING_DISTANCE')
				: '';

			// disable google maps distance calc for now
			distanceToNextEvent = '';

			return distanceToNextEvent;
		};

		const doNotShowImpossibleToGetThereDistanceErrorOnFlights = (distanceToNextEvent: string, title: string) => {
			// --------------------------------------------------------------------------
			// do not show 'impossible to get there by driving' error if its a flight.
			// --------------------------------------------------------------------------
			const errorText = TranslateService.translate(eventStore, 'DISTANCE.ERROR.NO_POSSIBLE_WAY');
			if (distanceToNextEvent.indexOf(errorText) !== -1) {
				const flightKeywords = ['flight', 'טיסה', 'airport', 'שדה התעופה'];
				if (isMatching(title.toLowerCase(), flightKeywords)) {
					distanceToNextEvent = '';
				}
			}
			return distanceToNextEvent;
		};

		// -------------------------------------------------------------
		Object.keys(summaryPerDay).map((dayTitle) => {
			// array of strings represents the rows we want to print for the summary fo that day.
			summaryPerDay[dayTitle] = summaryPerDay[dayTitle].map((x) => x.split('<br/>')).flat();

			// extract details from the array of string rows above.
			const details = buildRowsDetails(summaryPerDay[dayTitle]);

			let previousDetail: any;
			// @ts-ignore
			const loggerArr: string[] = [];
			let prevLocation: LocationData | undefined;
			let prevTitle: string;
			let oneOfTheFollowing = false;
			let parentIsOr = false;
			details.forEach((x: any, i) => {
				if (x.differentOrGroup) {
					if (parentIsOr) {
						prevLocation = undefined;
					}
					loggerArr.push('\nAND THEN ONE OF THE FOLLOWING:');
					oneOfTheFollowing = true;
				} else if (previousDetail && !previousDetail.or && x.or) {
					loggerArr.push('');
				}

				if (!x.indent) {
					parentIsOr = x.or;
				}

				const thisLocation = x.event.location;
				if (prevLocation && thisLocation && prevLocation.address != thisLocation.address) {
					loggerArr.push('~ ' + prevTitle + ' -> ' + x.event.title);

					let distanceToNextEvent = calculateDistance(eventStore, prevLocation, thisLocation); // prevTitle + " -> " + x.event.title;

					if (distanceToNextEvent !== '') {
						const arrow = eventStore.getCurrentDirection() === 'rtl' ? '✈' : '✈';
						const distanceColor =
							distanceToNextEvent.indexOf(
								TranslateService.translate(eventStore, 'DISTANCE.ERROR.NO_POSSIBLE_WAY')
							) !== -1
								? '#ff5252'
								: 'rgba(55,181,255,0.6)';

						let rowClass = '';
						if (x.orGroupNum) {
							if (x.indent) {
								rowClass += ` indent-or-group-${x.orGroupNum}`;
							} else {
								rowClass += ` or-group-${x.orGroupNum}`;
							}
						}

						const backgroundStyle = x.or || (x.indent && parentIsOr) ? orBackgroundStyle : '';

						const url = BuildEventUrl(thisLocation);
						const urlBlock = `<span><a href="${url}" target="_blank" style="color: inherit">${
							thisLocation.address.split(' - ')[0]
						}</a></span>`;

						rowClass = ` class="${rowClass}"`;
						distanceToNextEvent = `<span style="color: ${distanceColor}; ${backgroundStyle}"${rowClass}>
                                ${arrow}
                                ${distanceToNextEvent} ${TranslateService.translate(eventStore, 'FROM')}${
							prevLocation?.address.split(' - ')[0]
						} ${TranslateService.translate(eventStore, 'TO')}${urlBlock}
                            </span>`;

						distanceToNextEvent = doNotShowImpossibleToGetThereDistanceErrorOnFlights(
							distanceToNextEvent,
							summaryPerDay[dayTitle][x.index] + prevLocation?.address + thisLocation?.address
						);

						summaryPerDay[dayTitle][x.index] = `${distanceToNextEvent}<br/>${
							summaryPerDay[dayTitle][x.index]
						}`;
					}
				}

				const temp = parentIsOr ? ' (parent is or)' : '';
				if (x.indent) {
					loggerArr.push('... ' + x.event.title + temp);
				} else {
					loggerArr.push(x.event.title + temp);
				}

				// @ts-ignore
				if (x.or && i + 1 < details.length && !details[i + 1].differentOrGroup) {
					loggerArr.push('OR:');
				}

				// @ts-ignore
				if (!x.or) {
					prevLocation = thisLocation;
					prevTitle = x.event.title;
				}

				// @ts-ignore
				if ((x.or || x.indent) && i + 1 < details.length && !(details[i + 1].or || details[i + 1].indent)) {
					loggerArr.push('');
					// prevLocation = undefined;
					if (parentIsOr) {
						prevLocation = undefined;
					}
				}
				previousDetail = x;
			});
		});

		// @ts-ignore
		console.log({ routes: window.routes });

		return summaryPerDay;
	},
	_handleSearch: (eventStore: EventStore, summaryPerDay: Record<string, string[]>): Record<string, string[]> => {
		const { searchValue } = eventStore;
		if (searchValue && searchValue.length > 2) {
			const filteredSummaryPerDay: Record<string, string[]> = {};
			Object.keys(summaryPerDay).filter((dayTitle) => {
				const matchFilter = summaryPerDay[dayTitle]
					.join('<br/>')
					.toLowerCase()
					.indexOf(searchValue.toLowerCase());
				if (matchFilter !== -1) {
					const regex = new RegExp(searchValue, 'gi');
					const newVal = `
                        <span style="background-color:#ffff00; color: black; font-weight: bold;">${searchValue}</span>
                    `;
					filteredSummaryPerDay[dayTitle] = summaryPerDay[dayTitle].map((x) => x?.replaceAll(regex, newVal));
				}
			});
			summaryPerDay = filteredSummaryPerDay;
		}
		return summaryPerDay;
	},
	buildHTMLSummary: (eventStore: EventStore) => {
		let calendarEvents = eventStore.filteredCalendarEvents; // used to be calendarEvents but now it also considering search and filters
		const { tripSummaryTitle } = ListViewService._initTranslateKeys(eventStore);

		// build calendar events per day
		const calendarEventsPerDay: Record<string, EventInput> = ListViewService._buildCalendarEventsPerDay(
			eventStore,
			calendarEvents
		);

		// build summary per day and highlights
		// todo complete: move highlights to the end? (since indent rules may change the order)
		let { summaryPerDay, highlightsPerDay } = ListViewService._buildSummaryPerDay(eventStore, calendarEventsPerDay);

		// handle or and indent rules
		summaryPerDay = ListViewService._handleOrAndIndentRules(eventStore, summaryPerDay);

		// handle search
		summaryPerDay = ListViewService._handleSearch(eventStore, summaryPerDay);

		// add distances
		summaryPerDay = ListViewService._addReachingNextDestinationInstructions(eventStore, summaryPerDay);

		const noItemsPlaceholder =
			Object.keys(summaryPerDay).length == 0
				? TranslateService.translate(eventStore, 'LIST_VIEW_DESCRIPTION_WITHOUT_CALENDER_ACTIVITY')
				: '';

		const InfoBoxSummary = () => {
			return `
        <div style="max-width: 990px;">
            <h3><b><u>${tripSummaryTitle}</b></u></h3>
            ${Object.keys(summaryPerDay)
				.map((dayTitle) => {
					const highlights = highlightsPerDay[dayTitle] ? ` (${highlightsPerDay[dayTitle]})` : '';
					return `
                    <b>${dayTitle}</b><span style="font-size:9px;">${highlights}</span><br>
                    <div class="info-box-summary-container">
                        ${ListViewService._sortEvents(eventStore.calendarEvents)
							.filter((x) => ListViewService._getEventDayTitle(eventStore, x) === dayTitle && !x.allDay)
							.map(
								(x) =>
									`<div class="triplan-calendar-event fc-event ${
										x.className
									} max-width-250 flex-column align-items-start margin-bottom-5">
                            ${getEventDivHtml(eventStore, x)}</div>`
							)
							.join('')}
                    </div>
                `;
				})
				.join('<br/><hr/><br/>')}
        `;
		};

		const FullSummary = () => {
			return `
        <div style="max-width: 990px;">
            <h3><b><u>${tripSummaryTitle}</b></u></h3>
            <b>${noItemsPlaceholder}</b>
            ${Object.keys(summaryPerDay)
				.map((dayTitle) => {
					const highlights = highlightsPerDay[dayTitle] ? ` (${highlightsPerDay[dayTitle]})` : '';
					return `
                    <div class="list-view-day-title position-sticky background-white"><div><b>${dayTitle}</b><span style="font-size:9px;">${highlights}</span></div></div>
                    ${summaryPerDay[dayTitle].join('<br/>').replaceAll('<br/><br/>', '<br/>')}
                `;
				})
				.join('<br/><hr/><br/>')}
        </div>
    `;
		};

		return eventStore.listViewSummaryMode === ListViewSummaryMode.box ? InfoBoxSummary() : FullSummary();
	},
};

export default ListViewService;
