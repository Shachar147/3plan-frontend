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

interface ManageItemData {
	items: TinderItem[];
	currIdx: number;
	destination: string;
}

function AManageItem() {
	const adminStore = useContext(adminStoreContext);
	const eventStore = useContext(eventStoreContext);
	let { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<ManageItemData | undefined>(undefined);
	const [item, setItem] = useState<TinderItem | undefined>(undefined);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

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
					return;
				}
			}
		});
		setIsLoaded(true);
	}, [adminStore.placesByDestination]);

	function renderContent() {
		if (!id) return;
		if (!isLoaded) return 'loading...';

		if (!item) {
			return (
				<div className="no-destinations-placeholder">
					{TranslateService.translate(eventStore, 'ITEM_NOT_FOUND')}
				</div>
			);
		}

		const backIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-right' : 'fa-chevron-left';
		const nextIcon = eventStore.getCurrentDirection() === 'rtl' ? 'fa-chevron-left' : 'fa-chevron-right';

		function slideBack() {
			if (!data) return;
			const currIdx = Math.max(data.currIdx - 1, 0);
			setData({
				...data,
				currIdx,
			});
			setItem(data.items[currIdx]);
		}

		function slideNext() {
			if (!data) return;
			const currIdx = Math.min(data.currIdx + 1, data.items.length - 1);
			setData({
				...data,
				currIdx,
			});
			setItem(data.items[currIdx]);
		}

		const inputs = [
			{ id: 'readonly' },
			{ name: 'text' },
			{ destination: 'text' },
			{ description: 'textarea' },
			{ images: 'textarea' }, // images
			{ source: 'text' },
			{ more_info: 'text' },
			{ category: 'text' },
			{ duration: 'text' }, // time format xx:xx
			{ icon: 'text' }, // icon selector
			{ priority: 'select' },
			{ location: 'locationPicker' }, // todo complete
			{ openingHours: 'openingHoursPicker' }, // todo complete
			{ rate: 'text' },
			{ videos: 'textarea' }, // videos
			{ isVerified: 'checkbox' },
		];

		return (
			<div className="manage-item bright-scrollbar">
				<i className={`slider-navigator no-animation fa ${backIcon}`} onClick={() => slideBack()} />
				<div className="manage-item-form" key={item.id}>
					{inputs.map((input) => {
						const field = Object.keys(input)[0];
						const label = TranslateService.translate(
							eventStore,
							`ADMIN_MANAGE_ITEM.${field.toUpperCase()}`
						);

						// @ts-ignore
						const value = item[field] ?? '';

						function renderTextInput(item: TinderItem, type: string) {
							if (['number', 'text', 'textarea', 'checkbox'].indexOf(type) === -1) {
								type = 'text';
							}
							return (
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
									// placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
								/>
							);
						}

						// @ts-ignore
						const type = Object.values(input)[0];
						return (
							<div className="manage-item-form-row">
								<label className="manage-item-form-row-field">{label}</label>
								{renderTextInput(item, type)}
							</div>
						);
					})}
				</div>
				<i className={`slider-navigator no-animation fa ${nextIcon}`} onClick={() => slideNext()} />
			</div>
		);
	}

	return <AdminDashboardWrapper>{renderContent()}</AdminDashboardWrapper>;
}

export default observer(AManageItem);
