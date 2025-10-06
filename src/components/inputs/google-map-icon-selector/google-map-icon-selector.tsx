import React, { useContext, useEffect, useState } from 'react';
import './google-map-icon-selector.scss';
import TextInput from '../text-input/text-input';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { getClasses } from '../../../utils/utils';

interface GoogleMapIconSelectorProps {
	value?: string;
	onChange: (value: string) => void;
	modalValueName: string;
}

// Central icons map; should match MapContainer usage
export const GOOGLE_MAP_ICONS_MAP: Record<string, { keywords: string[]; icon: string }> = {
	basketball: {
		keywords: ['basketball', 'כדורסל', 'nba'],
		icon: 'icons/onion/1520-basketball_4x.png',
	},
	food: {
		keywords: ['food', 'אוכל', 'restaurant', 'מסעד'],
		icon: 'icons/onion/1577-food-fork-knife_4x.png',
	},
	photos: {
		keywords: ['photos', 'image', 'film', 'view', 'instagram', 'תמונות', 'מצלמה', 'camera'],
		icon: 'icons/onion/1535-camera-photo_4x.png',
	},
	attractions: {
		keywords: ['attractions', 'אטרקציות', 'אטרקצ'],
		icon: 'icons/onion/1502-shape_star_4x.png',
	},
	beach: {
		keywords: ['beach', 'חוף', 'ים'],
		icon: 'icons/onion/1521-beach_4x.png',
	},
	nightlife: {
		keywords: ['nightlife', 'חיי לילה', 'מועדו', 'bar', 'club', 'בר'],
		icon: 'icons/onion/1517-bar-cocktail_4x.png',
	},
	hotel: {
		keywords: ['hotel', 'בתי מלון', 'בית מלון', 'הוסטל'],
		icon: 'icons/onion/1602-hotel-bed_4x.png',
	},
	shopping: {
		keywords: ['shopping', 'קניות'],
		icon: 'icons/onion/1684-shopping-bag_4x.png',
	},
	tourism: {
		keywords: ['tourism', 'תיירות'],
		icon: 'icons/onion/1548-civic_4x.png',
	},
	flowers: {
		keywords: ['flowers', 'פרחים', 'טבע'],
		icon: 'icons/onion/1582-garden-flower_4x.png',
	},
	desserts: {
		keywords: ['desserts', 'קינוח', 'גלידה', 'ממתק', 'שוקולד'],
		icon: 'icons/onion/1607-ice-cream_4x.png',
	},
	cities: {
		keywords: ['cities', 'city', 'עיר'],
		icon: 'icons/onion/1546-city-buildings_4x.png',
	},
	mountains: {
		keywords: ['mountains', 'הר'],
		icon: 'icons/onion/1634-mountain_4x.png',
	},
	lakes: {
		keywords: ['lakes', 'אגמ', 'אגמים'],
		icon: 'icons/onion/1697-spa_4x.png',
	},
	trains: {
		keywords: ['trains', 'רכבות', 'רכבת', 'train', 'drive', 'נסיעה', 'נסיעות'],
		icon: 'icons/onion/1716-train_4x.png',
	},
	musicals: {
		keywords: ['musicals', 'מחזמר', 'music', 'מוסיקה', 'מוזיקה'],
		icon: 'icons/onion/1637-music-note_4x.png',
	},
	flights: {
		keywords: ['flight', 'טיסה', 'טיסות'],
		icon: 'icons/onion/1504-airport-plane_4x.png',
	},
	coffee_shops: {
		keywords: ['coffee_shops', 'coffeeshop', 'coffee shop', 'קופישופ', 'קופי שופ'],
		icon: 'icons/onion/1868-smoking_4x.png',
	},
	gimmicks: {
		keywords: ['gimmick', 'גימיק'],
		icon: 'icons/onion/1796-ghost_4x.png',
	},
	golf: {
		keywords: ['golf', 'גולף'],
		icon: 'icons/onion/1585-golf_4x.png',
	},
};

export function iconToName(icon: string): string | undefined {
	let found;
	Object.keys(GOOGLE_MAP_ICONS_MAP).forEach((key) => {
		if (GOOGLE_MAP_ICONS_MAP[key].icon == icon) {
			found = key;
			return key;
		}
	});
	return found;
}

export default function GoogleMapIconSelector({ value, onChange }: GoogleMapIconSelectorProps) {
	const eventStore = useContext(eventStoreContext);
	const [localSelected, setLocalSelected] = useState(value);
	const [searchValue, setSearchValue] = useState('');

	function getUrl(icon: string, isSelected: boolean) {
		const bgColor = isSelected ? '#b4b4b4' : 'b4b4b4';
		return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
	}

	const availableIcons = Object.keys(GOOGLE_MAP_ICONS_MAP).filter(
		(key) =>
			!!GOOGLE_MAP_ICONS_MAP[key].keywords.find(
				(keyword) =>
					keyword.includes(searchValue.toLocaleLowerCase()) ||
					searchValue.toLocaleLowerCase().includes(keyword)
			)?.length
	);

	return (
		<div className="flex-col gap-8">
			<TextInput
				modalValueName="googleMapIconPickerSearch"
				value={searchValue}
				onChange={(e) => {
					setSearchValue(e.target.value);
				}}
				placeholder={TranslateService.translate(eventStore, 'SELECT_ICON_PLACEHOLDER')}
			/>
			<div className="google-map-icon-selector bright-scrollbar flex-row gap-8 wrap">
				{availableIcons.map((key) => {
					const iconUrl = GOOGLE_MAP_ICONS_MAP[key].icon;
					const isSelected = iconUrl == localSelected;
					const imageUrl = getUrl(GOOGLE_MAP_ICONS_MAP[key].icon, isSelected);

					return (
						<button
							key={key}
							className={getClasses('gm-icon-btn', isSelected && 'active')}
							title={key}
							onClick={() => {
								setLocalSelected(GOOGLE_MAP_ICONS_MAP[key].icon);
								onChange(key);
							}}
							type="button"
						>
							<img src={imageUrl} alt={key} width={28} height={28} />
						</button>
					);
				})}
			</div>
		</div>
	);
}
