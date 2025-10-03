import React, {
	forwardRef,
	ReactElement,
	Ref,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from 'react';
// @ts-ignore
import GoogleMapReact from 'google-map-react';
import MarkerClusterer from '@googlemaps/markerclustererplus';
// @ts-ignore
import * as _ from 'lodash';
import { eventStoreContext } from '../../stores/events-store';
import { flightColor, hotelColor, priorityToColor, priorityToMapColor } from '../../utils/consts';
import TranslateService from '../../services/translate-service';
import { formatDate, formatTime, getDurationString, toDate } from '../../utils/time-utils';
import { MapViewMode, TripDataSource, TriplanEventPreferredTime, TriplanPriority, ViewMode } from '../../utils/enums';
import {
	BuildEventUrl,
	getClasses,
	getEventDescription,
	getEventTitle,
	isBasketball,
	isDessert,
	isFlight,
	isHotel,
	isMatching,
	sleep,
} from '../../utils/utils';
import './map-container.scss';
import ReactModalService from '../../services/react-modal-service';
import * as ReactDOMServer from 'react-dom/server';
// @ts-ignore
import Slider from 'react-slick';
import { AllEventsEvent } from '../../services/data-handlers/data-handler-base';
import { CalendarEvent, Coordinate, LocationData, SidebarEvent, TripActions } from '../../utils/interfaces';
import { observer, Observer } from 'mobx-react';
import SelectInput from '../inputs/select-input/select-input';
import { observable, runInAction } from 'mobx';
import Button, { ButtonFlavor } from '../common/button/button';
import { LimitationsService } from '../../utils/limitations';
import FocusModeButton from '../focus-mode-button/focus-mode-button';

interface MarkerProps {
	text?: string;
	lng?: number;
	lat?: number;
	locationData: LocationData;
	openingHours: any;
	searchValue: string;
	clearSearch?: () => void;
}

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

function Marker(props: MarkerProps): ReactElement {
	const { text, lng, lat, locationData, openingHours, searchValue, clearSearch } = props;
	const eventStore = useContext(eventStoreContext);
	return (
		<div
			style={{
				cursor: 'pointer',
				display: 'flex',
				flexDirection: 'column',
				minWidth: 'fit-content',
			}}
			onClick={() => {
				ReactModalService.openAddSidebarEventModal(
					eventStore,
					undefined,
					{
						location: locationData,
						title: searchValue,
						openingHours: openingHours,
					},
					undefined,
					() => {
						if (clearSearch) clearSearch();
					},
					TripActions.addedNewSidebarEventFromMap
				);
			}}
		>
			<i className="fa fa-map-marker fa-4x text-success" />
			<div className="fa-marker-text">{props.text}</div>
		</div>
	);
}

interface MapContainerProps {
	allEvents?: AllEventsEvent[];
	events?: CalendarEvent[];
	getNameLink?: (x: AllEventsEvent) => string;
	isCombined?: boolean;
	addToEventsToCategories?: (event: SidebarEvent) => void;

	noHeader?: boolean;
	noFilters?: boolean;
	isReadOnly?: boolean;
	zoom?: number;
	isTemplate?: boolean;
	showNumbers?: boolean;
	isItineraryView?: boolean;
	hideVisibleItems?: boolean;
}

export interface MapContainerRef {
	getAllMarkers: (searchString: string) => any[];
	showEventOnMap: (eventId: number) => void;
}

function MapContainer(props: MapContainerProps, ref: Ref<MapContainerRef>) {
	const [searchValue, setSearchValue] = useState('');
	const [searchCoordinatesSearchValue, setSearchCoordinatesSearchValue] = useState(''); // keeps searchValue that matches current search coordinates
	const [searchCoordinates, setSearchCoordinates] = useState<any[]>([]);
	const [visibleItems, setVisibleItems] = useState<any[]>([]);
	const [visibleItemsSearchValue, setVisibleItemsSearchValue] = useState('');
	const [center, setCenter] = useState<Coordinate | undefined>(undefined);
	const eventStore = useContext(eventStoreContext);

	const coordinatesToEvents: Record<string, AllEventsEvent> = {};
	const texts: Record<string, string> = {};

	// let googleRef: any, googleMapRef: any, infoWindow: any;
	let [googleMapRef, setGoogleMapRef] = useState<any>(undefined);
	let [googleRef, setGoogleRef] = useState<any>(undefined);
	let [infoWindow, setinfoWindow] = useState<any>(undefined);

	let searchMarkers: ReactElement[] = [];
	let markerCluster;
	let markers: any[] = [];

	const getKey = (x: Coordinate) => x.lat + ',' + x.lng;

	const locations = (props.events || props.allEvents || eventStore.allEventsFilteredComputed)
		.filter((x) => x.location && x.location.latitude && x.location.longitude)
		.map((x) => ({
			event: x,
			label: getEventTitle(x as CalendarEvent, eventStore, true),
			lat: x.location?.latitude,
			lng: x.location?.longitude,
		}));
	locations.forEach((x) => {
		const coordinate: Coordinate = { lat: x.lat!, lng: x.lng! };
		texts[getKey(coordinate)] = x.label;
		coordinatesToEvents[getKey(coordinate)] = x.event;
	});

	// @ts-ignore
	const coordinates = _.uniq(locations.map((x) => getKey(x))).map((x) => ({
		lat: Number(x.split(',')[0]),
		lng: Number(x.split(',')[1]),
	}));

	// @ts-ignore
	window.selectedSearchLocation = undefined;

	// --- side effects -----------------------------------------------------------------
	useEffect(() => {
		if (document.getElementById('marker-cluster')) return; // todo check
		const script = document.createElement('script');
		script.id = 'marker-cluster';
		script.src =
			'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js';
		script.async = true;
		document.body.appendChild(script);
	}, []);

	useEffect(() => {
		if (searchValue === '') {
			clearSearch();
		}
	}, [searchValue]);

	// --- functions --------------------------------------------------------------------
	const addressPrefix = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.ADDRESS');
	const descriptionPrefix = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.DESCRIPTION');
	const scheduledToPrefix = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.SCHEDULED_TO');
	const preferredHoursPrefix = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.PREFERRED_HOURS');
	const categoryPrefix = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.CATEGORY');
	const iStyle = 'min-width: 13px; text-align: center;';
	const rowContainerStyle = 'display: flex; flex-direction: row; align-items: center; gap: 10px;';

	const buildInfoWindowContent = (event: any) => {
		const title = `<div style="font-size:20px; margin-inline-end: 5px;" class='map-info-window-title'><b><u>${getEventTitle(
			event,
			eventStore,
			props.isTemplate
		)}</u></b></div>`;
		const addressText = getEventTitle(
			{ title: event.location.address } as unknown as CalendarEvent,
			eventStore,
			true
		);
		const address = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-map-marker" aria-hidden="true"></i><span> ${addressPrefix}: ${addressText}</span></span>`;

		const description = event.description?.trim()?.length
			? `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-info" aria-hidden="true"></i> <span>${descriptionPrefix}: ${getEventDescription(
					event,
					eventStore,
					props.isTemplate
			  )}</span></span>`
			: '';

		let scheduledTo = '';
		if (!props.allEvents) {
			const calendarEvent = eventStore.calendarEvents.find((x) => x.id === event.id);

			scheduledTo = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.SCHEDULED_TO.UNSCHEDULED');
			if (calendarEvent) {
				const dtStart = toDate(calendarEvent.start);
				const dtEnd = toDate(calendarEvent.end);
				const dt = formatDate(dtStart);
				const startTime = dtStart?.toLocaleTimeString('en-US', { hour12: false });
				const endTime = dtEnd?.toLocaleTimeString('en-US', { hour12: false });
				const start = formatTime(startTime);
				const end = formatTime(endTime);

				scheduledTo = `${dt} ${end}-${start} (${getDurationString(eventStore, calendarEvent.duration)})`;
			}

			scheduledTo = `<span style='${rowContainerStyle}'><i style='${iStyle}' class='fa fa-calendar' aria-hidden='true'></i> <span>${scheduledToPrefix}: ${scheduledTo}</span></span>`;
		}

		let category = event.category;
		// if (!props.allEvents) {
		if (!Number.isNaN(Number(event.category))) {
			category = eventStore.categories.find((x) => x.id.toString() === category.toString())?.title;
		}
		const categoryBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-tag" aria-hidden="true"></i> <span>${categoryPrefix}: ${category}</span></span>`;

		let preferredTime = event.preferredTime;

		if (preferredTime) {
			preferredTime = TriplanEventPreferredTime[preferredTime];
		} else {
			preferredTime = TriplanEventPreferredTime[TriplanEventPreferredTime.unset];
		}

		if (preferredTime == 'unset' && eventStore.isHebrew) {
			preferredTime = 'unset.male';
		}

		const preferredHoursBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-clock-o" aria-hidden="true"></i> <span>${preferredHoursPrefix}: ${TranslateService.translate(
			eventStore,
			preferredTime
		)}</span></span>`;

		// const lat = event.location.latitude.toFixed(7);
		// const lng = event.location.longitude.toFixed(7);
		// const url = `https://maps.google.com/maps?q=${lat},${lng}`;
		const url = BuildEventUrl(event.location);
		const urlBlock = `<span><a href="${url}" target="_blank">${TranslateService.translate(
			eventStore,
			'VIEW_ON_GOOGLE_MAPS'
		)}</a></span>`;

		const moreInfoUrl = event.moreInfo;
		const moreInfoBlock = moreInfoUrl
			? `<span><a href="${moreInfoUrl}" target="_blank">${TranslateService.translate(
					eventStore,
					'MORE_INFO'
			  )}</a></span>`
			: '';

		let images = event.images;
		const sliderSettings = {
			dots: true,
			infinite: true,
			speed: 500,
			slidesToShow: 1,
			slidesToScroll: 1,
			width: 300,
		};
		const ImageSliderBlock = () => {
			if (!images) return null;
			if (typeof images === 'string') {
				images = images.split('\n').map((image) => image.trim());
			}
			return (
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
			);
		};

		function renderJavascriptImageSlider() {
			if (!images) return null;
			if (typeof images === 'string') {
				images = images
					.split('\n')
					.map((image) => image.trim())
					.filter((image) => image !== '');
			}

			if (!images.length) {
				return null;
			}

			return ReactDOMServer.renderToString(
				<div className="js-image-slider">
					<ul>
						{images.slice(0, 3).map((image: string, idx: number) => (
							<li>
								<img src={image} alt={`#${idx + 1}/${images.length}`} />
							</li>
						))}
					</ul>
					{images.length > 3 && <span>+{images.length - 3}</span>}
				</div>
			);
		}

		const nameLink = props.getNameLink ? props.getNameLink(event) : undefined;
		const titleBlock = nameLink ? `<a href="${nameLink}" target='_blank'>${title}</a>` : title;

		return `<div style="display: flex; flex-direction: column; gap: 6px; max-width: 450px; padding: 10px;">
                                ${titleBlock}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${images?.length ? renderJavascriptImageSlider() : ''}
								${images?.length ? '<hr style="height: 1px; width: 100%;margin-block: 3px;" />' : ''}
                                ${address}
                                ${categoryBlock}
                                ${description}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${scheduledTo}
                                ${preferredHoursBlock}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${urlBlock}
                                ${moreInfoBlock}
                             </div>`;
	};

	const initMarkers = (map = googleMapRef) => {
		const getIconUrl = (event: any) => {
			let icon = '';
			let bgColor = priorityToMapColor[event.priority || TriplanPriority.unset].replace('#', '');
			let category: string = props.allEvents
				? event.category
				: eventStore.categories.find((x) => x.id.toString() === event.category?.toString())?.title;

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

			if (isMatching(category, ['golf', 'גולף'])) {
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
			} else if (isMatching(category, FOOD_KEYWORDS) || isMatching(title, FOOD_KEYWORDS)) {
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
			} else if (
				isMatching(category, ['beach', 'beaches', 'beach club', 'beach bar', 'חופים', 'ביץ׳ באר', 'ביץ׳ בר'])
			) {
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
			} else if (icon === '') {
				// return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
				return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
			}
			return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
		};

		const getIconUrlByIdx = (event: any, idx: number) => {
			const bgColor = priorityToMapColor[event.priority || TriplanPriority.unset].replace('#', '');
			return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1738-blank-sequence_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0&color=ffffffff&psize=15&text=${idx}`;
		};

		const icon = {
			url: 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1577-food-fork-knife_4x.png&highlight=ff000000,FF5252,ff000000&scale=2.0',
			scaledSize: new googleRef.Size(30, 30),
			fillColor: '#F00',
			fillOpacity: 0.7,
			strokeWeight: 0.4,
			strokeColor: '#ffffff',
		};

		const initMarkerFromCoordinate = (coordinate: Coordinate) => {
			const key = getKey(coordinate);
			const event = coordinatesToEvents[key];

			// marker + marker when hovering
			if (eventStore.mapViewMode === MapViewMode.CHRONOLOGICAL_ORDER && eventStore.mapViewDayFilter) {
				// by day and index in day
				const idx = eventStore.getEventIndexInCalendarByDay(event as CalendarEvent);
				icon.url = getIconUrlByIdx(event, idx + 1);
			} else if (props.isItineraryView) {
				// by day and index in day
				const idx = props.events.findIndex((e) => e.id == event.id);
				icon.url = getIconUrlByIdx(event, idx + 1);
			} else {
				icon.url = getIconUrl(event);
			}

			// Check if event is scheduled
			const isScheduled = !props.allEvents && eventStore.calendarEvents.find((x) => x.id === event.id);

			const markerIcon = { ...icon, fillColor: priorityToColor[event.priority!] };
			const markerIconWithBorder = {
				...markerIcon,
				strokeColor: 'red', // '#ffffff',
				strokeOpacity: 0.6,
				strokeWeight: 8,
			};

			// set marker
			const refMarker = new googleRef.Marker({
				position: { lat: coordinate.lat, lng: coordinate.lng },
				label: {
					text: `${isScheduled ? '✓ ' : ''}${texts[key]}`,
					color: '#c0bbbb',
					fontSize: '10px',
					fontWeight: 'bold',
					className: 'marker-label',
				},
				title: texts[key],
				icon: isScheduled ? markerIconWithBorder : markerIcon,
			});

			// for visible items to be able to get more info about this marker
			refMarker.eventId = event.id;
			refMarker.latitude = coordinate.lat;
			refMarker.longitude = coordinate.lng;

			// on click event
			googleRef.event.addListener(
				refMarker,
				'click',
				(function () {
					return function () {
						infoWindow.setContent(buildInfoWindowContent(event));
						infoWindow.open(map, refMarker);
					};
				})()
			);

			// hover & leave events
			googleRef.event.addListener(
				refMarker,
				'mouseover',
				(function () {
					return function () {
						refMarker.setIcon(markerIconWithBorder);
					};
				})()
			);
			googleRef.event.addListener(
				refMarker,
				'mouseout',
				(function () {
					return function () {
						refMarker.setIcon(markerIcon);
					};
				})()
			);

			// visible items change event
			// Fired when the map becomes idle after panning or zooming.
			googleRef.event.addListener(map, 'idle', function () {
				updateVisibleMarkers();
			});

			return refMarker;
		};
		markers = coordinates && coordinates.map((coordinate: Coordinate) => initMarkerFromCoordinate(coordinate));

		if (eventStore.showEventOnMap) {
			const eventId: number = eventStore.showEventOnMap!;
			eventStore.showEventOnMap = null;
			setTimeout(() => {
				showEventOnMap(eventId);
			}, 1500);
		}
	};

	const initMap = (map: any, maps: any) => {
		googleMapRef = map;
		googleRef = maps;
		infoWindow = new googleRef.InfoWindow();

		setGoogleMapRef(map);
		setGoogleRef(maps);
		setinfoWindow(new googleRef.InfoWindow());

		initMarkers(map);

		googleRef.event.addListener(map, 'click', function (_event: any) {
			infoWindow.close();
		});

		markerCluster = new MarkerClusterer(map, [...markers, ...searchMarkers], {
			imagePath: '/images/marker_images/m',
			minimumClusterSize: 10,
		});
	};

	const initSearchResultMarker = useMemo(() => {
		return () => {
			// @ts-ignore
			const selectedSearchLocation = window.selectedSearchLocation;
			searchMarkers = [];
			// @ts-ignore
			if (window.selectedSearchLocation) {
				const coordinate: any = {
					lat: selectedSearchLocation.latitude,
					lng: selectedSearchLocation.longitude,
					address: selectedSearchLocation.address,
					// @ts-ignore
					openingHours: window.openingHours,
				};

				searchMarkers = [coordinate];
			}

			setSearchCoordinatesSearchValue(searchValue);
			setSearchCoordinates(searchMarkers);
			return;
		};
	}, [googleRef, googleMapRef]);

	const onVisibleItemClick = useMemo(() => {
		return (event: any, marker: any) => {
			if (googleMapRef && infoWindow) {
				const coordinates = event.location;

				setCenter({ lat: coordinates.latitude, lng: coordinates.longitude });

				infoWindow.setContent(buildInfoWindowContent(event));
				if (marker) infoWindow.open(googleMapRef, marker);
				// else {
				// 	setTimeout(() => {
				// 		initMarkers();
				// 		marker = markers.find((x) => x.eventId == event.id);
				// 		if (marker) infoWindow.open(googleMapRef, marker);
				// 	}, 1000);
				// }
			}
		};
	}, [googleMapRef, infoWindow, markers]);

	const getOptions = () => {
		const noDefaultMarkers = {
			featureType: 'poi',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }],
		};

		const moMountainMarkers = {
			featureType: 'landscape',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }],
		};

		const noRoadLabels = {
			featureType: 'road',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }],
		};

		const darkModeStyles = [
			{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
			{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
			{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
			{
				featureType: 'administrative.locality',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'poi',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'poi.park',
				elementType: 'geometry',
				stylers: [{ color: '#263c3f' }],
			},
			{
				featureType: 'poi.park',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#6b9a76' }],
			},
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{ color: '#38414e' }],
			},
			{
				featureType: 'road',
				elementType: 'geometry.stroke',
				stylers: [{ color: '#212a37' }],
			},
			{
				featureType: 'road',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#9ca5b3' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{ color: '#746855' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [{ color: '#1f2835' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#f3d19c' }],
			},
			{
				featureType: 'transit',
				elementType: 'geometry',
				stylers: [{ color: '#2f3948' }],
			},
			{
				featureType: 'transit.station',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{ color: '#17263c' }],
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#515c6d' }],
			},
			{
				featureType: 'water',
				elementType: 'labels.text.stroke',
				stylers: [{ color: '#17263c' }],
			},
		];

		const lightModeStyles = [
			{ elementType: 'geometry', stylers: [{ color: '#f0eded' }] },
			{ elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
			{ elementType: 'labels.text.fill', stylers: [{ color: '#b9b3b3' }] },
			{
				featureType: 'administrative.locality',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#b9b3b3' }],
			},
			// {
			//     featureType: "poi",
			//     elementType: "labels.text.fill",
			//     stylers: [{ color: "#ff9800" }],
			// },
			// {
			//     featureType: "poi.park",
			//     elementType: "geometry",
			//     stylers: [{ color: "#f2e1e0" }],
			// },
			// {
			//     featureType: "poi.park",
			//     elementType: "labels.text.fill",
			//     stylers: [{ color: "#5eff00" }],
			// },
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{ color: '#ffffff' }],
			},
			{
				featureType: 'road',
				elementType: 'geometry.stroke',
				stylers: [{ color: '#ffffff' }],
			},
			{
				featureType: 'road',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{ color: '#ffffff' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [{ color: '#ffffff' }],
			},
			{
				featureType: 'road.highway',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'transit',
				elementType: 'geometry',
				stylers: [{ color: '#f2e1e0' }],
			},
			{
				featureType: 'transit.station',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#d59563' }],
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{ color: '#e1dfd3' }],
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{ color: '#5f5757' }],
			},
			{
				featureType: 'water',
				elementType: 'labels.text.stroke',
				stylers: [{ color: '#ffffff' }],
			},
		];

		return {
			styles: [
				...lightModeStyles,
				// ...darkModeStyles,
				moMountainMarkers,
				noDefaultMarkers,
				noRoadLabels,
			],
		};
	};

	const resolveCategoryTitle = (event: any) => {
		let category: string = props.allEvents
			? event.category
			: eventStore.categories.find((x) => x.id.toString() === event.category?.toString())?.title;
		category = category ? category.toString() : '';
		return category;
	};

	const computeIconUrlAndColor = (event: any) => {
		let icon = '';
		let bgColor = priorityToMapColor[event.priority || TriplanPriority.unset].replace('#', '');
		let category: string = resolveCategoryTitle(event).toLowerCase();
		const title = (event.title || '').toString().toLowerCase();

		const iconsMap: Record<string, string> = {
			basketball: 'icons/onion/1520-basketball_4x.png',
			food: 'icons/onion/1577-food-fork-knife_4x.png',
			photos: 'icons/onion/1535-camera-photo_4x.png',
			attractions: 'icons/onion/1502-shape_star_4x.png',
			beach: 'icons/onion/1521-beach_4x.png',
			nightlife: 'icons/onion/1517-bar-cocktail_4x.png',
			hotel: 'icons/onion/1602-hotel-bed_4x.png',
			shopping: 'icons/onion/1684-shopping-bag_4x.png',
			tourism: 'icons/onion/1548-civic_4x.png',
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

		if (isMatching(category, ['golf', 'גולף'])) {
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
		} else if (isMatching(category, FOOD_KEYWORDS) || isMatching(title, FOOD_KEYWORDS)) {
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
		} else if (
			isMatching(category, ['beach', 'beaches', 'beach club', 'beach bar', 'חופים', 'ביץ׳ באר', 'ביץ׳ בר'])
		) {
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
		}

		const iconUrl =
			icon === ''
				? `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`
				: `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;

		return { iconUrl, color: `#${bgColor}` };
	};

	const downloadFile = (filename: string, mimeType: string, content: string) => {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	};

	const xmlEscape = (value: string) => {
		if (value == null) return '';
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	};

	const exportAllMarkersAsKml = () => {
		const allEvents = (props.allEvents ?? eventStore.allEventsComputed).filter(
			(x) => x.location && x.location.latitude && x.location.longitude
		);

		// Group by category
		const byCategory: Record<string, any[]> = {};
		allEvents.forEach((ev: any) => {
			const cat = resolveCategoryTitle(ev) || 'Uncategorized';
			byCategory[cat] = byCategory[cat] || [];
			byCategory[cat].push(ev);
		});

		let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>Triplan Export</name>`;

		// Create styles per category (using first item's icon)
		Object.keys(byCategory).forEach((cat) => {
			const sample = byCategory[cat][0];
			const { iconUrl } = computeIconUrlAndColor(sample);
			const styleId = `style_${cat.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
			kml += `\n<Style id="${styleId}">\n  <IconStyle>\n    <scale>1.0<\/scale>\n    <Icon>\n      <href>${xmlEscape(
				iconUrl
			)}<\/href>\n    <\/Icon>\n  <\/IconStyle>\n<\/Style>`;
		});

		Object.keys(byCategory).forEach((cat) => {
			const styleId = `style_${cat.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
			kml += `\n<Folder>\n<name>${xmlEscape(cat)}</name>`;
			byCategory[cat].forEach((ev: any) => {
				const name = xmlEscape(
					getEventTitle({ title: ev.title } as unknown as CalendarEvent, eventStore, true)
				);
				const descParts = [] as string[];
				if (ev.description) descParts.push(ev.description);
				if (ev.moreInfo) descParts.push(`<a href="${ev.moreInfo}" target="_blank">More info<\/a>`);
				if (ev.location?.address) descParts.push(ev.location.address);
				const description = descParts.join('<br/>');
				const lng = ev.location.longitude;
				const lat = ev.location.latitude;
				kml += `\n  <Placemark>\n    <name>${name}<\/name>\n    <styleUrl>#${styleId}<\/styleUrl>\n    <description><![CDATA[${description}]]><\/description>\n    <Point><coordinates>${lng},${lat},0<\/coordinates><\/Point>\n  <\/Placemark>`;
			});
			kml += `\n<\/Folder>`;
		});

		kml += `\n<\/Document>\n<\/kml>`;
		downloadFile('triplan-export.kml', 'application/vnd.google-earth.kml+xml', kml);
	};

	const getAllMarkers = (searchValue: string) => {
		const visibleItems = [];

		const allEvents = (props.allEvents ?? eventStore.allEventsComputed).filter(
			(x) =>
				x.title.toLowerCase().includes(searchValue.toLowerCase()) &&
				x.location &&
				x.location.latitude &&
				x.location.longitude
		);
		for (let i = 0; i < allEvents.length; i++) {
			const event = allEvents[i];
			// const marker = markers.find((x: any) => event.id.toString() === x.eventId.toString());
			const marker = markers.find(
				(x: any) =>
					event.location && event.location.longitude === x.longitude && event.location.latitude == x.latitude
			);
			visibleItems.push({ event, marker });
		}
		return visibleItems.sort((a, b) => (a.event.title > b.event.title ? 1 : -1));
	};

	// make our ref know our functions, so we can use them outside.
	useImperativeHandle(ref, () => ({
		getAllMarkers: getAllMarkers,
		showEventOnMap: showEventOnMap,
	}));

	const showEventOnMap = async (eventId: number) => {
		const allMarkers = getAllMarkers('');
		const found = allMarkers.find((m: any) => Number(m.event.id) == eventId);
		if (found) {
			setCenter({ lat: found.event.location.latitude, lng: found.event.location.longitude });
			onVisibleItemClick(found.event, found.marker);
		}
	};

	const updateVisibleMarkers = () => {
		if (visibleItemsSearchValue) return;

		const bounds = googleMapRef.getBounds();
		let count = 0;
		let visibleItems = [];

		for (var i = 0; i < markers.length; i++) {
			const marker = markers[i];
			if (bounds.contains(marker.getPosition()) === true) {
				const event = (props.allEvents ?? eventStore.allEventsFilteredComputed).find(
					(x) => x.id.toString() === marker.eventId.toString()
				);
				if (event) {
					visibleItems.push({ event, marker });
					count++;
				} else {
					console.error(`event with id ${marker.eventId} not found`);
				}
			}
		}

		visibleItems = visibleItems.sort((a, b) => (a.event.title > b.event.title ? 1 : -1));

		setVisibleItems(visibleItems);
	};

	// --- render -----------------------------------------------------------------------

	let filteredVisibleItems = visibleItemsSearchValue
		? getAllMarkers(visibleItemsSearchValue)
		: visibleItems.sort((a, b) => {
				const priority1 = Number(a.event.priority) === 0 ? 999 : a.event.priority;
				const priority2 = Number(b.event.priority) === 0 ? 999 : b.event.priority;
				return priority1 - priority2;
		  });

	function renderMapFilters() {
		const allOption = { label: TranslateService.translate(eventStore, 'ALL'), value: '' };
		const priorities = Object.keys(TriplanPriority).filter((priority) => Number.isNaN(Number(priority)));
		const otherOptions = priorities.map((p) => ({ label: TranslateService.translate(eventStore, p), value: p }));

		function renderScheduledOrNotFilters() {
			return (
				<div className="flex-row gap-5 align-items-center map-scheduled-or-not">
					<span>{TranslateService.translate(eventStore, 'SHOW_ONLY')}</span>
					<Observer>
						{() => (
							<a
								className={getClasses('map-filter-toggle', !eventStore.hideScheduled && 'active')}
								onClick={() => {
									runInAction(() => {
										eventStore.hideScheduled = !eventStore.hideScheduled;
									});
								}}
							>
								{TranslateService.translate(
									eventStore,
									eventStore.isMobile ? 'SCHEDULED_EVENTS.SHORT' : 'SCHEDULED_EVENTS'
								)}
							</a>
						)}
					</Observer>
					<span>|</span>
					<Observer>
						{() => (
							<a
								className={getClasses('map-filter-toggle', !eventStore.hideUnScheduled && 'active')}
								onClick={() => {
									runInAction(() => {
										eventStore.hideUnScheduled = !eventStore.hideUnScheduled;
									});
								}}
							>
								{TranslateService.translate(
									eventStore,
									eventStore.isMobile ? 'UNSCHEDULED_EVENTS.SHORT' : 'UNSCHEDULED_EVENTS'
								)}
							</a>
						)}
					</Observer>
				</div>
			);
		}

		function renderPrioritiesFilters() {
			return (
				<div className="flex-row gap-5 align-items-center map-priorities-filter">
					<span>{TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_PRIORITY')}</span>
					{eventStore.isMobile && (
						<SelectInput
							ref={undefined}
							id="map-filter-priorities"
							name="map-filter-priorities"
							options={[allOption, ...otherOptions]}
							value={
								Array.from(eventStore.filterOutPriorities.values()).length == 0
									? allOption
									: otherOptions.find(
											(o) =>
												o.value ===
												priorities.find((p) => !eventStore.filterOutPriorities.get(p))
									  )
							}
							onChange={(data: any) => {
								runInAction(() => {
									eventStore.filterOutPriorities = observable.map({});
									if (data.value != '') {
										priorities
											.filter((x) => x !== data.value)
											.map((x) => {
												eventStore.filterOutPriorities.set(x, true);
											});
									}
								});
							}}
							modalValueName="filterByPriority"
							maxMenuHeight={120}
							removeDefaultClass={true}
							isClearable={false}
						/>
					)}
					{!eventStore.isMobile && (
						<div className="map-filter-priorities">
							{priorities.map((priority, idx) => {
								return (
									<div className="flex-row gap-5" key={`filter-by-priority-${priority}`}>
										<Observer>
											{() => (
												<a
													className={getClasses(
														'map-filter-toggle',
														!eventStore.filterOutPriorities.get(priority) && 'active'
													)}
													onClick={() => {
														eventStore.toggleFilterPriority(priority);
													}}
												>
													{TranslateService.translate(eventStore, priority)}
												</a>
											)}
										</Observer>
										{idx !== priorities.length - 1 && <span>|</span>}
									</div>
								);
							})}
						</div>
					)}
				</div>
			);
		}

		function renderMapViewSelection() {
			const SEPARATOR = '---';
			const options: { label: string; value: string }[] = [
				{
					label: TranslateService.translate(eventStore, 'BY_CATEGORIES_AND_PRIORITIES'),
					value: MapViewMode.CATEGORIES_AND_PRIORITIES,
				},
				...eventStore.scheduledDaysNames
					.map((dayName) => ({
						label: TranslateService.translate(eventStore, 'CHRONOLOGICAL_ORDER', {
							X: dayName,
						}),
						value: `${MapViewMode.CHRONOLOGICAL_ORDER}${SEPARATOR}${dayName}`,
					}))
					.reverse(),
			];
			return (
				<div className="flex-row gap-5 align-items-center map-view-selection">
					<span>{TranslateService.translate(eventStore, 'SHOW_MAP_ACTIVITIES_BY')}</span>
					<SelectInput
						ref={undefined}
						id="map-view-mode"
						name="map-view-mode"
						options={options}
						value={
							options.find((o) => o.value === eventStore.mapViewMode) ??
							options.find(
								(o) => o.value === `${eventStore.mapViewMode}${SEPARATOR}${eventStore.mapViewDayFilter}`
							)
						}
						onChange={(data: any) => {
							runInAction(() => {
								if (data.value == MapViewMode.CATEGORIES_AND_PRIORITIES) {
									eventStore.mapViewMode = data.value;
								} else {
									const parts = data.value.split(SEPARATOR);
									eventStore.mapViewMode = parts[0];
									eventStore.mapViewDayFilter = parts[1];
								}
							});
						}}
						modalValueName="mapViewModeSelector"
						maxMenuHeight={eventStore.viewMode === ViewMode.combined ? 210 : 45 * 6}
						removeDefaultClass={true}
						isClearable={false}
					/>
				</div>
			);
		}

		function renderCalculateDistancesButton() {
			if (
				eventStore.dataService.getDataSourceName() == TripDataSource.LOCAL ||
				eventStore.allEventsLocationsWithDuplicates.length < 2
			) {
				return;
			}

			// disable distance for other users for now.
			if (!LimitationsService.distanceLimitations()) {
				return;
			}

			return (
				<Button
					flavor={ButtonFlavor.secondary}
					text={TranslateService.translate(eventStore, 'CALCULATE_DISTANCE')}
					onClick={() => ReactModalService.openCalculateDistancesModal(eventStore)}
					className="calculate-distances-button brown"
					disabled={eventStore.isTripLocked}
					disabledReason={
						eventStore.isTripLocked ? TranslateService.translate(eventStore, 'TRIP_IS_LOCKED') : undefined
					}
					icon={eventStore.isTripLocked ? 'fa-lock' : undefined}
				/>
			);
		}

		function renderExportToGoogleMapsButton() {
			return (
				<Button
					text={TranslateService.translate(eventStore, 'EXPORT_MAP_TO_GOOGLE_MAPS')}
					onClick={exportAllMarkersAsKml}
					className="brown"
					flavor={ButtonFlavor.secondary}
					icon="fa-location-arrow"
				/>
			);
		}

		function renderFilterButton() {
			return (
				<Button
					text=""
					onClick={() => eventStore.toggleMapFilters()}
					className={getClasses('min-width-38', !eventStore.mapFiltersVisible && 'brown')}
					flavor={ButtonFlavor.secondary}
					icon="fa-filter"
				/>
			);
		}

		return (
			<div>
				<div
					className={getClasses(
						'map-filters-container',
						!eventStore.isMobile && 'gap-8 justify-content-start'
					)}
				>
					{renderFilterButton()}
					{renderCalculateDistancesButton()}
					{!eventStore.isMobile && <FocusModeButton />}
					{!eventStore.isMobile && renderExportToGoogleMapsButton()}
					{!eventStore.isMobile && (
						<div className="pc-map-view-selection-container">{renderMapViewSelection()}</div>
					)}
				</div>
				{eventStore.mapFiltersVisible ? (
					<div className="flex-col actual-filters-container">
						<hr className="margin-block-2" />
						<div
							className={getClasses(
								'map-filters-container actual-filters',
								eventStore.isMobile && 'justify-content-center flex-column'
							)}
						>
							<div className="flex-row gap-16 flex-1-1-0 flex-wrap-reverse justify-content-center">
								{renderPrioritiesFilters()}
								{renderScheduledOrNotFilters()}
								{eventStore.isMobile && renderMapViewSelection()}
							</div>
						</div>
						<hr className="margin-block-2" />
					</div>
				) : null}
			</div>
		);
	}

	function clearSearch() {
		setSearchValue('');
		// @ts-ignore
		window.selectedSearchLocation = undefined;
		initSearchResultMarker();
	}

	function clearSearchOnEscape(e: any) {
		if (e.key === 'Escape') {
			clearSearch();
		}
	}

	useEffect(() => {
		document.addEventListener('keydown', clearSearchOnEscape);

		return () => {
			document.removeEventListener('keydown', clearSearchOnEscape);
		};
	}, []);

	function renderVisibleItemsPane() {
		// todo remove: try to fix the fact that if the same day have the same location twice, we see '1', '2', '4'.
		if (props.hideVisibleItems) return null;
		return (
			<div
				className={getClasses(
					'visible-items-pane',
					'bright-scrollbar',
					eventStore.isMobile && 'mobile',
					props.isCombined && 'combined'
				)}
			>
				<div className="search-container">
					<input
						type="text"
						name="fc-search"
						value={visibleItemsSearchValue}
						onChange={(e) => {
							setVisibleItemsSearchValue(e.target.value);
						}}
						placeholder={TranslateService.translate(eventStore, 'MAP_SEARCH_PLACEHOLDER')}
					/>
				</div>
				<div className="visible-items-header">
					<b>
						{TranslateService.translate(
							eventStore,
							visibleItemsSearchValue ? 'SEARCH_RESULTS' : 'MAP.VISIBLE_ITEMS.TITLE'
						)}
						:
					</b>
				</div>
				<div className="visible-items-fc-events bright-scrollbar">
					{!visibleItemsSearchValue &&
						visibleItems.length === 0 &&
						TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.NO_ITEMS')}
					{visibleItems.length > 0 &&
						filteredVisibleItems.length === 0 &&
						TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.NO_SEARCH_RESULTS')}
					{filteredVisibleItems
						.map((info) => {
							const calendarEvent = eventStore.calendarEvents.find((c) => c.id === info.event.id);

							// TODO - if it's an OR activity (two activities on the exact same time, both of them should be encountered on the same time.

							let idxInDay = -1;
							if (
								eventStore.mapViewMode === MapViewMode.CHRONOLOGICAL_ORDER &&
								eventStore.mapViewDayFilter
							) {
								idxInDay = calendarEvent
									? eventStore.getEventIndexInCalendarByDay(calendarEvent)
									: 99999999;
							}

							return {
								info,
								calendarEvent,
								idxInDay,
							};
						})
						.sort((a, b) => a.idxInDay - b.idxInDay)
						.map(({ info, idxInDay, calendarEvent }, idx) => {
							let addToCalendar = undefined;
							if (props.addToEventsToCategories) {
								addToCalendar = (
									<i
										className="fa fa-calendar-times-o visible-items-calendar-indicator"
										aria-hidden="true"
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											ReactModalService.openAddCalendarEventNewModal(
												eventStore,
												props.addToEventsToCategories,
												{
													...info.event,
													extendedProps: {
														...info.event,
													},
												},
												info.event
											);
										}}
										title={
											props.isReadOnly
												? undefined
												: TranslateService.translate(
														eventStore,
														'CLICK_HERE_TO_ADD_TO_CALENDAR'
												  )
										}
									/>
								);

								if (calendarEvent) {
									addToCalendar = (
										<i
											className="fa fa-calendar-check-o visible-items-calendar-indicator"
											aria-hidden="true"
											title={
												props.isReadOnly
													? undefined
													: TranslateService.translate(eventStore, 'ALREADY_IN_CALENDAR')
											}
										/>
									);
								}
							}

							return (
								<div
									key={`filtered-visible-item-${idx}`}
									className={`fc-event priority-${info.event.priority}`}
									onClick={() => {
										if (props.isReadOnly) {
											return;
										}
										onVisibleItemClick(info.event, info.marker);
									}}
								>
									{addToCalendar}
									{((eventStore.mapViewMode === MapViewMode.CHRONOLOGICAL_ORDER &&
										eventStore.mapViewDayFilter) ||
										props.isItineraryView) &&
									idxInDay != undefined &&
									idxInDay >= 0 &&
									visibleItemsSearchValue === '' ? (
										<>
											{idxInDay + 1}
											{' - '}
										</>
									) : undefined}
									{getEventTitle(
										{ title: info.event.title } as unknown as CalendarEvent,
										eventStore,
										true
									)}
								</div>
							);
						})}
				</div>
			</div>
		);
	}

	function renderNoItemsOnMapPlaceholder() {
		return (
			<div className="no-items-on-map-placeholder">
				<img className="no-items-on-map-placeholder-image" src="/images/arrow-up-placeholder.png" />
				<div className="no-items-on-map-placeholder-title main-font-heavy">
					{TranslateService.translate(eventStore, 'NO_ITEMS_ON_MAP_PLACEHOLDER.TITLE')}
				</div>
				<div className="no-items-on-map-placeholder-content-bold">
					{TranslateService.translate(eventStore, 'NO_ITEMS_ON_MAP_PLACEHOLDER.CONTENT.1')}
				</div>
				<div className="no-items-on-map-placeholder-content">
					{TranslateService.translate(eventStore, 'NO_ITEMS_ON_MAP_PLACEHOLDER.CONTENT.2')}
				</div>
			</div>
		);
	}

	function renderMapHeader() {
		return (
			<div className="map-header">
				<div
					className={getClasses(
						'map-search-location-input',
						locations.length == 0 && searchValue.length == 0 && 'with-blink-animation'
					)}
				>
					<input
						type="text"
						className={getClasses(
							'map-header-location-input-search',
							eventStore.isTripLocked && 'display-none'
						)}
						onClick={() =>
							// @ts-ignore
							window.initLocationPicker(
								'map-header-location-input-search',
								'selectedSearchLocation',
								initSearchResultMarker,
								eventStore
							)
						}
						onKeyUp={() =>
							// @ts-ignore
							window.setManualLocation('map-header-location-input-search', 'selectedSearchLocation')
						}
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
						autoComplete="off"
						placeholder={TranslateService.translate(
							eventStore,
							eventStore.isMobile ? 'MAP_VIEW.SEARCH.PLACEHOLDER.SHORT' : 'MAP_VIEW.SEARCH.PLACEHOLDER'
						)}
					/>
					<div className={getClasses('clear-search', searchCoordinates.length === 0 && 'hidden')}>
						<a onClick={clearSearch}>x</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={getClasses(
				'map-container',
				props.isCombined && 'combined',
				eventStore.isMobile && 'resize-none'
			)}
		>
			{!props.noFilters && locations.length > 0 && renderMapFilters()}
			{!props.noHeader && renderMapHeader()}
			<div className="google-map-react position-relative" style={{ height: '100%', width: '100%' }}>
				{locations.length == 0 &&
					!(eventStore.mapViewMode === MapViewMode.CHRONOLOGICAL_ORDER) &&
					!(eventStore.viewMode == ViewMode.itinerary) &&
					renderNoItemsOnMapPlaceholder()}
				<GoogleMapReact
					bootstrapURLKeys={{
						key: 'AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo',
					}} /* AIzaSyA16d9FJFh__vK04jU1P64vnEpPc3jenec */
					center={
						searchCoordinates.length > 0
							? searchCoordinates[0]
							: center
							? center
							: coordinates.length > 0
							? { lat: coordinates[0].lat, lng: coordinates[0].lng }
							: undefined
					}
					zoom={props.zoom ?? (searchCoordinates.length > 0 || center ? 14 : 7)}
					yesIWantToUseGoogleMapApiInternals
					// @ts-ignore
					onGoogleApiLoaded={({ map, maps }) => initMap(map, maps)}
					clickableIcons={false}
					options={getOptions()}
				>
					{searchCoordinates.map((place, index) => (
						<Marker
							key={index}
							locationData={
								[{ ...place }].map((x) => {
									x.longitude = x.lng;
									x.latitude = x.lat;
									delete x.lng;
									delete x.lat;
									return x;
								})[0]
							}
							clearSearch={clearSearch}
							text={place.address}
							lat={place.lat}
							lng={place.lng}
							searchValue={searchCoordinatesSearchValue}
							openingHours={place.openingHours}
						/>
					))}
				</GoogleMapReact>
				{!eventStore.isMobile && locations.length > 0 && renderVisibleItemsPane()}
			</div>
			{eventStore.isMobile && locations.length > 0 && renderVisibleItemsPane()}
		</div>
	);
}

export default observer(forwardRef<MapContainerRef, MapContainerProps>(MapContainer));
