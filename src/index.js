import React, { useContext, useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import MainPage from './pages/main-page/main-page';
import 'bootstrap/dist/css/bootstrap.css';
import './stylesheets/fonts.css';
import './stylesheets/colors.css';
import './stylesheets/buttons.scss';
import './stylesheets/app.scss';
import './stylesheets/rtl.scss';
import './stylesheets/fontawesome/css/font-awesome.css';
import './stylesheets/modals.scss';
import './stylesheets/mobile.responsive.scss';
import LandingPage from './pages/landing-page/landing-page';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GettingStartedPage from './pages/getting-started/getting-started-page';
import MyTrips from './pages/my-trips/my-trips';
import TranslateService from './services/translate-service';
import { eventStoreContext } from './stores/events-store';
import ThemeExample from './pages/theme-example/theme-example';
import { runInAction } from 'mobx';
import { getCoordinatesRangeKey, isMatching, padTo2Digits } from './utils/utils';
import SweetAlert from 'react-bootstrap-sweetalert';
import { Observer } from 'mobx-react';
import RegisterPage from './pages/register-page/register-page';
import LogoutPage from './pages/logout-page/logout-page';
import { getToken, getUser } from './helpers/auth';
import axios from 'axios';
import LoginPage from './pages/login-page/login-page';
import MobileLanguageSelectorPage from './pages/language-selector/mobile-language-selector';
import AdminDashboard from './admin/pages/dashboard/admin-dashboard';
import AdminManageDestinationItems from './admin/pages/manage-destination/a-manage-destination';
import AManageItem from './admin/pages/manage-item/a-manage-item';
import {
	ATTRACTIONS_KEYWORDS,
	DESSERTS_KEYWORDS,
	FLIGHT_KEYWORDS,
	FOOD_KEYWORDS,
	HOTEL_KEYWORDS,
	NATURE_KEYWORDS,
	NIGHTLIFE_KEYWORDS,
	STORE_KEYWORDS,
	TOURIST_KEYWORDS,
} from './components/map-container/map-container';
import { BiEventsService } from './services/bi-events.service';
import useIsAdmin from './custom-hooks/use-is-admin';
import InviteLink from './pages/invite-link/invite-link';
import MainPageV2 from "./v2/views/main-page/main-page";
import {newDesignRootPath} from "./v2/utils/consts";
import {FeatureFlagsService} from "./utils/feature-flags";
import LoginPageV2 from "./v2/views/login-page/login-page";

// Dubai
// Namos / Twiggy?
// Billionare?
// add to hotel before Nasr
// safari - check where, how much money, how much time etc

// Maldives
// ask for pool with flowers - check price

// ----------------------------------------

// wip status:
// - trips will be created only if route is plan/create
// - change it to /create ^
// - now we can't create trips if not logged in - need to fix. (if not logged in create only on local storage)
// - need to have a way to know if trip is db or local storage.
// - need to sync only if clicked on sync button. if synced - it need to be removed from local storage and be stored **only** on db.
// - verify it good before doing that, and backup dubai and viena first ^^

// - add filter of show only events with problematic hours (and make sure it'll show them even though we're on filter mode)
// - add price (!) and total price (!)
// - add "leave at X to arrive on time" to list view (!!)

// started implementing functions on DBService, need to continue, and
// ... on every place we used to call local storage service - call db service instead if it's a db trip
// ... whenevery tripName is set, set also dbSource in event-store.
// ... make sure to update it whenever trip changes, carefully to avoid mix-match
// .. add sync button to each trip in the local trips
// .. add sync all option.
// if the user does not have local trips and connected, do not show this tab anymore.
// find a different design to distinguish local and db trips. (not white and gray backgrounds)
// V Tab view between local trips and account trips

// --------------- GENERAL ---------------------------
// 1. heroku alternatives (!!!) todo complete
// 2. store all my projects on GitHub todo complete
// 3. route_templates - check where I have it, for easier route generating. todo complete
// 4. define prettier / linter once you save to fix the lines that are too long etc todo complete
// ---------------------------------------------------
// 3. refactor my css files to be scss todo complete
// 4. move stuff to components todo complete
// 5. move all primary-button and secondary-button to their components todo complete
// 6. create a page with all of my basic components and colors. buttons, etc. todo complete
// 7. check if lokalise have a free version if so use it todo complete

// V refactor modals to the react version.
// V check dubai allevents - calendarevents - sidebar events, make sure there are no missing.
// V move success, error modals to the regular modals service and use it. use the same function so we can maybe move it too easily.
// V see how can we pass initial value to a input and still be able to edit it. currently if I move it I cant change the value of the input.
// V ^ it's in edit trip name
// V terminology - change 'event' to something else maybe 'point of interset' נקודות עניין
// V changing calendar events category isn't working. maybe its related (maybe its duplicating instead of editing or something)
// V refactor SweetAlert from HTML to React
// V ... use IconSelector and LocationPicker
// V (!!) fix "or" calculation when there is 1 event and 2 other events that together are at the same times as the first event.
// V install NODE SASS

// --------------- DB SERVER -------------------------
// 1. currently there's login&register but no sync/indication which trips are local and which are in the account. need to add sync button. todo complete
// 2. allow local trips if user is not logged in at the moment. todo complete
// 3. add a header line saying you are not logged in so trips will be saved locally on this computer only. register / login to store your trips in your account. todo complete

// --------------- MOBILE ----------------------------
// 1. make it mobile-responsive - improve the design of the pages, make it responsive. check idea on Canva, Sichor, Outlook, Dubai.co.il, SecretFlights, etc. todo complete
// 2. mobile view - like outlook todo complete

// --------------- DESIGN ----------------------------
// 1. change font to INTER (plato) todo complete
// 2. Design changes - make it mobile friendly like Dubai site / SecretFlights todo complete
// 3. Design Changes - make desktop version more colorful - maybe like Sichor / Dubai todo complete
// 4. Move calendar related stuff to the calendar area. (instead of sidebar) todo complete
// 5. import - move it maybe above (even though import is sidebar related action) todo complete
// 6. Hebrew text seems a bit weird (Trip?) todo complete
// 7. improve events styles (make them look more then google calendar / job scheduler) todo complete
// 8. [MUST!!] JoyRide - add onboarding guide

// V Clean up the colors. decide 1 cta color, set it on the things we want the user to click.
// V - primary, secondary (white with border), noBackground

// --------------- BUGS ------------------------------
// 1. fix opening hours (when day have multiple hours its not working well. for example 8-15:30, 18:00-22:00) todo complete
// 2?. fix allevents duplicate items so statistics in the sidebar will be correct. todo complete
// 3?. (!!) trying to add new event when there are no categories returns no error and no success. either add popup / add  default category general. todo complete
// 4?. double clicking on add category creating category without name (!!!) todo complete
// 5. do not update view when changing dates until clicking on 'custom view' button todo complete
// 6. check delete logic, when deleting all categories and trying to import it says its already exist todo complete
// 7?. check delete category logic, when deleting category it says it will delete events from calendar but it isn't. todo complete
// ! 8.sort categories by fixed thing. (if i change icon its jump to end - avoid that) todo complete
// 9? fix import? (maybe 'numbers' issue, need to use a different app) todo complete

// V make sure that if place have closed days like KNOCX it handles it.
// V creating event with the new modal use the text of the icon instead of the actual icon.
// V (!!!) add triplan event - location - not working good. try to set locatio nand then set category/priority and it'll reset.
// V can't change priority, preferred time on the new modal.

// --------------- FEATURES --------------------------
// 0. [MUST!!!] think how I arrange the things so it will be ok with the driving times as well (+ think how to show it on the calendar view) todo complete
// 0. >>> [IMPORTANT] for each event check both driving and walking, choose walking if less then X otherwise driving todo complete
// 0. add price field for each event todo complete
// 0. add total price to list view todo complete
// 0. add events with no price to filters todo complete
// 0. [IMPORTANT!] google distances calculations - cache only 1 week / 1 month back. not forever todo complete
// 1. [MAP] add photos and more place info to the window info line and to each event. todo complete
// 2. [LIST VIEW] if it's a note (allDay) - do not show most of the fields (location, priority, hours, etc) <- its irrelevant. todo complete
// 3. add 'opening hours' to the list view (but only the opening hours of they day this event is scheduled to) todo complete
// 4. add 'opening hours' to map view to window info todo complete
// 5. sidebar filters - for example based on activity hours. if I have a "whole" in Sunday 10:00-11:00, show me all the  events that can fit based on working hours todo complete
// 6. On which dates are you staying at each hotel settings todo complete
// ........ create tasks automatically for x in, flight out, checkin, checkout with 'please fill in' text. todo complete
//          flight: title, description, depart time, land time, start location, end location
//          hotel: title, description?, check in date&time, check out date&time, location
// 7. ... + auto create events for these hotels, place them first on each day. make them from different type so it will be  undeletable (?), without start-end dates todo complete
// 8. ... + allow creating a Hotel event when clicking on the calendar easily, by selecting from the hotels you already added. todo complete
// 9. create automatically notes category (with default - consider that on Sunday stuff may be closed) todo complete
// 10. add "order status" select with "not relevant" as default and then "need to order" (that populates 'להזמין' message in  the summary) and "ordered!" that populates ordered (הוזמן) in the summary todo complete
// 11. [NICE!] add the ability to "swap" dates - move all the activities from 1 day to another and vice versa. todo complete
// 12?. find a better location to the trip summary. todo complete
// 13. [MUST!] add 'openning hours' to each event, and mark it in error if you placed something in a day its supposed to be  closed. todo complete
// 14. [NICE!] add Ordered? setting. if you already booked something, disable dragging it and add lock icon. todo complete
// 15. [NICE!] option to add 'tasks' for yourself about events for example - check hours, check where to bla bla bla. events  with tasks will have red indication todo complete
// .... use this field to write yourself tasks refarding this event such as "check activity hours" or "book in advance". any event with tasks will appear with big TODO COMPLETE indication in the list view so you won't forget to handle it before the trip
// 16. [NICE!] add photos, external links (so we can easily find the posts/sources of the description) todo complete
// 17. [MUST!] export calendar to detailed hours mail (like what I usually do) todo complete
// -18. [ADVANCED] [GOOGLE MAPS] automatically suggest near locations from your list. <- suggested days based on 1 breakfast, 1 lunch, 1 evening, attractions etc. inc. driving/walking times  todo complete
// 19. [ADVANCED] [GOOGLE MAPS] setting of how much time MAX are you willing to walk, otherwise suggest only drive. todo complete
// 20. [ADVANCED] keep it on db todo complete
// 21. [MUST] add "tinder"-like suggestion system - you choose a destination and it shows you options from its db. you can swipe right/left. "like" will add it to the sidebar. "no" will ignore it and mark it as ignore. todo complete
// ... 22. [MUST] add all the things I Saved on the instagram to the db of Triplan as options todo complete
// 23. add option to add picture, video, link to instagram page etc. todo complete
// 24. [UI] if there's a problem with event, for examploe missing hours, missing location etc - add some indication. so the user will know easily without filtering there's a problem todo complete

// V create automatically logistic category
// V create different trips, save it on different local storage settings.
// V allow duplicate calendar event as well (!)
// X location picker javascript/html version.
// V add ascii icons selector.
// V change modals so escape will be cancel not 'update'.
// V make sure each of the local storage holds what it should (sidebarevent / calendarevent / eventinput)
// V localise
// V [ADVANCED] connect it to google maps - get coordinates on each place you add (location picker)
// V [ADVANCED] [GOOGLE MAPS] show locations on map based on coordinates.
// V [ADVANCED] [GOOGLE MAPS] automatically suggest to add driving instructions

// --------------- ADVANCED --------------------------
// 0. [Must] Automatically build trips / at least build day suggestions. based on 3 meals a day, attractions, etc, based on preferred hours, priority etc. todo complete
// 1. [BACKUPS] (advanced) add a way to "keep snapshots" of current planning and then visiting them later, compare to current etc. todo complete
// ... + export to excel (csv), text summary, json (json for backups) todo complete
// 2. [ADVANCED] Flight finder based on your trip dates. todo complete
// 3. [ADVANCED] - add location to import/export (location address, location lng, location lat) - need to think how to do it. todo complete
// 4. allow to resize the sidebar vs calendar space (?) todo complete
// 5. add the ability to render only part of the calendar hours wise (for example hours 1-2-3-4-5-6.. irrelevant.) todo complete
// 6. content writing - write articles about stuff, trips summaries, suggested destinations, etc. todo complete

// --------------- MAP TASKS -------------------------
// 1. (!!) when clicking on a coordinate in the map, allow editing the event from there and then we can change the location. todo complete
// 2. ^ if there are more then 1 events with the same location make sure to update all of them. todo complete
// 3. (!!) filters on map - for example - highlight all unscheduled events. when they are highlighted it'll be easier to see what are they close to and how can we combine them to make them in the schedule. todo complete
// 4. add "navigate" button to the list view that opens google maps to that location todo complete

// V [MAP] add search mode to the map, allowing to search for address + display results markers on the map. clicking on the map should open create event with location and title already filled in.
// V [MAP] make markers be circles with the icon of the attraction / its category in the middle.
// V (!!) [MAP] show another mini sidebar over the map showing which events are currently displayed in the map. (visible) <- I sent myself example for that on whatsapp
// V make marker look better
// V find a way to show monocity view instead of this view.
// V connect to google place details to get places working hours - https://www.youtube.com/watch?v=vAK5o8h8C28

// ---------------------------------------------------

// completed tasks:
// V remove from events sidebar after drop
// V class component -> functional component + separate to components
// V SUPPORT custom date view not necessirily week (!!)
// V separate to components, implement functions as reattachCalendarEvents
// V  keep it in localstorage and load it from local storage
// V create edit modal from sidebar as well. (maybe apss a flag if this event is sidebar event or calendar event and use the same modal?)
// V move modals to modal service & verify its working
// V add the ability to duplicate calendar event. (if we want it more the nonce) <- added to sidebar event.
// V add events, remove events
// V priorities
// V SUPPORT HEBREW (!!)
// V bulk import sidebar events
// V add categories, remove categories
// V remember these on localstorage as well ^
// V if it includes "לברר" or "todo" or "need to check" - mark it as red and big in the summary
// V change "כל היום" to notes and allow users to drag notes blocks to the upper of each day to include notes that will appear in the summary
// V change hebrew stuff to localise on the summary.
// V add total sidebar events and total calendar events. (for easier tracking)
// V style scrollbar + add scrollbar to events sidebar?
// V logo
// V DEPLOY TO HEROKU
// V Heebo / Rubik instead of current Hebrew font
// V fix scrollbars (currently there are too many)
// V fix header alignment (choose lang, recomended destinations)
// V brighter scrollbar
// V choose view - toggle not 2 buttons.
// X clear all items in red
// V logo - maybe remove.
// V (!!) preferred time titles - text with divider for example: -- morning ----------------
// V (!!) add more white as background. its more pleasent and easy to read. maybe the sidebar / calendar in white. see gmail for example.
// V make the regular hours white compared to the sleepy hours.
// V (!!) same design for all buttons (modals too)
// V DBService vs LocalStorageService, both implements the same base class/interface

// fixed bugs:
// V fix bug - placing event on board, editing it (rename for example), remove, re-add it <- old event still there.
// V fix bug - editing category name does not affect already existing event.

const RootRouter = () => {
	const eventStore = useContext(eventStoreContext);
	document.title = TranslateService.translate(eventStore, 'APP.TITLE');

	const refs = [
		'icon',
		'name',
		'category',
		'description',
		'duration',
		'priority',
		'preferred-time',
		'location',
		'opening-hours',
		'start-time',
		'end-time',
	];
	eventStore.modalValuesRefs = {};
	refs.forEach((refKey) => {
		eventStore.modalValuesRefs[refKey] = useRef(null);
	});

	var forceUpdateTimeout;
	window.setManualLocation = (className = 'location-input', variableName = 'selectedLocation', eventStore) => {
		const address = document.querySelector(`.${className}`)?.value;

		if (window[variableName]?.['address'] == address) {
			return;
		}

		let lostCoordinate = !!window[variableName]?.latitude;

		window[variableName] = {
			address,
			latitude: undefined,
			longitude: undefined,
		};

		if (eventStore) {
			eventStore.modalValues[variableName] = undefined;

			if (lostCoordinate) {
				forceUpdateTimeout = setTimeout(forceUpdate, 2000);
			}

			// debounce
			if (forceUpdateTimeout) {
				clearTimeout(forceUpdateTimeout);
				forceUpdateTimeout = setTimeout(forceUpdate, 2000);
			}
		}

		window.openingHours = undefined;
		const summaryDiv = document.getElementsByClassName('opening-hours-details');
		if (summaryDiv && summaryDiv.length > 0) {
			summaryDiv[0].innerHTML = window.renderOpeningHours();
		}
	};

	const forceUpdate = () => {
		runInAction(() => {
			eventStore.forceUpdate += 1;
		});
	};

	window.toggleClosed = (day) => {
		const isClosed = $(`input[name=is-closed-${day}]`).prop('checked');

		const start = document.getElementsByName('opening-hour-selector-' + day)[0];
		const end = document.getElementsByName('closing-hour-selector-' + day)[0];

		if (isClosed) {
			start.value = 'CLOSED';
			start.disabled = true;
			end.value = 'CLOSED';
			end.disabled = true;
		} else {
			start.value = 'N/A';
			start.disabled = false;
			end.value = 'N/A';
			end.disabled = false;
		}
	};

	window.renderOpeningHours = (openingHours = window.openingHours) => {
		let content;
		let isOldOpeningHours = false;

		if (!openingHours) {
			const noInfo = TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.NO_INFORMATION');
			const noLocation = TranslateService.translate(
				eventStore,
				'MODALS.OPENING_HOURS.NO_INFORMATION.NO_LOCATION'
			);
			content = noLocation ? `<div>${noInfo}</div><div>${noLocation}</div>` : `<div>${noInfo}</div>`;
		} else {
			let is247 = false;

			const hoursToDay = {};

			content = Object.keys(openingHours)
				.map((day) => {
					if (is247) return '';
					let when = '';
					if (openingHours[day].start && openingHours[day].end) {
						isOldOpeningHours = true;
						when = `${openingHours[day].start} - ${openingHours[day].end}`;
					} else {
						when = openingHours[day].map((x) => `${x.start} - ${x.end}`).join(', ');
					}
					if (when === '00:00 - 00:00') {
						is247 = true;
						return `<div>${TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.24_7')}</div>`;
					}
					const dayText = TranslateService.translate(eventStore, day);
					hoursToDay[when] = hoursToDay[when] || [];
					hoursToDay[when].push(dayText);
					return `<div>${dayText}: ${when}</div>`;
				})
				.join('');

			const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
			const closed = TranslateService.translate(eventStore, 'MODALS.OPENING_HOURS.CLOSED');
			days.forEach((closedDay) => {
				if (!openingHours[closedDay]) {
					const dayText = TranslateService.translate(eventStore, closedDay);
					hoursToDay[closed] = hoursToDay[closed] || [];
					hoursToDay[closed].push(dayText);
				}
			});

			if (!is247 && Object.keys(hoursToDay).length < Object.keys(openingHours).length) {
				let dayIndex = 0;
				const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
				const newResult = [];
				const temp = { ...hoursToDay };
				while (Object.keys(temp).length > 0 && dayIndex < days.length) {
					const day = days[dayIndex];
					const dayText = TranslateService.translate(eventStore, day);
					const when = Object.keys(temp).find((when) => temp[when].indexOf(dayText) !== -1);
					if (when) {
						newResult.push(`<div>${temp[when].join(', ')}: ${when}`);
						delete temp[when];
					}
					dayIndex++;
				}
				content = newResult.join('');

				if (Object.keys(hoursToDay).length === 1 && Object.values(hoursToDay).flat().length === 7) {
					const when = Object.keys(hoursToDay)[0];
					content = `<div>${TranslateService.translate(
						eventStore,
						'MODALS.OPENING_HOURS.ALL_WEEK'
					)}: ${when}`;
				}
			}
		}

		const oldHoursWarning = isOldOpeningHours
			? `<div class='red-color opening-hours-note white-space-pre font-size-10 margin-top-5'>${TranslateService.translate(
					eventStore,
					'NOTE.OLD_OPENING_HOURS'
			  )}</div>`
			: `<div class='gray-color opening-hours-note white-space-pre font-size-10 margin-top-5'>${TranslateService.translate(
					eventStore,
					'NOTE.OPENING_HOURS_MAY_CHANGE'
			  )}</div>`;

		return `
                <div class="opening-hours-details">${content}${oldHoursWarning}</div>
            `;
	};

	function updatePlaceDetails(place) {
		runInAction(() => {
			const descriptionArr = [];
			if (place.international_phone_number) {
				descriptionArr.push(`phone: ${place.international_phone_number}`);
			}
			if (place.rating) {
				descriptionArr.push(`Google Rating: ${place.rating}/5 (${place.user_ratings_total} total)`);
			}
			// console.log('before', eventStore.modalValues);

			// update name
			eventStore.modalValues['name'] = eventStore.modalValues['name'] ?? place.name;

			// update images
			if (eventStore.modalValues['images'] && eventStore.modalValues['images'].indexOf('maps.google') !== -1) {
				eventStore.modalValues['images'] = undefined;
			}
			eventStore.modalValues['images'] =
				eventStore.modalValues['images'] ??
				place.photos
					?.map((x, idx) => {
						BiEventsService.reportEvent(
							'google_places:get_photo',
							`${place.name}#${idx}`,
							eventStore.isMobile
						);
						return x.getUrl();
					})
					?.join('\n');

			// update more info link
			eventStore.modalValues['more-info'] =
				eventStore.modalValues['more-info'] ?? eventStore.modalValues['moreInfo'] ?? place.website ?? place.url;

			// update description
			eventStore.modalValues['description'] =
				eventStore.modalValues['description'] ?? descriptionArr.length > 0
					? descriptionArr.join('\n')
					: undefined;

			// update category
			const options = eventStore.categories
				.sort((a, b) => a.id - b.id)
				.map((x, index) => ({
					value: x.id,
					label: x.icon ? `${x.icon} ${x.title}` : x.title,
				}));
			if (place.name && !eventStore.modalValues['category']) {
				if (isMatching(place.name, HOTEL_KEYWORDS) || isMatching(place.website ?? '', HOTEL_KEYWORDS)) {
					eventStore.modalValues['category'] = options.find((x) => isMatching(x.label, HOTEL_KEYWORDS));
				}
			}

			if (place.types && !eventStore.modalValues['category']) {
				const storeCategory = options.find((x) => isMatching(x.label, STORE_KEYWORDS));
				const food = options.find((x) => isMatching(x.label, FOOD_KEYWORDS));
				const dessertOrFood =
					(isMatching(place.name, DESSERTS_KEYWORDS)
						? options.find((x) => isMatching(x.label, DESSERTS_KEYWORDS))
						: undefined) ?? food;
				const nightLife = options.find((x) => isMatching(x.label, NIGHTLIFE_KEYWORDS));
				const attractions = options.find((x) => isMatching(x.label, ATTRACTIONS_KEYWORDS));
				const tourism = options.find((x) => isMatching(x.label, TOURIST_KEYWORDS));
				const general = options.find((x) => isMatching(x.label, ['general', 'כללי']));
				const nature = options.find((x) => isMatching(x.label, NATURE_KEYWORDS));

				const typesToCategories = {
					bar: nightLife,
					// accounting: undefined,
					airport: options.find((x) => isMatching(x.label, FLIGHT_KEYWORDS)),
					amusement_park: attractions,
					aquarium: attractions,
					// art_gallery: undefined,
					// atm: undefined,
					bakery: dessertOrFood,
					food: dessertOrFood,
					store: storeCategory,
					bicycle_store: storeCategory,
					book_store: storeCategory,
					// bank: undefined,
					// beauty_salon: undefined,
					bowling_alley: attractions,
					// bus_station: undefined,
					cafe: dessertOrFood,
					campground: undefined,
					// car_dealer: undefined,
					car_rental: general,
					// car_repair: undefined,
					// car_wash: undefined,
					casino: nightLife,
					// cemetery: undefined,
					church: tourism,
					city_hall: tourism,
					clothing_store: storeCategory,
					convenience_store: storeCategory,
					// courthouse: undefined,
					// dentist: undefined,
					department_store: storeCategory,
					// doctor: undefined,
					// drugstore: undefined,
					// electrician: undefined,
					electronics_store: storeCategory,
					embassy: tourism,
					// fire_station: undefined,
					// florist: undefined,
					// funeral_home: undefined,
					furniture_store: storeCategory,
					// gas_station: undefined,
					gym: undefined,
					// hair_care: undefined,
					hardware_store: storeCategory,
					hindu_temple: tourism,
					home_goods_store: storeCategory,
					// hospital: undefined,
					// insurance_agency: undefined,
					jewelry_store: storeCategory,
					// laundry: undefined,
					// lawyer: undefined,
					library: tourism,
					// light_rail_station: undefined,
					liquor_store: storeCategory,
					// local_government_office: undefined,
					// locksmith: undefined,
					// lodging: undefined,
					// meal_delivery: undefined,
					// meal_takeaway: undefined,
					// mosque: undefined,
					// movie_rental: undefined,
					movie_theater: attractions,
					// moving_company: undefined,
					museum: undefined,
					night_club: nightLife,
					natural_feature: nature,
					// painter: undefined,
					// park: undefined,
					// parking: undefined,
					// pet_store: undefined,
					// pharmacy: undefined,
					// physiotherapist: undefined,
					// plumber: undefined,
					// police: undefined,
					// post_office: undefined,
					// primary_school: undefined,
					// real_estate_agency: undefined,
					restaurant: food,
					// roofing_contractor: undefined,
					// rv_park: undefined,
					// school: undefined,
					// secondary_school: undefined,
					shoe_store: storeCategory,
					shopping_mall: storeCategory,
					spa: attractions,
					stadium: attractions,
					// storage: undefined,
					// subway_station: undefined,
					supermarket: undefined,
					// synagogue: undefined,
					// taxi_stand: undefined,
					tourist_attraction: tourism ?? attractions,
					// train_station: undefined,
					// transit_station: undefined,
					// travel_agency: undefined,
					// university: undefined,
					// veterinary_care: undefined,
					zoo: attractions,
				};

				// console.log({ types: place.types });

				place.types.forEach((type) => {
					if (!eventStore.modalValues['category'] && typesToCategories[type]) {
						eventStore.modalValues['category'] = typesToCategories[type];
					}
				});
			}

			// todo complete - current_opening_hours.weekday_text
			// todo complete - map icon - https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/bar-71.png
			// todo complete - google maps url - https://maps.google.com/?cid=15387026663019329345
			// category - place.types
			// console.log('after', eventStore.modalValues);

			eventStore.forceUpdate += 1;
		});
	}

	function transformOpeningHours(openingHours) {
		const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
		const result = {};

		for (const period of openingHours.periods) {
			// open always
			if (!period.close) {
				result['SUNDAY'] = [
					{
						start: `00:00`,
						end: `00:00`,
					},
				];
				break;
			}

			const open = period.open;
			const close = period.close;

			const openDay = days[open.day];
			const closeDay = days[close.day];

			if (!result[openDay]) {
				result[openDay] = [];
			}

			result[openDay].push({
				start: `${open.time.substr(0, 2)}:${open.time.substr(2)}`,
				end: `${close.time.substr(0, 2)}:${close.time.substr(2)}`,
			});
		}

		return result;
	}

	window.initLocationPicker = (
		className = 'location-input',
		variableName = 'selectedLocation',
		placeChangedCallback,
		eventStore
	) => {
		const autoCompleteRef = document.querySelector(`.${className}`);
		const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef);

		// Add an event listener to the Autocomplete instance for 'input' event
		const inputElement = document.getElementsByClassName(className)[0];
		inputElement.addEventListener('keyup', (e) => {
			if (e.key != 'Backspace') {
				BiEventsService.reportEvent('google_map:place_searched', className, eventStore.isMobile, {
					value: autoCompleteRef.value,
				});
			}
		});
		inputElement.addEventListener('keydown', (e) => {
			// const a = autoCompleteRef;
			// BiEventsService.reportEvent('google_map:place_searched', className, eventStore.isMobile, {
			// 	value: autoCompleteRef.value,
			// });
		});

		google.maps.event.addListener(autocomplete, 'place_changed', function () {
			let place = autocomplete.getPlace();

			BiEventsService.reportEvent('google_map:place_changed', className, eventStore.isMobile);

			window.openingHours = undefined;
			let openingHoursData = undefined;
			if (place.opening_hours && place.opening_hours.periods) {
				window.openingHours = openingHoursData = transformOpeningHours(place.opening_hours);

				Object.keys(openingHoursData).forEach((day) => {
					const start = document.getElementsByName('opening-hour-selector-' + day)[0];
					const end = document.getElementsByName('closing-hour-selector-' + day)[0];

					if (start && end) {
						start.value = openingHoursData[day].start;
						end.value = openingHoursData[day].end;
						start.disabled = false;
						end.disabled = false;
						$(`input[name=is-closed-${day}]`).prop('checked', false);
					}
				});
			}

			const summaryDiv = document.getElementsByClassName('opening-hours-details');
			if (summaryDiv && summaryDiv.length > 0) {
				summaryDiv[0].innerHTML = window.renderOpeningHours(openingHoursData);
			}

			const latitude = place.geometry.location.lat();
			const longitude = place.geometry.location.lng();
			const address = document.querySelector('.' + className).value;
			window[variableName] = {
				address,
				latitude,
				longitude,
			};

			if (eventStore) {
				eventStore.modalValues[variableName] = {
					address,
					latitude,
					longitude,
				};

				// todo check
				eventStore.modalValues['location'] = {
					address,
					latitude,
					longitude,
				};

				updatePlaceDetails(place);
			}

			window.placeInfo = {
				googleMapsUrl: place.url,
				photos: place.photos,
				website: place.website,
				phone: place.international_phone_number,
				name: place.name,
				rating: place.rating,
				user_ratings_total: place.user_ratings_total,
				reviews: place.reviews, // cool!
				types: place.types, // could be useful for the map icon determination
			};

			if (placeChangedCallback) {
				placeChangedCallback();
			}

			return false;
		});
	};

	// calculate matrix distance
	window.calculateMatrixDistance = (travelMode, startDestination, endDestination) => {
		// disable google maps distance calc for now
		return;

		const googleMatrixService = new google.maps.DistanceMatrixService();

		if (!startDestination || !endDestination) {
			return;
		}

		const origin = new google.maps.LatLng(startDestination.lat, startDestination.lng);
		const dest = new google.maps.LatLng(endDestination.lat, endDestination.lng);
		googleMatrixService.getDistanceMatrix(
			{
				origins: [origin],
				destinations: [dest],
				travelMode: travelMode,
			},
			handleMatrixDistance
		);

		function handleMatrixDistance(response, status) {
			if (status === 'OK') {
				const origins = response.originAddresses;
				const destinations = response.destinationAddresses;

				let result = {};

				for (let i = 0; i < origins.length; i++) {
					const results = response.rows[i].elements;
					for (let j = 0; j < results.length; j++) {
						let element = results[j];

						let from = origins[i];
						let to = destinations[j];

						try {
							let distance = element.distance.text;
							let duration = element.duration.text;
							let duration_value = element.duration.value;

							result = {
								distance,
								duration,
								from,
								to,
								duration_value,
							};
						} catch {
							// means there are no possible ways to get there in this travel mode
							result = {
								distance: '-',
								duration: '-',
								from,
								to,
								duration_value: 9999999999,
							};
						}
					}
				}
				runInAction(() => {
					eventStore.setDistance(
						getCoordinatesRangeKey(eventStore.travelMode, startDestination, endDestination),
						result
					);

					eventStore.calculatingDistance = eventStore.calculatingDistance - 1;
					// console.log("finished", eventStore.calculatingDistance);
				});
			}
		}
	};

	axios.defaults.headers.Authorization = `Bearer ${getToken()}`;

	function isDevMode() {
		return window.location.href.indexOf('localhost') !== -1 || window.location.href.indexOf('0.0.0.0') !== -1;
	}

	const isAdmin = useIsAdmin();

	return (
		<>
			<BrowserRouter>
				<Routes>
					{/*<Route exact path='/' element={<PrivateRoute/>}>*/}
					{/*    <Route exact path='/' element={<LandingPage/>}/>*/}
					{/*<Route exact path="/loginold" element={getUser() == undefined ? <LoginPageOld /> : <LandingPage />} />*/}
					<Route exact path={newDesignRootPath} element={<MainPageV2 />} />
					<Route exact path="/" element={getUser() == undefined ? <LoginPage /> : FeatureFlagsService.isNewDesignEnabled(true) ? <MainPageV2 /> : <LandingPage />} />
					<Route exact path="/home" element={<LandingPage />} />
					<Route path={`${newDesignRootPath}/login`} element={<LoginPageV2 />} />
					<Route path="/login" element={FeatureFlagsService.isNewDesignEnabled(true) ? <LoginPageV2 /> : <LoginPage />} />
					<Route path={`${newDesignRootPath}/register`} element={<LoginPageV2 />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/logout" element={<LogoutPage />} />
					<Route exact path="/getting-started" element={<GettingStartedPage />} />
					<Route exact path="/my-trips" element={<MyTrips />} />
					<Route path={'/plan/create/:tripName/:locale'} element={<MainPage createMode={true} />} />
					<Route path="/plan/:tripName/:locale" element={<MainPage />} />
					<Route path="/plan/:tripName/" element={<MainPage />} />
					<Route path={`${newDesignRootPath}/plan/:tripName/`} element={<MainPageV2 />} />
					<Route path="/plan" element={<MainPage />} />
					<Route path="/inviteLink" element={<InviteLink />} />
					<Route path="/theme" element={<ThemeExample />} />
					<Route path="/language" element={<MobileLanguageSelectorPage />} />

					{/* Admin-only routes */}
					{isAdmin ? (
						<>
							<Route path="/admin" element={<AdminDashboard />} />
							<Route path="/admin/places-tinder" element={<AdminDashboard />} />
							<Route path="/admin/destination/:destination" element={<AdminManageDestinationItems />} />
							<Route path="/admin/item/:id" element={<AManageItem />} />
						</>
					) : (
						<Route path="/admin" element={getUser() == undefined ? <LoginPage /> : <LandingPage />} />
					)}
				</Routes>
			</BrowserRouter>
			<Observer>
				{() => (
					<SweetAlert
						// title={"test"}
						// onConfirm={() => { alert("confirm") }}
						// onCancel={() => { alert("cancel") }}
						// show={true}
						{...eventStore.modalSettings}
						confirmBtnBsStyle={eventStore.modalSettings.danger ? 'danger' : 'info'}
						// dependencies={[this.state.firstName, this.state.lastName]}
					>
						{eventStore.modalSettings.content}
					</SweetAlert>
				)}
			</Observer>

			<Observer>
				{() => (
					<SweetAlert
						// title={"test"}
						// onConfirm={() => { alert("confirm") }}
						// onCancel={() => { alert("cancel") }}
						// show={true}
						{...eventStore.secondModalSettings}
						confirmBtnBsStyle={eventStore.secondModalSettings.danger ? 'danger' : 'info'}
						// dependencies={[this.state.firstName, this.state.lastName]}
					>
						{eventStore.secondModalSettings.content}
					</SweetAlert>
				)}
			</Observer>

			{!isDevMode() && (
				<div className="please-rotate-your-phone">
					<img src="/images/rotate-placeholder.png" />
					{TranslateService.translate(eventStore, 'PLEASE_ROTATE_YOUR_DEVICE')}
				</div>
			)}
			<div className="device-is-not-supported">
				<img src="/images/oops-placeholder.png" />
				{TranslateService.translate(eventStore, 'DEVICE_IS_NOT_SUPPORTED')}
			</div>
		</>
	);
};

render(<RootRouter />, document.getElementById('root'));

// vienna - 21.10
// calendar events
// [{"start":"2022-11-12T22:00:00.000Z","end":"2022-11-12T23:00:00.000Z","title":"לברר אם דברים פתוחים בראשון","id":"101","className":"priority-0","extendedProps":{"id":"101","categoryId":"14","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","priority":"0","icon":"","preferredTime":"0"},"allDay":true},{"start":"2022-11-10T18:00:00.000Z","end":"2022-11-10T20:55:00.000Z","title":"טיסה מתל אביב לוינה","id":"65","className":"priority-0","extendedProps":{"id":"65","categoryId":"11","description":"טיסה עם wizzair&#10;טיסה מספר w6 2812&#10;משך הטיסה 03:55&#10;מזוודה אחת בהלוך - 20 קילו","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"allDay":false,"icon":"","priority":"0","description":"טיסה עם wizzair&#10;טיסה מספר w6 2812&#10;משך הטיסה 03:55&#10;מזוודה אחת בהלוך - 20 קילו","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139},"duration":"02:55"},{"id":"339","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","start":"2022-11-10T15:30:00.000Z","end":"2022-11-10T18:00:00.000Z","category":"19","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"19","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"category":"19"},"duration":"02:30"},{"start":"2022-11-10T06:00:00.000Z","end":"2022-11-10T14:00:00.000Z","title":"בית","id":"334","className":"priority-0","extendedProps":{"id":"334","categoryId":"16","description":"להתארגן לטיסה","priority":"0","icon":"","preferredTime":"0","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414}},"allDay":false,"icon":"","priority":"0","description":"להתארגן לטיסה","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414},"duration":"08:00"},{"start":"2022-11-14T08:00:00.000Z","end":"2022-11-14T09:00:00.000Z","title":"בית קפה Kylo","id":"180","className":"priority-2","extendedProps":{"id":"180","categoryId":"2","description":"בית קפה על נהר הדנובה עם ארוחות בוקר מגוונות וטעימות&#10;https://www.tripadvisor.com/Restaurant_Review-g190454-d12789266-Reviews-Klyo-Vienna.html","priority":"2","icon":"","preferredTime":"1","location":{"address":"KLYO, Uraniastraße, Wien, Austria","latitude":48.2115613,"longitude":16.383796}},"allDay":false},{"start":"2022-11-14T07:00:00.000Z","end":"2022-11-14T08:00:00.000Z","title":"צ׳ק אאוט במלון NH Collection","id":"80","className":"priority-0","extendedProps":{"id":"80","categoryId":"11","description":"צ׳ק אאוט בשעה 12:00","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"צ׳ק אאוט בשעה 12:00","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"01:00"},{"start":"2022-11-11T05:30:00.000Z","end":"2022-11-11T06:00:00.000Z","title":"מלון NH Collection","id":"142","className":"priority-0","extendedProps":{"id":"142","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"00:30"},{"start":"2022-11-13T04:30:00.000Z","end":"2022-11-13T05:00:00.000Z","title":"מלון NH Collection","id":"138","className":"priority-0","extendedProps":{"id":"138","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"00:30"},{"start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","title":"Hard Rock Vienna","id":"35","className":"priority-1","extendedProps":{"id":"35","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🍔 ","preferredTime":"2","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822}},"allDay":false,"icon":"🍔 ","priority":"1","description":"להזמין מראש","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822},"duration":"01:00"},{"start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","title":"El Gaucho Vienna","id":"9","className":"priority-1","extendedProps":{"id":"9","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🥩","preferredTime":"2","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},"allDay":false,"icon":"🥩","priority":"1","description":"להזמין מראש","duration":"01:00","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"The Loft","id":"133","className":"priority-0","extendedProps":{"id":"133","categoryId":"9","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","priority":"0","icon":"","preferredTime":"5","location":{"address":"The Loft, Lerchenfelder Gürtel, Wien, Austria","latitude":48.2088385,"longitude":16.3381239}},"allDay":false,"icon":"","priority":"0","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","duration":"01:00","location":{"address":"The Loft, Lerchenfelder Gürtel, Wien, Austria","latitude":48.2088385,"longitude":16.3381239}},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"Lamee Rooftop","id":"243","className":"priority-2","extendedProps":{"id":"243","categoryId":"9","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","priority":"2","icon":"","preferredTime":"4","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269}},"allDay":false,"icon":"","priority":"2","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269},"duration":"01:00"},{"start":"2022-11-11T19:30:00.000Z","end":"2022-11-11T20:30:00.000Z","title":"שוק נאשמרקט בלילה","id":"305","className":"priority-2","extendedProps":{"id":"305","categoryId":"9","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","priority":"2","icon":"","preferredTime":"5","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165}},"allDay":false,"icon":"","priority":"2","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165},"duration":"01:00"},{"start":"2022-11-11T18:00:00.000Z","end":"2022-11-11T19:30:00.000Z","title":"Seven North אייל שני","id":"353","className":"priority-1","extendedProps":{"id":"353","categoryId":"2","description":"המסעדה של אייל שני בוינה!\nטיפ זהב: אם המטבח של המסעדה פתוח, תבחרו לשבת על המטבח. זאת חוויה הרבה יותר מעניינת. מלמדת. ואפילו קצת תאטרלית!\nצריך להזמין","priority":"1","icon":"","preferredTime":"5","location":{"address":"Seven North, Schottenfeldgasse, Wien, Austria","longitude":16.3436502,"latitude":48.2048309}},"allDay":false,"icon":"","priority":"1","description":"המסעדה של אייל שני בוינה!\nטיפ זהב: אם המטבח של המסעדה פתוח, תבחרו לשבת על המטבח. זאת חוויה הרבה יותר מעניינת. מלמדת. ואפילו קצת תאטרלית!\nצריך להזמין","location":{"address":"Seven North, Schottenfeldgasse, Wien, Austria","longitude":16.3436502,"latitude":48.2048309},"duration":"01:30"},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"Funky Monkey Bar","id":"336","className":"priority-1","extendedProps":{"id":"336","categoryId":"9","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","priority":"1","icon":"","preferredTime":"5","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106}},"allDay":false,"icon":"","priority":"1","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106},"duration":"01:00"},{"start":"2022-11-12T17:00:00.000Z","end":"2022-11-12T19:30:00.000Z","title":"פארק מים אוברלה - Oberlaa Therme","id":"153","className":"priority-1","extendedProps":{"id":"153","categoryId":"19","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","priority":"1","icon":"","preferredTime":"5","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266}},"allDay":false,"icon":"","priority":"1","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266},"duration":"02:30"},{"start":"2022-11-14T16:00:00.000Z","end":"2022-11-14T21:50:00.000Z","title":"טיסה חזור מוינה לתל אביב ב20:15","id":"89","className":"priority-0","extendedProps":{"id":"89","categoryId":"11","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"allDay":false,"icon":"","priority":"0","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139},"duration":"05:50"},{"start":"2022-11-14T09:30:00.000Z","end":"2022-11-14T10:00:00.000Z","title":"Wien Sex Shop","id":"442","className":"priority-1","extendedProps":{"id":"442","categoryId":"5","description":"","priority":"1","icon":"","preferredTime":"0","location":{"address":"Sex Shop - Czerningasse 29, Czerningasse, Wien, Austria","longitude":16.3905468,"latitude":48.21610229999999}},"allDay":false,"icon":"","priority":"1","description":"","location":{"address":"Sex Shop - Czerningasse 29, Czerningasse, Wien, Austria","longitude":16.3905468,"latitude":48.21610229999999},"duration":"00:30"},{"start":"2022-11-14T10:30:00.000Z","end":"2022-11-14T11:30:00.000Z","title":"Vienna's roller-coaster restaurant","id":"99","className":"priority-1","extendedProps":{"id":"99","categoryId":"2","description":"https://www.youtube.com/watch?v=2BKm33Df48c","priority":"1","icon":"","preferredTime":"2","location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633}},"allDay":false,"icon":"","priority":"1","description":"https://www.youtube.com/watch?v=2BKm33Df48c","location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633},"duration":"01:00"},{"start":"2022-11-14T10:00:00.000Z","end":"2022-11-14T10:30:00.000Z","title":"Mini Golf","id":"435","className":"priority-0","extendedProps":{"id":"435","categoryId":"19","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Minigolf, Hauptallee, Wien, Austria","longitude":16.395962,"latitude":48.2159248}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Minigolf, Hauptallee, Wien, Austria","longitude":16.395962,"latitude":48.2159248},"duration":"00:30"},{"start":"2022-11-14T14:30:00.000Z","end":"2022-11-14T15:30:00.000Z","title":"Hard Rock Vienna","id":"373","className":"priority-1","extendedProps":{"id":"373","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🍔 ","preferredTime":"0","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Wien, Austria","latitude":48.2113174,"longitude":16.3754822}},"allDay":false,"icon":"🍔 ","priority":"1","description":"להזמין מראש","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Wien, Austria","latitude":48.2113174,"longitude":16.3754822},"duration":"01:00"},{"start":"2022-11-14T14:30:00.000Z","end":"2022-11-14T15:30:00.000Z","title":"El Gaucho Vienna","id":"370","className":"priority-1","extendedProps":{"id":"370","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🥩","preferredTime":"0","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},"allDay":false,"icon":"🥩","priority":"1","description":"להזמין מראש","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006},"duration":"01:00"},{"id":"447","title":"בגדי ים","icon":"","priority":"0","preferredTime":"0","description":"להביא איתנו תיק עם בגדי ים לאוברלה","start":"2022-11-11T22:00:00.000Z","end":"2022-11-12T22:00:00.000Z","category":"14","className":"priority-0","allDay":true,"extendedProps":{"title":"בגדי ים","icon":"","priority":"0","preferredTime":"0","description":"להביא איתנו תיק עם בגדי ים לאוברלה","categoryId":"14"},"duration":"00:00"},{"start":"2022-11-12T08:00:00.000Z","end":"2022-11-12T09:00:00.000Z","title":"Demmels cafe beim kohlmarkt","id":"359","className":"priority-1","extendedProps":{"id":"359","categoryId":"2","description":"״רצוי להגיע עם מזרק אינסולין, כי אתם הולכים לטעום כאן את כל הקינוחים ההאוסטרים המפורסמים״\nשעות פעילות - 10:00 - 19:00","priority":"1","icon":"","preferredTime":"1","location":{"address":"DEMEL Vienna, Kohlmarkt, Wien, Austria","longitude":16.3672185,"latitude":48.2085962}},"allDay":false,"icon":"","priority":"1","description":"״רצוי להגיע עם מזרק אינסולין, כי אתם הולכים לטעום כאן את כל הקינוחים ההאוסטרים המפורסמים״\nשעות פעילות - 10:00 - 19:00","location":{"address":"DEMEL Vienna, Kohlmarkt, Wien, Austria","longitude":16.3672185,"latitude":48.2085962},"duration":"01:00"},{"id":"425","title":"אופצייה - מבוך בארמון","icon":"","priority":"2","preferredTime":"0","description":"ארמון Schonbrunn palace (מפה)  בארמון Schonbrunn יש גם מבוך מגניב, גן חיות (שניהם בתשלום) ונקודת תצפית יפהפייה על כל אזור הגנים, הארמון והעיר.\n\nשעות פעילות 09:30 - 16:15\nלברר אם צריך להזמין!","start":"2022-11-11T08:00:00.000Z","end":"2022-11-11T09:00:00.000Z","category":"19","className":"priority-2","allDay":false,"location":{"address":"Schönbrunn Palace Park, Schönbrunner Schloßstraße, Vienna, Austria","latitude":48.1802626,"longitude":16.3098086},"extendedProps":{"title":"אופצייה - להסתובב בארמון","icon":"","priority":"2","preferredTime":"0","description":"ארמון Schonbrunn palace (מפה)  בארמון Schonbrunn יש גם מבוך מגניב, גן חיות (שניהם בתשלום) ונקודת תצפית יפהפייה על כל אזור הגנים, הארמון והעיר.\n\nשעות פעילות 09:30 - 16:15\nלברר אם צריך להזמין!","categoryId":"19","location":{"address":"Schönbrunn Palace Park, Schönbrunner Schloßstraße, Vienna, Austria","latitude":48.1802626,"longitude":16.3098086},"category":"19"},"duration":"01:00"},{"start":"2022-11-14T12:00:00.000Z","end":"2022-11-14T14:00:00.000Z","title":"mariahilfer strabe - להסתובב בשדרה של הקניות ליד המלון","id":"368","className":"priority-1","extendedProps":{"id":"368","categoryId":"19","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect","priority":"1","icon":"","preferredTime":"6","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034}},"allDay":false},{"start":"2022-11-11T09:30:00.000Z","end":"2022-11-11T11:00:00.000Z","title":"שדרת Kärntner - חנויות יוקרה","id":"433","className":"priority-2","extendedProps":{"id":"433","categoryId":"5","description":"בשביל יהב","priority":"2","icon":"","preferredTime":"0","location":{"address":"Kärntner Str., 1010 Wien, Austria","latitude":48.2042352,"longitude":16.370533}},"allDay":false,"icon":"","priority":"2","description":"בשביל יהב","location":{"address":"Kärntner Str., 1010 Wien, Austria","latitude":48.2042352,"longitude":16.370533},"duration":"01:30"},{"start":"2022-11-13T05:15:00.000Z","end":"2022-11-13T19:00:00.000Z","title":"טיול יום לכפר הציורי האלשטאט Hallstat","id":"158","className":"priority-1","extendedProps":{"id":"158","categoryId":"19","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים\n\nלברר איך מזמינים ולהזמין מראש\nhttps://www.xn--8dbbm2a.co.il/hallstatt-and-alpine-peaks/\n\nממה שכתוב פה זה 8 בבוקר עד 9 בערב (!!) אם כן זה אומר שצריך לשנות את הלוז\nhttps://www.trvbox.co.il/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9C%D7%95%D7%99%D7%A0%D7%94-%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9E%D7%93%D7%94%D7%99%D7%9D-%D7%9C%D7%98%D7%99%D7%95%D7%9C-%D7%A9%D7%9C-%D7%A9%D7%99%D7%A9%D7%94/#1","priority":"1","icon":"","preferredTime":"0","location":{"address":"Hallstatt, Austria","latitude":47.5622342,"longitude":13.6492617}},"allDay":false,"icon":"","priority":"1","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים\n\nלברר איך מזמינים ולהזמין מראש\nhttps://www.xn--8dbbm2a.co.il/hallstatt-and-alpine-peaks/\n\nממה שכתוב פה זה 8 בבוקר עד 9 בערב (!!) אם כן זה אומר שצריך לשנות את הלוז\nhttps://www.trvbox.co.il/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9C%D7%95%D7%99%D7%A0%D7%94-%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9E%D7%93%D7%94%D7%99%D7%9D-%D7%9C%D7%98%D7%99%D7%95%D7%9C-%D7%A9%D7%9C-%D7%A9%D7%99%D7%A9%D7%94/#1","duration":"13:45","location":{"address":"Hallstatt, Austria","latitude":47.5622342,"longitude":13.6492617}},{"start":"2022-11-11T20:30:00.000Z","end":"2022-11-11T22:00:00.000Z","title":"Vie I Pee בר עם סל","id":"47","className":"priority-1","extendedProps":{"id":"47","categoryId":"9","description":"","priority":"1","icon":"🏀","preferredTime":"5","location":{"address":"Vie i pee, Waldsteingartenstraße, Wien, Austria","latitude":48.2132778,"longitude":16.405193}},"allDay":false,"icon":"🏀","priority":"1","description":"","duration":"01:30","location":{"address":"Vie i pee, Waldsteingartenstraße, Wien, Austria","latitude":48.2132778,"longitude":16.405193}},{"start":"2022-11-12T21:00:00.000Z","end":"2022-11-12T22:00:00.000Z","title":"Pizza Senza Danza","id":"455","className":"priority-1","extendedProps":{"id":"455","categoryId":"9","description":"למי שאוהב פיצה וטכנו זה המקום בשבילכם!!!\nימי שלישי בוינה באופן קבוע יש מסיבה עד השעות הקטנות של הלילה","priority":"1","icon":"","preferredTime":"0","location":{"address":"PIZZA SENZA DANZA, Volksgarten, Vienna, Austria","longitude":16.3611518,"latitude":48.2071009}},"allDay":false},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"Bestens Bar - נאצ׳וס","id":"167","className":"priority-1","extendedProps":{"id":"167","categoryId":"9","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","priority":"1","icon":"","preferredTime":"5","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474}},"allDay":false,"icon":"","priority":"1","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474},"duration":"01:00"},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"פאב 13 קוקטיילים","id":"162","className":"priority-0","extendedProps":{"id":"162","categoryId":"9","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","priority":"0","icon":"","preferredTime":"5","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907}},"allDay":false,"icon":"","priority":"0","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907},"duration":"01:00"},{"id":"457","title":"404 dont ask why","icon":"","priority":"1","preferredTime":"0","description":"מסעדה איטלקית\nלברר ולהזמין מראש","start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","category":"2","className":"priority-1","allDay":false,"location":{"address":"404 Dont ask why, Friedrichstraße, Vienna, Austria","latitude":48.2000944,"longitude":16.3663115},"extendedProps":{"title":"404 dont ask why","icon":"","priority":"1","preferredTime":"0","description":"מסעדה איטלקית\nלברר ולהזמין מראש","categoryId":"2","location":{"address":"404 Dont ask why, Friedrichstraße, Vienna, Austria","latitude":48.2000944,"longitude":16.3663115},"category":"2"},"duration":"01:00"},{"start":"2022-11-12T10:00:00.000Z","end":"2022-11-12T14:30:00.000Z","title":"קניון פרנדורף","id":"155","className":"priority-1","extendedProps":{"id":"155","categoryId":"5","description":"לברר תחבורה ציבורית","priority":"1","icon":"","preferredTime":"6","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909}},"allDay":false,"icon":"","priority":"1","description":"לברר תחבורה ציבורית","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909},"duration":"04:30"},{"start":"2022-11-11T09:30:00.000Z","end":"2022-11-11T11:00:00.000Z","title":"mariahilfer strabe - להסתובב בשדרה של הקניות ליד המלון","id":"453","className":"priority-1","extendedProps":{"id":"453","categoryId":"19","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect\ndunk shop (!!!)","priority":"1","icon":"","preferredTime":"6","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034}},"allDay":false,"icon":"","priority":"1","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect\ndunk shop (!!!)","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034},"duration":"01:30"},{"id":"463","title":"שוק הבארים ברובע המוזאונים","icon":"","priority":"2","preferredTime":"5","description":"שוק הבארים ברובע המוזיאונים (Wintergarden at Museumsquartier)\nשוק המיועד בגדול לקהל הצעיר אבל לא רק. מעין גרסת מועדוני הלילה או בארים של שווקי חג המולד.\nכן אפשר לקנות פונץ' ונקניקיות. וכן, יש לו אורות. אבל כאן מסתיימים קווי הדמיון לשוק חג המולד המסורתי.\nבתי הקפה והמסעדות השונים של רובע המוזיאונים פותחים את השטחים החיצוניים שלהם ע\"י אוהלים מחוממים והופכים למעין בארים או פאבים.\nתצוגות אור חדשניות על גבי המוזיאונים הופכות את האיזור למעין מועדון לילה. \nתקופת פעילות: 3 נובמבר - 8 ינואר\nשעות פתיחה: 16:00-23:00\nתחבורה ציבורית: מטרו קו U3 הכתום תחנות Museumsquartier/Volkstheater\nחשמלית קווים U2Z/D/1/2/46/49/71 תחנת Ring/Volkstheater","start":"2022-11-13T20:00:00.000Z","end":"2022-11-13T21:00:00.000Z","category":"9","className":"priority-2","allDay":false,"location":{"address":"Museumsplatz 1, 1070 Wien, Austria","latitude":48.2026499,"longitude":16.3591421},"extendedProps":{"title":"שוק הבארים ברובע המוזאונים","icon":"","priority":"2","preferredTime":"5","description":"שוק הבארים ברובע המוזיאונים (Wintergarden at Museumsquartier)\nשוק המיועד בגדול לקהל הצעיר אבל לא רק. מעין גרסת מועדוני הלילה או בארים של שווקי חג המולד.\nכן אפשר לקנות פונץ' ונקניקיות. וכן, יש לו אורות. אבל כאן מסתיימים קווי הדמיון לשוק חג המולד המסורתי.\nבתי הקפה והמסעדות השונים של רובע המוזיאונים פותחים את השטחים החיצוניים שלהם ע\"י אוהלים מחוממים והופכים למעין בארים או פאבים.\nתצוגות אור חדשניות על גבי המוזיאונים הופכות את האיזור למעין מועדון לילה. \nתקופת פעילות: 3 נובמבר - 8 ינואר\nשעות פתיחה: 16:00-23:00\nתחבורה ציבורית: מטרו קו U3 הכתום תחנות Museumsquartier/Volkstheater\nחשמלית קווים U2Z/D/1/2/46/49/71 תחנת Ring/Volkstheater","categoryId":"9","location":{"address":"Museumsplatz 1, 1070 Wien, Austria","latitude":48.2026499,"longitude":16.3591421},"category":"9"},"duration":"01:00"},{"start":"2022-11-11T13:30:00.000Z","end":"2022-11-11T14:30:00.000Z","title":"Schnitzelwirt","id":"418","className":"priority-1","extendedProps":{"id":"418","categoryId":"2","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","priority":"1","icon":"🐔","preferredTime":"0","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999}},"allDay":false,"icon":"🐔","priority":"1","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999},"duration":"01:00"},{"id":"526","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","start":"2022-11-11T15:00:00.000Z","end":"2022-11-11T15:30:00.000Z","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083}},"duration":"00:30"},{"start":"2022-11-11T12:00:00.000Z","end":"2022-11-11T13:00:00.000Z","title":"figel müller שניצל וינאי","id":"5","className":"priority-1","extendedProps":{"id":"5","categoryId":"2","description":"שניצל מעולה, להזמין מקום מספיק זמן מראש (!!)","priority":"1","icon":"🐔","preferredTime":"2","location":{"address":"Figlmüller at Wollzeile, Wollzeile, Vienna, Austria","latitude":48.2091901,"longitude":16.3745186}},"allDay":false,"icon":"🐔","priority":"1","description":"שניצל מעולה, להזמין מקום מספיק זמן מראש (!!)","location":{"address":"Figlmüller at Wollzeile, Wollzeile, Vienna, Austria","latitude":48.2091901,"longitude":16.3745186},"duration":"01:00"},{"id":"528","title":"לארוז איתנו","icon":"","priority":"0","preferredTime":"0","description":"- מטען נייד\n- רחפן?\n- טאבלט לטיסה\n- אוזניות\n- חצובה?\n- מברשת ומשחת שיניים\n- תיק רחצה, דאודורנט, בושם\n- תיק איפור יהב\n- תחתונים וגרביים\n- תיקים\n- כובעים\n- מסכות\n- נעליים\n- בגדי ים (תרמה)\n- כפכפים","start":"2022-11-09T22:00:00.000Z","end":"2022-11-10T22:00:00.000Z","category":"14","className":"priority-0","allDay":true,"extendedProps":{"title":"לארוז איתנו","icon":"","priority":"0","preferredTime":"0","description":"- מטען נייד\n- רחפן?\n- טאבלט לטיסה\n- אוזניות\n- חצובה?\n- מברשת ומשחת שיניים\n- תיק רחצה, דאודורנט, בושם\n- תיק איפור יהב\n- תחתונים וגרביים\n- תיקים\n- כובעים\n- מסכות\n- נעליים\n- בגדי ים (תרמה)\n- כפכפים","categoryId":"14"},"duration":"00:00"},{"start":"2022-11-14T08:00:00.000Z","end":"2022-11-14T09:00:00.000Z","title":"Cafe Central Vienna","id":"108","className":"priority-2","extendedProps":{"id":"108","categoryId":"2","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי\nהופיע גם בהיילייט של traveliri\nעוגות, ארוחות בוקר, עיצוב עתיק ויפה\n\nלהשלים - להזמין מראש","priority":"2","icon":"","preferredTime":"1","location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339}},"allDay":false,"icon":"","priority":"2","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי\nהופיע גם בהיילייט של traveliri\nעוגות, ארוחות בוקר, עיצוב עתיק ויפה\n\nלהשלים - להזמין מראש","location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339},"duration":"01:00"},{"start":"2022-11-14T13:30:00.000Z","end":"2022-11-14T14:00:00.000Z","title":"נעליים - יהב - hoglshoes","id":"531","className":"priority-1","extendedProps":{"id":"531","categoryId":"5","description":"מההיילייט Vienna של travelieir:\n״כבר שיתפתי אתכם שכמעט בלתי אפשרי עבורי למצוא נעליים שנוחות לי, ומצאתי חנות אוסטרית בול בטעם שלי עם סנדלים ועקבים הכי רכים ונוחים בעולם!!! לא קרה לי בחיים״","priority":"1","icon":"","preferredTime":"0","location":{"address":"Mariahilfer Str. 55, 1060 Wien, Austria","latitude":48.1992681,"longitude":16.3532196}},"allDay":false,"icon":"","priority":"1","description":"מההיילייט Vienna של travelieir:\n״כבר שיתפתי אתכם שכמעט בלתי אפשרי עבורי למצוא נעליים שנוחות לי, ומצאתי חנות אוסטרית בול בטעם שלי עם סנדלים ועקבים הכי רכים ונוחים בעולם!!! לא קרה לי בחיים״","location":{"address":"Mariahilfer Str. 55, 1060 Wien, Austria","latitude":48.1992681,"longitude":16.3532196},"duration":"00:30"},{"start":"2022-11-14T13:00:00.000Z","end":"2022-11-14T13:30:00.000Z","title":"Dunk Shop Wien","id":"20","className":"priority-1","extendedProps":{"id":"20","categoryId":"5","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","priority":"1","icon":"","preferredTime":"6","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Wien, Austria","latitude":48.19770919999999,"longitude":16.3547291}},"allDay":false,"icon":"","priority":"1","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","duration":"00:30","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Wien, Austria","latitude":48.19770919999999,"longitude":16.3547291}},{"start":"2022-11-11T12:30:00.000Z","end":"2022-11-11T13:00:00.000Z","title":"כיכר stephanplatz","id":"535","className":"priority-1","extendedProps":{"id":"535","categoryId":"16","description":"צמוד לזארה בכיכר סטפן יש דוכן קייזרשמרן של דמל עם ריח משגע (קרעי פנקייקים רכים אוסטרים)","priority":"1","icon":"","preferredTime":"0","location":{"address":"Stephansplatz, Vienna, Austria","latitude":48.2087405,"longitude":16.3736859}},"allDay":false,"icon":"","priority":"1","description":"צמוד לזארה בכיכר סטפן יש דוכן קייזרשמרן של דמל עם ריח משגע (קרעי פנקייקים רכים אוסטרים)","location":{"address":"Stephansplatz, Vienna, Austria","latitude":48.2087405,"longitude":16.3736859},"duration":"00:30"},{"start":"2022-11-11T07:00:00.000Z","end":"2022-11-11T08:00:00.000Z","title":"Café Gloriette - קפה בארמון שנבורן","id":"188","className":"priority-2","extendedProps":{"id":"188","categoryId":"2","description":"המלצה - שטרודל תפוחים\nשעות פעילות - נפתח ב09:00","priority":"2","icon":"","preferredTime":"1","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"openingHours":{"SUNDAY":{"start":"09:00","end":"18:00"},"MONDAY":{"start":"09:00","end":"18:00"},"TUESDAY":{"start":"09:00","end":"18:00"},"WEDNESDAY":{"start":"09:00","end":"18:00"},"THURSDAY":{"start":"09:00","end":"18:00"},"FRIDAY":{"start":"09:00","end":"18:00"},"SATURDAY":{"start":"09:00","end":"18:00"}}},"allDay":false,"icon":"","priority":"2","description":"המלצה - שטרודל תפוחים\nשעות פעילות - נפתח ב09:00","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"duration":"01:00","openingHours":{"SUNDAY":{"start":"09:00","end":"18:00"},"MONDAY":{"start":"09:00","end":"18:00"},"TUESDAY":{"start":"09:00","end":"18:00"},"WEDNESDAY":{"start":"09:00","end":"18:00"},"THURSDAY":{"start":"09:00","end":"18:00"},"FRIDAY":{"start":"09:00","end":"18:00"},"SATURDAY":{"start":"09:00","end":"18:00"}}},{"start":"2022-11-12T06:00:00.000Z","end":"2022-11-12T07:00:00.000Z","title":"fenster cafe vienna - קפה בתוך וופל","id":"197","className":"priority-1","extendedProps":{"id":"197","categoryId":"2","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html\n\nהקפה מעולה!! הכי טוב ששתינו בוינה. אני לקחתי עם קרמל אמיתי וזה היה מושלם. למי שיש מכונה ומטחנה מומלץ לקנות גם פולים הביתה. קנינו במתנה וזה התקבל בהתלהבות","priority":"1","icon":"","preferredTime":"6","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858}},"allDay":false,"icon":"","priority":"1","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html\n\nהקפה מעולה!! הכי טוב ששתינו בוינה. אני לקחתי עם קרמל אמיתי וזה היה מושלם. למי שיש מכונה ומטחנה מומלץ לקנות גם פולים הביתה. קנינו במתנה וזה התקבל בהתלהבות","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858},"duration":"01:00"},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"Das Loft – Unique Bars","id":"54","className":"priority-1","extendedProps":{"id":"54","categoryId":"9","description":"הבר בקומת הגג של מלון סופיטל\nראובן ואורטל היו שם נראה טוב!\n\nארוחת ערב בלוקיישן מטורף על הגג של מלון סופיטל בוינה","priority":"1","icon":"","preferredTime":"0","location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785}},"allDay":false,"icon":"","priority":"1","description":"הבר בקומת הגג של מלון סופיטל\nראובן ואורטל היו שם נראה טוב!\n\nארוחת ערב בלוקיישן מטורף על הגג של מלון סופיטל בוינה","location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785},"duration":"01:00"},{"start":"2022-11-10T14:00:00.000Z","end":"2022-11-10T14:58:00.000Z","title":"מסעדת truman&co המבורגר מושחת","id":"348","className":"priority-2","extendedProps":{"id":"348","categoryId":"2","description":"","priority":"2","icon":"","preferredTime":"0"},"allDay":false,"icon":"","priority":"2","description":"","duration":"00:58"},{"start":"2022-11-12T05:00:00.000Z","end":"2022-11-12T06:00:00.000Z","title":"מלון NH Collection","id":"147","className":"priority-0","extendedProps":{"id":"147","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"openingHours":{"SUNDAY":{"start":"00:00","end":"00:00"}}},"allDay":false,"icon":"","priority":"0","description":"","duration":"01:00","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"openingHours":{"SUNDAY":{"start":"00:00","end":"00:00"}}},{"start":"2022-11-10T21:35:00.000Z","end":"2022-11-10T22:00:00.000Z","title":"צ׳ק אין במלון NH Collection","id":"72","className":"priority-0","extendedProps":{"id":"72","categoryId":"11","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","priority":"0","icon":"","preferredTime":"0"},"allDay":false,"icon":"","priority":"0","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","duration":"00:25"}]
// side bar events
// {"2":[{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","className":"priority-2","category":"2"},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Santos Neubau I Mexican Grill & Bar, Siebensterngasse, Vienna, Austria","latitude":48.2027685,"longitude":16.355773}},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Haas & Haas wine and delicatessen, Ertlgasse, Vienna, Austria","latitude":48.2101743,"longitude":16.373349}},{"id":"207","title":"Fabios מסעדה איטלקית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה איטלקית ברמה מאוד גבוהה והמחירים בהתאם. אנחנו הזמנו מלנזנה שהייתה מעולה, ניקוי עם חצילים ועגבניות וסלט קיסר (שהיה לו טעם של דגים כמו סלט קיסר אמיתי - אני פחות התחברתי)&#10;רצוי להזמין מקום מראש","location":{"address":"Fabios, Tuchlauben, Vienna, Austria","latitude":48.21000089999999,"longitude":16.3698188},"category":"2","className":"priority-0"},{"id":"272","title":"losteria","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"אם אתם בפארק פארטר בערב ומחפשים משהו לאכול (ולא בא לכם על האוכל שיש בתוך הפארק), ממש לידו יש מסעדה איטלקית מקסימה עם פיצות טובות וגדולות (אחת ל2 אנשים לגמרי מספיקה)","location":{"address":""},"category":"2","className":"priority-0"},{"title":"Mae Aurel בית קפה ביסטרו","id":"366","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה חדשה בוינה, בית קפה-ביסטרו מודרני, אכלנו ארוחת בוקר (למי שאוהב אגז בנדיקט - מומלץ בחום!)\nהמסעדה יפהפייה ואווירה נעימה, גם לארוחת צהריים או ערב.\nלברר","location":{"address":"Mae Aurel, Salzgries, Wien, Austria","latitude":48.2128087,"longitude":16.372889},"extendedProps":{"categoryId":"2"},"category":"2","className":"priority-0"},{"title":"Schnitzelwirt","id":"412","icon":"🐔","priority":"1","allDay":false,"preferredTime":"0","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","categoryId":"2","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999},"duration":"01:30","category":"2","className":"priority-1"},{"title":"Steirereck מסעדת מישלן","id":"173","className":"priority-3","extendedProps":{"id":"173","categoryId":"2","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\\nיצאנו מפוצצים.\\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\\n(מתוך: פייסבוק)","priority":"1","icon":"","preferredTime":"5","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958}},"allDay":false,"icon":"","priority":"3","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\nיצאנו מפוצצים.\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\n(מתוך: פייסבוק)\n\nעריכה: ראינו סטורים של זה וזה נראה לא שווה ולא מגרה","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958},"duration":"01:30","category":"2","preferredTime":"0"},{"id":"544","title":"Cafe Landtmann - פרויד","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"ברקפסט בבית קפה אייקוני ואהוב מול בית העירייה שפרויד היה יושב בו בקביעות, בצהריים ובערב יש פה שניצל מצויין","location":{"address":"Café Landtmann, Universitätsring, Vienna, Austria","latitude":48.21154689999999,"longitude":16.3615167},"openingHours":{"SUNDAY":{"start":"07:30","end":"22:00"},"MONDAY":{"start":"07:30","end":"22:00"},"TUESDAY":{"start":"07:30","end":"22:00"},"WEDNESDAY":{"start":"07:30","end":"22:00"},"THURSDAY":{"start":"07:30","end":"22:00"},"FRIDAY":{"start":"07:30","end":"22:00"},"SATURDAY":{"start":"07:30","end":"22:00"}},"category":"2","className":"priority-1","extendedProps":{}},{"id":"546","title":"בית קפה Palatschinkenuchl","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"בית קפה עם ארוחת בוקר שנראית ממש טוב - מהסטורי Vienna של Traveliri\nחביתה עם גבינה וירקות, קפה חמוד, סוגשל פנקייק מגולגל כזה עם קצפת נראה מדהים","category":"2","className":"priority-2","extendedProps":{},"location":{"address":"Heindls Schmarren & Palatschinkenkuchl, Grashofgasse, Vienna, Austria","latitude":48.2101564,"longitude":16.3760576},"openingHours":{"SUNDAY":{"start":"11:00","end":"23:00"},"MONDAY":{"start":"11:00","end":"23:00"},"TUESDAY":{"start":"11:00","end":"23:00"},"WEDNESDAY":{"start":"11:00","end":"23:00"},"THURSDAY":{"start":"11:00","end":"23:00"},"FRIDAY":{"start":"11:00","end":"23:00"},"SATURDAY":{"start":"11:00","end":"23:00"}}},{"id":"548","title":"קפה Palatschinkenuchl","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מהסטורי של traveliri","location":{"address":"Palatschinken Insel, Wagramer Straße, Vienna, Austria","longitude":16.4330775,"latitude":48.2418658},"category":"2","className":"priority-0"}],"5":[{"title":"קניון SCS","id":"14","icon":"","priority":"2","allDay":false,"preferredTime":"6","description":"","categoryId":"5","location":{"address":"Westfield Shopping City Süd (SCS), Vösendorfer Südring, Vösendorf, Austria","latitude":48.10802839999999,"longitude":16.3179302},"duration":"02:00","category":"5","className":"priority-2"},{"title":"Dunk Shop","id":"461","icon":"","priority":"1","allDay":false,"preferredTime":"0","description":"","categoryId":"5","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Vienna, Austria","latitude":48.19770919999999,"longitude":16.3547291},"category":"5","duration":"00:30","className":"priority-1"}],"9":[{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","className":"priority-0","category":"9"},{"id":"218","title":"Josef Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"בר קוקטיילים חמוד וטעים","location":{"address":"Josef Cocktailbar, Sterngasse, Wien, Austria","latitude":48.2116854,"longitude":16.3737393},"category":"9","className":"priority-0"},{"id":"230","title":"Matiki Bar","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"בר קוקטיילים טעים, מיוחד ויפה, מומלץ","location":{"address":"Matiki Bar, Gardegasse, Wien, Austria","latitude":48.2044367,"longitude":16.3550225},"category":"9","className":"priority-2"},{"id":"288","title":"Gruner Kakadu בר קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"חוזרים מחר אבל חייבת לשתף בהמלצה שקיבלנו ממדריך של free walking tour, מקומי אמיתי, על בר בשם גרונר קקדו, בגדול בר עם מלא סגנונות קוקטיילים שווים ממש וגמישים לפי מה שתרצו, איך שמתיישבים מוציאים לך לטעום משהו אלכוהולי על חשבונם, וממשיכים לפנק תוך כדי הערב במשקאות חינם, ממש ברמה שאת הקוקטיילים שכן הזמנו היה לנו קשה לסיים&#10;שירות מקסים וויב מקומי ואחלה בילוי לילי 0 ממליצה ממש&#10;נמצא ברובע 1 במיקום יחסית מרכזי&#10;(המלצה מהפייסבוק - Zemer Shwartz)","location":{"address":"Grüner Kakadu, Marc-Aurel-Straße, Vienna, Austria","latitude":48.212321,"longitude":16.3737978},"category":"9","className":"priority-0"},{"id":"323","title":"Sky Stefel Sky Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"רופטופ בר שיושב ברחוב הקניות מריה הילפר עם אווירה קלילה ונוף מהמם.&#10;בכלליות הסצנה של הרופטופים בוינה תפסה חזק ואפשר לראות עוד הרבה כאלה. עכשיו כשמתקרר לא בטוחה כמה זה רלוונטי וחלק מתחילים להיסגר.","location":{"address":""},"category":"9","className":"priority-0"},{"id":"466","title":"שוק המוגן במתחם Haas&Haas.","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"תיהנו מהאווירה שלפני חג המולד בצורה אחרת לגמרי במתכונת \"חורף בעיר\" בחצר הפנימית הנעימה והמוגנת מפני מזג האוויר של מנזר המסדר הגרמני, ממש מאחורי כנסיית סנט סטפן.\nמחממים את הידיים ליד המדורה הפרטית סביב כל שולחן ושותים את היין החם שנעשה על פי מתכון הבית, מייקב \"Haas & Haas Wein & Fein.kost\", אוכלים שיפודים קטנים על הגריל או מרק חם.\nכל המוצרים והמרכיבים נבחרים בקפידה ובאהבה להנאה מושלמת לפני חג המולד. \nתקופת פעילות: 4 נובמבר - 31 דצמבר\nשעות פתיחה: 14:00-20:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U3 הכתום תחנת Stephansplatz\nאוטובוס קווים 1A/2A/3A תחנת Stephansplatz","location":{"address":"Stephansplatz 4, 1010 Vienna, Austria","latitude":48.2079175,"longitude":16.3732139},"category":"9","className":"priority-2","extendedProps":{}},{"id":"470","title":"השוק מול קתדרלת סט. סטפן (Stephansplatz)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק מול קתדרלת סט. סטפן (Stephansplatz) - במרכז הרובע הראשון ניצב לו הסמל של וינה, קתדרלת סט. סטפן, מסביבה מתקיים שוק כריסמס אחד העמוסים אבל היפים.\nרעיוני, מסורתי ושונה,תכונות אלה מתארות את השוק, המועבר על ידי דוכני שוק חג המולד סביב הקתדרלה הידועה, אלה באים לידי ביטוי הן מבחינת המראה והעיצוב של הצריפים,התאורה כמו גם באומנויות והמלאכה.\nהמוקד העיקרי של שוק חג המולד בסטפנספלאץ הוא על מגוון מוצרים איכותי מאוד של מציגים. זה יכלול בעיקר מוצרים באיכות גבוהה המיוצרים באוסטריה.\nתקופת פעילות: 11 נובמבר - 26 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U3 הכתום תחנת Stephansplatz\nאוטובוס קווים 1A/2A/3A תחנת Stephansplatz","location":{"address":"Stephansplatz 1010, Innere Stadt Vienna, Austria","latitude":48.2087405,"longitude":16.3736859},"category":"9","className":"priority-2"},{"id":"475","title":"שוק הסימטאות בשכונת שפיטלברג (Spittelberg)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"מאחורי רובע המוזיאונים, אחרי שביל מדרגות ורחוב צדדי קטן מתקיים לו אחד משווקי הכריסמס המיוחדים באירופה, מאחורי רובע המוזיאונים שוכן לו הרובע ה-7, רובע שפיטלברג העתיק, בין סימטאות השכונה מתקיים שוק אומנות מיוחד עם אווירת חג קסומה. \nתקופת פעילות: 10 נובמבר - 23 דצמבר\nשעות פתיחה: 14:00-21:00\nתחבורה ציבורית: חשמלית קו 49 תחנת Stiftgasse (להגיע עם המטרו קו U3 הכתום לתחנת Volkstheater ושם לעלות על החשמלית)","location":{"address":"Gutenberggasse, 1070 Vienna, Austria","latitude":48.2033711,"longitude":16.3557115},"category":"9","className":"priority-2"},{"id":"481","title":"השוק הבוטיקי בארמון בלוודר (Belvedere Palace)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"אחד השווקים הקטנים אך היפים בוינה. \nתקופת פעילות: 11 נובמבר - 26 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: חשמלית קווים D/O/1/18 תחנת Quartier Belvedere\nחשמלית קן 71 תחנת Unteres Belvedere\nניתן להגיע במטרו קו U1 האדום לתחנת Hauptbahnhof וללכת כמה דקות ברגל.\nכתובת: Prinz-Eugen-Strasse 27, 1030 Vienna","location":{"address":"Prinz Eugen-Straße 27, 1030 Vienna, Austria","latitude":48.19135799999999,"longitude":16.38013},"category":"9","className":"priority-2"},{"id":"488","title":"השוק מול בית האופרה (Advent pleasure market at the Opera House)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק מול בית האופרה (Advent pleasure market at the Opera House) - שוק מקורה מול בית האופרה מציע עבודות יד ומאכלים אוסטרים ואיטלקים.\nתקופת פעילות: 11 נובמבר - 31 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U4 הירוק תחנת Karlsplatz\nחשמלית קווים 1/2/62/71/D תחנת Kärntner Ring. Oper\nכתובת: Mahlerstrasse 6, 1010 Vienna","location":{"address":"Mahlerstraße 6, 1010 Vienna, Austria","latitude":48.2026079,"longitude":16.3710647},"category":"9","className":"priority-2"},{"id":"496","title":"השוק בקמפוס אוניברסיטת וינה","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק בקמפוס אוניברסיטת וינה - כפר חג המולד המציע מסע דרך 9 הפרובינציות האוסטריות ומזמין אתכם להכיר ולחוות את האזורים האוסטריים, את התרבות ואת שמחת החיים.\nבעלי מלאכה וחברות מרחבי אוסטריה הופכים את כפר חג המולד לעולם מרשים של פינוק ואחווה, בו ניתן לחוות את חג המולד האוסטרי המסורתי וליהנות ממנו בכל גווניו.\nהילדים ייהנו מקרוסלת הילדים הנוסטלגית ומסילת חג המולד, ואילו למבוגרים יוצעו אוכל ושתייה אוסטריים מתשעת הפרובינציות האוסטריות ובקתות גורמה.\nתקופת פעילות: 11 נובמבר - 23 דצמבר\nשעות פתיחה: 14:00-22:00\nתחבורה ציבורית: חשמלית קווים 1/5/33/43/44 תחנת Lange Gasse\nאוטובוס קו 13A תחנת Skodagasse\nניתן להגיע במטרו קו U2 לתחנת Schottentor וללכת ברגל לכיוון הכנסיה הגדולה\nכתובת: Alserstrasse/Spitalgasse, Hof 1, 1090 Vienna","location":{"address":"Hof 1, Spitalgasse, Vienna, Austria","latitude":48.2151171,"longitude":16.3525406},"category":"9","className":"priority-2"},{"id":"505","title":"השוק בכיכר אמ-הוף (Am Hof Advent Market)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק בכיכר אמ-הוף (Am Hof Advent Market) - השוק בלב העיר העתיקה בין בית המשפט והמבנים ההסטורים מציע 76 דוכנים של כמעט הכל! נחשב לאחד השווקים היפים בוינה. \nתקופת פעילות: 11 נובמבר - 23 דצמבר.\nשעות פתיחה: 11:00-21:00.\nתחבורה ציבורית: מטרו קו U3 הכתום תחנת Herrengasse\nאוטובוס קווים 1A/3A תחנת Schwertgasse\nכתובת: Am Hof, 1010 Vienna","location":{"address":"Am Hof, 1010 Vienna, Austria","latitude":48.2106478,"longitude":16.3678283},"category":"9","className":"priority-2"},{"id":"550","title":"Robin Schulz Prater DOME 7 ","icon":"","duration":"03:00","priority":"2","preferredTime":"0","description":"22:00 - 06:00\n\nhttps://www.eventbrite.at/e/robin-schulz-prater-dome-wien-tickets-415323131667","location":{"address":"Prater Dome, Gaudeegasse 7, Wien, Austria","latitude":48.2171617,"longitude":16.3971541},"openingHours":{"SUNDAY":{"start":"22:00","end":"06:00"},"MONDAY":{"start":"22:00","end":"06:00"}},"category":"9","className":"priority-2","extendedProps":{}}],"11":[],"14":[],"16":[{"id":"537","title":"רחוב Graben","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"רחובות הקניות המרכזיים - Graben ו Kartner","location":{"address":"Graben, Wien, Austria","latitude":48.2087073,"longitude":16.369696},"category":"16","className":"priority-0","extendedProps":{}},{"id":"540","title":"רחוב kartner","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"רחובות הקניות המרכזיים - Graben ו Kartner","location":{"address":"Kärntner Straße, Wien, Austria","latitude":48.2042352,"longitude":16.370533},"category":"16","className":"priority-0","extendedProps":{}}],"19":[{"id":"438","title":"קזינו","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"","location":{"address":"Casino Wien, Kärntner Straße, Wien, Austria","longitude":16.3708676,"latitude":48.2044512},"category":"19","className":"priority-0"},{"id":"515","title":"השוק הקיסרי בכיכר מיכאלרפלאץ בכניסה למתחם ארמון הופבורג (Imperial and Royal Christmas Market)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק הקיסרי בכיכר מיכאלרפלאץ בכניסה למתחם ארמון הופבורג (Imperial and Royal Christmas Market) - שוק חג המולד הקיסרי והמלכותי במיכאלרפלאץ הוא ייחודי כמו כתובתו האצילית.\nלכיכר מיכאלר מגיע לא פחות מכך, בהיותה אחד המקומות המכובדים ביותר בוינה, בראש ובראשונה הוא נמצא בסמוך למקום מושבה של המלוכה הקודמת, ארמון הופבורג.\nהאדריכלות מרשימה ומלכותית כראוי. מיכאלרפלאץ מוקף בהיסטוריה: קיסרים, קיסריות, נסיכי כתר ונסיכות התגוררו בהופבורג וחגגו כינוסי חג מולד נוצצים בפאר מדהים. \nתקופת פעילות: 10 נובמבר - 24 דצמבר.\nשעות פתיחה: 20:00 - 10:00.\nתחבורה ציבורית: מטרו קו U3 הכתום תחנת Herrengasse\nאוטובוס קווים 1A/2A תחנת Michaelerplatz\nכתובת: Michaelerplatz, 1010 Vienna","location":{"address":"Michaelerplatz, 1010 Vienna, Austria","latitude":48.2079208,"longitude":16.3668509},"category":"19","className":"priority-2"}]}
// all events
// [{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","className":"priority-2","category":"2"},{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","category":"2"},{"id":"5","title":"figel müller שניצל וינאי","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"הרבה כבר נאמר, לדעתנו השניצל מעולה. פשוט טעים. הגענו לארוחת ערבף לא היה תור בכלל בסניף השני שלהם (לא המקורי). שווה ביותר!!!","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":""}},{"id":"5","title":"שניצל וינאי טוב","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"לברר","category":"2"},{"id":"9","title":"El Gaucho Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"","className":"priority-1","category":"2"},{"id":"9","title":"El Gaucho Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"","category":"2"},{"id":"14","title":"קניון SCS","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","className":"priority-2","category":"5"},{"id":"14","title":"קניון SCS","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","category":"5"},{"id":"20","title":"Dunk Shop Wien","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","className":"priority-1","category":"5"},{"id":"20","title":"Dunk Shop Wien","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","category":"5"},{"id":"27","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-1","category":"2"},{"id":"27","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"2"},{"id":"35","title":"Hard Rock Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822}},{"id":"35","title":"Hard Rock Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","category":"2"},{"id":"45","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-1","category":"2"},{"id":"45","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"2"},{"id":"47","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-0","category":"9","extendedProps":{"categoryId":"9"}},{"id":"47","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"9"},{"id":"50","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","className":"priority-0","category":"2","extendedProps":{"categoryId":"2"}},{"id":"50","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","category":"2"},{"id":"54","title":"Das Loft – Unique Bars","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"הבר בקומת הגג של מלון סופיטל ","className":"priority-2","category":"9","extendedProps":{"categoryId":"9"},"location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785}},{"id":"54","title":"Das Loft – Unique Bars","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"רופטופ בר.\nלברר","category":"9"},{"id":"59","title":"ופיאנו Vapiano","icon":"","duration":"01:00","priority":"2","preferredTime":"2","description":"","className":"priority-2","category":"2"},{"id":"59","title":"ופיאנו Vapiano","icon":"","duration":"01:00","priority":"2","preferredTime":"2","description":"","category":"2"},{"id":"65","title":"טיסה מתל אביב לוינה","icon":"","duration":"02:55","priority":"0","preferredTime":"0","description":"טיסה עם wizzair\nטיסה מספר w6 2812\nמשך הטיסה 03:55\nמזוודה אחת בהלוך - 20 קילו","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"65","categoryId":"11","description":"טיסה עם wizzair\nטיסה מספר w6 2812\nמשך הטיסה 03:55\nמזוודה אחת בהלוך - 20 קילו","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},{"id":"65","title":"טיסה מתל אביב לוינה","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים - שעות הטיסה, מתי, איזה טרמינל וכו","category":"11"},{"id":"72","title":"צ׳ק אין במלון NH Collection","icon":"","duration":"00:30","priority":"0","preferredTime":"0","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"72","categoryId":"11","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},{"id":"72","title":"צ׳ק אין במלון _____","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים","category":"11"},{"id":"80","title":"צ׳ק אאוט במלון NH Collection","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"צ׳ק אאוט בשעה 12:00","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"80","categoryId":"11","description":"צ׳ק אאוט בשעה 12:00","priority":"0","icon":"","preferredTime":"0"}},{"id":"80","title":"צ׳ק אאוט במלון ______","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים","category":"11"},{"id":"89","title":"טיסה חזור מוינה לתל אביב","icon":"","duration":"04:20","priority":"0","preferredTime":"0","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"89","categoryId":"11","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},{"id":"89","title":"טיסה חזור","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים - איפה, מתי, איזה טרמינל וכו׳","category":"11"},{"id":"99","title":"Vienna's roller-coaster restaurant","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"https://www.youtube.com/watch?v=2BKm33Df48c","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633}},{"id":"99","title":"Vienna's roller-coaster restaurant","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"https://www.youtube.com/watch?v=2BKm33Df48c","category":"2"},{"id":"101","title":"לברר אם דברים פתוחים בראשון","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","className":"priority-0","category":"14"},{"id":"101","title":"לברר אם דברים פתוחים בראשון","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","category":"14"},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Santos Neubau I Mexican Grill & Bar, Siebensterngasse, Vienna, Austria","latitude":48.2027685,"longitude":16.355773}},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","category":"2"},{"id":"108","title":"Cafe Central Vienna","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339}},{"id":"108","title":"Cafe Central Vienna","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"מקור: היילייט של tair mordoch ממאסטר שף","category":"2"},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Haas & Haas wine and delicatessen, Ertlgasse, Vienna, Austria","latitude":48.2101743,"longitude":16.373349}},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","category":"2"},{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","className":"priority-0","category":"9"},{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","category":"9"},{"id":"126","title":"The Loft","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","className":"priority-0","category":"2"},{"id":"126","title":"The Loft","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"2"},{"title":"Funky Monkey Bar","id":"129","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","className":"priority-0","extendedProps":{"categoryId":"9"}},{"title":"Funky Monkey Bar","id":"129","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9"},{"title":"Funky Monkey Bar","id":"131","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","extendedProps":{"categoryId":"9"},"className":"priority-0"},{"title":"Funky Monkey Bar","id":"131","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","extendedProps":{"categoryId":"9"}},{"title":"The Loft","id":"133","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"9","extendedProps":{"categoryId":"9"},"className":"priority-0"},{"title":"The Loft","id":"133","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"9","extendedProps":{"categoryId":"9"}},{"id":"135","title":"אוכל חדש","icon":"","duration":"01:00","priority":"1","preferredTime":"1","description":"","category":"2","className":"priority-1"},{"id":"135","title":"אוכל חדש","icon":"","duration":"01:00","priority":"1","preferredTime":"1","description":"","category":"2"},{"id":"138","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"138"},"duration":"00:30"},{"id":"142","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"142"},"duration":"00:30"},{"id":"147","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"147"},"duration":"00:30"},{"id":"153","title":"פארק מים אוברלה - Oberlaa Therme","icon":"","duration":"02:30","priority":"1","preferredTime":"5","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266},"category":"19"},{"id":"155","title":"קניון פרנדורף","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909},"category":"5","extendedProps":{"categoryId":"5"}},{"id":"158","title":"טיול יום לכפר הציורי האלשטאט Hallstat","icon":"","duration":"08:00","priority":"1","preferredTime":"0","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים","category":"19"},{"id":"162","title":"פאב 13 קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907},"category":"9"},{"id":"167","title":"Bestens Bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474},"category":"9"},{"id":"173","title":"Steirereck מסעדת מישלן","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\nיצאנו מפוצצים.\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\n(מתוך: פייסבוק)","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958},"category":"2","extendedProps":{"categoryId":"2"}},{"id":"180","title":"בית קפה Kylo","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"בית קפה על נהר הדנובה עם ארוחות בוקר מגוונות וטעימות\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12789266-Reviews-Klyo-Vienna.html","location":{"address":"KLYO, Uraniastraße, Wien, Austria","latitude":48.2115613,"longitude":16.383796},"category":"2"},{"id":"188","title":"Café Gloriette - קפה בארמון שנבורן","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה - שטרודל תפוחים","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"category":"2"},{"id":"197","title":"fenster cafe vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858},"category":"2"},{"id":"207","title":"Fabios מסעדה איטלקית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה איטלקית ברמה מאוד גבוהה והמחירים בהתאם. אנחנו הזמנו מלנזנה שהייתה מעולה, ניקוי עם חצילים ועגבניות וסלט קיסר (שהיה לו טעם של דגים כמו סלט קיסר אמיתי - אני פחות התחברתי)\nרצוי להזמין מקום מראש","location":{"address":"Fabios, Tuchlauben, Vienna, Austria","latitude":48.21000089999999,"longitude":16.3698188},"category":"2"},{"id":"218","title":"Josef Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"בר קוקטיילים חמוד וטעים","location":{"address":"Josef Cocktailbar, Sterngasse, Wien, Austria","latitude":48.2116854,"longitude":16.3737393},"category":"9"},{"id":"230","title":"Matiki Bar","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"בר קוקטיילים טעים, מיוחד ויפה, מומלץ","location":{"address":"Matiki Bar, Gardegasse, Wien, Austria","latitude":48.2044367,"longitude":16.3550225},"category":"9"},{"id":"243","title":"Lamee Rooftop","icon":"","duration":"01:00","priority":"2","preferredTime":"4","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269},"category":"9"},{"id":"257","title":"Mae Aurel בית קפה ביסטרו","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה חדשה בוינה, בית קפה-ביסטרו מודרני, אכלנו ארוחת בוקר (למי שאוהב אגז בנדיקט - מומלץ בחום!)\nהמסעדה יפהפייה ואווירה נעימה, גם לארוחת צהריים או ערב.\nלברר","location":{"address":"Mae Aurel, Salzgries, Wien, Austria","latitude":48.2128087,"longitude":16.372889},"category":"19"},{"id":"272","title":"losteria","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"אם אתם בפארק פארטר בערב ומחפשים משהו לאכול (ולא בא לכם על האוכל שיש בתוך הפארק), ממש לידו יש מסעדה איטלקית מקסימה עם פיצות טובות וגדולות (אחת ל2 אנשים לגמרי מספיקה)","location":{"address":""},"category":"2"},{"id":"288","title":"Gruner Kakadu בר קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"חוזרים מחר אבל חייבת לשתף בהמלצה שקיבלנו ממדריך של free walking tour, מקומי אמיתי, על בר בשם גרונר קקדו, בגדול בר עם מלא סגנונות קוקטיילים שווים ממש וגמישים לפי מה שתרצו, איך שמתיישבים מוציאים לך לטעום משהו אלכוהולי על חשבונם, וממשיכים לפנק תוך כדי הערב במשקאות חינם, ממש ברמה שאת הקוקטיילים שכן הזמנו היה לנו קשה לסיים\nשירות מקסים וויב מקומי ואחלה בילוי לילי 0 ממליצה ממש\nנמצא ברובע 1 במיקום יחסית מרכזי\n(המלצה מהפייסבוק - Zemer Shwartz)","location":{"address":"Grüner Kakadu, Marc-Aurel-Straße, Vienna, Austria","latitude":48.212321,"longitude":16.3737978},"category":"9"},{"id":"305","title":"שוק נאשמרקט בלילה","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165},"category":"9"},{"id":"323","title":"Sky Stefel Sky Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"רופטופ בר שיושב ברחוב הקניות מריה הילפר עם אווירה קלילה ונוף מהמם.\nבכלליות הסצנה של הרופטופים בוינה תפסה חזק ואפשר לראות עוד הרבה כאלה. עכשיו כשמתקרר לא בטוחה כמה זה רלוונטי וחלק מתחילים להיסגר.","location":{"address":""},"category":"9"},{"id":"325","title":"404 dont ask why bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"מסעדה איטלקית ממש מומלצת","location":{"address":"404 Dont ask why, Friedrichstraße, Wien, Austria","latitude":48.2000944,"longitude":16.3663115},"category":"9"},{"id":"327","title":"מסעדת truman&co המבורגר מושחת","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","location":{"address":"Truman & Co., Israel","longitude":34.9111665,"latitude":31.9869703},"category":"19","allDay":false,"className":"priority-2","extendedProps":{"id":"327","categoryId":"19","description":"","priority":"2","icon":"","preferredTime":"0","location":{"address":"Truman & Co., Israel","longitude":34.9111665,"latitude":31.9869703}}},{"id":"330","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","category":"11","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"11","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"category":"11"},"duration":"00:30"},{"id":"334","title":"בית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להתארגן לטיסה","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414},"category":"16","allDay":false,"className":"priority-0","extendedProps":{"id":"334","categoryId":"16","description":"להתארגן לטיסה","priority":"0","icon":"","preferredTime":"0","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414}}},{"id":"336","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106},"category":"9","extendedProps":{"categoryId":"9"}},{"id":"339","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","category":"19","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"19","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001}},"duration":"00:30"}]
