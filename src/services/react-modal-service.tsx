import { EventStore } from '../stores/events-store';
import TranslateService from './translate-service';
import React from 'react';
import { runInAction } from 'mobx';
import IconSelector from '../components/inputs/icon-selector/icon-selector';
import { getClasses, ucfirst } from '../utils/utils';

import Alert from 'sweetalert2';
import { defaultTimedEventDuration, getLocalStorageKeys, LS_CUSTOM_DATE_RANGE } from '../utils/defaults';
import { Observer } from 'mobx-react';
import {
	CalendarEvent,
	ImportEventsConfirmInfo,
	LocationData,
	SidebarEvent,
	WeeklyOpeningHoursData,
} from '../utils/interfaces';
import { TripDataSource, TriplanEventPreferredTime, TriplanPriority } from '../utils/enums';
import { convertMsToHM, formatDuration, getInputDateTimeValue, validateDuration } from '../utils/time-utils';
import SelectInput, { SelectInputOption } from '../components/inputs/select-input/select-input';
import TextInput from '../components/inputs/text-input/text-input';
import TextareaInput from '../components/inputs/textarea-input/textarea-input';
import DatePicker from '../components/inputs/date-picker/date-picker';
import { EventInput } from '@fullcalendar/react';
import Button, { ButtonFlavor } from '../components/common/button/button';
import ImportService from './import-service';

// @ts-ignore
// import ImageGallery from 'react-image-gallery';
// import { Carousel } from "react-responsive-carousel";
import Slider from 'react-slick';

// @ts-ignore
// import _ from 'lodash';
import * as _ from 'lodash';
import { DataServices, lsTripNameToTripName } from './data-handlers/data-handler-base';
import PlacesTinder from '../layouts/main-page/modals/places-tinder/places-tinder';

const ReactModalRenderHelper = {
	renderInputWithLabel: (eventStore: EventStore, textKey: string, input: JSX.Element, className?: string) => {
		return (
			<div className={getClasses(['input-with-label flex-row gap-30 align-items-center'], className)}>
				<label>{TranslateService.translate(eventStore, textKey)}</label>
				{input}
			</div>
		);
	},
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
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value;
		}

		// if (modalValueName === 'location'){
		//     debugger;
		// }

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
			/>
		);
	},
	renderCustomGroup: (eventStore: EventStore, content: any[]): JSX.Element => {
		return (
			<div className={'flex-row gap-10'}>
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
		},
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value;
		}

		return (
			<DatePicker
				id={extra.id}
				className={extra.className}
				ref={ref}
				modalValueName={modalValueName}
				placeholder={extra.placeholder}
				placeholderKey={extra.placeholderKey}
			/>
		);
	},
	renderTextAreaInput: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { rows?: number; placeholderKey?: string; placeholder?: string; id?: string; value?: string },
		ref?: any
	) => {
		if (extra.value && !eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value;
		}

		return (
			<TextareaInput
				rows={extra.rows || 3}
				id={extra.id}
				className={'textAreaInput'}
				ref={ref}
				modalValueName={modalValueName}
				placeholder={extra.placeholder}
				placeholderKey={extra.placeholderKey}
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
			readOnly?: boolean;
			maxMenuHeight?: number;
			removeDefaultClass?: boolean;
		},
		wrapperClassName: string,
		ref?: any
	) => {
		return (
			<SelectInput
				ref={ref}
				readOnly={extra.readOnly}
				id={extra.id}
				name={extra.name}
				options={extra.options}
				placeholderKey={extra.placeholderKey}
				modalValueName={modalValueName}
				maxMenuHeight={extra.maxMenuHeight}
				removeDefaultClass={extra.removeDefaultClass}
			/>
		);
	},
	renderCategorySelector: (
		eventStore: EventStore,
		modalValueName: string,
		extra: { id?: string; name?: string; value: any },
		ref?: any
	) => {
		const options = eventStore.categories
			.sort((a, b) => a.id - b.id)
			.map((x, index) => ({
				value: x.id,
				label: x.icon ? `${x.icon} ${x.title}` : x.title,
			}));

		if (!eventStore.modalValues[modalValueName]) {
			eventStore.modalValues[modalValueName] = extra.value
				? options.find((x) => x.value == extra.value)
				: undefined;
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

		const options = Object.values(TriplanPriority)
			.filter((x) => !Number.isNaN(Number(x)))
			.map((val, index) => ({
				value: values[index],
				label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
			}));

		if (!eventStore.modalValues[modalValueName]) {
			const idx = values.indexOf(extra.value?.toString());
			eventStore.modalValues[modalValueName] = idx > -1 && idx < options.length ? options[idx] : undefined;
		}

		return ReactModalRenderHelper.renderSelectInput(
			eventStore,
			modalValueName,
			{ ...extra, options, placeholderKey: 'TYPE_TO_SEARCH_PLACEHOLDER' },
			'priority-selector',
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

		const options = Object.values(TriplanEventPreferredTime)
			.filter((x) => !Number.isNaN(Number(x)))
			.map((val, index) => ({
				value: values[index],
				label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
			}));

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
				input = ReactModalRenderHelper.renderCustomGroup(eventStore, row.settings.extra.content);
				break;
			case 'date-picker':
				input = ReactModalRenderHelper.renderDatePickerInput(
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
				const images = row.settings.extra.value?.replace(/\n^/, '').replace(/$\n/, '').split('\n') || [];
				input = ReactModalRenderHelper.renderTextAreaInput(
					eventStore,
					row.settings.modalValueName,
					row.settings.extra,
					row.settings.ref
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
						{images && (
							<Slider {...sliderSettings}>
								{images.map((image: string) => (
									<img
										className="slider-image"
										style={{
											width: 300,
											height: 150,
										}}
										alt={''}
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
	renderRow: (eventStore: EventStore, row: { settings: any; textKey: string; className?: string }) => {
		const input = ReactModalRenderHelper.getRowInput(eventStore, row);

		if (input) {
			return ReactModalRenderHelper.renderInputWithLabel(eventStore, row.textKey, input, row.className);
		}
	},
};

const getDefaultSettings = (eventStore: EventStore) => {
	return {
		show: true,
		showCancel: true,
		cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
		confirmBtnText: TranslateService.translate(eventStore, 'MODALS.SAVE'),
		confirmBtnCssClass: 'primary-button',
		cancelBtnCssClass: 'link-button',
		dependencies: [eventStore.modalSettings, eventStore.secondModalSettings, eventStore.modalValues],
		customClass: 'triplan-react-modal',
		reverseButtons: eventStore.getCurrentDirection() === 'rtl',
		onCancel: () => {
			ReactModalService.internal.closeModal(eventStore);
		},
	};
};

const ReactModalService = {
	internal: {
		openModal: (eventStore: EventStore, settings: any, isSecondModal: boolean = false) => {
			if (isSecondModal) {
				eventStore.setSecondModalSettings(settings);
			} else {
				eventStore.setModalSettings(settings);
			}
		},
		alertMessage: (eventStore: EventStore, titleKey: string, contentKey: string, type: 'error' | 'success') => {
			Alert.fire(
				TranslateService.translate(eventStore, titleKey),
				TranslateService.translate(eventStore, contentKey),
				type
			);
		},
		getSidebarEventInputs: (
			eventStore: EventStore,
			initialData: Partial<{ categoryId?: number; location?: LocationData }> | Partial<SidebarEvent> | any = {}
		) => {
			const initLocation = () => {
				// @ts-ignore
				window.initLocationPicker('location-input', 'selectedLocation', undefined);
			};

			const setManualLocation = () => {
				// @ts-ignore
				window.setManualLocation('location-input', 'selectedLocation');
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
							value: initialData?.icon || initialData?.extendedProps?.icon,
						},
					},
					textKey: 'MODALS.ICON',
					className: 'border-top-gray',
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
						},
					},
					textKey: 'MODALS.TITLE',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'category',
						ref: eventStore.modalValuesRefs['category'],
						type: 'category-selector',
						extra: {
							placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
							value: initialData?.category || initialData?.extendedProps?.categoryId,
						},
					},
					textKey: 'MODALS.CATEGORY',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'images', // add column 4
						ref: eventStore.modalValuesRefs['images'],
						type: 'images',
						extra: {
							placeholderKey: 'MODALS.IMAGES_PLACEHOLDER',
							value: initialData.images,
						},
					},
					textKey: 'MODALS.IMAGES',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'description',
						ref: eventStore.modalValuesRefs['description'],
						type: 'textarea',
						extra: {
							placeholderKey: 'MODALS.DESCRIPTION_PLACEHOLDER',
							value: initialData.description,
						},
					},
					textKey: 'MODALS.DESCRIPTION',
					className: 'border-top-gray',
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
							value:
								initialData?.duration ||
								initialData?.extendedProps?.duration ||
								defaultTimedEventDuration,
						},
					},
					textKey: 'MODALS.DURATION',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'priority',
						ref: eventStore.modalValuesRefs['priority'],
						type: 'priority-selector',
						extra: {
							value:
								initialData?.priority || initialData?.extendedProps?.priority || TriplanPriority.unset,
							maxMenuHeight: 45 * 4,
						},
					},
					textKey: 'MODALS.PRIORITY',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'preferred-time',
						ref: eventStore.modalValuesRefs['preferred-time'],
						type: 'preferred-time-selector',
						extra: {
							value:
								initialData.preferredTime ||
								initialData?.extendedProps?.preferredTime ||
								TriplanEventPreferredTime.unset,
							maxMenuHeight: 45 * 4,
						},
					},
					textKey: 'MODALS.PREFERRED_TIME',
					className: 'border-top-gray',
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
								initialData.location?.address ||
								selectedLocation?.address ||
								'',
							onClick: initLocation,
							onKeyUp: setManualLocation,
							autoComplete: 'off',
							placeholder: `${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}`,
						},
					},
					textKey: 'MODALS.LOCATION',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'opening-hours',
						ref: eventStore.modalValuesRefs['opening-hours'],
						type: 'opening-hours',
						extra: {
							value: initialData.openingHours || initialData?.extendedProps?.openingHours,
						},
					},
					textKey: 'MODALS.OPENING_HOURS',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'more-info',
						ref: eventStore.modalValuesRefs['more-info'],
						type: 'text',
						extra: {
							placeholderKey: 'MODALS.MORE_INFO_PLACEHOLDER',
							value: initialData.moreInfo,
						},
					},
					textKey: 'MODALS.MORE_INFO',
					className: 'border-top-gray',
				},
			];
			inputs[inputs.length - 1].className += ' border-bottom-gray padding-bottom-20';
			return inputs;
		},
		getCalendarEventInputs: (
			eventStore: EventStore,
			initialData: Partial<{ categoryId?: number; location?: LocationData }> | Partial<SidebarEvent> | any = {}
		) => {
			const initLocation = () => {
				// @ts-ignore
				window.initLocationPicker('location-input', 'selectedLocation', undefined);
			};

			const setManualLocation = () => {
				// @ts-ignore
				window.setManualLocation('location-input', 'selectedLocation');
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
							value: initialData?.icon || initialData?.extendedProps?.icon,
						},
					},
					textKey: 'MODALS.ICON',
					className: 'border-top-gray',
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
						},
					},
					textKey: 'MODALS.TITLE',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'start-time',
						ref: eventStore.modalValuesRefs['start-time'],
						type: 'date-picker',
						extra: {
							placeholder: `${TranslateService.translate(
								eventStore,
								'MODALS.PLACEHOLDER.PREFIX'
							)} ${TranslateService.translate(eventStore, 'MODALS.START_TIME')}`,
							value: getInputDateTimeValue(initialData?.start),
						},
					},
					textKey: 'MODALS.START_TIME',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'end-time',
						ref: eventStore.modalValuesRefs['end-time'],
						type: 'date-picker',
						extra: {
							placeholder: `${TranslateService.translate(
								eventStore,
								'MODALS.PLACEHOLDER.PREFIX'
							)} ${TranslateService.translate(eventStore, 'MODALS.END_TIME')}`,
							value: getInputDateTimeValue(initialData?.end),
						},
					},
					textKey: 'MODALS.END_TIME',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'images', // add column 5
						ref: eventStore.modalValuesRefs['images'],
						type: 'images',
						extra: {
							placeholderKey: 'MODALS.IMAGES_PLACEHOLDER',
							value: initialData.images,
						},
					},
					textKey: 'MODALS.IMAGES',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'category',
						ref: eventStore.modalValuesRefs['category'],
						type: 'category-selector',
						extra: {
							placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
							value: initialData?.category || initialData?.extendedProps?.categoryId,
						},
					},
					textKey: 'MODALS.CATEGORY',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'description',
						ref: eventStore.modalValuesRefs['description'],
						type: 'textarea',
						extra: {
							placeholderKey: 'MODALS.DESCRIPTION_PLACEHOLDER',
							value: initialData.description,
						},
					},
					textKey: 'MODALS.DESCRIPTION',
					className: 'border-top-gray',
				},
				// {
				//     settings: {
				//         modalValueName: 'duration',
				//         ref: eventStore.modalValuesRefs['duration'],
				//         type: 'text',
				//         extra: {
				//             // value: defaultTimedEventDuration,
				//             placeholder: `${TranslateService.translate(eventStore, 'MODALS.PLACEHOLDER.PREFIX')} ${TranslateService.translate(eventStore, 'MODALS.DURATION')}`,
				//             // placeholder: defaultTimedEventDuration,
				//             value: initialData?.duration || initialData?.extendedProps?.duration || defaultTimedEventDuration
				//         },
				//     },
				//     textKey: 'MODALS.DURATION',
				//     className: 'border-top-gray'
				// },
				{
					settings: {
						modalValueName: 'priority',
						ref: eventStore.modalValuesRefs['priority'],
						type: 'priority-selector',
						extra: {
							value:
								initialData?.priority || initialData?.extendedProps?.priority || TriplanPriority.unset,
							maxMenuHeight: 45 * 4,
						},
					},
					textKey: 'MODALS.PRIORITY',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'preferred-time',
						ref: eventStore.modalValuesRefs['preferred-time'],
						type: 'preferred-time-selector',
						extra: {
							value:
								initialData.preferredTime ||
								initialData?.extendedProps?.preferredTime ||
								TriplanEventPreferredTime.unset,
							maxMenuHeight: 45 * 4,
						},
					},
					textKey: 'MODALS.PREFERRED_TIME',
					className: 'border-top-gray',
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
								initialData.location?.address ||
								selectedLocation?.address ||
								'',
							onClick: initLocation,
							onKeyUp: setManualLocation,
							autoComplete: 'off',
							placeholder: `${TranslateService.translate(eventStore, 'MODALS.LOCATION.PLACEHOLDER')}`,
						},
					},
					textKey: 'MODALS.LOCATION',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'opening-hours',
						ref: eventStore.modalValuesRefs['opening-hours'],
						type: 'opening-hours',
						extra: {
							value: initialData.openingHours || initialData?.extendedProps?.openingHours,
						},
					},
					textKey: 'MODALS.OPENING_HOURS',
					className: 'border-top-gray',
				},
				{
					settings: {
						modalValueName: 'more-info',
						ref: eventStore.modalValuesRefs['more-info'],
						type: 'text',
						extra: {
							placeholderKey: 'MODALS.MORE_INFO_PLACEHOLDER',
							value: initialData.moreInfo,
						},
					},
					textKey: 'MODALS.MORE_INFO',
					className: 'border-top-gray',
				},
			];
			inputs[inputs.length - 1].className += ' border-bottom-gray padding-bottom-20';
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
				categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
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

		const onConfirm = () => {
			// @ts-ignore
			const newIcon = eventStore.modalValues.icon?.label;

			// @ts-ignore
			const newName = eventStore.modalValues.name;

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
				runInAction(() => {
					eventStore.setCategories([
						...eventStore.categories,
						{
							id: eventStore.createCategoryId(),
							title: newName,
							icon: newIcon,
						},
					]);

					ReactModalService.internal.closeModal(eventStore);
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
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
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
	openEditTripModal: (eventStore: EventStore, LSTripName: string) => {
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
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{ReactModalRenderHelper.renderInputWithLabel(
							eventStore,
							'MODALS.TITLE',
							ReactModalRenderHelper.renderTextInput(eventStore, 'name', {
								placeholderKey: 'ADD_CATEGORY_MODAL.CATEGORY_NAME.PLACEHOLDER',
								id: 'new-name',
							}),
							'border-top-gray border-bottom-gray padding-bottom-20'
						)}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
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
							ReactModalService.internal.alertMessage(
								eventStore,
								'MODALS.ERROR.TITLE',
								'MODALS.ERROR.OOPS_SOMETHING_WENT_WRONG',
								'error'
							);
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
	openAddSidebarEventModal: (
		eventStore: EventStore,
		categoryId?: number,
		initialData: any = {},
		isSecondModal: boolean = false
	) => {
		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const handleAddSidebarEventResult = (eventStore: EventStore, initialCategoryId?: number) => {
			if (!eventStore) return;

			let {
				icon,
				title,
				duration,
				priority,
				preferredTime,
				description,
				categoryId,
				location,
				openingHours,
				images,
			} = ReactModalService.internal.getModalValues(eventStore);

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
			} as SidebarEvent;

			const isDurationValid =
				duration &&
				duration.split(':').length == 2 &&
				!Number.isNaN(duration.split(':')[0]) &&
				!Number.isNaN(duration.split(':')[1]) &&
				parseInt(duration.split(':')[0]) >= 0 &&
				parseInt(duration.split(':')[1]) >= 0 &&
				parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1]) > 0;
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

			const existingSidebarEvents = { ...eventStore.getSidebarEvents };
			existingSidebarEvents[categoryId] = existingSidebarEvents[categoryId] || [];
			existingSidebarEvents[categoryId].push(currentEvent);
			eventStore.setSidebarEvents(existingSidebarEvents);

			const allEventsEvent = {
				...currentEvent,
				category: categoryId.toString(),
			};
			eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), allEventsEvent]);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ADDED.TITLE',
				'MODALS.ADDED.CONTENT',
				'success'
			);

			ReactModalService.internal.closeModal(eventStore);
		};

		const onConfirm = () => {
			handleAddSidebarEventResult(eventStore, categoryId);
		};

		const category = categoryId
			? eventStore.categories.find((c) => c.id.toString() === categoryId.toString())
			: undefined;

		const title = category
			? `${TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CATEGORY.TITLE')}: ${category.title}`
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
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(
			eventStore,
			{
				...getDefaultSettings(eventStore),
				title,
				content,
				onConfirm,
			},
			isSecondModal
		);
	},
	openEditSidebarEventModal: (
		eventStore: EventStore,
		event: SidebarEvent,
		removeEventFromSidebarById: (eventId: string) => void,
		addToEventsToCategories: (value: any) => void
	) => {
		const handleEditSidebarEventResult = (eventStore: EventStore, originalEvent: SidebarEvent) => {
			const eventId = originalEvent.id!;
			if (!eventStore) return;

			const oldEvent = eventStore.allEvents.find((e) => e.id === eventId);
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
				categoryId,
				location,
				openingHours,
				images,
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

			if (originalEvent.extendedProps) {
				Object.keys(originalEvent.extendedProps).forEach((key) => {
					if (!Object.keys(currentEvent).includes(key)) {
						// @ts-ignore
						currentEvent[key] = originalEvent.extendedProps[key];
					}
				});
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
			const oldCategory = eventStore.allEvents.find((e) => e.id === event.id)!.category;
			const isCategoryChanged = oldCategory != categoryId;
			const isLocationChanged = originalEvent.location != currentEvent.location;
			const isImagesChanged = originalEvent.images != currentEvent.images; // add column 11
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
				isMoreInfoChanged;

			if (isCategoryChanged) {
				// remove it from the old category
				removeEventFromSidebarById(event.id);

				// add it to the new category
				// @ts-ignore
				currentEvent = {
					...currentEvent,
					id: eventStore.createEventId(),
					extendedProps: {
						categoryId,
					},
				};

				// @ts-ignore
				currentEvent['className'] = currentEvent.priority ? `priority-${currentEvent.priority}` : undefined;

				const sidebarEvents = eventStore.sidebarEvents;

				sidebarEvents[parseInt(categoryId)] = sidebarEvents[parseInt(categoryId)] || [];
				sidebarEvents[parseInt(categoryId)].push(currentEvent);
				eventStore.setSidebarEvents(sidebarEvents);
				const allEventsEvent = {
					...currentEvent,
					category: categoryId.toString(),
				};
				eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== eventId), allEventsEvent]);

				addToEventsToCategories(currentEvent);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_EVENT.CONTENT',
					'success'
				);
			} else if (isChanged) {
				const eventFound = eventStore.allEvents.find((e) => e.id === event.id);
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
						moreInfo,
						extendedProps: {
							categoryId,
						},
					} as SidebarEvent);
					eventStore.setAllEvents(eventStore.allEvents);

					const newSidebarEvents: Record<number, SidebarEvent[]> = {};
					const existingSidebarEvents = eventStore.getSidebarEvents;
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
									images,
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
					eventStore.setSidebarEvents(newSidebarEvents);

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
		const initialData = eventStore.allEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!initialData) {
			console.error('event not found');
			return;
		}

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = () => {
			handleEditSidebarEventResult(eventStore, event);
			ReactModalService.internal.closeModal(eventStore);
		};

		const title = `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${event.title}`;
		const inputs = ReactModalService.internal.getSidebarEventInputs(eventStore, initialData);

		const content = (
			<Observer>
				{() => (
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title,
			content,
			onConfirm,
		});
	},
	openDuplicateSidebarEventModal: (eventStore: EventStore, event: SidebarEvent) => {
		const handleDuplicateSidebarEventResult = (eventStore: EventStore, event: SidebarEvent) => {
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
				moreInfo,
			} as SidebarEvent;

			const isDurationValid =
				duration.split(':').length == 2 &&
				!Number.isNaN(duration.split(':')[0]) &&
				!Number.isNaN(duration.split(':')[1]) &&
				parseInt(duration.split(':')[0]) >= 0 &&
				parseInt(duration.split(':')[1]) >= 0 &&
				parseInt(duration.split(':')[0]) + parseInt(duration.split(':')[1]) > 0;
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

			const foundEvent = eventStore.allEvents.find((e) => e.id.toString() === event.id.toString());
			if (!foundEvent) {
				console.error('event not found');
				return;
			}
			const categoryId = foundEvent.category || eventStore.categories[0].id.toString();

			const existingSidebarEvents = { ...eventStore.getSidebarEvents };
			existingSidebarEvents[parseInt(categoryId)].push(currentEvent);
			eventStore.setSidebarEvents(existingSidebarEvents);

			const allEventsEvent = {
				...currentEvent,
				category: categoryId.toString(),
			};
			eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== currentEvent.id), allEventsEvent]);

			ReactModalService.internal.alertMessage(
				eventStore,
				'MODALS.ADDED.TITLE',
				'MODALS.ADDED.CONTENT',
				'success'
			);
		};

		// on event click - show edit event popup
		const eventId = event.id;
		const initialData = eventStore.allEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!initialData) {
			console.error('event not found');
			return;
		}

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = () => {
			handleDuplicateSidebarEventResult(eventStore, event);
			ReactModalService.internal.closeModal(eventStore);
		};

		const title = `${TranslateService.translate(eventStore, 'MODALS.DUPLICATE')}: ${event.title}`;
		const inputs = ReactModalService.internal.getSidebarEventInputs(eventStore, initialData);

		const content = (
			<Observer>
				{() => (
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
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
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{ReactModalRenderHelper.renderSelectInput(
							eventStore,
							'sidebar-event-to-add-to-calendar',
							{ options, placeholderKey: 'SELECT_SIDEBAR_EVENT_PLACEHOLDER', removeDefaultClass: true },
							'add-event-from-sidebar-selector'
						)}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
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
		});
	},
	openAddCalendarEventModal: (eventStore: EventStore, addToEventsToCategories: (value: any) => void, info: any) => {
		const title = TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CALENDAR.TITLE');

		// if there are no sidebar events - open add new calendar modal.
		if (eventStore.allSidebarEvents.length === 0) {
			return ReactModalService.openAddCalendarEventNewModal(eventStore, addToEventsToCategories, info);
		}

		const content = (
			<Observer>
				{() => (
					<div className="flex-row justify-content-center gap-10">
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
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
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
		const handleAddCalendarEventResult = (eventStore: EventStore) => {
			if (!eventStore) return true;

			let {
				icon,
				title,
				priority,
				preferredTime,
				description,
				categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
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
				extendedProps: {
					title,
					icon,
					priority: priority as TriplanPriority,
					preferredTime: preferredTime as TriplanEventPreferredTime,
					description,
					categoryId: categoryId,
					location,
					openingHours,
				},
			} as CalendarEvent;

			// @ts-ignore
			const millisecondsDiff = currentEvent.end - currentEvent.start;
			currentEvent.duration = convertMsToHM(millisecondsDiff);

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

			eventStore.setCalendarEvents([...eventStore.getJSCalendarEvents(), currentEvent]);

			addToEventsToCategories(currentEvent);

			eventStore.setAllEvents([
				...eventStore.allEvents.filter((x) => x.id !== currentEvent.id),
				{ ...currentEvent, category: categoryId },
			]);

			if (sidebarEventData) {
				const newSidebarEvents = _.cloneDeep(eventStore.sidebarEvents);
				Object.keys(newSidebarEvents).forEach((category) => {
					newSidebarEvents[Number(category)] = newSidebarEvents[Number(category)].filter(
						(e) => e.id !== initialData.id
					);
				});
				eventStore.setSidebarEvents(newSidebarEvents);
			}

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
			...sidebarEventData,
		};

		// @ts-ignore
		window.selectedLocation = initialData.location || undefined;

		// @ts-ignore
		window.openingHours = initialData.openingHours || undefined;

		const onConfirm = () => {
			const isOk = handleAddCalendarEventResult(eventStore);
			if (isOk) {
				ReactModalService.internal.closeModal(eventStore);
			}
		};

		const title = TranslateService.translate(eventStore, 'MODALS.ADD_EVENT_TO_CALENDAR.TITLE');
		const inputs = ReactModalService.internal.getCalendarEventInputs(eventStore, initialData);

		const content = (
			<Observer>
				{() => (
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title,
			content,
			onConfirm,
			onCancel: () => {
				if (eventStore.allSidebarEvents.length !== 0) {
					ReactModalService.openAddCalendarEventModal(eventStore, addToEventsToCategories, info);
				} else {
					ReactModalService.internal.closeModal(eventStore);
				}
			},
		});
	},
	openDeleteCategoryModal: (eventStore: EventStore, categoryId: number) => {
		const newCategories = eventStore.categories.filter((c) => c.id != categoryId);
		const newCalendarEvents = eventStore.calendarEvents.filter(
			(c) => c.category != categoryId && (!c.extendedProps || c.extendedProps.categoryId != categoryId)
		);
		const newAllEvents = eventStore.allEvents.filter((c) => c.category != categoryId.toString());
		const newSidebarEvents = { ...eventStore.getSidebarEvents };
		delete newSidebarEvents[categoryId];

		const html = [
			TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT'),
			'',
			TranslateService.translate(eventStore, 'MODALS.DELETE_CATEGORY.CONTENT.IT_WILL_AFFECT'),
			'<ul>' +
				[
					`<li>${eventStore.calendarEvents.length - newCalendarEvents.length} ${TranslateService.translate(
						eventStore,
						'CALENDAR_EVENTS'
					)}</li>`,
					`<li>${
						Object.values(eventStore.getSidebarEvents).flat().length -
						Object.values(newSidebarEvents).flat().length
					} ${TranslateService.translate(eventStore, 'SIDEBAR_EVENTS')}</li>`,
					`<li>${eventStore.allEvents.length - newAllEvents.length} ${TranslateService.translate(
						eventStore,
						'TOTAL_EVENTS'
					)}</li>`,
				].join('') +
				'</ul>',
		].join('<br/>');

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, 'MODALS.DELETE')}: ${
				eventStore.categories.find((c) => c.id.toString() === categoryId.toString())!.title
			}`,
			content: <div dangerouslySetInnerHTML={{ __html: html }} />,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, 'MODALS.DELETE'),
			confirmBtnCssClass: 'primary-button red',
			onConfirm: () => {
				// delete from sidebar
				eventStore.setSidebarEvents(newSidebarEvents);

				// delete from categories
				eventStore.setCategories([...newCategories]);

				// delete from calendar
				if (newCalendarEvents.length === 0) {
					eventStore.allowRemoveAllCalendarEvents = true;
				}
				eventStore.setCalendarEvents([...newCalendarEvents]);

				// delete from all events
				eventStore.setAllEvents([...newAllEvents]);

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.DELETED.TITLE',
					'MODALS.DELETED.CATEGORY.CONTENT',
					'success'
				);

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},
	openEditCategoryModal: (TriplanCalendarRef: any, eventStore: EventStore, categoryId: number) => {
		const category = eventStore.categories.find((c) => c.id.toString() === categoryId.toString());
		if (!category) return;
		const categoryName = category.title;

		const onConfirm = () => {
			const oldIcon = category.icon;
			const oldName = categoryName;

			// @ts-ignore
			const newIcon = eventStore.modalValues.icon?.label;

			// @ts-ignore
			const newName = eventStore.modalValues.name;

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

			const iconChanged = oldIcon !== newIcon;
			const titleChanged = oldName !== newName;
			const isChanged = titleChanged || iconChanged;

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

				eventStore.setCategories([
					...eventStore.categories.filter((c) => c.id.toString() !== categoryId.toString()),
					{
						id: categoryId,
						title: newName,
						icon: newIcon,
					},
				]);

				// update our store
				const updatedCalenderEvents = [...eventStore.getJSCalendarEvents()];
				updatedCalenderEvents.forEach((e) => {
					const event = eventStore.allEvents.find((ev) => ev.id.toString() === e.id!.toString());
					if (event && event.category && event.category === categoryId.toString()) {
						if (e.icon === oldIcon) {
							e.icon = newIcon;
						}
					}
				});

				eventStore.setCalendarEvents([...updatedCalenderEvents]);

				// remove from fullcalendar store
				TriplanCalendarRef.current.refreshSources();

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
		];
		const content = (
			<Observer>
				{() => (
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
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
	openEditCalendarEventModal: (
		eventStore: EventStore,
		addEventToSidebar: (event: SidebarEvent) => boolean,
		info: any
	) => {
		ReactModalService.internal.resetWindowVariables(eventStore);

		// on event click - show edit event popup
		const eventId = info.event.id;
		const currentEvent = eventStore.allEvents.find((e: any) => e.id.toString() === eventId.toString());
		if (!currentEvent) {
			console.error('event not found');
			return;
		}

		const handleDeleteEventResult = (
			currentEvent: CalendarEvent,
			addEventToSidebar: (event: SidebarEvent) => boolean
		) => {
			// add back to sidebar
			if (addEventToSidebar(currentEvent)) {
				// remove from calendar
				eventStore.allowRemoveAllCalendarEvents = true;
				eventStore.deleteEvent(eventId);

				// refreshSources();

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.DELETED.TITLE',
					'MODALS.DELETED.CONTENT',
					'success'
				);

				ReactModalService.internal.closeModal(eventStore);
			} else {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.OOPS_SOMETHING_WENT_WRONG',
					'error'
				);
				return;
			}
		};

		const handleEditEventResult = (
			eventStore: EventStore,
			addEventToSidebar: (event: SidebarEvent) => boolean,
			originalEvent: EventInput
		) => {
			const eventId = originalEvent.id!;
			if (!eventStore) return;

			const oldEvent = eventStore.allEvents.find((e) => e.id.toString() === eventId.toString());
			if (!oldEvent) {
				console.error('old event not found');
				return false;
			}

			let {
				icon,
				title,
				priority,
				preferredTime,
				description,
				categoryId,
				location,
				openingHours,
				startDate,
				endDate,
				images,
				moreInfo,
			} = ReactModalService.internal.getModalValues(eventStore);

			// @ts-ignore
			const locationText = location?.address;
			const prevLocationText =
				originalEvent.extendedProps && originalEvent.extendedProps.location
					? originalEvent.extendedProps.location.address
					: undefined;

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
			};

			// written like this since otherwise, editing without changing anything will reset location to nothing
			// since window.selectedLocation being reset on each modal open.
			if (locationText != prevLocationText) {
				currentEvent['location'] = location;
			}

			if (location) {
				currentEvent['openingHours'] = openingHours;
			}

			if (originalEvent.extendedProps) {
				Object.keys(originalEvent.extendedProps).forEach((key) => {
					if (!Object.keys(currentEvent).includes(key)) {
						// @ts-ignore
						currentEvent[key] = originalEvent.extendedProps[key];
					}
				});
			}

			// @ts-ignore
			const millisecondsDiff = currentEvent.end - currentEvent.start;
			currentEvent.duration = convertMsToHM(millisecondsDiff);

			if (!title) {
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.ERROR.TITLE',
					'MODALS.ERROR.TITLE_CANNOT_BE_EMPTY',
					'error'
				);
				return false;
			}

			const durationChanged =
				originalEvent.start!.toString() !== currentEvent.start.toString() ||
				(originalEvent.end && originalEvent.end.toString() !== currentEvent.end.toString());
			const iconChanged = oldEvent.icon !== currentEvent.icon;
			const titleChanged = originalEvent.title !== currentEvent.title;
			const priorityChanged =
				originalEvent.extendedProps && originalEvent.extendedProps.priority !== currentEvent.priority;
			const preferredTimeChanged =
				originalEvent.extendedProps && originalEvent.extendedProps.preferredTime !== currentEvent.preferredTime;
			const descriptionChanged =
				originalEvent.extendedProps && originalEvent.extendedProps.description !== currentEvent.description;
			const isLocationChanged =
				originalEvent.extendedProps && originalEvent.extendedProps.location != currentEvent.location;
			const oldCategory = eventStore.allEvents.find((e) => e.id === eventId)!.category;
			const isCategoryChanged = oldCategory != categoryId;
			const isOpeningHoursChanged = currentEvent.openingHours;
			const isImagesChanged = originalEvent.images != currentEvent.images; // add column 12
			const isMoreInfoChanged = originalEvent.moreInfo != currentEvent.moreInfo;
			const isChanged =
				titleChanged ||
				durationChanged ||
				iconChanged ||
				priorityChanged ||
				preferredTimeChanged ||
				descriptionChanged ||
				isLocationChanged ||
				isOpeningHoursChanged ||
				isImagesChanged ||
				isMoreInfoChanged;

			if (isCategoryChanged) {
				// add it to the new category
				// @ts-ignore
				currentEvent = {
					...currentEvent,
					id: eventStore.createEventId(),
					extendedProps: {
						categoryId,
					},
				};

				// @ts-ignore
				currentEvent['categoryId'] = categoryId;

				// @ts-ignore
				currentEvent['className'] = currentEvent.priority ? `priority-${currentEvent.priority}` : undefined;

				eventStore.setCalendarEvents([
					...eventStore.calendarEvents.filter((x) => x.id !== eventId),
					currentEvent,
				]);
				const allEventsEvent = {
					...currentEvent,
					category: categoryId.toString(),
				};
				eventStore.setAllEvents([...eventStore.allEvents.filter((x) => x.id !== eventId), allEventsEvent]);
				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.UPDATED.TITLE',
					'MODALS.UPDATED_EVENT.CONTENT',
					'success'
				);
			} else if (isChanged) {
				const isUpdated = eventStore.changeEvent({
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
						moreInfo: currentEvent.moreInfo,
					},
				});
				if (isUpdated) {
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
			return true;
		};

		const handleDuplicateEventResult = (eventStore: EventStore, originalEvent: EventInput) => {
			let newEvent = Object.assign({}, originalEvent);
			newEvent.extendedProps = { ...originalEvent.extendedProps };
			const newId = eventStore.createEventId();
			newEvent.id = newId;
			newEvent.extendedProps.id = newId;

			// @ts-ignore
			newEvent.start = originalEvent.start;

			// console.log("original", JSON.parse(JSON.stringify(originalEvent)), "new", newEvent);

			// update calendar events
			eventStore.setCalendarEvents([...eventStore.calendarEvents, newEvent]);

			// update all events
			// @ts-ignore
			eventStore.setAllEvents([...eventStore.allEvents, newEvent]);
		};

		const onDeleteClick = () => {
			handleDeleteEventResult(currentEvent as unknown as CalendarEvent, addEventToSidebar);
		};

		const onDuplicateClick = () => {
			const calendarEvent = eventStore.calendarEvents.find((e: any) => e.id.toString() === eventId.toString());
			handleDuplicateEventResult(eventStore, calendarEvent as CalendarEvent);
			ReactModalService.internal.closeModal(eventStore);
		};

		const onConfirm = () => {
			const isOk = handleEditEventResult(eventStore, addEventToSidebar, info.event);
			if (isOk) {
				ReactModalService.internal.closeModal(eventStore);
			}
		};

		const initialData = {
			...info.event._def,
			start: info.event.start,
			end: info.event.end,
			...info.event.extendedProps,
		};

		// @ts-ignore
		window.selectedLocation =
			initialData.location || currentEvent.location || currentEvent?.extendedProps?.location;

		// @ts-ignore
		window.openingHours =
			initialData.openingHours || currentEvent.openingHours || currentEvent.extendedProps?.openingHours;

		// @ts-ignore
		eventStore.modalValues['selectedLocation'] = window.selectedLocation?.address;
		eventStore.modalValues['openingHours'] = currentEvent.openingHours;
		const title = `${TranslateService.translate(eventStore, 'MODALS.EDIT_EVENT')}: ${info.event.title}`;
		const inputs = ReactModalService.internal.getCalendarEventInputs(eventStore, initialData);

		inputs.push({
			settings: {
				modalValueName: 'irrelevant',
				type: 'custom-group',
				extra: {
					content: [
						{
							settings: {
								type: 'button',
								extra: {
									onClick: onDeleteClick,
									flavor: ButtonFlavor.primary,
									className: 'red',
								},
							},
							textKey: 'MODALS.REMOVE_EVENT',
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
			className: 'border-top-gray',
		} as any);

		const content = (
			<Observer>
				{() => (
					<div className={'flex-col gap-20 align-layout-direction react-modal bright-scrollbar'}>
						{inputs.map((input) => ReactModalRenderHelper.renderRow(eventStore, input))}
					</div>
				)}
			</Observer>
		);

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title,
			content,
			onConfirm,
		});
	},
	openDeleteSidebarEventModal: (
		eventStore: EventStore,
		removeEventFromSidebarById: (eventId: string) => void,
		event: SidebarEvent
	) => {
		ReactModalService.internal.openModal(eventStore, {
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
			onConfirm: () => {
				removeEventFromSidebarById(event.id);
				eventStore.setAllEvents(eventStore.allEvents.filter((x) => x.id !== event.id));

				ReactModalService.internal.closeModal(eventStore);
			},
		});
	},
	openConfirmModal: (
		eventStore: EventStore,
		callback: () => void,
		titleKey = 'MODALS.ARE_YOU_SURE',
		contentKey = 'MODALS.ARE_YOU_SURE.CONTENT',
		continueKey = 'MODALS.CONTINUE'
	) => {
		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
			title: `${TranslateService.translate(eventStore, titleKey)}`,
			content: <div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, contentKey) }} />,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(eventStore, continueKey),
			confirmBtnCssClass: 'primary-button',
			onConfirm: () => {
				callback();

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
							<div className={'file-upload-container'}>
								<input
									type={'file'}
									name={'upload[]'}
									id={'fileToUpload'}
									accept={
										'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv'
									}
									className={'display-none'}
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
								<div className={'file-upload-label-container'}>
									<label
										htmlFor={'fileToUpload'}
										className={'btn secondary-button pointer black file-button-label'}
									>
										{TranslateService.translate(eventStore, 'CLICK_HERE_TO_UPLOAD')}
									</label>
									<label className={'file-name-label'}>
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
				// const file = result.value;
				const file = eventStore.modalValues['fileToUpload'];

				// const file = document.getElementById("fileToUpload");
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
			content: <div className={'react-modal bright-scrollbar'} dangerouslySetInnerHTML={{ __html: html }} />,
			cancelBtnText: TranslateService.translate(eventStore, 'MODALS.CANCEL'),
			confirmBtnText: TranslateService.translate(
				eventStore,
				info.errors.length > 0 ? 'MODALS.UPLOAD_ANYWAY' : 'MODALS.UPLOAD'
			),
			confirmBtnCssClass: 'primary-button',
			showConfirmButton: info.categoriesToAdd.length > 0 || info.eventsToAdd.length > 0,
			onConfirm: () => {
				const { categoriesImported, eventsImported } = ImportService.import(eventStore, info);
				if (categoriesImported || eventsImported) {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.IMPORTED.TITLE',
						'MODALS.IMPORTED.CONTENT',
						'success'
					);
				} else {
					ReactModalService.internal.alertMessage(
						eventStore,
						'MODALS.ERROR.TITLE',
						'OOPS_SOMETHING_WENT_WRONG',
						'error'
					);
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

		ReactModalService.internal.openModal(eventStore, {
			...getDefaultSettings(eventStore),
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
		const all = [...eventStore.allEvents];
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
			//     const { title2, description2 } = place?.extendedProps;
			//
			//     title = title || title2;
			//     description = description || description2 || "";
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
			// todo complete: remove extendedProps.id
			// todo complete: remove 'הוזמן לשעה...' from the descirption
			// todo complete: remove 'הערה:' from the description (for example "use Euro and not Shekels")
			//
			// return isOk;
		}

		all.filter(filterOutIrrelevant).forEach((x: any) => {
			delete x['id'];
			x['category'] = categories.find((c) => c.id)?.title;
			if (x['extendedProps'] && x['extendedProps']['categoryId']) {
				delete x['extendedProps']['categoryId'];
			}
			x['tinder'] = {
				images: (x.images || x.extendedProps?.images)?.split('\n'),
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
};

export default ReactModalService;
