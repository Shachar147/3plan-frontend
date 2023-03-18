import React, { ReactElement } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
// @ts-ignore
import GoogleMapReact from 'google-map-react';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import * as _ from 'lodash';
import { eventStoreContext } from '../../stores/events-store';
import { flightColor, hotelColor, priorityToColor, priorityToMapColor } from '../../utils/consts';
import TranslateService from '../../services/translate-service';
import { formatDate, formatTime, getDurationString, toDate } from '../../utils/time-utils';
import { TriplanEventPreferredTime, TriplanPriority } from '../../utils/enums';
import { BuildEventUrl, getClasses, isBasketball, isDessert, isFlight, isHotel, isMatching } from '../../utils/utils';
import './map-container.scss';
import ReactModalService from '../../services/react-modal-service';
import * as ReactDOMServer from 'react-dom/server';
// @ts-ignore
import Slider from 'react-slick';
import { AllEventsEvent } from '../../services/data-handlers/data-handler-base';
import { Coordinate, LocationData, SidebarEvent } from '../../utils/interfaces';
import { Observer } from 'mobx-react';
import SelectInput from '../inputs/select-input/select-input';
import { observable, runInAction } from 'mobx';

interface MarkerProps {
	text?: string;
	lng?: number;
	lat?: number;
	locationData: LocationData;
	openingHours: any;
	searchValue: string;
	clearSearch?: () => void;
}

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
					}
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
	getNameLink?: (x: AllEventsEvent) => string;
	isCombined?: boolean;
	addToEventsToCategories: (event: SidebarEvent) => void;
}

const MapContainer = (props: MapContainerProps) => {
	const [searchValue, setSearchValue] = useState('');
	const [searchCoordinatesSearchValue, setSearchCoordinatesSearchValue] = useState(''); // keeps searchValue that matches current search coordinates
	const [searchCoordinates, setSearchCoordinates] = useState([]);
	const [visibleItems, setVisibleItems] = useState<any[]>([]);
	const [visibleItemsSearchValue, setVisibleItemsSearchValue] = useState('');
	const [center, setCenter] = useState(undefined);
	const eventStore = useContext(eventStoreContext);

	const coordinatesToEvents = {};
	const texts: Record<string, string> = {};
	let googleRef: any, googleMapRef: any, infoWindow: any;
	let searchMarkers: ReactElement[] = [];
	let markerCluster;
	let markers: any[] = [];

	const getKey = (x: Coordinate) => x.lat + ',' + x.lng;
	// modify to props
	const locations = (props.allEvents ?? eventStore.allEventsFilteredComputed)
		.filter((x) => x.location && x.location.latitude && x.location.longitude)
		.map((x) => ({
			event: x,
			label: x.title,
			lat: x.location?.latitude,
			lng: x.location?.longitude,
		}));
	locations.forEach((x) => {
		// @ts-ignore
		texts[getKey(x)] = x.label;
		// @ts-ignore
		coordinatesToEvents[getKey(x)] = x.event;
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
		const title = `<div style="font-size:20px; margin-inline-end: 5px;" class='map-info-window-title'><b><u>${event.title}</u></b></div>`;
		const address = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-map-marker" aria-hidden="true"></i><span> ${addressPrefix}: ${event.location.address}</span></span>`;

		const description = event.description
			? `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-info" aria-hidden="true"></i> <span>${descriptionPrefix}: ${event.description}</span></span>`
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
		if (!props.allEvents) {
			category = eventStore.categories.find((x) => x.id.toString() === category.toString())?.title;
		}
		const categoryBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-tag" aria-hidden="true"></i> <span>${categoryPrefix}: ${category}</span></span>`;

		let preferredTime = event.preferredTime;

		if (preferredTime) {
			preferredTime = TriplanEventPreferredTime[preferredTime];
		} else {
			preferredTime = TriplanEventPreferredTime.unset;
		}
		const preferredHoursBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-clock-o" aria-hidden="true"></i> <span>${preferredHoursPrefix}: ${TranslateService.translate(
			eventStore,
			preferredTime
		)}</span></span>`;

		// const lat = event.location.latitude.toFixed(7);
		// const lng = event.location.longitude.toFixed(7);
		// const url = `https://maps.google.com/maps?q=${lat},${lng}`;
		const url = BuildEventUrl(event.location);
		const urlBlock = `<span><a href="${url}" target="_blank">View on google maps</a></span>`;

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
							alt={''}
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

	const setGoogleMapRef = (map: any, maps: any) => {
		googleMapRef = map;
		googleRef = maps;

		infoWindow = new googleRef.InfoWindow();

		const getIconUrl = (event: any) => {
			let icon = '';
			let bgColor = priorityToMapColor[event.priority].replace('#', '');
			let category: string = props.allEvents
				? event.category
				: eventStore.categories.find((x) => x.id.toString() === event.category.toString())?.title;

			category = category ? category.toLowerCase() : '';
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
			};

			if (isBasketball(category, title)) {
				icon = iconsMap['basketball'];
			} else if (isDessert(category, title)) {
				icon = iconsMap['desserts'];
			} else if (isFlight(title)) {
				icon = iconsMap['flights'];
				bgColor = flightColor;
			} else if (isHotel(category, title)) {
				icon = iconsMap['hotel'];
				bgColor = hotelColor;
			} else if (
				isMatching(category, ['food', 'restaurant', 'אוכל', 'מסעדות', 'cafe', 'קפה']) ||
				isMatching(title, ['food', 'restaurant', 'אוכל', 'מסעדת', 'cafe', 'קפה'])
			) {
				icon = iconsMap['food'];
			} else if (isMatching(category, ['photo', 'תמונות'])) {
				icon = iconsMap['photos'];
			} else if (
				isMatching(category, ['nature', 'flower', 'garden', 'גן ה', 'גני ה', 'פרח', 'טבע']) ||
				isMatching(title, ['nature', 'flower', 'garden', 'גן ה', 'גני ה', 'פרח', 'טבע'])
			) {
				icon = iconsMap['flowers'];
			} else if (isMatching(category, ['attraction', 'attractions', 'אטרקציות', 'פעילויות'])) {
				icon = iconsMap['attractions'];
			} else if (
				isMatching(category, ['coffee shops', 'coffee shop', 'קופישופס']) ||
				isMatching(title, ['coffee shops', 'coffee shop', 'קופישופס'])
			) {
				icon = iconsMap['coffee_shops'];
			} else if (
				isMatching(category, ['beach', 'beaches', 'beach club', 'beach bar', 'חופים', 'ביץ׳ באר', 'ביץ׳ בר'])
			) {
				icon = iconsMap['beach'];
			} else if (isMatching(category, ['club', 'cocktail', 'beer', 'bar', 'מועדונים', 'ברים', 'מסיבות'])) {
				icon = iconsMap['nightlife'];
			} else if (isMatching(category, ['shopping', 'stores', 'חנויות', 'קניות', 'malls', 'קניונים'])) {
				icon = iconsMap['shopping'];
			} else if (isMatching(category, ['tourism', 'תיירות', 'אתרים'])) {
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

		const initMarkerFromCoordinate = (coordinate: Coordinate) => {
			const key = getKey(coordinate);
			// @ts-ignore
			const event = coordinatesToEvents[key];

			// marker + marker when hovering
			icon.url = getIconUrl(event);
			const markerIcon = { ...icon, fillColor: priorityToColor[event.priority] };
			const markerIconWithBorder = {
				...markerIcon,
				strokeColor: '#ffffff',
				strokeOpacity: 0.6,
				strokeWeight: 8,
			};

			// set marker
			const refMarker = new googleRef.Marker({
				position: { lat: coordinate.lat, lng: coordinate.lng },

				// label: texts[key],
				// labelContent: 'A',
				// labelAnchor: new google.maps.Point(3, 30),
				// labelClass: 'labels', // the CSS class for the label
				// labelInBackground: false,
				label: {
					text: texts[key],
					color: '#c0bbbb',
					fontSize: '10px',
					fontWeight: 'bold',
					className: 'marker-label',
				},

				title: texts[key],
				icon: markerIcon,
				// label: event.icon
			});

			// for visible items to be able to get more info about this marker
			refMarker.eventId = event.id;

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

		const icon = {
			url: 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1577-food-fork-knife_4x.png&highlight=ff000000,FF5252,ff000000&scale=2.0',
			scaledSize: new googleRef.Size(30, 30),
			fillColor: '#F00',
			fillOpacity: 0.7,
			strokeWeight: 0.4,
			strokeColor: '#ffffff',
		};

		markers = coordinates && coordinates.map((coordinate) => initMarkerFromCoordinate(coordinate));

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
				const coordinate = {
					lat: selectedSearchLocation.latitude,
					lng: selectedSearchLocation.longitude,
					address: selectedSearchLocation.address,
					// @ts-ignore
					openingHours: window.openingHours,
				};
				// @ts-ignore
				searchMarkers = [coordinate];
			}

			setSearchCoordinatesSearchValue(searchValue);
			// @ts-ignore
			setSearchCoordinates(searchMarkers);
			return;

			// // marker + marker when hovering
			// const bgColor = "3849ab";
			// const icon = {
			//     url: `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`,
			//     scaledSize: new googleRef.Size(30, 30),
			//     fillColor: "#F00",
			//     fillOpacity: 0.7,
			//     strokeWeight: 0.4,
			//     strokeColor: "#ffffff"
			// };
			// const markerIcon = {...icon, fillColor: bgColor}
			// const markerIconWithBorder = {
			//     ...markerIcon,
			//     strokeColor: '#ffffff',
			//     strokeOpacity: 0.6,
			//     strokeWeight: 8,
			// }
			//
			// // set marker
			// const refMarker = new googleRef.Marker({
			//     position: { lat: coordinate.lat, lng: coordinate.lng },
			//     // label: texts[key],
			//     title: selectedSearchLocation.address,
			//     icon: markerIcon,
			//     // label: event.icon
			// });
			//
			// // on click event
			// googleRef.event.addListener(refMarker, 'click', (function () {
			//     return function () {
			//         // infoWindow.setContent(buildInfoWindowContent(event));
			//         // infoWindow.open(map, refMarker);
			//     }
			// })(refMarker));
			//
			// // hover & leave events
			// googleRef.event.addListener(refMarker, 'mouseover', (function () {
			//     return function () {
			//         refMarker.setIcon(markerIconWithBorder)
			//     }
			// })(refMarker));
			// googleRef.event.addListener(refMarker, 'mouseout', (function () {
			//     return function () {
			//         refMarker.setIcon(markerIcon)
			//     }
			// })(refMarker));

			// if (searchMarkers && searchMarkers.length) {
			//     debugger;
			//     markerCluster.removeMarkers(searchMarkers)
			// }

			// searchMarkers = [refMarker];
			// // new MarkerClusterer(googleMapRef, [...markers, ...searchMarkers], {
			// //     imagePath: "/images/marker_images/m",
			// //     minimumClusterSize: 10
			// // });
			//
			// return refMarker;
		};
	}, [googleRef, googleMapRef]);

	const onVisibleItemClick = useMemo(() => {
		return (event: any, marker: any) => {
			if (googleMapRef && infoWindow) {
				const coordinates = event.location;
				// @ts-ignore
				setCenter({ lat: coordinates.latitude, lng: coordinates.longitude });

				infoWindow.setContent(buildInfoWindowContent(event));
				infoWindow.open(googleMapRef, marker);

				infoWindow.onClose(() => {
					alert('on close!');
				});
			}
		};
	}, [googleMapRef, infoWindow]);

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

	const updateVisibleMarkers = () => {
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

	const filteredVisibleItems = visibleItems
		.sort((a, b) => {
			const priority1 = Number(a.event.priority) === 0 ? 999 : a.event.priority;
			const priority2 = Number(b.event.priority) === 0 ? 999 : b.event.priority;
			return priority1 - priority2;
		})
		.filter((x) => x.event.title.toLowerCase().indexOf(visibleItemsSearchValue.toLowerCase()) !== -1);

	function renderMapFilters() {
		const allOption = { label: TranslateService.translate(eventStore, 'ALL'), value: '' };
		const priorities = Object.keys(TriplanPriority).filter((priority) => Number.isNaN(Number(priority)));
		const otherOptions = priorities.map((p) => ({ label: TranslateService.translate(eventStore, p), value: p }));

		function renderScheduledOrNotFilters() {
			return (
				<div className="flex-row gap-5 align-items-center">
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
								{TranslateService.translate(eventStore, 'SCHEDULED_EVENTS')}
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
								{TranslateService.translate(eventStore, 'UNSCHEDULED_EVENTS')}
							</a>
						)}
					</Observer>
				</div>
			);
		}

		function renderPrioritiesFilters() {
			return (
				<div className="flex-row gap-5 align-items-center">
					<span>{TranslateService.translate(eventStore, 'SHOW_ONLY_EVENTS_WITH_PRIORITY')}</span>
					{eventStore.isMobile && (
						<SelectInput
							ref={undefined}
							id={'map-filter-priorities'}
							name={'map-filter-priorities'}
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
							modalValueName={'filterByPriority'}
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

		return (
			<div
				className={getClasses(
					'map-filters-container',
					eventStore.isMobile && 'justify-content-center flex-column'
				)}
			>
				{renderPrioritiesFilters()}
				{renderScheduledOrNotFilters()}
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

	return (
		<div
			className={getClasses(
				'map-container',
				props.isCombined && 'combined',
				eventStore.isMobile && 'resize-none'
			)}
		>
			{renderMapFilters()}
			<div className="map-header">
				<div className={'map-search-location-input'}>
					<input
						type="text"
						className="map-header-location-input-search"
						onClick={() =>
							// @ts-ignore
							window.initLocationPicker(
								'map-header-location-input-search',
								'selectedSearchLocation',
								initSearchResultMarker
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
						placeholder={TranslateService.translate(eventStore, 'MAP_VIEW.SEARCH.PLACEHOLDER')}
					/>
					<div className={getClasses('clear-search', searchCoordinates.length === 0 && 'hidden')}>
						<a onClick={clearSearch}>x</a>
					</div>
				</div>
			</div>
			{/*{!googleMapRef && (*/}
			{/*    <div>*/}
			{/*        {TranslateService.translate(eventStore, 'MAP_VIEW.LOADING_PLACEHOLDER')}*/}
			{/*    </div>*/}
			{/*)}*/}
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
				zoom={searchCoordinates.length > 0 || center ? 14 : 7}
				yesIWantToUseGoogleMapApiInternals
				// @ts-ignore
				onGoogleApiLoaded={({ map, maps }) => setGoogleMapRef(map, maps)}
				clickableIcons={false}
				options={getOptions()}
			>
				{searchCoordinates.map((place, index) => (
					<Marker
						key={index}
						locationData={
							// @ts-ignore
							[{ ...place }].map((x) => {
								x.longitude = x.lng;
								x.latitude = x.lat;
								delete x.lng;
								delete x.lat;
								return x;
							})[0]
						}
						clearSearch={clearSearch}
						// @ts-ignore
						text={place.address}
						// @ts-ignore
						lat={place.lat}
						// @ts-ignore
						lng={place.lng}
						searchValue={searchCoordinatesSearchValue}
						// @ts-ignore
						openingHours={place.openingHours}
					/>
				))}
			</GoogleMapReact>
			<div
				className={getClasses(
					'visible-items-pane',
					'bright-scrollbar',
					eventStore.isMobile && 'mobile',
					props.isCombined && 'combined'
				)}
			>
				<div className="visible-items-header">
					<b>{TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.TITLE')}:</b>
				</div>
				<div className={'search-container'}>
					<input
						type={'text'}
						name={'fc-search'}
						value={visibleItemsSearchValue}
						onChange={(e) => {
							setVisibleItemsSearchValue(e.target.value);
						}}
						placeholder={TranslateService.translate(eventStore, 'SEARCH_PLACEHOLDER')}
					/>
				</div>
				<div className={'visible-items-fc-events bright-scrollbar'}>
					{visibleItems.length === 0 && TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.NO_ITEMS')}
					{visibleItems.length > 0 &&
						filteredVisibleItems.length === 0 &&
						TranslateService.translate(eventStore, 'MAP.VISIBLE_ITEMS.NO_SEARCH_RESULTS')}
					{filteredVisibleItems.map((info) => {
						const calendarEvent = eventStore.calendarEvents.find((c) => c.id === info.event.id);

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
											info.event,
											() => clearSearch()
										);
									}}
									title={TranslateService.translate(eventStore, 'CLICK_HERE_TO_ADD_TO_CALENDAR')}
								/>
							);

							if (calendarEvent) {
								addToCalendar = (
									<i
										className="fa fa-calendar-check-o visible-items-calendar-indicator"
										aria-hidden="true"
										title={TranslateService.translate(eventStore, 'ALREADY_IN_CALENDAR')}
									/>
								);
							}
						}

						return (
							<div
								className={`fc-event priority-${info.event.priority}`}
								onClick={() => {
									onVisibleItemClick(info.event, info.marker);
								}}
							>
								{addToCalendar}
								{info.event.title}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default MapContainer;
