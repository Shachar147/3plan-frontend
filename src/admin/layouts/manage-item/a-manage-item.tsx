// @ts-ignore
import React, { useContext, useEffect, useRef, useState } from 'react';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './a-manage-item.scss';

import { observer } from 'mobx-react';
import TranslateService from '../../../services/translate-service';
import { adminStoreContext } from '../../stores/admin-store';
import AdminDashboardWrapper from '../a-dashboard-wrapper/a-dashboard-wrapper';
import { eventStoreContext } from '../../../stores/events-store';
import { useNavigate, useParams } from 'react-router-dom';
import { TinderItem } from '../../helpers/interfaces';
import TextInput from '../../../components/inputs/text-input/text-input';
import TextareaInput from '../../../components/inputs/textarea-input/textarea-input';

import { getTinderServerAddress } from '../../../config/config';

// @ts-ignore
import Slider from 'react-slick';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import { apiDelete, apiPut } from '../../helpers/api';
import ReactModalService from '../../../services/react-modal-service';
import IconSelector from '../../../components/inputs/icon-selector/icon-selector';
import * as _ from 'lodash';
import { LocationData } from '../../../utils/interfaces';
import SelectInput from '../../../components/inputs/select-input/select-input';
import { TriplanPriority } from '../../../utils/enums';
import { ucfirst } from '../../../utils/utils';

interface ManageItemData {
	items: TinderItem[];
	currIdx: number;
	destination: string;
}

const isRequired = ['id', 'source', 'destination', 'name', 'category'];
const isRecommended = ['downloadedImages', 'downloadedVideos', 'images', 'videos', 'location', 'description'];
const itemInputs = [
	{ id: 'readonly' },
	{ source: 'readonly' },
	{ downloadedVideos: 'videos' },
	{ downloadedImages: 'images' },
	{ name: 'text' },
	{ category: 'text' },
	{ destination: 'text' },
	{ description: 'textarea' },
	{ images: 'images' },
	{ videos: 'videos' },
	{ more_info: 'text' },
	{ duration: 'text' }, // time format xx:xx
	{ icon: 'icon' },
	{ priority: 'priority' },
	{ location: 'locationPicker' }, // todo complete
	{ openingHours: 'openingHoursPicker' }, // todo complete
	{ rate: 'text' },
	{ isVerified: 'checkbox' },
];

interface RenderInputProps {
	item: TinderItem;
	type: 'text' | 'number' | 'password';
	isReadOnly: boolean;
	field: string;
	value: string;
	isUnsaved: boolean;
}

interface RenderLocationProps {
	item: TinderItem;
	type: 'text' | 'number' | 'password';
	isReadOnly: boolean;
	field: string;
	value: LocationData;
	isUnsaved: boolean;
}

interface RenderTextAreaInputProps {
	item: TinderItem;
	type: 'textarea';
	isReadOnly: boolean;
	field: string;
	value: string;
	isUnsaved: boolean;
}

interface RenderMediaInputProps {
	item: TinderItem;
	type: string;
	isReadOnly: boolean;
	field: string;
	value: string[];
	isUnsaved: boolean;
}

interface RenderCheckboxInputProps {
	item: TinderItem;
	type: string;
	isReadOnly: boolean;
	field: string;
	value: boolean; // is checked
	isUnsaved: boolean;
}

function AManageItem() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	let { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<ManageItemData | undefined>(undefined);
	const [item, setItem] = useState<TinderItem | undefined>(undefined);
	const [originalItem, setOriginalItem] = useState<TinderItem | undefined>(undefined);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const backIcon = eventStore.getCurrentDirection() === 'ltr' ? 'fa-chevron-right' : 'fa-chevron-left';
	const nextIcon = eventStore.getCurrentDirection() === 'ltr' ? 'fa-chevron-left' : 'fa-chevron-right';

	useEffect(() => {
		Array.from(adminStore.placesByDestination.keys()).forEach((destination) => {
			const items = adminStore.placesByDestination.get(destination);
			if (items) {
				const idx = items.findIndex((i) => i.id == Number(id));
				if (idx !== -1) {
					setData({
						destination,
						items,
						currIdx: idx,
					});
					setItem(items[idx]);
					setOriginalItem(items[idx]);
					return;
				}
			}
		});
		setIsLoaded(true);
	}, [adminStore.placesByDestination]);

	function slideBack() {
		if (!data) return;
		const currIdx = Math.max(data.currIdx - 1, 0);
		setData({
			...data,
			currIdx,
		});
		setItem(data.items[currIdx]);
		setOriginalItem(data.items[currIdx]);
	}

	function slideNext() {
		if (!data) return;
		const currIdx = Math.min(data.currIdx + 1, data.items.length - 1);
		setData({
			...data,
			currIdx,
		});
		setItem(data.items[currIdx]);
		setOriginalItem(data.items[currIdx]);
	}

	function buildMediaUrl(media: string) {
		if (media.indexOf('http') !== -1) {
			return media;
		}
		if (!media.startsWith('/')) {
			media = '/' + media;
		}
		return `${getTinderServerAddress()}${media}`;
	}

	function isChanged(field: string, a: any, b: any) {
		if (field === 'images' || field === 'videos' || field === 'downloadedImages' || field === 'downloadedVideos') {
			return JSON.stringify(a) !== JSON.stringify(b);
		}
		return a != b;
	}

	// --- actions ----------------------------------------------
	async function updateItem() {
		setIsSaving(true);
		if (item && item.location) {
			try {
				// @ts-ignore
				const location = JSON.parse(item.location);
				item.location = location;
			} catch {}
		}
		const result = await apiPut(`/item/${item!.id}`, {
			...item,
			downloadedImages: item!.downloadedImages
				?.map((x) => x.replace(getTinderServerAddress(), ''))
				.filter((x) => x !== ''),
			downloadedVideos: item!.downloadedVideos
				?.map((x) => x.replace(getTinderServerAddress(), ''))
				.filter((x) => x !== ''),
		});
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.UPDATED.TITLE',
			'MODALS.UPDATED_EVENT.CONTENT',
			'success'
		);
		if (result) {
			setItem(result.data.item);
			setOriginalItem(result.data.item);
			adminStore.updateItem(item!.id, result.data.item);
			setIsSaving(false);
		}
	}

	async function deleteItem() {
		setIsSaving(true);
		const result = await apiDelete(`/item/${item!.id}`);
		ReactModalService.internal.alertMessage(
			eventStore,
			'MODALS.DELETED.TITLE',
			'MODALS.DELETED.CONTENT',
			'success'
		);
		if (result) {
			adminStore.deleteItem(item!.id);

			setData({
				...data!,
				currIdx: data!.currIdx - 1,
				items: data!.items.filter((i) => i.id !== item!.id),
			});

			setIsSaving(false);

			setTimeout(() => {
				slideNext();
			}, 2000);
		}
	}

	// --- render functions -------------------------------------

	function renderItemNotFoundPlaceholder() {
		return (
			<div className="item-not-found-placeholder">
				<img src="/images/oops-placeholder.png" />
				{TranslateService.translate(eventStore, 'ITEM_NOT_FOUND')}
			</div>
		);
	}

	function renderNavigation() {
		let destination = data?.destination;
		if (destination === 'N/A') {
			destination = 'NA';
		}
		return (
			<div className="manage-item-navigation">
				<a href="" onClick={() => navigate('/admin')}>
					{TranslateService.translate(eventStore, 'ADMIN_PANEL')}
				</a>
				{data ? (
					<>
						<span className="navigation-spacer">{' > '}</span>
						<a href="" onClick={() => navigate(`/admin/destination/${destination}`)}>
							{TranslateService.translate(eventStore, data!.destination)}
						</a>
					</>
				) : (
					<>
						<span className="navigation-spacer">{' > '}</span>
						{TranslateService.translate(eventStore, 'NOT_FOUND_ITEM')}
					</>
				)}
				{item ? (
					<>
						<span className="navigation-spacer">{' > '}</span>
						{item?.name}
					</>
				) : undefined}
			</div>
		);
	}

	function renderButtons() {
		return (
			<div className="flex-row gap-10">
				<Button
					flavor={ButtonFlavor.primary}
					text={`${TranslateService.translate(eventStore, 'MODALS.SAVE')}`}
					onClick={() => {
						updateItem();
					}}
					className="manage-item-form-save-button"
					disabled={isSaving}
					disabledReason={
						isSaving ? TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING') : undefined
					}
				/>
				<Button
					flavor={ButtonFlavor.primary}
					text={`${TranslateService.translate(eventStore, 'DELETE_THIS_ACTIVITY')}`}
					onClick={() => {
						ReactModalService.openConfirmModal(eventStore, () => {
							deleteItem();
						});
					}}
					className="manage-item-form-delete-button red"
					disabled={isSaving}
					disabledReason={
						isSaving ? TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING') : undefined
					}
				/>
				<div title={TranslateService.translate(eventStore, 'MOVE_TO_END_OF_LIST.TOOLTIP')}>
					<Button
						flavor={ButtonFlavor.secondary}
						text={`${TranslateService.translate(eventStore, 'MOVE_TO_END_OF_LIST')}`}
						onClick={() => {
							const moveLater = JSON.parse(localStorage.getItem('triplan-move_later') ?? '{}');
							moveLater[item!.destination] = moveLater[item!.destination] || [];
							moveLater[item!.destination].push(item!.id);
							moveLater[item!.destination] = _.uniq(moveLater[item!.destination]);
							localStorage.setItem('triplan-move_later', JSON.stringify(moveLater));

							ReactModalService.internal.alertMessage(
								eventStore,
								'SUCCESS',
								'MOVED_LATER_SUCCESSFULLY',
								'success'
							);

							// setTimeout(() => {
							// 	ReactModalService.internal.closeModal(eventStore);
							// 	setTimeout(() => {
							// 		slideNext();
							// 	}, 1200);
							// }, 3000);
						}}
						className="manage-item-form-later-button"
						disabled={isSaving}
						disabledReason={
							isSaving ? TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING') : undefined
						}
					/>
				</div>
			</div>
		);
	}

	function renderAsterik(field: string) {
		if (isRequired.indexOf(field) !== -1) {
			return <div className="red-color padding-top-2">*</div>;
		} else if (isRecommended.indexOf(field) !== -1) {
			return <div className="gold-color padding-top-2">*</div>;
		}
	}

	function renderItemForm() {
		return (
			<div className="manage-item-form" key={item?.id}>
				{itemInputs.map((input) => {
					const field = Object.keys(input)[0];
					const label = TranslateService.translate(eventStore, `ADMIN_MANAGE_ITEM.${field.toUpperCase()}`);

					// @ts-ignore
					const type = Object.values(input)[0];
					return (
						<div className="manage-item-form-row">
							<label className="manage-item-form-row-field">
								{label}
								{renderAsterik(field)}
							</label>
							{renderInput(item!, type, type === 'readonly' || isSaving, field)}
						</div>
					);
				})}
			</div>
		);
	}

	function renderItemFormAndArrows() {
		const isBackDisabledClass = data?.currIdx === 0 ? 'disabled' : '';
		const isNextDisabledClass = !data?.items ? '' : data?.currIdx === data?.items?.length - 1 ? 'disabled' : '';
		return (
			<div className="manage-item bright-scrollbar">
				<i
					className={`slider-navigator no-animation fa ${backIcon} ${isBackDisabledClass}`}
					onClick={() => slideBack()}
				/>
				{renderItemForm()}
				<i
					className={`slider-navigator no-animation fa ${nextIcon} ${isNextDisabledClass}`}
					onClick={() => slideNext()}
				/>
			</div>
		);
	}

	// --- input types ------------

	function renderInput(item: TinderItem, type: string, isReadOnly: boolean, field: string) {
		// @ts-ignore
		let value = item[field] ?? '';

		// @ts-ignore
		const isUnsaved = isChanged(field, item[field], originalItem[field]);

		if (['number', 'text', 'password'].indexOf(type) !== -1) {
			// @ts-ignore
			return renderTextInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'textarea') {
			return renderTextAreaInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'images' || type === 'videos') {
			return renderMediaInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'checkbox') {
			return renderCheckboxInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'icon') {
			return renderIconInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'locationPicker') {
			return renderLocationInput({ item, type, isReadOnly, field, value, isUnsaved });
		} else if (type === 'priority') {
			return renderPriorityInput({ item, type, isReadOnly, field, value, isUnsaved });
		}
		// todo complete
		return renderTextInput({ item, type: 'text', isReadOnly: true, field, value, isUnsaved });
	}

	function renderTextInput(props: RenderInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;
		return (
			<>
				<TextInput
					type={type}
					name={field}
					value={value}
					onChange={(e) => {
						setItem({
							...item,
							[field]: e.target.value,
						});
					}}
					placeholder={''}
					modalValueName={field}
					readOnly={isReadOnly}
					className={isUnsaved ? 'unsaved' : undefined}
					// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
				/>
				{field === 'more_info' ? (
					<a href={value} target={'_blank'}>
						<i className="fa fa-external-link" style={{ height: '20px' }} aria-hidden="true" />
					</a>
				) : undefined}
			</>
		);
	}

	function renderTextAreaInput(props: RenderTextAreaInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;
		return (
			<TextareaInput
				name={field}
				value={value}
				onChange={(e) => {
					setItem({
						...item,
						[field]: e.target.value,
					});
				}}
				placeholder={''}
				modalValueName={field}
				readOnly={isReadOnly}
				className={isUnsaved ? 'unsaved' : undefined}
				// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
			/>
		);
	}

	function renderMediaInput(props: RenderMediaInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;

		const sliderSettings = {
			dots: true,
			infinite: true,
			speed: 500,
			slidesToShow: 1,
			slidesToScroll: 1,
			width: 300,
		};

		let imagesBlock = null;
		let input = null;

		const readOnly = field.indexOf('downloaded') !== -1;

		if (type === 'images') {
			let images = value ?? item['images'];
			images = images.map((image: string) => buildMediaUrl(image));

			imagesBlock = (
				<Slider {...sliderSettings}>
					{images.map((image: string) => (
						<img
							className="slider-image"
							style={{
								width: 300,
								height: 150,
							}}
							onClick={() => {
								window.open(image, '_blank');
							}}
							alt={''}
							src={image}
						/>
					))}
				</Slider>
			);

			input = (
				<TextareaInput
					name={field}
					value={images.join('\n')}
					onChange={(e) => {
						setItem({
							...item,
							[field]: e.target.value.split('\n'),
						});
					}}
					placeholder={''}
					modalValueName={field}
					className={isUnsaved ? 'unsaved' : undefined}
					readOnly={isReadOnly || readOnly}
					rows={isReadOnly || readOnly ? 1 : 3}
					// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
				/>
			);
		}

		if (type === 'videos') {
			let videos = value ?? item['videos'];
			videos = videos.map((image: string) => buildMediaUrl(image));
			imagesBlock = (
				<Slider {...sliderSettings}>
					{videos.map((video: string) => (
						<video width="320" height="240" controls>
							<source src={video} type="video/mp4" />
						</video>
					))}
				</Slider>
			);

			input = (
				<TextareaInput
					name={field}
					value={videos.join('\n')}
					onChange={(e) => {
						setItem({
							...item,
							[field]: e.target.value.split('\n'),
						});
					}}
					placeholder={''}
					modalValueName={field}
					className={isUnsaved ? 'unsaved' : undefined}
					readOnly={isReadOnly || readOnly}
					rows={isReadOnly || readOnly ? 1 : 3}
					// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
				/>
			);
		}

		return (
			<div className={'image-container'}>
				{imagesBlock}
				{input}
			</div>
		);
	}

	function renderCheckboxInput(props: RenderCheckboxInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;
		return (
			<input
				type={'checkbox'}
				name={field}
				checked={value}
				onChange={(e) => {
					setItem({
						...item,
						[field]: e.target.checked,
					});
				}}
				disabled={isReadOnly}
				className={isUnsaved ? 'unsaved' : undefined}
			/>
		);
	}

	function renderIconInput(props: RenderInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;
		return (
			<IconSelector
				id={item.id.toString()}
				modalValueName={field}
				value={value}
				onChange={(data) => {
					setItem({
						...item,
						[field]: data.label,
					});
				}}
				disabled={isReadOnly}
				className={isUnsaved ? 'unsaved' : undefined}
				// ref={row.settings.ref}
			/>
		);
	}

	function renderLocationInput(props: RenderLocationProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;
		return (
			<>
				<TextInput
					type={type}
					name={field}
					value={JSON.stringify(value)}
					onChange={(e) => {
						setItem({
							...item,
							[field]: e.target.value,
						});
					}}
					placeholder={''}
					modalValueName={field}
					readOnly={isReadOnly}
					className={isUnsaved ? 'unsaved' : undefined}
					// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
				/>
				{value && value.latitude && value.longitude ? (
					<a href={`https://maps.google.com/?q=${value.latitude},${value.longitude}`} target={'_blank'}>
						<i className="fa fa-external-link" style={{ height: '20px' }} aria-hidden="true" />
					</a>
				) : undefined}
			</>
		);
	}

	function renderPriorityInput(props: RenderInputProps) {
		const { item, type, isReadOnly, field, value, isUnsaved } = props;

		const values = Object.keys(TriplanPriority);
		const keys = Object.values(TriplanPriority);

		const options = Object.values(TriplanPriority)
			.filter((x) => !Number.isNaN(Number(x)))
			.map((val, index) => ({
				value: values[index],
				label: ucfirst(TranslateService.translate(eventStore, keys[index].toString())),
			}));

		return (
			<SelectInput
				// ref={ref}
				readOnly={isReadOnly}
				id={field}
				name={field}
				options={options}
				value={item[field] ? options.find((i) => i.value === item[field]) : undefined}
				placeholderKey={'TYPE_TO_SEARCH_PLACEHOLDER'}
				modalValueName={field}
				// maxMenuHeight={extra.maxMenuHeight}
				// removeDefaultClass={extra.removeDefaultClass}
				onChange={(data) => {
					setItem({
						...item,
						[field]: data.value,
					});
				}}
			/>
		);
	}

	function renderContent() {
		if (!id) return;
		if (!isLoaded) return 'loading...';
		// if (!item) return renderItemNotFoundPlaceholder();

		return (
			<div className="manage-item-page">
				{renderNavigation()}
				{!item ? (
					renderItemNotFoundPlaceholder()
				) : (
					<>
						{renderItemFormAndArrows()}
						{renderButtons()}
					</>
				)}
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AManageItem);
