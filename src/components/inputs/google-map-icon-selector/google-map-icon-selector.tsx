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
		keywords: ['basketball', 'כדורסל', 'nba', 'sport', 'ספורט'],
		icon: 'icons/onion/1520-basketball_4x.png',
	},
	baseball: {
		keywords: ['baseball', 'בייסבול', 'בייס בול', 'sport', 'ספורט'],
		icon: 'icons/onion/1519-baseball_4x.png',
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
		keywords: ['attractions', 'אטרקציות', 'אטרקצ', 'star', 'כוכב'],
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
	heart: {
		keywords: ['heart'],
		icon: 'icons/onion/1592-heart_4x.png',
	},
	quotation: {
		keywords: ['quotation'],
		icon: 'icons/onion/1846-quotation_4x.png',
	},
	checkmark: {
		keywords: ['checkmark'],
		icon: 'icons/onion/1769-checkmark_4x.png',
	},
	football: {
		keywords: ['football', 'sport', 'ספורט', 'פוטבול'],
		icon: 'icons/onion/1579-football_4x.png',
	},
	soccer: {
		keywords: ['soccer', 'sport', 'ספורט', 'כדורגל'],
		icon: 'icons/onion/1696-soccer_4x.png',
	},
	rugby: {
		keywords: ['rugby', 'רוגבי', 'sport', 'ספורט'],
		icon: 'icons/onion/1858-rugby_4x.png',
	},
	volleyball: {
		keywords: ['volleyball', 'כדורעף', 'כדור עף', 'כדור-עף', 'sport', 'ספורט'],
		icon: 'icons/onion/1890-volleyball_4x.png',
	},
	'golf course': {
		keywords: ['golf course', 'גולף', 'sport', 'ספורט'],
		icon: 'icons/onion/1799-golf-course_4x.png',
	},
	tennis: {
		keywords: ['tennis', 'טניס', 'sport', 'ספורט'],
		icon: 'icons/onion/1707-tennis_4x.png',
	},
	polo: {
		keywords: ['polo', 'sport', 'ספורט'],
		icon: 'icons/onion/1843-polo_4x.png',
	},
	badminton: {
		keywords: ['badminton', 'sport', 'ספורט'],
		icon: 'icons/onion/1755-badminton_4x.png',
	},
	racquetball: {
		keywords: ['racquetball', 'sport', 'ספורט'],
		icon: 'icons/onion/1849-racquetball_4x.png',
	},
	squash: {
		keywords: ['squash', 'sport', 'ספורט'],
		icon: 'icons/onion/1875-squash_4x.png',
	},
	boxing: {
		keywords: ['boxing', 'איגרוף', 'sport', 'ספורט'],
		icon: 'icons/onion/1761-boxing_4x.png',
	},
	'martial arts': {
		keywords: ['martial arts'],
		icon: 'icons/onion/1825-martial arts_4x.png',
	},
	fencing: {
		keywords: ['fencing'],
		icon: 'icons/onion/1788-fencing_4x.png',
	},
	weightlifting: {
		keywords: [
			'weightlifting',
			'gym',
			'workout',
			'dumbel',
			'dumbbell',
			'מכון',
			'משקולות',
			'חדר כושר',
			'חד"כ',
			'אימונים',
			'חזק',
			'שרירי',
			'sport',
			'ספורט',
		],
		icon: 'icons/onion/1893-weight-barbell_4x.png',
	},
	racing: {
		keywords: ['racing', 'sport', 'ספורט'],
		icon: 'icons/onion/1661-racetrack-flag_4x.png',
	},
	stadium: {
		keywords: ['stadium', 'sport', 'ספורט'],
		icon: 'icons/onion/1698-stadium_4x.png',
	},
	'horseback riding': {
		keywords: ['horseback riding', 'רכיבה', 'רכיבת', 'sport', 'ספורט'],
		icon: 'icons/onion/1601-horseback riding_4x.png',
	},
	bowling: {
		keywords: ['bowling', 'באולינג', 'sport', 'ספורט'],
		icon: 'icons/onion/1527-bowling_4x.png',
	},
	billiards: {
		keywords: ['billiards', 'sport', 'ספורט'],
		icon: 'icons/onion/1747-billiards_4x.png',
	},
	cricket: {
		keywords: ['cricket', 'sport', 'ספורט'],
		icon: 'icons/onion/1554-cricket_4x.png',
	},
	archery: {
		keywords: ['archery', 'sport', 'ספורט'],
		icon: 'icons/onion/1752-archery_4x.png',
	},
	running: {
		keywords: ['running', 'sport', 'ספורט'],
		icon: 'icons/onion/1680-running_4x.png',
	},
	'nordic walking': {
		keywords: ['nordic walking', 'sport', 'ספורט', 'הליכה'],
		icon: 'icons/onion/1837-nordic walking_4x.png',
	},
	cycling: {
		keywords: ['cycling', 'sport', 'ספורט'],
		icon: 'icons/onion/1522-cycling_4x.png',
	},
	dancing: {
		keywords: ['dancing', 'ריקוד', 'לרקוד', 'dance'],
		icon: 'icons/onion/1773-dancing_4x.png',
	},
	'climbing (carabiner)': {
		keywords: ['climbing (carabiner)'],
		icon: 'icons/onion/1771-climbing (carabiner)_4x.png',
	},
	'climbing (ropes)': {
		keywords: ['climbing (ropes)'],
		icon: 'icons/onion/1772-climbing (ropes)_4x.png',
	},
	caving: {
		keywords: ['caving'],
		icon: 'icons/onion/1768-caving_4x.png',
	},
	frisbee: {
		keywords: ['frisbee'],
		icon: 'icons/onion/1794-frisbee_4x.png',
	},
	skateboarding: {
		keywords: ['skateboarding'],
		icon: 'icons/onion/1866-skateboarding_4x.png',
	},
	parachute: {
		keywords: ['parachute'],
		icon: 'icons/onion/1838-parachute_4x.png',
	},
	wingsuit: {
		keywords: ['wingsuit'],
		icon: 'icons/onion/1897-wingsuit_4x.png',
	},
	hockey: {
		keywords: ['hockey'],
		icon: 'icons/onion/1805-hockey_4x.png',
	},
	skating: {
		keywords: ['skating'],
		icon: 'icons/onion/1867-skating_4x.png',
	},
	'skiing (downhill)': {
		keywords: ['ski', 'סקי', 'sport', 'ספורט'],
		icon: 'icons/onion/1688-ski-downhill_4x.png',
	},
	'skiing (cross country)': {
		keywords: ['ski', 'סקי', 'sport', 'ספורט'],
		icon: 'icons/onion/1690-ski-xc_4x.png',
	},
	'ski lift': {
		keywords: ['ski lift'],
		icon: 'icons/onion/1689-ski lift_4x.png',
	},
	snowboarding: {
		keywords: ['snowboarding', 'סנואו', 'sport', 'ספורט', 'סקי', 'שלג'],
		icon: 'icons/onion/1871-snowboarding_4x.png',
	},
	sledding: {
		keywords: ['sledding', 'sport', 'ספורט'],
		icon: 'icons/onion/1691-sledding_4x.png',
	},
	snowshoeing: {
		keywords: ['snowshoeing', 'sport', 'ספורט'],
		icon: 'icons/onion/1873-snowshoeing_4x.png',
	},
	snowmobile: {
		keywords: ['snowmobile', 'sport', 'ספורט'],
		icon: 'icons/onion/1872-snowmobile_4x.png',
	},
	canoeing: {
		keywords: ['canoeing', 'sport', 'ספורט'],
		icon: 'icons/onion/1536-canoeing_4x.png',
	},
	kayaking: {
		keywords: ['kayaking', 'sport', 'ספורט'],
		icon: 'icons/onion/1615-kayaking_4x.png',
	},
	sailing: {
		keywords: ['sailing', 'sport', 'ספורט'],
		icon: 'icons/onion/1681-sailing_4x.png',
	},
	'jet ski': {
		keywords: ['jet ski', 'סקי', 'sport', 'ספורט'],
		icon: 'icons/onion/1814-jet ski_4x.png',
	},
	surfing: {
		keywords: ['surfing', 'sport', 'ספורט'],
		icon: 'icons/onion/1880-surfing_4x.png',
	},
	kitesurfing: {
		keywords: ['kitesurfing', 'sport', 'ספורט'],
		icon: 'icons/onion/1817-kitesurfing_4x.png',
	},
	windsurfing: {
		keywords: ['windsurfing', 'sport', 'ספורט'],
		icon: 'icons/onion/1896-windsurfing_4x.png',
	},
	swimming: {
		keywords: ['swimming', 'שחיה', 'שחייה', 'sport', 'ספורט'],
		icon: 'icons/onion/1701-swimming_4x.png',
	},
	snorkeling: {
		keywords: ['snorkeling', 'שנורקל', 'sport', 'ספורט'],
		icon: 'icons/onion/1870-snorkeling_4x.png',
	},
	scuba: {
		keywords: ['scuba', 'sport', 'ספורט', 'צלילה'],
		icon: 'icons/onion/1861-scuba_4x.png',
	},
	fishing: {
		keywords: ['fishing', 'דייג', 'דיג', 'דגים', 'sport', 'ספורט'],
		icon: 'icons/onion/1573-fishing_4x.png',
	},
	shipwreck: {
		keywords: ['shipwreck', 'sport', 'ספורט'],
		icon: 'icons/onion/1864-shipwreck_4x.png',
	},
	diving: {
		keywords: ['diving', 'צלילה', 'sport', 'ספורט'],
		icon: 'icons/onion/1777-diving_4x.png',
	},
	picnic: {
		keywords: ['picnic', 'פיקניק'],
		icon: 'icons/onion/1650-picnic_4x.png',
	},
	// "tree (conifer)": {
	//     "keywords": [
	//         "tree (conifer)"
	//     ],
	//     "icon": "icons/onion/1720-tree (conifer)_4x.png"
	// },
	// "tree (deciduous)": {
	//     "keywords": [
	//         "tree (deciduous)"
	//     ],
	//     "icon": "icons/onion/1886-tree (deciduous)_4x.png"
	// },
	// "tree (palm)": {
	//     "keywords": [
	//         "tree (palm)"
	//     ],
	//     "icon": "icons/onion/1887-tree (palm)_4x.png"
	// },
	mountain: {
		keywords: ['mountain'],
		icon: 'icons/onion/1634-mountain_4x.png',
	},
	cave: {
		keywords: ['cave'],
		icon: 'icons/onion/1767-cave_4x.png',
	},
	'hot spring': {
		keywords: ['hot spring'],
		icon: 'icons/onion/1811-hot spring_4x.png',
	},
	waterfall: {
		keywords: ['waterfall'],
		icon: 'icons/onion/1892-waterfall_4x.png',
	},
	tidepool: {
		keywords: ['tidepool'],
		icon: 'icons/onion/1882-tidepool_4x.png',
	},
	trailhead: {
		keywords: ['trailhead'],
		icon: 'icons/onion/1597-trailhead_4x.png',
	},
	hiking: {
		keywords: ['hiking'],
		icon: 'icons/onion/1596-hiking_4x.png',
	},
	'hiking (group)': {
		keywords: ['hiking (group)'],
		icon: 'icons/onion/1595-hiking (group)_4x.png',
	},
	birdwatching: {
		keywords: ['birdwatching'],
		icon: 'icons/onion/1760-birdwatching_4x.png',
	},
	wildlife: {
		keywords: ['wildlife'],
		icon: 'icons/onion/1774-wildlife_4x.png',
	},
	hunting: {
		keywords: ['hunting'],
		icon: 'icons/onion/1812-hunting_4x.png',
	},
	'rock collecting': {
		keywords: ['rock collecting'],
		icon: 'icons/onion/1855-rock collecting_4x.png',
	},
	stargazing: {
		keywords: ['stargazing'],
		icon: 'icons/onion/1878-stargazing_4x.png',
	},
	viewpoint: {
		keywords: ['viewpoint'],
		icon: 'icons/onion/1523-viewpoint_4x.png',
	},
	camping: {
		keywords: ['camping'],
		icon: 'icons/onion/1765-camping_4x.png',
	},
	guitar: {
		keywords: ['guitar'],
		icon: 'icons/onion/1801-guitar_4x.png',
	},
	campfire: {
		keywords: ['campfire'],
		icon: 'icons/onion/1764-campfire_4x.png',
	},
	grill: {
		keywords: ['grill'],
		icon: 'icons/onion/1800-grill_4x.png',
	},
	hatchet: {
		keywords: ['hatchet'],
		icon: 'icons/onion/1802-hatchet_4x.png',
	},
	camper: {
		keywords: ['camper'],
		icon: 'icons/onion/1763-camper_4x.png',
	},
	atv: {
		keywords: ['atv'],
		icon: 'icons/onion/1754-atv_4x.png',
	},
	rv: {
		keywords: ['rv'],
		icon: 'icons/onion/1859-rv_4x.png',
	},
	'dump station': {
		keywords: ['dump station'],
		icon: 'icons/onion/1781-dump station_4x.png',
	},
	'food storage': {
		keywords: ['food storage'],
		icon: 'icons/onion/1792-food storage_4x.png',
	},
	showers: {
		keywords: ['showers'],
		icon: 'icons/onion/1865-showers_4x.png',
	},
	restaurant: {
		keywords: ['restaurant'],
		icon: 'icons/onion/1577-restaurant_4x.png',
	},
	'fast food': {
		keywords: ['fast food'],
		icon: 'icons/onion/1567-fast food_4x.png',
	},
	burger: {
		keywords: ['burger'],
		icon: 'icons/onion/1530-burger_4x.png',
	},
	'hot dog': {
		keywords: ['hot dog'],
		icon: 'icons/onion/1810-hotdog_4x.png',
	},
	pizza: {
		keywords: ['pizza'],
		icon: 'icons/onion/1651-pizza_4x.png',
	},
	noodles: {
		keywords: ['noodles'],
		icon: 'icons/onion/1640-noodles_4x.png',
	},
	sushi: {
		keywords: ['sushi'],
		icon: 'icons/onion/1835-sushi_4x.png',
	},
	steak: {
		keywords: ['steak'],
		icon: 'icons/onion/1553-steak_4x.png',
	},
	chicken: {
		keywords: ['chicken'],
		icon: 'icons/onion/1545-chicken_4x.png',
	},
	seafood: {
		keywords: ['seafood'],
		icon: 'icons/onion/1573-seafood_4x.png',
	},
	'ice cream': {
		keywords: ['ice cream'],
		icon: 'icons/onion/1607-ice cream_4x.png',
	},
	cocktails: {
		keywords: ['cocktails'],
		icon: 'icons/onion/1517-cocktails_4x.png',
	},
	pub: {
		keywords: ['pub'],
		icon: 'icons/onion/1518-pub_4x.png',
	},
	beer: {
		keywords: ['beer'],
		icon: 'icons/onion/1879-beer_4x.png',
	},
	glass: {
		keywords: ['glass'],
		icon: 'icons/onion/1798-glass_4x.png',
	},
	cafe: {
		keywords: ['cafe'],
		icon: 'icons/onion/1534-cafe_4x.png',
	},
	teahouse: {
		keywords: ['teahouse'],
		icon: 'icons/onion/1705-teahouse_4x.png',
	},
	gifts: {
		keywords: ['gifts'],
		icon: 'icons/onion/1584-gifts_4x.png',
	},
	'shopping cart': {
		keywords: ['shopping cart'],
		icon: 'icons/onion/1685-shopping cart_4x.png',
	},
	groceries: {
		keywords: ['groceries'],
		icon: 'icons/onion/1578-groceries_4x.png',
	},
	shoes: {
		keywords: ['shoes'],
		icon: 'icons/onion/1683-shoes_4x.png',
	},
	clothing: {
		keywords: ['clothing'],
		icon: 'icons/onion/1549-clothing_4x.png',
	},
	jewelry: {
		keywords: ['jewelry'],
		icon: 'icons/onion/1613-jewelry_4x.png',
	},
	garden: {
		keywords: ['garden'],
		icon: 'icons/onion/1582-garden_4x.png',
	},
	'health food': {
		keywords: ['health food'],
		icon: 'icons/onion/1587-health food_4x.png',
	},
	pharmacy: {
		keywords: ['pharmacy'],
		icon: 'icons/onion/1646-pharmacy_4x.png',
	},
	'pharmacy (europe)': {
		keywords: ['pharmacy (europe)'],
		icon: 'icons/onion/1841-pharmacy (europe)_4x.png',
	},
	'mobile phones': {
		keywords: ['mobile phones'],
		icon: 'icons/onion/1647-mobile phones_4x.png',
	},
	'internet services': {
		keywords: ['internet services'],
		icon: 'icons/onion/1609-internet services_4x.png',
	},
	wifi: {
		keywords: ['wifi'],
		icon: 'icons/onion/1895-wifi_4x.png',
	},
	laptop: {
		keywords: ['laptop'],
		icon: 'icons/onion/1820-laptop_4x.png',
	},
	television: {
		keywords: ['television'],
		icon: 'icons/onion/1725-television_4x.png',
	},
	books: {
		keywords: ['books'],
		icon: 'icons/onion/1526-books_4x.png',
	},
	newsstand: {
		keywords: ['newsstand'],
		icon: 'icons/onion/1638-newsstand_4x.png',
	},
	atm: {
		keywords: ['atm'],
		icon: 'icons/onion/1510-atm_4x.png',
	},
	'atm (generic)': {
		keywords: ['atm (generic)'],
		icon: 'icons/onion/1753-atm (generic)_4x.png',
	},
	'financial services': {
		keywords: ['financial services'],
		icon: 'icons/onion/1570-financial services_4x.png',
	},
	'currency exchange': {
		keywords: ['currency exchange'],
		icon: 'icons/onion/1555-currency exchange_4x.png',
	},
	bank: {
		keywords: ['bank'],
		icon: 'icons/onion/1756-bank_4x.png',
	},
	dollar: {
		keywords: ['dollar'],
		icon: 'icons/onion/1512-dollar_4x.png',
	},
	euro: {
		keywords: ['euro'],
		icon: 'icons/onion/1513-euro_4x.png',
	},
	pound: {
		keywords: ['pound'],
		icon: 'icons/onion/1514-pound_4x.png',
	},
	won: {
		keywords: ['won'],
		icon: 'icons/onion/1758-won_4x.png',
	},
	'yen/yuan': {
		keywords: ['yen/yuan'],
		icon: 'icons/onion/1515-yen/yuan_4x.png',
	},
	theater: {
		keywords: ['theater'],
		icon: 'icons/onion/1709-theater_4x.png',
	},
	event: {
		keywords: ['event'],
		icon: 'icons/onion/1511-event_4x.png',
	},
	birthday: {
		keywords: ['birthday'],
		icon: 'icons/onion/1762-birthday_4x.png',
	},
	movies: {
		keywords: ['movies'],
		icon: 'icons/onion/1635-movies_4x.png',
	},
	ticket: {
		keywords: ['ticket'],
		icon: 'icons/onion/1712-ticket_4x.png',
	},
	'ticket (star)': {
		keywords: ['ticket (star)'],
		icon: 'icons/onion/1713-ticket (star)_4x.png',
	},
	gambling: {
		keywords: ['gambling'],
		icon: 'icons/onion/1540-gambling_4x.png',
	},
	'amusement park': {
		keywords: ['amusement park'],
		icon: 'icons/onion/1568-amusement park_4x.png',
	},
	zoo: {
		keywords: ['zoo'],
		icon: 'icons/onion/1743-zoo_4x.png',
	},
	'music hall': {
		keywords: ['music hall'],
		icon: 'icons/onion/1649-music hall_4x.png',
	},
	music: {
		keywords: ['music'],
		icon: 'icons/onion/1637-music_4x.png',
	},
	karaoke: {
		keywords: ['karaoke'],
		icon: 'icons/onion/1614-karaoke_4x.png',
	},
	moustache: {
		keywords: ['moustache'],
		icon: 'icons/onion/1832-moustache_4x.png',
	},
	'adult entertainment': {
		keywords: ['adult entertainment'],
		icon: 'icons/onion/1503-adult entertainment_4x.png',
	},
	tower: {
		keywords: ['tower'],
		icon: 'icons/onion/1715-tower_4x.png',
	},
	art: {
		keywords: ['art'],
		icon: 'icons/onion/1509-art_4x.png',
	},
	handicapped: {
		keywords: ['handicapped'],
		icon: 'icons/onion/1735-handicapped_4x.png',
	},
	parking: {
		keywords: ['parking'],
		icon: 'icons/onion/1644-parking_4x.png',
	},
	'picnic table': {
		keywords: ['picnic table'],
		icon: 'icons/onion/1650-picnic table_4x.png',
	},
	playground: {
		keywords: ['playground'],
		icon: 'icons/onion/1652-playground_4x.png',
	},
	park: {
		keywords: ['park'],
		icon: 'icons/onion/1720-park_4x.png',
	},
	photo: {
		keywords: ['photo'],
		icon: 'icons/onion/1535-photo_4x.png',
	},
	video: {
		keywords: ['video'],
		icon: 'icons/onion/1727-video_4x.png',
	},
	door: {
		keywords: ['door'],
		icon: 'icons/onion/1783-door_4x.png',
	},
	elevator: {
		keywords: ['elevator'],
		icon: 'icons/onion/1782-elevator_4x.png',
	},
	escalator: {
		keywords: ['escalator'],
		icon: 'icons/onion/1786-escalator_4x.png',
	},
	'escalator (down)': {
		keywords: ['escalator (down)'],
		icon: 'icons/onion/1784-escalator (down)_4x.png',
	},
	'escalator (up)': {
		keywords: ['escalator (up)'],
		icon: 'icons/onion/1785-escalator (up)_4x.png',
	},
	stairs: {
		keywords: ['stairs'],
		icon: 'icons/onion/1877-stairs_4x.png',
	},
	'moving sidewalk': {
		keywords: ['moving sidewalk'],
		icon: 'icons/onion/1833-moving sidewalk_4x.png',
	},
	here: {
		keywords: ['here'],
		icon: 'icons/onion/1803-here_4x.png',
	},
	'meeting point': {
		keywords: ['meeting point'],
		icon: 'icons/onion/1826-meeting point_4x.png',
	},
	'lost and found': {
		keywords: ['lost and found'],
		icon: 'icons/onion/1824-lost and found_4x.png',
	},
	locker: {
		keywords: ['locker'],
		icon: 'icons/onion/1823-locker_4x.png',
	},
	printer: {
		keywords: ['printer'],
		icon: 'icons/onion/1845-printer_4x.png',
	},
	'waiting room': {
		keywords: ['waiting room'],
		icon: 'icons/onion/1891-waiting room_4x.png',
	},
	phone: {
		keywords: ['phone'],
		icon: 'icons/onion/1648-phone_4x.png',
	},
	trash: {
		keywords: ['trash'],
		icon: 'icons/onion/1857-trash_4x.png',
	},
	recycling: {
		keywords: ['recycling'],
		icon: 'icons/onion/1850-recycling_4x.png',
	},
	'no smoking': {
		keywords: ['no smoking'],
		icon: 'icons/onion/1836-no smoking_4x.png',
	},
	smoking: {
		keywords: ['smoking'],
		icon: 'icons/onion/1868-smoking_4x.png',
	},
	restroom: {
		keywords: ['restroom'],
		icon: 'icons/onion/1733-restroom_4x.png',
	},
	'restroom (women)': {
		keywords: ['restroom (women)'],
		icon: 'icons/onion/1734-restroom (women)_4x.png',
	},
	'restroom (men)': {
		keywords: ['restroom (men)'],
		icon: 'icons/onion/1732-restroom (men)_4x.png',
	},
	shower: {
		keywords: ['shower'],
		icon: 'icons/onion/1687-shower_4x.png',
	},
	nursery: {
		keywords: ['nursery'],
		icon: 'icons/onion/1742-nursery_4x.png',
	},
	stroller: {
		keywords: ['stroller'],
		icon: 'icons/onion/1844-stroller_4x.png',
	},
	'fire extinguisher': {
		keywords: ['fire extinguisher'],
		icon: 'icons/onion/1790-fire extinguisher_4x.png',
	},
	'medical services': {
		keywords: ['medical services'],
		icon: 'icons/onion/1558-medical services_4x.png',
	},
	aed: {
		keywords: ['aed'],
		icon: 'icons/onion/1749-aed_4x.png',
	},
	'boat launch': {
		keywords: ['boat launch'],
		icon: 'icons/onion/1525-boat launch_4x.png',
	},
	marina: {
		keywords: ['marina'],
		icon: 'icons/onion/1623-marina_4x.png',
	},
	yacht: {
		keywords: ['yacht'],
		icon: 'icons/onion/1622-yacht_4x.png',
	},
	'lookout tower': {
		keywords: ['lookout tower'],
		icon: 'icons/onion/1621-lookout tower_4x.png',
	},
	amphitheatre: {
		keywords: ['amphitheatre'],
		icon: 'icons/onion/1708-amphitheatre_4x.png',
	},
	'animal shelter': {
		keywords: ['animal shelter'],
		icon: 'icons/onion/1508-animal shelter_4x.png',
	},
	'animal services': {
		keywords: ['animal services'],
		icon: 'icons/onion/1506-animal services_4x.png',
	},
	monument: {
		keywords: ['monument'],
		icon: 'icons/onion/1599-monument_4x.png',
	},
	fountain: {
		keywords: ['fountain'],
		icon: 'icons/onion/1580-fountain_4x.png',
	},
	'point of interest': {
		keywords: ['point of interest'],
		icon: 'icons/onion/1611-point of interest_4x.png',
	},
	'cemetery (japan)': {
		keywords: ['cemetery (japan)'],
		icon: 'icons/onion/1610-cemetery (japan)_4x.png',
	},
	cemetery: {
		keywords: ['cemetery'],
		icon: 'icons/onion/1542-cemetery_4x.png',
	},
	plaque: {
		keywords: ['plaque'],
		icon: 'icons/onion/1600-plaque_4x.png',
	},
	museum: {
		keywords: ['museum'],
		icon: 'icons/onion/1636-museum_4x.png',
	},
	'historic building': {
		keywords: ['historic building'],
		icon: 'icons/onion/1598-historic building_4x.png',
	},
	farm: {
		keywords: ['farm'],
		icon: 'icons/onion/1566-farm_4x.png',
	},
	mine: {
		keywords: ['mine'],
		icon: 'icons/onion/1627-mine_4x.png',
	},
	lighthouse: {
		keywords: ['lighthouse'],
		icon: 'icons/onion/1618-lighthouse_4x.png',
	},
	'radio tower': {
		keywords: ['radio tower'],
		icon: 'icons/onion/1529-radio tower_4x.png',
	},
	vista: {
		keywords: ['vista'],
		icon: 'icons/onion/1729-vista_4x.png',
	},
	'vista (partial)': {
		keywords: ['vista (partial)'],
		icon: 'icons/onion/1728-vista (partial)_4x.png',
	},
	headquarters: {
		keywords: ['headquarters'],
		icon: 'icons/onion/1591-headquarters_4x.png',
	},
	dormitory: {
		keywords: ['dormitory'],
		icon: 'icons/onion/1559-dormitory_4x.png',
	},
	'convenience store': {
		keywords: ['convenience store'],
		icon: 'icons/onion/1631-convenience store_4x.png',
	},
	'post office': {
		keywords: ['post office'],
		icon: 'icons/onion/1659-post office_4x.png',
	},
	'post office (japan)': {
		keywords: ['post office (japan)'],
		icon: 'icons/onion/1612-post office (japan)_4x.png',
	},
	'gas station': {
		keywords: ['gas station'],
		icon: 'icons/onion/1581-gas station_4x.png',
	},
	'ev charging station': {
		keywords: ['ev charging station'],
		icon: 'icons/onion/1787-ev charging station_4x.png',
	},
	'car rental': {
		keywords: ['car rental'],
		icon: 'icons/onion/1741-car rental_4x.png',
	},
	'car repair': {
		keywords: ['car repair'],
		icon: 'icons/onion/1539-car repair_4x.png',
	},
	dating: {
		keywords: ['dating'],
		icon: 'icons/onion/1592-dating_4x.png',
	},
	'barber/salon': {
		keywords: ['barber/salon'],
		icon: 'icons/onion/1516-barber/salon_4x.png',
	},
	'laundry service': {
		keywords: ['laundry service'],
		icon: 'icons/onion/1617-laundry service_4x.png',
	},
	'laundry center': {
		keywords: ['laundry center'],
		icon: 'icons/onion/1821-laundry center_4x.png',
	},
	kitchen: {
		keywords: ['kitchen'],
		icon: 'icons/onion/1816-kitchen_4x.png',
	},
	construction: {
		keywords: ['construction'],
		icon: 'icons/onion/1551-construction_4x.png',
	},
	hardware: {
		keywords: ['hardware'],
		icon: 'icons/onion/1590-hardware_4x.png',
	},
	electrician: {
		keywords: ['electrician'],
		icon: 'icons/onion/1561-electrician_4x.png',
	},
	plumbing: {
		keywords: ['plumbing'],
		icon: 'icons/onion/1703-plumbing_4x.png',
	},
	business: {
		keywords: ['business'],
		icon: 'icons/onion/1531-business_4x.png',
	},
	travel: {
		keywords: ['travel'],
		icon: 'icons/onion/1699-travel_4x.png',
	},
	'real estate': {
		keywords: ['real estate'],
		icon: 'icons/onion/1665-real estate_4x.png',
	},
	school: {
		keywords: ['school'],
		icon: 'icons/onion/1682-school_4x.png',
	},
	university: {
		keywords: ['university'],
		icon: 'icons/onion/1726-university_4x.png',
	},
	library: {
		keywords: ['library'],
		icon: 'icons/onion/1664-library_4x.png',
	},
	academy: {
		keywords: ['academy'],
		icon: 'icons/onion/1740-academy_4x.png',
	},
	'civic building': {
		keywords: ['civic building'],
		icon: 'icons/onion/1548-civic building_4x.png',
	},
	courthouse: {
		keywords: ['courthouse'],
		icon: 'icons/onion/1552-courthouse_4x.png',
	},
	police: {
		keywords: ['police'],
		icon: 'icons/onion/1657-police_4x.png',
	},
	dentist: {
		keywords: ['dentist'],
		icon: 'icons/onion/1557-dentist_4x.png',
	},
	optometrist: {
		keywords: ['optometrist'],
		icon: 'icons/onion/1643-optometrist_4x.png',
	},
	gym: {
		keywords: ['gym'],
		icon: 'icons/onion/1589-gym_4x.png',
	},
	'hot tub': {
		keywords: ['hot tub'],
		icon: 'icons/onion/1809-hot tub_4x.png',
	},
	spa: {
		keywords: ['spa'],
		icon: 'icons/onion/1697-spa_4x.png',
	},
	yoga: {
		keywords: ['yoga'],
		icon: 'icons/onion/1737-yoga_4x.png',
	},
	prayer: {
		keywords: ['prayer'],
		icon: 'icons/onion/1676-prayer_4x.png',
	},
	"bahá'í": {
		keywords: ["bahá'í"],
		icon: "icons/onion/1666-bahá'í_4x.png",
	},
	'buddhist (wheel)': {
		keywords: ['buddhist (wheel)'],
		icon: 'icons/onion/1668-buddhist (wheel)_4x.png',
	},
	'buddhist (zen)': {
		keywords: ['buddhist (zen)'],
		icon: 'icons/onion/1669-buddhist (zen)_4x.png',
	},
	christian: {
		keywords: ['christian'],
		icon: 'icons/onion/1670-christian_4x.png',
	},
	hindu: {
		keywords: ['hindu'],
		icon: 'icons/onion/1672-hindu_4x.png',
	},
	islamic: {
		keywords: ['islamic'],
		icon: 'icons/onion/1673-islamic_4x.png',
	},
	jain: {
		keywords: ['jain'],
		icon: 'icons/onion/1674-jain_4x.png',
	},
	jewish: {
		keywords: ['jewish'],
		icon: 'icons/onion/1675-jewish_4x.png',
	},
	mormon: {
		keywords: ['mormon'],
		icon: 'icons/onion/1830-mormon_4x.png',
	},
	shinto: {
		keywords: ['shinto'],
		icon: 'icons/onion/1677-shinto_4x.png',
	},
	sikh: {
		keywords: ['sikh'],
		icon: 'icons/onion/1678-sikh_4x.png',
	},
	'place of worship': {
		keywords: ['place of worship'],
		icon: 'icons/onion/1671-place of worship_4x.png',
	},
	temple: {
		keywords: ['temple'],
		icon: 'icons/onion/1706-temple_4x.png',
	},
	'you are here': {
		keywords: ['you are here'],
		icon: 'icons/onion/1654-you are here_4x.png',
	},
	information: {
		keywords: ['information'],
		icon: 'icons/onion/1608-information_4x.png',
	},
	help: {
		keywords: ['help'],
		icon: 'icons/onion/1594-help_4x.png',
	},
	house: {
		keywords: ['house'],
		icon: 'icons/onion/1603-house_4x.png',
	},
	shop: {
		keywords: ['shop'],
		icon: 'icons/onion/1686-shop_4x.png',
	},
	'gated community': {
		keywords: ['gated community'],
		icon: 'icons/onion/1583-gated community_4x.png',
	},
	neighborhood: {
		keywords: ['neighborhood'],
		icon: 'icons/onion/1604-neighborhood_4x.png',
	},
	city: {
		keywords: ['city'],
		icon: 'icons/onion/1546-city_4x.png',
	},
	downtown: {
		keywords: ['downtown'],
		icon: 'icons/onion/1547-downtown_4x.png',
	},
	factory: {
		keywords: ['factory'],
		icon: 'icons/onion/1565-factory_4x.png',
	},
	flag: {
		keywords: ['flag'],
		icon: 'icons/onion/1574-flag_4x.png',
	},
	'city office (japan)': {
		keywords: ['city office (japan)'],
		icon: 'icons/onion/1770-city office (japan)_4x.png',
	},
	'bank (japan)': {
		keywords: ['bank (japan)'],
		icon: 'icons/onion/1757-bank (japan)_4x.png',
	},
	'museum (japan)': {
		keywords: ['museum (japan)'],
		icon: 'icons/onion/1834-museum (japan)_4x.png',
	},
	'fire station (japan)': {
		keywords: ['fire station (japan)'],
		icon: 'icons/onion/1791-fire station (japan)_4x.png',
	},
	'hospital (japan)': {
		keywords: ['hospital (japan)'],
		icon: 'icons/onion/1808-hospital (japan)_4x.png',
	},
	'police (japan)': {
		keywords: ['police (japan)'],
		icon: 'icons/onion/1842-police (japan)_4x.png',
	},
	'school (japan)': {
		keywords: ['school (japan)'],
		icon: 'icons/onion/1860-school (japan)_4x.png',
	},
	'historic building (china)': {
		keywords: ['historic building (china)'],
		icon: 'icons/onion/1804-historic building (china)_4x.png',
	},
	'tall ship': {
		keywords: ['tall ship'],
		icon: 'icons/onion/1881-tall ship_4x.png',
	},
	'treasure chest': {
		keywords: ['treasure chest'],
		icon: 'icons/onion/1885-treasure chest_4x.png',
	},
	'message in a bottle': {
		keywords: ['message in a bottle'],
		icon: 'icons/onion/1827-message in a bottle_4x.png',
	},
	shark: {
		keywords: ['shark'],
		icon: 'icons/onion/1863-shark_4x.png',
	},
	robot: {
		keywords: ['robot'],
		icon: 'icons/onion/1854-robot_4x.png',
	},
	rocket: {
		keywords: ['rocket'],
		icon: 'icons/onion/1856-rocket_4x.png',
	},
	ufo: {
		keywords: ['ufo'],
		icon: 'icons/onion/1889-ufo_4x.png',
	},
	alien: {
		keywords: ['alien'],
		icon: 'icons/onion/1751-alien_4x.png',
	},
	walking: {
		keywords: ['walking'],
		icon: 'icons/onion/1731-walking_4x.png',
	},
	moped: {
		keywords: ['moped'],
		icon: 'icons/onion/1632-moped_4x.png',
	},
	motorcycle: {
		keywords: ['motorcycle'],
		icon: 'icons/onion/1633-motorcycle_4x.png',
	},
	car: {
		keywords: ['car'],
		icon: 'icons/onion/1538-car_4x.png',
	},
	'rental car': {
		keywords: ['rental car'],
		icon: 'icons/onion/1741-rental car_4x.png',
	},
	taxi: {
		keywords: ['taxi'],
		icon: 'icons/onion/1704-taxi_4x.png',
	},
	bus: {
		keywords: ['bus'],
		icon: 'icons/onion/1532-bus_4x.png',
	},
	subway: {
		keywords: ['subway'],
		icon: 'icons/onion/1719-subway_4x.png',
	},
	train: {
		keywords: ['train'],
		icon: 'icons/onion/1716-train_4x.png',
	},
	tram: {
		keywords: ['tram'],
		icon: 'icons/onion/1718-tram_4x.png',
	},
	metro: {
		keywords: ['metro'],
		icon: 'icons/onion/1626-metro_4x.png',
	},
	railway: {
		keywords: ['railway'],
		icon: 'icons/onion/1662-railway_4x.png',
	},
	'train (steam)': {
		keywords: ['train (steam)'],
		icon: 'icons/onion/1717-train (steam)_4x.png',
	},
	gondola: {
		keywords: ['gondola'],
		icon: 'icons/onion/1586-gondola_4x.png',
	},
	'cable car': {
		keywords: ['cable car'],
		icon: 'icons/onion/1533-cable car_4x.png',
	},
	monorail: {
		keywords: ['monorail'],
		icon: 'icons/onion/1629-monorail_4x.png',
	},
	ferry: {
		keywords: ['ferry'],
		icon: 'icons/onion/1569-ferry_4x.png',
	},
	'vehicle ferry': {
		keywords: ['vehicle ferry'],
		icon: 'icons/onion/1537-vehicle ferry_4x.png',
	},
	airport: {
		keywords: ['airport'],
		icon: 'icons/onion/1504-airport_4x.png',
	},
	airstrip: {
		keywords: ['airstrip'],
		icon: 'icons/onion/1750-airstrip_4x.png',
	},
	helicopter: {
		keywords: ['helicopter'],
		icon: 'icons/onion/1593-helicopter_4x.png',
	},
	truck: {
		keywords: ['truck'],
		icon: 'icons/onion/1722-truck_4x.png',
	},
	tractor: {
		keywords: ['tractor'],
		icon: 'icons/onion/1883-tractor_4x.png',
	},
	'parking space': {
		keywords: ['parking space'],
		icon: 'icons/onion/1562-parking space_4x.png',
	},
	bridge: {
		keywords: ['bridge'],
		icon: 'icons/onion/1528-bridge_4x.png',
	},
	tunnel: {
		keywords: ['tunnel'],
		icon: 'icons/onion/1724-tunnel_4x.png',
	},
	accident: {
		keywords: ['accident'],
		icon: 'icons/onion/1748-accident_4x.png',
	},
	'road work': {
		keywords: ['road work'],
		icon: 'icons/onion/1853-road work_4x.png',
	},
	'traffic light': {
		keywords: ['traffic light'],
		icon: 'icons/onion/1884-traffic light_4x.png',
	},
	'police station': {
		keywords: ['police station'],
		icon: 'icons/onion/1655-police station_4x.png',
	},
	'police officer': {
		keywords: ['police officer'],
		icon: 'icons/onion/1657-police officer_4x.png',
	},
	'police car': {
		keywords: ['police car'],
		icon: 'icons/onion/1656-police car_4x.png',
	},
	hospital: {
		keywords: ['hospital'],
		icon: 'icons/onion/1807-hospital_4x.png',
	},
	'hospital (crescent)': {
		keywords: ['hospital (crescent)'],
		icon: 'icons/onion/1806-hospital (crescent)_4x.png',
	},
	'hospital (cross)': {
		keywords: ['hospital (cross)'],
		icon: 'icons/onion/1624-hospital (cross)_4x.png',
	},
	'hospital (shield)': {
		keywords: ['hospital (shield)'],
		icon: 'icons/onion/1808-hospital (shield)_4x.png',
	},
	ambulance: {
		keywords: ['ambulance'],
		icon: 'icons/onion/1505-ambulance_4x.png',
	},
	explosion: {
		keywords: ['explosion'],
		icon: 'icons/onion/1564-explosion_4x.png',
	},
	gun: {
		keywords: ['gun'],
		icon: 'icons/onion/1588-gun_4x.png',
	},
	death: {
		keywords: ['death'],
		icon: 'icons/onion/1556-death_4x.png',
	},
	'missing person': {
		keywords: ['missing person'],
		icon: 'icons/onion/1628-missing person_4x.png',
	},
	'civil disturbance': {
		keywords: ['civil disturbance'],
		icon: 'icons/onion/1625-civil disturbance_4x.png',
	},
	biohazard: {
		keywords: ['biohazard'],
		icon: 'icons/onion/1524-biohazard_4x.png',
	},
	atomic: {
		keywords: ['atomic'],
		icon: 'icons/onion/1641-atomic_4x.png',
	},
	radioactive: {
		keywords: ['radioactive'],
		icon: 'icons/onion/1642-radioactive_4x.png',
	},
	poison: {
		keywords: ['poison'],
		icon: 'icons/onion/1653-poison_4x.png',
	},
	chemical: {
		keywords: ['chemical'],
		icon: 'icons/onion/1544-chemical_4x.png',
	},
	pollution: {
		keywords: ['pollution'],
		icon: 'icons/onion/1693-pollution_4x.png',
	},
	spill: {
		keywords: ['spill'],
		icon: 'icons/onion/1658-spill_4x.png',
	},
	'no water': {
		keywords: ['no water'],
		icon: 'icons/onion/1702-no water_4x.png',
	},
	water: {
		keywords: ['water'],
		icon: 'icons/onion/1703-water_4x.png',
	},
	mosquito: {
		keywords: ['mosquito'],
		icon: 'icons/onion/1831-mosquito_4x.png',
	},
	electrical: {
		keywords: ['electrical'],
		icon: 'icons/onion/1660-electrical_4x.png',
	},
	caution: {
		keywords: ['caution'],
		icon: 'icons/onion/1541-caution_4x.png',
	},
	ngo: {
		keywords: ['ngo'],
		icon: 'icons/onion/1639-ngo_4x.png',
	},
	tornado: {
		keywords: ['tornado'],
		icon: 'icons/onion/1714-tornado_4x.png',
	},
	tsunami: {
		keywords: ['tsunami'],
		icon: 'icons/onion/1723-tsunami_4x.png',
	},
	volcano: {
		keywords: ['volcano'],
		icon: 'icons/onion/1730-volcano_4x.png',
	},
	fire: {
		keywords: ['fire'],
		icon: 'icons/onion/1571-fire_4x.png',
	},
	'hurricane (strong)': {
		keywords: ['hurricane (strong)'],
		icon: 'icons/onion/1605-hurricane (strong)_4x.png',
	},
	'hurricane (weak)': {
		keywords: ['hurricane (weak)'],
		icon: 'icons/onion/1606-hurricane (weak)_4x.png',
	},
	flood: {
		keywords: ['flood'],
		icon: 'icons/onion/1575-flood_4x.png',
	},
	earthquake: {
		keywords: ['earthquake'],
		icon: 'icons/onion/1560-earthquake_4x.png',
	},
	epicenter: {
		keywords: ['epicenter'],
		icon: 'icons/onion/1563-epicenter_4x.png',
	},
	landslide: {
		keywords: ['landslide'],
		icon: 'icons/onion/1616-landslide_4x.png',
	},
	monster: {
		keywords: ['monster'],
		icon: 'icons/onion/1630-monster_4x.png',
	},
	sunny: {
		keywords: ['sunny'],
		icon: 'icons/onion/1700-sunny_4x.png',
	},
	'partly cloudy': {
		keywords: ['partly cloudy'],
		icon: 'icons/onion/1645-partly cloudy_4x.png',
	},
	cloudy: {
		keywords: ['cloudy'],
		icon: 'icons/onion/1550-cloudy_4x.png',
	},
	'chance of rain': {
		keywords: ['chance of rain'],
		icon: 'icons/onion/1543-chance of rain_4x.png',
	},
	rain: {
		keywords: ['rain'],
		icon: 'icons/onion/1663-rain_4x.png',
	},
	thunderstorm: {
		keywords: ['thunderstorm'],
		icon: 'icons/onion/1711-thunderstorm_4x.png',
	},
	sleet: {
		keywords: ['sleet'],
		icon: 'icons/onion/1692-sleet_4x.png',
	},
	snow: {
		keywords: ['snow'],
		icon: 'icons/onion/1695-snow_4x.png',
	},
	snowflake: {
		keywords: ['snowflake'],
		icon: 'icons/onion/1694-snowflake_4x.png',
	},
	fog: {
		keywords: ['fog'],
		icon: 'icons/onion/1576-fog_4x.png',
	},
	wind: {
		keywords: ['wind'],
		icon: 'icons/onion/1736-wind_4x.png',
	},
	windstorm: {
		keywords: ['windstorm'],
		icon: 'icons/onion/1721-windstorm_4x.png',
	},
	temperature: {
		keywords: ['temperature'],
		icon: 'icons/onion/1710-temperature_4x.png',
	},
	lightning: {
		keywords: ['lightning'],
		icon: 'icons/onion/1619-lightning_4x.png',
	},
	animal: {
		keywords: ['animal'],
		icon: 'icons/onion/1507-animal_4x.png',
	},
	alligator: {
		keywords: ['alligator'],
		icon: 'icons/onion/1795-alligator_4x.png',
	},
	bear: {
		keywords: ['bear'],
		icon: 'icons/onion/1759-bear_4x.png',
	},
	bird: {
		keywords: ['bird'],
		icon: 'icons/onion/1874-bird_4x.png',
	},
	cat: {
		keywords: ['cat'],
		icon: 'icons/onion/1766-cat_4x.png',
	},
	cow: {
		keywords: ['cow'],
		icon: 'icons/onion/1553-cow_4x.png',
	},
	deer: {
		keywords: ['deer'],
		icon: 'icons/onion/1774-deer_4x.png',
	},
	dinosaur: {
		keywords: ['dinosaur'],
		icon: 'icons/onion/1775-dinosaur_4x.png',
	},
	dog: {
		keywords: ['dog'],
		icon: 'icons/onion/1778-dog_4x.png',
	},
	dolphin: {
		keywords: ['dolphin'],
		icon: 'icons/onion/1779-dolphin_4x.png',
	},
	duck: {
		keywords: ['duck'],
		icon: 'icons/onion/1780-duck_4x.png',
	},
	eagle: {
		keywords: ['eagle'],
		icon: 'icons/onion/1776-eagle_4x.png',
	},
	elephant: {
		keywords: ['elephant'],
		icon: 'icons/onion/1743-elephant_4x.png',
	},
	finch: {
		keywords: ['finch'],
		icon: 'icons/onion/1789-finch_4x.png',
	},
	fish: {
		keywords: ['fish'],
		icon: 'icons/onion/1573-fish_4x.png',
	},
	'fish (tropical)': {
		keywords: ['fish (tropical)'],
		icon: 'icons/onion/1572-fish (tropical)_4x.png',
	},
	fox: {
		keywords: ['fox'],
		icon: 'icons/onion/1793-fox_4x.png',
	},
	gecko: {
		keywords: ['gecko'],
		icon: 'icons/onion/1620-gecko_4x.png',
	},
	giraffe: {
		keywords: ['giraffe'],
		icon: 'icons/onion/1797-giraffe_4x.png',
	},
	horse: {
		keywords: ['horse'],
		icon: 'icons/onion/1601-horse_4x.png',
	},
	mouse: {
		keywords: ['mouse'],
		icon: 'icons/onion/1679-rodent-rat_4x.png',
	},
	jellyfish: {
		keywords: ['jellyfish'],
		icon: 'icons/onion/1813-jellyfish_4x.png',
	},
	kangaroo: {
		keywords: ['kangaroo'],
		icon: 'icons/onion/1815-kangaroo_4x.png',
	},
	kiwi: {
		keywords: ['kiwi'],
		icon: 'icons/onion/1818-kiwi_4x.png',
	},
	kraken: {
		keywords: ['kraken'],
		icon: 'icons/onion/1819-kraken_4x.png',
	},
	lion: {
		keywords: ['lion'],
		icon: 'icons/onion/1822-lion_4x.png',
	},
	monkey: {
		keywords: ['monkey'],
		icon: 'icons/onion/1828-monkey_4x.png',
	},
	moose: {
		keywords: ['moose'],
		icon: 'icons/onion/1829-moose_4x.png',
	},
	parrot: {
		keywords: ['parrot'],
		icon: 'icons/onion/1839-parrot_4x.png',
	},
	penguin: {
		keywords: ['penguin'],
		icon: 'icons/onion/1840-penguin_4x.png',
	},
	rabbit: {
		keywords: ['rabbit'],
		icon: 'icons/onion/1847-rabbit_4x.png',
	},
	raccoon: {
		keywords: ['raccoon'],
		icon: 'icons/onion/1848-raccoon_4x.png',
	},
	rhino: {
		keywords: ['rhino'],
		icon: 'icons/onion/1851-rhino_4x.png',
	},
	roach: {
		keywords: ['roach'],
		icon: 'icons/onion/1852-roach_4x.png',
	},
	seal: {
		keywords: ['seal'],
		icon: 'icons/onion/1862-seal_4x.png',
	},
	snake: {
		keywords: ['snake'],
		icon: 'icons/onion/1869-snake_4x.png',
	},
	squirrel: {
		keywords: ['squirrel'],
		icon: 'icons/onion/1876-squirrel_4x.png',
	},
	turtle: {
		keywords: ['turtle'],
		icon: 'icons/onion/1888-turtle_4x.png',
	},
	whale: {
		keywords: ['whale'],
		icon: 'icons/onion/1894-whale_4x.png',
	},
	ghost: {
		keywords: ['ghost'],
		icon: 'icons/onion/1796-ghost_4x.png',
	},
};

const ignoreKeys = [
	'stadium',
	'running', // <-
	'cycling',
	'billiards',
	'horseback riding',
	'climbing (ropes)',
	'climbing (carabiner)',
	'sledding',
	'skating', // <-
	'canoeing', // <-
	'kayaking', // <-
	'sailing', // <-
	'snorkeling',
	'jet ski',
	'snorcling', // <-
	'fishing',
	'picnic', // <-
	'hiking (group)',
	'hiking', // <-
	'trailhead',
	'tidepool',
	'hot spring',
	'groceries', // <-
	'camping',
	'viewpoint', // <-
	'stargazing', // <-
	'wildlife',
	'steak', // <-
	'sushi', // <-
	'pizza', // <-
	'restaurant', // <-
	'cafe', // <-
	'beer', // <-
	'pub', // <-
	'cocktails', // <-
	'seafood', // <-
	'garden', // <-
	'clothing', // <-
	'shoes', // <-
	'groeceris', // <-
	'gifts', // <-
	'teahouse', // <-
	'television', // <-
	'internet services',
	'mobile phones', // <-
	'pharmacy (europe)',
	'health food',
	'dollar', // <-
	'bank', // <-
	'financial services',
	'atm (generic)', // <-
	'newsstand',
	'books', // <-
	'movies', // <-
	'birthday', // <-
	'event', // <-
	'yen/yuan',
	'won',
	'pound', // <-
	'euro', // <-
	'music', // <-
	'music hall', // <-
	'zoo', // <-
	'amusement park', // <-
	'gambling', // <-
	'ticket (star)', // <-
	'playground', // <-
	'handicapped',
	'art', // <-
	'adult entertainment',
	'escalator (up)', // <-
	'escalator (down)', // <-
	'door', // <-
	'photo', // <-
	'park', // <-
	'restroom (men)',
	'restroom (women)',
	'restroom',
	'trash',
	'marina', // <-
	'medical services',
	'stroller',
	'nursery',
	'shower',
	'point of intereset',
	'monument',
	'animal services',
	'ampitheater',
	'yact',
	'farm',
	'plaque',
	'post office',
	'convenience store',
	'dormitory',
	'vista (partial)',
	'radio tower',
	'laundry center',
	'laundry service',
	'barber/salon',
	'dating',
	'ev charging station',
	'gas station',
	'travel',
	'business',
	'plumbing',
	'electrition',
	'hardware',
	'construction',
	'dentist',
	'police',
	'courthouse',
	'civic building',
	'library',
	'school',
	'buddhist (wheel)',
	"bahá'í",
	'prayer',
	'optometrist',
	'buddhist (zen)',
	'christian',
	'hindu',
	'islamic',
	'jain',
	'jewish',
	'shinto',
	'sikh',
	'place of worship',
	'you are here', // <-
	'information', // <-
	'neighborhood', // <-
	'city', // <-
	'downtown', // <-
	'city office',
	'bank',
	'museum',
	'walking', // <-
	'rental car', // <-
	'subway', // <-
	'tram', // <-
	'railway', // <-
	'train (stream)', // <-
	'cable car', // <-
	'vehicle ferry', // <-
	'airport', // <----
	'parking space',
	'road work',
	'police station',
	'hospital',
	'hospital (crescent)',
	'hospital (cross)',
	'hospital (shield)',
	'death',
	'civil disturbance',
	'atomic',
	'radioactive',
	'poison',
	'chemical',
	'pollution',
	'spill',
	'no water',
	'water', // <-
	'electrical',
	'hurricane (strong)',
	'hurricane (weak)',
	'monster', // <-
	'chance of rain',
	'thunderstorm',
	'windstorm',
	'temperature',
	'animal',
	'alligator',
	'bird',
	'dinosaur',
	'elephant',
	'fish (tropical)',
	'gecko',
	'yacht',
	'amphitheatre',
	'point of interest',
	'electrician',
	'historic building (china)',
	'train (steam)',
];

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
			!ignoreKeys.includes(key) &&
			!GOOGLE_MAP_ICONS_MAP[key].icon.includes('(japan)') &&
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
					const imageUrl = getUrl(GOOGLE_MAP_ICONS_MAP[key].icon.replaceAll(' ', '-'), isSelected);

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
