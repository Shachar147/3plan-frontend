import { AllEventsEvent } from '../../services/data-handlers/data-handler-base';
import { EventStore } from '../../stores/events-store';
import { flightColor, hotelColor } from '../../utils/consts';
import { MapViewMode, TriplanPriority } from '../../utils/enums';
import { isBasketball, isDessert, isFlight, isHotel, isMatching } from '../../utils/utils';

export const NIGHTLIFE_KEYWORDS = [
	'club',
	'cocktail',
	'beer',
	'bar',
	'מועדונים',
	'ברים',
	'מסיבות',
	'חיי לילה',
	'casino',
	'קזינו',
];
export const ATTRACTIONS_KEYWORDS = ['attraction', 'attractions', 'אטרקציות', 'פעילויות'];
export const DESSERTS_KEYWORDS = [
	'desserts',
	'קינוחים',
	'גלידה',
	'macaroons',
	'מקרונים',
	'cookie',
	'עוגייה',
	'ice cream',
];
export const FOOD_KEYWORDS = ['food', 'restaurant', 'אוכל', 'מסעדת', 'מסעדות', 'cafe', 'קפה', 'steak', 'bakery'];
export const STORE_KEYWORDS = ['shopping', 'stores', 'חנויות', 'קניות', 'malls', 'קניונים'];
export const FLIGHT_KEYWORDS = ['flight', 'טיסה', 'airport', 'שדה תעופה', 'שדה התעופה', 'טיסות'];
export const HOTEL_KEYWORDS = ['hotel', 'מלון'];
export const TOURIST_KEYWORDS = ['tourism', 'תיירות', 'אתרים'];
export const NATURE_KEYWORDS = [
	'nature',
	'טבע',
	'lake',
	'lakes',
	'waterfall',
	'sea',
	'אגם',
	'אגמים',
	'נהר',
	'נהרות',
	'מפל',
	'flower',
	'garden',
	'גן ה',
	'גני ה',
	'פרח',
];

const resolveCategoryMapIcon = (eventStore: EventStore, event: any) => {
	const raw = event?.category ?? event?.categoryId;
	let icon: string | undefined;
	if (raw !== undefined && raw !== null) {
		const asNumber = Number(raw);
		if (!Number.isNaN(asNumber)) {
			const found = eventStore.categories.find((x) => x.id === asNumber);
			if (found) {
				icon = found.googleMapIcon;
			}
		}
	}

	return icon ?? '';
};

export const resolveCategoryTitle = (eventStore: EventStore, event: any, allEvents?: AllEventsEvent[]) => {
	// Prefer explicit category/categoryId, handle number or numeric string ids
	const raw = event?.category ?? event?.categoryId;
	let title: string | undefined;
	if (raw !== undefined && raw !== null) {
		const asNumber = Number(raw);
		if (!Number.isNaN(asNumber)) {
			const found = eventStore.categories.find((x) => x.id === asNumber);
			if (found) {
				title = found.title;
			}
		}
		// If not a known id or non-numeric, treat it as already a title
		if (!title) {
			title = String(raw);
		}
	}

	// Fallback for all-events context if nothing resolved
	if (!title && allEvents) {
		title = String(event?.category ?? '');
	}

	return title ?? '';
};

export const getIcon = (eventStore: EventStore, event: any, allEvents?: AllEventsEvent[], categoryIcon?: string) => {
	let icon = '';
	let bgColor = eventStore.priorityMapColors[event.priority || TriplanPriority.unset].replace('#', '');

	categoryIcon = categoryIcon ?? resolveCategoryMapIcon(eventStore, event);

	let category = resolveCategoryTitle(eventStore, event, allEvents);

	category = category ? category.toString().toLowerCase() : '';
	const title = event.title.toLowerCase();

	const iconsMap = {
		basketball: 'icons/onion/1520-basketball_4x.png',
		food: 'icons/onion/1577-food-fork-knife_4x.png',
		photos: 'icons/onion/1535-camera-photo_4x.png',
		attractions: 'icons/onion/1502-shape_star_4x.png',
		beach: 'icons/onion/1521-beach_4x.png',
		nightlife: 'icons/onion/1517-bar-cocktail_4x.png',
		hotel: 'icons/onion/1602-hotel-bed_4x.png',
		shopping: 'icons/onion/1684-shopping-bag_4x.png',
		tourism: 'icons/onion/1548-civic_4x.png', // 'icons/onion/1715-tower_4x.png',
		flowers: 'icons/onion/1582-garden-flower_4x.png',
		desserts: 'icons/onion/1607-ice-cream_4x.png',
		cities: 'icons/onion/1546-city-buildings_4x.png',
		mountains: 'icons/onion/1634-mountain_4x.png',
		lakes: 'icons/onion/1697-spa_4x.png',
		trains: 'icons/onion/1716-train_4x.png',
		musicals: 'icons/onion/1637-music-note_4x.png',
		flights: 'icons/onion/1504-airport-plane_4x.png',
		coffee_shops: 'icons/onion/1868-smoking_4x.png',
		gimmicks: 'icons/onion/1796-ghost_4x.png',
		golf: 'icons/onion/1585-golf_4x.png',
	};

	if (categoryIcon) {
		icon = categoryIcon;
	} else if (isMatching(category, ['golf', 'גולף'])) {
		icon = iconsMap['golf'];
	} else if (isBasketball(category, title)) {
		icon = iconsMap['basketball'];
	} else if (isDessert(category, title)) {
		icon = iconsMap['desserts'];
	} else if (isFlight(category, title)) {
		icon = iconsMap['flights'];
		bgColor = flightColor;
	} else if (isHotel(category, title)) {
		icon = iconsMap['hotel'];
		bgColor = hotelColor;
	} else if (isMatching(category, FOOD_KEYWORDS)) {
		icon = iconsMap['food'];
	} else if (isMatching(category, ['photo', 'תמונות'])) {
		icon = iconsMap['photos'];
	} else if (isMatching(category, NATURE_KEYWORDS) || isMatching(title, NATURE_KEYWORDS)) {
		icon = iconsMap['flowers'];
	} else if (isMatching(category, ATTRACTIONS_KEYWORDS)) {
		icon = iconsMap['attractions'];
	} else if (
		isMatching(category, ['coffee shops', 'coffee shop', 'קופישופס']) ||
		isMatching(title, ['coffee shops', 'coffee shop', 'קופישופס'])
	) {
		icon = iconsMap['coffee_shops'];
	} else if (isMatching(category, ['gimmick', 'gimick', 'גימיקים'])) {
		icon = iconsMap['gimmicks'];
	} else if (isMatching(category, ['beach', 'beaches', 'beach club', 'beach bar', 'חופים', 'ביץ׳ באר', 'ביץ׳ בר'])) {
		icon = iconsMap['beach'];
	} else if (isMatching(category, NIGHTLIFE_KEYWORDS)) {
		icon = iconsMap['nightlife'];
	} else if (isMatching(category, STORE_KEYWORDS)) {
		icon = iconsMap['shopping'];
	} else if (isMatching(category, TOURIST_KEYWORDS)) {
		icon = iconsMap['tourism'];
	} else if (
		isMatching(title, ['city', 'עיירה']) ||
		isMatching(category, ['cities', 'עיירות', 'כפרים', 'village', 'ערים'])
	) {
		icon = iconsMap['cities'];
	} else if (
		isMatching(title, ['mountain', 'cliff', ' הר ', 'פסגת']) ||
		isMatching(category, ['mountains', 'הרים'])
	) {
		icon = iconsMap['mountains'];
	} else if (
		isMatching(title, ['lake ', 'lakes', ' נהר ', 'אגם']) ||
		isMatching(category, ['lakes', 'נהרות', 'אגמים'])
	) {
		icon = iconsMap['lakes'];
	} else if (
		isMatching(title, ['rollercoaster', 'roller coaster', 'רכבת']) ||
		isMatching(category, ['trains', 'roller coasters', 'רכבות'])
	) {
		icon = iconsMap['trains'];
	} else if (
		isMatching(title, ['show', 'musical', 'הופעה', 'הצגה', 'תאטרון', 'מחזמר', 'תיאטרון']) ||
		isMatching(title, ['shows', 'musicals', 'הופעות', 'הצגות', 'תאטרון', 'מחזות זמר', 'music shows'])
	) {
		icon = iconsMap['musicals'];
	} else if (isMatching(title, FOOD_KEYWORDS)) {
		icon = iconsMap['food'];
	}

	// use cluster color when map view mode is set to areas
	const clusterColor = eventStore.getClusterColorForEvent(String(event.id));
	if (eventStore.mapViewMode === MapViewMode.AREAS && clusterColor) {
		bgColor = clusterColor.replace('#', '');
	}

	return {
		icon,
		bgColor,
	};
};

export const getIconUrl = (eventStore: EventStore, event: any, allEvents?: AllEventsEvent[], categoryIcon?: string) => {
	const { icon, bgColor } = getIcon(eventStore, event, allEvents, categoryIcon);
	if (icon === '') {
		// return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
		return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
	}
	return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
};
