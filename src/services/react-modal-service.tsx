import { EventStore } from '../stores/events-store';
import TranslateService, { TranslationParams } from './translate-service';
import React, { useEffect, useState } from 'react';
import { observable, runInAction } from 'mobx';
import IconSelector from '../components/inputs/icon-selector/icon-selector';
import GoogleMapIconSelector, {
	GOOGLE_MAP_ICONS_MAP,
	iconToName,
} from '../components/inputs/google-map-icon-selector/google-map-icon-selector';
import PreviewBox from '../components/preview-box/preview-box';
import { ColorPicker, useColor } from 'react-color-palette';
import 'react-color-palette/css';
import {
	getClasses,
	getCurrentUsername,
	isHotel,
	isHotelsCategory,
	isTemplateUsername,
	ucfirst,
	ucword,
} from '../utils/utils';

import Alert from 'sweetalert2';
import { defaultTimedEventDuration, getLocalStorageKeys, LS_CUSTOM_DATE_RANGE } from '../utils/defaults';
import { Observer } from 'mobx-react';
import {
	CalendarEvent,
	ImportEventsConfirmInfo,
	LocationData,
	SidebarEvent,
	TripActions,
	TriPlanCategory,
	TriplanTask,
	TriplanTaskStatus,
	WeeklyOpeningHoursData,
} from '../utils/interfaces';
import {
	InputValidation,
	TripDataSource,
	TriplanCurrency,
	TriplanEventPreferredTime,
	TriplanPriority,
	ViewMode,
} from '../utils/enums';
import {
	add15Minutes,
	addHours,
	addHoursToDate,
	convertMsToHM,
	fixDuration,
	formatDate,
	formatDuration,
	formatFromISODateString,
	getEndDate,
	getInputDateTimeValue,
	getOffsetInHours,
	subtract15Minutes,
	validateDateRange,
	validateDuration,
} from '../utils/time-utils';
import SelectInput, { SelectInputOption } from '../components/inputs/select-input/select-input';
import TextInput from '../components/inputs/text-input/text-input';
import TextareaInput from '../components/inputs/textarea-input/textarea-input';
import DatePicker from '../components/inputs/date-picker/date-picker';
import { EventInput } from '@fullcalendar/react';
import Button, { ButtonFlavor } from '../components/common/button/button';
import ImportService from './import-service';
import { BackupService } from './backup-service';

// @ts-ignore
import Slider from 'react-slick';

import { DataServices, LocaleCode, lsTripNameToTripName } from './data-handlers/data-handler-base';
import PlacesTinder from '../pages/main-page/modals/places-tinder/places-tinder';
import LocationInput from '../components/inputs/location-input/location-input';
import { apiGetNew, apiPost } from '../helpers/api';
import { LimitationsService } from '../utils/limitations';
import ToggleButton from '../components/toggle-button/toggle-button';
import {
	ACTIVITY_MAX_SIZE_DAYS,
	ACTIVITY_MIN_SIZE_MINUTES,
	priorityToColor,
	priorityToMapColor,
} from '../utils/consts';
import { ModalsStore } from '../stores/modals-store';
// @ts-ignore
import _ from 'lodash';
import CopyInput from '../components/common/copy-input/copy-input';
import LogHistoryService from './data-handlers/log-history-service';
import { navigate } from '@storybook/addon-links';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../v2/utils/endpoints';
import { FeatureFlagsService } from '../utils/feature-flags';
import { newDesignRootPath } from '../v2/utils/consts';
import { getIcon } from '../components/map-container/map-container-utils';

export const ReactModalRenderHelper = {
	renderInputWithLabel: (
		eventStore: EventStore,
		textKey: string,
		input: JSX.Element,
		className: string | undefined = undefined,
		showOnMinimize: boolean = true,
		labelClass: string | undefined = undefined,
		isRequired: boolean | undefined = undefined
	) => {
		return (
			<div
				className={getClasses(
					['input-with-label flex-row gap-30 align-items-center'],
					className,
					eventStore.isModalMinimized && !showOnMinimize && 'display-none'
				)}
			>
				<label className={getClasses('flex-row gap-4', labelClass)}>
					{TranslateService.translate(eventStore, textKey)}
					{isRequired && <div className="red-color padding-top-2">*</div>}
				</label>
				{input}
			</div>
		);
	},
	// todo complete:
	// 1 - on edit event, location does not show the location coordinate since it keeps only the address.
	// maybe need to check if type is string - check if there's coordinate on allEvents. otherwise - check from here.

	// 2 - auto images are not being filled in on the textarea itself and not being saved. see how to do it.

	// 3 - check how to auto-rerender images slider when text changes

	// 4 - this PR have 100% things that not written good, fix it.
	renderTextInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: {
			placeholderKey?: string;
			placeholder?: string;
			id?: string;
			autoComplete?: string;
			className?: string;
			onKeyUp?: () => any;
			onClick?: () => any;
			value?: string;
			readOnly?: boolean;
			eventId?: number;
			type?: 'text' | 'number';
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value;
		}

		if (modalValueName === 'location') {
			return (
				<LocationInput
					id={extra.id}
					className={extra.className}
					ref={ref}
					modalValueName={modalValueName}
					onClick={extra.onClick}
					onKeyUp={extra.onKeyUp}
					placeholder={extra.placeholder}
					placeholderKey={extra.placeholderKey}
					autoComplete={extra.autoComplete}
					readOnly={extra.readOnly}
					disabled={extra.readOnly} // otherwise we can change location via google maps
					showOnMapLink={extra.readOnly}
					eventId={extra.eventId}
				/>
			);
		}

		return (
			<TextInput
				id={extra.id}
				className={extra.className}
				ref={ref}
				modalValueName={modalValueName}
				onClick={extra.onClick}
				onKeyUp={extra.onKeyUp}
				placeholder={extra.placeholder}
				placeholderKey={extra.placeholderKey}
				autoComplete={extra.autoComplete}
				readOnly={extra.readOnly}
				type={extra.type}
			/>
		);
	},
	renderCustomGroup: (eventStore: EventStore, content: any[], className?: string): JSX.Element => {
		return (
			<div className={getClasses('custom-group flex-row gap-10', className)}>
				{content.map((row) => {
					return ReactModalRenderHelper.getRowInput(eventStore, row);
				})}
			</div>
		);
	},
	renderButton: (
		eventStore: EventStore,
		textKey: string,
		onClick: () => void,
		flavor: ButtonFlavor,
		className?: string,
		style?: object
	) => {
		return (
			<Button
				flavor={flavor}
				className={className}
				onClick={onClick}
				text={TranslateService.translate(eventStore, textKey)}
				style={style}
			/>
		);
	},
	renderDatePickerInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: {
			placeholderKey?: string;
			placeholder?: string;
			id?: string;
			className?: string;
			value?: string;
			disabled?: boolean;
			enforceMinMax?: boolean;
			readOnly?: boolean;
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			runInAction(() => {
				eventStore.modalValues[modalValueName] = extra.value;
			});
		}

		return (
			<DatePicker
				id={extra.id}
				className={extra.className}
				ref={ref}
				modalValueName={modalValueName}
				placeholder={extra.placeholder}
				placeholderKey={extra.placeholderKey}
				readOnly={extra.disabled || extra.readOnly}
				enforceMinMax={extra.enforceMinMax}
			/>
		);
	},
	renderDatePickerWithShortcutsInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: {
			placeholderKey?: string;
			placeholder?: string;
			id?: string;
			className?: string;
			value?: string;
			disabled?: boolean;
			enforceMinMax?: boolean;
			readOnly?: boolean;
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			runInAction(() => {
				eventStore.modalValues[modalValueName] = extra.value;
			});
		}

		const adjustTime = (minutes: number) => {
			const currentValue = eventStore.modalValues[modalValueName];
			if (currentValue) {
				// Parse the datetime-local value (format: YYYY-MM-DDTHH:mm)
				const [datePart, timePart] = currentValue.split('T');
				const [year, month, day] = datePart.split('-').map(Number);
				const [hour, minute] = timePart.split(':').map(Number);

				// Create date object in local timezone
				const date = new Date(year, month - 1, day, hour, minute);
				const adjustedDate = minutes > 0 ? add15Minutes(date) : subtract15Minutes(date);

				// Format back to datetime-local format (YYYY-MM-DDTHH:mm) without timezone conversion
				const newYear = adjustedDate.getFullYear();
				const newMonth = String(adjustedDate.getMonth() + 1).padStart(2, '0');
				const newDay = String(adjustedDate.getDate()).padStart(2, '0');
				const newHour = String(adjustedDate.getHours()).padStart(2, '0');
				const newMinute = String(adjustedDate.getMinutes()).padStart(2, '0');
				const newValue = `${newYear}-${newMonth}-${newDay}T${newHour}:${newMinute}`;

				runInAction(() => {
					eventStore.modalValues[modalValueName] = newValue;
					// Force re-render by updating a reactive property
					eventStore.forceUpdate = (eventStore.forceUpdate || 0) + 1;
				});
			}
		};

		return (
			<div className="date-picker-with-shortcuts">
				<DatePicker
					id={extra.id}
					className={extra.className}
					ref={ref}
					modalValueName={modalValueName}
					placeholder={extra.placeholder}
					placeholderKey={extra.placeholderKey}
					readOnly={extra.disabled || extra.readOnly}
					enforceMinMax={extra.enforceMinMax}
				/>
				{!extra.readOnly && (
					<div className="time-shortcuts">
						<Button
							flavor={ButtonFlavor.link}
							text="-15"
							onClick={() => adjustTime(-15)}
							className="time-shortcut-btn"
							tooltip={TranslateService.translate(eventStore, 'SUBTRACT_15_MINUTES')}
						/>
						<Button
							flavor={ButtonFlavor.link}
							text="+15"
							onClick={() => adjustTime(15)}
							className="time-shortcut-btn"
							tooltip={TranslateService.translate(eventStore, 'ADD_15_MINUTES')}
						/>
					</div>
				)}
			</div>
		);
	},
	renderTextAreaInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: {
			rows?: number;
			placeholderKey?: string;
			placeholder?: string;
			id?: string;
			value?: string;
			readOnly?: boolean;
			showAsLink?: boolean; // more info
			validation?: InputValidation;
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value;
		}

		return (
			<TextareaInput
				rows={extra.rows || 3}
				id={extra.id}
				className="textAreaInput"
				ref={ref}
				modalValueName={modalValueName}
				placeholder={extra.placeholder}
				placeholderKey={extra.placeholderKey}
				readOnly={extra.readOnly}
				showAsLink={extra.showAsLink}
				validation={extra.validation}
			/>
		);
	},
	renderSelectInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: {
			options: any[]; // SelectInputOption[]
			placeholderKey?: string;
			id?: string;
			name?: string;
			value?: any;
			readOnly?: boolean;
			maxMenuHeight?: number;
			removeDefaultClass?: boolean;
			onChange?: (data: any) => void;
			onClear?: () => void;
			isClearable?: boolean;
		},
		wrapperClassName: string,
		ref?: any,
		wrap?: boolean
	) => {
		const selectControl = (
			<SelectInput
				ref={ref}
				readOnly={extra.readOnly}
				id={extra.id}
				name={extra.name}
				options={extra.options}
				value={extra.value != undefined ? extra.options.find((o) => o.value == extra.value) : undefined}
				placeholderKey={extra.placeholderKey}
				modalValueName={modalValueName}
				maxMenuHeight={extra.maxMenuHeight}
				removeDefaultClass={extra.removeDefaultClass}
				onChange={extra.onChange}
				onClear={extra.onClear}
				isClearable={extra.isClearable ?? true}
				wrapperClassName={wrapperClassName}
			/>
		);

		if (!wrap) {
			return selectControl;
		}
		return <div className="input-with-label padding-top-0 font-size-14">{selectControl}</div>;
	},
	renderCategorySelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value: any },
		ref?: any,
		categories?: TriPlanCategory[]
	) => {
		const options =
			categories ??
			eventStore.categories
				.sort((a, b) => a.id - b.id)
				.map((x, index) => ({
					value: x.id,
					label: x.icon ? `${x.icon} ${x.title}` : x.title,
				}));

		if (!eventStore.modalValues[modalValueName]) {
			const initialVal: any = (extra as any)?.value;
			eventStore.modalValues[modalValueName] =
				initialVal != null ? options.find((x) => (x as any).value == initialVal) : undefined;
		}

		// console.log("category", extra.value, options.find((x) => x.value == extra.value), eventStore.modalValues[modalValueName])
		// readOnly: !!extra.value,

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER' },
			'category-selector',
			ref
		);
	},
	renderPrioritySelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value: any },
		ref?: any
	) => {
		const values = Object.keys(TriplanPriority);
		const keys = Object.values(TriplanPriority);

		const order = [
			TriplanPriority.unset,
			TriplanPriority.must,
			TriplanPriority.high,
			TriplanPriority.maybe,
			TriplanPriority.least,
		];

		const options = Object.values(TriplanPriority)
			.filter((x) => !Number.isNaN(Number(x)))
			.map((val, index) => ({
				value: values[index],
				label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
			}))
			.sort((a, b) => {
				let A = order.indexOf(Number(a.value) as unknown as TriplanPriority);
				let B = order.indexOf(Number(b.value) as unknown as TriplanPriority);

				if (A === -1) {
					A = 999;
				}
				if (B === -1) {
					B = 999;
				}

				if (A > B) {
					return 1;
				} else if (A < B) {
					return -1;
				}
				return 0;
			});

		if (!eventStore.modalValues[modalValueName]) {
			const selectedOption = options.find((option) => option.value == extra.value?.toString());
			eventStore.modalValues[modalValueName] = selectedOption;
		}

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER' },
			'priority-selector',
			ref
		);
	},
	renderSelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value: any },
		options: { value: string; label: string }[],
		wrapperClassName: string = 'triplan-selector',
		ref?: any
	) => {
		if (!eventStore.modalValues[modalValueName]) {
			const selectedOption = options.find((option) => option.value == extra.value?.toString());
			eventStore.modalValues[modalValueName] = selectedOption;
		}

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER' },
			wrapperClassName,
			ref
		);
	},
	renderCurrencySelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value: any; readOnly?: boolean },
		ref?: any
	) => {
		const values = Object.keys(TriplanCurrency);
		const keys = Object.values(TriplanCurrency);

		const order = [TriplanCurrency.ils, TriplanCurrency.usd, TriplanCurrency.eur, TriplanCurrency.aed];

		const options = Object.values(TriplanCurrency)
			.filter((x) => Number.isNaN(Number(x)))
			.map((val, index) => ({
				value: values[index],
				label: TranslateService.translate(eventStore, keys[index].toString()),
			}))
			.sort((a, b) => {
				let A = order.indexOf(Number(a.value) as unknown as TriplanCurrency);
				let B = order.indexOf(Number(b.value) as unknown as TriplanCurrency);

				if (A === -1) {
					A = 999;
				}
				if (B === -1) {
					B = 999;
				}

				if (A > B) {
					return 1;
				} else if (A < B) {
					return -1;
				}
				return 0;
			});

		if (!eventStore.modalValues[modalValueName]) {
			const selectedOption = options.find(
				(option) => option.value.toLowerCase() == extra.value?.toString()?.toLowerCase()
			);
			eventStore.modalValues[modalValueName] = selectedOption;
		}

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER' },
			'currency-selector',
			ref
		);
	},
	renderPreferredTimeSelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value?: any },
		ref?: any
	) => {
		const values = Object.keys(TriplanEventPreferredTime);
		const keys = Object.values(TriplanEventPreferredTime);

		const options = Object.keys(TriplanEventPreferredTime)
			.filter((x) => Number.isNaN(Number(x)))
			.map((key, index) => ({
				value: values[index],
				label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
			}))
			.sort((a, b) => {
				const valA = a.value == '7' ? 5.5 : a.value; // 7 is night, 6 is nevermind
				const valB = b.value == '7' ? 5.5 : b.value; // 7 is night, 6 is nevermind
				return Number(valA) - Number(valB);
			});

		if (!eventStore.modalValues[modalValueName]) {
			const idx = values.indexOf(extra.value?.toString());
			eventStore.modalValues[modalValueName] = idx > -1 && idx < options.length ? options[idx] : undefined;
		}

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER' },
			'preferred-time-selector',
			ref
		);
	},
	getRowInput: (eventStore: EventStore, row: { settings: any; textKey: string; className?: string }) => {
		let input;
		switch (row.settings.type) {
			case 'text':
				input = ReactModalRenderHelper.renderTextInput(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'number':
				input = ReactModalRenderHelper.renderTextInput(
					eventStore,
					row.settings.modalValueName,
					{ ...row.settings.extra, type: 'number' },
					row.settings.ref
				);
				break;
			case 'button':
				input = ReactModalRenderHelper.renderButton(
					eventStore,
					row.textKey,
					row.settings.extra.onClick,
					row.settings.extra.flavor,
					row.settings.extra.className
				);
				break;
			case 'custom-group':
				input = ReactModalRenderHelper.renderCustomGroup(
					eventStore,
					row.settings.extra.content,
					row.settings.extra.customGroupClassName
				);
				break;
			case 'date-picker':
				input = ReactModalRenderHelper.renderDatePickerInput(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'date-picker-with-shortcuts':
				input = ReactModalRenderHelper.renderDatePickerWithShortcutsInput(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'textarea':
				input = ReactModalRenderHelper.renderTextAreaInput(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'icon-selector':
				input = (
					<IconSelector
						id={row.settings?.extra?.id}
						modalValueName={row.settings.modalValueName}
						value={row.settings.extra.value}
						onChange={(data) => (eventStore.modalValues[row.settings.modalValueName] = data)}
						ref={row.settings.ref}
						readOnly={row.settings.extra.readOnly}
					/>
				);
				break;
			case 'google-map-icon-selector':
				input = (
					<GoogleMapIconSelector
						value={row.settings.extra.value}
						modalValueName={row.settings.modalValueName}
						onChange={(val) => {
							eventStore.modalValues[row.settings.modalValueName] = GOOGLE_MAP_ICONS_MAP[val].icon;
						}}
					/>
				);
				break;
			case 'category-selector':
				input = ReactModalRenderHelper.renderCategorySelector(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'priority-selector':
				input = ReactModalRenderHelper.renderPrioritySelector(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'currency-selector':
				input = ReactModalRenderHelper.renderCurrencySelector(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'select':
				input = ReactModalRenderHelper.renderSelector(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.options,
					row.settings.wrapped,
					row.settings.ref
				);
				break;
			case 'preferred-time-selector':
				input = ReactModalRenderHelper.renderPreferredTimeSelector(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
				);
				break;
			case 'opening-hours':
				// @ts-ignore
				const html = window.renderOpeningHours(row.settings?.extra?.value);

				input = <div ref={row.settings.ref} dangerouslySetInnerHTML={{ __html: html }} />;
				break;
			case 'images':
				const images =
					(row.settings.extra.value ?? eventStore.modalValues[row.settings.modalValueName] ?? '')
						.replace(/\n^/, '')
						.replace(/$\n/, '')
						.split('\n') || [];

				const hasImages = images && images.length > 0 && !(images.length === 1 && images[0] === '');

				input = row.settings.extra.readOnly ? (
					!hasImages ? (
						<div className="width-100-percents">-</div>
					) : null
				) : (
					ReactModalRenderHelper.renderTextAreaInput(
						eventStore,
						row.settings.modalValueName,
						row.settings.extra,
						row.settings.ref
					)
				);

				const sliderSettings = {
					dots: true,
					infinite: true,
					speed: 500,
					slidesToShow: 1,
					slidesToScroll: 1,
					width: 300,
				};

				return (
					<div className="flex-column gap-10 images-input">
						{hasImages && (
							<Slider {...sliderSettings}>
								{images.map((image: string) => (
									<img
										className="slider-image"
										style={{
											width: 300,
											height: 150,
										}}
										alt=""
										src={image}
									/>
								))}
							</Slider>
						)}
						{input}
					</div>
				);
			default:
				break;
		}

		return input;
	},
	renderRow: (
		eventStore: EventStore,
		row: { settings: any; textKey: string; className?: string; showOnMinimized?: boolean },
		hasMinimizeMode: boolean = false
	) => {
		const input = ReactModalRenderHelper.getRowInput(eventStore, row);

		if (input) {
			const showOnMinimize = hasMinimizeMode ? row.showOnMinimized : true;
			return ReactModalRenderHelper.renderInputWithLabel(
				eventStore,
				row.textKey,
				input,
				row.className,
				showOnMinimize
			);
		}
	},
};

export const getDefaultSettings = (eventStore: EventStore) => {
	return {
		show: true,
		showCancel: true,
		cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
		confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
		confirmBtnCssClass: 'primary-button',
		cancelBtnCssClass: 'link-button',
		dependencies: [eventStore.modalSettings, eventStore.secondModalSettings, eventStore.modalValues],
		customClass: 'triplan-react-modal',
		customContainerClass: 'display-none',
		// reverseButtons: eventStore.getCurrentDirection() === 'rtl',
		reverseButtons: true,
		slideUp: true, // default animation - slide up.
		onCancel: () => {
			ReactModalService.internal.closeModal(eventStore);
		},
	};
};

function _validateCalendarEventRequiredConditions(
	eventStore: EventStore,
	startDate: string,
	endDate: string,
	title?: string,
	categoryId?: string | number
): boolean {
	if (!title) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.TITLE_CANNOT_BE_EMPTY',
			'error'
		);

		return false;
	}

	if (!categoryId) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.CATEGORY_CANT_BE_EMPTY',
			'error'
		);
		return false;
	}

	if (!startDate) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.START_DATE_CANT_BE_EMPTY',
			'error'
		);
		return false;
	}

	if (!endDate) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.END_DATE_CANT_BE_EMPTY',
			'error'
		);
		return false;
	}

	if (
		!validateDateRange(eventStore, startDate, endDate, ACTIVITY_MAX_SIZE_DAYS, ACTIVITY_MIN_SIZE_MINUTES, 'minutes')
	) {
		return false;
	}

	if (new Date(startDate).getTime() < new Date(`${eventStore.customDateRange.start}T00:00`).getTime()) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.START_DATE_OUT_OF_RANGE',
			'error'
		);
		return false;
	}

	if (new Date(endDate).getTime() > new Date(`${eventStore.customDateRange.end}T23:59`).getTime()) {
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.ERROR.TITLE',
			'MODALS.ERROR.END_DATE_OUT_OF_RANGE',
			'error'
		);
		return false;
	}

	return true;
}

const ReactModalService = {
	internal: {
		renderShowHideMore: (eventStore: EventStore) => {
			return (
				<div
					className={getClasses(
						'input-with-label flex-row gap-30 align-items-center justify-content-center padding-top-0 show-hide-more-row',
						!eventStore.isModalMinimized && 'display-none'
					)}
				>
					<a
						onClick={() => {
							runInAction(() => {
								eventStore.isModalMinimized = !eventStore.isModalMinimized;
							});
						}}
						className="show-hide-more"
					>
						{TranslateService.translate(
							eventStore,
							eventStore.isModalMinimized ? 'SHOW_MORE' : 'SHOW_LESS'
						)}
					</a>
				</div>
			);
		},
		disableOnConfirm: () => {
			// @ts-ignore
			$(
				'.triplan-react-modal .input-with-label input, .triplan-react-modal .input-with-label textarea, .triplan-react-modal .input-with-label button'
			).attr('disabled', true);
			// @ts-ignore
			$('.triplan-react-modal .triplan-selector, .triplan-react-modal .icon-selector').addClass('disabled');
			// @ts-ignore
			$('.triplan-react-modal>p .primary-button')
				.parent()
				.html('<a href="#" class="btn btn-lg btn-info primary-button disabled">שומר...</a>');
		},
		openOopsErrorModal: (eventStore: EventStore) => {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.OOPS_SOMETHING_WENT_WRONG',
				'error'
			);
		},
		openModal: (eventStore: EventStore, settings: any, isSecondModal: boolean = false) => {
			const shouldSlideUp = eventStore.isMobile && settings.slideUp;

			if (shouldSlideUp) {
				settings.customClass += ' slide-up';
			}

			if (isSecondModal) {
				eventStore.setSecondModalSettings(settings);

				if (shouldSlideUp) {
					setTimeout(() => {
						eventStore.setSecondModalSettings({
							...settings,
							customClass: settings.customClass + ' slided-up',
						});
					}, 1);
				}
			} else {
				eventStore.setModalSettings(settings);

				if (shouldSlideUp) {
					setTimeout(() => {
						eventStore.setModalSettings({
							...settings,
							customClass: settings.customClass + ' slided-up',
						});
					}, 1);
				}
			}
		},
		alertMessage: (
			eventStore: EventStore,
			titleKey: string,
			contentKey: string,
			type: 'error' | 'success',
			contentParams: Record<string, string | number> = {}
		) => {
			return Alert.fire(
				TranslateService.translate(eventStore, titleKey),
				TranslateService.translate(eventStore, contentKey, contentParams),
				type
			);
		},
		getSidebarEventInputs: (
			eventStore: EventStore,
			initialData: Partial<{ categoryId?: number; location?: LocationData }> | Partial<SidebarEvent> | any = {},
			modalsStore?: ModalsStore,
			avoidLastLineClass?: boolean,
			eventId?: number
		) => {
			const initLocation = () => {
				// @ts-ignore
				window.initLocationPicker('location-input', 'selectedLocation', undefined, eventStore);
			};

			const setManualLocation = () => {
				// @ts-ignore
				window.setManualLocation('location-input', 'selectedLocation', eventStore);
			};

			// @ts-ignore
			const selectedLocation = window.selectedLocation;

			const inputs = [
				{
					settings: {
						modalValueName: 'icon',
						ref: eventStore.modalValuesRefs['icon'],
						type: 'icon-selector',
						extra: {
							id: 'new-icon',
							value: initialData?.icon,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.ICON',
					className: 'border-top-gray icon-row',
					showOnMinimized: false,
				},
				{
					settings: {
						modalValueName: 'name',
						ref: eventStore.modalValuesRefs['name'],
						type: 'text',
						extra: {
							placeholder: `${TranslateService.translate(
								eventStore,
								'MODALS.PLACEHOLDER.PREFIX'
							)} ${TranslateService.translate(eventStore, 'MODALS.TITLE')}`,
							value: initialData?.title,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.TITLE',
					className: 'border-top-gray name-row',
					showOnMinimized: modalsStore?.isViewMode ? false : undefined,
				},
				{
					settings: {
						modalValueName: 'category',
						ref: eventStore.modalValuesRefs['category'],
						type: 'category-selector',
						extra: {
							placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
							value: initialData?.category,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.CATEGORY',
					className: 'border-top-gray category-row',
				},
				{
					settings: {
						modalValueName: 'description',
						ref: eventStore.modalValuesRefs['description'],
						type: 'textarea',
						extra: {
							placeholderKey: 'MODALS.DESCRIPTION_PLACEHOLDER',
							value: initialData.description,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.DESCRIPTION',
					className: 'border-top-gray description-row',
					showOnMinimized: true,
				},
				{
					settings: {
						modalValueName: 'duration',
						ref: eventStore.modalValuesRefs['duration'],
						type: 'text',
						extra: {
							// value: defaultTimedEventDuration,
							placeholder: `${TranslateService.translate(
								eventStore,
								'MODALS.PLACEHOLDER.PREFIX'
							)} ${TranslateService.translate(eventStore, 'MODALS.DURATION')}`,
							// placeholder: defaultTimedEventDuration,
							value: initialData?.duration ?? defaultTimedEventDuration,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.DURATION',
					className: 'border-top-gray duration-row',
					showOnMinimized: false,
				},
				{
					settings: {
						modalValueName: 'priority',
						ref: eventStore.modalValuesRefs['priority'],
						type: 'priority-selector',
						extra: {
							value: initialData?.priority ?? TriplanPriority.unset,
							maxMenuHeight: 45 * 4,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.PRIORITY',
					className: 'border-top-gray priority-row',
					showOnMinimized: true,
				},
				{
					settings: {
						modalValueName: 'preferred-time',
						ref: eventStore.modalValuesRefs['preferred-time'],
						type: 'preferred-time-selector',
						extra: {
							value: initialData.preferredTime ?? TriplanEventPreferredTime.unset,
							maxMenuHeight: 45 * 4,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.PREFERRED_TIME',
					className: 'border-top-gray preferred-time-row',
					showOnMinimized: true,
				},
				{
					settings: {
						modalValueName: 'location',
						ref: eventStore.modalValuesRefs['location'],
						type: 'text',
						extra: {
							className: 'location-input',
							value:
								eventStore.modalValues['selectedLocation'] ||
								initialData.location ||
								selectedLocation ||
								'',
							onClick: initLocation,
							onKeyUp: setManualLocation,
							autoComplete: 'off',
							placeholder: `${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}`,
							readOnly: modalsStore?.isViewMode,
							eventId: eventId,
						},
					},
					textKey: 'MODALS.LOCATION',
					className: 'border-top-gray location-row',
				},
				{
					settings: {
						modalValueName: 'opening-hours',
						ref: eventStore.modalValuesRefs['opening-hours'],
						type: 'opening-hours',
						extra: {
							value: initialData.openingHours,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.OPENING_HOURS',
					className: 'border-top-gray opening-hours-row',
					showOnMinimized: modalsStore?.isViewMode ?? false,
				},
				{
					settings: {
						modalValueName: 'images', // add column 4
						ref: eventStore.modalValuesRefs['images'],
						type: 'images',
						extra: {
							placeholderKey: 'MODALS.IMAGES_PLACEHOLDER',
							value: initialData.images,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.IMAGES',
					className: 'border-top-gray images-row',
					showOnMinimized: modalsStore?.isViewMode ?? false,
				},
				{
					settings: {
						modalValueName: 'price',
						ref: eventStore.modalValuesRefs['price'],
						type: 'number',
						extra: {
							placeholderKey: 'MODALS.PRICE',
							value: initialData.price,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.PRICE',
					className: 'border-top-gray price-row',
					showOnMinimized: false, // modalsStore?.isViewMode ?? false,
				},
				{
					settings: {
						modalValueName: 'currency',
						ref: eventStore.modalValuesRefs['currency'],
						type: 'currency-selector',
						extra: {
							placeholderKey: 'MODALS.CURRENCY',
							value: initialData.currency,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.CURRENCY',
					className: 'border-top-gray currency-row',
					showOnMinimized: false, // modalsStore?.isViewMode ?? false,
				},
				{
					settings: {
						modalValueName: 'more-info',
						ref: eventStore.modalValuesRefs['more-info'],
						type: 'textarea',
						extra: {
							placeholderKey: 'MODALS.MORE_INFO_PLACEHOLDER',
							value: initialData.moreInfo,
							readOnly: modalsStore?.isViewMode,
							showAsLink: true,
							validation: InputValidation.link,
						},
					},
					textKey: 'MODALS.MORE_INFO',
					className: 'border-top-gray more-info-row',
					showOnMinimized: false,
				},
			];
			if (!avoidLastLineClass) {
				inputs[inputs.length - 1].className += ' border-bottom-gray padding-bottom-20';
			}
			return inputs;
		},
		getCalendarEventInputs: (
			eventStore: EventStore,
			initialData: Partial<{ categoryId?: number; location?: LocationData }> | Partial<SidebarEvent> | any = {},
			modalsStore?: ModalsStore,
			avoidLastLineClass?: boolean,
			eventId?: number
		) => {
			const initLocation = () => {
				// @ts-ignore
				window.initLocationPicker('location-input', 'selectedLocation', undefined, eventStore);
			};

			const setManualLocation = () => {
				// @ts-ignore
				window.setManualLocation('location-input', 'selectedLocation', eventStore);
			};

			// @ts-ignore
			const selectedLocation = window.selectedLocation;

			const startDate = getInputDateTimeValue(eventStore, initialData?.start);
			const endDate = getInputDateTimeValue(eventStore, initialData?.end, startDate);

			const inputs: any[] = [
				{
					settings: {
						modalValueName: 'location',
						ref: eventStore.modalValuesRefs['location'],
						type: 'text',
						extra: {
							className: 'location-input',
							value:
								eventStore.modalValues['selectedLocation'] ||
								initialData.location ||
								selectedLocation ||
								'',
							onClick: initLocation,
							onKeyUp: setManualLocation,
							autoComplete: 'off',
							placeholder: `${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}`,
							readOnly: modalsStore?.isViewMode,
							eventId: eventId,
						},
					},
					textKey: 'MODALS.LOCATION',
					className: 'border-top-gray location-row',
					showOnMinimized: true,
				},
				{
					settings: {
						modalValueName: 'name',
						ref: eventStore.modalValuesRefs['name'],
						type: 'text',
						extra: {
							placeholder: `${TranslateService.translate(
								eventStore,
								'MODALS.PLACEHOLDER.PREFIX'
							)} ${TranslateService.translate(eventStore, 'MODALS.TITLE')}`,
							value: initialData?.title,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.TITLE',
					className: 'border-top-gray name-row',
					showOnMinimized: modalsStore?.isViewMode ? false : undefined,
				},
				{
					settings: {
						modalValueName: 'category',
						ref: eventStore.modalValuesRefs['category'],
						type: 'category-selector',
						extra: {
							placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
							value: initialData?.category,
							readOnly: modalsStore?.isViewMode,
						},
					},
					textKey: 'MODALS.CATEGORY',
					className: 'border-top-gray category-row',
				},
			];
			inputs.push(
				...[
					{
						settings: {
							modalValueName: 'start-time',
							ref: eventStore.modalValuesRefs['start-time'],
							type: 'date-picker-with-shortcuts',
							extra: {
								placeholder: `${TranslateService.translate(
									eventStore,
									'MODALS.PLACEHOLDER.PREFIX'
								)} ${TranslateService.translate(eventStore, 'MODALS.START_TIME')}`,
								value: startDate,
								enforceMinMax: true,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.START_TIME',
						className: getClasses('border-top-gray start-time-row', initialData.allDay && 'display-none'),
					},
					{
						settings: {
							modalValueName: 'end-time',
							ref: eventStore.modalValuesRefs['end-time'],
							type: 'date-picker-with-shortcuts',
							extra: {
								placeholder: `${TranslateService.translate(
									eventStore,
									'MODALS.PLACEHOLDER.PREFIX'
								)} ${TranslateService.translate(eventStore, 'MODALS.END_TIME')}`,
								value: endDate,
								enforceMinMax: true,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.END_TIME',
						className: getClasses('border-top-gray end-time-row', initialData.allDay && 'display-none'),
					},
				]
			);
			inputs.push(
				...[
					{
						settings: {
							modalValueName: 'description',
							ref: eventStore.modalValuesRefs['description'],
							type: 'textarea',
							extra: {
								placeholderKey: 'MODALS.DESCRIPTION_PLACEHOLDER',
								value: initialData.description,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.DESCRIPTION',
						className: 'border-top-gray description-row',
						showOnMinimized: true,
					},
					{
						settings: {
							modalValueName: 'priority',
							ref: eventStore.modalValuesRefs['priority'],
							type: 'priority-selector',
							extra: {
								value: initialData?.priority ?? TriplanPriority.unset,
								maxMenuHeight: 45 * 4,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.PRIORITY',
						className: 'border-top-gray priority-row',
						showOnMinimized: true,
					},
					{
						settings: {
							modalValueName: 'preferred-time',
							ref: eventStore.modalValuesRefs['preferred-time'],
							type: 'preferred-time-selector',
							extra: {
								value: initialData.preferredTime ?? TriplanEventPreferredTime.unset,
								maxMenuHeight: 45 * 4,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.PREFERRED_TIME',
						className: 'border-top-gray preferred-time-row',
						showOnMinimized: true,
					},
					{
						settings: {
							modalValueName: 'icon',
							ref: eventStore.modalValuesRefs['icon'],
							type: 'icon-selector',
							extra: {
								id: 'new-icon',
								value: initialData?.icon,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.ICON',
						className: 'border-top-gray icon-row',
						showOnMinimized: false,
					},
					{
						settings: {
							modalValueName: 'opening-hours',
							ref: eventStore.modalValuesRefs['opening-hours'],
							type: 'opening-hours',
							extra: {
								value: initialData.openingHours,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.OPENING_HOURS',
						className: 'border-top-gray opening-hours-row',
						showOnMinimized: modalsStore?.isViewMode ?? false,
					},
					{
						settings: {
							modalValueName: 'images', // add column 5
							ref: eventStore.modalValuesRefs['images'],
							type: 'images',
							extra: {
								placeholderKey: 'MODALS.IMAGES_PLACEHOLDER',
								value: initialData.images,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.IMAGES',
						className: 'border-top-gray images-row',
						// showOnMinimized: false,
						showOnMinimized: modalsStore?.isViewMode ?? false,
					},
					{
						settings: {
							modalValueName: 'price',
							ref: eventStore.modalValuesRefs['price'],
							type: 'number',
							extra: {
								placeholderKey: 'MODALS.PRICE',
								value: initialData.price,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.PRICE',
						className: 'border-top-gray price-row',
						showOnMinimized: false, // modalsStore?.isViewMode ?? false,
					},
					{
						settings: {
							modalValueName: 'currency',
							ref: eventStore.modalValuesRefs['currency'],
							type: 'currency-selector',
							extra: {
								placeholderKey: 'MODALS.CURRENCY',
								value: initialData.currency,
								readOnly: modalsStore?.isViewMode,
							},
						},
						textKey: 'MODALS.CURRENCY',
						className: 'border-top-gray currency-row',
						showOnMinimized: false, // modalsStore?.isViewMode ?? false,
					},
					{
						settings: {
							modalValueName: 'more-info',
							ref: eventStore.modalValuesRefs['more-info'],
							type: 'textarea',
							extra: {
								placeholderKey: 'MODALS.MORE_INFO_PLACEHOLDER',
								value: initialData.moreInfo,
								readOnly: modalsStore?.isViewMode,
								showAsLink: true,
								validation: InputValidation.link,
							},
						},
						textKey: 'MODALS.MORE_INFO',
						className: 'border-top-gray more-info-row',
						showOnMinimized: false,
					},
				]
			);

			if (!avoidLastLineClass) {
				inputs[inputs.length - 1].className += ' border-bottom-gray padding-bottom-20';
			}
			return inputs;
		},
		getModalValues: (eventStore: EventStore) => {
			// @ts-ignore
			const icon = eventStore.modalValues.icon?.label || '';

			// @ts-ignore
			const title = eventStore.modalValues.name;

			// @ts-ignore
			const duration = eventStore.modalValues.duration;

			// @ts-ignore
			const priority = eventStore.modalValues.priority?.value || TriplanPriority.unset;

			// @ts-ignore
			const preferredTime = eventStore.modalValues['preferred-time']?.value || TriplanEventPreferredTime.unset;

			// @ts-ignore
			const description = eventStore.modalValues.description;

			// @ts-ignore
			const categoryId = eventStore.modalValues.category?.value;

			// @ts-ignore
			let location = (window.selectedLocation || eventStore.modalValues['selectedLocation']) as
				| LocationData
				| undefined;
			if (location && location.address == undefined) {
				location = undefined;
			}

			// @ts-ignore
			const openingHours = window.openingHours as WeeklyOpeningHoursData;

			// @ts-ignore
			const images = eventStore.modalValues.images; // add column 10

			const price = eventStore.modalValues.price;
			const currency = eventStore.modalValues.currency?.value;

			const moreInfo = eventStore.modalValues.moreInfo || eventStore.modalValues['more-info'];

			// -------------------------------------------------
			// for calendar events:
			// -------------------------------------------------

			// @ts-ignore
			const startDate = eventStore.modalValues['start-time'];

			// @ts-ignore
			const endDate = eventStore.modalValues['end-time'];

			return {
				icon,
				title,
				duration,
				priority,
				preferredTime,
				description,
				category: categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
				price,
				currency, // add column 10
			};
		},
		closeModal: (eventStore: EventStore) => {
			runInAction(() => {
				if (eventStore.secondModalSettings?.show) {
					eventStore.secondModalSettings.show = false;
				} else {
					eventStore.modalSettings.show = false;
				}

				eventStore.modalValues = {};

				// set it back to default
				eventStore.isModalMinimized = true;
			});
			ReactModalService.internal.resetWindowVariables(eventStore);
		},
		resetWindowVariables: (eventStore: EventStore) => {
			// @ts-ignore
			window.selectedLocation = undefined;

			// @ts-ignore
			window.openingHours = undefined;

			eventStore.modalValues['selectedLocation'] = undefined;
			eventStore.modalValues['openingHours'] = undefined;
		},
	},

	openAddCategoryModal: (eventStore: EventStore) => {
		ReactModalService.internal.resetWindowVariables(eventStore);

		const onConfirm = async () => {
			// @ts-ignore
			const newIcon = eventStore.modalValues.icon?.label;

			// @ts-ignore
			const newName = eventStore.modalValues.name;

			const googleMapIcon = eventStore.modalValues.googleMapIcon;

			let isOk = true;

			// validate not already exist
			if (!newName || newName.length === 0) {
				isOk = false;
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.CATEGORY_NAME_CANT_BE_EMPTY',
					'error'
				);
				return;
			} else if (eventStore.categories.find((c) => c.title === newName)) {
				isOk = false;
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST',
					'error'
				);
				return;
			}

			if (isOk) {
				const categoryId = eventStore.createCategoryId();
				runInAction(async () => {
					ReactModalService.internal.disableOnConfirm();
					await eventStore.setCategories(
						[
							...eventStore.categories,
							{
								id: categoryId,
								title: newName,
								icon: newIcon,
								googleMapIcon: googleMapIcon,
							},
						],
						false
					);

					ReactModalService.internal.closeModal(eventStore);
				});

				LogHistoryService.logHistory(eventStore, TripActions.addedCategory, {
					categoryName: eventStore.categories.find((c) => c.id == Number(categoryId!))?.title,
					categoryId: categoryId,
				});

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.CREATE.TITLE',
					'MODALS.CREATE_CATEGORY.CONTENT',
					'success'
				);
			}
		};

		const inputs = [
			{
				settings: {
					modalValueName: 'icon',
					type: 'icon-selector',
					extra: {
						id: 'new-icon',
					},
				},
				textKey: 'MODALS.ICON',
				className: 'border-top-gray',
			},
			{
				settings: {
					modalValueName: 'googleMapIcon',
					type: 'google-map-icon-selector',
					extra: {
						value: undefined, // no default value
					},
				},
				textKey: 'GOOGLE_MAP_ICON',
				className: 'border-top-gray',
			},
			{
				settings: {
					modalValueName: 'name',
					type: 'text',
					extra: {
						placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
						id: 'new-name',
					},
				},
				textKey: 'MODALS.TITLE',
				className: 'border-top-gray border-bottom-gray padding-bottom-20',
			},
		];

		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'ADD_CATEGORY_MODAL.TITLE.ADD_CATEGORY'),
			type: 'controlled',
			onConfirm,
			content,
		});
	},
	openEditTripModal: (eventStore: EventStore, LSTripName: string, tripId?: number) => {
		const tripName = LSTripName !== '' ? lsTripNameToTripName(LSTripName) : '';
		const title = `${TranslateService.translate(eventStore, 'EDIT_TRIP_MODAL.TITLE')}: ${tripName}`;

		const onConfirm = async () => {
			// @ts-ignore
			const newName = eventStore.modalValues.name;

			let isOk = true;

			const oldName = tripName;
			if (oldName !== newName) {
				// validate title not already exist
				if (
					Object.keys(localStorage)
						.filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1)
						.map((x) => x.replace(LS_CUSTOM_DATE_RANGE + '-', ''))
						.filter((LSTripName) => {
							LSTripName = LSTripName === LS_CUSTOM_DATE_RANGE ? '' : LSTripName;
							const _tripName = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
							return _tripName === newName;
						}).length > 0
				) {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'MODALS.ERROR.TRIP_NAME_ALREADY_EXIST',
						'error'
					);
					isOk = false;
					return;
				}
			}

			if (isOk) {
				await eventStore.dataService.setTripName(tripName, newName);
				// DataServices.LocalStorageService.setTripName(tripName, newName)

				ReactModalService.internal.closeModal(eventStore);

				LogHistoryService.logHistory(
					eventStore,
					TripActions.updatedTrip,
					{
						tripName: {
							was: oldName,
							now: newName,
						},
					},
					undefined,
					undefined,
					tripId
				);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_TRIP.CONTENT',
					'success'
				);

				setTimeout(() => {
					window.location.reload();
				}, 2000);
			}
		};

		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{ReactModalRenderHelper.renderInputWithLabel(
							eventStore,
							'MODALS.TITLE',
							ReactModalRenderHelper.renderTextInput(eventStore, 'name', {
								placeholderKey: 'DUPLICATE_TRIP_MODAL.TITLE.PLACEHOLDER',
								id: 'new-name',
								value: LSTripName,
							}),
							'border-top-gray border-bottom-gray padding-bottom-20'
						)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			onConfirm,
			content,
			type: 'controlled',
		});
	},
	openDuplicateTripModal: (eventStore: EventStore, LSTripName: string) => {
		const tripName = LSTripName !== '' ? lsTripNameToTripName(LSTripName) : '';
		const title = `${TranslateService.translate(eventStore, 'DUPLICATE_TRIP_MODAL.TITLE')}: ${tripName}`;

		const onConfirm = async () => {
			// @ts-ignore
			const newName = eventStore.modalValues.name;

			let isOk = true;

			const oldName = tripName;
			if (oldName !== newName) {
				// validate title not already exist
				if (
					Object.keys(localStorage)
						.filter((x) => x.indexOf(LS_CUSTOM_DATE_RANGE) > -1)
						.map((x) => x.replace(LS_CUSTOM_DATE_RANGE + '-', ''))
						.filter((LSTripName) => {
							LSTripName = LSTripName === LS_CUSTOM_DATE_RANGE ? '' : LSTripName;
							const _tripName = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
							return _tripName === newName;
						}).length > 0
				) {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'MODALS.ERROR.TRIP_NAME_ALREADY_EXIST',
						'error'
					);
					isOk = false;
					return;
				}
			}

			if (isOk) {
				await eventStore.dataService
					.duplicateTrip(eventStore, tripName, newName)
					.then(() => {
						ReactModalService.internal.closeModal(eventStore);

						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.DUPLICATED.TITLE',
							'MODALS.DUPLICATED_TRIP.CONTENT',
							'success'
						);

						setTimeout(() => {
							window.location.reload();
						}, 2000);
					})
					.catch((e) => {
						if (e.response.data.statusCode === 409) {
							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.ERROR.TITLE',
								'TRIP_ALREADY_EXISTS',
								'error'
							);
						} else {
							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.ERROR.TITLE',
								'OOPS_SOMETHING_WENT_WRONG',
								'error'
							);
						}
					});
			}
		};

		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{ReactModalRenderHelper.renderInputWithLabel(
							eventStore,
							'MODALS.TITLE',
							ReactModalRenderHelper.renderTextInput(eventStore, 'name', {
								placeholderKey: 'DUPLICATE_TRIP_MODAL.TITLE.PLACEHOLDER',
								id: 'new-name',
								value: LSTripName,
							}),
							'border-top-gray border-bottom-gray padding-bottom-20'
						)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			onConfirm,
			content,
			type: 'controlled',
		});
	},
	openDeleteTripModal: (eventStore: EventStore, LSTripName: string, tripDataSource: TripDataSource) => {
		const tripName = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${tripName}`,
			content: (
				<div
					dangerouslySetInnerHTML={{
						__html: TranslateService.translate(eventStore, 'MODALS.DELETE_TRIP.CONTENT'),
					}}
				/>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
			confirmBtnCssClass: 'primary-button red',
			onConfirm: async () => {
				const lsKeys = getLocalStorageKeys();
				const separator = LSTripName === '' ? '' : '-';

				if (tripDataSource === TripDataSource.DB) {
					await DataServices.DBService.deleteTripByName(
						tripName,
						() => {
							window.location.reload();
						},
						() => {
							ReactModalService.internal.openOopsErrorModal(eventStore);
						}
					);
				} else {
					Object.values(lsKeys).forEach((localStorageKey) => {
						const key = [localStorageKey, LSTripName].join(separator);
						localStorage.removeItem(key);
					});
					window.location.reload();
				}
			},
		});
	},
	openHideTripModal: (
		eventStore: EventStore,
		LSTripName: string,
		tripDataSource: TripDataSource,
		onConfirm?: () => void
	) => {
		const tripName = LSTripName !== '' ? LSTripName.replaceAll('-', ' ') : '';

		async function hideTrip() {
			if (tripDataSource === TripDataSource.DB) {
				await DataServices.DBService.hideTripByName(tripName)
					.then(() => {
						LogHistoryService.logHistory(eventStore, TripActions.hideTrip, {
							tripName,
						});

						if (onConfirm) {
							onConfirm();
							ReactModalService.internal.closeModal(eventStore);
						} else {
							window.location.reload();
						}
					})
					.catch(() => {
						ReactModalService.internal.openOopsErrorModal(eventStore);
					});
			} else {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
					'error'
				);
				return;
			}
		}

		if (isTemplateUsername()) {
			hideTrip();
			return;
		}

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'HIDE_TRIP')}: ${tripName}`,
			content: (
				<div
					dangerouslySetInnerHTML={{
						__html: TranslateService.translate(eventStore, 'MODALS.HIDE_TRIP.CONTENT', {
							X: TranslateService.translate(eventStore, 'SHOW_HIDDEN_TRIPS_LIST'),
						}),
					}}
				/>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'HIDE_TRIP'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: hideTrip,
		});
	},
	openShareTripModal: (eventStore: EventStore) => {
		const tripName = eventStore.tripName.replaceAll('-', ' ');

		const options = [
			{ value: 0, label: TranslateService.translate(eventStore, 'PERMISSIONS.READ') },
			{ value: 1, label: TranslateService.translate(eventStore, 'PERMISSIONS.READ_WRITE') },
		];

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'SHARE_TRIP')}: ${tripName}`,
			content: (
				<div className="flex-col gap-20">
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MODALS.SHARE_TRIP.CONTENT'),
						}}
					/>
					{ReactModalRenderHelper.renderSelectInput(
						eventStore,
						'share-trip-choose-permissions',
						{
							options,
							placeholderKey: 'SHARE_TRIP.SELECT_PERMISSIONS',
							removeDefaultClass: true,
							value: 0,
							isClearable: false,
							maxMenuHeight: eventStore.isMobile ? 35 * 2 : undefined,
						},
						'add-event-from-sidebar-selector'
					)}
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'CREATE_INVITE_LINK'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: async () => {
				const tripDataSource = eventStore.dataService.getDataSourceName();
				const canWrite = !!eventStore.modalValues['share-trip-choose-permissions']?.value;
				if (tripDataSource === TripDataSource.DB) {
					await DataServices.DBService.createInviteLink(tripName, canWrite)
						.then((response) => {
							const { inviteLink: data, expiredAt } = response.data;
							const { inviteLink: token } = data;
							const host = window.location.host;
							const inviteLink = `http://${host}/inviteLink?token=${token}`;

							// log history
							LogHistoryService.logHistory(eventStore, TripActions.sharedTrip, {
								permissions: canWrite ? 'PERMISSIONS.READ_WRITE' : 'PERMISSIONS.READ',
							});

							ReactModalService.openShareTripStepTwoModal(eventStore, inviteLink, expiredAt);
						})
						.catch(() => {
							ReactModalService.internal.openOopsErrorModal(eventStore);
						});
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
						'error'
					);
					return;
				}
			},
		});
	},
	openShareTripStepTwoModal: (eventStore: EventStore, inviteLink: string, expiredAt: number) => {
		const tripName = eventStore.tripName.replaceAll('-', ' ');

		ReactModalService.internal.closeModal(eventStore);
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'SHARE_TRIP')}: ${tripName}`,
			content: (
				<div className="flex-col gap-20">
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MODALS.SHARE_TRIP.STEP2.CONTENT', {
								X: expiredAt,
							}),
						}}
					/>
					<CopyInput eventStore={eventStore} value={inviteLink} />
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'CREATE_INVITE_LINK'),
			confirmBtnCssClass: 'primary-button display-none',
			onConfirm: async () => {},
			onCancel: () => {
				// todo complete: fix bug - open share trip, step 2, close, try to open it again will crash. open modal will crash generally.

				window.location.reload();
			},
		});
	},
	openAddSidebarEventModal: (
		eventStore: EventStore,
		categoryId?: number,
		initialData: any = {},
		isSecondModal: boolean = false,
		onClose?: () => void,
		actionCode: TripActions = TripActions.addedNewSidebarEvent
	) => {
		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleAddSidebarEventResult = async (eventStore: EventStore, initialCategoryId?: number) => {
			if (!eventStore) return;

			let {
				icon,
				title,
				duration,
				priority,
				preferredTime,
				description,
				category: categoryId,
				location,
				openingHours,
				images,
				moreInfo,
				price,
				currency, // add column 16
			} = ReactModalService.internal.getModalValues(eventStore);

			if (duration) {
				duration = fixDuration(duration);
			}

			// @ts-ignore
			delete location?.openingHours;

			if (initialCategoryId != undefined) {
				categoryId = initialCategoryId;
			}

			if (!categoryId) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.CATEGORY_CANT_BE_EMPTY',
					'error'
				);
				return;
			}

			const currentEvent = {
				id: eventStore.createEventId(),
				title,
				icon,
				duration,
				priority: priority as TriplanPriority,
				preferredTime: preferredTime as TriplanEventPreferredTime,
				description,
				location,
				openingHours,
				images,
				category: categoryId,
				moreInfo,
				price,
				currency, // add column 16
			} as SidebarEvent;

			if (initialData.extra?.feedId) {
				// @ts-ignore
				currentEvent.extra = {
					feedId: initialData.extra?.feedId,
				};
			}

			const isDurationValid = !duration || validateDuration(duration);
			// const isDurationValid =
			// 	duration &&
			// 	duration.split(':').length == 2 &&
			// 	!Number.isNaN(duration.split(':')[0]) &&
			// 	!Number.isNaN(duration.split(':')[1]) &&
			// 	parseInt(duration.split(':')[0]) >= 0 &&
			// 	parseInt(duration.split(':')[1]) >= 0 &&
			// 	parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1]) > 0;
			if (!isDurationValid) {
				console.error('duration is not valid');
				currentEvent.duration = defaultTimedEventDuration;
			} else {
				const hours = parseInt(duration.split(':')[0]);
				const minutes = parseInt(duration.split(':')[1]);
				const milliseconds = minutes * 60000 + hours * 3600000;
				duration = convertMsToHM(milliseconds);
				currentEvent.duration = duration;
			}

			if (!title) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.TITLE_CANNOT_BE_EMPTY',
					'error'
				);
				return;
			}

			ReactModalService.internal.disableOnConfirm();

			const existingSidebarEvents = eventStore.getJSSidebarEvents();
			existingSidebarEvents[categoryId] = existingSidebarEvents[categoryId] || [];
			existingSidebarEvents[categoryId].push(currentEvent);
			await eventStore.setSidebarEvents(existingSidebarEvents);

			LogHistoryService.logHistory(
				eventStore,
				actionCode,
				{
					eventName: currentEvent.title,
					categoryName: eventStore.categories.find((c) => c.id == Number(categoryId!))?.title,
					categoryId: categoryId,
				},
				Number(currentEvent.id),
				currentEvent.title
			);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ADDED.TITLE',
				'MODALS.ADDED.CONTENT',
				'success'
			);

			if (onClose) onClose();
			ReactModalService.internal.closeModal(eventStore);
		};

		const onConfirm = async () => {
			await handleAddSidebarEventResult(eventStore, categoryId);
		};

		const triplanCategory = categoryId
			? eventStore.categories.find((c) => c.id.toString() === categoryId!.toString())
			: undefined;

		const title = triplanCategory
			? `${TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CATEGORY.TITLE')}: ${
					triplanCategory.title
			  }`
			: TranslateService.translate(eventStore, 'ADD_EVENT_MODAL.TITLE');

		// eventStore.modalValues.duration = eventStore.modalValues.duration || defaultTimedEventDuration;

		const location = initialData?.location as LocationData;
		const inputs = ReactModalService.internal.getSidebarEventInputs(eventStore, {
			...initialData,
			category: categoryId,
			location,
		});

		const content = (
			<Observer>
				{() => (
					<div
						className={getClasses(
							'flex-col gap-20 align-layout-direction react-modal bright-scrollbar',
							eventStore.isModalMinimized && 'overflow-visible modal-minimized'
						)}
						key={`add-sidebar-event-modal-${eventStore.forceUpdate}`}
					>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input, true))}
						{ReactModalService.internal.renderShowHideMore(eventStore)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		// if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(
			eventStore,
			{
				...settings,
				title,
				content,
				onConfirm,
				onCancel: () => {
					if (onClose) onClose();
					ReactModalService.internal.closeModal(eventStore);
				},
			},
			isSecondModal
		);
	},
	openEditSidebarEventModal: (
		eventStore: EventStore,
		event: SidebarEvent,
		removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>,
		addToEventsToCategories: (value: any) => void,
		modalsStore: ModalsStore,
		isSecondModal = false
	) => {
		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleEditSidebarEventResult = async (eventStore: EventStore, originalEvent: SidebarEvent) => {
			const eventId = originalEvent.id!;
			if (!eventStore) return;

			const oldEvent = eventStore.allSidebarEvents.find((e) => e.id === eventId);
			if (!oldEvent) {
				console.error('old event not found');
				return;
			}

			let {
				icon,
				title,
				duration,
				priority,
				preferredTime,
				description,
				category,
				location,
				openingHours,
				images,
				price, // add column 14
				currency,
				moreInfo,
			} = ReactModalService.internal.getModalValues(eventStore);

			let currentEvent: any = {
				title,
				id: eventId,
				icon,
				duration,
				priority: priority as TriplanPriority,
				preferredTime: preferredTime as TriplanEventPreferredTime,
				description,
				location,
				openingHours,
				images,
				category,
				moreInfo,
				price, // add column 14
				currency,
			};

			const isDurationValid = validateDuration(duration);
			if (!isDurationValid) {
				delete currentEvent.duration;
			} else {
				// duration = formatDuration(duration);
				currentEvent.duration = formatDuration(duration);
			}

			if (!title) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.TITLE_CANNOT_BE_EMPTY',
					'error'
				);
				return;
			}

			const durationChanged =
				originalEvent.duration !== currentEvent.duration.toString() &&
				!(originalEvent.duration == undefined && currentEvent.duration == defaultTimedEventDuration);
			const iconChanged =
				oldEvent.icon !== currentEvent.icon && !(oldEvent.icon == undefined && currentEvent.icon == '');
			const titleChanged = originalEvent.title !== currentEvent.title;
			const priorityChanged =
				originalEvent.priority != undefined &&
				originalEvent.priority.toString() !== currentEvent.priority.toString();
			const preferredTimeChanged =
				originalEvent.preferredTime != undefined &&
				originalEvent.preferredTime.toString() !== currentEvent.preferredTime.toString();
			const isDescriptionChanged = originalEvent.description !== currentEvent.description;
			const oldCategory = eventStore.allSidebarEvents.find((e) => e.id === event.id)!.category;
			const isCategoryChanged = oldCategory != category;
			const isLocationChanged = originalEvent.location != currentEvent.location;
			const isImagesChanged = originalEvent.images != currentEvent.images; // add column 11
			const isPriceChanged =
				originalEvent.price != currentEvent.price || originalEvent.currency != currentEvent.currency;
			const isMoreInfoChanged = originalEvent.moreInfo != currentEvent.moreInfo;
			const isChanged =
				titleChanged ||
				durationChanged ||
				iconChanged ||
				priorityChanged ||
				preferredTimeChanged ||
				isDescriptionChanged ||
				isLocationChanged ||
				isImagesChanged ||
				isPriceChanged || // add column 11
				isMoreInfoChanged;

			ReactModalService.internal.disableOnConfirm();

			if (isCategoryChanged) {
				// remove it from the old category
				const sidebarEvents = await removeEventFromSidebarById(event.id);

				// add it to the new category
				// @ts-ignore
				currentEvent = {
					...currentEvent,
					id: eventStore.createEventId(),
					category,
				};

				// @ts-ignore
				currentEvent['className'] = currentEvent.priority ? `priority-${currentEvent.priority}` : undefined;

				sidebarEvents[parseInt(category)] = sidebarEvents[parseInt(category)] || [];
				sidebarEvents[parseInt(category)].push(currentEvent);
				await eventStore.setSidebarEvents(sidebarEvents);

				addToEventsToCategories(currentEvent);

				LogHistoryService.logHistoryOnSidebarEventChangeInternal(
					eventStore,
					eventStore.tripId,
					{
						...originalEvent,
					},
					{
						...currentEvent,
					},
					Number(eventId),
					originalEvent.title
				);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_EVENT.CONTENT',
					'success'
				);
			} else if (isChanged) {
				const eventFound = eventStore.allSidebarEvents.find((e) => e.id === event.id);
				if (eventFound) {
					eventStore.updateSidebarEvent(eventFound, {
						title,
						icon,
						duration,
						priority,
						description,
						location,
						openingHours,
						images, // add column 14
						price,
						currency,
						moreInfo,
						category,
					} as SidebarEvent);
					// await eventStore.setAllEvents(eventStore.allEvents);

					const newSidebarEvents: Record<number, SidebarEvent[]> = {};
					const existingSidebarEvents = eventStore.getJSSidebarEvents();
					Object.keys(existingSidebarEvents).forEach((category) => {
						const categoryId = parseInt(category);
						newSidebarEvents[categoryId] = newSidebarEvents[categoryId] || [];
						existingSidebarEvents[categoryId].forEach((_event) => {
							if (_event.id === event.id) {
								eventStore.updateSidebarEvent(_event, {
									title,
									icon,
									duration,
									priority,
									preferredTime,
									description,
									location,
									openingHours,
									images, // add column 14
									moreInfo,
									category,
									price,
									currency,
								} as SidebarEvent);
							}
							newSidebarEvents[categoryId].push(_event);
						});
					});
					if (isCategoryChanged) {
						newSidebarEvents[Number(oldCategory)] = newSidebarEvents[Number(oldCategory)].filter(
							(_event) => _event.id !== event.id
						);
					}
					await eventStore.setSidebarEvents(newSidebarEvents);

					LogHistoryService.logHistoryOnSidebarEventChangeInternal(
						eventStore,
						eventStore.tripId,
						{
							...originalEvent,
						},
						{
							...currentEvent,
						},
						Number(eventId),
						originalEvent.title
					);

					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.UPDATED.TITLE',
						'MODALS.UPDATED_EVENT.CONTENT',
						'success'
					);
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'MODALS.EDIT_EVENT_ERROR.CONTENT',
						'error'
					);
				}
			}
		};

		// on event click - show edit event popup
		const eventId = event.id;
		const initialData = eventStore.allSidebarEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!initialData) {
			console.error('event not found');
			return;
		}

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = async () => {
			if (modalsStore?.isViewMode) {
				runInAction(() => {
					eventStore.isModalMinimized = false;
					modalsStore.switchToEditMode();
				});
				ReactModalService.openEditSidebarEventModal(
					eventStore,
					event,
					removeEventFromSidebarById,
					addToEventsToCategories,
					modalsStore
				);
			} else {
				await handleEditSidebarEventResult(eventStore, event);
				ReactModalService.internal.closeModal(eventStore);
			}
		};

		const title = modalsStore?.isViewMode
			? `${TranslateService.translate(eventStore, 'MODALS.VIEW_EVENT')}: ${event.title}`
			: `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${event.title}`;
		const inputs = ReactModalService.internal.getSidebarEventInputs(
			eventStore,
			initialData,
			modalsStore,
			true,
			Number(event.id)
		);

		const content = (
			<Observer>
				{() => (
					<div
						className={getClasses(
							'flex-col gap-20 align-layout-direction react-modal bright-scrollbar',
							// eventStore.isModalMinimized && 'overflow-visible modal-minimized',
							eventStore.isModalMinimized && 'modal-minimized',
							eventStore.isModalMinimized && !modalsStore.isViewMode && 'overflow-visible',
							modalsStore.isViewMode && 'view-mode'
						)}
						key={`edit-sidebar-event-modal-${eventStore.forceUpdate}`}
					>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input, true))}
						{ReactModalService.internal.renderShowHideMore(eventStore)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(
			eventStore,
			{
				...settings,
				confirmBtnText: modalsStore?.isViewMode
					? TranslateService.translate(eventStore, 'MODALS.EDIT')
					: TranslateService.translate(eventStore, 'MODALS.SAVE'),
				title,
				content,
				onConfirm,
				confirmBtnCssClass: eventStore.isTripLocked ? 'display-none' : 'primary-button',
			},
			isSecondModal
		);
	},
	openDuplicateSidebarEventModal: (eventStore: EventStore, event: SidebarEvent) => {
		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleDuplicateSidebarEventResult = async (eventStore: EventStore, event: SidebarEvent) => {
			if (!eventStore) return;

			let {
				icon,
				title,
				duration,
				priority,
				preferredTime,
				description,
				location,
				openingHours,
				images,
				moreInfo,
				category,
				price,
				currency, // add column 15
			} = ReactModalService.internal.getModalValues(eventStore);

			const currentEvent = {
				id: eventStore.createEventId(),
				title,
				icon,
				duration,
				priority: priority as TriplanPriority,
				preferredTime: preferredTime as TriplanEventPreferredTime,
				description,
				location,
				openingHours,
				images, // add column 15
				price,
				currency,
				moreInfo,
				category,
			} as SidebarEvent;

			const isDurationValid = validateDuration(duration);
			// const isDurationValid =
			// 	duration.split(':').length == 2 &&
			// 	!Number.isNaN(duration.split(':')[0]) &&
			// 	!Number.isNaN(duration.split(':')[1]) &&
			// 	parseInt(duration.split(':')[0]) >= 0 &&
			// 	parseInt(duration.split(':')[1]) >= 0 &&
			// 	parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1]) > 0;
			if (!isDurationValid) {
				console.error('duration is not valid');
				currentEvent.duration = defaultTimedEventDuration;
			} else {
				const hours = parseInt(duration.split(':')[0]);
				const minutes = parseInt(duration.split(':')[1]);
				const milliseconds = minutes * 60000 + hours * 3600000;
				duration = convertMsToHM(milliseconds);
				currentEvent.duration = duration;
			}

			if (!title) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.TITLE_CANNOT_BE_EMPTY',
					'error'
				);
				return;
			}

			const foundEvent = eventStore.allSidebarEvents.find((e) => e.id.toString() === event.id.toString());
			if (!foundEvent) {
				console.error('event not found');
				return;
			}

			ReactModalService.internal.disableOnConfirm();

			const existingSidebarEvents = eventStore.getJSSidebarEvents();
			existingSidebarEvents[parseInt(category)] = existingSidebarEvents[parseInt(category)] || [];
			existingSidebarEvents[parseInt(category)].push(currentEvent);
			await eventStore.setSidebarEvents(existingSidebarEvents);

			LogHistoryService.logHistory(
				eventStore,
				TripActions.duplicatedSidebarEvent,
				{},
				Number(currentEvent.id),
				event.title
			);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ADDED.TITLE',
				'MODALS.ADDED.CONTENT',
				'success'
			);
		};

		// on event click - show edit event popup
		const eventId = event.id;
		const initialData = eventStore.allSidebarEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!initialData) {
			console.error('event not found');
			return;
		}

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = async () => {
			ReactModalService.internal.disableOnConfirm();
			await handleDuplicateSidebarEventResult(eventStore, event);
			ReactModalService.internal.closeModal(eventStore);
		};

		const title = `${TranslateService.translate(eventStore, 'MODALS.DUPLICATE')}: ${event.title}`;
		const inputs = ReactModalService.internal.getSidebarEventInputs(eventStore, initialData);

		const content = (
			<Observer>
				{() => (
					<div
						className={getClasses(
							'flex-col gap-20 align-layout-direction react-modal bright-scrollbar',
							eventStore.isModalMinimized && 'overflow-visible modal-minimized'
						)}
						key={`duplicate-sidebar-event-modal-${eventStore.forceUpdate}`}
					>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input, true))}
						{ReactModalService.internal.renderShowHideMore(eventStore)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			content,
			onConfirm,
		});
	},
	openAddCalendarEventFromExistingModal: (
		eventStore: EventStore,
		addToEventsToCategories: (value: any) => void,
		info: any
	) => {
		const allSidebarEvents = eventStore.allSidebarEvents;

		const pleaseChooseActivity = () => {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.PLEASE_SELECT_EVENT',
				'error'
			);
		};

		const onConfirm = () => {
			const selectedEvent = eventStore.modalValues['sidebar-event-to-add-to-calendar'];
			const isOk = selectedEvent;

			if (isOk) {
				const initialData = allSidebarEvents.find((e) => Number(e.id) === Number(selectedEvent.value));

				if (initialData) {
					ReactModalService.openAddCalendarEventNewModal(
						eventStore,
						addToEventsToCategories,
						info,
						initialData
					);
				} else {
					pleaseChooseActivity();
				}
			} else {
				pleaseChooseActivity();
			}
		};

		const title = TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CALENDAR.TITLE');

		const options: SelectInputOption[] = allSidebarEvents.map((e) => ({ value: e.id, label: e.title }));

		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{ReactModalRenderHelper.renderSelectInput(
							eventStore,
							'sidebar-event-to-add-to-calendar',
							{
								options,
								placeholderKey: 'SELECT_SIDEBAR_EVENT_PLACEHOLDER',
								removeDefaultClass: true,
								maxMenuHeight: eventStore.isMobile ? 35 * 3 : undefined,
							},
							'add-event-from-sidebar-selector'
						)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			content,
			onConfirm,
			onCancel: () => {
				if (eventStore.allSidebarEvents.length === 0) {
					ReactModalService.openAddCalendarEventModal(eventStore, addToEventsToCategories, info);
				} else {
					ReactModalService.internal.closeModal(eventStore);
				}
			},
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SELECT'),
			customClass: getClasses('triplan-add-calendar-event-from-existing', settings.customClass),
		});
	},
	openAddCalendarEventFromHotelsModal: (
		eventStore: EventStore,
		addToEventsToCategories: (value: any) => void,
		info: any
	) => {
		const arr = eventStore.allEventsComputed.filter((x) =>
			isHotelsCategory(eventStore.categories.find((y) => y.id.toString() === x.category.toString())!)
		);

		const uniqueHotels: Record<string, SidebarEvent | CalendarEvent> = {};
		arr.forEach((x) => {
			uniqueHotels[x.title] = x;
		});

		const allHotels = Object.values(uniqueHotels);

		const pleaseChooseHotel = () => {
			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ERROR.TITLE',
				'MODALS.ERROR.PLEASE_SELECT_HOTEL',
				'error'
			);
		};

		const onConfirm = () => {
			const selectedEvent = eventStore.modalValues['sidebar-hotel-to-add-to-calendar'];
			const isOk = selectedEvent;

			if (isOk) {
				const initialData = allHotels.find((e) => Number(e.id) === Number(selectedEvent.value));

				if (initialData) {
					// create a new id to avoid deleting the hotel from the sidebar.
					initialData.id = eventStore.createEventId();

					// @ts-ignore
					delete initialData.start;

					// @ts-ignore
					delete initialData.end;

					ReactModalService.openAddCalendarEventNewModal(
						eventStore,
						addToEventsToCategories,
						info,
						initialData
					);
				} else {
					pleaseChooseHotel();
				}
			} else {
				pleaseChooseHotel();
			}
		};

		const title = TranslateService.translate(eventStore, 'MODALS.ADD_HOTEL_TO_CALENDAR.TITLE');

		const options: SelectInputOption[] = allHotels.map((e) => ({ value: e.id, label: e.title }));

		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{ReactModalRenderHelper.renderSelectInput(
							eventStore,
							'sidebar-hotel-to-add-to-calendar',
							{
								options,
								placeholderKey: 'SELECT_HOTEL_PLACEHOLDER',
								removeDefaultClass: true,
								maxMenuHeight: eventStore.isMobile ? 35 * 3 : undefined,
							},
							'add-hotel-from-sidebar-selector'
						)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			content,
			onConfirm,
			onCancel: () => {
				// ReactModalService.internal.closeModal(eventStore);
				if (eventStore.allSidebarEvents.length === 0) {
					ReactModalService.openAddCalendarEventModal(eventStore, addToEventsToCategories, info);
				} else {
					ReactModalService.internal.closeModal(eventStore);
				}
			},
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SELECT'),
			customClass: getClasses('triplan-add-calendar-event-from-existing', settings.customClass),
		});
	},
	openAddCalendarEventModal: (eventStore: EventStore, addToEventsToCategories: (value: any) => void, info: any) => {
		const title = TranslateService.translate(eventStore, 'MODALS.ADD_TO_CALENDAR.TITLE');

		// if there are no sidebar events - open add new calendar modal.
		if (eventStore.allSidebarEvents.length === 0) {
			return ReactModalService.openAddCalendarEventNewModal(eventStore, addToEventsToCategories, info);
		}

		const hotels = eventStore.allEventsComputed.filter((x) =>
			isHotelsCategory(eventStore.categories.find((y) => y.id.toString() === x.category.toString())!)
		);

		const content = (
			<Observer>
				{() => (
					<div className="add-calendar-event-modal-choose-where">
						<Button
							flavor={ButtonFlavor.secondary}
							// className={className}
							onClick={() =>
								ReactModalService.openAddCalendarEventFromExistingModal(
									eventStore,
									addToEventsToCategories,
									info
								)
							}
							text={TranslateService.translate(eventStore, 'MODALS.ADD_CALENDAR_EVENT.ADD_FROM_EXISTING')}
						/>
						<Button
							flavor={ButtonFlavor.secondary}
							// className={className}
							onClick={() =>
								ReactModalService.openAddCalendarEventNewModal(
									eventStore,
									addToEventsToCategories,
									info
								)
							}
							text={TranslateService.translate(eventStore, 'MODALS.ADD_CALENDAR_EVENT.ADD_NEW')}
						/>
						{!!hotels.length && (
							<Button
								flavor={ButtonFlavor.secondary}
								// className={className}
								onClick={() =>
									ReactModalService.openAddCalendarEventFromHotelsModal(
										eventStore,
										addToEventsToCategories,
										info
									)
								}
								text={TranslateService.translate(eventStore, 'MODALS.ADD_CALENDAR_EVENT.ADD_HOTEL')}
							/>
						)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) {
			settings.customClass += ' slide-up';
		}
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			content,
			// onConfirm,
			// showCancel: false,
			showConfirm: false,
		});
	},
	openAddCalendarEventNewModal: (
		eventStore: EventStore,
		addToEventsToCategories: (value: any) => void,
		info: any,
		sidebarEventData?: SidebarEvent
	) => {
		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleAddCalendarEventResult = async (eventStore: EventStore) => {
			if (!eventStore) return true;

			let {
				icon,
				title,
				priority,
				preferredTime,
				description,
				category: categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
				price,
				currency, // add column 16
			} = ReactModalService.internal.getModalValues(eventStore);

			const currentEvent = {
				id: eventStore.createEventId(),
				title,
				icon,
				priority: priority as TriplanPriority,
				preferredTime: preferredTime as TriplanEventPreferredTime,
				description,
				start: new Date(startDate),
				end: new Date(endDate),
				category: categoryId,
				className: priority ? `priority-${priority}` : undefined,
				allDay: info.allDay,
				location,
				openingHours,
				images,
				moreInfo, // add column 16
				price,
				currency,
			} as CalendarEvent;

			// @ts-ignore
			const millisecondsDiff = currentEvent.end - currentEvent.start;
			currentEvent.duration = convertMsToHM(millisecondsDiff);

			if (!_validateCalendarEventRequiredConditions(eventStore, startDate, endDate, title, categoryId)) {
				return false;
			}

			ReactModalService.internal.disableOnConfirm();

			await eventStore.setCalendarEvents([...eventStore.getJSCalendarEvents(), currentEvent]);
			addToEventsToCategories(currentEvent);

			// if we got sidebarEventData it means we're trying to add already existing event to the calendar.
			// (it could be either by clicking on the calendar and choosing 'add from existing' or trying to add from the map)
			// in this case, after we added it to calendar, we need to remove it from sidebar.
			if (sidebarEventData) {
				const newSidebarEvents = eventStore.getJSSidebarEvents();
				Object.keys(newSidebarEvents).forEach((category) => {
					newSidebarEvents[Number(category)] = newSidebarEvents[Number(category)].filter(
						(e) => e.id !== initialData.id
					);
				});
				await eventStore.setSidebarEvents(newSidebarEvents);
			}

			const categoryName =
				sidebarEventData && sidebarEventData.category
					? eventStore.categories.find((c) => c.id == Number(sidebarEventData.category))?.title
					: undefined;

			// log history
			LogHistoryService.logHistory(
				eventStore,
				sidebarEventData
					? categoryName && isHotel(categoryName, sidebarEventData.title)
						? TripActions.addedHotelCalendarEventFromExisting
						: TripActions.addedCalendarEventFromExisting
					: TripActions.addedNewCalendarEvent,
				{
					eventName: currentEvent.title,
					toWhereStart: currentEvent.start,
					toWhereEnd: currentEvent.end,
				},
				Number(currentEvent.id),
				currentEvent.title
			);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ADDED.TITLE',
				'MODALS.ADDED.CONTENT',
				'success'
			);

			return true;
		};

		const initialData = {
			start: info.start,
			end: info.end,
			allDay: info.allDay,
			...info.extendedProps,
			...sidebarEventData,
		};

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = async () => {
			const isOk = await handleAddCalendarEventResult(eventStore);
			if (isOk) {
				ReactModalService.internal.closeModal(eventStore);
			}
		};

		const title = TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CALENDAR.TITLE');
		const inputs = ReactModalService.internal.getCalendarEventInputs(eventStore, initialData);

		const content = (
			<Observer>
				{() => (
					<div
						className={getClasses(
							'flex-col gap-20 align-layout-direction react-modal bright-scrollbar',
							// eventStore.isModalMinimized && 'overflow-visible modal-minimized'
							eventStore.isModalMinimized && 'modal-minimized'
						)}
						key={`add-calendar-event-modal-new-${eventStore.forceUpdate}`}
					>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input, true))}
						{ReactModalService.internal.renderShowHideMore(eventStore)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			title,
			content,
			onConfirm,
			onCancel: () => {
				// if sidebarEventData passed means we got here directly from map / from place we wanted to add a specific event.
				// go back to add calendar event modal only if:
				// 1 - there are any sidebar events to choose from
				// 2 - we didn't get specific sidebar event data
				if (eventStore.allSidebarEvents.length !== 0 && !sidebarEventData) {
					ReactModalService.openAddCalendarEventModal(eventStore, addToEventsToCategories, info);
				} else {
					ReactModalService.internal.closeModal(eventStore);
				}
			},
		});
	},

	// ERROR HANDLING: todo add try/catch & show a message if fails
	openDeleteCategoryModal: (eventStore: EventStore, categoryId: number) => {
		const newCategories = eventStore.categories.filter((c) => c.id != categoryId);
		const newCalendarEvents = eventStore.calendarEvents.filter(
			(c) => c.category.toString() !== categoryId.toString()
		);
		const newAllEvents = eventStore.allEventsComputed.filter((c) => c.category != categoryId.toString());
		const newSidebarEvents = eventStore.getJSSidebarEvents();
		delete newSidebarEvents[categoryId];

		const categoryName = eventStore.categories.find((c) => c.id.toString() === categoryId.toString())!.title;

		// ERROR HANDLING: todo add try/catch & show a message if fails
		const onConfirm = async () => {
			ReactModalService.internal.disableOnConfirm();

			// delete from sidebar
			await eventStore.setSidebarEvents(newSidebarEvents);

			// delete from categories
			await eventStore.setCategories([...newCategories], false);

			// delete from calendar
			if (newCalendarEvents.length === 0) {
				eventStore.allowRemoveAllCalendarEvents = true;
			}
			await eventStore.setCalendarEvents([...newCalendarEvents]);

			// log history
			LogHistoryService.logHistory(eventStore, TripActions.deletedCategory, {
				categoryName,
				totalAffectedCalendar,
				totalAffectedSidebar,
			});

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.DELETED.TITLE',
				'MODALS.DELETED.CATEGORY.CONTENT',
				'success'
			);

			ReactModalService.internal.closeModal(eventStore);
		};

		const totalAffectedSidebar =
			Object.values(eventStore.getJSSidebarEvents()).flat().length -
			Object.values(newSidebarEvents).flat().length;

		const totalAffectedCalendar = eventStore.calendarEvents.length - newCalendarEvents.length;

		const totalAffected = eventStore.allEventsComputed.length - newAllEvents.length;

		const html = [
			TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT'),
			'',
			TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT.IT_WILL_AFFECT'),
			'<ul>' +
				[
					`<li>${totalAffectedCalendar} ${TranslateService.translate(eventStore, 'CALENDAR_EVENTS')}</li>`,
					`<li>${totalAffectedSidebar} ${TranslateService.translate(eventStore, 'SIDEBAR_EVENTS')}</li>`,
					`<li>${totalAffected} ${TranslateService.translate(eventStore, 'TOTAL_EVENTS')}</li>`,
				].join('') +
				'</ul>',
		].join('<br/>');

		if (totalAffected == 0) {
			onConfirm();
		} else {
			ReactModalService.internal.openModal(eventStore, {
				...getDefaultSettings(eventStore),
				title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${categoryName}`,
				content: <div dangerouslySetInnerHTML={{ __html: html }} />,
				cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
				confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
				confirmBtnCssClass: 'primary-button red',
				onConfirm,
			});
		}
	},

	// ERROR HANDLING: todo add try/catch & show a message if fails
	openEditCategoryModal: (TriplanCalendarRef: any, eventStore: EventStore, categoryId: number) => {
		const category = eventStore.categories.find((c) => c.id.toString() === categoryId.toString());
		if (!category) return;
		const categoryName = category.title;

		const { icon: defaultGoogleMapIcon } = getIcon(eventStore, {
			category: categoryId,
			priority: TriplanPriority.unset,
			title: categoryName,
		});

		const onConfirm = async () => {
			const oldIcon = category.icon;
			const oldName = categoryName;
			const oldOrder = eventStore.categories.findIndex((c) => c.id.toString() === categoryId.toString());

			// @ts-ignore
			const newIcon = eventStore.modalValues.icon?.label;

			// @ts-ignore
			const newName = eventStore.modalValues.name;

			// @ts-ignore
			const order = eventStore.modalValues.categoryOrder?.value ?? eventStore.modalValues.categoryOrder;

			let isOk = true;

			// validate not already exist
			if (!newName || newName.length === 0) {
				isOk = false;
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.CATEGORY_NAME_CANT_BE_EMPTY',
					'error'
				);
				return;
			} else if (eventStore.categories.find((c) => c.title === newName && c.id != categoryId)) {
				isOk = false;
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST',
					'error'
				);
				return;
			}

			// @ts-ignore
			const newGoogleMapIcon = eventStore.modalValues.googleMapIcon;
			const oldGoogleMapIcon = category.googleMapIcon;

			const iconChanged = oldIcon !== newIcon;
			const titleChanged = oldName !== newName;
			const orderChanged = oldOrder !== order;
			const googleMapIconChanged = newGoogleMapIcon && oldGoogleMapIcon !== newGoogleMapIcon;
			const isChanged = titleChanged || iconChanged || orderChanged || googleMapIconChanged;

			if (isChanged) {
				// validate title not already exist
				if (eventStore.categories.find((c) => c.id !== categoryId && c.title === newName)) {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'MODALS.ERROR.CATEGORY_NAME_ALREADY_EXIST',
						'error'
					);
					return;
				}

				ReactModalService.internal.disableOnConfirm();

				const newCategories = eventStore.categories.filter((c) => c.id !== categoryId);
				newCategories.splice(order.value, 0, {
					id: categoryId,
					title: newName,
					icon: newIcon,
					googleMapIcon: newGoogleMapIcon || oldGoogleMapIcon,
				});

				await eventStore.setCategories(newCategories, false);

				// update our store
				const updatedCalenderEvents = [...eventStore.getJSCalendarEvents()];
				updatedCalenderEvents.forEach((e) => {
					const event = eventStore.allEventsComputed.find((ev) => ev.id!.toString() === e.id!.toString());
					if (event && event.category && event.category === categoryId.toString()) {
						if (e.icon === oldIcon) {
							e.icon = newIcon;
						}
					}
				});

				await eventStore.setCalendarEvents([...updatedCalenderEvents]);

				// remove from fullcalendar store
				TriplanCalendarRef.current?.refreshSources();

				const diff: Record<string, any> = {};
				if (iconChanged) {
					diff['icon'] = {
						was: oldIcon,
						now: newIcon,
					};
				}
				if (titleChanged) {
					diff['title'] = {
						was: oldName,
						now: newName,
					};
				}
				if (googleMapIconChanged) {
					diff['googleMapIcon'] = {
						was: iconToName(oldGoogleMapIcon),
						now: iconToName(newGoogleMapIcon),
					};
				}
				if (orderChanged) {
					diff['order'] = {
						was: oldOrder,
						now: order,
					};
				}

				diff['categoryName'] = oldName;

				LogHistoryService.logHistory(eventStore, TripActions.changedCategory, diff);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_CATEGORY.CONTENT',
					'success'
				);
			}
			if (isOk) {
				ReactModalService.internal.closeModal(eventStore);
			}
		};

		const inputs = [
			{
				settings: {
					modalValueName: 'icon',
					type: 'icon-selector',
					extra: {
						id: 'new-icon',
						value: category.icon,
					},
				},
				textKey: 'MODALS.ICON',
				className: 'border-top-gray',
			},
			{
				settings: {
					modalValueName: 'googleMapIcon',
					type: 'google-map-icon-selector',
					extra: {
						value: category.googleMapIcon || defaultGoogleMapIcon,
					},
				},
				textKey: 'GOOGLE_MAP_ICON',
				className: 'border-top-gray',
			},
			{
				settings: {
					modalValueName: 'name',
					type: 'text',
					extra: {
						placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
						id: 'new-name',
						value: category.title,
					},
				},
				textKey: 'MODALS.TITLE',
				className: 'border-top-gray border-bottom-gray padding-bottom-20',
			},
			{
				settings: {
					modalValueName: 'categoryOrder',
					ref: eventStore.modalValuesRefs['categoryOrder'],
					type: 'select',
					extra: {
						id: 'category-order',
						placeholderKey: 'MODALS.CATEGORY.SHOW_AFTER',
						value: eventStore.categories.findIndex((c) => c.id == category.id),
					},
					options: [
						...eventStore.categories.map((c, idx) => ({
							value: idx,
							label:
								idx > 0
									? eventStore.categories[idx - 1].title
									: TranslateService.translate(eventStore, 'PUSH_TO_START'),
						})),
					],
					wrapperClassName: 'category-order-selector',
				},
				textKey: 'MODALS.CATEGORY.SHOW_AFTER',
				className: 'border-top-gray border-bottom-gray padding-bottom-20',
			},
		];
		const content = (
			<Observer>
				{() => (
					<div className="flex-col gap-20 align-layout-direction react-modal bright-scrollbar">
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(
				eventStore,
				'EDIT_CATEGORY_MODAL.TITLE.EDIT_CATEGORY'
			)}: ${categoryName}`,
			type: 'controlled',
			onConfirm,
			content,
		});
	},

	// todo: make flights and hotels un-deletable categories.
	// todo: maybe add special properties to hotels and flights.
	//  hotels - checkin and checkout dates? (and then it's scheduling it automatically)
	//  flights - arrival, landing, how much time ahead do you want to be, and then it's scheduling it automatically
	// todo: list of already reserved activities and hotels
	// todo: the ability to keep a list of booking confirmations within the app will be amazing
	// todo complete: add tasks block to view/edit tasks (both sidebar and calendar)
	openEditCalendarEventModal: (
		eventStore: EventStore,
		addEventToSidebar: (event: SidebarEvent) => boolean,
		info: any,
		modalsStore: ModalsStore,
		isSecondModal = false
	) => {
		ReactModalService.internal.resetWindowVariables(eventStore);

		// on event click - show edit event popup
		const eventId = info.event.id;
		const found = eventStore.calendarEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!found) {
			console.error('event not found');
			return;
		}
		if (!eventStore.distanceSectionAutoOpened) {
			eventStore.setSelectedEventForNearBy(found);
		}

		const currentEvent = { ...found };

		// for handle delete - to be able to say to which category this activity will return to
		const categoryName =
			eventStore.categories.find((x) => x.id.toString() == currentEvent?.category.toString())?.title ?? 'N/A';

		const handleDeleteEventResult = (
			currentEvent: CalendarEvent,
			addEventToSidebar: (event: SidebarEvent) => boolean,
			isDeleteComplete: boolean = false
		) => {
			const original = eventStore.calendarEvents.find((e: any) => e.id.toString() === eventId.toString());

			ReactModalService.openConfirmModal(
				eventStore,
				async () => {
					// add back to sidebar
					if (addEventToSidebar(currentEvent)) {
						ReactModalService.internal.disableOnConfirm();

						// remove from calendar
						eventStore.allowRemoveAllCalendarEvents = true;
						await eventStore.deleteEvent(eventId);

						LogHistoryService.logHistory(
							eventStore,
							TripActions.deletedCalendarEvent,
							{
								was: original,
							},
							eventId,
							currentEvent.title
						);

						// refreshSources();

						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.REMOVED_FROM_CALENDAR.TITLE',
							'MODALS.REMOVED_FROM_CALENDAR.CONTENT',
							'success'
						);

						ReactModalService.internal.closeModal(eventStore);
					} else {
						ReactModalService.internal.openOopsErrorModal(eventStore);
						return;
					}
				},
				'MODALS.REMOVE_EVENT_FROM_CALENDAR.TITLE',
				isDeleteComplete
					? 'MODALS.REMOVE_EVENT_FROM_CALENDAR_COMPLETELY.CONTENT'
					: 'MODALS.REMOVE_EVENT_FROM_CALENDAR.CONTENT',
				undefined,
				{
					X: categoryName,
				}
			);
		};

		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleEditEventResult = async (
			eventStore: EventStore,
			addEventToSidebar: (event: SidebarEvent) => boolean,
			originalEvent: EventInput
		) => {
			const eventId = originalEvent.id!;
			if (!eventStore) return;

			const oldEvent = eventStore.allEventsComputed.find((e) => e.id!.toString() === eventId.toString());
			if (!oldEvent) {
				console.error('old event not found');
				ReactModalService.internal.openOopsErrorModal(eventStore);
				return false;
			}

			let {
				icon,
				title,
				priority,
				preferredTime,
				description,
				category: categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
				price,
				currency, // add column 16
			} = ReactModalService.internal.getModalValues(eventStore);

			// @ts-ignore
			const locationText = location?.address;
			const prevLocationText = originalEvent.location?.address;

			let currentEvent: CalendarEvent = {
				title,
				start: new Date(startDate),
				end: new Date(endDate),
				id: eventId,
				icon,
				priority: priority as TriplanPriority,
				allDay: originalEvent.allDay,
				preferredTime: preferredTime as TriplanEventPreferredTime,
				description,
				images,
				moreInfo, // add column 16
				price,
				currency,
				category: categoryId,
				location,
			};

			// written like this since otherwise, editing without changing anything will reset location to nothing
			// since window.selectedLocation being reset on each modal open.
			if (locationText != prevLocationText) {
				currentEvent['location'] = location;
			}

			if (location) {
				currentEvent['openingHours'] = openingHours;
			}

			// @ts-ignore
			const millisecondsDiff = currentEvent.end - currentEvent.start;
			currentEvent.duration = convertMsToHM(millisecondsDiff);

			if (!_validateCalendarEventRequiredConditions(eventStore, startDate, endDate, title, categoryId)) {
				return false;
			}

			const durationChanged =
				originalEvent.start!.toString() !== currentEvent.start.toString() ||
				(originalEvent.end && originalEvent.end.toString() !== currentEvent.end.toString());
			const iconChanged = oldEvent.icon !== currentEvent.icon;
			const titleChanged = originalEvent.title !== currentEvent.title;
			const priorityChanged = originalEvent.priority !== currentEvent.priority;
			const preferredTimeChanged = originalEvent.preferredTime !== currentEvent.preferredTime;
			const descriptionChanged = originalEvent.description !== currentEvent.description;
			const isLocationChanged =
				JSON.stringify(originalEvent.location ?? {}) != JSON.stringify(currentEvent.location ?? {});
			const oldCategory = eventStore.calendarEvents.find((e) => e.id === eventId)!.category;
			const isCategoryChanged = oldCategory != categoryId;
			const isOpeningHoursChanged = currentEvent.openingHours;
			const isImagesChanged = originalEvent.images != currentEvent.images; // add column 12
			const isPriceChanged =
				originalEvent.price != currentEvent.price || originalEvent.currency != currentEvent.currency;

			const isMoreInfoChanged = originalEvent.moreInfo != currentEvent.moreInfo;

			const updates: string[] = [];
			if (titleChanged) updates.push('title');
			if (durationChanged) updates.push('duration');
			if (iconChanged) updates.push('icon');
			if (priorityChanged) updates.push('priority');
			if (preferredTimeChanged) updates.push('preferredTime');
			if (descriptionChanged) updates.push('description');
			if (isLocationChanged) updates.push('location');
			if (isOpeningHoursChanged) updates.push('openingHours');
			if (isImagesChanged) updates.push('images');
			if (isMoreInfoChanged) updates.push('moreInfo');
			if (isPriceChanged) {
				updates.push('price');
				updates.push('currency');
			} // add column 12

			const isChanged = updates.length > 0;
			const canBeMultiChanged =
				titleChanged ||
				iconChanged ||
				priorityChanged ||
				preferredTimeChanged ||
				descriptionChanged ||
				isLocationChanged ||
				isOpeningHoursChanged ||
				isImagesChanged ||
				isMoreInfoChanged ||
				isPriceChanged; // add column 12

			ReactModalService.internal.disableOnConfirm();

			const _actuallyUpdate = async (
				isHotel: boolean = false,
				otherInstances: (SidebarEvent | CalendarEvent)[] | undefined = undefined
			) => {
				const isUpdated = await eventStore.changeEvent({
					event: {
						id: eventId,
						title: currentEvent.title,
						allDay: currentEvent.allDay,
						start: currentEvent.start,
						end: currentEvent.end,
						icon: currentEvent.icon,
						priority: currentEvent.priority,
						preferredTime: currentEvent.preferredTime,
						description: currentEvent.description,
						location: currentEvent.location,
						openingHours: currentEvent.openingHours,
						category: categoryId,
						images: currentEvent.images, // add column 13
						price: currentEvent.price,
						currency: currentEvent.currency,
						moreInfo: currentEvent.moreInfo,
					},
				});

				let updateCount = 1;
				if (otherInstances) {
					const baseUpdateEvent: Record<string, any> = {};
					updates.forEach((key) => {
						if (key !== 'duration') {
							// @ts-ignore
							baseUpdateEvent[key] = currentEvent[key];
						}
					});

					for (const event of otherInstances) {
						if (
							await eventStore.changeEvent({
								event: {
									...event,
									...baseUpdateEvent,
								},
							})
						) {
							updateCount++;
						}
					}
				}

				if (isUpdated) {
					let title = 'MODALS.UPDATED.TITLE.FEMALE';
					let content = 'MODALS.UPDATED_EVENT.CONTENT';
					let contentParams;

					if (isHotel) {
						title = 'MODALS.UPDATED.TITLE';
						content = 'MODALS.UPDATED_HOTEL.CONTENT';

						if (otherInstances) {
							title = 'MODALS.UPDATED.TITLE.PLURAL';
							content = 'MODALS.UPDATED_HOTELS.CONTENT';
							contentParams = {
								X: updateCount,
							};
						}
					}

					let originalStart = originalEvent.start;
					try {
						originalStart = formatFromISODateString((originalEvent.start as Date).toISOString(), false);
					} catch {}

					let originalEnd = originalEvent.end;
					try {
						originalEnd = formatFromISODateString((originalEvent.end as Date).toISOString(), false);
					} catch {}

					let currentStart: any = currentEvent.start;
					try {
						currentStart = formatFromISODateString((currentEvent.start as Date).toISOString(), false);
					} catch {}

					let currentEnd: any = currentEvent.end;
					try {
						currentEnd = formatFromISODateString((currentEvent.end as Date).toISOString(), false);
					} catch {}
					LogHistoryService.logHistoryOnEventChangeInternal(
						eventStore,
						eventStore.tripId,
						{
							...originalEvent,
							start: originalStart,
							end: originalEnd,
						},
						{
							...currentEvent,
							start: currentStart,
							end: currentEnd,
						},
						Number(eventId),
						originalEvent.title
					);

					ReactModalService.internal.alertMessage(eventStore, title, content, 'success', contentParams);
				} else {
					let title = 'MODALS.EDIT_EVENT_ERROR.CONTENT';
					if (isHotel) {
						title = 'MODALS.EDIT_HOTEL_ERROR.CONTENT';
						if (otherInstances) {
							title = 'MODALS.EDIT_HOTELS_ERROR.CONTENT';
						}
					}

					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'MODALS.EDIT_EVENT_ERROR.CONTENT',
						'error'
					);
				}
			};

			if (isCategoryChanged) {
				// add it to the new category
				// @ts-ignore
				currentEvent = {
					...currentEvent,
					id: eventStore.createEventId(),
					category: categoryId,
				} as unknown;

				// @ts-ignore
				currentEvent['className'] = currentEvent.priority ? `priority-${currentEvent.priority}` : undefined;

				await eventStore.setCalendarEvents([
					...eventStore.calendarEvents.filter((x) => x.id !== eventId),
					currentEvent,
				]);

				let originalStart = originalEvent.start;
				try {
					originalStart = formatFromISODateString((originalEvent.start as Date).toISOString(), false);
				} catch {}

				let originalEnd = originalEvent.end;
				try {
					originalEnd = formatFromISODateString((originalEvent.end as Date).toISOString(), false);
				} catch {}

				let currentStart: any = currentEvent.start;
				try {
					currentStart = formatFromISODateString((currentEvent.start as Date).toISOString(), false);
				} catch {}

				let currentEnd: any = currentEvent.end;
				try {
					currentEnd = formatFromISODateString((currentEvent.end as Date).toISOString(), false);
				} catch {}
				LogHistoryService.logHistoryOnEventChangeInternal(
					eventStore,
					eventStore.tripId,
					{
						...originalEvent,
						start: originalStart,
						end: originalEnd,
					},
					{
						...currentEvent,
						start: currentStart,
						end: currentEnd,
					},
					Number(eventId),
					originalEvent.title
				);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_EVENT.CONTENT',
					'success'
				);
			} else if (isChanged) {
				const currentCategory = eventStore.categories.find((c) => c.id.toString() === categoryId.toString())!;
				const allOtherInstances = eventStore.allEventsComputed.filter(
					(x) => x.category == categoryId && x.title.includes(oldEvent.title) && x.id !== oldEvent.id
				);

				if (isHotelsCategory(currentCategory) && allOtherInstances.length >= 1 && canBeMultiChanged) {
					ReactModalService.internal.openModal(
						eventStore,
						{
							...getDefaultSettings(eventStore),
							title: TranslateService.translate(eventStore, 'SHOULD_UPDATE_ALL.TITLE'),
							content:
								allOtherInstances.length == 1
									? TranslateService.translate(eventStore, 'SHOULD_UPDATE_ALL.CONTENT.SINGLE', {
											Y: TranslateService.translate(eventStore, 'HOTEL'),
									  })
									: TranslateService.translate(eventStore, 'SHOULD_UPDATE_ALL.CONTENT', {
											X: allOtherInstances.length,
											Y: TranslateService.translate(eventStore, 'HOTEL'),
									  }),
							confirmBtnText: TranslateService.translate(eventStore, 'NO.ONLY_THIS_INSTANCE'),
							cancelBtnText: TranslateService.translate(eventStore, 'GENERAL.YES'),
							confirmBtnCssClass: 'primary-button',
							onCancel: async () => {
								ReactModalService.internal.closeModal(eventStore);
								// alert('all!');
								await _actuallyUpdate(true, allOtherInstances);
								ReactModalService.internal.closeModal(eventStore);
							},
							onConfirm: async () => {
								// alert('only this one!');
								ReactModalService.internal.closeModal(eventStore);
								await _actuallyUpdate(true);
								ReactModalService.internal.closeModal(eventStore);
								// ReactModalService.internal.closeModal(eventStore);
							},
						},
						true
					);

					return false;
				} else {
					await _actuallyUpdate();
				}
			}
			return true;
		};

		// ERROR HANDLING: todo add try/catch & show a message if fails
		const handleDuplicateEventResult = async (eventStore: EventStore, originalEvent: CalendarEvent) => {
			ReactModalService.internal.disableOnConfirm();

			let newEvent = Object.assign({}, originalEvent);
			const newId = eventStore.createEventId();
			newEvent.id = newId;

			// @ts-ignore
			newEvent.start = originalEvent.start;

			// console.log("original", JSON.parse(JSON.stringify(originalEvent)), "new", newEvent);

			// update calendar events
			await eventStore.setCalendarEvents([...eventStore.calendarEvents, newEvent]);

			LogHistoryService.logHistory(
				eventStore,
				TripActions.duplicatedCalendarEvent,
				{},
				eventId,
				currentEvent.title
			);

			// update all events
			// @ts-ignore
			// await eventStore.setAllEvents([...eventStore.allEvents, newEvent]);
		};

		const onDeleteCompleteClick = () => {
			handleDeleteEventResult(currentEvent as unknown as CalendarEvent, () => true, true);
		};

		const onDeleteClick = () => {
			handleDeleteEventResult(currentEvent as unknown as CalendarEvent, addEventToSidebar);
		};

		const onDuplicateClick = async () => {
			ReactModalService.internal.disableOnConfirm();
			const calendarEvent = eventStore.calendarEvents.find((e: any) => e.id.toString() === eventId.toString());
			await handleDuplicateEventResult(eventStore, calendarEvent as CalendarEvent);
			ReactModalService.internal.closeModal(eventStore);
		};

		const onConfirm = async () => {
			if (modalsStore?.isViewMode) {
				runInAction(() => {
					eventStore.isModalMinimized = false;
					modalsStore.switchToEditMode();
				});
				ReactModalService.openEditCalendarEventModal(eventStore, addEventToSidebar, info, modalsStore);
			} else {
				const event = {
					...info.event._def,
					id: info.event._def.publicId,
					...info.event,
					...info.event.extendedProps,
					start: new Date(info.event.start),
					end: new Date(info.event.end),
				};

				const isOk = await handleEditEventResult(eventStore, addEventToSidebar, event);
				if (isOk) {
					ReactModalService.internal.closeModal(eventStore);
				}
			}
		};

		const initialData = {
			// ...info.event._def,
			// ...info.event.extendedProps,
			...found,
			start: info.event.start,
			end: info.event.end,
			allDay: info.event.allDay,
		};

		// @ts-ignore
		window.selectedLocation = initialData.location ?? currentEvent.location;

		// @ts-ignore
		window.openingHours = initialData.openingHours ?? currentEvent.openingHours;

		// @ts-ignore
		eventStore.modalValues['selectedLocation'] = window.selectedLocation;
		eventStore.modalValues['openingHours'] = currentEvent.openingHours;

		const title = modalsStore?.isViewMode
			? `${TranslateService.translate(eventStore, 'MODALS.VIEW_EVENT')}: ${info.event.title}`
			: `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${info.event.title}`;

		const inputs = ReactModalService.internal.getCalendarEventInputs(
			eventStore,
			initialData,
			modalsStore,
			true,
			info.event.id
		);

		if (!eventStore.isTripLocked) {
			inputs.push({
				settings: {
					modalValueName: 'irrelevant',
					type: 'custom-group',
					extra: {
						customGroupClassName: 'actions flex-column',
						content: [
							{
								settings: {
									type: 'button',
									extra: {
										onClick: onDeleteCompleteClick,
										flavor: ButtonFlavor.primary,
										className: 'red',
									},
								},
								textKey: 'MODALS.REMOVE_EVENT_COMPLETELY',
								// className: 'border-top-gray'
							},
							{
								settings: {
									type: 'button',
									extra: {
										onClick: onDeleteClick,
										flavor: ButtonFlavor.primary,
										className: 'red',
									},
								},
								textKey: 'MODALS.REMOVE_EVENT_FROM_CALENDAR',
								// className: 'border-top-gray'
							},
							{
								settings: {
									type: 'button',
									extra: {
										onClick: onDuplicateClick,
										flavor: ButtonFlavor.secondary,
										className: 'black',
									},
								},
								textKey: 'MODALS.DUPLICATE_EVENT',
								// className: 'border-top-gray'
							},
						],
					},
				},
				textKey: 'MODALS.ACTIONS',
				className: 'border-top-gray actions-row',
			} as any);
		}

		const content = (
			<Observer>
				{() => (
					<div
						className={getClasses(
							'flex-col gap-20 align-layout-direction react-modal bright-scrollbar',
							// eventStore.isModalMinimized && 'overflow-visible modal-minimized',
							eventStore.isModalMinimized && 'modal-minimized',
							eventStore.isModalMinimized && !modalsStore.isViewMode && 'overflow-visible',
							modalsStore.isViewMode && 'view-mode'
						)}
						key={`add-calendar-event-modal-existing-${eventStore.forceUpdate}`}
					>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input, true))}
						{ReactModalService.internal.renderShowHideMore(eventStore)}
					</div>
				)}
			</Observer>
		);

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(
			eventStore,
			{
				...settings,
				title,
				confirmBtnText: modalsStore?.isViewMode
					? TranslateService.translate(eventStore, 'MODALS.EDIT')
					: TranslateService.translate(eventStore, 'MODALS.SAVE'),
				content,
				onConfirm,
				confirmBtnCssClass: eventStore.isTripLocked ? 'display-none' : 'primary-button',
			},
			isSecondModal
		);
	},
	openDeleteSidebarEventModal: (
		eventStore: EventStore,
		removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>,
		event: SidebarEvent,
		isSecondModal = false
	) => {
		ReactModalService.internal.openModal(
			eventStore,
			{
				...getDefaultSettings(eventStore),
				title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${event.title}`,
				content: (
					<div
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MODALS.DELETE_SIDEBAR_EVENT.CONTENT'),
						}}
					/>
				),
				cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
				confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
				confirmBtnCssClass: 'primary-button red',

				// ERROR HANDLING: todo add try/catch & show a message if fails
				onConfirm: async () => {
					ReactModalService.internal.disableOnConfirm();

					await removeEventFromSidebarById(event.id);
					// await eventStore.setAllEvents(eventStore.allEventsComputed.filter((x) => x.id !== event.id));

					LogHistoryService.logHistory(
						eventStore,
						TripActions.deletedSidebarEvent,
						{
							was: event,
							eventName: event.title,
						},
						Number(event.id),
						event.title
					);

					ReactModalService.internal.closeModal(eventStore);
				},
			},
			isSecondModal
		);
	},
	openConfirmModalContent: (
		eventStore: EventStore,
		callback: () => void,
		titleKey = 'MODALS.ARE_YOU_SURE',
		content: () => React.ReactNode,
		continueKey = 'MODALS.CONTINUE',
		confirmBtnCssClass?: string
	) => {
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, titleKey)}`,
			content,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, continueKey),
			confirmBtnCssClass: getClasses('primary-button', confirmBtnCssClass),
			onConfirm: async () => {
				await callback();

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},
	openConfirmModal: (
		eventStore: EventStore,
		callback: () => void,
		titleKey = 'MODALS.ARE_YOU_SURE',
		contentKey = 'MODALS.ARE_YOU_SURE.CONTENT',
		continueKey = 'MODALS.CONTINUE',
		contentParams?: TranslationParams,
		confirmBtnCssClass?: string
	) => {
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, titleKey)}`,
			content: (
				<div
					className="white-space-pre-line"
					dangerouslySetInnerHTML={{
						__html: TranslateService.translate(eventStore, contentKey, contentParams),
					}}
				/>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, continueKey),
			confirmBtnCssClass: getClasses('primary-button', confirmBtnCssClass),
			onConfirm: async () => {
				await callback();

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},
	openImportEventsModal: (eventStore: EventStore) => {
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE'),
			content: (
				<div
					className="import-events-steps"
					dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, 'IMPORT_EVENTS_STEPS') }}
				/>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DOWNLOAD_TEMPLATE'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: () => {
				ImportService._download('TriplanEventsImport.csv', ImportService._buildTemplate(eventStore));
				ReactModalService.internal.closeModal(eventStore);
				ReactModalService.openImportEventsStepTwoModal(eventStore);
			},
		});
	},
	openImportEventsStepTwoModal: (eventStore: EventStore) => {
		eventStore.modalValues['fileToUpload'] = undefined;
		// @ts-ignore
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE2'),
			content: (
				<Observer>
					{() => (
						<>
							<div
								className="import-events-steps"
								dangerouslySetInnerHTML={{
									__html: TranslateService.translate(eventStore, 'IMPORT_EVENTS_STEPS2'),
								}}
							/>
							<div className="file-upload-container">
								<input
									type="file"
									name="upload[]"
									id="fileToUpload"
									accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv"
									className="display-none"
									onChange={(event) => {
										const target = event?.target;
										const files = target?.files;
										const file = files && files.length > 0 ? files[0] : undefined;

										runInAction(() => {
											eventStore.modalValues['fileToUpload'] = file;
										});

										// @ts-ignore
										document.getElementsByClassName('file-name-label')[0].innerText =
											file?.name || TranslateService.translate(eventStore, 'NO_FILE_CHOSEN');
									}}
								/>
								<div className="file-upload-label-container">
									<label
										htmlFor="fileToUpload"
										className="btn secondary-button pointer black file-button-label"
									>
										{TranslateService.translate(eventStore, 'CLICK_HERE_TO_UPLOAD')}
									</label>
									<label className="file-name-label">
										{eventStore.modalValues['fileToUpload']?.name ||
											TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')}
									</label>
								</div>
							</div>
						</>
					)}
				</Observer>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.UPLOAD'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: () => {
				// @ts-ignore
				const file = eventStore.modalValues['fileToUpload'];

				if (file) {
					const reader = new FileReader();
					reader.readAsText(file, 'UTF-8');
					reader.onload = function (evt) {
						// @ts-ignore
						ImportService.handleUploadedFile(eventStore, evt.target.result);
					};
					reader.onerror = function (evt) {
						ReactModalService.internal.alertMessage(
							eventStore,
							'MODALS.ERROR.TITLE',
							'MODALS.IMPORT_EVENTS_ERROR.CONTENT',
							'error'
						);
					};
				}
				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},
	openBackupTripModal: (eventStore: EventStore) => {
		// Initialize modal values
		eventStore.modalValues['backupFormat'] = 'json';

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'BACKUP_TRIP.TITLE'),
			content: (
				<Observer>
					{() => (
						<div className="backup-trip-modal">
							<div className="margin-bottom-15">
								{TranslateService.translate(eventStore, 'BACKUP_TRIP.SELECT_FORMAT')}
							</div>
							<div className="backup-format-options">
								<div className="backup-format-option">
									<label className="backup-format-label">
										<input
											type="radio"
											name="backupFormat"
											value="json"
											checked={eventStore.modalValues['backupFormat'] === 'json'}
											onChange={(e) => {
												runInAction(() => {
													eventStore.modalValues['backupFormat'] = e.target.value;
												});
											}}
										/>
										<span className="backup-format-title">
											{TranslateService.translate(eventStore, 'BACKUP_TRIP.FORMAT.JSON')}
										</span>
									</label>
									<div className="backup-format-description">
										{TranslateService.translate(eventStore, 'BACKUP_TRIP.DESCRIPTION.JSON')}
									</div>
								</div>
								<div className="backup-format-option">
									<label className="backup-format-label">
										<input
											type="radio"
											name="backupFormat"
											value="csv"
											checked={eventStore.modalValues['backupFormat'] === 'csv'}
											onChange={(e) => {
												runInAction(() => {
													eventStore.modalValues['backupFormat'] = e.target.value;
												});
											}}
										/>
										<span className="backup-format-title">
											{TranslateService.translate(eventStore, 'BACKUP_TRIP.FORMAT.CSV')}
										</span>
									</label>
									<div className="backup-format-description">
										{TranslateService.translate(eventStore, 'BACKUP_TRIP.DESCRIPTION.CSV')}
									</div>
								</div>
							</div>
						</div>
					)}
				</Observer>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'BACKUP_TRIP.EXPORT'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: () => {
				const format = eventStore.modalValues['backupFormat'];
				if (format === 'json') {
					BackupService.exportAsJSON(eventStore);
				} else if (format === 'csv') {
					BackupService.exportAsCSV(eventStore);
				}
				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},

	openEditColorsModal: (eventStore: EventStore) => {
		// Prepare local editable copies - ensure they are plain objects
		const colors = observable.map<string, string>({ ...eventStore.priorityColors });
		const mapColors = observable.map<string, string>({ ...eventStore.priorityMapColors });

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'EDIT_COLORS'),
			content: (
				<Observer>
					{() => (
						<div className="edit-colors-modal">
							<div className="flex-col gap-10 align-items-center">
								<div className="white-space-pre-line">
									{TranslateService.translate(eventStore, 'EDIT_COLORS_DESCRIPTION')}
								</div>
								<div className="margin-top-5 margin-bottom-10 bold">
									{TranslateService.translate(eventStore, 'CLICK_TO_EDIT')}
								</div>
								{Object.keys(TriplanPriority)
									.filter((p) => !isNaN(Number(p)))
									.map((priorityId) => {
										const priorityKey = TriplanPriority[priorityId];
										const [color, setColor] = useColor(colors.get(priorityId));
										const [isEdit, setIsEdit] = useState(false);

										return (
											<div
												className="flex-row gap-10 align-items-center width-400"
												key={`pcol-${priorityId}`}
											>
												<div className="flex-row align-items-center gap-16 width-100-percents input-with-label">
													<label
														className="width-150 text-align-start"
														onClick={() => {
															setIsEdit(true);
														}}
													>
														{TranslateService.translate(eventStore, priorityKey)}:
													</label>
													<div
														className={getClasses(
															'flex-row align-items-center gap-16',
															!isEdit && 'display-none'
														)}
													>
														<ColorPicker
															height={50}
															hideInput={['rgb', 'hsv']}
															color={color}
															onChange={(newColor) => {
																setColor(newColor);
															}}
														/>
														<div className="flex-column gap-4 width-80">
															<button
																className="secondary-button"
																onClick={() => {
																	colors.set(priorityId, color.hex);
																	mapColors.set(priorityId, color.hex);
																	setIsEdit(false);
																}}
															>
																{TranslateService.translate(eventStore, 'SAVE')}
															</button>
															<button
																className="secondary-button"
																onClick={() => {
																	setIsEdit(false);
																}}
															>
																{TranslateService.translate(
																	eventStore,
																	'MODALS.CANCEL'
																)}
															</button>
														</div>
													</div>
													<div
														className={getClasses(
															'flex-row align-items-center gap-16',
															isEdit && 'display-none'
														)}
														onClick={() => {
															setIsEdit(true);
														}}
													>
														<TextInput
															modalValueName={`priorityColor_${priorityId}`}
															value={colors.get(priorityId) || ''}
															readOnly
															placeholder={priorityToMapColor[priorityId]}
														/>
														<PreviewBox size={37} color={colors.get(priorityId)} />
													</div>
												</div>
											</div>
										);
									})}

								<div className="flex-row gap-10 align-items-center margin-top-10">
									<button
										className="secondary-button"
										onClick={() => {
											Object.keys(TriplanPriority)
												.filter((p) => !isNaN(Number(p)))
												.forEach((pid) => {
													const def = priorityToColor[pid];
													colors.set(pid, def);
													mapColors.set(pid, priorityToMapColor[pid] ?? def);
												});
										}}
									>
										{TranslateService.translate(eventStore, 'RESET_TO_DEFAULTS')}
									</button>
								</div>
							</div>
						</div>
					)}
				</Observer>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'SAVE'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: async () => {
				// capture previous values for history logging
				const previousColors = { ...eventStore.priorityColors };
				const previousMapColors = { ...eventStore.priorityMapColors };

				// update store
				runInAction(() => {
					eventStore.priorityColors = { ...Object.fromEntries(colors) };
					eventStore.priorityMapColors = { ...Object.fromEntries(mapColors) };
				});

				// persist via trip update
				try {
					await DataServices.DBService.updateTripColors(eventStore.tripName, {
						priorityColors: eventStore.priorityColors,
						priorityMapColors: eventStore.priorityMapColors,
					});
				} catch (e) {}

				// log history for color changes (DB only)
				try {
					// build compact diff strings: only changed priorities
					const changedIds = Object.keys(eventStore.priorityColors || {}).filter(
						(pid) => (previousColors as any)[pid] !== (eventStore.priorityColors as any)[pid]
					);

					const toEnglishKey = (pid: string) => TriplanPriority[pid] ?? pid; // enum key is english
					const diffPayload: any = {};
					changedIds.forEach((pid) => {
						const key = toEnglishKey(pid);
						diffPayload[key] = {
							was: (previousColors as any)[pid],
							now: (eventStore.priorityColors as any)[pid],
						};
					});

					LogHistoryService.logHistory(
						eventStore,
						TripActions.changedTripColors,
						diffPayload,
						undefined,
						undefined,
						eventStore.tripId
					);
				} catch {}

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},

	openExportToGoogleMapsSelectionModal: (
		eventStore: EventStore,
		onExportChosen: (mode: 'all' | 'scheduled' | 'scheduled_by_day') => void
	) => {
		const modes: { label: string; value: 'all' | 'scheduled' | 'scheduled_by_day' }[] = [
			{ label: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.MODES.ALL'), value: 'all' },
			{
				label: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.MODES.SCHEDULED'),
				value: 'scheduled',
			},
			{
				label: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.MODES.SCHEDULED_BY_DAY'),
				value: 'scheduled_by_day',
			},
		];

		eventStore.modalValues['exportMode'] =
			eventStore.modalValues['exportMode'] || modes.find((m) => m.value === 'scheduled_by_day') || modes[0];

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.TITLE'),
			content: (
				<div className="flex-col gap-12">
					<div>{TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.SELECT_WHAT_TO_EXPORT')}:</div>
					<SelectInput
						ref={undefined}
						id="export-to-google-maps-mode"
						name="export-to-google-maps-mode"
						options={modes}
						value={eventStore.modalValues['exportMode']}
						onChange={(opt: any) => (eventStore.modalValues['exportMode'] = opt)}
						modalValueName="exportMode"
						removeDefaultClass={true}
						isClearable={false}
					/>
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DOWNLOAD'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: () => {
				const chosen = eventStore.modalValues['exportMode']?.value ?? 'all';
				ReactModalService.internal.closeModal(eventStore);
				onExportChosen(chosen);
			},
		});
	},

	openExportToGoogleMapsStepsModal: (eventStore: EventStore, doDownload: () => void) => {
		const Steps = () => {
			useEffect(() => {
				setTimeout(() => doDownload(), 50);
			}, []);
			return (
				<div
					className="import-events-steps"
					dangerouslySetInnerHTML={{
						__html: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS_STEPS', {
							URL: 'https://mymaps.google.com/',
						}),
					}}
				/>
			);
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'EXPORT_TO_GOOGLE_MAPS.STEPS.TITLE'),
			content: <Steps />,
			cancelBtnText: TranslateService.translate(eventStore, 'GENERAL.CLOSE'),
			hideConfirmBtn: true,
		});
	},
	openImportEventsConfirmModal: (eventStore: EventStore, info: ImportEventsConfirmInfo) => {
		let contentArr = [
			`${info.eventsToAdd.length} ${TranslateService.translate(
				eventStore,
				'IMPORT_EVENTS.CONFIRM.EVENTS_WILL_BE_ADDED'
			)}`,
			`${info.categoriesToAdd.length} ${TranslateService.translate(
				eventStore,
				'IMPORT_EVENTS.CONFIRM.CATEGORIES_WILL_BE_ADDED'
			)}`,
			`${info.numOfEventsWithErrors} ${TranslateService.translate(
				eventStore,
				'IMPORT_EVENTS.CONFIRM.EVENTS_HAVE_ERRORS'
			)}`,
		];

		if (info.categoriesToAdd.length > 0) {
			contentArr = [
				...contentArr,
				'',
				`<u><b>${TranslateService.translate(
					eventStore,
					'IMPORT_EVENTS.CONFIRM.ABOUT_TO_UPLOAD_CATEGORIES'
				)}</b></u>`,
				['<ul>', ...info.categoriesToAdd.map((x) => `<li>${x.title}</li>`), '</ul>'].join(''),
			];
		}

		if (info.eventsToAdd.length > 0) {
			contentArr = [
				...contentArr,
				// "",
				`<u><b>${TranslateService.translate(
					eventStore,
					'IMPORT_EVENTS.CONFIRM.ABOUT_TO_UPLOAD_EVENTS'
				)}</b></u>`,
				['<ul>', ...info.eventsToAdd.map((x) => `<li>${x.title}</li>`), '</ul>'].join(''),
			];
		}

		if (info.errors.length > 0) {
			contentArr = [
				...contentArr,
				// "",
				`<u><b>${TranslateService.translate(eventStore, 'IMPORT_EVENTS.CONFIRM.ERRORS_DETAILS')}</b></u>`,
				['<ul>', ...info.errors.map((x) => `<li>${x}</li>`), '</ul>'].join(''),
			];
		}

		const html = contentArr.join('<br/>');

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'IMPORT_EVENTS.TITLE3'),
			content: <div className="react-modal bright-scrollbar" dangerouslySetInnerHTML={{ __html: html }} />,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(
				eventStore,
				info.errors.length > 0 ? 'MODALS.UPLOAD_ANYWAY' : 'MODALS.UPLOAD'
			),
			confirmBtnCssClass: 'primary-button',
			showConfirmButton: info.categoriesToAdd.length > 0 || info.eventsToAdd.length > 0,
			onConfirm: async () => {
				const { categoriesImported, eventsImported } = await ImportService.import(eventStore, info);
				if (categoriesImported || eventsImported) {
					LogHistoryService.logHistory(
						eventStore,
						categoriesImported ? TripActions.importedCategoriesAndEvents : TripActions.importedEvents,
						{
							eventsToAdd: info.eventsToAdd,
							categoriesToAdd: info.categoriesToAdd,
							numOfEventsWithErrors: info.numOfEventsWithErrors,
							errors: info.errors,
							categoriesImported,
							eventsImported,
							count: info.eventsToAdd?.length ?? 0,
							count2: info.categoriesToAdd?.length ?? 0,
						}
					);

					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.IMPORTED.TITLE',
						'MODALS.IMPORTED.CONTENT',
						'success'
					);
				} else {
					ReactModalService.internal.openOopsErrorModal(eventStore);
				}

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},

	openPlacesTinderModal: (eventStore: EventStore, destination: string | null = null) => {
		const onConfirm = () => {
			ReactModalService.internal.closeModal(eventStore);
		};

		const content = <Observer>{() => <PlacesTinder eventStore={eventStore} destination={destination} />}</Observer>;

		const settings = getDefaultSettings(eventStore);
		if (eventStore.isMobile) settings.customClass = [settings.customClass, 'fullscreen-modal'].join(' ');
		ReactModalService.internal.openModal(eventStore, {
			...settings,
			showConfirm: false,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.EXIT'),
			title: TranslateService.translate(eventStore, 'PLACES_TINDER_MODAL.TITLE'),
			type: 'controlled',
			customClass: 'triplan-react-modal places-tinder-modal',
			onConfirm,
			content,
		});
	},

	openShareToTinderModal: (eventStore: EventStore) => {
		const all = [...eventStore.allEventsComputed];
		const categories = [...eventStore.categories];
		if (!categories) return;

		function filterOutIrrelevant(place: any) {
			return true;
			// const excludeKeywords = [
			//     "hotel",
			//     "מלון",
			//     "check-in",
			//     "checkin",
			//     "צ׳ק א",
			//     "שדה התעופה",
			//     "טיסה "
			// ]
			//
			// let isOk = true;
			// excludeKeywords.map((keyword) => {
			//     let { title, description } = place;
			//
			//     if (title.toLowerCase().indexOf(keyword) !== -1 || description?.toLowerCase().indexOf(keyword) !== -1){
			//         isOk = false;
			//         return;
			//     }
			// })
			//
			// if (place.allDay) return false;
			//
			// todo complete: remove duplicates
			// todo complete: remove categoryId
			// todo complete: remove event.id
			// todo complete: remove 'הוזמן לשעה...' from the descirption
			// todo complete: remove 'הערה:' from the description (for example "use Euro and not Shekels")
			//
			// return isOk;
		}

		all.filter(filterOutIrrelevant).forEach((x: any) => {
			delete x['id'];
			x['category'] = categories.find((c) => c.id)?.title;
			x['tinder'] = {
				images: x.images?.split('\n'),
				more_info: x.moreInfo,
				source: 'Admin Recommendation',
			};
		});

		const newJson = `"${eventStore.tripName}":${JSON.stringify(all)}`;

		const onConfirm = () => {
			ReactModalService.internal.closeModal(eventStore);
		};

		function copyText() {
			// Get the text field
			// @ts-ignore
			const copyText: HTMLInputElement = document.getElementById('tripJson')!;

			// Select the text field
			copyText.select();

			// Copy the text inside the text field
			navigator.clipboard.writeText(copyText.value);

			// Alert the copied text
			alert('Copied the text: ' + copyText.value);
		}

		const content = (
			<Observer>
				{() => (
					<>
						<p
							className="bright-scrollbar"
							style={{
								maxHeight: '200px',
								overflowY: 'scroll',
								padding: '10px',
								backgroundColor: 'rgba(0,0,0,0.02)',
								fontSize: 12,
							}}
						>
							{newJson}
						</p>
						<input type="hidden" id="tripJson" value={newJson} />
						{/*<button onClick={copyText}>Copy</button>*/}
					</>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			showConfirm: false,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.EXIT'),
			title: TranslateService.translate(eventStore, 'SHARE_TO_TINDER.TITLE'),
			type: 'controlled',
			customClass: 'triplan-react-modal max-width-350',
			onConfirm,
			content,
		});
	},
	// todo: consider moving some of the logic here to a deidcated distance service
	openCalculateDistancesModal(eventStore: EventStore) {
		// disable distance for other users for now.
		if (!LimitationsService.distanceLimitations()) {
			return;
		}

		const allLocations = eventStore.allEventsLocations;

		var checkTaskStatus: NodeJS.Timeout | undefined;

		runInAction(() => {
			eventStore.distanceModalOpened = true;
		});

		const content = () => {
			return (
				<div className="white-space-pre-line flex-col gap-16">
					<i className="fa fa-map-signs font-size-100 blue-gray-color" aria-hidden="true" />
					{TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.DESCRIPTION')}
					<div className="blue-gray-color margin-top-5 font-size-12">
						{TranslateService.translate(eventStore, 'NOTE.COULD_TAKE_AWHILE')}
					</div>
				</div>
			);
		};

		const onConfirm = async () => {
			// log
			LogHistoryService.logHistory(eventStore, TripActions.ranDistanceCalculation, {
				count2: allLocations.length,
			});

			const result = await apiPost(endpoints.v1.distance.calculateDistances, {
				from: allLocations,
				to: allLocations,
				tripName: eventStore.tripName,
				isMobile: eventStore.isMobile,
			});

			const taskId = result.data.taskId;

			const MAX_UPDATE_CHECKS = 300;
			const INTERVAL_MS = 1500;
			var counter = 0;

			const updateTaskStatus = async () => {
				counter++;
				const result = await apiGetNew(endpoints.v1.backgroundTasks.getTask(taskId));
				runInAction(() => {
					eventStore.taskData = result.data;

					// update text & make button disabled
					if (eventStore.distanceModalOpened) {
						eventStore.setModalSettings({
							...eventStore.modalSettings,
							disabled: true,
							confirmBtnText: TranslateService.translate(
								eventStore,
								'CALCULATE_DISTANCES_MODAL.CTA.CALCULATING',
								{
									X: eventStore.taskData.progress,
								}
							),
						});
					}

					if (checkTaskStatus && (eventStore.taskData.progress == 100 || counter >= MAX_UPDATE_CHECKS)) {
						clearInterval(checkTaskStatus);

						if (eventStore.distanceModalOpened) {
							eventStore.taskId = undefined;
							eventStore.taskData = undefined;

							ReactModalService.internal
								.alertMessage(
									eventStore,
									'CALCULATE_DISTANCES_MODAL.FINISHED_CALCULATING.TITLE',
									'CALCULATE_DISTANCES_MODAL.FINISHED_CALCULATING.CONTENT',
									'success'
								)
								.then(async () => {
									const newDistanceResults = await DataServices.DBService.getDistanceResults(
										eventStore.tripName
									);
									runInAction(() => {
										eventStore.distanceResults = observable.map(newDistanceResults);
									});

									if (eventStore.distanceModalOpened) {
										this.internal.closeModal(eventStore);

										if (eventStore.isMobile) {
											eventStore.setMobileViewMode(ViewMode.sidebar);
											setTimeout(() => {
												eventStore.autoOpenDistanceSidebarGroup();
											}, 600);
										} else {
											eventStore.autoOpenDistanceSidebarGroup();
										}
									}
								});
						}
					}
				});
			};

			runInAction(() => {
				eventStore.taskId = taskId;
				updateTaskStatus();
				checkTaskStatus = setInterval(updateTaskStatus, INTERVAL_MS);
				eventStore.checkTaskStatus = checkTaskStatus;
			});
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			confirmBtnText: eventStore.taskId
				? eventStore.taskData.progress == 100
					? TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CTA.FINISHED')
					: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CTA.CALCULATING', {
							X: eventStore.taskData.progress,
					  })
				: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CTA'),
			cancelBtnText: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CANCEL'),
			title: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.TITLE', {
				X: allLocations.length,
			}),
			type: 'controlled',
			customClass: 'triplan-react-modal max-width-350',
			onConfirm,
			content,
			onCancel: () => {
				runInAction(() => {
					eventStore.distanceModalOpened = false;
				});
				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},

	openChangeLanguageModal: (eventStore: EventStore) => {
		const options: any[] = [
			{ name: TranslateService.translate(eventStore, 'ENGLISH').toString(), key: 'en' },
			{ name: TranslateService.translate(eventStore, 'HEBREW').toString(), key: 'he' },
		];

		const content = () => {
			return (
				<Observer>
					{() => (
						<div className="width-100-percents flex-row justify-content-center margin-top-10">
							<ToggleButton
								value={eventStore.calendarLocalCode}
								onChange={(newVal) => {
									eventStore.setCalendarLocalCode(newVal as unknown as LocaleCode);

									const titleDom = document.querySelector('.sweet-alert.triplan-react-modal>h2');
									const cancelDom = document.querySelector(
										'.sweet-alert.triplan-react-modal>p>.btn-link.link-button'
									);
									if (titleDom) {
										titleDom.textContent = TranslateService.translate(
											eventStore,
											'CHOOSE_LANGUAGE'
										);
									}
									if (cancelDom) {
										cancelDom.textContent = TranslateService.translate(eventStore, 'MODALS.CANCEL');
									}

									setTimeout(() => {
										ReactModalService.internal.closeModal(eventStore);
									}, 100);

									setTimeout(() => {
										window.location.reload();
									}, 200);
								}}
								options={options}
								useActiveButtons={false}
								customStyle="white"
							/>
						</div>
					)}
				</Observer>
			);
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'CHOOSE_LANGUAGE'),
			type: 'controlled',
			onConfirm: () => {},
			content,
			confirmBtnCssClass: 'display-none',
		});
	},

	openSwitchTripsModal: async (eventStore: EventStore) => {
		const tripsData = await eventStore.dataService.getTripsShort(eventStore);
		const { trips, sharedTrips } = tripsData;

		const options = trips.map((trip) => ({
			value: trip.name,
			label: trip.name,
		}));

		sharedTrips.forEach((trip) => {
			options.push({
				value: trip.name,
				label: `${trip.name} (${TranslateService.translate(eventStore, 'SHARED_TRIP')})`,
			});
		});

		const content = () => {
			return (
				<Observer>
					{() => (
						<div className="width-100-percents flex-row justify-content-center margin-top-10">
							<SelectInput
								readOnly={false}
								id="select-other-trip"
								name="select-other-trip"
								options={options}
								value={undefined}
								placeholderKey="TYPE_TO_SEARCH_PLACEHOLDER"
								modalValueName="select-other-trip"
								menuPortalTarget={document.body}
								onChange={(data) => {
									if (FeatureFlagsService.isNewDesignEnabled()) {
										window.location.href = `${newDesignRootPath}/plan/${data.value}`;
									} else {
										window.location.href = `/plan/${data.value}`;
									}
								}}
							/>
						</div>
					)}
				</Observer>
			);
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'SWITCH_TRIPS'),
			type: 'controlled',
			onConfirm: () => {},
			content,
			confirmBtnCssClass: 'display-none',
		});
	},

	openSwitchDaysModal: (eventStore: EventStore, item: any, draggedItem: any) => {
		const onConfirm = async () => {
			const dtEvents = eventStore.calendarEvents.filter((e) => formatDate(new Date(e.start)) == item.text);
			const draggedDtEvents = eventStore.calendarEvents.filter(
				(e) => formatDate(new Date(e.start)) == draggedItem.text
			);

			// console.log({
			// 	text: item.text,
			// 	events: dtEvents
			// 		.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
			// 		.map((x) => x.title),
			// });
			//
			// console.log({
			// 	text: draggedItem.text,
			// 	events: draggedDtEvents
			// 		.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
			// 		.map((x) => x.title),
			// });

			const dt = item.date;
			const draggedDt = draggedItem.date;

			const updatedEvents: CalendarEvent[] = [];

			const temp = _.cloneDeep(eventStore.calendarEvents);
			temp.forEach((event: CalendarEvent) => {
				const dtStart = new Date(event.start);
				const dtEnd = new Date(event.end);
				let duration = event.duration;

				if (event.allDay) {
					duration = '24:00';
				}

				console.log({ dtStart, format: formatDate(dtStart), text: draggedItem.text });
				if (formatDate(dtStart) == draggedItem.text) {
					const start = new Date(dtStart.setFullYear(dt.getFullYear(), dt.getMonth(), dt.getDate()));

					// @ts-ignore
					event.start = typeof event.start == 'string' ? start.toISOString() : start;

					// @ts-ignore
					event.end = getEndDate(event.start, duration);
				} else if (formatDate(dtStart) == item.text) {
					const start = new Date(
						dtStart.setFullYear(draggedDt.getFullYear(), draggedDt.getMonth(), draggedDt.getDate())
					);

					// @ts-ignore
					event.start = typeof event.start == 'string' ? start.toISOString() : start;

					// @ts-ignore
					event.end = getEndDate(event.start, duration);
				}

				updatedEvents.push(event);
			});

			// console.log({ temp, updatedEvents, calendarEvents: eventStore.calendarEvents });

			await eventStore.setCalendarEvents(updatedEvents, true);

			LogHistoryService.logHistory(eventStore, TripActions.switchedDays, {
				was: draggedItem.text,
				now: item.text,
			});

			ReactModalService.internal.closeModal(eventStore);

			setTimeout(() => {
				ReactModalService.internal.alertMessage(
					eventStore,
					'SWITCH_DAYS_SUCCESS_MODAL.TITLE',
					'SWITCH_DAYS_SUCCESS_MODAL.CONTENT',
					'success',
					{
						X: draggedItem.text,
						Y: item.text,
					}
				);
			}, 1);
		};

		const content = () => {
			return (
				<div className="white-space-pre-line">
					{TranslateService.translate(eventStore, 'SWITCH_DAYS.CONTENT', {
						X: draggedItem.text,
						Y: item.text,
					})}
				</div>
			);
		};

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: TranslateService.translate(eventStore, 'SWITCH_DAYS'),
			type: 'controlled',
			onConfirm: () => {
				onConfirm();
			},
			content,
			confirmBtnText: TranslateService.translate(eventStore, 'GENERAL.YES'),
		});
	},
	openDeleteCollaboratorPermissionsModal(eventStore: EventStore, collaborator: any) {
		return ReactModalService.openConfirmModal(
			eventStore,
			() => {
				const tripDataSource = eventStore.dataService.getDataSourceName();
				if (tripDataSource === TripDataSource.DB) {
					DataServices.DBService.deleteCollaboratorPermissions(
						collaborator.permissionsId,
						(response) => {
							ReactModalService.internal.closeModal(eventStore);
							runInAction(() => {
								eventStore.reloadCollaboratorsCounter += 1;
							});

							LogHistoryService.logHistory(eventStore, TripActions.deleteCollaborator, {
								name: response['data']['collaboratorUserName'],
							});
						},
						() => {
							ReactModalService.internal.openOopsErrorModal(eventStore);
						}
					);
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
						'error'
					);
					return;
				}
			},
			'MODALS.ARE_YOU_SURE',
			'DELETE_COLLABORATOR_PERMISSIONS',
			'CONTINUE_ANYWAY',
			{
				name: collaborator.username,
				action: TranslateService.translate(eventStore, collaborator.canWrite ? 'VIEW_AND_EDIT' : 'VIEW'),
			},
			'red'
		);
	},
	openChangeCollaboratorPermissionsModal(eventStore: EventStore, collaborator: any) {
		const tripName = eventStore.tripName.replaceAll('-', ' ');

		const options = [
			{ value: 0, label: TranslateService.translate(eventStore, 'PERMISSIONS.READ') },
			{ value: 1, label: TranslateService.translate(eventStore, 'PERMISSIONS.READ_WRITE') },
		];

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'SHARE_TRIP')}: ${tripName}`,
			content: (
				<div className="flex-col gap-20">
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(
								eventStore,
								'MODALS.EDIT_COLLABORATOR_PERMISSIONS.CONTENT',
								{
									name: collaborator.username,
								}
							),
						}}
					/>
					{ReactModalRenderHelper.renderSelectInput(
						eventStore,
						'share-trip-choose-permissions',
						{
							options,
							placeholderKey: 'SHARE_TRIP.SELECT_PERMISSIONS',
							removeDefaultClass: true,
							value: collaborator.canWrite ? 1 : 0,
							isClearable: false,
							maxMenuHeight: eventStore.isMobile ? 35 * 2 : undefined,
						},
						'add-event-from-sidebar-selector'
					)}
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'UPDATE_PERMISSIONS'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: async () => {
				const tripDataSource = eventStore.dataService.getDataSourceName();
				if (tripDataSource === TripDataSource.DB) {
					DataServices.DBService.changeCollaboratorPermissions(
						collaborator.permissionsId,
						!!eventStore.modalValues['share-trip-choose-permissions']?.value
					)
						.then((response) => {
							ReactModalService.internal.closeModal(eventStore);
							runInAction(() => {
								eventStore.reloadCollaboratorsCounter += 1;
							});

							if (!response) {
								ReactModalService.internal.openOopsErrorModal(eventStore);
								return;
							}

							// log history - changed collaborator permissions
							if (collaborator.canWrite != response['data']['canWrite']) {
								LogHistoryService.logHistory(eventStore, TripActions.changeCollaboratorPermissions, {
									name: response['data']['collaboratorUserName'],
									was: collaborator.canWrite ? 'PERMISSIONS.READ_WRITE' : 'PERMISSIONS.READ',
									now: response['data']['canWrite'] ? 'PERMISSIONS.READ_WRITE' : 'PERMISSIONS.READ',
								});
							} else {
								// alert nothing changed?
							}

							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.CREATE.TITLE',
								'MODALS.EDIT_COLLABORATOR_PERMISSIONS.CHANGED.CONTENT',
								'success'
							);
						})
						.catch(() => {
							ReactModalService.internal.openOopsErrorModal(eventStore);
						});
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
						'error'
					);
					return;
				}
			},
		});
	},
	openSeeHistoryDetails(eventStore: EventStore, historyRow: any, fullTitle: string) {
		const offset = -1 * getOffsetInHours();
		const updatedAt = addHours(new Date(historyRow.updatedAt), offset);

		const isYou = historyRow.updatedBy == getCurrentUsername();
		const when = formatFromISODateString(updatedAt.toISOString());

		const getNow = () => {
			switch (historyRow.action) {
				case TripActions.deletedCalendarEvent:
					return TranslateService.translate(eventStore, 'IN_THE_SIDEBAR');
				default:
					return historyRow.actionParams.now;
			}
		};

		if (historyRow.actionParams.priority) {
			const priorityWas = historyRow.actionParams.priority.was as unknown as TriplanPriority;
			historyRow.actionParams.priority.was = TranslateService.translate(eventStore, TriplanPriority[priorityWas]);

			const priorityNow = historyRow.actionParams.priority.now as unknown as TriplanPriority;
			historyRow.actionParams.priority.now = TranslateService.translate(eventStore, TriplanPriority[priorityNow]);
		}

		if (historyRow.actionParams.preferredTime) {
			const preferredTimeWas = historyRow.actionParams.preferredTime.was as unknown as TriplanPriority;
			historyRow.actionParams.preferredTime.was = TranslateService.translate(
				eventStore,
				TriplanPriority[preferredTimeWas]
			);

			const preferredTimeNow = historyRow.actionParams.preferredTime.now as unknown as TriplanPriority;
			historyRow.actionParams.preferredTime.now = TranslateService.translate(
				eventStore,
				TriplanPriority[preferredTimeNow]
			);
		}

		if (historyRow.actionParams.category) {
			historyRow.actionParams.category.was =
				eventStore.categories.find((c) => c.id == historyRow.actionParams.category.was)?.title ??
				historyRow.actionParams.category.was;

			historyRow.actionParams.category.now =
				eventStore.categories.find((c) => c.id == historyRow.actionParams.category.now)?.title ??
				historyRow.actionParams.category.now;
		}

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			customClass: 'triplan-react-modal max-width-650',
			title: TranslateService.translate(eventStore, 'VIEW_HISTORY'),
			type: 'controlled',
			onConfirm: () => {},
			// content: () => fullTitle,
			content: () => (
				<table className="border-solid-table">
					<tr>
						<td className="main-font-heavy">{TranslateService.translate(eventStore, 'WHO')}</td>
						<td>{isYou ? TranslateService.translate(eventStore, 'YOU') : historyRow.updatedBy}</td>
					</tr>
					<tr>
						<td className="main-font-heavy">{TranslateService.translate(eventStore, 'WHAT')}</td>
						<td>{fullTitle}</td>
					</tr>
					{historyRow.actionParams.eventName && (
						<tr>
							<td className="main-font-heavy">
								{TranslateService.translate(
									eventStore,
									historyRow.action == TripActions.addedHotelCalendarEventFromExisting
										? 'HOTEL_NAME'
										: 'EVENT_NAME'
								)}
							</td>
							<td>{historyRow.actionParams.eventName}</td>
						</tr>
					)}
					{historyRow.actionParams.categoryName &&
						historyRow.action != TripActions.deletedCategory &&
						historyRow.action != TripActions.changedCategory && (
							<tr>
								<td className="main-font-heavy">
									{TranslateService.translate(
										eventStore,
										historyRow.action == TripActions.addedCategory
											? 'CATEGORY_NAME'
											: 'ADDED_TO_CATEGORY'
									)}
								</td>
								<td>{historyRow.actionParams.categoryName}</td>
							</tr>
						)}
					{historyRow.action == TripActions.updatedTrip && (
						<tr>
							<td className="main-font-heavy">{TranslateService.translate(eventStore, 'TRIP_NAME')}</td>
							<td>
								<div className="flex-col gap-4">
									<div>
										<span>{TranslateService.translate(eventStore, 'BEFORE')}</span>
										{' : '}
										<span>{historyRow.actionParams.tripName.was}</span>
									</div>
									<div>
										<span>{TranslateService.translate(eventStore, 'AFTER')}</span>
										{' : '}
										<span>{historyRow.actionParams.tripName.now}</span>
									</div>
								</div>
							</td>
						</tr>
					)}
					{historyRow.actionParams.toWhereStart && historyRow.actionParams.toWhereEnd && (
						<tr>
							<td className="main-font-heavy">{TranslateService.translate(eventStore, 'TO_WHERE')}</td>
							<td>
								{formatFromISODateString(historyRow.actionParams.toWhereStart, false)}
								{' - '}
								{formatFromISODateString(historyRow.actionParams.toWhereEnd, false)}
							</td>
						</tr>
					)}
					{historyRow.actionParams.was && historyRow.action != TripActions.deletedSidebarEvent && (
						<tr>
							<td className="main-font-heavy">{TranslateService.translate(eventStore, 'BEFORE')}</td>
							<td>{TranslateService.translate(eventStore, LogHistoryService.getWas(historyRow))}</td>
						</tr>
					)}
					{historyRow.actionParams.now && (
						<tr>
							<td className="main-font-heavy">{TranslateService.translate(eventStore, 'AFTER')}</td>
							<td>{TranslateService.translate(eventStore, getNow())}</td>
						</tr>
					)}
					{historyRow.actionParams.permissions && (
						<tr>
							<td className="main-font-heavy">{TranslateService.translate(eventStore, 'PERMISSIONS')}</td>
							<td>{TranslateService.translate(eventStore, historyRow.actionParams.permissions)}</td>
						</tr>
					)}
					{Object.keys(TriplanPriority)
						.filter((key) => isNaN(Number(key)))
						.map(
							(key) =>
								historyRow.actionParams[key] && (
									<tr>
										<td className="main-font-heavy">
											{TranslateService.translate(eventStore, key)}
										</td>
										<td>
											<div className="flex-row align-items-center gap-4">
												<PreviewBox size={16} color={historyRow.actionParams[key].was} />
												<div className="text-align-start width-150">
													{TranslateService.translate(eventStore, 'BEFORE')}: &nbsp;
													{TranslateService.translate(
														eventStore,
														historyRow.actionParams[key].was
													)}{' '}
													&nbsp;&nbsp;
												</div>
											</div>
											<div className="flex-row align-items-center gap-4">
												<PreviewBox size={16} color={historyRow.actionParams[key].now} />
												<div className="text-align-start width-150">
													{TranslateService.translate(eventStore, 'AFTER')}: &nbsp;
													{TranslateService.translate(
														eventStore,
														historyRow.actionParams[key].now
													)}
												</div>
											</div>
										</td>
									</tr>
								)
						)}
					{historyRow.action == TripActions.deletedCategory && (
						<>
							<tr>
								<td className="main-font-heavy">
									{TranslateService.translate(eventStore, 'TOTAL_AFFECTED_CALENDAR')}
								</td>
								<td className="white-space-pre-line">
									{historyRow.actionParams?.totalAffectedCalendar ?? 0}
								</td>
							</tr>
							<tr>
								<td className="main-font-heavy">
									{TranslateService.translate(eventStore, 'TOTAL_AFFECTED_SIDEBAR')}
								</td>
								<td className="white-space-pre-line">
									{historyRow.actionParams?.totalAffectedSidebar ?? 0}
								</td>
							</tr>
						</>
					)}

					{(historyRow.action == TripActions.importedCategoriesAndEvents ||
						historyRow.action == TripActions.importedEvents) && (
						<>
							<tr>
								<td className="main-font-heavy">
									{TranslateService.translate(eventStore, 'ADDED_CATEGORIES')}
								</td>
								<td className="white-space-pre-line">
									{historyRow.actionParams.categoriesToAdd?.length
										? historyRow.actionParams.categoriesToAdd
												?.map(
													(c: TriPlanCategory, idx: number) =>
														Number(idx + 1) + '. ' + c.icon + ' ' + c.title
												)
												?.join('\n')
										: '-'}
								</td>
							</tr>
							<tr>
								<td className="main-font-heavy">
									{TranslateService.translate(eventStore, 'ADDED_EVENTS')}
								</td>
								<td className="white-space-pre-line">
									{historyRow.actionParams.eventsToAdd?.length
										? historyRow.actionParams.eventsToAdd
												?.map(
													(c: SidebarEvent, idx: number) => Number(idx + 1) + '. ' + c.title
												)
												?.join('\n')
										: '-'}
								</td>
							</tr>
							<tr>
								<td className="main-font-heavy">{TranslateService.translate(eventStore, 'ERRORS')}</td>
								<td className="white-space-pre-line">
									{historyRow.actionParams.errors?.length
										? historyRow.actionParams.errors
												?.map((c: SidebarEvent, idx: number) => Number(idx + 1) + '. ' + c)
												?.join('\n')
										: '-'}
								</td>
							</tr>
						</>
					)}
					{(historyRow.action == TripActions.changedEvent ||
						historyRow.action == TripActions.changedCategory ||
						historyRow.action == TripActions.changedSidebarEvent ||
						historyRow.action == TripActions.changedTripDates) &&
						Object.keys(historyRow.actionParams)
							.filter(
								(k) =>
									[
										'openingHours',
										'images',
										'timingError',
										'className',
										'id',
										'count',
										historyRow.action == TripActions.changedCategory && 'categoryName',
									].indexOf(k) == -1
							)
							.filter(
								(changedKey) =>
									Object.keys(historyRow.actionParams[changedKey]).includes('was') &&
									Object.keys(historyRow.actionParams[changedKey]).includes('now')
							)
							.map((changedKey, idx) => (
								<tr>
									<td className="main-font-heavy">
										{(historyRow.action == TripActions.changedEvent ||
											historyRow.action == TripActions.changedCategory) && (
											<>
												{Number(idx + 1)}
												{'. '}
											</>
										)}
										{TranslateService.translate(eventStore, `MODALS.${changedKey.toUpperCase()}`)}
									</td>
									<td>
										<div className="flex-col gap-4">
											<div>
												<span>{TranslateService.translate(eventStore, 'BEFORE')}</span>
												{' : '}
												<span>
													{historyRow.actionParams[changedKey]?.was?.address ||
														historyRow.actionParams[changedKey]?.was ||
														'N/A'}
												</span>
											</div>
											<div>
												<span>{TranslateService.translate(eventStore, 'AFTER')}</span>
												{' : '}
												<span>
													{historyRow.actionParams[changedKey]?.now?.address ||
														historyRow.actionParams[changedKey]?.now ||
														'N/A'}
												</span>
											</div>
										</div>
									</td>
								</tr>
							))}
					<tr>
						<td className="main-font-heavy">{TranslateService.translate(eventStore, 'UPDATED_AT')}</td>
						<td>{when}</td>
					</tr>
				</table>
			),
			confirmBtnCssClass: 'display-none',
			cancelBtnText: TranslateService.translate(eventStore, 'CALCULATE_DISTANCES_MODAL.CANCEL'),
		});
	},
	openAddTaskModal(eventStore: EventStore, tripId: number) {
		const tripName = eventStore.tripName.replaceAll('-', ' ');

		const event_options = eventStore.allEventsComputed.map((x) => ({ value: x.id, label: x.title }));

		const status_options = Object.keys(TriplanTaskStatus).map((x) => ({
			value: x,
			label: ucword(TranslateService.translate(eventStore, x).replaceAll('_', ' ')),
		}));

		const rows = [
			{
				textKey: 'MODALS.TITLE',
				component: ReactModalRenderHelper.renderTextInput(eventStore, 'add-task-title', {
					placeholderKey: 'DUPLICATE_TRIP_MODAL.TITLE.PLACEHOLDER',
					id: 'add-task-title',
					value: undefined,
					className: 'min-width-100-important',
				}),
				required: true,
			},
			{
				textKey: 'CHOOSE_TASK_STATUS.LABEL',
				component: ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'add-task-status',
					{
						options: status_options,
						placeholderKey: 'CHOOSE_TASK_STATUS.PLACEHOLDER',
						removeDefaultClass: true,
						value: TriplanTaskStatus.TODO,
						isClearable: false,
						maxMenuHeight: eventStore.isMobile ? 45 * Math.min(status_options.length, 4) : undefined,
					},
					'add-task-selector'
				),
				required: true,
			},
			// {
			// 	textKey: 'ASSIGN_TASK_CONTENT.LABEL',
			// 	component: ReactModalRenderHelper.renderTextAreaInput(
			// 		eventStore,
			// 		'add-task-content',
			// 		{
			// 			placeholderKey: 'ASSIGN_TASK_CONTENT.PLACEHOLDER',
			// 			value: undefined,
			// 			// readOnly: modalsStore?.isViewMode,
			// 		},
			// 		eventStore.modalValuesRefs['add-task-content']
			// 	),
			// },
			{
				textKey: 'ASSIGN_TASK_TO_EVENT.LABEL',
				component: ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'add-task-event-id',
					{
						options: event_options,
						placeholderKey: 'ASSIGN_TASK_TO_EVENT.PLACEHOLDER',
						removeDefaultClass: true,
						value: undefined,
						isClearable: true,
						maxMenuHeight: eventStore.isMobile ? 45 * Math.min(event_options.length, 4) : undefined,
					},
					'add-task-selector'
				),
			},
			{
				textKey: 'MUST_BE_DONE_BEFORE.LABEL',
				component: ReactModalRenderHelper.renderDatePickerInput(
					eventStore,
					'add-task-must-be-done-before',
					{
						placeholderKey: 'MUST_BE_DONE_BEFORE.PLACEHOLDER',
						value: undefined,
					},
					eventStore.modalValuesRefs['add-task-must-be-done-before']
				),
			},
		];

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'ADD_TASK.MODAL_TITLE')}: ${tripName}`,
			content: (
				<div className="flex-col gap-20">
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MODALS.ADD_TASK.CONTENT'),
						}}
					/>
					<div>
						{rows.map((row, idx) =>
							ReactModalRenderHelper.renderInputWithLabel(
								eventStore,
								row.textKey,
								row.component,
								getClasses('padding-bottom-20', idx == 0 && 'border-top-gray', 'border-bottom-gray'),
								undefined,
								'add-task-label',
								row.required
							)
						)}
					</div>
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'CREATE_TASK'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: async () => {
				const tripDataSource = eventStore.dataService.getDataSourceName();
				const title: string = eventStore.modalValues['add-task-title']?.length
					? eventStore.modalValues['add-task-title']
					: undefined;
				const eventId: number = Number(eventStore.modalValues['add-task-event-id']?.value);
				const status: TriplanTaskStatus =
					eventStore.modalValues['add-task-status']?.value ?? TriplanTaskStatus.TODO;
				const description: string = eventStore.modalValues['add-task-content'];
				const mustBeDoneBefore: number = eventStore.modalValues['add-task-must-be-done-before'];

				if (tripDataSource === TripDataSource.DB) {
					const data = {
						tripId: eventStore.tripId,
						title,
						eventId,
						status,
						description,
						mustBeDoneBefore: mustBeDoneBefore ? new Date(mustBeDoneBefore).getTime() / 1000 : undefined,
					};

					await DataServices.DBService.createTask(data)
						.then((response) => {
							const { data } = response.data;

							// log history
							LogHistoryService.logHistory(eventStore, TripActions.createdTask, {
								name: title,
								eventName: eventId
									? eventStore.allEventsComputed.find((e) => Number(e.id) == Number(eventId))?.title
									: undefined,
							});

							ReactModalService.internal.closeModal(eventStore);

							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.CREATE.TITLE',
								'MODALS.CREATE_TASK.CONTENT',
								'success'
							);

							setTimeout(() => {
								eventStore.reloadTasks();
							}, 1000);
						})
						.catch((e) => {
							if (e.response.data.statusCode === 409) {
								ReactModalService.internal.alertMessage(
									eventStore,
									'MODALS.ERROR.TITLE',
									'TASK_ALREADY_EXISTS',
									'error'
								);
							} else {
								ReactModalService.internal.openOopsErrorModal(eventStore);
							}
						});
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
						'error'
					);
					return;
				}
			},
		});
	},
	openEditTaskModal(eventStore: EventStore, task: TriplanTask) {
		const tripName = eventStore.tripName.replaceAll('-', ' ');

		const event_options = eventStore.allEventsComputed.map((x) => ({ value: x.id, label: x.title }));

		const status_options = Object.keys(TriplanTaskStatus).map((x) => ({
			value: x,
			label: ucword(TranslateService.translate(eventStore, x).replaceAll('_', ' ')),
		}));

		const rows = [
			{
				textKey: 'MODALS.TITLE',
				component: ReactModalRenderHelper.renderTextInput(eventStore, 'add-task-title', {
					placeholderKey: 'DUPLICATE_TRIP_MODAL.TITLE.PLACEHOLDER',
					id: 'add-task-title',
					value: task.title,
					className: 'min-width-100-important',
				}),
				required: true,
			},
			{
				textKey: 'CHOOSE_TASK_STATUS.LABEL',
				component: ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'add-task-status',
					{
						options: status_options,
						placeholderKey: 'CHOOSE_TASK_STATUS.PLACEHOLDER',
						removeDefaultClass: true,
						value: task.status,
						isClearable: false,
						maxMenuHeight: eventStore.isMobile ? 45 * Math.min(status_options.length, 4) : undefined,
					},
					'add-task-selector'
				),
				required: true,
			},
			{
				textKey: 'ASSIGN_TASK_TO_EVENT.LABEL',
				component: ReactModalRenderHelper.renderSelectInput(
					eventStore,
					'add-task-event-id',
					{
						options: event_options,
						placeholderKey: 'ASSIGN_TASK_TO_EVENT.PLACEHOLDER',
						removeDefaultClass: true,
						value: task.eventId,
						isClearable: true,
						maxMenuHeight: eventStore.isMobile ? 45 * Math.min(event_options.length, 4) : undefined,
					},
					'add-task-selector'
				),
			},
			{
				textKey: 'MUST_BE_DONE_BEFORE.LABEL',
				component: ReactModalRenderHelper.renderDatePickerInput(
					eventStore,
					'add-task-must-be-done-before',
					{
						placeholderKey: 'MUST_BE_DONE_BEFORE.PLACEHOLDER',
						value: task.mustBeDoneBefore
							? new Date(task.mustBeDoneBefore * 1000).toISOString().split('.')[0]
							: undefined,
					},
					eventStore.modalValuesRefs['add-task-must-be-done-before']
				),
			},
		];

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'EDIT_TASK.MODAL_TITLE', {
				taskName: task.title,
			})}: ${tripName}`,
			content: (
				<div className="flex-col gap-20">
					<div
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MODALS.ADD_TASK.CONTENT'),
						}}
					/>
					<div>
						{rows.map((row, idx) =>
							ReactModalRenderHelper.renderInputWithLabel(
								eventStore,
								row.textKey,
								row.component,
								getClasses('padding-bottom-20', idx == 0 && 'border-top-gray', 'border-bottom-gray'),
								undefined,
								'add-task-label',
								row.required
							)
						)}
					</div>
				</div>
			),
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
			confirmBtnCssClass: 'primary-button',
			onConfirm: async () => {
				const tripDataSource = eventStore.dataService.getDataSourceName();
				const title: string = eventStore.modalValues['add-task-title']?.length
					? eventStore.modalValues['add-task-title']
					: undefined;
				const eventId: number = Number(eventStore.modalValues['add-task-event-id']?.value);
				const status: TriplanTaskStatus =
					eventStore.modalValues['add-task-status']?.value ?? TriplanTaskStatus.TODO;
				const description: string = eventStore.modalValues['add-task-content'];
				const mustBeDoneBefore: number = eventStore.modalValues['add-task-must-be-done-before'];

				if (tripDataSource === TripDataSource.DB) {
					const data = {
						tripId: eventStore.tripId,
						title,
						eventId,
						status,
						description,
						mustBeDoneBefore: mustBeDoneBefore ? new Date(mustBeDoneBefore).getTime() / 1000 : undefined,
					};

					await DataServices.DBService.updateTask(task.id, data)
						.then((response) => {
							const { data } = response.data;

							// log history
							LogHistoryService.logHistory(eventStore, TripActions.updatedTask, {
								name: title,
								eventName: eventId
									? eventStore.allEventsComputed.find((e) => Number(e.id) == Number(eventId))?.title
									: undefined,
							});

							ReactModalService.internal.closeModal(eventStore);

							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.CREATE.TITLE',
								'MODALS.UPDATE_TASK.CONTENT',
								'success'
							);

							setTimeout(() => {
								eventStore.reloadTasks();
							}, 1000);
						})
						.catch((e) => {
							if (e.response.data.statusCode === 409) {
								ReactModalService.internal.alertMessage(
									eventStore,
									'MODALS.ERROR.TITLE',
									'TASK_ALREADY_EXISTS',
									'error'
								);
							} else {
								ReactModalService.internal.openOopsErrorModal(eventStore);
							}
						});
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'ACTION_NOT_SUPPORTED_ON_LOCAL_TRIPS',
						'error'
					);
					return;
				}
			},
		});
	},
	openViewTaskModal(eventStore: EventStore, task: TriplanTask, title: string) {},
};

export default ReactModalService;
