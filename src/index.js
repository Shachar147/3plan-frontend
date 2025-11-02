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
import WhatsNewPage from './v2/views/whats-new/whats-new';
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
} from './components/map-container/map-container-utils';
import { BiEventsService } from './services/bi-events.service';
import useIsAdmin from './custom-hooks/use-is-admin';
import InviteLink from './pages/invite-link/invite-link';
import MainPageV2 from './v2/views/main-page/main-page';
import { newDesignRootPath } from './v2/utils/consts';
import { FeatureFlagsService } from './utils/feature-flags';
import LoginPageV2 from './v2/views/login-page/login-page';
import PlanPageV2 from './v2/views/plan-page/plan-page';
import TripTemplatePageV2 from './v2/views/trip-template-page/trip-template-page';
import AdminPageV2 from './v2/admin/views/admin-page/admin-page';

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

	function getPlaceCategory(place, categories) {
		const options = categories
			.sort((a, b) => a.id - b.id)
			.map((x, index) => ({
				value: x.id,
				label: x.icon ? `${x.icon} ${x.title}` : x.title,
			}));

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

		let isFound = false;
		let result;
		place.types.forEach((type) => {
			if (typesToCategories[type] && !isFound) {
				result = typesToCategories[type];
				isFound = true;
			}
		});

		return result;
	}

	function updatePlaceDetails(place, overrideName) {
		runInAction(() => {
			// const descriptionArr = [];
			// if (place.international_phone_number) {
			// 	descriptionArr.push(`phone: ${place.international_phone_number}`);
			// }
			// if (place.rating) {
			// 	descriptionArr.push(`Google Rating: ${place.rating}/5 (${place.user_ratings_total} total)`);
			// }
			// console.log('before', eventStore.modalValues);

			// update name
			if (overrideName) {
				eventStore.modalValues['name'] = place.name;
			} else {
				eventStore.modalValues['name'] = eventStore.modalValues['name'] ?? place.name;
			}

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
			// eventStore.modalValues['description'] =
			// 	eventStore.modalValues['description'] ?? descriptionArr.length > 0
			// 		? descriptionArr.join('\n')
			// 		: undefined;

			// update category
			const options = eventStore.categories
				.sort((a, b) => a.id - b.id)
				.map((x, index) => ({
					value: x.id,
					label: x.icon ? `${x.icon} ${x.title}` : x.title,
				}));

			if (overrideName) {
				eventStore.modalValues['category'] = undefined;
			}

			if (place.name && !eventStore.modalValues['category']) {
				if (isMatching(place.name, HOTEL_KEYWORDS) || isMatching(place.website ?? '', HOTEL_KEYWORDS)) {
					eventStore.modalValues['category'] = options.find((x) => isMatching(x.label, HOTEL_KEYWORDS));
				}
			}

			if (place.types && !eventStore.modalValues['category']) {
				eventStore.modalValues['category'] = getPlaceCategory(place, eventStore.categories);
			}

			// if (place.types && !eventStore.modalValues['category']) {
			// 	const storeCategory = options.find((x) => isMatching(x.label, STORE_KEYWORDS));
			// 	const food = options.find((x) => isMatching(x.label, FOOD_KEYWORDS));
			// 	const dessertOrFood =
			// 		(isMatching(place.name, DESSERTS_KEYWORDS)
			// 			? options.find((x) => isMatching(x.label, DESSERTS_KEYWORDS))
			// 			: undefined) ?? food;
			// 	const nightLife = options.find((x) => isMatching(x.label, NIGHTLIFE_KEYWORDS));
			// 	const attractions = options.find((x) => isMatching(x.label, ATTRACTIONS_KEYWORDS));
			// 	const tourism = options.find((x) => isMatching(x.label, TOURIST_KEYWORDS));
			// 	const general = options.find((x) => isMatching(x.label, ['general', 'כללי']));
			// 	const nature = options.find((x) => isMatching(x.label, NATURE_KEYWORDS));
			//
			// 	const typesToCategories = {
			// 		bar: nightLife,
			// 		// accounting: undefined,
			// 		airport: options.find((x) => isMatching(x.label, FLIGHT_KEYWORDS)),
			// 		amusement_park: attractions,
			// 		aquarium: attractions,
			// 		// art_gallery: undefined,
			// 		// atm: undefined,
			// 		bakery: dessertOrFood,
			// 		food: dessertOrFood,
			// 		store: storeCategory,
			// 		bicycle_store: storeCategory,
			// 		book_store: storeCategory,
			// 		// bank: undefined,
			// 		// beauty_salon: undefined,
			// 		bowling_alley: attractions,
			// 		// bus_station: undefined,
			// 		cafe: dessertOrFood,
			// 		campground: undefined,
			// 		// car_dealer: undefined,
			// 		car_rental: general,
			// 		// car_repair: undefined,
			// 		// car_wash: undefined,
			// 		casino: nightLife,
			// 		// cemetery: undefined,
			// 		church: tourism,
			// 		city_hall: tourism,
			// 		clothing_store: storeCategory,
			// 		convenience_store: storeCategory,
			// 		// courthouse: undefined,
			// 		// dentist: undefined,
			// 		department_store: storeCategory,
			// 		// doctor: undefined,
			// 		// drugstore: undefined,
			// 		// electrician: undefined,
			// 		electronics_store: storeCategory,
			// 		embassy: tourism,
			// 		// fire_station: undefined,
			// 		// florist: undefined,
			// 		// funeral_home: undefined,
			// 		furniture_store: storeCategory,
			// 		// gas_station: undefined,
			// 		gym: undefined,
			// 		// hair_care: undefined,
			// 		hardware_store: storeCategory,
			// 		hindu_temple: tourism,
			// 		home_goods_store: storeCategory,
			// 		// hospital: undefined,
			// 		// insurance_agency: undefined,
			// 		jewelry_store: storeCategory,
			// 		// laundry: undefined,
			// 		// lawyer: undefined,
			// 		library: tourism,
			// 		// light_rail_station: undefined,
			// 		liquor_store: storeCategory,
			// 		// local_government_office: undefined,
			// 		// locksmith: undefined,
			// 		// lodging: undefined,
			// 		// meal_delivery: undefined,
			// 		// meal_takeaway: undefined,
			// 		// mosque: undefined,
			// 		// movie_rental: undefined,
			// 		movie_theater: attractions,
			// 		// moving_company: undefined,
			// 		museum: undefined,
			// 		night_club: nightLife,
			// 		natural_feature: nature,
			// 		// painter: undefined,
			// 		// park: undefined,
			// 		// parking: undefined,
			// 		// pet_store: undefined,
			// 		// pharmacy: undefined,
			// 		// physiotherapist: undefined,
			// 		// plumber: undefined,
			// 		// police: undefined,
			// 		// post_office: undefined,
			// 		// primary_school: undefined,
			// 		// real_estate_agency: undefined,
			// 		restaurant: food,
			// 		// roofing_contractor: undefined,
			// 		// rv_park: undefined,
			// 		// school: undefined,
			// 		// secondary_school: undefined,
			// 		shoe_store: storeCategory,
			// 		shopping_mall: storeCategory,
			// 		spa: attractions,
			// 		stadium: attractions,
			// 		// storage: undefined,
			// 		// subway_station: undefined,
			// 		supermarket: undefined,
			// 		// synagogue: undefined,
			// 		// taxi_stand: undefined,
			// 		tourist_attraction: tourism ?? attractions,
			// 		// train_station: undefined,
			// 		// transit_station: undefined,
			// 		// travel_agency: undefined,
			// 		// university: undefined,
			// 		// veterinary_care: undefined,
			// 		zoo: attractions,
			// 	};
			//
			// 	// console.log({ types: place.types });
			//
			// 	place.types.forEach((type) => {
			// 		if (!eventStore.modalValues['category'] && typesToCategories[type]) {
			// 			eventStore.modalValues['category'] = typesToCategories[type];
			// 		}
			// 	});
			// }

			// todo complete - current_opening_hours.weekday_text
			// todo complete - map icon - https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/bar-71.png
			// todo complete - google maps url - https://maps.google.com/?cid=15387026663019329345
			// category - place.types
			// console.log('after', eventStore.modalValues);

			eventStore.forceUpdate += 1;
		});
	}

	window.getPlaceCategory = getPlaceCategory;

	window.updatePlaceDetails = updatePlaceDetails;

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

	window.transformOpeningHours = transformOpeningHours;

	window.initLocationPicker = (
		className = 'location-input',
		variableName = 'selectedLocation',
		placeChangedCallback,
		eventStore,
		overrideName = false
	) => {
		const autoCompleteRef = document.querySelector(`.${className}`);
		const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef);

		// Store autocomplete instance globally so walkthrough can access it
		if (!window.googleAutocompleteInstances) {
			window.googleAutocompleteInstances = {};
		}
		window.googleAutocompleteInstances[className] = autocomplete;

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

				updatePlaceDetails(place, overrideName);
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

	// fix error when user have no token - used to display white screen.
	// reason - getToken was undefined and then the authorization sent Bearer undefined.
	if (getToken()) {
		axios.defaults.headers.Authorization = `Bearer ${getToken()}`;
	}

	function isDevMode() {
		return window.location.href.indexOf('localhost') !== -1 || window.location.href.indexOf('0.0.0.0') !== -1;
	}

	const isAdmin = useIsAdmin();

	const isNewDesign = FeatureFlagsService.isNewDesignEnabled(true);

	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route exact path={newDesignRootPath} element={<MainPageV2 />} />
					<Route
						exact
						path="/"
						element={
							getUser() == undefined ? (
								isNewDesign ? (
									<LoginPageV2 />
								) : (
									<LoginPage />
								)
							) : isNewDesign ? (
								<MainPageV2 />
							) : (
								<LandingPage />
							)
						}
					/>
					<Route exact path="/home" element={<LandingPage />} />
					<Route path={`${newDesignRootPath}/login`} element={<LoginPageV2 />} />
					<Route path="/login" element={isNewDesign ? <LoginPageV2 /> : <LoginPage />} />
					<Route path={`${newDesignRootPath}/register`} element={<LoginPageV2 />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/logout" element={<LogoutPage />} />
					<Route exact path="/getting-started" element={<GettingStartedPage />} />
					<Route exact path="/whats-new" element={<WhatsNewPage />} />
					<Route exact path="/my-trips" element={<MyTrips />} />
					<Route path="/plan/create/:tripName/:locale" element={<MainPage createMode={true} />} />
					<Route path="/plan/:tripName/:locale" element={<MainPage />} />
					<Route path="/plan/:tripName/" element={<MainPage />} />
					<Route path={`${newDesignRootPath}/plan/:tripName/`} element={<PlanPageV2 />} />
					<Route path={`${newDesignRootPath}/template/:templateId/`} element={<TripTemplatePageV2 />} />
					<Route path={`${newDesignRootPath}/whats-new`} element={<WhatsNewPage />} />
					<Route path="/plan" element={<MainPage />} />
					<Route path="/inviteLink" element={<InviteLink />} />
					<Route path="/theme" element={<ThemeExample />} />
					<Route path="/language" element={<MobileLanguageSelectorPage />} />

					{/* Admin-only routes */}
					{isAdmin ? (
						<>
							<Route path={`${newDesignRootPath}/admin`} element={<AdminPageV2 />} />
							<Route path="/admin" element={<AdminDashboard />} />
							<Route path="/admin/places-tinder" element={<AdminDashboard />} />
							<Route path="/admin/destination/:destination" element={<AdminManageDestinationItems />} />
							<Route path="/admin/item/:id" element={<AManageItem />} />
						</>
					) : (
						<>
							<Route
								path={`${newDesignRootPath}/admin`}
								element={getUser() == undefined ? <LoginPage /> : <MainPageV2 />}
							/>
							<Route path="/admin" element={getUser() == undefined ? <LoginPage /> : <MainPageV2 />} />
						</>
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

// London - 12.10.25 backup
/*
{
    "id": 14027,
    "userId": 1,
    "name": "לונדון-32",
    "dateRange": {
        "end": "2025-12-30",
        "start": "2025-12-25"
    },
    "categories": [
        {
            "id": 1,
            "icon": "🧞‍♂️",
            "title": "כללי",
            "titleKey": "CATEGORY.GENERAL",
            "description": "CATEGORY.GENERAL.DESCRIPTION"
        },
        {
            "id": 2,
            "icon": "🛫",
            "title": "טיסות",
            "titleKey": "CATEGORY.FLIGHTS",
            "description": "CATEGORY.FLIGHTS.DESCRIPTION"
        },
        {
            "id": 3,
            "icon": "🏩",
            "title": "בתי מלון",
            "titleKey": "CATEGORY.HOTELS",
            "description": "CATEGORY.HOTELS.DESCRIPTION"
        },
        {
            "id": 4,
            "icon": "🍕",
            "title": "אוכל",
            "titleKey": "CATEGORY.FOOD",
            "description": "CATEGORY.FOOD.DESCRIPTION"
        },
        {
            "id": 5,
            "icon": "🍦",
            "title": "קינוחים",
            "titleKey": "CATEGORY.DESSERTS",
            "description": "CATEGORY.DESSERTS.DESCRIPTION"
        },
        {
            "id": 6,
            "icon": "🍹",
            "title": "ברים וחיי לילה",
            "titleKey": "CATEGORY.BARS_AND_NIGHTLIFE",
            "description": "CATEGORY.BARS_AND_NIGHTLIFE.DESCRIPTION"
        },
        {
            "id": 7,
            "icon": "🛒",
            "title": "קניות",
            "titleKey": "CATEGORY.SHOPPING",
            "description": "CATEGORY.SHOPPING.DESCRIPTION"
        },
        {
            "id": 8,
            "icon": "⭐",
            "title": "אטרקציות",
            "titleKey": "CATEGORY.ATTRACTIONS",
            "description": "CATEGORY.ATTRACTIONS.DESCRIPTION"
        },
        {
            "id": 9,
            "icon": "👻",
            "title": "גימיקים",
            "titleKey": "CATEGORY.GIMMICKS",
            "description": "CATEGORY.GIMMICKS.DESCRIPTION"
        },
        {
            "id": 10,
            "icon": "🌺",
            "title": "טבע",
            "titleKey": "CATEGORY.NATURE",
            "description": "CATEGORY.NATURE.DESCRIPTION"
        },
        {
            "id": 11,
            "icon": "🗽",
            "title": "תיירות",
            "titleKey": "CATEGORY.TOURISM",
            "description": "CATEGORY.TOURISM.DESCRIPTION"
        },
        {
            "id": 13,
            "icon": "🎄",
            "title": "שווקי כריסמס"
        },
        {
            "id": 15,
            "icon": "🗒",
            "title": "הערות"
        }
    ],
    "allEvents": [],
    "calendarEvents": [
        {
            "id": "904",
            "end": "2025-12-26T22:00:00.000Z",
            "icon": "",
            "start": "2025-12-25T22:00:00.000Z",
            "title": "סיילי חורף - Boxing Day - הנחות ענק בכל הרשתות.",
            "allDay": true,
            "category": 15,
            "duration": "00:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": " זהו היום הכי גדול בשנה לסיילים באנגליה. החנויות נפתחות מוקדם בבוקר (חלקן אפילו ב־6:00–7:00) והמבצעים הם הכי אגרסיביים – בעיקר באופנה, אלקטרוניקה, מותגים יוקרתיים, ועוד. זה גם אומר שיש עומס מטורף, במיוחד באוקספורד סטריט, ריג'נט סטריט וקניונים כמו Westfield.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1039",
            "end": "2025-12-27T22:00:00.000Z",
            "icon": "",
            "start": "2025-12-26T22:00:00.000Z",
            "title": "עדיין יש סיילים, אבל המלאי של הדברים השווים כבר מתחיל להיגמר.",
            "allDay": true,
            "category": 15,
            "duration": "00:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "עדיין יש סיילים, אבל המלאי של הדברים השווים כבר מתחיל להיגמר. האווירה רגועה יותר, פחות דחיפות ולחץ בחנויות, וזה יכול להיות נעים יותר למי שלא אוהב צפיפות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1035",
            "end": "2025-12-28T22:00:00.000Z",
            "icon": "",
            "start": "2025-12-27T22:00:00.000Z",
            "title": "הסיילים נמשכים, אבל עם פחות בחירות ויותר שאריות.",
            "allDay": true,
            "category": 15,
            "duration": "00:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "הסיילים נמשכים, אבל עם פחות בחירות ויותר שאריות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "973",
            "end": "2025-12-29T22:00:00.000Z",
            "icon": "",
            "start": "2025-12-28T22:00:00.000Z",
            "title": "הסיילים נמשכים, אבל עם פחות בחירות ויותר שאריות.",
            "allDay": true,
            "category": 15,
            "duration": "00:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "הסיילים נמשכים, אבל עם פחות בחירות ויותר שאריות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "923",
            "end": "2025-12-25T07:00:00.000Z",
            "icon": "",
            "start": "2025-12-25T06:00:00.000Z",
            "title": "טיפים לקניות בלונדון",
            "allDay": false,
            "category": "15",
            "duration": "01:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "💡 טיפים לקניות בלונדון\n\nאאוטלטים: Bicester Village (כ־50 דקות ברכבת מלונדון) – גן עדן למותגי יוקרה בהנחות.\n\nסיילי חורף (Boxing Day, 26.12) – הנחות ענק בכל הרשתות.\n\nחנויות דגל: Regent Street, Oxford Street, Bond Street – מקבלים חוויית מותג מלאה וקולקציות אקסקלוסיביות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "44",
            "end": "2025-12-28T20:00:00.000Z",
            "icon": "",
            "price": "230",
            "start": "2025-12-28T19:00:00.000Z",
            "title": "לונדון אוורה - עולם חדש של חוויית קוקטיילים 🍹✨",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----avora-london--a-new-world-cocktail-experience---------------------------------------------------1.jpg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----avora-london--a-new-world-cocktail-experience---------------------------------------------------2.jpg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----avora-london--a-new-world-cocktail-experience---------------------------------------------------3.jpg",
            "category": "6",
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "לונדון אוורה - עולם חדש של חוויית קוקטיילים 🍹✨",
                "latitude": 51.5302648,
                "eventName": "לונדון אוורה - עולם חדש של חוויית קוקטיילים 🍹✨",
                "longitude": -0.0741205
            },
            "moreInfo": "https://www.avora-experience.co.uk/",
            "priority": "1",
            "className": "priority-1",
            "description": "חווית קוקטיילים תיאטרלית סוחפת! היכנסו לעולם חדש וקסום מלא בקוקטיילים וצאו להרפתקה מיוחדת במינה. 🍹✨",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1053",
            "end": "2025-12-27T16:00:00.000Z",
            "icon": "",
            "price": "346",
            "start": "2025-12-27T14:30:00.000Z",
            "title": "Squid Game: The Experience",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-1.webp\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-2.webp\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-3.jpeg",
            "category": 9,
            "currency": "ils",
            "duration": "01:30",
            "editable": true,
            "location": {
                "address": "Squid Game: The Experience",
                "latitude": 51.5070658,
                "eventName": "Squid Game: The Experience",
                "longitude": 0.0281905
            },
            "moreInfo": "https://www.facebook.com/share/v/1Y6tcMoQz1/?mibextid=wwXIfr",
            "priority": "1",
            "className": "priority-1",
            "description": "חוויית משחקי הדיונון בלונדון היא פעילות חווייתית מבוססת על סדרת הלהיט של נטפליקס משחקי הדיונון. המשתתפים נכנסים לנעלי המתמודדים ומשתתפים באתגרים פיזיים ומנטליים בהשראת הסדרה – ללא הדחות אמיתיות כמובן! האירוע כולל תפאורה מושקעת, שחקנים אינטראקטיביים ומשחקים מאתגרים שמייצרים חוויה סוחפת ובטוחה. מתאים במיוחד למבוגרים וחובבי הסדרה שמחפשים פעילות קבוצתית ייחודית.\n\nמשך הפעילות: כ־70 דקות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-28T16:26:05.500Z"
        },
        {
            "id": "1090",
            "end": "2025-12-27T20:30:00.000Z",
            "icon": "",
            "start": "2025-12-27T19:30:00.000Z",
            "title": "שווקי כריסמס",
            "allDay": false,
            "category": "13",
            "duration": "01:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "לברר מה פתוח ועד איזה תאריך ואיזה שעה\n\nhttps://www.visitlondon.com/things-to-do/whats-on/christmas/best-christmas-markets-in-london",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "18",
            "end": "2025-12-27T08:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T08:30:00.000Z",
            "title": "נקודת תצפית מומלצת ללונדון איי 🎡",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---london-eye-recommended-photo-app-------------------------------------1.jpeg",
            "category": 11,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "נקודת תצפית מומלצת ללונדון איי 🎡",
                "latitude": 51.5039953,
                "eventName": "נקודת תצפית מומלצת ללונדון איי 🎡",
                "longitude": -0.1230784
            },
            "moreInfo": "https://www.instagram.com/p/DAtABgWN2Ur/?igsh=MTRjcWFndTd1ZTJ1dA==",
            "priority": "1",
            "className": "priority-1",
            "description": "נקודת תצפית מצויינת לתמונות יפהפיות של הגלגל הענק בלונדון ✨🇬🇧",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "11",
            "end": "2025-12-27T10:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T09:45:00.000Z",
            "title": "מנהרת הגרפיטי לונדון 🎨",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---the-graffiti-tunnel---------------------------1.jpg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---the-graffiti-tunnel---------------------------2.jpeg",
            "category": 9,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "מנהרת הגרפיטי לונדון 🎨",
                "latitude": 51.50183390000001,
                "eventName": "מנהרת הגרפיטי לונדון 🎨",
                "longitude": -0.1155436
            },
            "moreInfo": "https://ustoa.com/blog/the-group-company-blog/london-graffiti-tunnel/",
            "priority": "1",
            "className": "priority-1",
            "description": "מנהרות הגרפיטי ברחוב ליק הן חגיגה של אמנות אורבנית, אוכל ובידור חי מווטרלו. שמונה קשתות רכבת לשעבר ליד מנהרת הגרפיטי המפורסמת",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-29T10:34:42.800Z"
        },
        {
            "id": "74",
            "end": "2025-12-29T14:45:00.000Z",
            "icon": "",
            "price": "346",
            "start": "2025-12-29T13:30:00.000Z",
            "title": "Squid Game: The Experience",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-1.webp\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-2.webp\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/squid-game--the-experience-3.jpeg",
            "category": 9,
            "currency": "ils",
            "duration": "01:15",
            "editable": true,
            "location": {
                "address": "Squid Game: The Experience",
                "latitude": 51.5070658,
                "eventName": "Squid Game: The Experience",
                "longitude": 0.0281905
            },
            "moreInfo": "https://www.facebook.com/share/v/1Y6tcMoQz1/?mibextid=wwXIfr",
            "priority": "1",
            "className": "priority-1",
            "description": "חוויית משחקי הדיונון בלונדון היא פעילות חווייתית מבוססת על סדרת הלהיט של נטפליקס משחקי הדיונון. המשתתפים נכנסים לנעלי המתמודדים ומשתתפים באתגרים פיזיים ומנטליים בהשראת הסדרה – ללא הדחות אמיתיות כמובן! האירוע כולל תפאורה מושקעת, שחקנים אינטראקטיביים ומשחקים מאתגרים שמייצרים חוויה סוחפת ובטוחה. מתאים במיוחד למבוגרים וחובבי הסדרה שמחפשים פעילות קבוצתית ייחודית.\n\nמשך הפעילות: כ־70 דקות.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": 1,
            "end": "2025-12-25T18:25:00.000Z",
            "icon": "",
            "start": "2025-12-25T15:00:00.000Z",
            "title": "טיסה LY317 מTLV לLHR טרמינל 3",
            "allDay": false,
            "images": "https://www.elal.com/SiteCollectionImages/Carousel_HomePage/General/9400-01-9648-26_dreamliner_376X368.jpg",
            "category": 2,
            "duration": "03:25",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Heathrow Airport (LHR), Hounslow, UK",
                "latitude": 51.4679903,
                "longitude": -0.4550471
            },
            "moreInfo": "https://www.heathrow.com/",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "",
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "977",
            "end": "2025-12-26T08:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T07:30:00.000Z",
            "title": "Ben's Cookies",
            "allDay": false,
            "images": "https://res.cloudinary.com/westfielddg/image/upload/w_1500/f_auto/q_auto/westfield-media/uk/retailer/logo-background-image/ap76hyfvzvfdu17tdkco.jpg",
            "category": 5,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Ben's Cookies, Oxford Street, London, UK",
                "latitude": 51.515772,
                "eventName": "Ben's Cookies",
                "longitude": -0.136444
            },
            "moreInfo": "http://www.benscookies.com/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "19:00",
                        "start": "11:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "889",
            "end": "2025-12-26T09:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T08:45:00.000Z",
            "title": "ZARA",
            "allDay": false,
            "images": "https://www.oxfordstreet.co.uk/wp-content/uploads/fly-images/241908/zara-1300x1300.jpg",
            "category": 7,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "ZARA, Oxford Street, London, UK",
                "latitude": 51.515362,
                "eventName": "ZARA",
                "longitude": -0.1400881
            },
            "moreInfo": "https://www.zara.com/gb/en/stores-locator/zara-london-east_oxford-s3436",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "11:30"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:30"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "148",
            "end": "2025-12-26T09:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T09:25:00.000Z",
            "title": "NBA Store London",
            "allDay": false,
            "images": "https://www.hoopsfix.com/wp-content/uploads/2024/04/NBA-Store-London-Oxford-Street.png",
            "category": 7,
            "currency": null,
            "duration": "00:20",
            "editable": true,
            "location": {
                "address": "NBA Store London, Oxford Street, London, UK",
                "latitude": 51.5150354,
                "eventName": "NBA Store London",
                "longitude": -0.1428186
            },
            "moreInfo": "https://www.nbastore.eu/en/?_s=bm-LIDS-RETAIL-GMB",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "745",
            "end": "2025-12-26T10:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T09:45:00.000Z",
            "title": "New Balance",
            "allDay": false,
            "images": "https://cdn.rt.emap.com/wp-content/uploads/sites/2/2016/10/10235823/New-Balance-London-Flagship-Store-10-1.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "New Balance, Oxford Street, London, UK",
                "latitude": 51.5148668,
                "eventName": "New Balance",
                "longitude": -0.1437116
            },
            "moreInfo": "https://www.newbalance.co.uk/",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "982",
            "end": "2025-12-26T10:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T10:00:00.000Z",
            "title": "Intimissimi",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuxgsWLiik6TFdkGfeqdziTfKDppwPb7RfVA&s",
            "category": 7,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Intimissimi, Oxford Street, London, UK",
                "latitude": 51.5144309,
                "eventName": "Intimissimi",
                "longitude": -0.1500014
            },
            "moreInfo": "https://www.intimissimi.com/uk/stores/england/greater_london/london_368_370_oxford_street/II31.html?utm_medium=organic&utm_source=google&utm_campaign=local&utm_term=GB-II31&y_source=1_MTQ4NzA5MjItNzE1LWxvY2F0aW9uLndlYnNpdGU%3D",
            "priority": "2",
            "className": "priority-2",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "19:00",
                        "start": "11:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "988",
            "end": "2025-12-26T11:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T10:15:00.000Z",
            "title": "Selfridges - חנות עם skims",
            "allDay": false,
            "images": "https://www.allsaints.com/dw/image/v2/BHHD_PRD/on/demandware.static/-/Sites/default/dwd03a9904/SelfridgesLondon%20-%20EXTERNAL.jpg?sw=1264&sh=700&sm=cut&q=70\nhttps://media.timeout.com/images/101302843/750/422/image.jpg",
            "category": 7,
            "currency": null,
            "duration": "01:30",
            "editable": true,
            "location": {
                "address": "Selfridges, Oxford Street, London, UK",
                "latitude": 51.5144233,
                "eventName": "Selfridges - חנות עם skims",
                "longitude": -0.152767
            },
            "moreInfo": "https://www.selfridges.com/GB/en/features/info/stores/london/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "11:30"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "752",
            "end": "2025-12-26T12:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T11:45:00.000Z",
            "title": "AllSaints",
            "allDay": false,
            "images": "https://www.allsaints.com/dw/image/v2/BHHD_PRD/on/demandware.static/-/Sites/default/dwc5fd5f35/REGENT_STREET.jpg?sw=1264&sh=700&sm=cut&q=70",
            "category": 7,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "AllSaints, Regent Street, London, UK",
                "latitude": 51.5142587,
                "eventName": "AllSaints",
                "longitude": -0.1413411
            },
            "moreInfo": "https://www.allsaints.com/store-locator/all-stores/united-kingdom/london/regent-street/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "11:30"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "698",
            "end": "2025-12-26T13:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T12:30:00.000Z",
            "title": "Cartier",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQov5jRIbK3otKpItlb2rjpmTCK1DERxKV5Tw&s",
            "category": 7,
            "currency": null,
            "duration": "00:45",
            "editable": true,
            "location": {
                "address": "Cartier, New Bond Street, London, UK",
                "latitude": 51.509711,
                "eventName": "Cartier",
                "longitude": -0.1418681
            },
            "moreInfo": "https://www.cartier.com/en-gb",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "17:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "131",
            "end": "2025-12-26T13:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T13:15:00.000Z",
            "title": "Ralph Lauren",
            "allDay": false,
            "images": "https://cdn.rt.emap.com/wp-content/uploads/sites/2/2021/04/23154046/Ralph-lauren-scaled.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "RALPH LAUREN London Flagship Store, Bond Street, London, UK",
                "latitude": 51.5097286,
                "eventName": "Ralph Lauren",
                "longitude": -0.1416014
            },
            "moreInfo": "https://www.ralphlauren.co.uk/?utm_source=Google&utm_medium=Yext",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "700",
            "end": "2025-12-26T15:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T14:30:00.000Z",
            "title": "Prada London Old Bond St.",
            "allDay": false,
            "images": "https://uk.tortoisepath.com/wp-content/uploads/2024/11/Prada-Old-Bond-Street-London-London-United-Kingdom-TortoisePathcom-8.jpeg",
            "category": 7,
            "currency": null,
            "duration": "00:45",
            "editable": true,
            "location": {
                "address": "Prada London Old Bond St., Old Bond Street, London, UK",
                "latitude": 51.50906,
                "eventName": "Prada London Old Bond St.",
                "longitude": -0.1408134
            },
            "moreInfo": "https://www.prada.com/?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_term=S104",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "771",
            "end": "2025-12-26T15:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T15:15:00.000Z",
            "title": "Hollister Co.",
            "allDay": false,
            "images": "https://media.gettyimages.com/id/1229771353/photo/hollister-store-on-regent-street.jpg?s=1024x1024&w=gi&k=20&c=fIorClz2B-Yo5CsqsLnD-pPAMr1HicNaTfGP6rzT-sI=",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Hollister Co., Regent Street, London, UK",
                "latitude": 51.5098983,
                "eventName": "Hollister Co.",
                "longitude": -0.13754
            },
            "moreInfo": "https://www.hollisterco.com/shop/us/clothing-stores/US/London/GB/31270",
            "priority": "2",
            "className": "priority-2",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "11:30"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "774",
            "end": "2025-12-26T16:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T15:45:00.000Z",
            "title": "Tommy Hilfiger",
            "allDay": false,
            "images": "https://schwitzke.com/wp-content/uploads/2022/12/01_Tommy-Hilfiger_Flagship-Store_Regent-Street_London_Fashion_Architecture_Retail-Design_Construction_Schwitzke_1920-1200px.webp",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Tommy Hilfiger, Regent Street, London, UK",
                "latitude": 51.51134279999999,
                "eventName": "Tommy Hilfiger",
                "longitude": -0.1387456
            },
            "moreInfo": "https://uk.tommy.com/store/london/138-regent-street-aq00",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "11:30"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1134",
            "end": "2025-12-26T16:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T16:15:00.000Z",
            "title": "ALO",
            "allDay": false,
            "images": "https://cdn.rt.emap.com/wp-content/uploads/sites/2/2024/08/01102527/20240731_Alo_RowbenLantion_0013-copy-880x1100.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "ALO, Regent Street, London, UK",
                "latitude": 51.51158170000001,
                "eventName": "ALO",
                "longitude": -0.1390425
            },
            "moreInfo": "https://www.aloyoga.com/?utm_source=extnet&utm_medium=yext",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1137",
            "end": "2025-12-26T17:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T16:45:00.000Z",
            "title": "Massimo Dutti London Regent St. Store",
            "allDay": false,
            "images": "https://cdn.rt.emap.com/wp-content/uploads/sites/2/2014/08/09104411/Massimo_Dutti_15th_July_2014_5-1.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Massimo Dutti London Regent St. Store, Regent Street, London, UK",
                "latitude": 51.5118137,
                "eventName": "Massimo Dutti London Regent St. Store",
                "longitude": -0.1391883
            },
            "moreInfo": "https://www.massimodutti.com/gb/en/store-locator/london-regent-s4356",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1141",
            "end": "2025-12-26T17:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T17:15:00.000Z",
            "title": "Calvin Klein Jeans",
            "allDay": false,
            "images": "https://www.londondesigneroutlet.com/wp-content/uploads/2023/06/calvin-klein-london-designer-outlet-00.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Calvin Klein Jeans, Regent Street, London, UK",
                "latitude": 51.5121134,
                "eventName": "Calvin Klein Jeans",
                "longitude": -0.1399991
            },
            "moreInfo": "https://www.calvinklein.co.uk/store/en/london/170-regent-street-aa14",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1146",
            "end": "2025-12-26T18:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T17:45:00.000Z",
            "title": "Lacoste",
            "allDay": false,
            "images": "https://image1.lacoste.com/dw/image/v2/AAQM_PRD/on/demandware.static/Sites-SE-Site/Library-Sites-LacosteContent/en_SE/dw89c53c91/ss23/lacoste-regent-sreet-front.jpg?imwidth=320&impolicy=custom",
            "category": 7,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Lacoste, Regent Street, London, UK",
                "latitude": 51.5125494,
                "eventName": "Lacoste",
                "longitude": -0.1398215
            },
            "moreInfo": "https://www.lacoste.com/gb/stores/unitedkingdom/london/lacosteregentstreet-5499?utm_source=yext&utm_medium=referral&utm_campaign=GMB&utm_term=Lacoste_Regent_Street&utm_content=5499",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "115",
            "end": "2025-12-26T08:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T08:00:00.000Z",
            "title": "UNIQLO",
            "allDay": false,
            "images": "https://cdn.mos.cms.futurecdn.net/7k5tdRNAanUsCgwYnYHxef-1200-80.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:45",
            "editable": true,
            "location": {
                "address": "UNIQLO, Oxford Street, London, UK",
                "latitude": 51.5158277,
                "eventName": "UNIQLO",
                "longitude": -0.1386588
            },
            "moreInfo": "https://www.uniqlo.com/uk/en/home?utm_source=google&utm_campaign=local&utm_medium=organic",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1127",
            "end": "2025-12-26T11:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T11:15:00.000Z",
            "title": "JENKI Matcha Selfridges",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv0kpR_mmOJGJzMcM0ITOD_aiRKSaVpWlvuA&s",
            "category": 4,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "JENKI Matcha Selfridges, Oxford Street, London, UK",
                "latitude": 51.5147133,
                "eventName": "JENKI Matcha Selfridges",
                "longitude": -0.1534113
            },
            "moreInfo": "http://www.jenki.co.uk/",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "22:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1093",
            "end": "2025-12-26T21:00:00.000Z",
            "icon": "",
            "start": "2025-12-26T20:00:00.000Z",
            "title": "שווקי כריסמס",
            "allDay": false,
            "images": "https://www.kayak.co.uk/rimg/dimg/dynamic/5/2023/09/2b885434acd6addc21abc0dc48ede6e3.webp",
            "category": 13,
            "duration": "01:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "לברר מה פתוח ועד איזה תאריך ואיזה שעה\n\nhttps://www.visitlondon.com/things-to-do/whats-on/christmas/best-christmas-markets-in-london",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "226",
            "end": "2025-12-26T21:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T20:00:00.000Z",
            "title": "Amazónico",
            "allDay": false,
            "images": "https://www.amazonicorestaurant.com/wp-content/uploads/2024/09/191106_Amazonico19798-C.jpg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Amazónico, Berkeley Square, London, UK",
                "latitude": 51.5095799,
                "eventName": "Amazónico",
                "longitude": -0.1447093
            },
            "moreInfo": "https://amazonicorestaurant.com/london/",
            "priority": "1",
            "className": "priority-1",
            "classNames": "priority-1 ordered",
            "description": "אפשר להזמין גג חודשיים קדימה\nhttps://www.amazonicorestaurant.com/london/",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "01:00",
                        "start": "12:00"
                    }
                ]
            },
            "preferredTime": "5",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "295",
            "end": "2025-12-26T07:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T07:00:00.000Z",
            "title": "Eggslut Fitzrovia",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF4rV2QUPEF6WHwAXlVvr1Pf4Qor49e9hgWw&s\nhttps://static.wixstatic.com/media/7fb91c_fb9d55e3f9a646c0943baf6c33fb7fc4~mv2.jpg/v1/fill/w_274,h_182,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Copy%20of%20EGGSLUT%20INTERIORS%2001-5103.jpg",
            "category": 4,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Eggslut Fitzrovia, Percy Street, London, UK",
                "latitude": 51.5185701,
                "eventName": "Eggslut Fitzrovia",
                "longitude": -0.1325406
            },
            "moreInfo": "https://www.eggslut.uk/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "17:00",
                        "start": "08:00"
                    }
                ]
            },
            "preferredTime": "1",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1165",
            "end": "2025-12-26T22:00:00.000Z",
            "icon": "",
            "start": "2025-12-25T22:00:00.000Z",
            "title": "לבוא עם נעליים נוחות!! הרבה הליכה",
            "allDay": true,
            "category": 15,
            "duration": "00:00",
            "editable": true,
            "priority": "0",
            "className": "priority-0",
            "description": "",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1106",
            "end": "2025-12-26T18:15:00.000Z",
            "icon": "",
            "start": "2025-12-26T07:00:00.000Z",
            "title": "יום קניות",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSqINxjbgu6HwqQHal5LCVlV6h3VN1NtHwgQ&s",
            "category": 1,
            "duration": "11:15",
            "editable": false,
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "אם נספיק הכל מהר ויהיה זמן ספייר, אפשר ללכת ל:\n1. קרנבי (office shoe store, brandy mellivle)\n2. בר רכבת נטושה\n3. כיכר פיקדילי וכל אלה\n\nהוזמן",
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": 2,
            "end": "2025-12-25T20:20:00.000Z",
            "icon": "",
            "start": "2025-12-25T19:20:00.000Z",
            "title": "נסיעה משדה התעופה למלון",
            "allDay": false,
            "images": "https://media.npr.org/assets/img/2015/10/21/london-taxi-getty_custom-c3451b43475dea1954309e07a8b8828875774366.jpg",
            "category": 1,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Heathrow Airport (LHR), Hounslow, UK",
                "latitude": 51.4679903,
                "longitude": -0.4550471
            },
            "moreInfo": "https://www.london-luton.co.uk/",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "max airport shuttle service - \n+44 7967 8346345\nהוזמן",
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "934",
            "end": "2025-12-26T14:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T13:45:00.000Z",
            "title": "Ralph's Coffee at New Bond Street - בית קפה ראלף לורן",
            "allDay": false,
            "images": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvPxcF93MJBXQKeLz_aVwzM8B1m7WUR-6vQQ&s",
            "category": 9,
            "currency": null,
            "duration": "00:45",
            "editable": true,
            "location": {
                "address": "Ralph's Coffee at New Bond Street, Bond Street, London, UK",
                "latitude": 51.5097602,
                "eventName": "Ralph's Coffee at New Bond Street - בית קפה ראלף לורן",
                "longitude": -0.1414875
            },
            "moreInfo": "https://www.ralphlauren.co.uk/",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "18:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1032",
            "end": "2025-12-27T07:00:00.000Z",
            "icon": "",
            "start": "2025-12-27T06:00:00.000Z",
            "title": "Numa London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "8",
            "end": "2025-12-28T07:00:00.000Z",
            "icon": "",
            "start": "2025-12-28T06:00:00.000Z",
            "title": "Numa London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "9",
            "end": "2025-12-29T07:00:00.000Z",
            "icon": "",
            "start": "2025-12-29T06:00:00.000Z",
            "title": "Numa London - צ'ק אאוט",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:00",
            "editable": false,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - צ'ק אאוט",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "1088",
            "end": "2025-12-27T16:00:00.000Z",
            "icon": "",
            "start": "2025-12-27T14:30:00.000Z",
            "title": "Numa London - מנוחה במלון",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:30",
            "editable": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - מנוחה במלון",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": " ",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1104",
            "end": "2025-12-28T18:15:00.000Z",
            "icon": "",
            "start": "2025-12-28T17:00:00.000Z",
            "title": "Numa London - התארגנות במלון",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": "3",
            "duration": "01:15",
            "editable": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - התארגנות במלון",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "description": "",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1080",
            "end": "2025-12-27T18:45:00.000Z",
            "icon": "",
            "start": "2025-12-27T17:30:00.000Z",
            "title": "Numa London - התארגנות במלון",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": "3",
            "duration": "01:15",
            "editable": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - התארגנות במלון",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "description": "",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1062",
            "end": "2025-12-28T14:45:00.000Z",
            "icon": "",
            "start": "2025-12-28T14:30:00.000Z",
            "title": "Numa London - לשים את הקניות בחדר",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - לשים את הקניות בחדר",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "description": "",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-28T14:53:57.400Z"
        },
        {
            "id": "1073",
            "end": "2025-12-28T16:45:00.000Z",
            "icon": "",
            "start": "2025-12-28T15:00:00.000Z",
            "title": "Numa London - מנוחה במלון",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": "3",
            "duration": "01:45",
            "editable": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - מנוחה במלון",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "description": " ",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-28T16:33:35.200Z"
        },
        {
            "id": "1048",
            "end": "2025-12-25T21:00:00.000Z",
            "icon": "",
            "start": "2025-12-25T20:20:00.000Z",
            "title": "Numa London - צ'ק אין",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "00:40",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - צ'ק אין",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "7",
            "end": "2025-12-26T07:00:00.000Z",
            "icon": "",
            "start": "2025-12-26T06:00:00.000Z",
            "title": "Numa London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "6",
            "end": "2025-12-26T19:30:00.000Z",
            "icon": "",
            "start": "2025-12-26T18:30:00.000Z",
            "title": "Numa London - לחזור למלון ולהתארגן",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477-Numa-London-1.jpeg",
            "category": 3,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "eventName": "Numa London - לחזור למלון ולהתארגן",
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "320",
            "end": "2025-12-27T08:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T07:00:00.000Z",
            "title": "Duck & Waffle",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5162529_-0.0811942-Duck---Waffle-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5162529_-0.0811942-Duck---Waffle-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5162529_-0.0811942-Duck---Waffle-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Duck & Waffle, Bishopsgate, London, UK",
                "latitude": 51.5162529,
                "longitude": -0.0811942
            },
            "moreInfo": "https://duckandwaffle.com/edinburgh/?utm_source=gbp&utm_medium=organic&utm_campaign=edinburgh_gbp",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "preferredTime": "1",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1098",
            "end": "2025-12-27T10:30:00.000Z",
            "icon": "",
            "start": "2025-12-27T08:30:00.000Z",
            "title": "Carnaby Street",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-2.jpeg",
            "category": 7,
            "duration": "02:00",
            "editable": true,
            "location": {
                "address": "Carnaby Street, London, UK",
                "latitude": 51.5130159,
                "longitude": -0.1386764
            },
            "moreInfo": "https://maps.google.com/?q=Carnaby+St,+Carnaby,+London+W1F,+UK&ftid=0x487604d511378c85:0xda5fe61b4e8aa161",
            "priority": "10",
            "className": "priority-10",
            "description": "דה אופיס,\nברנדי מאליבל,\nבר רכבת נטושה",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1000",
            "end": "2025-12-27T19:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T18:45:00.000Z",
            "title": "Outernet London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51561270000001_-0.1299262-Outernet-London-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51561270000001_-0.1299262-Outernet-London-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51561270000001_-0.1299262-Outernet-London-2.jpeg",
            "category": 9,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Outernet London, Charing Cross Rd, London, UK",
                "latitude": 51.51561270000001,
                "longitude": -0.1299262
            },
            "moreInfo": "http://www.outernet.com/",
            "priority": "10",
            "className": "priority-10",
            "description": "מתחם בידור אימרסיבי בלונדון עם מסכים ענקיים מסביב!",
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "22:30",
                        "start": "10:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "23:30",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1067",
            "end": "2025-12-27T10:30:00.000Z",
            "icon": "",
            "start": "2025-12-27T08:30:00.000Z",
            "title": "הרחובות הראשיים כמו Regent Street, Oxford Street, Covent Garden, Mayfair",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-2.jpeg",
            "category": 13,
            "duration": "02:00",
            "editable": true,
            "location": {
                "address": "Regent Street, Mayfair, London, UK",
                "latitude": 51.5125217,
                "longitude": -0.140186
            },
            "moreInfo": "https://maps.google.com/?q=Regent+St.,+London,+UK&ftid=0x487604d502268421:0x6a7d62889992f993",
            "priority": "10",
            "className": "priority-10",
            "description": "הרחובות הללו מתמלאים באורות, קישוטים ותצוגות מרהיבות בלילה. ",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1022",
            "end": "2025-12-27T09:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T08:45:00.000Z",
            "title": "Parliament Square - תמונה אייקונית עם הביג בן",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008254_-0.1274807-Parliament-Square-----------------------------0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008254_-0.1274807-Parliament-Square-----------------------------1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008254_-0.1274807-Parliament-Square-----------------------------2.jpeg",
            "category": 11,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Parliament Square, London, UK",
                "latitude": 51.5008254,
                "longitude": -0.1274807
            },
            "moreInfo": "https://maps.google.com/?q=Parliament+Sq,+London+SW1,+UK&ftid=0x487604c4ed80e753:0xc5e245185be41f37",
            "priority": "0",
            "className": "priority-0",
            "description": "תמונה אייקונית עם תא הטלפון האדום מול הביג בן. (יש תור)",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "820",
            "end": "2025-12-27T09:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T09:00:00.000Z",
            "title": "Westminster Abbey",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4994245_-0.1275639-Westminster-Abbey-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4994245_-0.1275639-Westminster-Abbey-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4994245_-0.1275639-Westminster-Abbey-2.jpeg",
            "category": 11,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Westminster Abbey, London, UK",
                "latitude": 51.4994245,
                "longitude": -0.1275639
            },
            "moreInfo": "https://www.westminster-abbey.org/",
            "priority": "2",
            "className": "priority-2",
            "description": null,
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "556",
            "end": "2025-12-27T09:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T09:15:00.000Z",
            "title": "Big Ben",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50072919999999_-0.1246254-Big-Ben-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50072919999999_-0.1246254-Big-Ben-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50072919999999_-0.1246254-Big-Ben-2.jpeg",
            "category": 11,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Big Ben, London, UK",
                "latitude": 51.50072919999999,
                "longitude": -0.1246254
            },
            "moreInfo": "https://www.parliament.uk/bigben",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1030",
            "end": "2025-12-27T09:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T09:30:00.000Z",
            "title": "Westminster Bridge - הגשר האייקוני",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008638_-0.1219645-Westminster-Bridge-----------------0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008638_-0.1219645-Westminster-Bridge-----------------1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5008638_-0.1219645-Westminster-Bridge-----------------2.jpeg",
            "category": 11,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Westminster Bridge, London, UK",
                "latitude": 51.5008638,
                "longitude": -0.1219645
            },
            "moreInfo": "https://maps.google.com/?cid=15462990761877659806",
            "priority": "1",
            "className": "priority-1",
            "description": "אם אתם מחפשים את הלוקיישן הזה - תחצו את גשר ווסטמיניסטר ותרדו מתחתיו.",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "712",
            "end": "2025-12-27T10:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T10:00:00.000Z",
            "title": "Southbank Centre Winter Market",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5050468_-0.1180041-Southbank-Centre-Winter-Market-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5050468_-0.1180041-Southbank-Centre-Winter-Market-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5050468_-0.1180041-Southbank-Centre-Winter-Market-2.jpeg",
            "category": 13,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "Southbank Centre Winter Market, The Queen's Walk, London, UK",
                "latitude": 51.5050468,
                "longitude": -0.1180041
            },
            "moreInfo": "https://www.southbankcentre.co.uk/whats-on/winter-market-2021",
            "priority": "0",
            "className": "priority-0",
            "description": null,
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "23:00",
                        "start": "11:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "22:00",
                        "start": "11:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "22:00",
                        "start": "11:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "22:00",
                        "start": "11:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "23:00",
                        "start": "11:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "22:00",
                        "start": "11:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "22:00",
                        "start": "11:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-27T10:50:53.800Z"
        },
        {
            "id": "491",
            "end": "2025-12-27T13:30:00.000Z",
            "icon": "",
            "price": "281",
            "start": "2025-12-27T11:00:00.000Z",
            "title": "Broadway - דברים מוזרים - Phoniex Theatre",
            "allDay": false,
            "images": "https://external-preview.redd.it/stranger-things-the-first-shadow-broadway-transfer-v0-p0mGJueMHM0gldWU8TpowKcHm8IpSDF-9SZhmT26cFg.jpg?auto=webp&s=09e30ffc1f6213e8009c44ee454d7b1777b959c5",
            "category": 8,
            "currency": "ils",
            "duration": "02:30",
            "editable": true,
            "location": {
                "address": "phoenix theatre stranger"
            },
            "moreInfo": "https://www.nederlander.co.uk/dominion-theatre",
            "priority": "1",
            "className": "priority-1",
            "description": "https://book.london-theater-tickets.com/book/22293/seatmap-select/?cookieBanner=false&currencyCode=GBP&refererCollectionId=167",
            "preferredTime": "2",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1109",
            "end": "2025-12-27T16:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T14:30:00.000Z",
            "title": "Sky Garden",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:30",
            "editable": true,
            "location": {
                "address": "Sky Garden, London, UK",
                "latitude": 51.5112422,
                "longitude": -0.08354929999999999
            },
            "moreInfo": "https://skygarden.london/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "01:00",
                        "start": "08:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "09:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "01:00",
                        "start": "09:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ]
            },
            "preferredTime": "2",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "460",
            "end": "2025-12-27T17:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T16:45:00.000Z",
            "title": "The Vault בר סודי מאחורי ספרייה",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5148105_-0.1312439-The-Vault-----------------------2.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5148105_-0.1312439-The-Vault-----------------------0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5148105_-0.1312439-The-Vault-----------------------1.jpeg",
            "category": 9,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "The Vault, Greek Street, London, UK",
                "latitude": 51.5148105,
                "longitude": -0.1312439
            },
            "moreInfo": "http://www.thevaultsoho.co.uk/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "00:00",
                        "start": "17:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "248",
            "end": "2025-12-27T20:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-27T19:30:00.000Z",
            "title": "CÉ LA VI London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5167073_-0.1755489-C--LA-VI-London-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5167073_-0.1755489-C--LA-VI-London-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5167073_-0.1755489-C--LA-VI-London-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "CÉ LA VI London, Paddington Square, London, UK",
                "latitude": 51.5167073,
                "longitude": -0.1755489
            },
            "moreInfo": "https://ldn.celavi.com/",
            "priority": "1",
            "className": "priority-1",
            "description": "אפשר להזמין גג חודש וחצי קדימה\nhttps://www.sevenrooms.com/explore/celavilondon/reservations/create/search/",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "02:00",
                        "start": "12:00"
                    }
                ]
            },
            "preferredTime": "5",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "936",
            "end": "2025-12-28T13:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-28T08:00:00.000Z",
            "title": "Bicester Village",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.89222789999999_-1.1570277-Bicester-Village-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.89222789999999_-1.1570277-Bicester-Village-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.89222789999999_-1.1570277-Bicester-Village-2.jpeg",
            "category": 7,
            "currency": null,
            "duration": "05:00",
            "editable": true,
            "location": {
                "address": "Bicester Village, Pingle Drive, Bicester, UK",
                "latitude": 51.89222789999999,
                "longitude": -1.1570277
            },
            "moreInfo": "https://maps.google.com/?cid=15556562009418189272",
            "priority": "10",
            "className": "priority-10",
            "description": "אאוטלטים: Bicester Village (כ־50 דקות ברכבת מלונדון) – גן עדן למותגי יוקרה בהנחות.\n\nAllSaints, Balenciaga, Burberry, CK, Celine, Chloe, Dior, DG, Fendi, Gucci, Lacoste, Lindt, Lululemon, Miu Miu, New Balance, Polo Ralph Lauren, Prada, Polo Ralph Lauren Children, Saint Laurent, Tommy Hilfiger, UGG",
            "timingError": "",
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "20:00",
                        "start": "09:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "20:00",
                        "start": "09:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "20:00",
                        "start": "09:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "20:00",
                        "start": "09:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "20:00",
                        "start": "09:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1058",
            "end": "2025-12-28T16:45:00.000Z",
            "icon": "",
            "start": "2025-12-28T15:00:00.000Z",
            "title": "הרחובות הראשיים כמו Regent Street, Oxford Street, Covent Garden, Mayfair",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5125217_-0.140186---------------------Regent-Street--Oxford-Street--Covent-Garden--Mayfair-2.jpeg",
            "category": 13,
            "duration": "01:45",
            "editable": true,
            "location": {
                "address": "Regent Street, Mayfair, London, UK",
                "latitude": 51.5125217,
                "longitude": -0.140186
            },
            "moreInfo": "https://maps.google.com/?q=Regent+St.,+London,+UK&ftid=0x487604d502268421:0x6a7d62889992f993",
            "priority": "10",
            "className": "priority-10",
            "description": "הרחובות הללו מתמלאים באורות, קישוטים ותצוגות מרהיבות בלילה. ",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true,
            "suggestedEndTime": "2025-12-28T16:31:52.500Z"
        },
        {
            "id": "100",
            "end": "2025-12-28T16:45:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-28T15:00:00.000Z",
            "title": "Sky Garden",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5112422_-0.08354929999999999-Sky-Garden-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:45",
            "editable": true,
            "location": {
                "address": "Sky Garden, London, UK",
                "latitude": 51.5112422,
                "longitude": -0.08354929999999999
            },
            "moreInfo": "https://skygarden.london/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "01:00",
                        "start": "08:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "09:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "01:00",
                        "start": "09:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "00:00",
                        "start": "08:00"
                    }
                ]
            },
            "preferredTime": "2",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "271",
            "end": "2025-12-28T20:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-28T19:00:00.000Z",
            "title": "Bagatelle London",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5088065_-0.1428239-Bagatelle-London-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5088065_-0.1428239-Bagatelle-London-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5088065_-0.1428239-Bagatelle-London-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Bagatelle London, Dover Street, London, UK",
                "latitude": 51.5088065,
                "longitude": -0.1428239
            },
            "moreInfo": "https://bagatelle.com/venues/london",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "01:00",
                        "start": "18:30"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:30",
                        "start": "19:30"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "17:00",
                        "start": "12:30"
                    },
                    {
                        "end": "01:00",
                        "start": "18:30"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "01:00",
                        "start": "18:30"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "00:30",
                        "start": "18:30"
                    }
                ]
            },
            "preferredTime": "5",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "940",
            "end": "2025-12-28T20:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-28T19:00:00.000Z",
            "title": "Lío London - אמור להיות כמו ביליונר",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5105204_-0.1319314-L-o-London--------------------------0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5105204_-0.1319314-L-o-London--------------------------1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5105204_-0.1319314-L-o-London--------------------------2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Lío London, Coventry Street, London, UK",
                "latitude": 51.5105204,
                "longitude": -0.1319314
            },
            "moreInfo": "http://www.liolondon.co.uk/",
            "priority": "1",
            "className": "priority-1",
            "description": "https://www.liogroup.com/london",
            "preferredTime": "5",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "185",
            "end": "2025-12-28T20:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-28T19:00:00.000Z",
            "title": "Novikov Restaurant & Bar",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50770480000001_-0.1429171-Novikov-Restaurant---Bar-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50770480000001_-0.1429171-Novikov-Restaurant---Bar-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.50770480000001_-0.1429171-Novikov-Restaurant---Bar-2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Novikov Restaurant & Bar, Berkeley Street, London, UK",
                "latitude": 51.50770480000001,
                "longitude": -0.1429171
            },
            "moreInfo": "https://www.novikovrestaurant.co.uk/",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "00:00",
                        "start": "12:00"
                    }
                ]
            },
            "preferredTime": "5",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1102",
            "end": "2025-12-28T16:45:00.000Z",
            "icon": "",
            "start": "2025-12-28T15:00:00.000Z",
            "title": "Carnaby Street",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5130159_-0.1386764-Carnaby-Street-2.jpeg",
            "category": 7,
            "duration": "01:45",
            "editable": true,
            "location": {
                "address": "Carnaby Street, London, UK",
                "latitude": 51.5130159,
                "longitude": -0.1386764
            },
            "moreInfo": "https://maps.google.com/?q=Carnaby+St,+Carnaby,+London+W1F,+UK&ftid=0x487604d511378c85:0xda5fe61b4e8aa161",
            "priority": "10",
            "className": "priority-10",
            "description": "קהאוטס אנדרגראונד - בר רכבת נטושה\n\nדה אופיס - חנות נעליים\n\nברנדי מאליבל",
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "997",
            "end": "2025-12-29T08:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-29T07:30:00.000Z",
            "title": "Prada Caffè",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4985733_-0.1626461-Prada-Caff--0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4985733_-0.1626461-Prada-Caff--1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4985733_-0.1626461-Prada-Caff--2.jpeg",
            "category": 4,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Prada Caffè, Hans Road, Brompton Road, London, UK",
                "latitude": 51.4985733,
                "longitude": -0.1626461
            },
            "moreInfo": "https://www.prada.com/geored?urlNew=pradasphere/special-projects/2023/prada-caffe-harrods.html",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "21:00",
                        "start": "09:00"
                    }
                ]
            },
            "preferredTime": "1",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1044",
            "end": "2025-12-29T09:00:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-29T08:30:00.000Z",
            "title": "Ladurée",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.4991812_-0.1629924-Ladur-e-0.jpeg",
            "category": 5,
            "currency": null,
            "duration": "00:30",
            "editable": true,
            "location": {
                "address": "135 Brompton Road, London, UK",
                "latitude": 51.4991812,
                "eventName": "Ladurée",
                "longitude": -0.1629924
            },
            "moreInfo": "https://www.laduree.co.uk/laduree-coffee-shop-mayfair.html",
            "priority": "10",
            "className": "priority-10",
            "description": null,
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "430",
            "end": "2025-12-29T10:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-29T10:15:00.000Z",
            "title": "NO.79 Coffee & Mousse",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5141017_-0.1330671-NO.79-Coffee---Mousse-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5141017_-0.1330671-NO.79-Coffee---Mousse-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5141017_-0.1330671-NO.79-Coffee---Mousse-2.jpeg",
            "category": 5,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "NO.79 Coffee & Mousse, Dean Street, London, UK",
                "latitude": 51.5141017,
                "longitude": -0.1330671
            },
            "moreInfo": "http://www.number79.co.uk/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "22:30",
                        "start": "12:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "22:00",
                        "start": "12:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "21:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "22:00",
                        "start": "12:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "22:30",
                        "start": "12:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "22:00",
                        "start": "12:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "22:00",
                        "start": "12:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "523",
            "end": "2025-12-29T10:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-29T09:30:00.000Z",
            "title": "Chinatown",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5117601_-0.1311286-Chinatown-2.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5117601_-0.1311286-Chinatown-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5117601_-0.1311286-Chinatown-1.jpeg",
            "category": 11,
            "currency": null,
            "duration": "01:00",
            "editable": true,
            "location": {
                "address": "Chinatown, London, UK",
                "latitude": 51.5117601,
                "longitude": -0.1311286
            },
            "moreInfo": "https://maps.google.com/?cid=341044782893684824",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "871",
            "end": "2025-12-29T12:40:00.000Z",
            "icon": "",
            "price": "864",
            "start": "2025-12-29T11:00:00.000Z",
            "title": "ABBA Arena - הופעת הולוגרמה של להקת abba",
            "allDay": false,
            "images": "https://www.cassidytravel.ie/images/events_-_abba_voyage_2022_-_travel_packages_-_cassidy_travel",
            "category": 9,
            "currency": "ils",
            "duration": "01:40",
            "editable": true,
            "location": {
                "address": "ABBA Arena, Pudding Mill Lane, London, UK",
                "latitude": 51.5334105,
                "eventName": "ABBA Arena - הופעת הולוגרמה של להקת abba",
                "longitude": -0.013053
            },
            "moreInfo": "https://www.londontheatre.co.uk/show/25118-abba-voyage-tickets?utm_source=google&utm_medium=cpc&utm_campaignid=18472991216&utm_adgroupid=147101308692&utm_adid=625167283423&utm_term=abba%20voyage%20london&utm_matchtype=b&utm_campaign=TTG_LT_g_international_acq_search_shows&utm_adgroup=Shows_ABBA_Voyage_All&gad_source=1&gad_campaignid=18472991216&gbraid=0AAAAADQb_BkjX1-T13l2_pxeVJFlaDtMQ&gclid=CjwKCAjw89jGBhB0EiwA2o1On_QX3RnQvBmkSwEtcobOFeqPJA4HOuPmEHpo2_lH4Isx1r9wUKHg8RoCnw4QAvD_BwE",
            "priority": "1",
            "className": "priority-1",
            "description": "הופעת הולוגרמות חיה של להקת ABBA באולם ייעודי (ממש מרגישים שהם על הבמה).",
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1050",
            "end": "2025-12-29T16:10:00.000Z",
            "icon": "",
            "start": "2025-12-29T15:20:00.000Z",
            "title": "חזרה למלון Numa",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477------------Numa-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5187722_-0.1320477------------Numa-2.jpeg",
            "category": 3,
            "duration": "00:50",
            "editable": false,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "longitude": -0.1320477
            },
            "moreInfo": "https://numastays.com/locations/united-kingdom/london/fitzrovia/london-bloomsbury?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=london-bloomsbury",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false,
            "suggestedEndTime": "2025-12-29T07:18:50.000Z"
        },
        {
            "id": 3,
            "end": "2025-12-29T17:10:00.000Z",
            "icon": "",
            "start": "2025-12-29T16:10:00.000Z",
            "title": "נסיעה לשדה התעופה",
            "allDay": false,
            "images": "https://media.istockphoto.com/id/519870714/photo/taxi.jpg?s=612x612&w=0&k=20&c=mzlqm5eisvu-B7hCyOK3LAsR4ugFTsHtC2kMWUmbA0Y=",
            "category": 1,
            "duration": "01:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Numa London Bloomsbury, Bayley Street, Bedford Square, London, UK",
                "latitude": 51.5187722,
                "longitude": -0.1320477
            },
            "moreInfo": "https://www.heathrow.com/",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": 4,
            "end": "2025-12-29T20:10:00.000Z",
            "icon": "",
            "start": "2025-12-29T17:10:00.000Z",
            "title": "להיות בשדה התעופה 3 שעות לפני הטיסה",
            "allDay": false,
            "images": "https://www.shutterstock.com/image-photo/travel-by-plane-woman-passenger-600nw-2467550689.jpg",
            "category": 1,
            "duration": "03:00",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Heathrow Airport London (LHR), Hounslow, UK",
                "latitude": 51.4679903,
                "longitude": -0.4550471
            },
            "moreInfo": "https://www.heathrow.com/",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "הוזמן",
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": 5,
            "end": "2025-12-30T02:45:00.000Z",
            "icon": "",
            "start": "2025-12-29T20:10:00.000Z",
            "title": "טיסה LY318 מHTR לTLV טרמינל 4",
            "allDay": false,
            "images": "https://images.globes.co.il/images/NewGlobes/big_image_800/2015/ELA-787-9_V9_0812_PR800.jpg",
            "category": 2,
            "duration": "06:35",
            "editable": false,
            "isLocked": true,
            "location": {
                "address": "Heathrow Airport (LHR), Hounslow, UK",
                "latitude": 51.4679903,
                "longitude": -0.4550471
            },
            "moreInfo": "https://www.heathrow.com/",
            "priority": "0",
            "className": "priority-0",
            "classNames": "priority-0 ordered",
            "description": "",
            "openingHours": {
                "SUNDAY": [
                    {
                        "end": "00:00",
                        "start": "00:00"
                    }
                ]
            },
            "extendedProps": {},
            "preferredTime": "0",
            "disableDragging": true,
            "durationEditable": false
        },
        {
            "id": "661",
            "end": "2025-12-26T12:15:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T12:00:00.000Z",
            "title": "Miu Miu London New Bond St. 150",
            "allDay": false,
            "images": "https://cdn.tag-walk.com/news_slide/newbondstreetboutiqueopeningfinalimages6-3d3bdf32.jpg",
            "category": 7,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Miu Miu London New Bond St. 150, Bond Street, London, UK",
                "latitude": 51.5111809,
                "eventName": "Miu Miu London New Bond St. 150",
                "longitude": -0.1436595
            },
            "moreInfo": "https://www.miumiu.com/?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_term=S179",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "19:00",
                        "start": "10:00"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        },
        {
            "id": "1171",
            "end": "2025-12-26T12:30:00.000Z",
            "icon": "",
            "price": null,
            "start": "2025-12-26T12:15:00.000Z",
            "title": "Hermès Bond Street",
            "allDay": false,
            "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5108687_-0.143366-Herm-s-Bond-Street-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5108687_-0.143366-Herm-s-Bond-Street-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.5108687_-0.143366-Herm-s-Bond-Street-2.jpeg",
            "category": 7,
            "currency": null,
            "duration": "00:15",
            "editable": true,
            "location": {
                "address": "Hermès, New Bond Street, London, UK",
                "latitude": 51.5108687,
                "longitude": -0.143366
            },
            "moreInfo": "http://www.hermes.com/",
            "priority": "1",
            "className": "priority-1",
            "description": null,
            "openingHours": {
                "FRIDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ],
                "MONDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ],
                "SUNDAY": [
                    {
                        "end": "18:00",
                        "start": "12:00"
                    }
                ],
                "TUESDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ],
                "SATURDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ],
                "THURSDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ],
                "WEDNESDAY": [
                    {
                        "end": "18:30",
                        "start": "10:30"
                    }
                ]
            },
            "preferredTime": "0",
            "disableDragging": false,
            "durationEditable": true
        }
    ],
    "sidebarEvents": {
        "1": [
            {
                "id": "865",
                "icon": "",
                "title": "God's Own Junkyard",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eyVvQeoR2Jvv_MT_-r1ybCP75ApX1d_2z9QqW48naPplNsSQhz04JzbbUh8B9x41tCS3QEX_PHKWPmqvEeJkrHpF3XM_zEqtpGoCbvLEWlP_eCz7BQoMZmG4Lfjd4mxGUcI40N_i8Qx650fd1fC90EiZYN0pjXcrbxkangAcG9vHWt0iOa2VMicivADk3I96ji1sZU59bNvikY66RUoQpOjwwM5DdQ-IZndgiVKFoDJUQZBcWavbvW6JuFUPg811txvZwHl33ARbuqv1oWon85eN2bpWaYo51USKFVzwW8W2B7evXsLYcUyWgdEIClPIxOq-65zCM8WhOC05sR7jMeiYR9KhSiTNHdRgy-2q9u_6n_eJP9JM-xTGf3rRArkyKMGngkblx4m_xkG7bIJZ5UwfN3hNMyFKBvJlH2ySwpNQ&3u3648&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=80531\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ddpwUEXPIyt9wYbkXDc81zyZL5RBKdQoH6va6ZEP1etf8Fq5cMcwPgmi7pm-58Qj3DJBrUM_eqxfQnpVWP12RsVSyPtmkezlYLy4iqTPToDE8-r9nFMOCDy_CWnJa3FTcSzMhHWgioluTlMNiuGzPphpiY9PSTtQoxsIe5htM2FjCv57Liucdq6Z3ehWGyLspGnKeYpM47IUu5mVNtd-Cw19fVK7rHCR0ZS0qh9SOUMg2U1IZhz_3l4z6ysuLppYg_XWJCSICKTbeP3XRSpqO54TFXtFO1eWTRBRDXUCXCfN7ASlRAaiBX1H-eu2oBqpFsr49BadAvKbXhcNAOc5yGqa43yGcui01LVdIa2HgrzHfRedTKnDsBIRjTsivHk_8uqGhVJYRV2knB2TRQFs8z1uSFuTXaiGMwqbDmiituJB0&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=29358\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fHcUKAMpedaKxhlOLsvsGyU8A0aHMs5tU9WXl3OXkK-lqYWpUNhChkr_TlBJQDsFJ9zIq7XzktsZQ7Y4xoTS7SGKNQkBHtZb2YJDsoM1JlaBLCs0IqgfANOdZvtiukebGBHRCG5erRAwSqxUQYh3AV00Rfad0pTK81-Wn5CkHOR-L42Jp2VGD-oaGGFw4FHcF0gGVkfSpIxHsO4QIAnP5xGshWoxcYaze5-X2lN_j0tyax1s11QacJ7EMMKUGtCiLrk6lcC9ebe9Xsr3j-UQVi9rJrZeddAUKRJkpcfYXp_uXWwtFR-1SbZnGJ1DqkC_XVatvRsX_Ry3Is7hAPTrG89vthu83cJc5ebH9hltcOBe3cNhyb6JM8ScaMS2O7GN1Vs-ajoup5EfYcO9ea8TVLMLKIVH4xV_Hls05Gp1Q&3u2268&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=90885",
                "category": 1,
                "duration": "01:00",
                "location": {
                    "address": "God's Own Junkyard, Shernhall Street, London, UK",
                    "latitude": 51.583976,
                    "longitude": -0.008324
                },
                "moreInfo": "http://www.godsownjunkyard.co.uk/",
                "priority": "3",
                "description": "חלל ענק מלא בשלטי ניאון מטורפים – אינסטגרם/צילום מושלם.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "11:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "11:00"
                        }
                    ]
                },
                "preferredTime": "0"
            }
        ],
        "3": [
            {
                "id": "63",
                "icon": "",
                "extra": {
                    "feedId": "System-🌁 The Tower Hotel | דה טאוור הוטל לונדון 🌁-undefined"
                },
                "title": "דה טאוור הוטל לונדון 🌁",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---the-tower-hotel---------------------------1.jpeg",
                "category": 3,
                "duration": "00:00",
                "location": {
                    "address": "דה טאוור הוטל לונדון 🌁",
                    "latitude": 51.506786,
                    "longitude": -0.07396490000000001
                },
                "moreInfo": "https://www.instagram.com/reel/DAJJh3goCdX/?igsh=MWgzNXltaHpiOGt4dw==",
                "priority": "1",
                "description": "Wake up to wow with this unbeatable view at Tower Hotel in London 🤩 🇬🇧\n\nThe Tower Hotel in London boasts unparalleled views of the historic Tower Bridge and the River Thames. This prime location places guests just steps away from the Tower of London, offering a unique blend of modern comfort and rich history, perfect for both sightseeing and stunning photo opportunities!",
                "preferredTime": "0"
            },
            {
                "id": "938",
                "icon": "",
                "title": "NYX Hotel London Holborn",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eqRmzH_e7Z5EwuxewhnDG4EFHPW9ASEyS2_8ScWGHpvRuxSAYBMpvaZCBdgCnsktS3KNB9xVZhB81NOoKWfoFTpT47I-epP3hO2Vts-Yct52XgYpH76DOg_ZkS57aem4-bnjOUGg8lIKFRSsSZ8nXp26Q3wsfmsQeEgiSJ6J3xUXw9utj2mOTlH0mz6Ih4aQiHEGlRU6lcIvHUhx-Z9qNgTG1qFw3ohYIAHE_-cg5R0ypdDill6EVNUMdxHcvXOxsj62ubaU9CJ8y2V0KfkloOSmrj5DwB2csdtobWgZ4idw&3u3877&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=101365\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eSZoansdrv1RFvJ0WR-8rfru7kqWSrwxEulADny8xZQWNNJUkBowz-1Ta79pIO1Gj1D-mnvokdJ3f7Y9nbmg3JPrc3pqmgUtRQ_dUqQFqiVVGMv5Xp8ybELvdNPwyhTToSeqdYdmlNQJ9r0leIsPeZfRZPC4hL7FGt3ivpqzzd6bdjIH35fWEE7090kftnaWte_B9i9_O_dRAkbe0Y6QfZIYjDib3aykZkoBePBVa3KmrzFysNnTK4I1hUaM43KsshMrRwqgmLhfE9hGSkzyhUFcX6FJRF7z5oXjKGtX45Vg&3u1500&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=29500\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fYhXHO38ax_mNdObjlN85nFx05mts5pdaRQ1KchZRkTh9KQZYgHo4eYGBZqPXBz96xKDFJ71lq_edlSxAIQUs1LmpcAZvxuT6r4kX0e_uNLATgTSaYjM6KBadh2s9wdNI31xRqFT0p4sAvlxDkrEPgsJSmDTCJCXNEtS0dtMnNyNXkexOvAkUqiCjj8JvUpyN3L4_Csv3lChvlRq3omVY5mquSDUZ8vHEVLEAHevTMUfmtuX5TcmYl8j893ioa3GKhITOVhucpIohiyCNubzY5vnzRliC-3l5dj09N2ImZsTGthN2IJhzlFc86vE-soluIBFxX4LbF0OdS4ua3MVdojJVUV621rLweYqrhQsUL-HqFX93cwXiV4wO498vEPNkMAVv7MeKbZg3tP9rQU__ahnRBeWiEUpFeLC5-zHsnRg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=112144",
                "category": 3,
                "duration": "01:00",
                "location": {
                    "address": "NYX Hotel London Holborn, Southampton Row, London, UK",
                    "latitude": 51.5193893,
                    "longitude": -0.1209225
                },
                "moreInfo": "https://www.nyx-hotels.co.uk/",
                "priority": "0",
                "openingHours": {
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "00:00"
                        }
                    ]
                },
                "preferredTime": "0"
            }
        ],
        "4": [
            {
                "id": "14",
                "icon": "",
                "extra": {
                    "feedId": "System-EL&N London-undefined"
                },
                "title": "EL&N London",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/el-n-london-1.jpg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/el-n-london-2.jpg",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "EL&N London",
                    "latitude": 51.5139671,
                    "longitude": -0.1341383
                },
                "moreInfo": "https://www.tripadvisor.com/LocationPhotoDirectLink-g186338-d23694152-i589983579-EL_N_London_Wardour_Street-London_England.html",
                "priority": "1",
                "description": "ברוכים הבאים ל-EL&N לונדון. בית הקפה האינסטגרמי ביותר בעולם!\nמותג הקפה והלייף סטייל המפורסם התחיל את דרכו בלב מייפייר, לונדון בשנת 2017, והעלה את סצנת תרבות בתי הקפה עם תפריט חדשני, רגעי עיצוב פנים ייחודיים וקפה מיוחד המשובח.\n\nעם למעלה מ-35 חנויות הפזורות ברחבי העולם במקומות אייקוניים כמו מילאנו, פריז, דובאי וקואלה לומפור, הפכנו במהירות לסנסציה עולמית.",
                "preferredTime": "1"
            },
            {
                "id": "205",
                "icon": "",
                "title": "Zuma London",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fICSbNeI1XfBdnH8EsTwfqLcpnpG2UtNmRrroz1V8PKGvzEZSD5KBu0ADGm_x4HbfRElFKWAsDgxFmuCBfcceja3Z8soa3AyCpKcVIrf078qpBUlMwwPo3z1CYjkseHu3IxQhakyeYtYCBdu_kxXOe2CpooQR5xKuJUFC2ot0GmTcog1A1VZTAfv2cIQZ_8RmGEGQn6IJuNo_qgfxHaxzbeM21i9t6l5O_ObLVryhRhsGxKMNkz8IQXBpq1wcr_7nzg9rzW7lwOo0g2OUk08DGj0Wd_q0-x7JeHF4EHeEROVyTtH01jeO2cleHZNM6MYhI77oMgxRQhe09-5C8ej_lveG_ZZybAvDkeS5CZ_QyOMkmVhJ4_uZDJrzq2afe-ZawOroYusnV1gRRz2bim_EUgcy8v2OCzsbLiKM8YhA3BHob&3u824&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=90353\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eD5MVIv0uhyFgW0YyJKa6dmQiOPl4TST2711KLj4hAQZXjGdQwiCVmXF_94U4UzrvqhuqUcud7wXedt5Hk8O40_chr97zjFY3UrTE6DaLGfFgiPl1YlUvxBfZXC8EBkkdpvqgTd8UqlC_WM2geqUQIeWV-9nbY2ks4p5bSxlcdOtqabQqB-jWZwLmNAaxELN9VCaAx6ISHeLyH36hPLDqJ2hXT9NZWW1_g6UxelLPondSv7G75g0ZMMShYeBNas11GFrGYpAR8L3nlMgfgDsqOjW66C35zds5q_JD_YOrfiQ&3u683&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=61287\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2e0bJqSvHQbZO9BUxPNBzhmCJ0rwuS3PxVVmBwa5vFDw8M0iEEPJVEsTK8Jtsv2e2ZSh3zKwQicf9P_pbkYwllcB7dhGBqdjT7S6sn7wVQNVtYSFvtj1kWGs6o6lRzRUxsef9lufvy6cHzr5Lt-zv97LWGcsv-J-K2E5U0BDe18zbETYHKw-gd0bt1jUUc5pjs83K9LcHa8EJWXM0MvlOuPUlgTNs4vM0hKbuzd2RLUhHANXlFtWel64gi_nJc2UPhzKEhY_vE2Id2DmNmvTKwjh3Up4t49BQXKnYu1M9bQhhrSu3HeDJiJRtnZcb0xSDCpZDusDsEhVoAohtvpmtYZpwGbS9wNdo8nPdJU0gnoDyvOZ57xtTdphwOedNYUQSaryvMPM_04kplSD8nkdtAJZWOhQhW7CjODuhPSf1R-4UFpKcvIKfhEHDLbzTnu&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=67175",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Zuma London, Raphael Street, London, UK",
                    "latitude": 51.5009309,
                    "longitude": -0.163136
                },
                "moreInfo": "https://www.zumarestaurant.com/en/london?utm_source=InfoButtonClick&utm_medium=Home&utm_campaign=GoogleBusinessProfile",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "15:30",
                            "start": "12:00"
                        },
                        {
                            "end": "22:30",
                            "start": "18:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "15:30",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "23:00",
                            "start": "18:00"
                        }
                    ]
                },
                "preferredTime": "5"
            },
            {
                "id": "346",
                "icon": "",
                "title": "sketch",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cdT0o7tJaJ8XGbeue6A3xLML6M_OIgc1uggrG1wYVcTGa7wLydnnH0ZFQWEpD7c2M2qfov5ghqzwOIkLpEW3SkoQZTZOnvBfeyUaXnocSn2Nu80atvKyARYPYTE45vO3MEcx4n9a6bz7yPninnu7wmjk9HyB9TlCNyDANXCtZ5_1IDhyA_3m-B0ai7Rw-fheXA708svG827uRFgnhdictXi68VFyCi9LzuVRM4WtHy_tPamqHpm_9zFwDiwqxR647LM_5bcovqqIbubAanQyn1Y0XaLGeN8JkNDxZC__UKDw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=118958\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dBpWgp8CCC0oz9d2AGGeG1_FrtEVeCxQc2AM_BHdxCQo89p57dWkqhbppeejU3i1SnOIWA0dqO5WDJhx2pPxHtzOi99mu3cvAcW929w5vADae9pobN-TEkMmXNqkVnekDtC6c1a15WMkTRxCcmcrrlXqK7WNT7D_RUU7jPat7mHyhr2UYVUeXLrw7U-CcOMddfdC2u60QA-IEi2SteuKTIOXNkGQhvWN1XuNSjfB-nrMlUiagSN2gqE1Xo41mAMO6199ir5kHBd-6iV5NdTFSgfFMgTtkbUE2blwcvXMHnfQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=130460\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cDY69RMuiMBWPVjCZJ51N3n5kDmmeLBMLkuG36zuzAJ8WVq_bt0_pJfFkP5yPpl6QwGGXsN2O96oZ9XZ8gurkMXNEgTtn4-E4ggrEQDiLeTwQN5xhJlrcm5O4HNscSkrRID-8XU_0eQo_6sf4sYejLN1qUtxtYwldCpK-hIaTax8XT9M6szCo9Ne6P0w9Z62dxNz94jAKDNtiFgTlX-xEKc5sEhh-R-rG7b0n_bMbOU-hk9zk8M_qoA3bw0fTkPlilrruFGZ8JqzHI0nAizvb1D9IcCQjnVMwQfegRZGml3fMCOeMy6D_MBYVVqJYpzLagARZc0qzqvDvllNxzopZKRrgSP81cUr3mUcvkyojDarZLcVxxTX7LLkIBEm5ohALQq6InNxZkhPfG0lzQ58e3OrnnrfZSY8Rsj3RnQApwDS8HGCjuQme9TTP6KQ&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=62039",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "sketch, Conduit Street, London, UK",
                    "latitude": 51.512693,
                    "longitude": -0.141529
                },
                "moreInfo": "https://sketch.london/",
                "priority": "0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "02:00",
                            "start": "08:30"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "00:00",
                            "start": "08:30"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "08:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "00:00",
                            "start": "08:30"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "02:00",
                            "start": "08:30"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "02:00",
                            "start": "08:30"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "02:00",
                            "start": "08:30"
                        }
                    ]
                },
                "preferredTime": "5"
            },
            {
                "id": "373",
                "icon": "",
                "title": "Bacchanalia Mayfair",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dIHL-1HdG8mcDoTMl-aYmCEFGe2q1kzK9qiJpdPoOyEo6iRCEgHb6y1kg2EHvJDPrA3g02GX4YQKISIJ-nxo5CJf4RSP2mSObTbEnwbAltTB0JCkOLtjvl0Qaow7JXAwAqes3J5uSwy9JqEQdhYeN_Lg-9bAxMbh6p_v97eZkZuL-fLGFTlioZi0Ma3ej7yUrEJPJUkBi2XwCyAGBu6qz9JeN16ziVWV561VbYa-HB34GlmIhhGVM1bcn0g700jbYWFjkEDDUhFnA4ukjCB-UPnEKtidWLe2vpeJwyI-_7cA&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=10383\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ebH5n-mOXDlGkwisW81w3jvpelZgPXBMJmtHkPXApJxeEEfZMLJ3bIWrHPNfRysvz55R0-nxLEnKQuV9LtkSN-scJF7v4a3299lndjZ4tkjap8nnxYJL6iva7-Zr-8za68G3GO9f-B1NzDURqmWtcd-OBdy3hiWLEJPh2WV48A3hF-iViLokWZ9FW4lgltYvbugkPB7JaW7aSod5HTbQHDd2rojz-aSGUFMOGqXXlycIO3tz9xRhq9h93fmRJ1F8BQmrLxUJFLAWzcf_jMA_18Sl9Af4VK9WTccELnlWC3HSRQXMqgq-lm2UeNOBVkvXdYzEfnRFtiQCHKhZUllARImrDZmcZOYdC3CX-x9-fJsoPdiIUaPsB2M12aymANLAO4cT_JW6fXWVlduTlp21xI3C_a3xpL9FZWVzxoiLxqdBHDq5hCkXU5tLVypkfi&3u4096&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=19016\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dOjOXo7J7pNkQWw7KGClAOoK9g4pamXLEGpeftUDUjQR2h3GTm0v0mkjybqZId0uvYxFkqNurUSsUNWyJRbnRbELI3bsZ5HUu1cayP_2xGf0JMbWL2BQlRljbtFWSoaiyoOfg9GMZjU7W9xGoKse232tib4EoEq1AzmRGOHQ_9id0HS7raOdf42nwv9WvC5gPukEQ1rfO5VzWnRI2B_C6HYhdknUth7pgXnuf-ome2f9k6PA1cX4Tmu1z8f-son_uQTliG8mOMu1ldpjL7TRYeAy4ZV91Q8KlLzSWbhT3RqQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=69679",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Bacchanalia Mayfair, Mount Street, London, UK",
                    "latitude": 51.51057369999999,
                    "longitude": -0.1477327
                },
                "moreInfo": "https://bacchanalia.co.uk/",
                "priority": "10",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "00:30",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "5"
            },
            {
                "id": "804",
                "icon": "",
                "title": "Gaucho Tower Bridge",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f9S-gndinZJrR_CqKfgcp6HBp1tMs7IUwQvKyhpeEqKkynYgyJSIUfIUWDo6Bfa7YDBHy3uHOuI7H_fPYDaHRDUlTCHJxo4aJWDM9MW-Rd166vfcFZg3ngx6nu8vmv2wQU6rv8lUKfb2Ks2BORp2rW0jLTXMd3l0K3W5vvmpxAYe1rifkjZqOCR1sg2QOfr64w2At1u0gdH4w5SGolJl-on4R8MWUePFHELC2HQNtCk6JWGAujZZU26SqdGh0WD3qv9llJHl07myt6n9h-s8nNjsHoDvnTfM_4Zdz_vgd9SxXoJM9zPYyJp5PpqXp4OSZmGN-m_YoMCqp5jlNsyKGOq0BuPQcF8gF8nSLHJ69fiCZixbG4m3EVfa82DYlM--sobEuPHP7eGJqBLf1fSHFoCbc2K_WwJnhUFsUpsl2gRq-A&3u1080&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=39892\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cyIKLpGeEvUkbhy_GREBCmES-ClvNiKSk9UdumRn2qOOkjXL-k8teVGgBqiDadqXpQDq1dPsC6PmhKhM03xlyRht2rB4MThguv3x7aSknQ--hP4u1VD5_bCHVHHO02qy8foieIRQvwkCX03MbYsep6jvCugCtRH1dNd-4brCs6_GO_yr7bMA8Uxeui3at6GV5EWS6gNy4rs4u-gHjR3QyZHKl8IedpEulJrR4Mp3KNcaTb6kZnK1TLjEfQg15vrPzAoNyj0ilsLDl2YjHGPDJAD9zHronaG61DR9oEfexKikzGrZbJlRwqUBr25X7G_8Jq49Q2Hv3duVgtgPBGKkbwy8d_QlQwynZhnlzNqCokEHC3fA7s24Q3JoOQ1ZURxfQsiwIFSxsQLESzH17LNyIpwx_sX7MV6FxdhCxSA2HsXA&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=111797\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2esfeuatwJv8w0_gOlvfWoyWQ40O0QoAqlDCe2oqW4kI-NbGcjsOxLOKhFUeFXYb3JRUNaegr2-pOwM_oAIJCEP4sqMjQCKhO0RndjSIbW_ZTzBVnR3Okxr5bZaCZjCs-6r8RAZMz0LMhKvLEU8miNMpup3kIfBhIuilivAo2TRAPifahBRk5XnY0P8oIxtvbuh_312P9lcIkKePk1qqnuL8QTp0zjiX4t-Sy_3y6_EJRmOc5YFe75geTShaiDa3NyVTep8iFXuvaZFsp6PsGq1cTjtIvRsUPI7Wm35j3S8P79Grp9Op2jF9ycS_kstS8L9UorGLN8gyANx5vZd-2twdCccdu3ioYFWu1kGkkobQgfeD5uJW9RyyTSrsVei8ePHww8uFB2qHJ-B5oKNW7MR1ynXKT-Tz7OAqWG4T4SDasglBkjyyfBsKs3wGg&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=94841",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Gaucho Tower Bridge, More London Place, London, UK",
                    "latitude": 51.50517019999999,
                    "longitude": -0.0804224
                },
                "moreInfo": "https://gauchorestaurants.com/restaurants/tower-bridge/?utm_source=google&utm_medium=organic&utm_campaign=tower_bridge_gmb",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:45",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "2"
            },
            {
                "id": "825",
                "icon": "",
                "title": "SUSHISAMBA London - המלצה של הצ׳אט",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cAs5zvjhueLZwYPVPs7ONplR9n8SAVVxbdqGuCKosEIGTXF3utlrsUxvSEfNCsZ00jy7bjN0sV1X_l2s1jKO0hhVBN92VhaP4ji5xBpY9u7wVwcmKAFRojOefmNjfsI9yHRgd90Zym-DOQaHfpQlN-dK0U74gNlBRp3Mw0S0Zg6xW-y65_JgGcJacHN_Wb_5xk1VM07Nyf3B_7yXUAAhbdnIzHg0Q-Es69F-c4BzeCjuO9PbqJCiN0v7CZlh-FhxXFMy4zjB6-p375TrCW_WMeItFTbRBlpGtXfb11Nl2QsA&3u1296&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=83740\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cJJYEcktgQGVhx6zgpZgKd5fFAYXLA-KooZJFcx2_6TkC9ThEzJqNJjxKywZHOsugurA2YqiYErU9ZV1hjixnJ7RMuARMZrp5jmxFnfkdOZCNzmNqwoyVYO8fafPxJct-J-_n2qwERd56LHkuc4hOcBzUOpMHr3TSnIhC3dtLEGHshMZxQu7ZnSoBpVvDdoAWKUSgEM5VtvyzenJJL7FMKQHu9j5Uo4MxyUm5NcDqI5K3MttTwOHWhyLbTuEAOSGncaHMLEjbcNP_QgTtnx0yx5GX0FNQbigM7j6mTN50KAQ&3u1296&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=96445\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ekJVvFR5qLXUCzilh_mAsE79fKWWLpbAaX92vjoRAcCGZ27amzJwx7e7a_F2FMAdT8Msl4jWSwyjh_HLmJHnEoBlfigBPzsUUSDeOQkUGIyPG3aDklw8Zy_fiNQ5khZU3pL8s05uSnNtuQtxen6SkMfj_lowr0bnS976XrtvG_3iM116tS7FDFFWD2c05T3VQiDBaHNFOK2a4rYtUw7OHzXiX5QZwq8GFzK-wk6pLENlkO3VcQ83ZyPpAtLUWNw44nzrFODyk7YfBSrwTamYV9tLvfDj3zXAHt0013GFQ-OspAzjo5_lF2ZcdJZmkPgPaz7G_0YrV4KEB4ne25cTXR20XAckq4Co2N6VlZMZAMuKVF9qdXboh9LHy3EnflaRscgTpI0gXdxzPlCNNpgxSMY_NaydqbvUvrtwJxOGkt4lLyuP3J3ios55evqoxL&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=43950",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "SUSHISAMBA London, London, UK",
                    "latitude": 51.5162529,
                    "longitude": -0.0809449
                },
                "moreInfo": "https://www.sushisamba.com/locations/uk/london-heron-tower?utm_source=gbp&utm_medium=organic&utm_campaign=london_heron_tower_gbp",
                "priority": "0",
                "description": "— שילוב של יפני, ברזילאי ופרואני, עם נוף מהמם. מתאים אם רוצים אווירה קצת “גלובלית” וייחודית. ",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "5"
            },
            {
                "id": "831",
                "icon": "",
                "title": "Aqua Shard - המלצה של הצ׳אט",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fICCvlW8wAk4Q3qhSdTsMprTWmbns4wUzgQ74XFaG7ya13svWoRsW2hRg6eVAwR44yKSki9E3fXez6q2fnJAOJoJgvr_IaTVUchEzLm43BxRzD0wwtQUkCRm-omE-aOmGrkJD4NoI1wlPMGK5usagTfRC-rkYRQed95OD-4nOLuqolyRS7E5E642GWUWrkqMCgmXOB3LgVO7k1wnjqQ3Da2Sw_pqEAfu2KlKYx85Y4BIG0nHMjSAWOztLJQJSRcZy3Hr_5L06wgzLeZwRNt72ty25gWh9Lug2y5gQ-LpitCA&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=107808\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2etXKDn6ggNswCo-jjfOA5hZYzkgon44Gh_0zWooyIcP6SnJ6EdQ0PK7cTV6Km_wnBzHaMnnITbRbpz2MYLNEXFoK3ptUPAbGFxJhh99XdYX7eS3egJfrzxEaB3_ZErWbQ6ZShi1gMIAwNaVd50S7v8dbynAraFTQQqCUQt6fdtGXmCU_lkDhOo09OIErDfFN5W-pUXFFq95n4BttwkPkEmCYJRxKkHXMhWu0YqknoyHGMb5k7x3haGlgLDBY2FObZWflqexp6ooCR2M5dZaqIBPccOL0XoiWjSfp1IuLt2Pw&3u1920&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=47039\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dshXdd899Wx8aRGO2uVCtXKABNkB7_g8FBnjnCFPhY6BoaRsFZkc_nAWCTbQvYCt7KpUPrarYkc5VQ5KjzGkAERYjh0nIdMXtnN5fDhqEI1SkZ619Q6pdB9Oq6JcdsXjVi8WUS2jpgMW9JMKISfYld5acWDzxzMuTJmgwvSbPrcsjODp8esHAoYIPDN9Ea6sJPbLzuhdJKBxkMX9tPSgSQJD7nQm7RFr6Melinh98hMEidIyiEWEhivQ3r-qFAyZtyX75HCI5lqBr9N3P_EPS5t5TH2S1IRr0UHp0xR_KdUva2ZYDYNnQIip-4rX077J6VQXrGx3dYVNi8pHDl7fPxnc1rpY1RERA4EyL1WWBhv78HvMuW4vP_DJqPiY23Rr_iK9WXXwIXxxROejj005qsVvaBV7PvMF4-v6fF3eB3_P_0iHbuw0HJYSpxxjA0&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=102508",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Aqua Shard, Saint Thomas Street, London, UK",
                    "latitude": 51.5042311,
                    "longitude": -0.0865624
                },
                "moreInfo": "https://aquashard.co.uk/",
                "priority": "0",
                "description": "מצד האוכל, מצד הנוף: כשאתה בתוך השארד, הנוף לפנורמת לונדון מרהיב. האוכל נמצא ברמה גבוהה והנוחות טובה.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:30",
                            "start": "10:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:30",
                            "start": "10:30"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "947",
                "icon": "",
                "title": "The London Cabaret Club - אוכל עם הופעות",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2caGAhLqdMEhTpCpoYkxgvMHQ8Awk1l5XphcQQ_EicmZcG0TvxPF8COTaKHhDkw-D5gyCIxFNMgWey9jnSLOdz4071zRChq8ZWOgrqaI-9HFBnLBkVboaVc69f9FwUlJID5cXP82ePT6IZjmIHKIu1xiH4fqnRYx1p3AwGFV0jcLuQNuHHE2yBP36sqtDNV6oRlcYqg3ZKoxTA6g6Fc7hSHuOBUa5lD9UiaHHh6Ei8sbbX4Dz2231nru6JFlCx8b-zEKmgMkTsGB7tQcydOX267zTlh0l1lMMCfU6ZjudQ7iA&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=126818\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fkN9YxByTXMjwC7ZAxF-Tymh9iSBtormYqfMQtyerso72FmdxkSlpwA566tHGo9Dh7UdPKn7dlx3enYWq4Dd0u233kZVzoMul-nt-BSLHMbdxExnUdkNNhziP6Gi-pdp9i7YT-zJ-S6mbkQu1oSaCaeh2tWucP_FyHKO6Nn_XAjtAnVYl8otlKX_QmlGJ6BzuuV5OibIQwQUOYcLctFXNiEd4pD1V23rIALeKQYdyyWuRkqWGg3DIh1rpO-HDUSQhZ3qRzyAaX72T6KbeAb0JkDll_v_MkJxEBjhu4ck-RZIrdHBLuSURj0lcH-hjMvkz-i8EyhjSh36EjUc4igC77MR3GBQqKdQmZMNhyoIA5X93QQBYd1FdHdikEyff4oDUczZWmmFR1M8OFpR5w8YiOiUwXzAfGN82OCXJsAB--_P9I&3u2992&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=87605\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2frfpR4dyTLVZgccAzjZ9zmWaSLWxGK-Y9vK5a3-sUjwSq1_dCf6QvR269D6_NmezvIfcbgpkZ_QehcR0AeNUTjzUfhzu8t5F-5XVc5wzwrt2FyR1FSmd25SQ2D0JrxY8uZRpHf32yR5wE30w9QBOtWl1RWDMhYAWCIsIZyyBbHnb0-I3FMrWINIY_8FU3hNo221VJILQpRDar6IMD5r3UAnk-KNil7MvdkCDcwHR2yErRbvqKcEOAVGkWvxbYboDc9r-AQLT05aAZ83UVmfruMbtk15EbZjnzy6tGSOWRI2yY8phPnBQ1Uik7G-XMa-yL71dFqzgFlrYwvd4huJXPPgiz_r_q9IDW2K4_Ob6Xzj1fEN-Usra9yYIppYU9g7P_FpeHUFwfzYeF2lW5AHsWZmVzGJ7x6AGMvvn7pMif3ILuj&3u3152&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=28675",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "The London Cabaret Club, The London Cabaret Club, Bloomsbury Square, London, UK",
                    "latitude": 51.5188837,
                    "longitude": -0.1218685
                },
                "moreInfo": "http://www.thelondoncabaretclub.com/",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "18:00",
                            "start": "06:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "975",
                "icon": "",
                "title": "The Ritz Restaurant",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2csER_ZcxRlCFvXsSJG8WlrL8qnLYN4r2Uk_g66nXB95hg7I2Du45WisYfH5bg_MSIsAAZIypzaVcwFIc5-BXe1d3dvKlzVNZkyzWe6ICI8mK0UaF5OeXL0wXPpYa4x8kM-kKMXi_bHXfbH_4jRfHvGG0w_icieCqTuDTuxkOaQB1xliDyHdeKEGU7OTWGlL8DMgiIbnILuVIs1jD32MM1eYa_2DWFQjS3fzRE2F1XlKkjxz6Y1wU9w28c6xNyuxhvkxecMgBmNij7o4x_27u2-5aBR6Fo1lHXctiBtWhvaHQ&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=99944\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cY40Se0ExhzA2lDw48niUWIDTWhZzpdSDooKy9FhG-T4jKg6sXtxCqhRK6hbeT_TwSAt2X96igRzUHIUq7yBCXA6DbrQFEN-weR3Izx--7z6-YBO5T6cQEtTW2tX8Q7LinqH7fQoJ0tSSzUp5lVmA2Tg6DBMOm2XsYeZUs06Pw9gjLWAMGVjEm8xl5FC6DBZcVWnDtQQMi76wE45how1Xd3WAEqK1fUrt8gSwagGHuRZnKFjsJYpyBErTjSYwGwtphIxgTmM-YTpguShd6ll_8x1nwkWnT1HyXivv5FgYn1A&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=52716\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fUVFxHTn3mr13HVG-RiqBUVXRzj7rR5nhZY2rrLfT_OFoM_JAm0chAwuqoizO6iLnSusu87QCHxyR9Tsk3YlNGMvEg5ErognFtQTzJKelzC7u0Fk82Na7HsQukpnNm_ekSEehtkuWx2xV7AMLbmdofoHuMgKCE372nPf5ffXZXrYuhUlJSYCArneuvz2NWs6RmMyhQlRIRK2Ditf9IFmwK4mT378ekoakF064sXc9iP_MJzJXfgDvOqeIaHLvJMVqSIdPTysoTZyy6nWvcjrh8aDbAeCH1TgYSOs2Lkd50w7t61Q5PXz_xDPBeUV-kd3a0PiDQfrk6bWcJ91YhyZCEnlM6q4rAKdbbaM53HWPgcf250iWkVjSh0KXKyIg0oYZ_cxyLkip4r_ytDKWjsbkBj9uR2H7CQABfukb_0Z_iPsdcpAiZHtJcln43cDu0&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=6333",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "The Ritz Restaurant, Piccadilly, London, UK",
                    "latitude": 51.50692129999999,
                    "longitude": -0.1419737
                },
                "moreInfo": "https://www.theritzlondon.com/dine-with-us/the-ritz-restaurant/?utm_source=google&utm_medium=local&utm_campaign=Ritz_Restaurant",
                "priority": "0",
                "openingHours": {
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "00:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "991",
                "icon": "",
                "title": "Gaucho Covent Garden",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dlEd3YAvPo6h_T0FGTgHgfoWWYBuBAmCReIwpC9FMjsXBLf2Jz5QCT86rAtWV6RnHaKOELd3hWTvt2NfXGD_ww8X32Vj2r81QK24g4l0xpp-WTs0hByGJpRiJY2Sdjvfa1dm-AJY4E1X_NfzR_DgGbV3sBWxY0sFJl_wN1YdAjBkit-yUCw8ZjFVWd2NCS_IWfDPMTtYMtFZbd_iQEWl5Dvxc00TLj3-x2Sf2_6duZ9C8Xx1e5M0QmSinbLTLV_V_UFwYASbCInYOKz1PzSAYShoEiA8iok_d2T_l7JxIHDw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=128648\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fQQNKsvDpRs_hDUwVw7dvlTQGFSUZ5lzhdFXdteZFDivGfxleHX-uOg9beT3MQzoYvJyCG6hoFeGECa_HMYKfIXcEvErxGbKZUL9_xB3HxrdfpN2gCXLqUQAdyDGic45AzW-9yWAGKzh-TqMql2IkeUM9gwNIbpMyLsQto6lsEe6dKw2s1MUHTX2GQ9yZwGJYItthcFPzsbjjT_PzHodw1OkyHgDr5VsAuMYxAK0ZvXykh2bitWPw6i78XdAso5bG7Pc_WOiCmm5xY3xmYLlEvioyWyWm8rL02ptTy1BeK5D1LOi_5-ef4U329hZevEkFabKf2k0E-V_Z-gvZJ8DrQnnO3eQovAcjQhmcTmtwrXGezOr9uxDnO-toB6Q5yvAHc1xgDNiAxZrFHN-JxK_Ji68Yu4qFp8DNfqYpHM3GEAg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=109880\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2csnf4MYwYGWPf0ySMxZnoDkUKPtPds9DW6gCYlCUELj6nuBsVm0nkfF_Qs94FJ3zqbB89jblnulk259mJRMFhufgyPhjjuzAytG_98A58RlTOGXaNA0i7f59XkUg0Smh4Qvrg_6DfojV5AItpk1FjKiIE0C5wMh1NISuEShovBX3q-YFAPjlhJ1z9Fr_hfSA8OT16wBb02s8ipfcLDMRNmx2UPA8m2bHmAdDHaQl-aXKYZ7AbD2hmWe2AORa0ojLzTDt4mG8uu0_bQmYuwL8c957N2EalxGHfY5Gz--uvop8Ypv5rTVO753ahYcxG5rgY7GMOc8cJA0hKwQygkmLYiXYLME5XWcU7ZiH9n3XYRTY9Hr5V9Fp30ihAHc_6lmNS_MruCNQE0VEDHYPvlXzmBfv2UC_FZRpKN4DkGcnaz4qLm9xr0-ChSAmugQCJS&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=115962",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Gaucho Covent Garden, James Street, London, UK",
                    "latitude": 51.5128231,
                    "longitude": -0.1235271
                },
                "moreInfo": "https://gauchorestaurants.com/restaurants/covent-garden/",
                "priority": "10",
                "className": "priority-10",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "2"
            },
            {
                "id": "995",
                "icon": "",
                "title": "Sexy Fish Mayfair",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c_E2IfeKdA9c8CsIh1c0naL3UA38rjNeEeUbUT12A2HUSdYeqvS68FU6Lrfac-QlJr4fArwDMAMIwEojx0fh5vDHcvnMKmPcQgRAyOon1NfvncCs-l-kwnXW-I73vOR2wVSXOzQc0FsHByWi2Sd33NiPxbUxnQZQrtwanlmfbGJsH0Z2ieF890cY165JrqOTKfaAPHwXt8JrWL9T7TXg7n3dL6NnM0IxneFjoiGrHD46kiRt1AQjlftleddzne2qmuCORzHfCr88XS6xJpiB30JJ1zqcRWz059sP8WRIsWHw&3u900&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=96238\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2evI67opXH4eyIj-pbWcWq9KUZh0ouz8vdQQ9N1Wn0_nheoAotinWZeKTyVM3R4ebgJYN2TnQT3bZuIQU9kqIQ4LsDwaLLHZFR9OzxL0MB2yxqpEo9W0nz9zSy16AkWUM648178517-GW9PRCso6rr2n48i4JlMj1ZaYwdOLWZuwvHiTW99YQiU-YWED9VrGKPFtS5f_tFAQJxUJ1p5vs0ZiS6pVpIiCbGH0rQBButdL5FOMrYv1cTO_Eqr3KTVAwTAUIeX9hLq4UCxT1AWeI0J-C5RFzlCS8g5N3wQbSsp_S2r8ikHAbS_CK7G3hlxqv9zhq9FJhEE16KY0LbvIJDxmzSp0W9qpp5V2kGPZzDzVqfnPHsUEYhtjaQ5Mh8R1sUY9jyNTMGHpB4ls4BSuhcKJ-b9BCidbxkrE2OI4p0tMggj4N0hRb9PJh7pNw&3u802&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=86806\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cf6L9ftts2JrytDtGxxAw1l2E-3D04nTtzE9pNg0R-7mq0YLu9cE4wNJ8SSwc5FUwmIdu7stkdlha456nMcErjmr0KfyWAEZaIojwlwPRUdTHk5GreaZ37szI-jkyTOMod1YQLvCD_wDa8UBjtU8UhOAcT5YJWUn0Q-yhxkIV-oSHQCIKTwzPkmvVvEnUj68aGLQNsuR2yHoDPDctlfMo58kV263mZ1HCiBOSdHnYdwvH30j884WcJb8QWYrd6A8muYCOortZrgiFEgaAzdKCUAgrhUJcIrPuz_gZsG3p8rw&3u4200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=70124",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Sexy Fish, Berkeley Square, London, UK",
                    "latitude": 51.50929319999999,
                    "longitude": -0.1443304
                },
                "moreInfo": "https://sexyfish.com/?utm_source=LocalGoogle&utm_medium=organic",
                "priority": "0",
                "className": "priority-0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "01:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "5"
            },
            {
                "id": "1009",
                "icon": "",
                "title": "Philippe Conticini - קוראסונים ענקיים",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eGXY54aw3hHhrEQIzR5ksK63euAKiazagdC4TNXqsAB9olCrHXi8tjZlSPfaDGt8q24ma7PVqSOUAGx13_5nrIx_PgIjSaenFWDYZMPZE5Xz592pJCNW8I4KRo7ARZU_1oxdVMPfUhyJW-HmQ4u78Iq7m0FhJognlVbWx6oR_7zVHaDL3S5PqWi6Awao0XINHh9EmTxdQpB5y7SRg-k61rwfJRwY8y8mPLO7H6GIpeIaFaL3e9HTb6-ZQCdwN8_fTHF5Y7TyOXfAa-Upfbb4eNWU0GI8HdmhMURltBHlT68Q&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=13091\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eQK4i82dgXpnHSqTZjRD8BzSSduE7ELrumO3Pyi8CjMkbgDQjMgcMMDTZEOEamIzjrUFYoIpuL1cNLilv2AR2kM2UpcYSIbY2nD_gR6iBtx634hluVvIZNBpBx0FSZnGVT9uDW9djkhQZ3hnNboP5Sey6QfmfOxYYZO2X1FID2NMoUFthUWsPqPalEjAe1s4D1WKE_Bz_zh9FMgu16PcA0ZRUsQbhZSuEMQzqY3sbm1E2lvRJ35jW8ozqttM-4wfBPNoAqnboom-gT1bnEdCk2iaptHquUeTGBTxwN4XLrig&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=7076\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fJn-8gc2QYg6_o7vMVnHTPA__JpPB7kQC3dYPix0HQkzqftCy_sguDpRTSnn6Knwo_YNdAN7FRK0YjY9A6r_DhYcPxcI-wIwtaC6-kbHyT4wt2dko6bI-vUEImcATGyyk2lN-vNnJcH8UIgf0L-G5epFOpuyYyGsgeqnYKjo8NuNW6U14sHEyMzzETMeuRn8hGaYm8kpQtr8nB6AFJmzn6UbuKvgfn_9mWTqv6aX0AUQJnojtLj1u4QOoQByKcOBeZdP0EupyIIa3g4p7BkfL_mCoRV4XkPCX85ijclxLRomJt5ANGC5Efo5wMXE_fflOaA95OaEdlyVSn__RvdxF8Yu-uvQrixpUwstQFxdVXUwV8pliaZGDQjUvJLK91v7YnGRR45n1HwRh7KrWVfdTSD7QWlod0NmhZiL3q2LSSaAP9dcNb4VaB9chkuzOb&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=18260",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Philippe Conticini, London, UK",
                    "latitude": 51.5400849,
                    "longitude": -0.1433964
                },
                "moreInfo": "http://www.philippeconticini.co.uk/",
                "priority": "0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "18:00",
                            "start": "09:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1015",
                "icon": "",
                "title": "Drunch - בית קפה חמוד עם הדפסים על הקפה",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cArciDPrWzYHQq7UgYi_pV1efslvCvLqfDATapAQv1zfnVGeNlz4ajzroPSiDC5ZN0t60o3AnYmklxf-V3aCOLoK2gvIhUpYhoiAsie_sUCasHRblfzKILcZPxI8Iuxx6wwuHLzuJJeLKM4rGF24YAn7_DrP6DTWe-tGFigij5uWIvIXH7Gq2rF67bdDs7wYQIo4aX9x8VWMkELCokkH47dZWriyFUmG2SJ06W7gFYvzKmhG6rlmmi8j3lmpql6opdvH5G_EOaLBMs5AonBbCTj2LUDYPlruKDHIKvi9QtMQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=92205\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eVVbmz-I6HpL3PETHJ1xcmb9omsN3m8JrHdqbOIEBRNpjBbTsYmkwXaAZ73zuwbniG1Qv4HH3J1eWy8-zX6lEYz3KHnYrtWuGcZcUN7BYvqEmTSrMB7t_vNLhoRq-SDv68wFIg6ai9KxHdnt5p-7Ire94nPhjQirlAGW8P0QCO8_2zNdU_Fk2g0zNgbFOFKMx3UsVE7EvjyFA3V-u88Afau0YsJnC23PDw31bU_eKeh_qaH3lAoNRs_A6LM-jQGwb5nEQ85C9i_aR9noJW1N0S9beRfFsFFxxHtykQ0v_FSw&3u1920&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=84390\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dhf5EO8qFSveIMn5etmO4vMVXi8tE6c8GrOxJiykha3KqOdfzA_iC3eMGtVpbpPB4ixnmg8sjm_PKyzPUv5i4Z61M2JIU_Y1Boi5vryDPGrEZ0aOt_KaI7BFm0_01FaPW82UR0Bmq2d_pNpUlygpYCPjp2YolmsIFbWjPu59WE4KgQJoSLcKZXMlPKwu5rmHiaOkemrhV0HvSoU5baKAhbnAgGVwNWC5TatdoH1e5kiTf-JK3Y6dQEKdrbdIUXrLhdT9atcN7qjSguzm1u9sUu71RG7PXkC_O4hFtL5nBjxeMRBONV7RVY2WGNWcCqR7kFeubB8jF5FsUoFYqatBN82PV-E3DWUph83dsP-FQ-k9bLLsWTuwNykhPcyi2y0X8AIjFStjeepLRmViV6Ql6oGFcHWpS79dE8pwLw-Tyh3cw6T30ShkoOrFpQDug6&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=63347",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Drunch Mayfair, Woodstock Street, London, UK",
                    "latitude": 51.5139687,
                    "longitude": -0.1470254
                },
                "moreInfo": "http://www.drunch.co.uk/",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ]
                },
                "preferredTime": "1"
            },
            {
                "id": "1111",
                "icon": "",
                "title": "Flat Iron London Bridge",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fvf4331t7pyaJDWuyZZaXNB7oCyEfGDSocoR5HZxl-FQqLWNEgXtK9AWDhXN8GYCc_GfnhiZ9p8ow_ElG-MlEoUDYYPcVh3729ySJ_E02TTZ96GirD9X89KmBwYGDTcXWeQNzHiagD5YwS9hA2OTNkQIsJxmkkrm2PhzDgN3f3gQZCxSAbv_nbbtswz431CKOJm0tFED_UeXeyFK83kUVPe-OMdsU56usYhJoRYcdWfnIfjE4nOpTo7wMVpZlURLarr531A6B0R5IE0bFc7Kmj7H9K913PrlGOdMBXE84S1w&3u1600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=48411\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2erRnKfc_fZ7QaiaywhCrLVHDDpCMKlEhavNwJmAJ2EcAsHRKEIa-u2yfYot3rN4jIOcVoKhocFWHymb8mbng7R56JkUFwAd_NJin_ruLMdVoJvnGQ5CU3hRjyGM3H9HU1Cdcy1gq-uicL0UXQkpIzP_CUsQWmeF3_MmgQRRw1I-FR4xq__RBW4TTmDZwS9mNJOLUvUaa7g5v8s0f18ch4MmFMpv6DMuypXmTZ1SbGkWdr-7TJjNYn_zypWQ3Zl3-YyEPX7vgj16v3w742_8KWg3e8MGFTfXkdiQtrEPK-mPA&3u1600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=28039\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eFIbOQORwbw0EAwmdzSCm1BWBaG5tavRlddg-R0R5PFj1foY_xeZ8FN34682bBvrYRcHS3S9i9W76ZGpl_jUUqsGnNVClYvi4lA4z-CM4E0Khe0LgBk6KXBB2XXHsCs4to_IoF2JMqD7dlX58v_fVjKMJWyg8OwDbEpbc8gK016qlorkE-28SOj950SqqkNYKS7_I0fiUEzMk0dDtipMZ-OSqhYpvaG7VmMZbP06Aquck5pcndf4cRdIAy1b5B-nf4iezrf5ir-tvdaUvL4vw7uddP6GbsvL1UXufbrhd9Dr2DzzX7vhb3HXKRKvuDK2eKIpHO82gYjqS2gzGF5BR4Ya0WxEFGcZguihMpbB4T7cXuh6Z26wRuAT_G5ityQffITPQ03IlOyYlgNKL1AOceU2PcpOt1rreihsNRu3r-ryWXcNQSlOZYRh283pJ5&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=113257",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Flat Iron London Bridge - Tooley Street, Tooley Street, London, UK",
                    "latitude": 51.5041764,
                    "longitude": -0.0823126
                },
                "moreInfo": "https://flatironsteak.co.uk/restaurant/london-bridge",
                "priority": "10",
                "description": "סטייקים מעולים",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:30",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1114",
                "icon": "",
                "title": "Flat Iron Spitalfields",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eWagh44s81S2uNsWHTt8vfDoaZhhlG5Md3P2VDCgIDRhPgWJR1iEcG1t9CMkAUU-jnD6weA0iC-FeqYexkBaQz4AUztmPErfH80eNtd-uICyq76zhgqPb1Yd9pi3OjZxtj7U6ZvxYXuP7rZCVV0arbXADzLp9WAmMyghximdbQv1jyGBnrEf8acmgkd-zHetWeapeBS9lTFDelcI7zGhTRA5Zenq9O0PghImeCCZ_qlHSi4eeYVJlyJZx691DIXXiQQpByI-UmhcXmkucen0nMGbe_2oYtbycVmIrAKPg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=41398\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cBI6WD-Y69qZrxa0DWMLyHPciRIUAI_FQiR8axb1t9FkDg5s39k-Cp3wctB4uHg94jrbxuaETCIWBIDDFC4z1SP3VCVjePrdRZqL1iL84DFwsCj8q1c3PxfV5p75lUUtL5pbYR7KsIZBJzmjco3swJ9y5XBi1vtfGv9te-vHFRbPbKeFrQh2pOhrZJ7A8rEadOvmqsFMLKj9zpXRxfnf2G9LcrcfVSsSx0RmR16XS-eckNuzMFlqrb4oJWUQL43yL55eFHfmXj6nJcmSx45AbPNhqRuns199bSVSW_QDY&3u1600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=49801\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dPs48KypNJJT0p08VcXAQQrCBqyaOHV11GuzdKs5EbTdVoPYYj_D4qoxgLAMMgw88axnCI3rOkCTLVhyYfvOBmP5hyLjLGRVl718RgHQCfxzdLs7-X0PQkZ4gNuuI8eISryUMj6He0-GqlKETdSuqKh9KRenoeLm3EDi9yaxtNYXpBqe2IEJ7R5ul8s4vlCqmQUyn8WihUmM5mvZNU-agASsYr_ekN_mTQVI7srRYsqDukeu9emTZrPC_uyiw_NXRo1WxpeLQApF6zOPeKS8UDhR6MfPAtxr_dkXsJ3URJNAGyoHfcXXPVxk7nWSqJAlfiuvnaqzfpyr727Yz0qGaOg4DTzr2K-WSC1O8cu6b4giBpbe3wNlYduvPSola2-kHOzz_8aSksZBoWCTndgPoJXzgsAbTG62AjLQ3vetPCumRhOJnuaIf26Z_ytaK7&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=46307",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Flat Iron, The Cut, London, UK",
                    "latitude": 51.50310469999999,
                    "longitude": -0.1067958
                },
                "moreInfo": "https://flatironsteak.co.uk/restaurant/spitalfields",
                "priority": "0",
                "description": "סטייקים מעולים",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:30",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:30",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1118",
                "icon": "",
                "title": "Goodman",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eMF33neNVv9QzV89azXJxa4JhT3YTic8r7jtN_h05erUtPdQYHCWvjeC7xEZG-QOp9UKopHMmj1y-29VIG-Pz-NX34cSVNymS5d0QrD5Ph4f1ru_0APMVr4KxRbUxHFKpyq0neEis8Ce3N_nHi8D9_7cLd1GVIftexfAXNv92kSVIibDRQtBjReH7YbBDYtRU10Ij7mgRxKfQQO2NscRsUzdD11XqNVKtOyRdaHgnJS1_DlQ_i1jp2LmSDeaKOHVv2jQM9sUJwsCqyRDOK-WG2L_5Ym-8c_XVSAoluTj_Szg&3u2560&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=113612\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cdPF7w91mUylzjNmqFYL-hXIquIcIRlvoZuT1T3D79Xk_drKx5z8ajj00qRGhvamVYbivrWk-dqMpbtexphKoK9AlAmR9S-t1Dz-rx78Q9EIpgrw39ugWhiUSXA-h8TiqAP9OSi_tLVpYa-x2xOmredmX74encv0WZZBkh19jkYnuoaXrZ8OSis-Kd87IFYHJzpfD0tXY1roRIr2H1t0q630Ae28rNamrR9mxyt7khCoA_7zhojXrc_pECWI6KtWG3QFiumj4A9BbgEWJncvULk6Ci79KDhanq9Y-BVIucdQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=98519\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c3JWMAuVrNDyzf4kLjx2V8A5fQPeKK-kCSZDtYpyFfmmaFRJsZTfImbvgrh_bmGlerL0rjI4_RABLyeqGby4P-igjZGWazE53WSsUcq-rCplnkt0sdVRxJaYSOw2fyuAYTsXfp6VUVHUX8IhtvgMcibWm-5ugkMmUbztOf6Ork4mJg3xG1F-85dqgkG-6GqSv6dnqyMdlRQ6REyPnMXaPClfaeaVU5uXZWyZFQfO0GHM_Nfij1a9y-N4Q2fhykb6O8SPADrafmSOz4VEZ8n1LibRaedpTP9oPYwcfAiiA7oBd1May-a9VEc6LtroWLya1CiAyI5FT0fjqNx9EhOyyepMJuxTR4bMFdbmO4w13juIHmc-CK7WHSgJSn9esqX41W_er4oY-Y1yO5dXVIRcZyTLNKJ-Mtz4wDCXrfTs0UHWOfbtoHYMuYa-QSef3h&3u2888&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=13718",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Goodman, Maddox Street, London, UK",
                    "latitude": 51.513143,
                    "longitude": -0.1422646
                },
                "moreInfo": "https://www.goodmanrestaurants.com/mayfair?utm_source=google&utm_medium=local&utm_campaign=gmblisting",
                "priority": "10",
                "description": "סטייקים מעולים",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "16:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1120",
                "icon": "",
                "title": "CUT at 45 Park Lane",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2crV_CGOMonQ7cjmLWAd2zP_YIHK7HroxWlVZ53NPNt-tx_eGfaIqo0Xb9Vln9Ljco6hFhD9zKmDsIEg46N07MEOdVdlakv44zdOIWGPdgVawvFk7hXA7_HTnxyqMuzqS5i0t2pEG6Iw-jKwOb91Ih-iDiZbQ2BcepVD4CT9Lis2psA8ScqHLXjict23--ua6H7GUxOj9Z1vGVaS4zXyA7j4jEArdDeax43gziUjqSheLxweumhgPHpbZ7mWJMsgbQEQg_Hl8sBLisU3yXQ9Mw61jAk6m9DwT6DCaSzjIFtAA&3u2119&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=122980\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dHjN1Tw52AUxOpfUBeA-QbybNHX-7ng9ViozwNdK7l6xODujEPjDe8lsWF8xPazWjY5rubmv7pO3yEukT6uVCjWZoLb3fb2d_Gv4Ew5yNHX_txMXw6RcAMH6yRjd_gY4Mr6eZUFBrpuIb3KOdS-bZyMfyAuoOQCjeXWxl6vJBhOkFgQOMNyAMvHqb4lbyk77Ry8kOMFI6kWhv8x6F1VtyRT5FY4hGAxyWxcmtvo5z6TVy24obPSLwyUUYMnVK65krnsGVdTX-Mg-qKG_WgiIVIR5sHLEMuBJzCm0C8LcD3Jg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=120972\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2faEpR1fBnK48wpyMiCr52u0ZSUUzEaaccfvBG7IAROnPTcu9HA1i_Xw2E2XGFJseODdFFuFMWK-cj9XGsDEU7VykFumr8p83cmYFuxpryDgjnTn8XKI8fOe7ZXz-tDrWrvN06cB8GSiCX1EfjhkeIZHImZNZIjoNk449PD5hMeFRbsEqJgyI-Kvv96xobWBYeUcM3NWVXYsI75y27WgrQrfQ-wj4wiVej25KKbwIjZ6SuNworXNEneadSkAtIcXc0pJFKCmf9VD40J2UPlZkCYG9tz1YSKF69JJNojigXP5q3CXgUiygGZ1u9oEyOR0SfAG4hKw2d3btIcIX5njRmaEHHi4Vi82J79mLh8wULCX37VHSPI2APLeFnDyLXwocU_4DG3l0jpH7llr4n56LhYFRb5jeV18YqFHV9RN-HryUaR&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=29279",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "CUT at 45 Park Lane, 45 Park Lane, London, UK",
                    "latitude": 51.50639349999999,
                    "longitude": -0.1515456
                },
                "moreInfo": "https://www.dorchestercollection.com/london/45-park-lane/dining/cut-at-45-park-lane?utm_source=google&utm_medium=45l_local_profile&utm_campaign=cut&utm_content=london_dining",
                "priority": "10",
                "description": "סטייקים מעולים",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "10:30",
                            "start": "07:00"
                        },
                        {
                            "end": "15:00",
                            "start": "12:00"
                        },
                        {
                            "end": "22:00",
                            "start": "18:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1123",
                "icon": "",
                "title": "Café Kitsuné - Belgravia - מאצ׳ה",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fzRHvu-nqUASpanqYFgZ_wX2hAwwdJEMtlbJc9SsqVW5UWkuavuJDSrJOEMiFwZBf9Mp9jl4fvS08JYZFJRIs0yBItgTZ4zVzbB-jR4MI1hm9zBgrPeur2UDcJSstojsc51ceGtfbTyBAWBrB02nGgNQzYThES1yWWCHJh6KsqQ3yhAM6UFjD8tqEnlwjVxfN6DIPZH3fY7emrUIkSooVEl5QFVq7gJeTKglb-WiQe1TRNw3l-J1_STmCi0cDZuBGl_uicljIgUQSKI3euia09VWOsmRKoyplRTPDRrtJxkg&3u3203&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=128891\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eX-8nevzVCZOsYiyuXc4EQwsSlvvyC2x9CjSTWD_MAHwEdHDxwmBWF_Gxt1oc7s44tbBT_n95b8hzewvYq-Qhvxa2CY9Gr-H-fjEiojBEM0XYbrjZMAgYIcwKWmMBdOA7_Sf89pqWNlxe1AG-Dp1TJ0-KrbgkmGDqSWp-HCwNcPvcggf_ChgzBAkXwRF5Tw-0M4fQVoUdpL9gO1kqKhFgdBOtpCyIT-lKLxmvR57q4q7zIlU4CZtW1gyAm-zq05Hf0l0w_5LosOKUXSkq9SWkQBiCDPiJm3fTPz2zy8Rctzg&3u1417&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=26527\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cPNvKqFptxPpKEwGxQXjeHiRbaRTONNO0uuwp7ZVg5ohDaaz1N7iO6PAKovx1lTjYjqT8GtuiIre_x0M5TbTF_KqR7JgzCXinC2LqIoy2okM-VfNoDqpQMphIyvzHiPbwY4beDBc6oHN2EgEkxmZ29cjVALYyHpvceWu2kqT_bH7jwBbwfruBWuwb17ZJ2Nzr-6py0MWqyYGz_UjzXcDHpZZDovPpnle_B4WeKjvQvCC5ovdI6udp0n7hHKyktWAGhF3WnPQ6Ann0IaMxq-_gtckxunakDQXVOqAMW6bqBbzeY7CiH06ahIjOEZq2vdqAZq0Ij0vTTJsUfifk1W-RYT18_5OdDQ3nKOZAxwUmx3BnrLdaUOMmwrIdWXiqQWeGbUNWGC--UVS7lXB_i_QInl9ktqZ-GvQsbZIuFhtqHnv46p2A5aJANNYyfizAe&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=18781",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Café Kitsuné - Belgravia, Motcomb Street, London, UK",
                    "latitude": 51.4992268,
                    "longitude": -0.157074
                },
                "moreInfo": "https://maisonkitsune.com/mk/find-a-store/cafe-kitsune-belgravia-2/",
                "priority": "10",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1132",
                "icon": "",
                "title": "How Matcha",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dXTdFg758qt-XQe29JUnrbvh6f9idkSXZLJXpCIUYuaka1OI1mWUsDDA_aWzdTdzXcrpT0pSHp_1jERFCrVoNnGnm8vRum-e1ilMls2oi5SdlOg2pF9ylYXyDo_2wXVIj3P4MMHl6Vy6jsirqAx6RcDrlG_phcoEorVdXDKNlQyb3sTGzhCRqPVBbcnG5Zg4GARLZ-BorhhSGCvHhM3GyAMsDeMESggF-gq4K-SzfDEMDJvHiKhOHr7rLwGik2wgxiaLatGI5tYp1SoUxQXqAC5ldJv-psNe47hdouXwDiaQ&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=41784\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fUQqZz268xgWVCRxElI9udd7TNPJZjLud3gP3UnEXgWMg9cqBwCqNcHciJkPuJ4fY2fGXz8sc8IoqqbQR8oyF7YT9q9fWPVBePzToLY-ySkH34BBb31Dk5orBg68Oh8cLa4VZcpNmNTMk0PwT6CuH26LnlWc23zZuoqLPJSQyTw6UkrSKxQF1zow-ZSjiCIbIWzLa-mu2vonMRRA0bM-dJeB8XlLOMXezYTVVwmsh4T8hXMIJseF9TvsKeckfD8G-WWvQJWClHnNZBCxT0HqevYJG30GFblDaK4FMp6hyeNg&3u2700&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=46867\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cQxdWEKkQ7CrT8EFJ-yWrtH_DKNCziaSmRH4WIjRolR2d5AI0UYcWxzl5kRGDocruXucqUJj_negxIdwJGtJZ3V2ZC7Wedir5Pw3S9-xEdkwVIJPrpjfEtRK6lEvFjHG-iiTtLSKZZkdY6CAUvSDIuRMMfVGtFlyZQdhbEd5tipBIW77SJLL6mSXWKV00alD-WQ4RGYJi8Xp-DmeQ731spU4uAOmdPSJ5T5pN0rHV4bOkpxv9c0HZKCM2u8GJGvqY3Ce8wKntsXHAVw3H0sBUhwGld36_PU64630gxHQXwxQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=40001",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "How Matcha, Blandford Street, London, UK",
                    "latitude": 51.5182126,
                    "longitude": -0.1545447
                },
                "moreInfo": "https://www.howmatcha.com/",
                "priority": "10",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "08:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "19:00",
                            "start": "08:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "20:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "19:00",
                            "start": "08:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "08:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "08:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "19:00",
                            "start": "08:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1174",
                "icon": "",
                "title": "Daisy Green",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51493620000001_-0.1579669-Daisy-Green-0.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51493620000001_-0.1579669-Daisy-Green-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/event-images/51.51493620000001_-0.1579669-Daisy-Green-2.jpeg",
                "category": 4,
                "duration": "01:00",
                "location": {
                    "address": "Daisy Green, Seymour Street, London, UK",
                    "latitude": 51.51493620000001,
                    "longitude": -0.1579669
                },
                "moreInfo": "https://maps.google.com/?cid=6916894407404599896",
                "priority": "2",
                "description": "ארוחת בוקר אבוקדו כזה\nhttps://www.instagram.com/s/aGlnaGxpZ2h0OjE3OTc0NzEwNjc0MDY5NTYx?story_media_id=3086480451774658913&igsh=dXdtaW1sdm41Y3F5",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "17:00",
                            "start": "07:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "17:00",
                            "start": "07:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "08:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "17:00",
                            "start": "07:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "18:00",
                            "start": "08:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "17:00",
                            "start": "07:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "17:00",
                            "start": "07:00"
                        }
                    ]
                },
                "preferredTime": "0"
            }
        ],
        "5": [
            {
                "id": "401",
                "icon": "",
                "title": "Hefaure פנקייק יפני",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2epAhLN4JaHUAEKdpEcHND5t1pQzjy35HHYMmsiRi4lJhHELJ3MV9TMZ5HVcpTYuaMMuyKxt23D_9fKz9wptJIsZlcaY2Lu1v2NyEoGGDIwssKACgDlPbKBnX9EdbzY9F--pin6drddGX-2PjVSUJxtSFpvt-mag4U3DXF1RUhvmhovt1UrFWzhxIzeD6jIM6jtNcQLZqkVU57pSTpCIhw_yAxK7FYiabDN6mK1mand8lN0SDi2FLGoO3YwL07wYg7GfGXh9IQwg_IakhSeX0Hy_BxQB7-Gy-ihnvpsRCK_JrwSaA-F0KSBpWK1_xiN_3jgX7Ezb2TJWhMhUa7ibC2balM6mr7XIO-J_2Noo6_mdBpRECCfRemWYZE9uMljKhGaSbPy0n-DPvfE8R1K1EwzL8Ujb9wNFslI1_IQdKVPSD0n&3u2616&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=107982\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fjNQiYpOzG6GKGxyPRFXvLPCHT5bt2FMXNzUB2o3fhMTVN7RMFdGgbRwU7fsNxNHPUuWJmL6CadP5wwlRkH4QA3dmlUEIx6mbWn_gBXv_pHBRsFE-r0Sg48Q9pBHKzKC1lqqNHzgfpVz53axQ8-chifDwQ7mhzeVlkeQKmWzzX9rw-IGXCH2aTg-0J5Pwvv9VUlSXcDGyl4WtOXP7KmUCri1kPb7omAZgyDrmJZ8CNeVVv_K3KxtGLRptXXKTm7VQXoH5GF5oCG-xPWRSKoNFvmEfoeJkwxe1-kk5z0UFqbg&3u1416&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=75441\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fnqm4D5kh91WKExHdbGNCwZRR3K4uuUDDfKDmiGpeYdCmebTSbXSmN1DbqIN1GssxA5Ucx1GrB4cEmL-rEm8N5jMcGrdwpl4uyu3TMna-kt2mA6eC0I3kXi4n9RBpxhqRMkptLZ-rjnMQkoOQhMff13ZzO6p6NXWw3_K7GVVoqBBe1HDcgQR8Q3I1DuuUytPtZPVkQ4xw9h54cWxDgQojIg-JECA_9TwSX8UpPeemYr3S8urFJ4BXAi1oxAI7QOolg-LE1yq8Imrr0N_yiAQ8Yw3vpW_1U6UyNzy6xpNFUYw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=117757",
                "category": 5,
                "duration": "01:00",
                "location": {
                    "address": "Hefaure, Shaftesbury Avenue, London, UK",
                    "latitude": 51.51229679999999,
                    "longitude": -0.1309505
                },
                "moreInfo": "http://www.hefaure.uk/",
                "priority": "0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "53",
                "icon": "",
                "price": null,
                "title": "בן קוקיז 🍪",
                "allDay": false,
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---ben-s-cookies---------------1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---ben-s-cookies---------------2.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---ben-s-cookies---------------3.webp",
                "category": "5",
                "currency": null,
                "duration": "00:30",
                "editable": true,
                "location": {
                    "address": "בן קוקיז 🍪",
                    "latitude": 51.51577200000001,
                    "longitude": -0.136444
                },
                "moreInfo": "https://www.lametayel.co.il/pois/z5rdg",
                "priority": "1",
                "className": "priority-1",
                "description": "בן קוקיז! 🍪 השם והאגדה. דוכני העוגיות שכבשו את לונדון ופרוסות בכל פינה בערך (ובצדק) - מבחר מגוון ועצום של עוגיות מכל סוג שניתן להעלות על הדעת כשתחום ההתמחות הוא עוגיות שוקולד צ’יפס. ניתן למצוא פה שילובים מנצחים של שוקולד לבן, אוכמניות, אגוזים, חמאת בוטנים ועוד רבים וטובים. ",
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            }
        ],
        "6": [
            {
                "id": "166",
                "icon": "",
                "title": "Coppa Club Tower Bridge",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eISgoHHovou56SazJGVghRIaxH7umuCoIEI3mDaoN8jrt72XPJ7rHwCfKD9TuFUcOTVyOpJUHlA0HitnnsrPu3Z2LCzUsIqvcM9Vhmh1JMSJL5gSRVD4w_1c2l33Em-VinvO6oEuBB8Ib6ySZj5LBtBdHGsx1n24a7SrmHZH2layrPDXqqSk1a6APDJB270TUHsdem5p38qtOsPghUEvFBFVvFADf38JStLM-KLzvB7rBKX2Rg-LhSXawyGJLkjSYt9PcYFhS6BvUE9ath3a0EfqGpYMK7GM5fSRh6s46pWo0nvwdId01a9jWDcbsGkABukHvqqNSYWqMnE5qVoxHOypn5IeMEgVH4JO6UUjv5PIMJG3rHlM600NBML9GSPYIXFbI8ksaBCROPSPKdxITi9Whl1usasvr257DdmIosIkJDL5iZ6cKjJjKo5Yg5&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=90600\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2e0ZEGxmssHgZaftIQSQwdT94Rk7Wxn6zgdPbRqpJsncnmY4Hsybav2effXcR4n5bPZDKfSEEKJ0jTO7ouzTquvqWOlqSl7V-hy2DrAEuDtvGrvvMoYeQYg7YmqNXF4YWPB_xf6ePpdZvEoU8EIue9N1FZGNCVgR9wm-0-BzGhlzv05ZEHk69oDd7WAjnckWRKetIs8FYGLJK6-KbiGsN1X0xvxGbURmHLovj8d97EEsK0nXizartMdgD_wZBCC7lHPuLUfRtp4Ew4NtlFBRQeXlJ7GiHN1AGYtfiODeAN7owTbbnvlvIM6FUa5nHi4ScEqNxnbOWeQJF8M-U4HBN5OSvaE28Ptg1Z6rgkzMDgM4r92GBJ554wna_kNnbV95FLN567_CkLeaeDFWksk_2q7XSCl_4RItfVGnqOdNbyVUw&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=71290\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d08WUysq8VT2At2ELUE9iRg2eBofEt6YTpNIAT6lI3QVJxv-nWCqybxSt2ozVnPN5hMV_sh2JtPqrEs-1cAl-YzCKeYOxNNiQnTrAPG5v5PbpTmRR0WWTt-P7rNIZaeZj01mV6dhu8SXOjhxngA4dJp-2t7eYBnIfQ66KR8km1LEh3G8vcVn8JuFj7SsRsirrMouLVUbV16qZrS8APTtiubRsm61DzZpX0XCH0x1W6dP8iTxceQOBaDMADA7z0s9dV9l6ZNdu-AkQdrVdFct0iaQUB8DvAGWZkxN_WC7uyqLKC6RdH6V0o3mtFBp4XJbHOVatJEdgqogS7XlbODAyveOUlw3UIci3FH0M9d1Q9LBJ8xvoGdYplcB04mMwEt3oQ6A2NKNdUOmkPz65TvM5_qsIiMqTDrwxyApqcgg1eNj4ObvoQD71qNxz5RfS2&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=2785",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "Coppa Club, Lower Thames Street, London, UK",
                    "latitude": 51.5080475,
                    "longitude": -0.0794822
                },
                "moreInfo": "http://coppaclub.co.uk/towerbridge?utm_source=Organic+Search&utm_medium=Local&utm_campaign=GB_Tower&utm_content=listing",
                "priority": "0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "00:00",
                            "start": "09:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "00:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "09:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "734",
                "icon": "",
                "title": "The Churchill Arms, Kensington",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eHnaULUAzN17_YgO7-Dr2pX4dX0OFJNhzxnNrm6LIcD2YvQOS3FXiXqG_Dxd20vLa19YMK5MiN9nt5IsJGDmNXJ4t_t3EhWsO5fUmWly4vkOZZTQbAHQZnon_iylG8Bf60nO0yOCV2kmI8i-VzDuoS0Oy8UifzfuKhSjvi8o1CQeuA7IFHLAisXx2ujOIOUoU-lokGy1VZV0D3Xeddj9HaaJF0M_gnahIFQPivv-Dx98u-fxTih2XK1Z3lAoPzC--4SYHx777peaL6cGkb11sj6ItWnJA9q1QLnRvIuY_ezQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=105391\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dElKYndVvRrqJkE1MrChHbYm9fhJZWp3Nu3eMskG-NHh08MVr5eBjx0Q1to92h7LjQRp9vJTM5aDcixKXNPLIF8A-0pTOP3zFc20RG2LECn4rvCOsvveWH8dGQtEH2V0jz8WiTAiOOJoOyLwschqWzch6caO2uQsWSgX8EjK0m7Za3t2qifpJf5rxNM8FFlN4XkpphLGIAf-9ujLppj4JJ548CkUwklqmLNBOL3XqMOzM04P882_oJf9ZynwS0RwPKtEk0kfAMxoD8m6Oqvd421Gvvj9IEX1o4_tVK6LVV02omlZfvSjTj91bi9cZag0K0EiGof1iTnmRB84SsewGiwJ_W85CHNQqmWhCNJHlcXEp6ZBTCy_g-OIfSdy1CFkswMoXnomxrk-4mDA9cCz4WRQM8TMj1qB0yJhasxZyKaeBKFL-cviitCHxHW-gw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=59804\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fvNeyg42Uh7HTV83iJqVVyzmaedtGyL_OxU7IseoS_dRSt34mJ_mccn3Bey8hWfqKl4OZyH2f40N4AigBqEY6rSr4MRRZa_ftiiyIjdldrt_MnvpJfJYy1XBuZ0UHdZUPjOT2-2DQpTZgTSZoi9D1JQx4A-MiUAMfZYUPVDBgbabkKuG6g3dkpDPjpJNaijkJH92ZhQ41ZIVVnnnWnR_yR8YeLgBXfi3h_IxrUJPWqktNCxamPQAiQnlfcoSeAdTXi4reTmhhEgIs8Zp_84i4KaCNHQ7jgn6Emob6Ak3TVsA&3u1920&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=111657",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "The Churchill Arms, Kensington Church Street, London, UK",
                    "latitude": 51.5069117,
                    "longitude": -0.194801
                },
                "moreInfo": "https://www.churchillarmskensington.co.uk/?utm_source=googlemybusiness&utm_medium=organic&utm_campaign=yext&utm_content=P021&y_source=1_MTIyMzcwMzEtNzE1LWxvY2F0aW9uLndlYnNpdGU%3D",
                "priority": "10",
                "description": "בר מוכר שמצטיין בקישוטי חג עשירים.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:30",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "848",
                "icon": "",
                "title": "Nightjar Shoreditch",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dfyNGLmTFtMFEScJ_o_js9gx99aAm6Fxn8c9hDNclsIOhZ1z1s1KiMhZx4_7mW8O8Sx_itc0WvuXrr0UguFMvWr5GDYevR0CzvZ8WLwXYkYyA_gojIns1b5uPaF36njY09V4ehWAOL8G9ZIhY0NO_O7HJQnER8r5Alo8Frwgi1Jtx2E_EX5qPMAfNDBTruRI_LYjz9ZEr3Q0qZxHUi96Luxvg8_Hv8n_Q75ASMUirC0-MbrCoREy5tmwPYWI_dp-0fBDnbESz1c9Ca4z8jx_HXhj8nmEcdqM6NoaTcICBwWQ&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=12745\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dn7ndEBRjLgAiZsGGNQnjaGey87BpP9DDHL5RVqaYKUAZ6s6BwGTB4LvMeytk44JTf8GT7CnCUVAayzTJkKtpe_niIgz4sJjVG4RZGteXP9qFqCjNkZ9yA-5qzqGALnxIb4OS6iQaGHuxsMNJqt-ZNPW-ETkBGjRZuT5QZWRE1nXBQne2POIM1C0pOoqMnpyMyrcSt5LxOR9uP_p0BA6WkmJA7Q9Qq-3sAD2z3NRDGhv_9wljKcKGnQWvSeGl9RVbw978KZkkRR-E4iTYmv3pOusUG4yYuJHirZwYyoHw7Gg&3u4096&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=16152\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fTdvQ6l9UfBs3x3YPdCFFG8U2uyHAzTXLCOiDHQ-6NKIx1Q3tBdg2VNC0R3tpu0FeIsuphZts6pvu6863Mpc2bENpH4AawRAxQxV29nBsMkOmukmZpICfLLu_1pAiWYCMn0MIRVWfmpkUkS7-vT0RpawkkhELpznMnObuQYW34kX-RT8--Bp_BFDOcaTsxM52HgP_I8vEWTgHGLOk3K-iKJLC8pce7JBfzFmcVK6jSNkvW8Rrdk9GaEdfqI_Ll7-7sbiaf87de5bj60z1N4Ur9-h9KF_3PY0uASEhIcPtqU9dSf3QJncAtqtww4lkb4ytnfKFg9aDM9jyI9rPW8IdWcSwdNPjOl1-W1MDeErhgdVlOw2ZoHhOxAPsWtnzIRZFW6R0dEBk0WqdQQy4xgH6sEQ84OX_7NfX4xNl7S3sPrQ&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=22677",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "Nightjar Shoreditch, City Road, London, UK",
                    "latitude": 51.52652459999999,
                    "longitude": -0.0877366
                },
                "moreInfo": "http://www.barnightjar.com/",
                "priority": "0",
                "description": "אחד הברים המפורסמים בלונדון – מוסיקה חיה (ג’אז/בלוז), קוקטיילים ברמה אמנותית, תאורה אינטימית.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "851",
                "icon": "",
                "title": "Callooh Callay",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dRAs41mT4Ev3tqeYgIXq9cXy3OanC7SHDVDNxZYqgo7ZQXaPrurVcwvQkxLQdRDVCXyp-EI8zLdigK1uic4KiYQBTlFcYlMDntBvQYzfpD4CgMpwOzPyY1xVra7yEFuseX-_UrtIxaDEIsEBvW8wzheY2m8_T5_qi4QGypSNJoeNqiuLvhu58HlgB_4UW8zqmUVpkkUsX5nXXk9g3d9nyxdF8PLAg8X3c90ReYgViw0FBXoMIw-DfO0bM-rMcAv4RdBtVx4hBFb5AWMLZe8HiQYKVRZRm4s-ijkq-4MeBuEw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=11088\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fchVuh5PX_JFxArOZUfsnllEYQxycidO2YG_UZtYnwOxRsJLN11SaKJRylrfEWV_9AAzgbeahZ90pmtRL4PdhdxV8BqxMaxOfImBypYoJ399PnSx1ygNG3zJfP0l6l9ab326kygXQ_uyEVmXYFzSr-v15o6yfftNg4xiqh8RZb6aDwsdqPrEUT7HQu7cJJfPD_DWPG8-ksICjqa_EW-bUq6-m_d8tMbO36_lPd3wI1RxXWCKz7TF3DBzFHIgJNEo_1vifJAsOuCWDDXLLu97cfnPvQ1aAs8hFVfE3Scx2MtcaqhAFboeqpOBr0_z4f2LCzvzDfzZHg1GuQx3aJtAhyOmY1tHsIZ6TigqdDIp8uSfvc_S6d9WIZ_e1n2oySQRT0FBBNE9vtZH3PXPXtJwsibz3iR87FMZi1mcPh6h0jEQvm&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=72714\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cJY_TzJs1-Gt_UZsLoh-6aH6HtXy0q1cztYmH2X7rwqn1ZQuEzJxqh8PMuEijMo0x71A1tlOSynl3kCWFQpRVHTDeyCxSjO0Y81MZ-Dcedd63t2pQTgIx91jzS1aWvee1qKE-loM_spmGDdI1FvEbYrhmYdyfZBJxfFK9DoUh57j4TGe1vnu7gGz5odQ1vlQi6wgf3FQ2sIXjgL6ASffUZjz6VjSC6bdHgZop_ugmyrYwB-VymGr4VlUshR7Rz4iOUb3Ik2YQZE1FrPRj7Ko8lJo-EOjSTF7lo8f119BwzvEaHspHOMRNneHXuerHbCMVYU78IK7GIzjOJsEAs-Jon_QAGQuiIGsyeYwsm0lnQWd3noYv0NX_lxMBJTeSRPKacLS84fN0K1qRJOBpD9FJ2oULZJRcZVq2CE_YYZfDunfQvn_em49QGOn1Sqw&3u2172&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=5906",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "Callooh Callay, Rivington Street, London, UK",
                    "latitude": 51.52629080000001,
                    "longitude": -0.07986879999999999
                },
                "moreInfo": "http://www.calloohcallaybar.com/",
                "priority": "0",
                "description": "כניסה דרך ארון סודי, אווירה צבעונית, קוקטיילים יצירתיים.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "03:00",
                            "start": "18:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "01:00",
                            "start": "18:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "862",
                "icon": "",
                "title": "Ballie Ballerson London",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2esinVGde7UHRyuVxPQuvy50o0d5f-Q95t1zc0Ktd5j-stdk2S-b14wvBzjgF5V3YvaumRYEzkeci0OBYLEiivyu3KnGIyC3RCgrdKE_jZNh6FWiYzcIcaWOEsFm5bpu4vqY4l9pQgecmL1MnEx3JfPg8ounWyf406HPgWkRJQzPfDnj1D8a_3KRgk9qPo05vFXtV4XFiNDaK6M8t4ASchg6bvTtMUCyOm3wWTYjkl7MBhyF27peGsPxmphA7DzJfkfOX0zhifoMPiUrP4vXA_nKK4C6kv8as1E40MAO8yGKg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=19642\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fxW6070cXa4k6dcnvIefNyfZwC6JnafTSJv06K05kqvlBQXNe721dbUnKpM0knAxCL18iZIX8jMn1Dg1V_GUpieI3jwn_h27Saelvmb_YfVALpi4_K_A3ET9OI7kTUDf1cGl9qth0EXOu2Ru3RqPF-dHTY8CSCzFNwtGGxhNVJMyA0v_pGVo6Gv66lnhRS8b6ACXgsDXT7wGdeVJfY69R3tIoFxCn8Wt7wD5e6Ua2lBV7GBZZzsqR1MCz2vxs5g0DtkKYsRzN_xtnPhMgVCtQkoOHdqnx7_tYwWtdySj0LMw&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=14473\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2e7K8-vxtvQjbicUuB5BgUd5uf1oKoDRh8usiqgmmqolKWBLuRY3GrHtbS_rroyNQsx9JKCnvzBolUGUmTrCGGG-d-QEX7jkfkWG4ziUjtTcInoLt3VxWtQcD6s-wLxOlIeUSL42bzDvtBJB40DGtSAiRDRryavcWh80-zt_2pwSfvh7pb7PuJWAs4Duxid9bKZVzhpGeoBQ5ONN3u9OfxgkcTS1wZZLT60o1jBFetXm2YIEZ7mITelaIlS0HWhDf5an6VNWh2hobIXPWJ42vBpfkaBp8aLEzQaa8mfoA5T5w&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=38090",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "Ballie Ballerson Shoreditch, Curtain Road, London, UK",
                    "latitude": 51.5256859,
                    "longitude": -0.0804583
                },
                "moreInfo": "http://www.ballieballerson.com/",
                "priority": "3",
                "description": "בר עם בריכת כדורים ענקית למבוגרים + קוקטיילים + אווירה צבעונית.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "02:00",
                            "start": "18:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "14:30"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "02:00",
                            "start": "14:30"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "02:00",
                            "start": "18:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1004",
                "icon": "",
                "title": "Wagtail rooftop bar",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c3MCTJ5f1jxa5yWQ3F_20zaq0XFuf025ZtZbet-O-M6vf0FNjEQEe-McOEBSqlYzjprAnIgRnSNnYq1JMvIhB9jgAeuIyJS0W3huZ1zFpr63fx6I3f9vhl2AbSgYYBDPlfBQfrN_Zy7-KFzVEDAd62rcuh7NslguL-S-HQadRkcWv1lIln0Hi0kl1kJ_fUJl5T6plzWbHkbAQDaMum-UZGaLpMz90Hhp9BvbbO8CC-jTcYNUr_h2PQr4Uy0ri166uOHYjxJ_XCCv-furcldXCUQzg_YmlwJGvKa4-Qeda0aw&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=121402\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dRPNZweMPYTS1jc7faxKsTNwBBy0T7NGTXkaqD4PetPVwwtCQoiZhSa0Va5krz-itfnJSCYwBCQ4vroijWfHCHUS0drk3EA62ddQaXUgjyhZiLcpteytIDBFd2n5SXrqPOf-HNkQdPerx8M9QFyw6JHy3VFPi3v7fLDsFzcoSP__V_UI55e2pRHnOLftbjUWrRhVt-amfo3Bjgzizb1TPOmmoDQwnGQUBEHzYJox0dMyGevuBEIs0gPWzRii8tS9x4mc0n-uwy_8lRUWpEV9jwJF89cpMAHVjBBcCyTRN92w&3u3199&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=72137\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eT2s4iM4-O7Lki3mtcf86_wrCzvFi-sW6uKPL96IxkhCtrZFNcfJPFF6cEQjPWKU33SHOJh_nsqkNRxBUiUJrzo2IKoOCvKOzwJEbkp3Ynhg9oF6kOHXponxtxolPo_yMTJvDX5DnC321fD0ByqgqgE6jaGJc6YOUN9qyp3T96625akPcWXMQPxvkaGkjxI5cYMFu6dTUffIxPj9orkaH2VB2QScPEnCxcOVNa04_4N9GjOXJ7B3c1XWWl2Dcfw1G3zmWagX1mZaETNWPMC6ecVbXyPxP77IttrLJV5GJLiq8-D5qe__pboAl1_rOtCCKrIzWUZ90GmiVu0Y_-qhTL2QW0NN7pcGekBmypz-VrJX8zppxsejjk1oBhOuMpTDXDXr-GOgk_BQd-4ddTzUO-RXRH0laXtXHTFkTv_YmbPBKs6EG_cGi92ShgKjg7&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=99260",
                "category": 6,
                "duration": "01:00",
                "location": {
                    "address": "Wagtail, King William Street, London, UK",
                    "latitude": 51.5110508,
                    "longitude": -0.0866166
                },
                "moreInfo": "http://www.wagtaillondon.com/",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "01:30",
                            "start": "11:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "00:00",
                            "start": "11:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "23:00",
                            "start": "11:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "00:00",
                            "start": "11:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "01:30",
                            "start": "11:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "01:30",
                            "start": "11:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "01:30",
                            "start": "11:00"
                        }
                    ]
                },
                "preferredTime": "0"
            }
        ],
        "7": [
            {
                "id": "703",
                "icon": "",
                "title": "London Designer Outlet",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cUxz1XB3SANVJfPlg_ULre5KGST1znlfUMY9KEb_GlEVmjn2-KwYhPQtQU-o0toAyZebeWcwd026852fnbwiVrCjEEKatir1khi67MBFo-1UUWM_onx9S9gAXWFTuuLFUaSNGHOqCfYVg9Qe_IYmLbWaPSttFuhy5EKy6JR3WQKS68oFVtQyaktSzJQ-IdqMcL3__p5JkGl6zbDJf-VT9saH-rRtVq6cWlEgRiqUTTJnY8FckntWs9GWW9nMNYQT44LD16jobJeEuRCdHQhndcIChVpxxDgsSatIgULYE1UERS_A8FEobXB6Kpjjpgnx5QKHdA88HZIHPBmExDj1Weld5Z7XxvbHul0mmc89yedSxFGrt2MjvZjhN9IBZG5zgdk9wo-6Zei7GFrxcQresgys2uxKSLAGRtNhvRLlTepg&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=36205\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ckW_Wma2f7hHatPZK_SnElw5HBFC5GcWX0XhF3rvoog1Jm-fIpDnB4lBYwAFNr0W219Zx_KVMylEMjF14skFwtdairDP2G7yn-uStMS88LySQLFFm4ltOOGZ6-3GgZKuQukpvKc06U2jjx1ZBE9wAyX9FW-CUjqmT0IUdqB-9xs0v1_ULOJG9wQI1x7CUNqdXktE0BkqW5UsPCdrZQDLq4cyfyIvKjemtWNk_J7qRVJMabgjqO1Z7KsIRdFm_fyZNIzAoM6EbMnmnwRpl0-GS68OKWCBs0Y9ugy2cVgAi6nA&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=23361\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fWpY4HMzW-Kl_Q8bSNqngHpF8fUma18jRtLZaV-E-xRFN_nUjam8HKEZcblOZOrrMBbqM7S6Bq3LWZpgVid_1GShdt8SnslWwG_cz3VzGPyDoqXI2rBxJ74RyvnOYxYMV5nITO7y_04vryepZTBsRcFkIf1Mz6kbjjIgU8d_lyOzd9MWiLapwppmvk5esQTvJstBr9mkcL6gfSlI-7M-rE-qYIlm5o786U-mVGaQn7kYg5ULlA3i6HmCjBq-LtpG9zR9OFxqzK-XKnx8HnMh3l5bqynDYH-Z9MWGz63wY3BYmXdFyXBL-qzHj4Jr405PeFzxVPQMbJQU4YokPs-gMhDY5yDXIht_PRKRb89FCy8zNMgt1I-r3DaQtFTqYM7qSA7UpdngfhEt8v7gsJb4gjN6n7YvmDyQkFHzhn4aHnfOC677ybrHSPi_0NNAMp&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=130065",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "London Designer Outlet, Wembley Park Boulevard, Wembley Park, Wembley, UK",
                    "latitude": 51.5569252,
                    "longitude": -0.2829943
                },
                "moreInfo": "http://www.londondesigneroutlet.com/?utm_source=googe_business&utm_medium=organic",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "739",
                "icon": "",
                "title": "Westfield Shopping Centre",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fruhCcSHwoAV8a9EAibMtq7AHHBkTt5qaHkQik6TiaR-lu7yqMuVg1FpFa_VGgo8SG_YRFff2RtUR3Y5cBxy-OO7wrotAO-BNVkf9x5x5bLs_qrmrb0zrFrtuGBM5sBQpxmth5Nm23axgM6tPFLEAQJzcRUujeqMHOSfhi-wi-erxHhF6iUAP3YQZl4SgEm40UVU5GtohL7NN2GAs26KmQyofPdcZmewLmJ5bbCOP4SNGB7dq5MM4CX1--B3EgkbrlxIZHDp_lkeim6ep0aT6AYvza5nVqKUngWcxZfasfGsPb1fRO8fI-wn52wr5fo_fadRB6CIyk3TRvuY5rZE_AszIp0Mlw2a0CF3q5dGXZABXfLcrdXe8DwRHLO8LcAi7sHNXXzdnAEVjkg-BCf3CHU9vsRpRTMRDLL6SZiwc3xQ&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=7367\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dtbp0z3Et_29dTo266_QvZAwya1rDzXaH0BZRmvP7LbqufmMz3_fLE5DZQ5QsfIM2Lb3wEgRHWgEbuE9Dnvk9yI-baojDCbRTOZxe-NKYoXSOfytpJV__ekNMWzOucUlh11hPI4K4rg5cm_XjeCpSZgs9I2D_uQifnk7Epr1SozGbwagSYm8Sqnu5hl8-41RF_PaV7BLCdV7cMYNqUMMDAKxvf4O4qaHxVMRX_atLWAVCfG3LYibbAmsMFF7NL4OWVOVssaLUex96tny0N31_eC-QCa7YKWypfmOBKSj1zqccARzg-UuMU-DIZ2-pf792IJYvpWEz2Xg8FnSbiiDSOE3hAFK7690aKcWvfH_qCUHziA8_HY56UmaA8V0yw3S49NU6kMePkF5-rFTqcA4iWgNrE_1W6RaLEbc9hh5TBwYDT&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=27644\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eoEyldws2D5dFs0waf3SJnenyMhryMbbXyyCX236QOUbCUY9CXNwxMsqBdwEeRo1I4wAT-cbXylZhbt9pCOweykS9zCBK7MKl_gIF_s8v2sHHGTM2y9EdcBGZoOhP4U-i5uqsnY54EGzJONYTWnqTSmolSfxelqOym1jWZkU2W-h8W5ubG_0hTfOO9uU2_NbqjIUfikWACkrtsnDecjaawiI4ew09A8i8uNm1I_hiWS9cpxP2zy22J8Me7Ip_q41gJE10tSGAppZ4di6V87TjsNi3glLn8ZXBGpl3QJp4povj2tT0yU-EpNHaB0fjLh3NHDoGFQPjq8bewWrgFEUqW7hvYQooWPS2i1hKldiOxhnZo67FWMzZk0t3vW8Y7pegCyvW2CEk9tY_Nc1m9c5yz1K_6tE_cL3T119-KKYHqkek&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=92806",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Westfield Shopping Centre, London, UK",
                    "latitude": 51.5072009,
                    "longitude": -0.2212521
                },
                "moreInfo": "https://maps.google.com/?cid=4189975226229841151",
                "priority": "2",
                "preferredTime": "0"
            },
            {
                "id": "760",
                "icon": "",
                "title": "Primark",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ejZ_cshiuOakG2umoKnBqOoowZvB4COcQlTkJk_FuNdSMbohkBVfOM2gVh6I3V8ReEN6kRFuaIeu97Xh2NGJf5FSAOSB96rO3M1b2zNGA4THLvGv2i7NZNhoe-0PhHDCN0DC0vZ4AZReJ_W8r3sbHPRsR2GzSqfBU53gs1k4EmyHKE2XBv0Hu3fTFreaXigG-uxXU8t4MyxZqOvRpLojuAib9pz5q6wDOfdUf1O4sfefqbL27WOCRfQnHCwnBCAYKu1IGGXGNkHkD5HMu-n_-spnPOso1Fa40GXkVj2PqomLqq-qdL6_rc3DZiwv10O81LLSZFDlH626NzeUQf_Z4CCzuhGrCx8HeOJNLOkRScUg85PJDbejcGzIgYHcdpTjoNreXLrnsG5eyacIzICcdOmc_Cc6uSu4jTvi3M9i4&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=54001\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fmwOhT_VnPLuMjt_HyA4_YUwNrEFnnNHr69_VXBWoldchX2xTTSMern4tOjCzGEjoHNpEJYLTJIh5to03ZTzZliyzS0SDOkNGEtoaaBvMm8ZyG4urPwZCqH4d9yr5CdIydMmnQ1c8QTPxQGCVLCbnorqpxJ4ZNJ_Z0-2gZyVlPwV1VrwVgDWqr7luI9zKxRJ3zulADq33LEVIm_whRAZVj22ADaccU9K-Uf9ynVc7tqjzi55Ri17msAnJijK5XVZhm0rNwUJCQ01qhCnI453N5ruo-WAXJum47fz8pbIUJBb2dVdyPMLrRhPI5-B5E681LFRTMixKQukR17qRHyYgKWizWqS2x7_Gh5SdZMr703T1QbQ0bsx5JpujBhbR_NnokocskWM_IC2ojKppA4kHteDYc3NqaFAwsuWHKS7p2F4eZ&3u3264&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=17507\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dq-su-OpfnY4xtYpv7Z9ecNGFlEdKMVM5MmRHAlbSKfh80YZ6xlY1fn-ZL52LtYSIEfPe46X2inSndkyG5wUEcZvIgjADWqf7T0s86K8XaK7FN2PqFj_nMPufRnfpN-z_kYnZCdHUXUMReh1PXnU7Z7MhoCZdRtyzppxDWG6KFgvHdRcPSGFM_HGYoLUOIyyO-2QAKW3ZOx8jcSJ6vgJoxZVuejhgDzjJtbhxwNEi09Gy-kYDUWoznconzDXhZHG76-KUBfltMkBHLb7HsybqG1wT0OtwDL4adZ6e6IOUOag&3u851&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=50433",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Primark, Oxford Street, London, UK",
                    "latitude": 51.5165345,
                    "longitude": -0.1311875
                },
                "moreInfo": "https://www.primark.com/en-gb/stores/london/14-28-oxford-street?y_source=1_ODU3OTQ1MC03MTUtbG9jYXRpb24ud2Vic2l0ZQ%3D%3D",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "778",
                "icon": "",
                "title": "Tommy Hilfiger",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dl26E72E9xVbl0V9SFKgyW_v3YFdh09Ca0tQeB44SvkDdQAd4gO3BS7lCHlTl4C5vT3nPfShob2sb-5Uk34Ij5lAMBpY6NQYAgaJ0LjdjDhAxJEdTLD9H97vAd0LrqouNiz4slunnlKdhlZvWXg92Zv3eTq0ffERn_rfxqWy4dm4fw0U8blwZzMyXArz2Vdl1FB8cd9OQqWE0X7M9xzpiVnxTvEIpvU8fdXZs9sJYy036WOPP7v7MI5uGz2C_zbEymfrJtoHn5OGhjnO-Bm1HGGqsWKxBwmo61-bOQUmDpUoRh9H8P4zHmC4EAIY7eMkYKcinrn4kSlj9NPLLdA_8fNHytxbXNuUdU6rszgY2Ih6qbuy2KCx66AJXMNmx4LzeOOK0oBskOLoSmJ9khSPMlLIyOpQ7v77J3QXV1dIk&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=14495\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cW8i0t4FxokTipREmwPTXyYjbzQF6VZefv_xM_gt-urB4hDqhxPOABtiaoowjCEsDxwafX7VxUkY5vmoptTaDBXUidHtBRQp7PZibB5CIPyadch0yx38xD03xKIMMl7Xl3C9Da2HtxiI3_BVAPRW9Bq-eEYiHOJViVH1q_aU3U4cfaa0XnTojICCO5opV8aNDrog1Yydq9yT4DGFrvo54iPWM448Ui1jbwTKJRQrKHpwr_8fIiiqlKnDJ1xQYO7bQknKdIMY1DAt_VmJlhkTCfnJTQ2NMkBRE8YIqbAGnT2Tmg0GsBlwUrWdve-YkF4qBhhOwoxwNzQ7Twk3Fjl9kz-BDQbML-oOWraEhWlC4IM9yuQykw2MtZQEfEJ_Upx3krCzalg9J8LKY0NLL8BjHnEQbhqxYRUOVdCUTuoEJ6Ig&3u1468&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=48928\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cDvfCxLmG1EHtZvKZ7sq6OeiQVyDW-GcXJGJRfhBMLdsvTNlE97-aufUMzQRRD5paLxQO-zDsrZh-MibCi_ZyYKlF-GgKzQs91rC5-lEBEE7H91GQVZtBAunztW-C6PFu21pI9N3Gq6jnTDnvwb8yuIoxo0iywlfc2bb5Nib5SXW_N3zZuHRC_vSZ8cl-bj1qONabXChKks6o95fdouJ7bhCQf_aCEiK63g_Tp6M_23Q59-T_B3N8jUFxkhORUci7dLvIcNCVB9e4VxdfQzLBtQiXrqxHXjOWlmb14qxNf9Wx9CYLwPETzhhgfPMwFZzI-E-fMh3fSHPGf_5UtxQ2jbbn7UuttBwetYakUJXAozfnST_jArKm3mmFm_xCLd5WeXPWak2BpIJOyW-D64nMqa4bSZrcNuyb5yxu4b3zqZQ&3u2376&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=49115",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Tommy Hilfiger Outlet, O2 Arena, Peninsula Square, London, UK",
                    "latitude": 51.5019022,
                    "longitude": 0.0030505
                },
                "moreInfo": "https://uk.tommy.com/store/london/138-regent-street-aq00",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "783",
                "icon": "",
                "title": "Apple Covent Garden - אייפון ליהב",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dGscoGDVGCN4m-3xddLBpEjp0RpSVIt884IIm4VPI9z978jKmgZs2g8B9hdV7g1yf5ulfF_zSh6ykfkhsnmYpd3j7dQMNo7_bpR_RUrNEFibyrMNLt_sDOvf5v7Apc33l8jv7nI5BeI_0USdRFmLUJXe_4cXz80WTqcKvpHRs2o5NiQAcq0-mixMzh9zi60QHctBcMQURimYOOBGgd89VXtLe-bWAG7YPnH8EX-Z6dGJItuKmvCvt0D4_PlzXR2ncPlIbu4lV3X0C598EKzAJRVpn-sO6VpKj5wjRB_-awPQ&3u1600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=109238\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c8CIB8Fg45__FTj-5oz8d4rt3QUXdLgUNNYeVD0v4u9dkpC9VyNy8h8JkBtz4qgDsika-NB8o_0uUnvH7BiyNLX9_WDLto1TOHBsuWiknv290AJaLK9uOpJu6qP8SVZhgWTGlUMJWl3ELZM14bZJI3rLqTnStvOMievjhg8neBVvNcWiArdnWDlXay5udQvQxmcs3OT599kMJM5OSoiSx28lZ4H5nUPj1I2q8PzsGDDkke1VuJLDUPAJnLSU8lMWf-CrKYXvd7TstFepNVxPUvBKbHtthRmbQTlOeVCbQOztzyAaNqWN1lWjGDLox9TiqUwcWqX2i639UBmj488RvBzw2-ciXAe-Z2E0xDdpPYvmLCOIEJ7TkUDtIJ59S4pUWcv2gnybM7q3DLBFW-rTYVCg1J9mRmpC89VE5pdlzk6w&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=99990\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fXq31qJNGpcXtTBNb2SiaUY1TyuBZOsrnhnRrZOi7wMNmFHldHEQovPsdzWnxXrhjzq90GnLgB7-eGrUd06od_CQu0ymgg_qIHclVl2aonGySfTkHLgZ2K6-LBz4Kj-sca4Utfkhcl5XyAi6819DdSJHqQOzL1qnaSzjcUvDC4zXX00jA2vqCsmlaTu4_7FvX5UCN8BMyo8A0J_K62GAliWi_99DDnITs8eDkms8sW8YcLx3jbLKSGTV3AdiadjBSRjuMk9cVFQrdXvegayDLCCBtSD3huLp_GbzEts3Vt6g&3u3840&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=69925",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Apple Store, London, UK",
                    "latitude": 51.512214,
                    "longitude": -0.123568
                },
                "moreInfo": "https://www.apple.com/uk/retail/coventgarden?cid=aos-gb-seo-maps",
                "priority": "1",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "789",
                "icon": "",
                "title": "Calvin Klein",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fjPME7j_15gOE2aoHsNMh3cykWmaqLkroITfhaopdFGHCA7aCiNlwt3Rey9niRQFkrRAz9y3X5SSwmyAXTAUCK-NozvwltRwwWfsvE_-fppdpnQoS5OmTjZumMAmO1MV1n4DMkqaGhOkA9k25NewhzcU-B8EXcVYElZsYiNG7NlM95YTjpJXhu_355Ddwigj6t9u-Jotq4yigm8TrwhywbYuorD8vK8O4GuyljXm7HuOjwYwZplHRmfQA8mItH3ZThK5Hx5nIlhMPZjIECaC8YXdo7HjhRip2FPcGnDD5F4avGtNB0OLmY56YhjSFPZuj4zZOScBGAl9iMfOzeao4KAogz3h4lq2bE7M4HwDP2DgQGA7FjLvmxerxfD7S07cz59gElJbflJfrpXrHxNU1lbcsPakLJ633SvJrc9w3Pew&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=59239\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cNJr3DI5X7tXOO2KP01zrLpZe6t33fOClxT5bJe2SQZu0kNKQU3v8rWlI9Zl13xZvrRhclX35klgEcod6-oFVSGJ8Kd0epcyDrf5w_SgxalIwaf7oU5QJ6JHQTW98jNr1dZkt6-i2Cn8qEA-KOq6eiqzLTR6HptLmPnjN3SZyvJyynYq39hAcd4Vr2ue8W2IBp9hvI21fcFv4LLDacsBs3wLMB2NPoPcUaMBEAzkgNMhH-bUndiUfffFCAChPoXJ22ZyXFjYqPISLIMAIpKQh56ne25mv_lb8iFQMexzWkPk5zzJdFYb555cZuwBbHPTzLS333o3HPPIxfHrdQxYNNv78NjWLBtIl7EFiqD-rmJwsYBQpgrc9eUIINxN5A4_1iMoCpcU1vTCSG216tSaTaB5wBglvVvxMBVB8rEvtqsNK2&3u3264&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=45727\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fVk3KNJgHyiK_0KtpUt3Wj3KEj_5CpTUO5KgCIAON9gIVzwgd7COmjNGxdlMSGUcx5D0qWPuoU2LLhqcPcG3L1bPPR92b7hgen8oeZFjfhg3awSbporWfrh8YEscOtKVJdsnkT--qx9-vChzSWqiE3lDXICwTN4X7PZlEPSZD5QeryWAGKoxk154t7r3ChPER4DW1U1Mq_LsBkZFnpL7ZyiuDPTwR39mx_XC4qjhPlGCAXrUmOcPBt6dFHIAv1g9NtV1N6S8v1VRWUSCD8XJsZ-Xj1rzdj0nNp8EnUqc7QzT68GWlEptOywLt8ETLuYXOqpGqLgkG4URpDH6G1UCLPivVtBrUPZ3MYzeDL0_CvkBedi1hs6UhI5TdDSUEyFsaQLNj6fQk45uL3ekziC1pbYy2TQJrzDGJODHlsjlvNZ68u&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=9571",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Calvin Klein, Ariel Way, London, UK",
                    "latitude": 51.5090375,
                    "longitude": -0.223027
                },
                "moreInfo": "https://www.calvinklein.co.uk/store/london/ariel-way-f00h",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "796",
                "icon": "",
                "title": "Calvin Klein",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d1mgK0ZvGZ5R8Z-BIH-sI0V-2_ZwBdYlIJOMkzPeCL3M5PbCSz0p-R0ldPJs5PQijOWPi05l3qmbfShv3xpf5O7s3jBmhj3OdUIkBN61LW90xIzF_yFisLEC2-OzdGR0W2X9DZCU2Dlc0d1Q3XYd9CCh6GwLSUu4Jpk5H0ouh2vjA5yWCcWjtmyImY2ERwqmj2NBimsvy2cD5JfhiEWYKFWZhqQaKlIle7TAzBDUWF4iWX0ggu3sdEbs8_FGgaSLzJ-5N8u21gkYP7yxMiqqEXSkBq9126KvMm8HSxRa3cMxwZmOsyPBgoqtN2tIcTUAS8DYFu5k659Jlgdh0gC_XINEa5hkCrVWTLn7k7jsFMgl_3dSPpH1SA_Cd0dfco80Rc0tgcz42Y2M7pPaoS8WfCVskrksWQnwnBizDEpF0&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=4785\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dAWsmMmdOhvkxs5KcXK7ewZEYV0MJ0pbmAH57Ck3ErPUvOIbf-6d9_7o6QxF_T3LLEN86b7MoGCIrYPi2NZweNxyTWAfqkQWILvIygfq9LCmuCd1j-LWVSbXFNnjbw04MGR_vaBpo1awrlb9X5rAy0VVngBdlIqkU2yExd-XpQJgEzUEczy2NCMRYwsFSOW8Ib35sYn-DiuMyQj7iUjwIgr_erI95zGYQCY7BgsWzXd5jgDHPB5kKt5chI4Pz091Hh3Boirym0tUHAZaZcHwgoK1-U8aYUop_eYnhJB0P0E4vHhqd75DanZk7JvEfZg9kLmvbOwinPwcDXxYQUf7GseAyC7VM4KJ41HrizmuXv6isa97t8Mp2AokvKkSqYbhagbM15zen2lO-EJ46SaoY7acTMunu4A8of3CWAcJ4UNr4F&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=16231\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ddnv84WUKzRs5ZBfggzK3wXUJzC0Z-HSOx6T0m_Yg8keMHl5aLyuyQxdAWrUcjAzJGbImmjNTcgLlXNFsj6w0gji-7r3Xz-vu27Jr0ugvusUimeZXor-9N5hcpTHr5ciUtnLXal8HZRiRE91mtHpvRb2AwvLWppNVLndnxajicrj09WYmwfDOKxEuXBaOIDgKQkuKjwUNmcSvFM9_7NlyL-kXshY8GSTPF7YeFb5EbMQ4PGtiDuNfntMfp7-MI5AijbfTjEj7p-P74ibOjmDW7Uq_3VWZJK7GtyOr2RawHcimRFPiQgzHPA7_XwBwoGsaczNNZLdRHNml7kp3rI1Vp4gEL9oC5Vo8ShvdAeRexKuKeoNDgwzYT3RnO-kEKR7xTCX--R47I8jrw3aL0R3izrl_4CgSexblbgMqT8AflqQ&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=28786",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Calvin Klein, Peninsula Square, London, UK",
                    "latitude": 51.503038,
                    "longitude": 0.0031543
                },
                "moreInfo": "https://www.calvinklein.co.uk/store/london/peninsula-square-a351",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "979",
                "icon": "",
                "title": "Sephora Westfield",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fs7L4SPnYnxyfBv2lh_c1PziRQ5OJGUOBhGTqFusRY3cxZmALb06oVKpp1N3o-McXG4TgsLA56dz3WrJPjiVSonQkkVsWw0f2nDymOweaHLhQZghdQN4hHWlkK_RUTjrA_k5Ezra5FXOXWtKrfoZgaNbXpqPC5wU5-mlGTK0A2s0-tUSgF0yZz--w2VWWtKuTjYBjSf4HrfXBw3PfNhUB8p7b_oa5tUeErd-EK2hlYyss_ZIAlE_zbF0onSflJzs_WOhWjzeAvXNv3x7dlls8JesIR2YCAuGtCrqKso99TZ2YbIscHVW8FqWnAGMyrSWVi3T5uCeg7DmaM8L2qWUDFv0ZCRV0NazRB4B8xWzg8YvrLn1DAZmG9mLSYgiF5wxu5_YBN6kLMuLG7f4uIX0s8bfyhkv6tbAJqWx-LmFinHg&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=18237\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2e_kmNZUZqiWpbF72MNkO-vn8jGMQKG7EvD8Ol7BpW50xvPpP9D3t4Kh5p2cItD5zexlz0vK4XM0cPlr9v_KK8V5qlgLatcjPFJXbo8YMvYbUsh-o3mg6ua8lMUgYhEGfPWegmcr-9jn0924q4TBKf9nhA5G9tONowlqPIMeV9J3hd7Dyd34JYzIW_HGxASb5l6FXMUImmYH29Hyr_DS74CStHG0nOPfPyoGBvb8Do8_iu_vVbH73uVXxmecKT1IpTiro8bcnxOSVs8fJOf9ScDdXnqAjOWjjIUV286i7VcBKrlIhjPOF4ikgU7tpk9ZrcpxrDFDm7dgfxdpnqrmBNSyfm7_fEdvtr6YM6YrQi1UDEjWAn6510owoDMPE_jlHD-pwfvhPq9Rs7e2dmuYKJgOgqDIrzX-NfMacoir1g8XGi1&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=73266\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ch8fxbiA-UuZW49N4plkDmL8jG--3-7ZIm1NCGAMeSe3GUVvCCnfIqRzmVumL3VUzg2zKfYgFGAzd1wwpDCNbAYg6US7ph4ITXLQCDI7cXbYX7LaOEOc2NJwh0yjZ08iQGNTsW1twN6Of07TT7BUY1b1WcdTTF1eyyNB5OqdVq09cCDAA1j7fsD4lYS_nkBUofUVaZmy2g_gDTMnZHard4_Vw2MIaE6tVB0OWvJpcdVBXiorjvt5O1FSff3NFvd00umfolSjuUiTIBYE-fB3-Hozl-eIWmpGEbzl9fCbPfazP3A5lfMkzPTQtEEN_gAOvqjoNVPCEffawBgQiUDmWiZfLRSORXjLcgR9mwsO76qyiy-Va3cnkfeonbkyMiQi0rG01iaUur_ugPHSirroVzG0qJPXCkhflXVoQIUgn-Z3k&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=120863",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Westfield Shopping Centre, London, UK",
                    "latitude": 51.5072009,
                    "longitude": -0.2212521
                },
                "moreInfo": "https://www.sephora.co.uk/stores?utm_source=local&utm_support=organic&utm_campaign=uberall",
                "priority": "2",
                "preferredTime": "0"
            },
            {
                "id": "1055",
                "icon": "",
                "title": "Oxford Street - השלמות",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eRizkas108pln5Es7QwyevHbjDFgt1P5FCmTJOqKRsnfQbQbnF1UB03kTXldkgqdsN_J7detqeTkwuXinlGkyQ7fyam6jCiAmSr0mPjPugyoHBymMnTj_cttVnf1TuiA-igvvO4w0F9wIGDrHEEMhlMucxCoKpCwqSMCrzZRcEeSOH6fYNE-f3PxmwwRcv_2DQ-Aijwc-yLxIUCvQ6b9bszkhTUPAGSe4su00QO9qt8y93DzPJOXtbzQX9KSBRXtrb-E6UO2DvJ_tZNpvR5GL_fLaTKY4IBZdf1poOBLlevDgDFlxTET677S-HFtc1a9rlnfaUxFwGjKX2ozcuM5nTlUZmhnJIKNLvh-wxl3ah4o7A7WX4hdj6OEb2mb58fgiZUMX6Et2xnNum4uSkVR3M6FyN-5MtAiMnkKVPPxCQAE8rGVCaxWGmBuuQiY3bHsEf0ZOJDQ8gUp5-kb_sUviaZbu-AiYvQqQBHzr35SSt0tZc7dHw9JO3GLBSZjF7rw7Xn_eG&3u1600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=2942\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ezXMtegWdXwsMa3y05cRDTsdzohl1_94qMu_WMe4F5D8LdrLSsBopb3MB2rGxX__w1ZfrcAyAi5OW2-c_SIkSUSeOm7losNwH7ioDKff4b5aZigxwWk6quxphmfOyG5WnBxAxU7TP4iF-qHyXA_vnZyTuauym7BbSRJ1pRDuwhOLlitUKXPrmvV-RMVZl8gCSMJXHNGQItCQG-hqqWUj_KoZNe5_Uz11smj4MPESAdj6gb45CPkHVUVdymh0YWhs0a7rq2HA4qeX2yqsMWBiQreiF488CYw07j1IDsnw9Ypfa_rTEqiW1XthGoE5UWILbhE1aceEjWzPReM8YMu_x_CUHNryBveSQOCBd-qvAufGiEczcH0NVKOunu46EGXf7Gd-Xi2xZyVJIb_KC7JNCLKo6Q9EWVgHaz2DafPsd82ObQ1HHfK13r1FEF1Lc6UJL7LS86odVy6LXHrjx-xLCNHjybCERu9oyJHtjJ8dzZOOFnE5IUVgfscQtAOpeTRT63V33i&3u4640&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=20183\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eFe_j9G7RQP3qA2CYNUp0481HIJ53AeAgPAOkPEIovaP0o1ub5rGwHYgI9xxpOJJXnl_vpNyB6moARhkRvyRK4LLQivDYjQ8I_Zo2vD1Ye96t56uonmuphSdn0P8peUp98J82EFlBOugKpLTmlNNjc9wgZz-CO8tUdwVFJgvKB7yUnkdV_cgWLqnQ8eQjIRuug7ubDK0CX0Oxbjdq-iDOJtwaBW_YkTSzK1BUQ7wjFYXD2aPR_kDg4ZG1Gtv2vs_6DJz9LVKe7crRefJfOoY-3BEtb6k2TTjX4TRDcjv-j4GVqmD-QdxQCPE517gIK0Z1MahLmepZ9PnX3uGwIwQIen6h5QUDCggprXLDNonAmU0DqbECftG7GFd31gCnSehvkppfeel62fZ1sw5Q2Hc4lXfmRsCP7jeeQtVrrKFAqfW9LaA5T3wZ5p6iShLFc17ydlkqpdsi9oEJjo2hYQyKf9ToTm545Ymu42j5jWrl6wYFQDM5qA8ixq7tnGHFy4_RgPyJZ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=38905",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Oxford Street, London, UK",
                    "latitude": 51.5149932,
                    "longitude": -0.144301
                },
                "moreInfo": "https://maps.google.com/?q=Oxford+St,+London,+UK&ftid=0x48761ad554c335c1:0xda2164b934c67c1a",
                "priority": "10",
                "preferredTime": "0"
            },
            {
                "id": "878",
                "icon": "",
                "price": null,
                "title": "Burberry",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cKtUdtQ1qqRGZdr88x1BsAXP8M4EhZTC5E2TwN4Guf_Ukg3PCNa_1SzJ8kwJl2cMgVUTAjAjnEmmvIM_U-yIpBoIkR8JNcFTfAm0PZI12LY7F-i8AyAsKc9r2POwiH1lb3jwvJS6eurmTgS1jjgotNwDEu2DOQB-RIw2CjMn8tnv-FUmiS7SGWuo1xURtyerc7uyIjVDObZnQd5O0INJxVRXNmdedmv5xPvvc5swKv7RvN8HOXGW2eMywYCAtpxicCO-ifBzfgr9PyQL2t8IdnLfWy8RWjlyLKp1WEJa-GkqBNtYuO1E7uEEd3_nRKcrcRHo1iuTWt_XjsFUbj1AF_5qWi0MM91_08RQjxjxlYjCnuyxFs9RhAdGmhTYROosDde6NCwMxUaxDQmJP2Is1n7xEUirdwfEl3NySPnLC8CA&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=56931\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fFtJ-TjKkCVk_qhEaiwz5F17YbCwAeUh-3J5Cc9SR1Iqnu1HKUZWl3KTPYjRN8KOHML45bfcE0fuKMF2xGUl2nVXxWd1Uctu8qgg8J4wh-BJGgPV6rv6b8eoKODzSV6uM7U9hrsSGfOJ2LqzIA1ym6AdqrPY2GsLaPJ3j4n4PK1-ZjgZRYpdN6kQwOHyKU8XVfeW-STPKciYNwC4_dmXzxANZy2Yf3D7Lhi8UsbybzBNayVDNjGDxOVmLxw3g7Arl2WIuFQlBtWF4e8BwliKO2FrrFGrw9QxWQzcTqN-wdrQ&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=98847\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dXYDYjE9CkUdtWtEsSCcw8jWReMeLiBatbHPM12f7qfCF4CIzBo3e3zhL186KhxeIAmdj27_9pQ7nx3Rn2at4WHVdGK73WL6sRmCoYTUblq1r9Q9oGfg5Pq6OTh2eXa98s84l5G6m4puw_8Vrn5vB0Lf5Q35OMk3aleG9Q4XQT20Ymurl2AIrPVy6DazM5RSP9FtiodiGxowboZAywqqkfXuTAblCJGENByjttl75b8WrhqigAdffh8GOJhyNslKf5_A6Bvn-YGMShcluic_dEk01Rki6B8qNZdplcx_yJFZr3v305ulDjaDb94u3Slp_-rtnD8ZWgRvk4h4vWh1KXYqQOd6q5ePWqXfLrTHVjzno7sGlUPPTPaqz5S9oQ0bIxNte_oORfntVNb8vI-k7NWpGMis9_eeBNjCfwCTiS6tzv&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=98225",
                "category": "7",
                "currency": null,
                "duration": "00:30",
                "editable": true,
                "location": {
                    "address": "Burberry, Regent Street, London, UK",
                    "latitude": 51.5107491,
                    "eventName": "Burberry",
                    "longitude": -0.1388393
                },
                "moreInfo": "https://stores.burberry.com/en/uk/london/chatham-place-outlet-london?utm_source=GooglePlaces&utm_medium=organic&utm_campaign=UK4648",
                "priority": "2",
                "className": "priority-2",
                "description": null,
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            },
            {
                "id": "883",
                "icon": "",
                "price": null,
                "title": "Dr. Martens - Oxford Circus",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cQByu3V7yFgD0P8_YjSI-FqQmUbwF1g2hEoLK91hgUlrSw6VCxNptLf3FgOVh3T_q44jRpC1szcTde46v4wxY8zMvHTpwowEamCQ2Qk1qthf7OeDSEWlANba-buhYJW9dm6MC1zEBNFm1dDpXhy6ixYAwcWIq6MNd9gNH528eC6UlvqiTsNjMbBSci0rvNKFQGmK3jGDQNDsdW7WSe7GLv6opkDVTTM57m8vv3UuK5J7tps-C1ukGdTJSzP_TUVJSs9dTlkbLgbT_FAw_alX6s9gba-4_Vt5EvPT427sMdew&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=39531\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2doksDo-j8q72FefZnPPyvmc06BdRE7mwgtcPJEivypC9Rl6jg0upa4hCcxC_b1t76LWKbpRQ3bmv0UjjiFm7zjNDgLC6loEtawDufLOwMqEfBjRNheWcaNWJnkypmBl5WoW1KimMUSh8JozherRgmcrYz1nsoc0SOW2OuSFE0LECnZO6ysu91pBTMz4fGj3f1JgKeIx0x8IfOnegwS8THTPhVni_-2it0vifQX2c_lU-IXmL47HN32K1akZAQfhIEf1PWd4xszPd7MyGAcrcakLfP8VCl8FWkJLEOv-uUHkQ&3u3200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=6499\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cHYQHzl1P2RgiYAZb_ibP7SfPhk0Gw2Aw_5AoWRal_o3p9YMa7f5MVwXHS7lPaPW17oo3zaaqdwzOwt9EBRA0wc9Jvzupmi0ZbhJTNDjmDRKRl73xKDatB4TufJ1J1KJ-uuUlJixKKcj4Oc1sgYSxac25bDH3zhsulYAoANT3u77C-WCQXp1BrEJ-4D3imN40i6FtwjG-MoXyGGjBuCEykFKxOhcThG0kScgn5xlncQepVUmzgxuWuTIudB3_bdnsxZNfPi6KRiYRS0ot9XkpR4KoT_9SrnbgNPDzEsio-Z07qWhDSYOc4f741BGNCZP8QO0D8lVWcwjPfBKeAQA8nWBrc_fZmmLSXg6o2gypb31yYMU5qyWXPkPWU0Hp-mVWcc74Ws1DA5dq2Y45XcsyzqRBccsArEaC1q7AozV3gEg&3u1848&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=99410",
                "category": 7,
                "currency": null,
                "duration": "00:15",
                "editable": true,
                "location": {
                    "address": "Dr. Martens, Oxford Street, London, UK",
                    "latitude": 51.51570599999999,
                    "eventName": "Dr. Martens - Oxford Circus",
                    "longitude": -0.1396014
                },
                "moreInfo": "https://www.drmartens.com/uk/en_gb?utm_source=google&utm_medium=organic&utm_campaign=google%20my%20business&utm_content=242-049",
                "priority": "2",
                "className": "priority-2",
                "description": null,
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            },
            {
                "id": "1154",
                "icon": "",
                "title": "Primark",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cJo8ItH-AlMKnPHvnpmTr8ZetqBOSUuGCT11tmOIxjU3hIsrObYDqmZrTWzWeSnr--OWufZJYDBib_F1g0bzV1o7XY5wSsPRRJKJgjNi14yzmzW2H9YZ-5o-SGNtsPnsQqKWmfjPR_jr_FeaBR042Dd1BlllivDWjDH2moZgkJfHGEJGrnWdjpLvO-xgIqB-2_PjJgGidQWm4QDhrEt9psd0KUQrhb4ioa4qlfYyeyZleuM4Z3BfKP3t9CQ27lmbu_mV9ulkFZLUalkTBN2FqqUjTxYayh_L0DDllr1aNj_pw69-drR9N1pwHZjrR78fRDS-P-MS6XwxOuad4E7zu2vbE9vPv-OpkAuTHBp8TIAt-Qr_b5W1RymHpAnPkPXrnzzfEVRqAF5BcpIUMmFp7kXmjUUpQoozck27epSCQ&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=62487\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eBv1DIbHvu8fdcjXczt_HOiViOkljqCCSPNKXX8kDfHACv-OiOlWRqJvgm-UtzvhHXhRiiQtZIHX7PjsB4Z_I8esC1b6MUDynLfDnPYynijyufn13HTGVDmCOijOloWsgLS3Ex5C6WhXpmyfP0COXWQVtcDUbnQPEGAeAjk-EHPxMVuRRVNSRAkNNhyebZIlJfbgK3BCOdoExXHT-w3TpDVCKtAOh0EMzACpx_2wQGjsaJ4z6UZ6hkH_bftyop8eu1ocaN6hUp5tzYrXXxDPSg6dtYZLP-wzjK1_KPje6xBLIZc_ujYqAsw5ib-hb-niKqrenLG3LbcLPsZiQ6IJsKUmqYOP6rTl_0LOCFjnoO5vfTqPzqnsH13dCzDgim2yahFYQ03ccMy_QyOPhTCkzoSEd1n9uzbAv69X6F8yJq9-0L&3u3264&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=102208\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dPlbR_wN1LqeHXcFzmMNoctbOFd9q9ri1R7tMOdoIXSVXXczChf9QiVJ4ron26WV4Gd7CLb06_BHgd7d4mGt1Ec2A3qUvTEp_tHDg3B1Oqk0gRrKAwWVJL0cddoDVUVQDsauZ0SaT1C8GPPDhCIb-2v6vSTsSycNTVhugMdyP9ASUOZQn-5mX26MldHZuiTWU2JtrLGOYXdahOq9mBFbJoosw6FwDntzz-P0auxQc6-f9TKDaJf6N6M6C42n2FtYkW19fqibGMD6Dk9VUZgZNYIXabVmwXdmaJ6yjaUdwufA&3u851&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=87120",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Primark, Oxford Street, London, UK",
                    "latitude": 51.5165345,
                    "longitude": -0.1311875
                },
                "moreInfo": "https://www.primark.com/en-gb/stores/london/14-28-oxford-street?y_source=1_ODU3OTQ1MC03MTUtbG9jYXRpb24ud2Vic2l0ZQ==",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "08:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1156",
                "icon": "",
                "title": "The Body Shop",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fiQ_Vcsrp-kL_YkFeRZq8IJLi7uU9VahNm6Y-0x5v44nigCEnbFWcrYShcNFolPkUGPNziBu_-ABgaf3NBhcPjcE6pGdnXpe2ui741Yy9aG_XYyVSR4CXT0W0CWBYrMArub57ZWkVvvJVtB2s248w24-LEcLBt54W4Lf-_KGklS23j1dhQ9tQw0jj5tCQ_78_g9MtoH9G42N8BEvk32HCYHXUS-S74w5UNjTp11_xBjejk0gRVH4seAH08B1ygExB5yZL_ExZvPux_9UrrnGedmAXwi6T94mQbatjj17-AKN49WT0REaE6NrodX0f5OCpQoiiZGP1EDxfBr52JruZ6IMGzrxUaX-ctJGyRWOB-nXfv4urOm9rZWuaKz0C4zjuOpl9pm_UWRtDD7tWyGTKjvSJfDDG_XBzSKMxUY85vs_fXnvYp4MuvBT6t-A&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=129736\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cbVXJMB-fPTnbIf6j9ojbD-hhvbLRNji-sd3TcPSF8Re9DtUh8GweeN5XguDvqCY3vRXd_YUxgazmCAI_ojPO_cW4rUZKWjcnX1iHucJc8f4l01GwnexEteNs7EHTaVJ8vE6fSX-DwhYq0Gn1ZdSnhp37A3Qzmu5X_ZJc9vgPSFgNpAgCqDmSH4l2WD1ehDll4DD7gjdypV3f4Ljj-LnZu-Alt5UlhyIOS0mtaJelUtxYsIw4vXSXgVfgYnlWlrZl8TiIEIQ4BprB3W8VFkG_CApkLgNw62Lu5P1upZwrxl1drL62D-WXuHEdsuaB8TRPmo5zniqpgV1tfsVCypjnIHJDEL-QumVg5ANZ4rCq-ceTs_h50vUk40y4xb6gESaPyPvOI9A6tQWAGOCigkpzsO5baBfqqA5YvVrYeLGJ5LHCtuoaK4AReDpkOeQ&3u1080&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=50708\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cPjsJ86k46GpW9H2TbRe84AsAHFzavYJiLPhpB-EtaD-oPrSPyk-nc9E64MoDrtXKzoSo6GrngviBdBMgFFn0RmT0bk1JJ-T6z4sEZbdwYogya6PPBd0ty4g1tLAwft6lzOopu_lrxr_mr2728AXzDb5zjWM0TIQ9nDwrPDwFqT7enUbn52QeZDcwPPyFjwriEqDQOEoIlSDdX2Xj_2SlTp4ihAQg3jZENhfM6c08xiKvhTc0RKu8YyQg-f_AbXkfhCGpvTxrtrwXKBU3m8Wc28tkU2Qy_cZuRdaF4c3ihk0L8VxomtMlftWiiFoWemH4wM5-jVMnnZT8_crMzRQfGr0q6aQ4Kvk8FjanuDqLtn3gVfWJbl2GGqbgvV8R5X8WerD8AuKeScgNW954yXDxUaD0AAbq7Rj_Uck1puHr2LTyD8_N4vmyEMrOMRHpb&3u1080&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=113211",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "The Body Shop, Oxford Street, London, UK",
                    "latitude": 51.5159177,
                    "longitude": -0.135054
                },
                "moreInfo": "https://www.thebodyshop.com/",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1159",
                "icon": "",
                "title": "Reserved",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cKmK-6HVaZVnWs4pfy5_xZbyV2pFoPl51NqQEYZHS0DUN-TZEyemudOm_1csUqgHsp6wib0zy3-erxHUJ9ftNogKKzKEgjtRl8hFQzRdwRNlKaHWjMf212_B5FNb89sIZaQRv8TOAxsxh02xskNodtnqiQphPmTMFCnuGKOdkWqHqVFY80O3yP_odjqPLEkYjv3bHkvxV0i3WQk217XReY7rUxSdcVYuQ0vonXf-EZufE31VBlNrVnuIcZvLoXRdj3yuq6bd6sxYePIuc6Zufv-FnTZre5_KE7El6G3aH9prj0TyuSWatkaYALcgbZ2wUp1arYMRq1O7GfrkTHz2sGxGGvSk75aJGXw__ZW8oPKnNDLSRr8xzvJL3LcKOrGx_HIixS0Urf6KIRrJqUAfn46Vh9H2UdZMmaNGsKiL4&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=28550\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cA8JynYkwJ813OD5DDk3LR-U1Q7MxHm56XrAEEhRKkMKj4cTku1u-KXaLiBbuVq22NfFLDLyab00xS_5nWWjPtEeVQAGuAJEm2JYodajrBpTJ6qOXgBydbEUqvcudzSD6XItIhCm6UI1E-26y41pRRTca55oFLQjPBWO-rIdTinzfbCerrsV2P2ZCLrVeaRS2GDvl8oYJOuYBu3T0WO-OQmGNLw38rL_a-rrdsaIhUGmU1i88CSbm8LawPvPQ1vwAk4bEUPyR42SwkflUewD4-zF8DDy9TtHVWZLL0BGraHnxl7ULWW_AY1vuNueKE0RFvza_BTabMwfGpQn7FfxWX12A0cPQRSlPeZWPaiMau74O9qxjC5xA-Edk3YrFvucZAeHCYAswanwLz7vWKbvS8VO46s2fUNsb4pSII1kpcmg&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=33620\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cMS47YbCy5YWcsB8HPkji_AfgyzC7MWmfM11CGAxQiIotAeuKq5RNF0oruDp_kGorRGgzf0aZJWwZRld-f5KOYlr3YsAFMhdLPB-cAVJZZYznbPEZhSGLplfONmDlUSOegrfnPndi6kT1YvmZ16I5eVGpeb4OY9Yes3Vo6T8mZV8kNNRJ_0-ddgyUIVfZd-wfjeL2JSSc155-Z9-R-3dkCUCDWLkpd_VXPcFxR8UM6WfF0ydbK5JaM3FTuFzAyB_uyIAe0OW72d7-dOvmN2SZoLzQ5HeqHPbcfERsS2f2EUsphWii00bTFcQ4fRWbo1rSCcDzpbCuobw9jMxEdbPXKS5IGt7fyreCMo41BjMDeRd-zd5SqXKOBBRp1x9dn78cTRvfi_PIdf8KEYLrMUM2M0Iey5_o61mkYt5Gm8vA&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=45328",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Reserved, Oxford Street, London, UK",
                    "latitude": 51.5152916,
                    "longitude": -0.1434173
                },
                "moreInfo": "http://www.reserved.com/",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "11:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1163",
                "icon": "",
                "title": "Sports Direct",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d5hffsqO6XL2SixUzsuFJ8L7B3h58DOjK6UGwJqXwM0OOpYKuyWmWaFwJuhLUVTDubTyZTfOEk0NfNrryNeQj32_QAjxny5fnlC5-U5dt4RZe_LVHcC2BjpLy6xKeFhRY9gMJ1qR8_B7khsQmAWXcg9sOenUIl3F4zXM1hixk4vfi_QBBLD89zkiwxMF7vXvWhtospqftdWIym90a9go8XI722Ujb3KJuXwgTGcle_bBYlF-8xIDEZdaYGR49BDmzyxHmDPrjJZc4ykU5IJH00jD9o0KgpKV8tmwdzXzi5FA&3u2117&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=111055\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eLFKsPVXrq_Ygqwa0cIBdWvjR5I1oHMddrOH2lGUljAZeLQ01fnrKSQMfj0lFYN0RSE2lK8Ma4vSFTh6fWzEls1jlZWpjZWrSVDNK5tHp6kGoegoENvp60HT99Vuzzv2m2MxU1M3qZCyxm6zsJFtYcCxSzsuKTp5aCLjo-n1cE9OR4JNLmWKGWB4fgcK0vpEXbXYwH44E9J13Fsv6ueyoVhyQ02yR-PH_-sOwqLe4_7OGludcp0Y3gvCHe7jeVjAuvDZekmMPtCvbXkBoU7O9VtKahlBI4tRBHHDDV0JHdWQ&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=69754\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eIjR7rhorrdsD0b8jQulGtK-wvOTwZbEC2vC7b5RZa6D3Xbx9X3YgT89D0FQ7n2vdWFEZZJjdHFlFxx6svzYElyxLtUV-lRuVFcfgFF3GnyLNxxjZFyXt79I2oI6L-1WSDqrzzBFOOdW0kfJWuBnlMnE6AaipujMMIMBy8wTiiQe4HsWN4HBgCu7-rpzpYCexsXYzz6h-iYKTB77qnzhLfGwh59BBqktM4crT_bzlM_2pAZFcMpL9ZdfAujv6QxERtJTb9vVMDd-VpaGRF_H2EONu9C_bUL308qXJl4aJzmw&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=13627",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Sports Direct, Oxford Street, London, UK",
                    "latitude": 51.515959,
                    "longitude": -0.138016
                },
                "moreInfo": "https://www.sportsdirect.com/oxford-street-store-0666",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:30",
                            "start": "11:30"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "22:00",
                            "start": "09:30"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1167",
                "icon": "",
                "title": "Brandy Melville - Carnaby Street",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cbLpUKZ2HrlEPElN6eXY13xJTZ9vrSAhVdOjPNR-rv-st4hR1YhPrDOPA57c0o_YX5dimm53S_hEVKdFfiASf9gBQ_3k1zoqfqXDyLG3le6kpmpHSKhaiTbUBPUhqCj6-7wscy0SnmDmsc_SCl0aJCFGRDiXquu3jwje4MGrTeQSyFREY1n286t7J43l05vT_IN4dmhJKg8JPlpeAFmTlJYN1BhGEWXAMK3EMZtwHMM4cJcuGBU3nqU9xSyHvEVqy67VLHo8uAiESCQvgqhrRqWexAb5pO03o0_u4-dDcXnMLcoHQgQzYbAkRLGD-rdXJN5-zKPBM8FthRvlwZrwasbs-d6qtuW8w-tIHgzyzHKT343tMQ8cuLarpAzjzVPmvCCy0BqXg9zb-IgZr745CcgNBwExH8WWAke4F5M_5nRw&3u3648&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=76804\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f4HwMFsruSkEGX5kdIVxB9YrYqBE07uHUssRS_cUu8VFAudhMrGiplxbKrQ1z4QyOaOVoU8oIsvJMCbc2ix43x5uwagl8wVV7KdCzoZ5Ip70dOws5OqEBla-R6tOOIrYMvPs8L_MNpred83hZdyVz0xI7JYRO-kJDsa0Y8JTBdMVyo0wDBVUsJtyKKKBsfNxCMeqV1mnA3p5RawfP3JSpclhTSIElK_LDdciJevcxdK9N7_E-ecE2D1shcpizUt_jZV1T0a91MWUpL2aAMsOK1lR4Na1dZ4MXfW0_9RX9zoGwHSKlEIGOIVJJMo_M_vh_fi5ZYfI6fLy9cstYKi7ukLOfMxeQJ3TlrujUQ5YIl6Oli_D_qSKfQClUgiIos8rwg5jMskKNLOTbRUMDxUwX12TQpMHc7pUwKjeOzD3w&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=13454\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2en8Rc9gq7wBzWaTm2PkMSral3j77Y1zxMJQjwIVUCgX4BTixt58jsFKVl_3vIlcOGHczl4Te-o6Dp2ZpifXfPsInX2mSONNf4H0CLs_57GxNVkEz3VfJ7tAj-l5NigewPLKpV6rfwrOUHjKhIWuSK33XhbeWbWzatY-pQ-2_yx5ptY92KBL-2obFEAo9RS3FdgB2QyespD5YBNSxE4pJGv1k7_LXtJGBrh3G7FAGAEPV7c-xNx1fE5QuCasHBKKCUWg2O6cbzyxPGwyQBqsmBmzIChisY0_tLdmgRRjQQKEJ5o3xuCRTKiO15JLyU5sgc7frMXOSzcgxTShPGxi1CUWdfL9MhHiq19AqqZayN8yN6nUIdehdIj6xuVipIePMkB1Q6sir5l36KtYkhxiRMOeSAo2qN_oxSlfslxDNEq2A&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=128279",
                "category": 7,
                "duration": "01:00",
                "location": {
                    "address": "Brandy Melville - Carnaby Street, Foubert's Place, London, UK",
                    "latitude": 51.5134857,
                    "longitude": -0.1399204
                },
                "moreInfo": "https://uk.brandymelville.com/",
                "priority": "1",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "1152",
                "icon": "",
                "price": null,
                "title": "OFFICE London, Carnaby Street",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2funeXyhybFy6AfC5PEG5DsOJ7u4_aI3EhsiggkHd9pUc1JA3QDEU1SxZDjtDximJsKKz6RQNrrPaLpH-H9UZNQv9d-Jh8nWRHMmVxxOyAmd2jUIsF8aQGm1-IyXYf4cFNE5Fdxu-NfnxqqVV_L_dq5jKkuLoXjIM_NacAXjvBx2NJmgF1I6Hch0HMxOslGUBt5b1DiWKrEH3MlpMtX3a5V7WS-81LTLYupQzDyzWw785M27rxBO-I0AY0AjkA2tWxFUJyGFRenbe8pyjeyQlafemADlchEQgYMFDBGxEeppg0NxPHusqYjUwPJyh27rXQAokMK1s_j7j1EnqcU6NhNH7VQZc4zzZlatL90btRmVXZEKAy28ftMq3_2HkrNtnVY_pvda_-z2-DZKTfKzvoytOo-Qfde3X2vq_dh9cpwJRmf&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=40692\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ebJKK5mDF_rYmVCEhvglKBryXj5UkJE5gQB6Xdv8Jzrg63pxuDS0hcoa6rvqFf-RJUVou7kUm5yIC3w3cDve2LQm-UeFCvSs-w2A0NjRtqL-zN6OkbeZbqZazM3yl5BcezMi_lEjpxsRVjHUhMU-tms6WBF-kgwZNiJaTWf1qQEPn1j_aXdyXrSH6jA9tC8a0jcceO-OphdgvuS6LV8-vQWl4m5VN9NMSpOyCNBYEJ3LXiY1fQFw-6qwQj8ov8HAoz2XYNkOhUuBDH3VdJWHXz5pgLzBbjJ0peNiniqkzHAbY-Z62u88sKnAa_M85LDC2e0QbeF9EerW8Y2MfpppS_2Vqrg9X6xx6bqqa-U7vLqQCT1PRzt4RbCb1jEfHlgyyxpP1v9ifT6pVIerlagijhQeE7wmq2B1S2gv5w3OIsx-MT&3u1920&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=104766\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fy8ExrbynZvF9_kB9cM4SlJi_i7ui8Q_2vLzzEiM172mUElrat02yrn-nJ9bmDmP9DQDogHwjEroKXtzLGzje3UrkTcC5sHlapsYlILtc4SVuyv4vkMm78hefIZ0hv4SbCE7RolL4rvWNIWv77vughn37V-tDP9gfajavOqth_tPpgKx243iYuXWlotzFQ7526wOBu__IJmIYHtyKWVhHpwN2Y-HsLko2PxI-j2U9p_J7T2IyEMmxgq7FN26GAADsZwBKja4dV5y1gEjXU63ynH7cb9RhhLw4gV2Rm3FSdf8JecmPHd9nA_QFHNsfBj4QnSIQY95J41pQAu5XVBLRdF-UNze09mPxlLqjvZ5QScDklvec3IegQMbMcps5ygYu1_hiShrxVK4oCGfve2jJaugRPp1O84RURjTFDC_FulP3_&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=11016",
                "category": "7",
                "currency": null,
                "duration": "01:00",
                "editable": true,
                "location": {
                    "address": "OFFICE London, Carnaby Street, Carnaby Street, London, UK",
                    "latitude": 51.5131167,
                    "longitude": -0.1385588
                },
                "moreInfo": "https://www.office.co.uk/?utm_source=google&utm_medium=organic&utm_content=london_carnaby&utm_campaign=gbp",
                "priority": "10",
                "className": "priority-10",
                "description": null,
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "19:00",
                            "start": "11:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "20:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            }
        ],
        "8": [
            {
                "id": "952",
                "icon": "",
                "title": "יום צילומים עם המצלמה",
                "category": 8,
                "duration": "01:00",
                "priority": "0",
                "description": "(מנהרת גרפיטי, ביג בן, לונדון איי, נוטינג היל, לונדון ברידג׳)\n\nלהשלים",
                "preferredTime": "0"
            },
            {
                "id": "1041",
                "icon": "",
                "price": "281",
                "title": "Broadway - השטן לובשת פראדה - Dominion Theatre",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2faTdAOMujh2jrf-iOtVDY0t04lvWWOwAu0qIsloxx_KNUkH55MU4xAkb8EzM4aZvEi8w4KvSNITYWezflPqKIsplb_k3UXtIr9RwcXNn0wHjR4u7Xkwwx4p_b2kFou9x4WVVMN795iB9mcDgq8I-V1Ype4j6lZCpRNjUdn6HiwvBT-1qn7eLNHGnhFvn2vWsUXtdkBUhL0ndADISdZv4lm4_XaHARubnms5J2cImA322gJm3xFCD3tsJ0-hWdz8EYIgjse56F933SIT91DBnwJB7IeDWVPhdhC7BaOOQpABg&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=12261\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eckOuVVcNdGWeGvPrrSaA_YGDheuDNvxf2k0WgC8Uo7-fbbq0HlLZZHTsufaalHwOMNuF4uEkZ02DjioytZC2-zqIv0X_UygkszDhtJGnddmA4nohBGOWx1hGTWGGhnOPYqbdYDEU9EcSKh03OROjNb41OcwryOJVfcy6JMgW7dQwYmxAGOMINbsIV50s-9o21aH96aUzuDEWjK0o4L0ABddx9GvfmUobiYql7bBJzWJWl7Tu8RjpT0gswwuD7D7Uhdy-A2gcgX8k2uMyDkx0uF7CeZh4D-d0DZamweym8k1YtsJtI-tOYNEfOECT8Ls9pVlviKCP5x3yWF94VZgidnunk4oZdT5DC5VLoHKiiVTnUMCYuQmiwQLxM4gmbS4grveW-MTKntllxbRXP2NIGsxDDwnAgemOyMIMuUUEfaHP5&3u1080&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=71872\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eU5dBRwMD2EeFV_3d8F8d6mQ-_V6dLZ_-KcoBVpexyakYPZoWkyFI_s0mYnDZ1zz_3d9FT45Mh0gPAwZ4aSvKUthIPlgh_9BWBt-F-yPMTod442jcUPXjArejzWcikvb6ANxzfOO3UyjRUpyHZBRWKufxd7By4_N3sPrmpJFhoHoVCN8KHX-jpo4XEUlKG5SLz_1oYGu539n1CMkPK2wz5vfyYQrnJLyH1U-NNw9znEhw6eI9JyMjYB4OnWXTYGVQCt_uIIDV-AQ3ubTNeXJ6HcRoNTeQ-V4B2aDuHHKf3bA&3u2500&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=83707",
                "category": "8",
                "currency": "ils",
                "duration": "02:30",
                "editable": true,
                "location": {
                    "address": "Dominion Theatre, Tottenham Court Road, London, UK",
                    "latitude": 51.5167185,
                    "eventName": "Broadway - השטן לובשת פראדה - Dominion Theatre",
                    "longitude": -0.1301707
                },
                "moreInfo": "https://www.nederlander.co.uk/dominion-theatre",
                "priority": "1",
                "className": "priority-1",
                "description": "https://www.london-theater-tickets.com/the-devil-wears-prada-tickets/",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "12:00"
                        }
                    ]
                },
                "preferredTime": "2",
                "disableDragging": false,
                "durationEditable": true
            }
        ],
        "9": [
            {
                "id": "23",
                "icon": "",
                "extra": {
                    "feedId": "System-🐞 Abbey Road Crossing - The Beatles London! | מעבר החצייה אבי רואד האייקוני של הביטלס - לונדון! 🐞-undefined"
                },
                "title": "מעבר החצייה אבי רואד האייקוני של הביטלס - לונדון! 🐞",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---abbey-road-crossing---the-beatles-london---------------------------------------------------------1.png\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---abbey-road-crossing---the-beatles-london---------------------------------------------------------2.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/---abbey-road-crossing---the-beatles-london---------------------------------------------------------3.jpeg",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "מעבר החצייה אבי רואד האייקוני של הביטלס - לונדון! 🐞",
                    "latitude": 51.5320553,
                    "longitude": -0.1773322
                },
                "moreInfo": "https://www.visitlondon.com/things-to-do/place/35809687-abbey-road",
                "priority": "2",
                "description": "אבי רואד הוא כביש בצפון מערב לונדון שבו נמצא אחד מאולפני ההקלטות המפורסמים בעולם, כמו גם מעבר הזברה המפורסם של הביטלס. 🐞 בואו ושחזרו את התמונה שלהם ממעבר החצייה האייקוני!\n\nגלו שתיים מאטרקציות המוזיקה האייקוניות ביותר של הבירה במהלך ביקור באבי רואד. עצרו במיקום בעל שם עולמי זה כדי לשחזר רגע לונדוני קלאסי במעבר אבי רוד של הביטלס, שהתפרסם על ידי הלהקה שצילמה כאן את יצירות האלבומים שלה.  ולאחר מכן המשיכו אל מעבר לכביש לאולפני Abbey Road, אחד האולפנים המפורסמים בעולם בו הביטלס הקליטו את רוב המוזיקה שלהם. אבי רואד ידועה כנקודת מפגש חמה לחובבי המוזיקה ומהווה שני ציוני דרך של תרבות הפופ.",
                "preferredTime": "0"
            },
            {
                "id": "29",
                "icon": "",
                "extra": {
                    "feedId": "System-The Mayor of Scaredy Cat Town-undefined"
                },
                "title": "The Mayor of Scaredy Cat Town",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/the-mayor-of-scaredy-cat-town-1.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/the-mayor-of-scaredy-cat-town-2.jpeg\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/the-mayor-of-scaredy-cat-town-3.png",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "The Mayor of Scaredy Cat Town",
                    "latitude": 51.51836400000001,
                    "longitude": -0.07878799999999998
                },
                "moreInfo": "https://www.designmynight.com/london/bars/shoreditch/the-mayor-of-scaredy-cat-town",
                "priority": "1",
                "description": "ללא ספק מהמקומות היותר מגניבים שהיינו בהם בטיול שלנו ללונדון! The mayor of scaredy cat town הוא בר סודי בפאתי שכונת שורדיץ׳ בלונדון שהכניסה אליו היא דרך דלת של מקרר! ❄️ כן כן שמעתם נכון.\nהבא ממוקם מתחת למסעדה בשם The breakfast club (נווטו לשם כדי להגיע). כשתיכנסו, רק במידה ותאמרו את שם הבר, המארח במסעדה יוביל אתכם למטבח שלה, וכשתפתחו את דלת המקרר תגלו כניסה לבר תת קרקעי סודי! 🐈‍⬛\nשווה ביקור!!",
                "preferredTime": "0"
            },
            {
                "id": "838",
                "icon": "",
                "title": "Evans & Peel Detective Agency",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fuih0zrajXpf_2x2vcKdwfOXWvrs5UWQvtdomsp5APCrmcGL0rtgoPG0ci7kCBqpZZwjp1wyXR3IZAq87piNwxN87ck3uE4y9JMY7yofHl0djoEGPB67MVe6g4t13pE_XSieUpeI8XwmnSAHUH1q3tXT8oWOklNj1913y9S_3aQJnpdjPrgRZfcWZgVJ-TscbiqF0FJjclvFMZYuHTTVWZzzt5PT4GJYDWK3gZXx7pz91OvUuRbHkPmWpOeTnnL_lNny-jus4bCtNgow89pihTzC0Pdxtn0Usuj9v95k815Q&3u4194&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=49615\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cz7d24potL7o-O-B0FnwmwyZdCYXKt2mPsYr8VOWtVrLQO-8CjlPP9uzi7kiDhkaowH3qpU31fwiqKngH-VuVhdaTWMVbljOuuVqdH5ms1GSzi2gf6KSvY9VadrfAanoEcGM34m4mIAsmro10uRcHwRfXRfOX68OZYEC5MF8bPWJnuu98b1dLy4sqv51BBHnr3RH1Rik3vaDzbSBDBNKP4WaPOS92aw7_niEXWE0w3wJ4I22xx0c5TbcaA-jr_mJ9Qg8768NtWTsXvDQDk08l2itzYvgv0NopNhGro8Q9w-w&3u3958&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=107495\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fTPu0P9DHhiBv7ephAhqsbF0OLRnTnbQ_DofonXKdsVjnGAutLSlSZl9TJ9CU-Ctgm3u1L9kL22sEPxgFV0ZZywQb9mJHZctIxHEkf9bI5kypXkZSx6tTq9fOuc7-4i3JlIkZUpvf4dd5rXSagogSCMZqmSaVZDkDYQZKy1YW6-yqnI6EwpNd1c61MC-V0eNCUzOnsrrlQJ6g8bjVaYzpX1lOPndHOtJungOYqOakg_5uGMu1nqZ8IdrduSv9L-Y5NF4dxGyXifIxiEb2w9r7zW1avHHWb1zWhszU7HRhihw&3u853&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=7066",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "Evans & Peel Detective Agency, Evans & Peel Detective Agency, Earls Court Road, London, UK",
                    "latitude": 51.49004730000001,
                    "longitude": -0.1910673
                },
                "moreInfo": "http://www.evansandpeel.com/",
                "priority": "3",
                "description": "נכנסים דרך \"משרד חקירות\" עם בלשים בכניסה. רק אחרי חקירה קצרה אתה נכנס לבר סודי באווירה אפלולית.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "02:00",
                            "start": "17:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "00:00",
                            "start": "17:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "02:00",
                            "start": "16:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "00:00",
                            "start": "17:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "00:00",
                            "start": "17:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "846",
                "icon": "",
                "title": "Cahoots Underground - בר רכבת נטושה",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fgrNZ8FIwDzMrBMuC78a5wdmqWKFWyEIhI1UfqC8XTrqZnZOcm2rSMBixoOqyR72_dW48bJtKT5fhz-NBUxFMNlm4hRA4I9VqVWlnXaM5EmGqrJ00PnYNltCjZ0Ib5c3xyhOzOPLHbrCihbeDYeJ2n8PdD2RL0mS-CquxXimcfW3KxSXr7nPa6n1FlnTWYIE4dkG4b8vrTNkZ7NrJ7GDkUr_lW7NbsWLAmRTttIIwRACckiEvJCPKRjUcra-aZLiLyRjPo0CHCnKAaLVwJTAC8oDpgRZ2l5WOWSKAhNi1Sqg&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=32947\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c00-t3BWldUtmqabIIA8MbQr59r5L5j1hxyOuKcOUKUNan_JG_10Z_ztAQQepn66REFdASv7Z5xVtr7l2pKtEEmXvOKv5ZWK_jnODrz-dUgRag8fpv5OFc9rfu142EHQuCmeaC8hOMfhWfZaKfCjcdHiZEmsQFKibkgrMnZ4mKtMj7FRio3XFZHVsoBbJ8Y8-_cmiVETiEdYaL_plNhxApShudmFtL4UAaRSTkn-gy7c_XnSqo1NdQST4pfWVBZ8L2gwMlrJjcF8FjValBP3KnjbUbhxHMvk69DSDP544aXg&3u1500&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=49341\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cRkC71EOCCBIjVqxEIRKeoAt8oxbbc8OLg2Fzxv_2CcJpKqvdi0yp39OMqEvLbR6bkjk1d95MX84zVcE_GDBYw6KOaOroxyAXb9bA0YP2C5W_K7fll9E9nCBCM7Fh9IqucE1ZAcGm7f4kVhuHnTFJuVLHYFkfUhvwp9LhodMYL_bNDxrtJoUCe6hsy7xPDyE4gCngB2emfnLSdzKC6DI7UjwoE5lsISZDOQReICz-MCWVXRNvIuSEpfqR6crDJHO3tfOwXf-Z5b-a3dS8rchwUWUXCrxTr4YXem2nvXBvecpny8LJwNvFXCR2SJt4ttA7Els2aTEIBfT7-leC0_102djfMSkymePtiV35-ZweybXsHaUBLip155hTXr46UmSP2r9YkS-OmLEtan6-YN4gR5v-6eW8_dAttKCAs-gDqbA&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=124850",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "Cahoots Underground, Kingly Court, London, UK",
                    "latitude": 51.5124824,
                    "longitude": -0.1385496
                },
                "moreInfo": "https://www.cahoots.co.uk/",
                "priority": "10",
                "description": "בר בסגנון תחנת רכבת נטושה מימי לונדון של שנות ה־40. הרבה נוסטלגיה, עיצוב מוקפד, תפריט קוקטיילים בסגנון רטרו.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "02:00",
                            "start": "16:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "01:00",
                            "start": "17:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "16:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "01:00",
                            "start": "17:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "02:00",
                            "start": "13:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "02:00",
                            "start": "17:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "01:00",
                            "start": "17:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "860",
                "icon": "",
                "title": "The Crystal Maze LIVE Experience",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eAiqkAcX8fBNBgp3yhCpe4BkSLibKa27w5UyNTObL9HS7SNpjw4TM070duSDCOHZ3ClYUqTSN2TqZfgQ9Ednd4zw0zTBXtcrBAtP1rCxIqTuMD1bNZvGfYYmic_yPoS7LLuEvjf2bLy2PA13t05Xeqv1wbYZXxV0eSd2vp7dP9ik1H7SzeAu1yIqn2uSyuDyj3Pp-9ni1U6_HP_Cdo7hNE79iXkqrd_1kjkFiKeL-XxR3Tg7crtayAosPk6gme_7qA5VkyusNPH_6TZASvjpXTLFvmxMiUNyBtBzVOf7Z3lg&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=26568\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eBKYWVqqy33Y-FZlNz9alq3PhjOthwNAmOVRKC2ErDu4P3i13pyL1nTrfCFNv0x7SOmBTxchGrW39uIo5aoZAUJqUSFaJcjYRU1wsl28rS05tY65DDK3Ddn_A_fTvuHpg4_moOjEfuh_hQdC4DUotbJmQHY_5gCYRdMxl4rIHidOiujNSMaovFhrZpDJ-LA6l6Ti3gvht9qoQKSG88cS_-CIQqnCjKNT-8C1IpVCWHzFxCYW0onq0isNQLq1D_y6C1l_7pt_dRcr4gdN5Cq7nU8EtqzivN0i4nDiUXOrWcBupzXvJ4EqIts8R3S6-zbqo_HuvN94SMIjITbpPpFoXr5oC6do80mmViL6i25WrKbEdJU3xEwb1ydK2ry7l42JiS_4Ry-m0HWpcwhX-hjS6p4nXttTfbaCZLq2_euR3LGw&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=58499\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c_r43Uanrv_lLMJDBaMQsK80X0S3AHAkCnIPtDr-EAs8HljzKSWOJNzsSy2Jxu6DlhKMHxVSR_P1gK1kx4e7EZR0KUgxGut8qUTOORn4CaQzhdOVWSAw8dzaLwQ5fgyu2mx3_Dv3SE0IHaF0nD_kOJYpUVGLkKrBlQOKMeFd-gydEAXmmSn-zh1dIy6xgczZ3QUv-W5UN9c7Eu72VCgjgNFBKoeKKJwfKhq2PSLwSxkrvW0v8jaSbHz3oj40nFAcGXZZsknIUqmcuxO14NRUT_esgaB64k8O09AWB6OicZflmb25AvReMxTyND7OKPWnQLpF8IFkqugGeGJ2wAm6Ic1c7YafUZYonxaeXoOFIjtRaD97yRlxGCWY9ys7UOXU71EI3yiCBT-IOCyWdycU5b4xWg2gWYwyDYL3why2fM0w&3u3000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=109396",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "The Crystal Maze LIVE Experience, Shaftesbury Avenue, London, UK",
                    "latitude": 51.5109186,
                    "longitude": -0.133551
                },
                "moreInfo": "https://the-crystal-maze.com/london/",
                "priority": "3",
                "description": "גרסה אמיתית של תוכנית הטלוויזיה הבריטית הקלאסית – חדרי אתגרים, פאזלים, משימות קבוצתיות.",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "21:00",
                            "start": "13:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "21:00",
                            "start": "13:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "21:00",
                            "start": "13:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "21:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "21:00",
                            "start": "13:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "21:00",
                            "start": "13:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "986",
                "icon": "",
                "title": "Sandbox VR - בר שרובוט מגיש את המשקה כמו שהיינו בפראג",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cjVdx6r02r8r7e3YnfZjB8JdhzkFb7cqkSCVtvQPPPxm0OVD8dISHpwy-JO4Hp4R9_bVwj3g30Mf5k6GNCkagrxf-YZe3VRiEKqzgV2UTSWzWQIljJWFpYgxJM03HK1cythI5VMYloZaYfw3gqqjJ_QVj7-kdiDyMBpf68VT45JcucmebK3o_RctETf1md0iHMgILeTsmrk6H3HUXHXRINiXraAU8XxyCusODSR8pHLV5ye0ZMDBEdRNW4BIwjv2fCrAaOR23XfzgIZGo4Hb1oAfUETMoKvDce1sTRemAkrN2C4dGRgV6_wtyayOsFkV8cH81p8i8Mri0aECAerbFuhDhhWdjirH_FBzaxSUrlhvcB5hoaF7Sz3pQejpYkzGiDrrw5Tfcwo8IEzORp0A9vU12txQxQAIS44nAF_kp-QQ&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=120597\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d5KuBarUhsfIYBxP99WjrGddM3OzJE0CQijRmb11LTPslNSq_JS3Vt9NpPYu-FWMwIaXVhHoDf27vnjx_HiOjh5WJgU_szYqp_B41Zhl1Ih1KEEw7oOrrU7NyhgwtSzMVlbBVwQcY6EX4fLt_1S_YCiUiJ8Ikbsnu5G0Tqva7HqiKslULY63o83TayK8bV9bhItQroN0G5SUx_T5zVtzhX7XP-a41fqYGb-ecg6C8wnHKbAe9It8Bj9GP6tdxvREce8ErJWZFHu1QlJSpW4PG6G4CtlNbh0eC55v6-PKCFcUtVNhlZ5UElf1vvlvP53bBzzH54Dl1A4abGld4immQq0sBSm-5M3jFQeyFJ5hVm7wgfQcjf2ohNvIz26Vo38KF8PZEphUcRtB_Vw9taaIQAllqKhbNbxvu9BRxOxVRpXfX9&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=35666\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fx2HRTbzuLy7ZvdCs8_Z5-NTjhMrZ-bEEqD-_ZTd677nVIdo9HOVVr5frO0SkWM5a8vdoyRz9bLq1Ziaw5BrMsD_WKM8SuCHC4ylHj2PS0xcK4CPdyvIc0qECDok0EokR9_xuGJeXv6A8lbmhnFt3CcPB1L8K0hHpzRoMYfL4mx1TlOBgql7zCIXEanFX4fm0wnu_iHDfL8vsrDfKwvIN1xRZGK60dQecTlAncPWqhTGZ3X4bviSmBNeYMBlht0eVCPjZsvIeWXg53Blmt8BN8aGWuqnQ-8H10gJmwNJXnJ-a2wVj2gvIJd2cnV7Ze7DkScJzcGci0SvdPGPfoCYWUGRYgQ8MZiMoKS6L73ifvK4kfebq7DfNreOyHAsl2A0A5sNaiGZG4u3Fv1Meocy-ZoB5mTXHxsPICXsVubnW0gyEn&3u4080&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=112396",
                "category": 9,
                "duration": "01:00",
                "location": {
                    "address": "Sandbox VR, High Holborn, London, UK",
                    "latitude": 51.5163464,
                    "longitude": -0.1244458
                },
                "moreInfo": "https://sandboxvr.com/london",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:30",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "23:30",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "23:00",
                            "start": "10:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "23:30",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "00:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:30",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:30",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "855",
                "icon": "",
                "price": "310",
                "title": "Monopoly Lifesized",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fJRVM7mekBvIAglslcU1vUb0Z_8-0Sp5_iXQXP4x3X3W0Odxhx7ydinb9WQFPp360pwxB5gE6zIDrgnnXpeC2JJz0zBmf1XRufrP815Z-lXZp-kD8hjbXFs9iD-cCWIeGj9XWrmOVYnEcqjSrVf4OGWVkBM6lKAV1rd2-9ih7Qq_qB9pN673PfbcNEUjYVk0hZ-Mrfz2Gpm4Ce5eil9OzbWtemcSPVUWNvbJ9NQuJTogPd5lswOnwGzrzlA1QaogQTcwBp4Hnz3qybpijno3lSMuMcyk_DEvu2PzTjJui9yzLh1KFD7b-JZ6NFNawoYSKuO0xd6aJboKkRaRbICNC-VmAbexhp8UTMT2uW-m892uiD39ztyeLpghRotxaBFYErlHxQXtEC8-pBLeMyiY9yvXxUCnXJk9xc_IwJ8l0mdw&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=8329\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2e7oq1H-8N85ue2iErIDd1N3Kgocak5DZUB2E1JuCN9ruqBzB6fT4nI84qUzw2vnKUl5XRSG9RY5HLLYQvULMaEsCXEfnM4_nfTv3pakpBmASlpUEe7-eVoizUEmOOftqzjtLygla_BwtxyQgT70dN5a0vXAnhi7qtsNqm-9K2QFOSB2yY_unlVbIC9RYqs6laba1DhBGi-0FYpTCIsdP2F9DbYibHOW_vWIrJRCPbsVkevSnQSUUTNaxMBoISiRdvQPCTrkrJ1UMviZB5aYGIgt6rXqre7-mFN_mYJcGnsw3x9dxeyt1P4--CGMTcjO0KyVYHxJBrZRLW9IjIXjI8CCL3ZnifjL2Mndf52sU_mmYwYzXBKcyjjATr-RKuBs3a0XCFkmokvI6Qop3gqfrxTx0yVVkwt14npkr5lAF8_QZqE&3u3072&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=6301\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cdinq5QqGGVgZU4WVKkdTkNwNRG5p0lzwqDEcWJPnjO32rbaemYRLaCiR1lzHmXgIr-NhqHcOukN5Vd3JPiixYXQlLRRlQ3c0h5s_kv9LMwAI3aidUGDGBtXzemFtUNY11X4C6KcpWLMNDH3NjY9eRYeLAl4x5b2b29Zwx6bwk8AOcOIFjRruH8bZ5XIl9BjBLrg_Lqldd3YBUvY-FDIGjjJibFnLo8JtYt0FncbBCgfFHUB4dk16HWzoim3vHO6W9bLSf8eJSaF9-i9xjQHyou5IjzA9lh4eZg-2mXVPfnmix6sxhs91ChH-mLuDQp5JThgXHmQLegJRKJkSnDRIgDww2nv8xSUXTcbjQRWWzzsWaJphpuGlupmHAMUuq9hD55d4gxPo2XMmByaQJfRb5VFqVpVxKNx62LkClSgknxflG&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=51133",
                "category": 9,
                "currency": "ils",
                "duration": "00:45",
                "editable": true,
                "location": {
                    "address": "Monopoly Lifesized, Tottenham Court Road, London, UK",
                    "latitude": 51.5200679,
                    "eventName": "Monopoly Lifesized",
                    "longitude": -0.1334032
                },
                "moreInfo": "http://www.monopolylifesized.com/",
                "priority": "1",
                "className": "priority-1",
                "description": null,
                "timingError": "המקום סגור ביום הזה",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "23:00",
                            "start": "13:45"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "22:00",
                            "start": "10:15"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "22:00",
                            "start": "13:45"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "23:00",
                            "start": "11:15"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "23:00",
                            "start": "13:45"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "23:00",
                            "start": "13:45"
                        }
                    ]
                },
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true,
                "suggestedEndTime": "2025-12-29T10:15:05.000Z"
            }
        ],
        "10": [
            {
                "id": "762",
                "icon": "",
                "title": "Hyde Park",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fzRS5Ys6yvRParc6wLzNYFqRZQRzaMjfJ9RGDc3cKh3vxq0AXuQh21mO_ooHTqXUINqcgPjLp8Edp0678E6Xi15Pm_4_eQmkzAfC4gmsrDQ4ogDxIeHFDAfDVgJbQQJi9V--Ih4Hua8TMO-TJN_20gAZpQybcrii20o-bdA2jj0SupJjUqtwvUJuoKFRpc_8GEXyhn_R5AONr0MBfD9ofpi3CeA-pnFcZVuJbZVJieRBGCMsjkHnPc0FSSFlS1qvfPJa6yTgTRWPxSq-nsiyDVyPqFt0vpK3paLYeplUotdkU4JusSvwhPojyuwrveOBZGkyVzvCfn4CSGJaAiWSx3Kr0xHNzgDz5Ti7Lzg7-8KHaVrbfEqF-45NG2oIP1fOtHXs1r7TOONP0pPvcWoJD0-fxMUEwzqBUOhLMB0E4&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=70279\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ehwXgZUeXZnAzCyqWlbbwX7JbVl171SiYIavLWT-Dd9v2W-WofrczcJyWE-f8325BTGzY9D25dRnyO8fyz4btesTMhuK6a1zeOLb6TpEnJc_SJNMu_mcgeXPETmUlAOKBD_NfwpSVbWyN__sKcFRN0PTduu8IAV4NZgii0MGGjBICq0DOFOMumVK6JiyolhW0oID7Wmr9FR0VXgavGpqN8lzLlkjlr9Qq-Y0goEIgjsuu7e7XFCpAI54pgAGeR6IzndXh8Z-fJi-XhJLn_DztoCOkQe0YqovmP14YFSSu8qmbFb8jue5hpfygmhYIWZ5s9d1c4wW9qDQrarSMKbJn9j6wtWPHvUyPobsECiWxNuRCjN8WzEgrweHsNnz8eMZOhnRJUNeQ5ehIDEHnKn1EI4ECDlCR6iWPCUZ5uC9A&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=6000\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fl-rX2NJcMnZUxdG2k-SYtwaMMDKOl7BMFFTfsG_Q5EFWYMOp5LfuAuxABIQ3nq5fvHzNAcId1FtOqecer24hJ4UnTS39mV4aXywPD_W0UO72atnKCyVFlwedNbjyT4aByQ5PSQE0HCqSib7u35faN0hh-Q4INUMS8vZlEIo4PBxZ5KO-XtkScBJh-y9oc5Z1pvAy-oJyx8FZKxe6BTK9NwMT1P37Md4qaretMD225N-TUoESisCd0zi75wJ1OPPEE5s5RNQey_OTp0jNtlpLaL-o9GCBIhbsl1-XwRj76YEoNdVfHwum07WpsV2b1-opRtpMVNIZPTuudSyMbat-IS0OIoWE9spuPWlHidGb5JUzjJKA1oE9gAyneanPH2bHxRKhZNyUzZtXaIbEXdVsMmTg47dwNcjJGMOn5UHOb3w&3u2886&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=78471",
                "category": 10,
                "duration": "01:00",
                "location": {
                    "address": "Hyde Park, London, UK",
                    "latitude": 51.5073638,
                    "longitude": -0.1641135
                },
                "moreInfo": "https://www.royalparks.org.uk/visit/parks/hyde-park?utm_source=google&utm_medium=organic&utm_campaign=google-my-business&utm_content=hyde-park",
                "priority": "2",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "00:00",
                            "start": "05:00"
                        }
                    ]
                },
                "preferredTime": "0"
            }
        ],
        "11": [
            {
                "id": "36",
                "icon": "",
                "extra": {
                    "feedId": "System-🇬🇧 Oxford Street Londo | רחוב אוקספורד לונדון 🇬🇧 -undefined"
                },
                "title": "רחוב אוקספורד לונדון 🇬🇧",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/-----oxford-street-londo------------------------------1.avif",
                "category": 11,
                "duration": "03:00",
                "location": {
                    "address": "רחוב אוקספורד לונדון 🇬🇧",
                    "latitude": 51.5152526,
                    "longitude": -0.1420381
                },
                "moreInfo": "https://www.elal.com/magazine/portfolio-items/europe/uk/london/london-flights",
                "priority": "1",
                "description": "רחוב אוקספורד האייקוני של לונדון! 🇬🇧 \nבואו להגשים את כל הפנטזיות שלכם ולמצוא את כל מה שחיפשתם: החל ממותגי אופנה יוקרתיים ברחוב אוקספורד, דרך מרכזי קניות ובתי כלבו כמו פריימרק ו-Marks & Spencer, וכלה בשווקים מגוונים (עתיקות, פרחים, אוכל) ובסיילים אטרקטיביים במחירים מצחיקים. עכשיו רק נשאר לכם לדאוג למזוודה מספיק גדולה.",
                "preferredTime": "0"
            },
            {
                "id": "86",
                "icon": "",
                "extra": {
                    "feedId": "System-🏵️ Camden Market London | קמדן מרקט לונדון 🏵️-undefined"
                },
                "title": "קמדן מרקט לונדון 🏵️",
                "images": "https://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----camden-market-london------------------------1.webp\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----camden-market-london------------------------2.png\nhttps://triplan-pois.s3.eu-north-1.amazonaws.com/images/pois/----camden-market-london------------------------3.jpeg",
                "category": 11,
                "duration": "02:00",
                "location": {
                    "address": "קמדן מרקט לונדון 🏵️",
                    "latitude": 51.5414026,
                    "longitude": -0.1465084
                },
                "moreInfo": "https://www.ukguide.co.il/article.php?id=319",
                "priority": "1",
                "description": "בין עתיקות לבתי קפה - קמדן מרקט הוא לגמרי יעד שמומלץ לבקר בו. 🏵️ רובע קמדן בלונדון הוא אזור של מוסיקה, אופנה, מסחר וקולינריה המושך אליו אלפי צעירים, תיירים ולונדוניים שבאים לשוטט בסמטאות הצרות של אזור קמדן בין בתי הקפה, המסעדות והפאבים ו- 200 הדוכנים המציעים שלל בגדים, תכשיטים, אביזרי אופנה, עבודות אמנות ומלאכת יד.",
                "preferredTime": "0"
            },
            {
                "id": "590",
                "icon": "",
                "title": "Little Ben Clock",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cRUQEDt605L25QV4Ix4ZaGiF-_-RFokKnid9Ggayg73oZFMXsVQ4o_0XAxSJz265FQIf1FOl0C1VHxv4g1SLlboVtrCzbHHJYZzfTI9OVHbkyeYr_H3L3sFp5TvYk3w5-PBDKndo6TPi3pWjVaKXeRQe9mjjzThXO-U4dnrcml8g2-c6tdhHLd0FxiNn2gKwnf2u3F8AY2ti4oHHMPVo68P625EVCR-gPNfwpWFAOG9xFbQpVYscihTfDzQ795GN1NtGREDekvrfi8KSM4ZY9W9QRQ2cK4DKcX3c0z3qV9zGfhRl0KnBslU1qvJMhDH3JbKANp0QycT0FvpGw24y4WqA_NOhftCccZvYgI2s1ImOFWoF-sPao3lx6vlVJtSbgB4JyITR6Vykq5S2SUeQSWpdlUKLEAuaa0yH8NZau66UDZ&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=91158\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eakBtAP-HPH5Bnz_sqg37_GCdpFu0Vmc-W9uDEphshmJS0QHctCPvMlmHYXaHqDQffsfqGWmeZQwAPWS6PZ3eAn7wmx9JUL5SqF0zzlVH7oGJcBiFWOp_BxVK1VW_ppSKmmcEYFDFYbMpCpfS3Av7h82TbkMXYfRSOqQbV5j7v3huD1KTZ9rjBZ_3K8ZWfUXr5Y6xxhi8ejmUummMaY7NNrYCKiOoYsAzREEXKKVY6mUZv98Q5fi1wmmnwx5jfpyDJaMeTES4KQUemxamtEw2UkUWK1Ns8CBwNR24n-g5JGUaoYvJMaq_9LlR9e1k-LeQh7KJQXtYzhb05j9BzcPxpBQH9o2TBofJdfdgF5qcxINNFQiA_vVBnSWiEWu9qnJYjzzFpPNTwJuFya9iatC9BLornZglFo-Nh3Q5Tc57kZQ&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=20691\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dotXDYr-HO5nUer_9xpNEm6mutreAIGUIsLkXCDSJAwBiitUc4ZcWSIgpjfyp8mosOz1_B7oNG9zFXTvXZcbKP2ZmNf9E7Reh8BoFmsXvzcP4rsmVA0D_WGmE1Wdwc08CRpAcuFwCBimKblSPkcEvbYOeMRUmtdsh44JXa0Z8FT06LDdrXWNaUaOFryQrQY_MiP8CST2GCElLN8m8ZTkz5ErAOAyBZQrwJwtU6jarNOmS_PTRoUtosnuKf2EbI-N4nGZ8MQUlL8M4y6zE_NRfK6yqKot3UnriJrXdb93GkIjwuTucEX3UOD4ArHoijWEiQ4db3smm_lIRKb_WBsBYJnCZFY0RcjtO7D-_ugGtN8IkTECLG7CRLJjwFv9LYRYo3tmYGNiL4Jw2mB0X4eQDFe4B3ptgJRh6Z0ZyEP2c8MLU6&3u1440&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=39543",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Little Ben, Wilton Road, London, UK",
                    "latitude": 51.4964655,
                    "longitude": -0.1426768
                },
                "moreInfo": "https://maps.google.com/?cid=13672022461764904462",
                "priority": "2",
                "openingHours": {
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "00:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "625",
                "icon": "",
                "title": "London Bridge",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d7lJwsljHV3Vo114n6rj_VIA8RpHgMYGJjxs7458kbM4fEHHwpyb-kf0oV3VqhnmRCY2CAFJouDQ8nXRGUIWleFFYMX8UVUKGSIKghfbMaYjBNb0RsVMd4bXRU64eVedeGWWUrJIuPTqKYYACYTdf6O7AUhO5xMXQeQIH9Qx8bpWrnIm_VdB6mkniCnLJZdxXzlf0eqrd4nyRFUv_mjPtleYA_aUcHn7nc0GsB7O0A0v0SfYKy-uMVamPPrl3CktGHYbL_vWqzYYBayklnZ651a3qTixztuZRzNrksYWD8rVAmpBazDs67ZYL553i21ImOQh0dLRaC77A-gxOIPml-EkXY7BOfSnOqxmSP0JlvUB1shzIP27GjAA2j97jRHgkN10B45Bp4Sy9lLfPYsuDFG5PSfJlAsbZWMRZULUiRukc&3u4096&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=53940\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fdEy54qLlfOjqIP7zCj4pdBU8gokRMyGe67wOLXLGn98qfcDItrxOOiVwyoKB6hwklhaq0wXOOxTsxt2EOnoXAbIN9HkpnMW5dzVuZYqhitP318mnSxwVC5nFUqPg0xsxb8QN3JztyCVShn6j2Yro-rHf5KjRDC46dCABl5_k5cSi2fJTYIlSrIi_sv3GLktZsmmcB-dIhTlQ-TM8a3ljLcPhRcjgS4PkutI0crsPaw59BwX7Nvoxl-j30qwR3B5epzmk3oNPuxol6q15eaJ4ARB3T9tjl38-Sb6JZa0XhrTlXDE1QjLxQRT1kBy3o5H1FYBLOxDAdZny2_fRXCP8EQ6jXhuY0CJmJi8AeZZn8J1YFUe91uSMU0rAXsEv-UcGSUqWAZc3GzHyh4lx31foZuTU9jGGSeCEiOgv94zU&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=15110\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eU1P2qAQWC_lNBbkXTr9yef2ygL0nunruJndRRbVepuxukAcll3TMjT7-nmdUrAPazCeyZ6Jqld3wPhXyhQIjbV0HRGoc08FpKci9py11-LnNchmJYxunUggqojl_c8PuUTjQO32H-3iAIaQeqWmetLYHpz5O4qukV58U-vcmz-Q404SbpQwpfYALJAH0m3tJlLSkoJBbCJm_exdJGzKXx6DtHyDG1-9cy8XJXeqAfpMzRW6_EHvCa9PJcbwfcgqOMcBqk7CmAJMBIuds3QTTRqPLhNvUCAvgP7GEf8wqcdytboDZxHDonY42CkDrcVNN9rAqBKj41nAsg3LVx4bEKFosytXZ6xXGEy3l8nHaNfA1XzCtGIpgWnTa0wqZNixXnzCUMRiuIejRktAqMtanM_iAqWvZF9-VY0skqzZezpQ&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=20421",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "London Bridge, London, UK",
                    "latitude": 51.5078788,
                    "longitude": -0.0877321
                },
                "moreInfo": "https://www.cityoflondon.gov.uk/things-to-do/architecture/bridges",
                "priority": "1",
                "preferredTime": "0"
            },
            {
                "id": "766",
                "icon": "",
                "title": "Notting Hill - בימים שהכל סגור?",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ekwwAVkp7Za51EImW3ZxZOCafVvRTGm9Mupje_ZMHQ2ffUWbBlrJhmoINSx-j6VLisfCyLnylrcb-Usf-r4bkLJD5kTeNv6jwIIOTESD9p4VLJlh9duD_08FEqHQ7smWvWzJl3cCgxXP-HIbuxL443YX9ltrQm6H4rnljj4eund9phuw2uw8YU8bfjJ8GqqQAyY5PYavXTeHyvcDfEUJYLB4skF8EUM1XjATHUwCb7kFPJT-tekhwSBSoroWjBYq8FQCp77ZHu7odcVE73HlB25yJ0xejmDdh4EDU-bxbD506d2wYaxglc6fc1IxAkyRwxw8dcSN0gi66I8ayeE2aKCcUfMaJ_tk04xfTSsXmxUXPzevu-iZfio07l_MgHYsKNm16UsthwBwMSjQO52JUe60XW9YS8rAqjI3xqvFEuZGU9&3u3456&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=14793\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ek6ueAvo8tjSzeMqzBJPGh5fgHmfXfAPGgZiaGcHjvWlKmCQVog46rSFoMwtM1kYtrmYWCK55w2oZ-8ML3Xf-KImO6EjMxhjDNBLeXfjkZyPZFb0EkThMWoEndEYlj9rmWLWjyDmN2NLkh_XYh7jI1gPO2N6lAFYPJC44bQMcjMoSCvTRage96xUwugV62WDyrKZokb8NJ25sDxUgtJ0UtMww_SFDW7Jbq5RJKXIiM-UAfZUffmmVKEyGsRf-fXLchXjMWk7eQPVlTXNywpLx4nW2MPWehnmW5mWSTRq7h2iEVRjBZaN3s1Xv8YJ53PxMA8_o4Oe9scjvN0bdQMgTZYRRNt_lwVT0rigmnB4Z3BzuCjPtkJqjP2SNpjJ8gc652RZeczNU_NYGq5v3S7iILs4F24_lmdyOIJTRAN3PmfqnJ&3u3648&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=81066\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f0fXdaPikkgKWbh-GS0xWEEisRrLjzhZlYwloNfaa2cOFCK2JIHwVkfpmyoG4E4Yjk6H8hIF_e7qb6pBE3yTFKaAvRfmAyxqh9fsiUnhouUkjjCWnt9KrX1GXhFCuQQLdUH7b0X6RZpFVr_teEvY0rB-BL73dWHXHX5Do1wtVAUpnyCYgK9W3aJl_tp9gXBBZj5xrcPHUz155YazA7YSJZ05ydjVRUkaA4y2aOo8TjME-zb1gyW02ZOb3XNPsxEtZeib7TJM05929mydp0wRf8NoGDk_mZ_fIlUpUCFaofe9aX-F3Lc5fUogJ-5UWXOqXR-t37O4mFENgYaQhCoODds3KLW8pIeMhKLDOfrxcCipotQQRM0HQ6U3lojXi9amVN0stZLZW5ZRJYd-InNEg-1MJM4pC2f8LcnydF6m8&3u2268&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=100326",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Notting Hill, London, UK",
                    "latitude": 51.5160125,
                    "longitude": -0.2090148
                },
                "moreInfo": "https://maps.google.com/?cid=10385554594526980682",
                "priority": "2",
                "preferredTime": "0"
            },
            {
                "id": "769",
                "icon": "",
                "title": "Borough Market",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c70IOgSmDVx_b-NI885Onm9BMYPL-NN9OV-gkvkj1y6v0oh_bk-__k9K3epD6J0RSgMfhhcRc3cfH9gPzBB843sIL0A3FwBHQO6kcSgvt9F3OWB_s-X9fsZs45immJJS-KGWRBeuwuf_WrWsbk0xMJEJl6LNGoeOcjlIHDinfkaUI6cWyQrbH-PDF6dDeOtblohrzryvJQ5PK3QqLtQLcs5v3e8-NcsmnVNIP2ftj5lw0maMlznGo-80KtyG29vXOA_1fBlozV2-weXnK65xIwisjr4kbDSbuleAx_DTkptKFYp1bdhHF4N8TwK-4AsJ13w1iCfO6kywlEtR16lKjJ0K9gbxJYt45v1mlkai5ScGI_qYLhWajYpleZz5Ek5pj6HwPALPbDsr5V7o8qcSzmDYmqCozaBUO6mgv73APfNf0&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=24792\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f8IXhEWwHm_w9wmX4-Sxstt0O9aPI-ltJ-CYFI6aevvtMVKSP17MR-cekXSz43Ra9ZZzuFHSkcAxCdTW1dSLRvwV-HIfps5IH49qqlSmJbYMqx71M3S00A-UdMQPuGI5VDga3PS-oyO2gg3ZRuMVP8GYVBQtCU4jQS5H7GmY4XBPqXlNkCkoGknwbT-pbxxcdplY864cy78mXz0oz38A_OrwpRJXzK2mG9gCsgwH3weaLHHO_COfY06KcxpOJs2EnpBm2TynbysPB284WcjZsUfX4OnzEcDQrv38qmuq_HP1yCCLJgf0uGa5_hB5wlqupJQQ2Ts0SBecXXGcFeL_d3V6V5z0X5B59SU8udVOunvaxeI91AusKSQZiE0ueduFiq0af6VFVANLd7OIT3-FiyzB-P9ztHmfa2rjJcOub3dC_1_6uGRx_1FWjjC6Ji&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=12693\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dL7ogDNBsw2e1szpyTTx8trZ_JG-7JUMuMBEDB5zjaNKZzHiUD0qS8e2yccQA6j8Dsen2Ez4HOGTJrKgZRst6oJqN6lB7gASc1amQjwenhdkqUVp_WJCFWyZ3rzkLcUB-ywS4NeOOULdZVK8VKSa1FYDlJbqi6gXQLRAgGofUT7RFkdnWSDBoPafPg_gsjMS4txc_39yVtNEGeGDdFmRAMX3t4eVsr61jybdmBT1gBrEesb3VWe-e3YiyVOH-N61dyNraQhZwGst-xaW_wzKLl2H5JCfhAaJxby0xZh3mLbkbEtAg_KPER6jfRBKcMhYKhB_Cba5F1l7xHbbKeh1gykxhtuNwbYSYlFgWBlk4Kt9HsviiBHdMf63obz8vEVdXiRNFuG6Pcr0YSpM2uSkzk_HqnTpKq7--JIrEW5seNfA&3u960&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=88",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Borough Market, London, UK",
                    "latitude": 51.5055826,
                    "longitude": -0.09048080000000001
                },
                "moreInfo": "https://boroughmarket.org.uk/",
                "priority": "0",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "17:00",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "16:00",
                            "start": "10:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "17:00",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "17:00",
                            "start": "09:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "17:00",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "17:00",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "816",
                "icon": "",
                "title": "Trafalgar Square",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cAcIm4peT9xzCAxaS7uj5Rno7KQLdF0eonH65tNutvjUM06cMOlSjEtaJwUb232hOapo1Wh5a3-bAHGZIFM9QF18SB0SGsyoZZ7UQDljM7EpA_QUrUJyphxJvKdgBs-9GYAyPe192040C2ZKKfCjnadAQcLHZ7MtQujmh2C1OJFFEd6g0uMg2s6yL4EtetM6CaurkQw2HggU1ksm-PnubUUndHswp_vo3zAhYcFQHeHU6oDDPcw77JqOWoOzmN7Fyneo6ExqZcgVhpxeAWmEkcP3wsLh4_XsBhSutxl8CDw9GJnTO5yaOIkuNjWCtJLlrF9DK9mjwYrpiqHvxlmcDPTLJ67j9T7zZ-FaHcyLRbT4W9qu05yR5b7Df29XkQ7YWOek4i78ygbQMLCtSEH8k-jEsI9msYv07S8_lbqEjlbwyu&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=56032\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ekEL6tOCRrQJu1QttCA1b4yKK5yFHxk40qz2kAuo4D1Oul90NzmK8iss368pQTxDOPI7xok6_XGgUTO8CcMRDZQgeJO1nbD35WyEfT6MGl7BH7tAOzvix4WCoNsJRpqLbQMauULIYAVRSg5hmxnClnirq0-0wD7egqt-NRIlfLb1XFYK4HZ6ShloETzju2fdYj_3eRBT22EXMv1FNbUdVKsn7NGk7GPvkq8I4CUsvm22Wbrp9Z0T7PAYGD71Dph5Afe1hXMXmnazNqIkkDPLmrjziayofP9LEnxbtA1rp19JRLMHL4dS-9nuSBuJgRJxoQ-X6BV_w4_Y1p85YXL3bWfwI4gv5Q2HFYOPiLtMv7j-xyE88WCO6eQWR9TIHl_9LKN288fyQV9lB5q-jvmmmnEj48BsdYLX2jG-JXmsG0JTum&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=52161\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fUilQzDIZPIoUcJnu3zgZsCKfvP1WI3EeIzkvS0s_CYp5xpVDLh5LzERjLIXx9hNn3IeguhJHkdw7lV0OyBR2VaNLPkjfJ-3Btess_Qcu1EkPZ2dbelNF4hDhspvtad1-FXgEqVaDZCeaahGg2t-FUM0-_8fSi-w_Jth3VpzTz0PWuHElfh4R9xolJDUNbxenuijIBO6BrWNVcBsaOSevaGkyS9ASWDGy9BATxxqGQOSYaqOVEbr8y54UkSZTcZiiPC3i0sjllEjhE7IhN_xgkNqHXo1tEHuZSuslAVu9jJp5jTL65t4qY1y7z_mhjVPDMhHwxFWrLvtvxAXpmz-BZ0Xo6pQKh66LyhRO4kh_-gkveOiRuGlQyiYMUl8JuqtGyS7rs2PZF4Bzi0gwx39L4nl_4ufvTudTGOS3xHVO3Hg&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=41065",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Trafalgar Square, Trafalgar Square, London, UK",
                    "latitude": 51.508039,
                    "longitude": -0.128069
                },
                "moreInfo": "https://www.london.gov.uk/who-we-are/city-halls-buildings-and-squares/trafalgar-square",
                "priority": "2",
                "preferredTime": "0"
            },
            {
                "id": "869",
                "icon": "",
                "title": "Little Venice",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fj5nyXcXTno-l5qUvZxetpoNUrGXDm-_NKL7vl7sN84jEFowMyASMPZ2fcCRr6FSbhzjdpqstsfbGNwEGHSJu9MGPp_JClxFiyIJcaBbGUAp2Gi_8ZhD1bkVoJSz_JhS3YHGqW9IfJ37FqJxlR5L2HAqMJ2MQdrrQFNMKoTHDmyg4dIve8TGCG8zLAp4jxDA41w1uuumwC-7xw3uaQz8RJeZ_MMKDTLve9wtNYf1PRn6vPeo3n_a2w-0vPjgNzYlK0Y0cA5cPB6jKD3jR364QawKBXH_5fyYoqfqKfZtx-8pjRoxMhEEWZwHgGkpK4T13gj6E2IPegOKsrKIPFfLmyAp5pZYiA2SU9cmhDRxp-B-aI5U10Fx6cYY4n7m5CYogdrHYl3Ha4Xg2Frz5U7ILLXFyrILzMhJSBQmhoz6J0mw&3u4624&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=58659\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fKyj9qdobfA7GoEzPdGTXcdpwPO_SGn4m1WWrPuuqLmEcGK-_K3rtuSBPpHNuPhLTP-TmWOlXzRC8QIjuH1iGy-Xcg4VhFnCdrj_Ze_BPDW0ryGfKki2Y0DIseFGV_kPLRu9idma0ta1uq5MbUDHzRhiVCIhflt9jpfzkYeRWRKO0jduOQnciu88hvWj0NG8Y61_U23psKj8weburwAPCgAFBYlAdGCM0fdE9i-jX3AHNsHyNmjVdMY0IuzaSRoQtucyHwAipHe7_2giUjBZ9A-6eiNdofe-LjAtnDQ975hKPcxD0_Ex9zis4nHN-Zte3nmF_aDiEOUTdUIR7HFo3wNUpjeA2QwjtVfGxiZaMI9MLWZdaMah4zFWXozy4Mr7CTwro47-xbD-OQ1RjYb6WnGy68-frXi-IJGH-Nta4a6Q&3u4624&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=11704\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eNilyeb2h3XVPpmg8UXy1rPTyV9BY0pook8Dw2L2vBRnd0KKhZf4wAa44HcNopkQJgBTpAppnwzqfglAQ6tNUEMPKHshWgeN_HrKsIXy54Nx3pOe0A-WBmtF9a6UgPsmAE44hI7HjcY45xDtfmMeK2RAih_mYQ-gcHDvvUnaJVz858ZLXEWl1R_afdPbEBf2U_sY0vzPD7-ztoinzK4Kf4vy2Imj3NJuuhK5t_a6cyGnKOk5EVVnAlCLuYUUXlaPlPtmXq1grC4qRax2zBnyOnEP4IHXkWivAwx9vi1fj5gxg-2-SSXVEwZTHsAIn8bnb9VnHX6eVNgKHiD0XPB_N4axgE6L_-vqLItEL_V5qKxadXIgGhjJSYOGlUTxrS-YV2t6UJkfjPBP3Em2Tbm3EqvDjlq9fzmTT-VNXRS-FdS0J-&3u1440&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=110743",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Little Venice, London, UK",
                    "latitude": 51.5234835,
                    "longitude": -0.1838854
                },
                "moreInfo": "https://maps.google.com/?cid=8406575678827122001",
                "priority": "0",
                "description": "אזור רומנטי עם תעלות, אפשר לקחת סירות צבעוניות בסגנון ונציה.",
                "preferredTime": "0"
            },
            {
                "id": "874",
                "icon": "",
                "title": "Frameless Immersive Art Experience",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dkunjO4C6ttU1Zbg_fFE5YEymdccz-0F_INaZRc8KqmoFgsBWcy9sPUsW0cF7_EI4yR8TivKl1SKxQqO6zezFUKvjDzkTziOET3uG_I0k7Zs_QDwmJfz5K97zOV0K08dhCp2-wPIqwPN9llgQWG98kyi7oIrRQ5Dn1wQ_4BQjxI7jrY7x8bTvZP3N_YG4E5WwqexoLm6igqmHnC6ZtLWmbmihDLp-8nfkxBmjVoKesQ5Apg_tvBXh8BA6uCvnKlt5GEjjcPS_JNLlaMdZ5RIp8QoPcwGwRUfc17DuRRezzpA&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=52289\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c_Jxvdu2MaGmKmjdi8ZPq9htVDT4mtkezYHsTVaLfGQv39LBTBu_ZZ9_U7o_CA5Kt2xCMdwig5DhcgrhgYmJXajeg2slOs6CaO7_YqVPaX4XITgOXE-Mb6FmRYTuNE66OB8vQVQUa5Mn8FmqLltguH_FAYxRqFioOrZ8VTL5Rh4TjunttUD6JWaQ6HD7ptxk_gTU1y-ZaFhg_VN4YnleHjqXKmSlqKBgR8-R1Ky_UdCrM5Sg85o9x9H-l7zvC2g2s97a8sFgatj5tQ1h9ThJU9OneV2hJ5yVr8Hb8GDT6SAp6buAC0RTPoxko-71quz0nBuSr0UCcoA2prznzsL7kfILfo5K7pbx2Eu5QedEdyRh4nyYzOdMcdt0MBi-5ECyw1qwnbMZzCk2yYRLruaytIdGevgLqv2ZhgKVC_0U6_0Q&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=63527\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eI5UTiDClnmM4emx0NC8Tk__is9GQIZt7GgWLWVA0RnKFmMBhBEQ1OWC2nuZW1WTvYzp53ZL9CJg13KpHKUcRRahkBEXdmMbnrmBD_wL4_GCTx9KL7P6DQT2l4l_FgszTIgcmz2Z4hpMdCw5sZDSg1vBzb94IpZb_t1rPje064_ZprayHpQkQ7DVv-ejgJ73v5WQXf8UYQ3gdJPcxG9WTAslgNjhbN561Rjao5MATeCELQbDPzf66ewOjS_rv4LuW5cYgVR0EjVkCYEG1K2Hpsii2mF3fENvOFago4G5QsoNuxKQ79uaZQQ_d3WyJ0eoWwfw-PxsP8c28KuP7mEokz-kZq4uAeUvQJCVMFyXor6ROhY7TBBvzsU0asKgSjV3SNHCqZ_cSOdq6NqldMQ4IkGdaOLrjbmXjBXe3pqhkPpQ8&3u4000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=5814",
                "category": 11,
                "duration": "01:00",
                "location": {
                    "address": "Frameless Immersive Art Experience, Marble Arch, London, UK",
                    "latitude": 51.5136755,
                    "longitude": -0.1603609
                },
                "moreInfo": "http://www.frameless.com/",
                "priority": "3",
                "description": "תערוכת אמנות דיגיטלית ענקית עם הקרנות אינטראקטיביות (בדומה ל־Van Gogh immersive).",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "22:00",
                            "start": "11:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "18:00",
                            "start": "10:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "22:00",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "18:00",
                            "start": "11:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "764",
                "icon": "",
                "price": null,
                "title": "Piccadilly Circus - הטיימסקוור של לונדון",
                "allDay": false,
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dAfUODpfDKI_gmjZR0sbSGn1A17aNm_8CdpO3xNVHj_823CUgR3JyOGB6eLSfhWQaJ6JIyK2lZkspkrbXsdl37j3eQfp3XzhV4h_FmLKWPXBV_1tviS4Cp6ajaOJ2ZSYIanyKo9TYqYCQTL63grxKipt6ID5Tp0CkcjfMd9th3i9let9XEwsKk68Qfdo_tLqA820QuafGxM9SljD8CwKne83JJhlpWesGvi7eDO_Z34Jz_h_0e0yBVGCW28W9YY79e4Rjza2q1vAZ4RbqLMaa4msCNLiG9xwXJoMYMKzQiIrW7h22SVnojyCyxE4J7x-I5630B4lSCBtVHJQvs6zMPOcuMEHQo6afnTQXntzbG__j9e_leadnLEq8Q7U-wzbNcshXDI1kCzTaMn6sE2ihwAgZZnon6iDnhHhBDHCjtY5LIQ1C0xvasRw1HMYN8Fg8C793yV8VPHkRbodjVXQa1uKLL_s0qN1kWE_JxhI6BtUnwfGW6KPjkmLOjPXBkWadgi9yy5rEmxwZkQuoqvr4QbA&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=56610\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fUWqWLZmnK-YVeXhK9b_3aoAbKGoE5jZ0FHgdvd0_nvDUchgMLCadlSqkGmRYdt84PPbVP9ytoRRVOHSAKqM7dtV-3tUE_p2U2gRtLpSMVrTbqR5iKaEwGLYKrCgTu7S_ZliXdJ6U6m0Jqo1Ga0fD7vrhbUiv0gcf1TnRb0A3kCnWgLrAU7qsQRvgu0YZEI4QhQRIVUkYKdg3j7qWvprtDqrN406t0v9pOYq2rah8hDBhj18ZVoRzmCj3f5JwmYDzpsftbpGA89ont50u9hlDfjk-2g-xsnU0UmkRYynBAZZhjYRU-64erjDa5PbUTO8LrTRdU7tK9WF6m41kP1I5bZbEebS7iI0AJq83ApLgwSZ4bn9XFX2VZ3B_amiwRaasToPdefsQ2-BWOsSeYyeNoiQzGwEJi63SSk2nAEg8D8O_0g0F0ed8B_aYdiQOdivJmCVyRfLGJPDyl5paliYJ0uITwe7jwjZOxJix6soH6YWG0xd49ar2_Y0BWgFJGy8vi57W3O9LdBZBMPbuV6EM&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=115807\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eKH6g-kaYtlezxFPtuLdzfbjmQRitZsqL1Mry7XRk2ZqaNxLElgW1va2yBQ2uvdG4ExgoQgcjGV1jfa9X3T2aKGdZERgD5o7-y_AMCEeKXlDi_KEBO9pr0Cpq0JSKSso2i71gsrYhlgucr_wAGRPl88ruJZmuNVXtCrjFOtAy20upa4xUC32842DcCkkdshytiSLa1h8TbQW2UEP2-h_JCLB5_lIuHzQmqFQqakLO5SUxAU1pyBoiIIhhZOzsyfIFWykDdAYwt-f3zaNV-ocAlUZMQl7YJFjFTagMNTZJKcxfiTV6Wm2gWKGokBfFCv86onckcNoXwqYiw7MbntnFoa54SgQ0yP4RG9zMGfgDLcdKtuBSHTr4XYteYKyLSuiD-ZABsdbQSAXpPxUeburnbhRioLmQ1DSCEyauW2XnMNKjtnCyKE3FoVGvYxpj9amJmlE-T1_i-qJGuWBu2B354ZcbXNBjy94lyvU48covhss6mKAor27gPCYSuVDJKL_3Veq2qWJ9fecnLk9NFUew&3u1197&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=20018",
                "category": "11",
                "currency": null,
                "duration": "00:30",
                "editable": true,
                "location": {
                    "address": "Piccadilly Circus, London, UK",
                    "latitude": 51.5099401,
                    "eventName": "Piccadilly Circus - הטיימסקוור של לונדון",
                    "longitude": -0.133996
                },
                "moreInfo": "https://maps.google.com/?q=Piccadilly+Circus,+London,+UK&ftid=0x487604d3ff201fc1:0xf08adf0cfb3eb2fe",
                "priority": "1",
                "className": "priority-1",
                "description": null,
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            }
        ],
        "13": [
            {
                "id": "707",
                "icon": "",
                "title": "Hyde Park Winter Wonderland Ice Rink",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dFrxZLaJO5ohJUhTrTBmiUzWrxaNnTRmbpvyDCxUHrEbyTFcd09USA6Rfdf_tyCUmi9z3scxFve4dmTg2LoZalzyfdP_LptXKq5SRqlz7u3ZU2NXqz_elsw93iOBzr58bT03mHeS3ag2GuinXMayh5x1oIn1pN8R7ktm_RrPbqO0kPq1Z7wEkkwPMfra1eywkXpw2rPaSiKGEtrmrX_NirDeBGm6gXhbIfJ9s5Ec6jKjGG2BHUrCUwtVdgMLJUbXqqcvPr6nkblgSeaTqR3Ss8-KVvtb6Sc8cmcGOb7K4-7ctZNQp0fmYA8Yi45ZitntGuPihS2V_kvPXnqxMpbmsOGp0jqLZDy5Vvz-P59llkbaanES3vRM55PVSqO1FKB6rYIQzQRmlvYSplXSy3SD3UAcQoGtTiImWqPCZ4c6nLBA&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=4810\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fZNHamrZRdDzlL2mq8v-ZR13H0niZKdsZGJLCxH4rANWIAQfVjj_CiLPC8YZBuBEaluzUJxnSFM1xQRIQ4l233haB46DgsO_xToHi4jVkP3tQs2wyV1XnZARm_orVRdfcicjaY8n8wGDiPcUwMs9_IdRtxBTMpTZuBOzpANNbUpJmiE3wKXs-HeHW78toc8pO6HH1oyoy8bHsu2vTvF76ORRrOo40i9bsytKublNVMDeobeKAbBd77bcxHVl-10mxaX2BBW-B1RXKZtXEWxLNdTTZPNRn1VOGrkFvVP0O8u5KugFXim-DjIRI1C0JCYdjsKqVDkRO8JWCeUUalKMAIUCwZvH_1lDzjyG2mc2GaOgjOObSEPTlHyy0Ga5S7mhss1Yhq4LTcUpKBS5JeV0Lea-ep7qKyLmvkDdXYl2cea5I&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=13058\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dPHOQ8HW9hAwK3vTX_BtYM7qhlQlzAMM0ttmku__xdVPi1CRP-YhChE85kmNYk6XQjRvFetvW6onmAyZ-Hm9rnDK-uJ5DdXAlkqtYXxURoRgFcaCdo3mpcQGACmaxDrJ6LyN_Zju9xb1wAebFjIcXloXsROtaGLjiQFxPDTKybs2IMzTLKk21jyWWofgLnucTkzP1lQqnqrSL9oqHqjspx_REFHBzBSExGm5TfMtwg6HMDiqJ4qmYUJUIgtRFPlke78gtG58rhYxm1FiCdJdXPRITx4h7ttcif9Gx0m5QdJSIzdoziMGgaHf6s_cYkJqlzmbiXIWWTED8tkAGwrohqLzjlw06myVJxnuCbGiaBHw7_T5sRB4R5iuSb5qvowb5EZPTyShsf0gyXRGB98WSk4Kuvp8Kr2vYLd0dV6iS9AA&3u4624&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=857",
                "category": 13,
                "duration": "01:00",
                "location": {
                    "address": "Hyde Park Winter Wonderland Ice Rink, Serpentine Rd, London, UK",
                    "latitude": 51.50523440000001,
                    "longitude": -0.1563279
                },
                "moreInfo": "https://hydeparkwinterwonderland.com/things-to-do/ice-skating/",
                "priority": "0",
                "description": "פארק חג מולד ענק עם מתקנים, דוכני אוכל, מופעים והפעלות.",
                "preferredTime": "0"
            },
            {
                "id": "718",
                "icon": "",
                "title": "Greenwich Market",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dCxUM9Cr3beYoXTUzLhP94Ad04itkZXjs4_8q1nEtQyETbox0qWM6c2cRt9BJpCw6S8F4XYUTfhcYZX8-6nboGfStW37W9wXcSGbnpWRX4akZJ4dzIagdJb1awEGZ0XNa5UKZI8kyRA35Mx73hpqsS0XgCRVqDX8ZIV6wIvojWhC8zcqB73QJQKx9gC7Wk32HN6pNwIwnvE7cJulh-ry-5qrajlZXJINGFLnMWbolMgnTYKq4AY3sJ3hDmf2GtBDQeUDkqG4qM2dTwdcFsrP8_mtrZdOJXLHiZNZGwUBNCAg&3u1280&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=78274\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f0qtc9YEq2231pWRfEaFY5bYTCSOMB0rTclEjwyX1Gilq2lOGKTtxaL-4012FBCUfCGFA9k4s9t6i6sRBGqA4jRZE1-PsUc6oTunWEA1Y9Cf1wZIyveWPzF7ctkmE1DIx_c1i0ll6H3QFo8LBZtZ0a_DkFjuQ2scTvwQIh8LTnDJk6I3AiOpikkgxzBRQ1clnmESNl4MMWSDQL5oFurJwQ21XpkJu51Wo5JsIipPLL-b8SG171fs1HAOC3diI5-7A_uqJwNcf9yfjeQKzlfbqMbdsbifPbSrxeHooD8gLe6ohDBiiL5hH7K-83TNAibX64yJiUBt5NlkZvRbqIuN23MECd0NzijLbG1i8iSXpZidIYKLk_hgNp7xJvRUzcKWhH-u9ij2cFhYcAeJuBqJCpzpvA7UF1vR9h_6_VxPHC2T_P&3u4640&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=9799\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2d_CYR8slSWd6TnNejuEGdT6PPeRlBnHtTcNtt2MG9mpYEIEeAP3oujFFQaSZH0mB8UY-1K7rCbcVPsdFon7EXStCZs1iqPxIYrgs5kPiYuc0wxPvswrAwP1tZ2TvlR9elI_2COBSAnR_EsbswiBT_I8t7-QkHbb5_bzgS7LSlWv1orZb_BMJXVtPYlp1xL21iakkKwNsbJTcK3hne8XZ9gFHAK4sPl0ZrVWl4FY6x1c9VCffxpJc5WMj1QnL2CZuQO9Xwe4MH3VSKzpbpy7AJ8eWqBpz1RNPv3aXPUSzG6YOOYfHxYKgU0jl_5VZZYWgSk_cThbIlWGJ7uom69c5bZdMdDgUrXrIcO7M9T6emN4JHN7ooXuiPAPe0AnladVL2U23Zmwvvpr88y-Uvn9WI8bqa2CMG6NneNjxuq0tY&3u3968&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=34123",
                "category": 13,
                "duration": "01:00",
                "location": {
                    "address": "Greenwich Market, Greenwich Market, London, UK",
                    "latitude": 51.4815771,
                    "longitude": -0.009037
                },
                "moreInfo": "http://www.greenwichmarket.london/",
                "priority": "0",
                "description": "A classic, charming market set in a historic area, providing a traditional atmosphere",
                "openingHours": {
                    "FRIDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "MONDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "SUNDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "TUESDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "SATURDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "THURSDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ],
                    "WEDNESDAY": [
                        {
                            "end": "17:30",
                            "start": "10:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "725",
                "icon": "",
                "title": "Covent Garden Christmas Market",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dVN0zmv96obUwMqqsqw_fNMRtr1T3zvSqZajPxB8AB4C961hv4Ag_oHvMT7DEZXb0UFTb3uD6m77bLFalrMpxCeLLaSet2Wiy25m42NRtn2o-C0O6TzsBq0-KkzzjOXSBPoAbjrVNnJr1ddgHZAmF9WCVMURTzEHdD1gPe5Z5SbFWoATh45WHzDiIB12Wlu2uy5yNSEOsFu2tcl73wvQ0xi_Gf2RO91iGxpmJJJMgJ5QigxWtU8M-uvdVnrv1ZfKVjaHoQNDJpYdF2bB1D-TwClgQpYCoEDlk2bcj2W2ZpyTx9JkFTVopm-zbCLKk4-H5VAVJ-vc5M0ibWgdC-jQm6K58krrUOdLqA3BqOvjHM_YCVzOnH3MtQt3wIMRbn67ZBOGczwak00MrQ1wT8jz-xYWuFjYFzf9GsCxoWZ105ew&3u3456&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=92825\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fjDede0G-x-MUQ1PYt6Y2wZ7Rd-_sZtaVmhjpLvpXtjiHARAHr28EKQNJYnqlgZ-sCn--XY48_KmpM9SNV4FSHpygJT26p25jIf6wd-vC4BgxNrkCOxic0zKgSk9_z8D08y62J9eCih5gqgVhSkt5ogcRkesUIGGFjEVzb3RJ59KAaJTNp-68VRB5C2STw8OgdGLTHhFx4mxWvOlqRLoLSStKTlrgVR3sk8l13gZHcVv8ke-8MT9WnlF2gt7kk8YLx73qZOqzEUy42-iz3xifKww1dE_2xAvneXVj0L049jQ&3u2048&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=114087\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2flkOqCdNtohK2ccipDHOjnQfhjohv-QL5ALL-Oc0KVaDxI-APENn0AYtlw-rU8oYvj3Mqh0ZmzhCBWlWWDukt46f6iYA5IZR3uIcBBFFhKWvYisOSrd2ZSy9zVO5O_Qs-hKJa0qBbJrik9Runol7RN1vLmJVmZgNKwZFLRy2I6WICZXMPz1n57uGGA9X83gIQ-RVuIHbl4aaKBZC9emZpPRC0uZavqSpHfZXnkPcfZt0NKfDcfNphvi4wk0bi5bgVR9A_N_syjvBsUSlUVs_bXVfBHmbRwNq07uhTfZtCEuKL_DAqxDr49yiOuaLI_FBhonrYabjKnghOA0FVXNMnxAwq7CC3tcpJSjI9lZQLyZGAnzGiFLEubzdmHjNhXt0E_n1-KuAps25diuqa1tx1aMN8SBHlfFKCaAc9xTD3Q8n_8&3u4800&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=114722",
                "category": 13,
                "duration": "01:00",
                "location": {
                    "address": "Covent Garden Christmas Market, London, UK",
                    "latitude": 51.5118269,
                    "longitude": -0.1230817
                },
                "moreInfo": "https://www.coventgarden.london/christmas-in-covent-garden/",
                "priority": "0",
                "description": "Known for its festive decorations, large Christmas tree, and charming atmosphere, perfect for experiencing Christmas magic. ",
                "openingHours": {
                    "SUNDAY": [
                        {
                            "end": "00:00",
                            "start": "00:00"
                        }
                    ]
                },
                "preferredTime": "0"
            },
            {
                "id": "727",
                "icon": "",
                "title": "London Bridge Christmas Market",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dYaL7dXd3oleiMZ7-d3KMH9eMKG7lBpAupk9ipM-pnbEpE8bhisVbK85Q2VtzCuxgDFEUAvqhwQEWuybVw93yp_m-1zfmHUZe2i2eDxP3xyYW-K0YqToe44x8_TKHmO70yhz3pdOd69XNRy_SZJ5Dt9XAvHamgHxrykKwrs1WmzU-b_lOjkG2VG8EdEJZQTrtUvUin2tSH-2CsVnkKLaR0vqvFeGWxw6O3p--F_SRYahskHFf8P3wSj9r69FWriyvsoqG2w0XuyKUEjUreJ4QAWrBMYlWUDbft0x09jC6Q_osSOI-2jufmWFI_tqfnmaMZHgKm0jCZ44B5UqToW6BdNvYLWApUoIl9mpUopnhGnYOx-tkKC2Rok7N7CQKqPhOOCDE6msWzh07KlOcCq3_TC7_G6lSEwQx4S4R2Vu3BFdWX4YPDACAH6YBDIjr-&3u3600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=9170\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2ePORehkgugmhpYNZxObdUSeRsUPv7x5rrw4o2MGcUKyUoH2h_ATHFfL-KVEOAy_P4K0O9LJ4V9ooFsacLSxgLAKOrRvCYfgogM8d0gjOfNZXxUUDSxfcom7b96Luit4WIzA1sgzIqWsT-JTdr50PNsbesVLwzlsysQ1VyKYUzIVgBwJ9EtA5Yu7PsdkAiBDYT_DhgsvRm3plkoWNfLkwuQNe97697VoOQDgHmpfZS5YqurEAhw-vb-W1aoEzNv7K24qCvqbpHGR1MKfjwaoaiot--ROjY-nkqEZhxbUc-LzfrTmshhu9vEFWStWjbymEqPAVSEahFC2SNNU3Zxa5s1pgNf30HpzkRAH5oRZASt3GQJh4duy-JFhk5Mj1vXj9S8Q6pmxlJ5b3zoMi3ronwTjaNMhXD23EcVDLr_P7XdFDlw&3u3036&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=68451\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2exiDU9ZmzWiuU5SfgF2sbIGRzp4jN0UJdI4yTE3169O5ZFU2yMxWaPm5eFgf402dz3aoR_rDCvy0VkDLvplfzfwV3okhYp5T-vavQeX8azAwSMaIE20yrpondnvf6WfYxqG7JkEbuJbUC4EeJMxJunytoDEtqGj2EBoWBrmjgnPmPpq1r-CPVzvcxZjnDEW0guznwlLO4Y1hmglL1QsSdDOXB3M4gerLCsD1Wi0tTkpmYLZvylRMoAmrq5zeGn9trZ_2DuUYj-V2QnkUiNBXAArkbVYeVzO2pRvUo__bPh2z3_Xjfcp36gxCUsmcp-EivXPoGK8Ydz_SzpmK03M0CsicCvNDnMU2EMA4UL0POwl_zH7kOCJwm0mviojZhjL_5aZQrjxTuzbtO2xWgyFU8AL0grZgT6IYQWCpwdwu8rrw&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=87974",
                "category": 13,
                "duration": "01:00",
                "location": {
                    "address": "London Bridge Christmas Market, Borough High Street, London, UK",
                    "latitude": 51.5063073,
                    "longitude": -0.0833932
                },
                "moreInfo": "https://maps.google.com/?cid=15915535890853966171",
                "priority": "0",
                "preferredTime": "0"
            },
            {
                "id": "1169",
                "icon": "",
                "title": "Christmas at Kew",
                "images": "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fddY90bmGdxa5x7Vha9DhKG8OVraXzRP2A7aUjcWYfS16tLD6qjCGLmWhdC4qNSOJ_xqA-tmbcT_w9FV9H7oIIT3RQE8ytAeqHo-LFwHTL_3frh2DnnZCQf1sWNnEbj0R26HOymkhk8FhbJ4tr0Etfz4tkyQjf1ZLyq78XUIX15HxGIIqo498VGI43xKYNCVrdTPVvZTcQegHb_YzJCjo7FHVtzRS1b5rH4rhE-F9OLHfinvsqzcEvTSjdvnVPXjXj1sCzvTnhEqB9-XJB6qDwZjlU97jgzsEHgMduvQ8mbVCDNRy0RTu4-FaPgLkgR2nEB8qcgaC4EddizCrQp_GwcxZnYTek2d69LMmgzuSk4sTKoqqERNuBo7q4VPQX2JiY79R7G9akw_S3QKstmfkSHwbZnQoq8dJJhpBxnJWSFFrj&3u3072&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=21697\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2c0ePuHCzzyFhshw1bLVah4jsWkL0uxjkT-q-lbA6IwmXLRQUIFi3c2X2pbMEPt82BO6fcxKMINGKoizrpJv0y4vZtn3fHJaQUD-YDGNBD8LAakCKP_Ea7msqW3DyX7wIKBWpkUEf2gwqofj7uNya5_aEIrmm-lHLqnabRjTC123v178keKeA4y8kN-6iOvzgu9LpzLeV_HYN8V6xwDdPj5gPhI1zMiUfHBd2IK0vmyrG4hMz_AMeTuJfidLofMN7RwoKxYu5is0kNaRaMfeQ7Di-SsvqRu3QxL7WztUADGd4oQtDzVN49e-qiEY_pdftbSNMvqMwivJeCxjSQufl6nRYYXW4HD-An5XwMZv4enjQujim8zctlb2tTyzotg8AobU8EsD1fIooqVk6t_STXrneztILMBnGPuJLwLytVcbcue&3u2992&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=123621\nhttps://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fzsuzOt-PrRAhtfKfRRZp77PJsNK7u3uMBBMr229DhPJJ-hpVAhpRTWXqXojyImmwEFviTD2Wuq0r3wJRs9a8-9UTQZrgDBtflnj1ECSIrFLxQgR434b51LFsFY7B4mDenLQEMH473iMItW29k-W3BJ2_hDubdV2ht5KwmzDuTdRyBAnPc5r9PnLECJ1oiEH2tZfHBNOI-7VJulf3GGAJ4HayLkVbcryX6lAEwU7NhcbO4OZnF80vYlIJYEOdSrn6_9qdNxkIwslZe3LdJVrVKeRzHzIPkdUfmVTSn41a6QiNvz2Jiy1AMGqpHHWpSbgK12Nx5IVq5U5f0y7J_E2RvM7IQ4nvlco_CEFi4_qMTi4bBqq2ricayn4W2onMxCLud4nO25DYtY5YWZAS5A2shhv9qdmA5f-F5USHnI28&3u3024&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3000%2Fv2%2Fplan%2F%25D7%259C%25D7%2595%25D7%25A0%25D7%2593%25D7%2595%25D7%259F-32&key=AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo&token=51125",
                "category": 13,
                "duration": "01:00",
                "location": {
                    "address": "Christmas at Kew, Richmond, UK",
                    "latitude": 51.4824963,
                    "longitude": -0.2945309
                },
                "moreInfo": "https://www.kew.org/kew-gardens/whats-on/christmas",
                "priority": "1",
                "preferredTime": "0"
            }
        ],
        "15": [
            {
                "id": "958",
                "icon": "",
                "title": "ערב כריסמס - הרבה דברים נסגרים מוקדם",
                "allDay": true,
                "category": 15,
                "duration": "00:00",
                "editable": true,
                "priority": "0",
                "className": "priority-0",
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            },
            {
                "id": "965",
                "icon": "",
                "title": "כריסמס - רוב החנויות והמסעדות סגורות",
                "allDay": true,
                "category": 15,
                "duration": "00:00",
                "editable": true,
                "priority": "0",
                "className": "priority-0",
                "preferredTime": "0",
                "disableDragging": false,
                "durationEditable": true
            }
        ]
    },
    "calendarLocale": "he",
    "lastUpdateAt": "2025-10-11T18:36:45.707Z",
    "createdAt": "2025-09-26T19:34:33.809Z",
    "isLocked": false,
    "isHidden": false,
    "destinations": [
        "London"
    ],
    "priorityColors": null,
    "priorityMapColors": null
}
*/

// vienna - 21.10
// calendar events
// [{"start":"2022-11-12T22:00:00.000Z","end":"2022-11-12T23:00:00.000Z","title":"לברר אם דברים פתוחים בראשון","id":"101","className":"priority-0","extendedProps":{"id":"101","categoryId":"14","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","priority":"0","icon":"","preferredTime":"0"},"allDay":true},{"start":"2022-11-10T18:00:00.000Z","end":"2022-11-10T20:55:00.000Z","title":"טיסה מתל אביב לוינה","id":"65","className":"priority-0","extendedProps":{"id":"65","categoryId":"11","description":"טיסה עם wizzair&#10;טיסה מספר w6 2812&#10;משך הטיסה 03:55&#10;מזוודה אחת בהלוך - 20 קילו","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"allDay":false,"icon":"","priority":"0","description":"טיסה עם wizzair&#10;טיסה מספר w6 2812&#10;משך הטיסה 03:55&#10;מזוודה אחת בהלוך - 20 קילו","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139},"duration":"02:55"},{"id":"339","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","start":"2022-11-10T15:30:00.000Z","end":"2022-11-10T18:00:00.000Z","category":"19","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"19","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"category":"19"},"duration":"02:30"},{"start":"2022-11-10T06:00:00.000Z","end":"2022-11-10T14:00:00.000Z","title":"בית","id":"334","className":"priority-0","extendedProps":{"id":"334","categoryId":"16","description":"להתארגן לטיסה","priority":"0","icon":"","preferredTime":"0","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414}},"allDay":false,"icon":"","priority":"0","description":"להתארגן לטיסה","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414},"duration":"08:00"},{"start":"2022-11-14T08:00:00.000Z","end":"2022-11-14T09:00:00.000Z","title":"בית קפה Kylo","id":"180","className":"priority-2","extendedProps":{"id":"180","categoryId":"2","description":"בית קפה על נהר הדנובה עם ארוחות בוקר מגוונות וטעימות&#10;https://www.tripadvisor.com/Restaurant_Review-g190454-d12789266-Reviews-Klyo-Vienna.html","priority":"2","icon":"","preferredTime":"1","location":{"address":"KLYO, Uraniastraße, Wien, Austria","latitude":48.2115613,"longitude":16.383796}},"allDay":false},{"start":"2022-11-14T07:00:00.000Z","end":"2022-11-14T08:00:00.000Z","title":"צ׳ק אאוט במלון NH Collection","id":"80","className":"priority-0","extendedProps":{"id":"80","categoryId":"11","description":"צ׳ק אאוט בשעה 12:00","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"צ׳ק אאוט בשעה 12:00","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"01:00"},{"start":"2022-11-11T05:30:00.000Z","end":"2022-11-11T06:00:00.000Z","title":"מלון NH Collection","id":"142","className":"priority-0","extendedProps":{"id":"142","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"00:30"},{"start":"2022-11-13T04:30:00.000Z","end":"2022-11-13T05:00:00.000Z","title":"מלון NH Collection","id":"138","className":"priority-0","extendedProps":{"id":"138","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"duration":"00:30"},{"start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","title":"Hard Rock Vienna","id":"35","className":"priority-1","extendedProps":{"id":"35","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🍔 ","preferredTime":"2","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822}},"allDay":false,"icon":"🍔 ","priority":"1","description":"להזמין מראש","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822},"duration":"01:00"},{"start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","title":"El Gaucho Vienna","id":"9","className":"priority-1","extendedProps":{"id":"9","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🥩","preferredTime":"2","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},"allDay":false,"icon":"🥩","priority":"1","description":"להזמין מראש","duration":"01:00","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"The Loft","id":"133","className":"priority-0","extendedProps":{"id":"133","categoryId":"9","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","priority":"0","icon":"","preferredTime":"5","location":{"address":"The Loft, Lerchenfelder Gürtel, Wien, Austria","latitude":48.2088385,"longitude":16.3381239}},"allDay":false,"icon":"","priority":"0","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","duration":"01:00","location":{"address":"The Loft, Lerchenfelder Gürtel, Wien, Austria","latitude":48.2088385,"longitude":16.3381239}},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"Lamee Rooftop","id":"243","className":"priority-2","extendedProps":{"id":"243","categoryId":"9","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","priority":"2","icon":"","preferredTime":"4","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269}},"allDay":false,"icon":"","priority":"2","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269},"duration":"01:00"},{"start":"2022-11-11T19:30:00.000Z","end":"2022-11-11T20:30:00.000Z","title":"שוק נאשמרקט בלילה","id":"305","className":"priority-2","extendedProps":{"id":"305","categoryId":"9","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","priority":"2","icon":"","preferredTime":"5","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165}},"allDay":false,"icon":"","priority":"2","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165},"duration":"01:00"},{"start":"2022-11-11T18:00:00.000Z","end":"2022-11-11T19:30:00.000Z","title":"Seven North אייל שני","id":"353","className":"priority-1","extendedProps":{"id":"353","categoryId":"2","description":"המסעדה של אייל שני בוינה!\nטיפ זהב: אם המטבח של המסעדה פתוח, תבחרו לשבת על המטבח. זאת חוויה הרבה יותר מעניינת. מלמדת. ואפילו קצת תאטרלית!\nצריך להזמין","priority":"1","icon":"","preferredTime":"5","location":{"address":"Seven North, Schottenfeldgasse, Wien, Austria","longitude":16.3436502,"latitude":48.2048309}},"allDay":false,"icon":"","priority":"1","description":"המסעדה של אייל שני בוינה!\nטיפ זהב: אם המטבח של המסעדה פתוח, תבחרו לשבת על המטבח. זאת חוויה הרבה יותר מעניינת. מלמדת. ואפילו קצת תאטרלית!\nצריך להזמין","location":{"address":"Seven North, Schottenfeldgasse, Wien, Austria","longitude":16.3436502,"latitude":48.2048309},"duration":"01:30"},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"Funky Monkey Bar","id":"336","className":"priority-1","extendedProps":{"id":"336","categoryId":"9","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","priority":"1","icon":"","preferredTime":"5","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106}},"allDay":false,"icon":"","priority":"1","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106},"duration":"01:00"},{"start":"2022-11-12T17:00:00.000Z","end":"2022-11-12T19:30:00.000Z","title":"פארק מים אוברלה - Oberlaa Therme","id":"153","className":"priority-1","extendedProps":{"id":"153","categoryId":"19","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","priority":"1","icon":"","preferredTime":"5","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266}},"allDay":false,"icon":"","priority":"1","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266},"duration":"02:30"},{"start":"2022-11-14T16:00:00.000Z","end":"2022-11-14T21:50:00.000Z","title":"טיסה חזור מוינה לתל אביב ב20:15","id":"89","className":"priority-0","extendedProps":{"id":"89","categoryId":"11","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"allDay":false,"icon":"","priority":"0","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139},"duration":"05:50"},{"start":"2022-11-14T09:30:00.000Z","end":"2022-11-14T10:00:00.000Z","title":"Wien Sex Shop","id":"442","className":"priority-1","extendedProps":{"id":"442","categoryId":"5","description":"","priority":"1","icon":"","preferredTime":"0","location":{"address":"Sex Shop - Czerningasse 29, Czerningasse, Wien, Austria","longitude":16.3905468,"latitude":48.21610229999999}},"allDay":false,"icon":"","priority":"1","description":"","location":{"address":"Sex Shop - Czerningasse 29, Czerningasse, Wien, Austria","longitude":16.3905468,"latitude":48.21610229999999},"duration":"00:30"},{"start":"2022-11-14T10:30:00.000Z","end":"2022-11-14T11:30:00.000Z","title":"Vienna's roller-coaster restaurant","id":"99","className":"priority-1","extendedProps":{"id":"99","categoryId":"2","description":"https://www.youtube.com/watch?v=2BKm33Df48c","priority":"1","icon":"","preferredTime":"2","location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633}},"allDay":false,"icon":"","priority":"1","description":"https://www.youtube.com/watch?v=2BKm33Df48c","location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633},"duration":"01:00"},{"start":"2022-11-14T10:00:00.000Z","end":"2022-11-14T10:30:00.000Z","title":"Mini Golf","id":"435","className":"priority-0","extendedProps":{"id":"435","categoryId":"19","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Minigolf, Hauptallee, Wien, Austria","longitude":16.395962,"latitude":48.2159248}},"allDay":false,"icon":"","priority":"0","description":"","location":{"address":"Minigolf, Hauptallee, Wien, Austria","longitude":16.395962,"latitude":48.2159248},"duration":"00:30"},{"start":"2022-11-14T14:30:00.000Z","end":"2022-11-14T15:30:00.000Z","title":"Hard Rock Vienna","id":"373","className":"priority-1","extendedProps":{"id":"373","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🍔 ","preferredTime":"0","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Wien, Austria","latitude":48.2113174,"longitude":16.3754822}},"allDay":false,"icon":"🍔 ","priority":"1","description":"להזמין מראש","location":{"address":"Hard Rock Cafe, Rotenturmstraße, Wien, Austria","latitude":48.2113174,"longitude":16.3754822},"duration":"01:00"},{"start":"2022-11-14T14:30:00.000Z","end":"2022-11-14T15:30:00.000Z","title":"El Gaucho Vienna","id":"370","className":"priority-1","extendedProps":{"id":"370","categoryId":"2","description":"להזמין מראש","priority":"1","icon":"🥩","preferredTime":"0","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006}},"allDay":false,"icon":"🥩","priority":"1","description":"להזמין מראש","location":{"address":"El Gaucho am Rochusmarkt, Erdbergstraße, Wien, Austria","latitude":48.2026557,"longitude":16.3915006},"duration":"01:00"},{"id":"447","title":"בגדי ים","icon":"","priority":"0","preferredTime":"0","description":"להביא איתנו תיק עם בגדי ים לאוברלה","start":"2022-11-11T22:00:00.000Z","end":"2022-11-12T22:00:00.000Z","category":"14","className":"priority-0","allDay":true,"extendedProps":{"title":"בגדי ים","icon":"","priority":"0","preferredTime":"0","description":"להביא איתנו תיק עם בגדי ים לאוברלה","categoryId":"14"},"duration":"00:00"},{"start":"2022-11-12T08:00:00.000Z","end":"2022-11-12T09:00:00.000Z","title":"Demmels cafe beim kohlmarkt","id":"359","className":"priority-1","extendedProps":{"id":"359","categoryId":"2","description":"״רצוי להגיע עם מזרק אינסולין, כי אתם הולכים לטעום כאן את כל הקינוחים ההאוסטרים המפורסמים״\nשעות פעילות - 10:00 - 19:00","priority":"1","icon":"","preferredTime":"1","location":{"address":"DEMEL Vienna, Kohlmarkt, Wien, Austria","longitude":16.3672185,"latitude":48.2085962}},"allDay":false,"icon":"","priority":"1","description":"״רצוי להגיע עם מזרק אינסולין, כי אתם הולכים לטעום כאן את כל הקינוחים ההאוסטרים המפורסמים״\nשעות פעילות - 10:00 - 19:00","location":{"address":"DEMEL Vienna, Kohlmarkt, Wien, Austria","longitude":16.3672185,"latitude":48.2085962},"duration":"01:00"},{"id":"425","title":"אופצייה - מבוך בארמון","icon":"","priority":"2","preferredTime":"0","description":"ארמון Schonbrunn palace (מפה)  בארמון Schonbrunn יש גם מבוך מגניב, גן חיות (שניהם בתשלום) ונקודת תצפית יפהפייה על כל אזור הגנים, הארמון והעיר.\n\nשעות פעילות 09:30 - 16:15\nלברר אם צריך להזמין!","start":"2022-11-11T08:00:00.000Z","end":"2022-11-11T09:00:00.000Z","category":"19","className":"priority-2","allDay":false,"location":{"address":"Schönbrunn Palace Park, Schönbrunner Schloßstraße, Vienna, Austria","latitude":48.1802626,"longitude":16.3098086},"extendedProps":{"title":"אופצייה - להסתובב בארמון","icon":"","priority":"2","preferredTime":"0","description":"ארמון Schonbrunn palace (מפה)  בארמון Schonbrunn יש גם מבוך מגניב, גן חיות (שניהם בתשלום) ונקודת תצפית יפהפייה על כל אזור הגנים, הארמון והעיר.\n\nשעות פעילות 09:30 - 16:15\nלברר אם צריך להזמין!","categoryId":"19","location":{"address":"Schönbrunn Palace Park, Schönbrunner Schloßstraße, Vienna, Austria","latitude":48.1802626,"longitude":16.3098086},"category":"19"},"duration":"01:00"},{"start":"2022-11-14T12:00:00.000Z","end":"2022-11-14T14:00:00.000Z","title":"mariahilfer strabe - להסתובב בשדרה של הקניות ליד המלון","id":"368","className":"priority-1","extendedProps":{"id":"368","categoryId":"19","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect","priority":"1","icon":"","preferredTime":"6","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034}},"allDay":false},{"start":"2022-11-11T09:30:00.000Z","end":"2022-11-11T11:00:00.000Z","title":"שדרת Kärntner - חנויות יוקרה","id":"433","className":"priority-2","extendedProps":{"id":"433","categoryId":"5","description":"בשביל יהב","priority":"2","icon":"","preferredTime":"0","location":{"address":"Kärntner Str., 1010 Wien, Austria","latitude":48.2042352,"longitude":16.370533}},"allDay":false,"icon":"","priority":"2","description":"בשביל יהב","location":{"address":"Kärntner Str., 1010 Wien, Austria","latitude":48.2042352,"longitude":16.370533},"duration":"01:30"},{"start":"2022-11-13T05:15:00.000Z","end":"2022-11-13T19:00:00.000Z","title":"טיול יום לכפר הציורי האלשטאט Hallstat","id":"158","className":"priority-1","extendedProps":{"id":"158","categoryId":"19","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים\n\nלברר איך מזמינים ולהזמין מראש\nhttps://www.xn--8dbbm2a.co.il/hallstatt-and-alpine-peaks/\n\nממה שכתוב פה זה 8 בבוקר עד 9 בערב (!!) אם כן זה אומר שצריך לשנות את הלוז\nhttps://www.trvbox.co.il/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9C%D7%95%D7%99%D7%A0%D7%94-%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9E%D7%93%D7%94%D7%99%D7%9D-%D7%9C%D7%98%D7%99%D7%95%D7%9C-%D7%A9%D7%9C-%D7%A9%D7%99%D7%A9%D7%94/#1","priority":"1","icon":"","preferredTime":"0","location":{"address":"Hallstatt, Austria","latitude":47.5622342,"longitude":13.6492617}},"allDay":false,"icon":"","priority":"1","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים\n\nלברר איך מזמינים ולהזמין מראש\nhttps://www.xn--8dbbm2a.co.il/hallstatt-and-alpine-peaks/\n\nממה שכתוב פה זה 8 בבוקר עד 9 בערב (!!) אם כן זה אומר שצריך לשנות את הלוז\nhttps://www.trvbox.co.il/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9C%D7%95%D7%99%D7%A0%D7%94-%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%9E%D7%93%D7%94%D7%99%D7%9D-%D7%9C%D7%98%D7%99%D7%95%D7%9C-%D7%A9%D7%9C-%D7%A9%D7%99%D7%A9%D7%94/#1","duration":"13:45","location":{"address":"Hallstatt, Austria","latitude":47.5622342,"longitude":13.6492617}},{"start":"2022-11-11T20:30:00.000Z","end":"2022-11-11T22:00:00.000Z","title":"Vie I Pee בר עם סל","id":"47","className":"priority-1","extendedProps":{"id":"47","categoryId":"9","description":"","priority":"1","icon":"🏀","preferredTime":"5","location":{"address":"Vie i pee, Waldsteingartenstraße, Wien, Austria","latitude":48.2132778,"longitude":16.405193}},"allDay":false,"icon":"🏀","priority":"1","description":"","duration":"01:30","location":{"address":"Vie i pee, Waldsteingartenstraße, Wien, Austria","latitude":48.2132778,"longitude":16.405193}},{"start":"2022-11-12T21:00:00.000Z","end":"2022-11-12T22:00:00.000Z","title":"Pizza Senza Danza","id":"455","className":"priority-1","extendedProps":{"id":"455","categoryId":"9","description":"למי שאוהב פיצה וטכנו זה המקום בשבילכם!!!\nימי שלישי בוינה באופן קבוע יש מסיבה עד השעות הקטנות של הלילה","priority":"1","icon":"","preferredTime":"0","location":{"address":"PIZZA SENZA DANZA, Volksgarten, Vienna, Austria","longitude":16.3611518,"latitude":48.2071009}},"allDay":false},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"Bestens Bar - נאצ׳וס","id":"167","className":"priority-1","extendedProps":{"id":"167","categoryId":"9","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","priority":"1","icon":"","preferredTime":"5","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474}},"allDay":false,"icon":"","priority":"1","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474},"duration":"01:00"},{"start":"2022-11-12T20:00:00.000Z","end":"2022-11-12T21:00:00.000Z","title":"פאב 13 קוקטיילים","id":"162","className":"priority-0","extendedProps":{"id":"162","categoryId":"9","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","priority":"0","icon":"","preferredTime":"5","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907}},"allDay":false,"icon":"","priority":"0","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907},"duration":"01:00"},{"id":"457","title":"404 dont ask why","icon":"","priority":"1","preferredTime":"0","description":"מסעדה איטלקית\nלברר ולהזמין מראש","start":"2022-11-12T15:30:00.000Z","end":"2022-11-12T16:30:00.000Z","category":"2","className":"priority-1","allDay":false,"location":{"address":"404 Dont ask why, Friedrichstraße, Vienna, Austria","latitude":48.2000944,"longitude":16.3663115},"extendedProps":{"title":"404 dont ask why","icon":"","priority":"1","preferredTime":"0","description":"מסעדה איטלקית\nלברר ולהזמין מראש","categoryId":"2","location":{"address":"404 Dont ask why, Friedrichstraße, Vienna, Austria","latitude":48.2000944,"longitude":16.3663115},"category":"2"},"duration":"01:00"},{"start":"2022-11-12T10:00:00.000Z","end":"2022-11-12T14:30:00.000Z","title":"קניון פרנדורף","id":"155","className":"priority-1","extendedProps":{"id":"155","categoryId":"5","description":"לברר תחבורה ציבורית","priority":"1","icon":"","preferredTime":"6","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909}},"allDay":false,"icon":"","priority":"1","description":"לברר תחבורה ציבורית","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909},"duration":"04:30"},{"start":"2022-11-11T09:30:00.000Z","end":"2022-11-11T11:00:00.000Z","title":"mariahilfer strabe - להסתובב בשדרה של הקניות ליד המלון","id":"453","className":"priority-1","extendedProps":{"id":"453","categoryId":"19","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect\ndunk shop (!!!)","priority":"1","icon":"","preferredTime":"6","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034}},"allDay":false,"icon":"","priority":"1","description":"כל החנויות נפתחות בשעה 10\nfootlocker\nmango\nnike \nzara - נפתח ב9 וחצי\npandora - נפתח ב9 וחצי\nsportsdirect\ndunk shop (!!!)","location":{"address":"Mariahilfer Str. 104, 1070 Wien, Austria","latitude":48.19696949999999,"longitude":16.3440034},"duration":"01:30"},{"id":"463","title":"שוק הבארים ברובע המוזאונים","icon":"","priority":"2","preferredTime":"5","description":"שוק הבארים ברובע המוזיאונים (Wintergarden at Museumsquartier)\nשוק המיועד בגדול לקהל הצעיר אבל לא רק. מעין גרסת מועדוני הלילה או בארים של שווקי חג המולד.\nכן אפשר לקנות פונץ' ונקניקיות. וכן, יש לו אורות. אבל כאן מסתיימים קווי הדמיון לשוק חג המולד המסורתי.\nבתי הקפה והמסעדות השונים של רובע המוזיאונים פותחים את השטחים החיצוניים שלהם ע\"י אוהלים מחוממים והופכים למעין בארים או פאבים.\nתצוגות אור חדשניות על גבי המוזיאונים הופכות את האיזור למעין מועדון לילה. \nתקופת פעילות: 3 נובמבר - 8 ינואר\nשעות פתיחה: 16:00-23:00\nתחבורה ציבורית: מטרו קו U3 הכתום תחנות Museumsquartier/Volkstheater\nחשמלית קווים U2Z/D/1/2/46/49/71 תחנת Ring/Volkstheater","start":"2022-11-13T20:00:00.000Z","end":"2022-11-13T21:00:00.000Z","category":"9","className":"priority-2","allDay":false,"location":{"address":"Museumsplatz 1, 1070 Wien, Austria","latitude":48.2026499,"longitude":16.3591421},"extendedProps":{"title":"שוק הבארים ברובע המוזאונים","icon":"","priority":"2","preferredTime":"5","description":"שוק הבארים ברובע המוזיאונים (Wintergarden at Museumsquartier)\nשוק המיועד בגדול לקהל הצעיר אבל לא רק. מעין גרסת מועדוני הלילה או בארים של שווקי חג המולד.\nכן אפשר לקנות פונץ' ונקניקיות. וכן, יש לו אורות. אבל כאן מסתיימים קווי הדמיון לשוק חג המולד המסורתי.\nבתי הקפה והמסעדות השונים של רובע המוזיאונים פותחים את השטחים החיצוניים שלהם ע\"י אוהלים מחוממים והופכים למעין בארים או פאבים.\nתצוגות אור חדשניות על גבי המוזיאונים הופכות את האיזור למעין מועדון לילה. \nתקופת פעילות: 3 נובמבר - 8 ינואר\nשעות פתיחה: 16:00-23:00\nתחבורה ציבורית: מטרו קו U3 הכתום תחנות Museumsquartier/Volkstheater\nחשמלית קווים U2Z/D/1/2/46/49/71 תחנת Ring/Volkstheater","categoryId":"9","location":{"address":"Museumsplatz 1, 1070 Wien, Austria","latitude":48.2026499,"longitude":16.3591421},"category":"9"},"duration":"01:00"},{"start":"2022-11-11T13:30:00.000Z","end":"2022-11-11T14:30:00.000Z","title":"Schnitzelwirt","id":"418","className":"priority-1","extendedProps":{"id":"418","categoryId":"2","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","priority":"1","icon":"🐔","preferredTime":"0","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999}},"allDay":false,"icon":"🐔","priority":"1","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999},"duration":"01:00"},{"id":"526","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","start":"2022-11-11T15:00:00.000Z","end":"2022-11-11T15:30:00.000Z","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Wien, Austria","latitude":48.197888,"longitude":16.3485083}},"duration":"00:30"},{"start":"2022-11-11T12:00:00.000Z","end":"2022-11-11T13:00:00.000Z","title":"figel müller שניצל וינאי","id":"5","className":"priority-1","extendedProps":{"id":"5","categoryId":"2","description":"שניצל מעולה, להזמין מקום מספיק זמן מראש (!!)","priority":"1","icon":"🐔","preferredTime":"2","location":{"address":"Figlmüller at Wollzeile, Wollzeile, Vienna, Austria","latitude":48.2091901,"longitude":16.3745186}},"allDay":false,"icon":"🐔","priority":"1","description":"שניצל מעולה, להזמין מקום מספיק זמן מראש (!!)","location":{"address":"Figlmüller at Wollzeile, Wollzeile, Vienna, Austria","latitude":48.2091901,"longitude":16.3745186},"duration":"01:00"},{"id":"528","title":"לארוז איתנו","icon":"","priority":"0","preferredTime":"0","description":"- מטען נייד\n- רחפן?\n- טאבלט לטיסה\n- אוזניות\n- חצובה?\n- מברשת ומשחת שיניים\n- תיק רחצה, דאודורנט, בושם\n- תיק איפור יהב\n- תחתונים וגרביים\n- תיקים\n- כובעים\n- מסכות\n- נעליים\n- בגדי ים (תרמה)\n- כפכפים","start":"2022-11-09T22:00:00.000Z","end":"2022-11-10T22:00:00.000Z","category":"14","className":"priority-0","allDay":true,"extendedProps":{"title":"לארוז איתנו","icon":"","priority":"0","preferredTime":"0","description":"- מטען נייד\n- רחפן?\n- טאבלט לטיסה\n- אוזניות\n- חצובה?\n- מברשת ומשחת שיניים\n- תיק רחצה, דאודורנט, בושם\n- תיק איפור יהב\n- תחתונים וגרביים\n- תיקים\n- כובעים\n- מסכות\n- נעליים\n- בגדי ים (תרמה)\n- כפכפים","categoryId":"14"},"duration":"00:00"},{"start":"2022-11-14T08:00:00.000Z","end":"2022-11-14T09:00:00.000Z","title":"Cafe Central Vienna","id":"108","className":"priority-2","extendedProps":{"id":"108","categoryId":"2","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי\nהופיע גם בהיילייט של traveliri\nעוגות, ארוחות בוקר, עיצוב עתיק ויפה\n\nלהשלים - להזמין מראש","priority":"2","icon":"","preferredTime":"1","location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339}},"allDay":false,"icon":"","priority":"2","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי\nהופיע גם בהיילייט של traveliri\nעוגות, ארוחות בוקר, עיצוב עתיק ויפה\n\nלהשלים - להזמין מראש","location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339},"duration":"01:00"},{"start":"2022-11-14T13:30:00.000Z","end":"2022-11-14T14:00:00.000Z","title":"נעליים - יהב - hoglshoes","id":"531","className":"priority-1","extendedProps":{"id":"531","categoryId":"5","description":"מההיילייט Vienna של travelieir:\n״כבר שיתפתי אתכם שכמעט בלתי אפשרי עבורי למצוא נעליים שנוחות לי, ומצאתי חנות אוסטרית בול בטעם שלי עם סנדלים ועקבים הכי רכים ונוחים בעולם!!! לא קרה לי בחיים״","priority":"1","icon":"","preferredTime":"0","location":{"address":"Mariahilfer Str. 55, 1060 Wien, Austria","latitude":48.1992681,"longitude":16.3532196}},"allDay":false,"icon":"","priority":"1","description":"מההיילייט Vienna של travelieir:\n״כבר שיתפתי אתכם שכמעט בלתי אפשרי עבורי למצוא נעליים שנוחות לי, ומצאתי חנות אוסטרית בול בטעם שלי עם סנדלים ועקבים הכי רכים ונוחים בעולם!!! לא קרה לי בחיים״","location":{"address":"Mariahilfer Str. 55, 1060 Wien, Austria","latitude":48.1992681,"longitude":16.3532196},"duration":"00:30"},{"start":"2022-11-14T13:00:00.000Z","end":"2022-11-14T13:30:00.000Z","title":"Dunk Shop Wien","id":"20","className":"priority-1","extendedProps":{"id":"20","categoryId":"5","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","priority":"1","icon":"","preferredTime":"6","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Wien, Austria","latitude":48.19770919999999,"longitude":16.3547291}},"allDay":false,"icon":"","priority":"1","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","duration":"00:30","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Wien, Austria","latitude":48.19770919999999,"longitude":16.3547291}},{"start":"2022-11-11T12:30:00.000Z","end":"2022-11-11T13:00:00.000Z","title":"כיכר stephanplatz","id":"535","className":"priority-1","extendedProps":{"id":"535","categoryId":"16","description":"צמוד לזארה בכיכר סטפן יש דוכן קייזרשמרן של דמל עם ריח משגע (קרעי פנקייקים רכים אוסטרים)","priority":"1","icon":"","preferredTime":"0","location":{"address":"Stephansplatz, Vienna, Austria","latitude":48.2087405,"longitude":16.3736859}},"allDay":false,"icon":"","priority":"1","description":"צמוד לזארה בכיכר סטפן יש דוכן קייזרשמרן של דמל עם ריח משגע (קרעי פנקייקים רכים אוסטרים)","location":{"address":"Stephansplatz, Vienna, Austria","latitude":48.2087405,"longitude":16.3736859},"duration":"00:30"},{"start":"2022-11-11T07:00:00.000Z","end":"2022-11-11T08:00:00.000Z","title":"Café Gloriette - קפה בארמון שנבורן","id":"188","className":"priority-2","extendedProps":{"id":"188","categoryId":"2","description":"המלצה - שטרודל תפוחים\nשעות פעילות - נפתח ב09:00","priority":"2","icon":"","preferredTime":"1","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"openingHours":{"SUNDAY":{"start":"09:00","end":"18:00"},"MONDAY":{"start":"09:00","end":"18:00"},"TUESDAY":{"start":"09:00","end":"18:00"},"WEDNESDAY":{"start":"09:00","end":"18:00"},"THURSDAY":{"start":"09:00","end":"18:00"},"FRIDAY":{"start":"09:00","end":"18:00"},"SATURDAY":{"start":"09:00","end":"18:00"}}},"allDay":false,"icon":"","priority":"2","description":"המלצה - שטרודל תפוחים\nשעות פעילות - נפתח ב09:00","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"duration":"01:00","openingHours":{"SUNDAY":{"start":"09:00","end":"18:00"},"MONDAY":{"start":"09:00","end":"18:00"},"TUESDAY":{"start":"09:00","end":"18:00"},"WEDNESDAY":{"start":"09:00","end":"18:00"},"THURSDAY":{"start":"09:00","end":"18:00"},"FRIDAY":{"start":"09:00","end":"18:00"},"SATURDAY":{"start":"09:00","end":"18:00"}}},{"start":"2022-11-12T06:00:00.000Z","end":"2022-11-12T07:00:00.000Z","title":"fenster cafe vienna - קפה בתוך וופל","id":"197","className":"priority-1","extendedProps":{"id":"197","categoryId":"2","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html\n\nהקפה מעולה!! הכי טוב ששתינו בוינה. אני לקחתי עם קרמל אמיתי וזה היה מושלם. למי שיש מכונה ומטחנה מומלץ לקנות גם פולים הביתה. קנינו במתנה וזה התקבל בהתלהבות","priority":"1","icon":"","preferredTime":"6","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858}},"allDay":false,"icon":"","priority":"1","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html\n\nהקפה מעולה!! הכי טוב ששתינו בוינה. אני לקחתי עם קרמל אמיתי וזה היה מושלם. למי שיש מכונה ומטחנה מומלץ לקנות גם פולים הביתה. קנינו במתנה וזה התקבל בהתלהבות","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858},"duration":"01:00"},{"start":"2022-11-11T16:00:00.000Z","end":"2022-11-11T17:00:00.000Z","title":"Das Loft – Unique Bars","id":"54","className":"priority-1","extendedProps":{"id":"54","categoryId":"9","description":"הבר בקומת הגג של מלון סופיטל\nראובן ואורטל היו שם נראה טוב!\n\nארוחת ערב בלוקיישן מטורף על הגג של מלון סופיטל בוינה","priority":"1","icon":"","preferredTime":"0","location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785}},"allDay":false,"icon":"","priority":"1","description":"הבר בקומת הגג של מלון סופיטל\nראובן ואורטל היו שם נראה טוב!\n\nארוחת ערב בלוקיישן מטורף על הגג של מלון סופיטל בוינה","location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785},"duration":"01:00"},{"start":"2022-11-10T14:00:00.000Z","end":"2022-11-10T14:58:00.000Z","title":"מסעדת truman&co המבורגר מושחת","id":"348","className":"priority-2","extendedProps":{"id":"348","categoryId":"2","description":"","priority":"2","icon":"","preferredTime":"0"},"allDay":false,"icon":"","priority":"2","description":"","duration":"00:58"},{"start":"2022-11-12T05:00:00.000Z","end":"2022-11-12T06:00:00.000Z","title":"מלון NH Collection","id":"147","className":"priority-0","extendedProps":{"id":"147","categoryId":"16","description":"","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"openingHours":{"SUNDAY":{"start":"00:00","end":"00:00"}}},"allDay":false,"icon":"","priority":"0","description":"","duration":"01:00","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"openingHours":{"SUNDAY":{"start":"00:00","end":"00:00"}}},{"start":"2022-11-10T21:35:00.000Z","end":"2022-11-10T22:00:00.000Z","title":"צ׳ק אין במלון NH Collection","id":"72","className":"priority-0","extendedProps":{"id":"72","categoryId":"11","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","priority":"0","icon":"","preferredTime":"0"},"allDay":false,"icon":"","priority":"0","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","duration":"00:25"}]
// side bar events
// {"2":[{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","className":"priority-2","category":"2"},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Santos Neubau I Mexican Grill & Bar, Siebensterngasse, Vienna, Austria","latitude":48.2027685,"longitude":16.355773}},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Haas & Haas wine and delicatessen, Ertlgasse, Vienna, Austria","latitude":48.2101743,"longitude":16.373349}},{"id":"207","title":"Fabios מסעדה איטלקית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה איטלקית ברמה מאוד גבוהה והמחירים בהתאם. אנחנו הזמנו מלנזנה שהייתה מעולה, ניקוי עם חצילים ועגבניות וסלט קיסר (שהיה לו טעם של דגים כמו סלט קיסר אמיתי - אני פחות התחברתי)&#10;רצוי להזמין מקום מראש","location":{"address":"Fabios, Tuchlauben, Vienna, Austria","latitude":48.21000089999999,"longitude":16.3698188},"category":"2","className":"priority-0"},{"id":"272","title":"losteria","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"אם אתם בפארק פארטר בערב ומחפשים משהו לאכול (ולא בא לכם על האוכל שיש בתוך הפארק), ממש לידו יש מסעדה איטלקית מקסימה עם פיצות טובות וגדולות (אחת ל2 אנשים לגמרי מספיקה)","location":{"address":""},"category":"2","className":"priority-0"},{"title":"Mae Aurel בית קפה ביסטרו","id":"366","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה חדשה בוינה, בית קפה-ביסטרו מודרני, אכלנו ארוחת בוקר (למי שאוהב אגז בנדיקט - מומלץ בחום!)\nהמסעדה יפהפייה ואווירה נעימה, גם לארוחת צהריים או ערב.\nלברר","location":{"address":"Mae Aurel, Salzgries, Wien, Austria","latitude":48.2128087,"longitude":16.372889},"extendedProps":{"categoryId":"2"},"category":"2","className":"priority-0"},{"title":"Schnitzelwirt","id":"412","icon":"🐔","priority":"1","allDay":false,"preferredTime":"0","description":"שניצל וינאי. כמובן שאם נמצאים בוינה חייבים לנסות את מנת הדגל והיא שניצל וינאי. אני אישית פחות אוהבת מאכלים בטיגון בשמן עמוק אבל החלטתי שזה שווה נסיון. ניסינו את השניצל בשני מוסדות שנחשבים להכי טובים לשניצל (לפני המלצות של מקומיים ותיירים).  אחד היה בFiglmüller והשני בSchnitzelwir.\n\nבFiglmüller השניצל היה יקר מדי לדעתי וגם לא היה כזה מוצלח בSchnitzelwir הוא היה קצת יותר זול וקצת יותר טעים אבל עדיין לא התלהבתי יותר מדי. אבל הגודל של המנה ממש גדול ואפשר להתחלק בה שני אנשים. אבל שני המקומות היו מלאים באנשים ואם בא לכם לנסות שניצל אז אולי הם המקומות ששווה לנסות בהם.","categoryId":"2","location":{"address":"Schnitzelwirt, Neubaugasse, Wien, Austria","longitude":16.3491982,"latitude":48.20253689999999},"duration":"01:30","category":"2","className":"priority-1"},{"title":"Steirereck מסעדת מישלן","id":"173","className":"priority-3","extendedProps":{"id":"173","categoryId":"2","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\\nיצאנו מפוצצים.\\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\\n(מתוך: פייסבוק)","priority":"1","icon":"","preferredTime":"5","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958}},"allDay":false,"icon":"","priority":"3","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\nיצאנו מפוצצים.\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\n(מתוך: פייסבוק)\n\nעריכה: ראינו סטורים של זה וזה נראה לא שווה ולא מגרה","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958},"duration":"01:30","category":"2","preferredTime":"0"},{"id":"544","title":"Cafe Landtmann - פרויד","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"ברקפסט בבית קפה אייקוני ואהוב מול בית העירייה שפרויד היה יושב בו בקביעות, בצהריים ובערב יש פה שניצל מצויין","location":{"address":"Café Landtmann, Universitätsring, Vienna, Austria","latitude":48.21154689999999,"longitude":16.3615167},"openingHours":{"SUNDAY":{"start":"07:30","end":"22:00"},"MONDAY":{"start":"07:30","end":"22:00"},"TUESDAY":{"start":"07:30","end":"22:00"},"WEDNESDAY":{"start":"07:30","end":"22:00"},"THURSDAY":{"start":"07:30","end":"22:00"},"FRIDAY":{"start":"07:30","end":"22:00"},"SATURDAY":{"start":"07:30","end":"22:00"}},"category":"2","className":"priority-1","extendedProps":{}},{"id":"546","title":"בית קפה Palatschinkenuchl","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"בית קפה עם ארוחת בוקר שנראית ממש טוב - מהסטורי Vienna של Traveliri\nחביתה עם גבינה וירקות, קפה חמוד, סוגשל פנקייק מגולגל כזה עם קצפת נראה מדהים","category":"2","className":"priority-2","extendedProps":{},"location":{"address":"Heindls Schmarren & Palatschinkenkuchl, Grashofgasse, Vienna, Austria","latitude":48.2101564,"longitude":16.3760576},"openingHours":{"SUNDAY":{"start":"11:00","end":"23:00"},"MONDAY":{"start":"11:00","end":"23:00"},"TUESDAY":{"start":"11:00","end":"23:00"},"WEDNESDAY":{"start":"11:00","end":"23:00"},"THURSDAY":{"start":"11:00","end":"23:00"},"FRIDAY":{"start":"11:00","end":"23:00"},"SATURDAY":{"start":"11:00","end":"23:00"}}},{"id":"548","title":"קפה Palatschinkenuchl","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מהסטורי של traveliri","location":{"address":"Palatschinken Insel, Wagramer Straße, Vienna, Austria","longitude":16.4330775,"latitude":48.2418658},"category":"2","className":"priority-0"}],"5":[{"title":"קניון SCS","id":"14","icon":"","priority":"2","allDay":false,"preferredTime":"6","description":"","categoryId":"5","location":{"address":"Westfield Shopping City Süd (SCS), Vösendorfer Südring, Vösendorf, Austria","latitude":48.10802839999999,"longitude":16.3179302},"duration":"02:00","category":"5","className":"priority-2"},{"title":"Dunk Shop","id":"461","icon":"","priority":"1","allDay":false,"preferredTime":"0","description":"","categoryId":"5","location":{"address":"Dunk Shop Wien, Gumpendorfer Straße, Vienna, Austria","latitude":48.19770919999999,"longitude":16.3547291},"category":"5","duration":"00:30","className":"priority-1"}],"9":[{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","className":"priority-0","category":"9"},{"id":"218","title":"Josef Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"בר קוקטיילים חמוד וטעים","location":{"address":"Josef Cocktailbar, Sterngasse, Wien, Austria","latitude":48.2116854,"longitude":16.3737393},"category":"9","className":"priority-0"},{"id":"230","title":"Matiki Bar","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"בר קוקטיילים טעים, מיוחד ויפה, מומלץ","location":{"address":"Matiki Bar, Gardegasse, Wien, Austria","latitude":48.2044367,"longitude":16.3550225},"category":"9","className":"priority-2"},{"id":"288","title":"Gruner Kakadu בר קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"חוזרים מחר אבל חייבת לשתף בהמלצה שקיבלנו ממדריך של free walking tour, מקומי אמיתי, על בר בשם גרונר קקדו, בגדול בר עם מלא סגנונות קוקטיילים שווים ממש וגמישים לפי מה שתרצו, איך שמתיישבים מוציאים לך לטעום משהו אלכוהולי על חשבונם, וממשיכים לפנק תוך כדי הערב במשקאות חינם, ממש ברמה שאת הקוקטיילים שכן הזמנו היה לנו קשה לסיים&#10;שירות מקסים וויב מקומי ואחלה בילוי לילי 0 ממליצה ממש&#10;נמצא ברובע 1 במיקום יחסית מרכזי&#10;(המלצה מהפייסבוק - Zemer Shwartz)","location":{"address":"Grüner Kakadu, Marc-Aurel-Straße, Vienna, Austria","latitude":48.212321,"longitude":16.3737978},"category":"9","className":"priority-0"},{"id":"323","title":"Sky Stefel Sky Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"רופטופ בר שיושב ברחוב הקניות מריה הילפר עם אווירה קלילה ונוף מהמם.&#10;בכלליות הסצנה של הרופטופים בוינה תפסה חזק ואפשר לראות עוד הרבה כאלה. עכשיו כשמתקרר לא בטוחה כמה זה רלוונטי וחלק מתחילים להיסגר.","location":{"address":""},"category":"9","className":"priority-0"},{"id":"466","title":"שוק המוגן במתחם Haas&Haas.","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"תיהנו מהאווירה שלפני חג המולד בצורה אחרת לגמרי במתכונת \"חורף בעיר\" בחצר הפנימית הנעימה והמוגנת מפני מזג האוויר של מנזר המסדר הגרמני, ממש מאחורי כנסיית סנט סטפן.\nמחממים את הידיים ליד המדורה הפרטית סביב כל שולחן ושותים את היין החם שנעשה על פי מתכון הבית, מייקב \"Haas & Haas Wein & Fein.kost\", אוכלים שיפודים קטנים על הגריל או מרק חם.\nכל המוצרים והמרכיבים נבחרים בקפידה ובאהבה להנאה מושלמת לפני חג המולד. \nתקופת פעילות: 4 נובמבר - 31 דצמבר\nשעות פתיחה: 14:00-20:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U3 הכתום תחנת Stephansplatz\nאוטובוס קווים 1A/2A/3A תחנת Stephansplatz","location":{"address":"Stephansplatz 4, 1010 Vienna, Austria","latitude":48.2079175,"longitude":16.3732139},"category":"9","className":"priority-2","extendedProps":{}},{"id":"470","title":"השוק מול קתדרלת סט. סטפן (Stephansplatz)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק מול קתדרלת סט. סטפן (Stephansplatz) - במרכז הרובע הראשון ניצב לו הסמל של וינה, קתדרלת סט. סטפן, מסביבה מתקיים שוק כריסמס אחד העמוסים אבל היפים.\nרעיוני, מסורתי ושונה,תכונות אלה מתארות את השוק, המועבר על ידי דוכני שוק חג המולד סביב הקתדרלה הידועה, אלה באים לידי ביטוי הן מבחינת המראה והעיצוב של הצריפים,התאורה כמו גם באומנויות והמלאכה.\nהמוקד העיקרי של שוק חג המולד בסטפנספלאץ הוא על מגוון מוצרים איכותי מאוד של מציגים. זה יכלול בעיקר מוצרים באיכות גבוהה המיוצרים באוסטריה.\nתקופת פעילות: 11 נובמבר - 26 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U3 הכתום תחנת Stephansplatz\nאוטובוס קווים 1A/2A/3A תחנת Stephansplatz","location":{"address":"Stephansplatz 1010, Innere Stadt Vienna, Austria","latitude":48.2087405,"longitude":16.3736859},"category":"9","className":"priority-2"},{"id":"475","title":"שוק הסימטאות בשכונת שפיטלברג (Spittelberg)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"מאחורי רובע המוזיאונים, אחרי שביל מדרגות ורחוב צדדי קטן מתקיים לו אחד משווקי הכריסמס המיוחדים באירופה, מאחורי רובע המוזיאונים שוכן לו הרובע ה-7, רובע שפיטלברג העתיק, בין סימטאות השכונה מתקיים שוק אומנות מיוחד עם אווירת חג קסומה. \nתקופת פעילות: 10 נובמבר - 23 דצמבר\nשעות פתיחה: 14:00-21:00\nתחבורה ציבורית: חשמלית קו 49 תחנת Stiftgasse (להגיע עם המטרו קו U3 הכתום לתחנת Volkstheater ושם לעלות על החשמלית)","location":{"address":"Gutenberggasse, 1070 Vienna, Austria","latitude":48.2033711,"longitude":16.3557115},"category":"9","className":"priority-2"},{"id":"481","title":"השוק הבוטיקי בארמון בלוודר (Belvedere Palace)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"אחד השווקים הקטנים אך היפים בוינה. \nתקופת פעילות: 11 נובמבר - 26 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: חשמלית קווים D/O/1/18 תחנת Quartier Belvedere\nחשמלית קן 71 תחנת Unteres Belvedere\nניתן להגיע במטרו קו U1 האדום לתחנת Hauptbahnhof וללכת כמה דקות ברגל.\nכתובת: Prinz-Eugen-Strasse 27, 1030 Vienna","location":{"address":"Prinz Eugen-Straße 27, 1030 Vienna, Austria","latitude":48.19135799999999,"longitude":16.38013},"category":"9","className":"priority-2"},{"id":"488","title":"השוק מול בית האופרה (Advent pleasure market at the Opera House)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק מול בית האופרה (Advent pleasure market at the Opera House) - שוק מקורה מול בית האופרה מציע עבודות יד ומאכלים אוסטרים ואיטלקים.\nתקופת פעילות: 11 נובמבר - 31 דצמבר\nשעות פתיחה: 11:00-21:00\nתחבורה ציבורית: מטרו קווים U1 האדום/U4 הירוק תחנת Karlsplatz\nחשמלית קווים 1/2/62/71/D תחנת Kärntner Ring. Oper\nכתובת: Mahlerstrasse 6, 1010 Vienna","location":{"address":"Mahlerstraße 6, 1010 Vienna, Austria","latitude":48.2026079,"longitude":16.3710647},"category":"9","className":"priority-2"},{"id":"496","title":"השוק בקמפוס אוניברסיטת וינה","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק בקמפוס אוניברסיטת וינה - כפר חג המולד המציע מסע דרך 9 הפרובינציות האוסטריות ומזמין אתכם להכיר ולחוות את האזורים האוסטריים, את התרבות ואת שמחת החיים.\nבעלי מלאכה וחברות מרחבי אוסטריה הופכים את כפר חג המולד לעולם מרשים של פינוק ואחווה, בו ניתן לחוות את חג המולד האוסטרי המסורתי וליהנות ממנו בכל גווניו.\nהילדים ייהנו מקרוסלת הילדים הנוסטלגית ומסילת חג המולד, ואילו למבוגרים יוצעו אוכל ושתייה אוסטריים מתשעת הפרובינציות האוסטריות ובקתות גורמה.\nתקופת פעילות: 11 נובמבר - 23 דצמבר\nשעות פתיחה: 14:00-22:00\nתחבורה ציבורית: חשמלית קווים 1/5/33/43/44 תחנת Lange Gasse\nאוטובוס קו 13A תחנת Skodagasse\nניתן להגיע במטרו קו U2 לתחנת Schottentor וללכת ברגל לכיוון הכנסיה הגדולה\nכתובת: Alserstrasse/Spitalgasse, Hof 1, 1090 Vienna","location":{"address":"Hof 1, Spitalgasse, Vienna, Austria","latitude":48.2151171,"longitude":16.3525406},"category":"9","className":"priority-2"},{"id":"505","title":"השוק בכיכר אמ-הוף (Am Hof Advent Market)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק בכיכר אמ-הוף (Am Hof Advent Market) - השוק בלב העיר העתיקה בין בית המשפט והמבנים ההסטורים מציע 76 דוכנים של כמעט הכל! נחשב לאחד השווקים היפים בוינה. \nתקופת פעילות: 11 נובמבר - 23 דצמבר.\nשעות פתיחה: 11:00-21:00.\nתחבורה ציבורית: מטרו קו U3 הכתום תחנת Herrengasse\nאוטובוס קווים 1A/3A תחנת Schwertgasse\nכתובת: Am Hof, 1010 Vienna","location":{"address":"Am Hof, 1010 Vienna, Austria","latitude":48.2106478,"longitude":16.3678283},"category":"9","className":"priority-2"},{"id":"550","title":"Robin Schulz Prater DOME 7 ","icon":"","duration":"03:00","priority":"2","preferredTime":"0","description":"22:00 - 06:00\n\nhttps://www.eventbrite.at/e/robin-schulz-prater-dome-wien-tickets-415323131667","location":{"address":"Prater Dome, Gaudeegasse 7, Wien, Austria","latitude":48.2171617,"longitude":16.3971541},"openingHours":{"SUNDAY":{"start":"22:00","end":"06:00"},"MONDAY":{"start":"22:00","end":"06:00"}},"category":"9","className":"priority-2","extendedProps":{}}],"11":[],"14":[],"16":[{"id":"537","title":"רחוב Graben","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"רחובות הקניות המרכזיים - Graben ו Kartner","location":{"address":"Graben, Wien, Austria","latitude":48.2087073,"longitude":16.369696},"category":"16","className":"priority-0","extendedProps":{}},{"id":"540","title":"רחוב kartner","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"רחובות הקניות המרכזיים - Graben ו Kartner","location":{"address":"Kärntner Straße, Wien, Austria","latitude":48.2042352,"longitude":16.370533},"category":"16","className":"priority-0","extendedProps":{}}],"19":[{"id":"438","title":"קזינו","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"","location":{"address":"Casino Wien, Kärntner Straße, Wien, Austria","longitude":16.3708676,"latitude":48.2044512},"category":"19","className":"priority-0"},{"id":"515","title":"השוק הקיסרי בכיכר מיכאלרפלאץ בכניסה למתחם ארמון הופבורג (Imperial and Royal Christmas Market)","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"השוק הקיסרי בכיכר מיכאלרפלאץ בכניסה למתחם ארמון הופבורג (Imperial and Royal Christmas Market) - שוק חג המולד הקיסרי והמלכותי במיכאלרפלאץ הוא ייחודי כמו כתובתו האצילית.\nלכיכר מיכאלר מגיע לא פחות מכך, בהיותה אחד המקומות המכובדים ביותר בוינה, בראש ובראשונה הוא נמצא בסמוך למקום מושבה של המלוכה הקודמת, ארמון הופבורג.\nהאדריכלות מרשימה ומלכותית כראוי. מיכאלרפלאץ מוקף בהיסטוריה: קיסרים, קיסריות, נסיכי כתר ונסיכות התגוררו בהופבורג וחגגו כינוסי חג מולד נוצצים בפאר מדהים. \nתקופת פעילות: 10 נובמבר - 24 דצמבר.\nשעות פתיחה: 20:00 - 10:00.\nתחבורה ציבורית: מטרו קו U3 הכתום תחנת Herrengasse\nאוטובוס קווים 1A/2A תחנת Michaelerplatz\nכתובת: Michaelerplatz, 1010 Vienna","location":{"address":"Michaelerplatz, 1010 Vienna, Austria","latitude":48.2079208,"longitude":16.3668509},"category":"19","className":"priority-2"}]}
// all events
// [{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","className":"priority-2","category":"2"},{"id":"2","title":"chicago deep pot pizza","icon":"","duration":"01:00","priority":"2","preferredTime":"6","description":"https://www.mjam.net/en/restaurant/lcfm/the-chicago-deep-pot-pizza-company","category":"2"},{"id":"5","title":"figel müller שניצל וינאי","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"הרבה כבר נאמר, לדעתנו השניצל מעולה. פשוט טעים. הגענו לארוחת ערבף לא היה תור בכלל בסניף השני שלהם (לא המקורי). שווה ביותר!!!","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":""}},{"id":"5","title":"שניצל וינאי טוב","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"לברר","category":"2"},{"id":"9","title":"El Gaucho Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"","className":"priority-1","category":"2"},{"id":"9","title":"El Gaucho Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"2","description":"","category":"2"},{"id":"14","title":"קניון SCS","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","className":"priority-2","category":"5"},{"id":"14","title":"קניון SCS","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","category":"5"},{"id":"20","title":"Dunk Shop Wien","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","className":"priority-1","category":"5"},{"id":"20","title":"Dunk Shop Wien","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"חנות כדורסל בוינה\nhttps://www.youtube.com/watch?v=D-w_jSRuoiQ","category":"5"},{"id":"27","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-1","category":"2"},{"id":"27","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"2"},{"id":"35","title":"Hard Rock Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Hard Rock Cafe, Rotenturmstraße, Vienna, Austria","latitude":48.2113174,"longitude":16.3754822}},{"id":"35","title":"Hard Rock Vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","category":"2"},{"id":"45","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-1","category":"2"},{"id":"45","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"2"},{"id":"47","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"לברר עם יהב מה השם שלו","className":"priority-0","category":"9","extendedProps":{"categoryId":"9"}},{"id":"47","title":"בר/מועדון עם סל","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"לברר עם יהב מה השם שלו","category":"9"},{"id":"50","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","className":"priority-0","category":"2","extendedProps":{"categoryId":"2"}},{"id":"50","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","category":"2"},{"id":"54","title":"Das Loft – Unique Bars","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"הבר בקומת הגג של מלון סופיטל ","className":"priority-2","category":"9","extendedProps":{"categoryId":"9"},"location":{"address":"Das LOFT, Praterstraße, Wien, Austria","latitude":48.2127326,"longitude":16.379785}},{"id":"54","title":"Das Loft – Unique Bars","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"רופטופ בר.\nלברר","category":"9"},{"id":"59","title":"ופיאנו Vapiano","icon":"","duration":"01:00","priority":"2","preferredTime":"2","description":"","className":"priority-2","category":"2"},{"id":"59","title":"ופיאנו Vapiano","icon":"","duration":"01:00","priority":"2","preferredTime":"2","description":"","category":"2"},{"id":"65","title":"טיסה מתל אביב לוינה","icon":"","duration":"02:55","priority":"0","preferredTime":"0","description":"טיסה עם wizzair\nטיסה מספר w6 2812\nמשך הטיסה 03:55\nמזוודה אחת בהלוך - 20 קילו","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"65","categoryId":"11","description":"טיסה עם wizzair\nטיסה מספר w6 2812\nמשך הטיסה 03:55\nמזוודה אחת בהלוך - 20 קילו","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},{"id":"65","title":"טיסה מתל אביב לוינה","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים - שעות הטיסה, מתי, איזה טרמינל וכו","category":"11"},{"id":"72","title":"צ׳ק אין במלון NH Collection","icon":"","duration":"00:30","priority":"0","preferredTime":"0","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"72","categoryId":"11","description":"צ׳ק אין 15:00\nצ׳ק אאוט 12:00","priority":"0","icon":"","preferredTime":"0","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083}},{"id":"72","title":"צ׳ק אין במלון _____","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים","category":"11"},{"id":"80","title":"צ׳ק אאוט במלון NH Collection","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"צ׳ק אאוט בשעה 12:00","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"80","categoryId":"11","description":"צ׳ק אאוט בשעה 12:00","priority":"0","icon":"","preferredTime":"0"}},{"id":"80","title":"צ׳ק אאוט במלון ______","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים","category":"11"},{"id":"89","title":"טיסה חזור מוינה לתל אביב","icon":"","duration":"04:20","priority":"0","preferredTime":"0","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","className":"priority-0","category":"11","allDay":false,"extendedProps":{"id":"89","categoryId":"11","description":"טיסה מספר LY 364 עם אלעל\nמשך הטיסה 03:20","priority":"0","icon":"","preferredTime":"0","location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},"location":{"address":"Vienna Airport (VIE), Schwechat, Austria","latitude":48.11261249999999,"longitude":16.5755139}},{"id":"89","title":"טיסה חזור","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להשלים - איפה, מתי, איזה טרמינל וכו׳","category":"11"},{"id":"99","title":"Vienna's roller-coaster restaurant","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"https://www.youtube.com/watch?v=2BKm33Df48c","className":"priority-1","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"ROLLERCOASTERRESTAURANT Vienna, Gaudeegasse, Vienna, Austria","latitude":48.21744580000001,"longitude":16.3969633}},{"id":"99","title":"Vienna's roller-coaster restaurant","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"https://www.youtube.com/watch?v=2BKm33Df48c","category":"2"},{"id":"101","title":"לברר אם דברים פתוחים בראשון","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","className":"priority-0","category":"14"},{"id":"101","title":"לברר אם דברים פתוחים בראשון","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"יש מצב שהרבה דברים סגורים בראשון אז לברר ולראות איזה דברים כן כדאי לשים בראשון מבחינת תכנון","category":"14"},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Santos Neubau I Mexican Grill & Bar, Siebensterngasse, Vienna, Austria","latitude":48.2027685,"longitude":16.355773}},{"id":"104","title":"santos mexican grill and bar","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"מקור: היילייט של tair mordoch ממאסטר שף","category":"2"},{"id":"108","title":"Cafe Central Vienna","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"בית קפה יפייפה, עם שירות נהדר. מאכלים טעימים. רצוי להזמין מקום מראש.\nמקור: פייסבוק + היילייט של tair mordoch ממאסטר שף\nהמלצה: לאכול קייזרשמן - קינוח שהוא בעצם פנקייק אוסטרי","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Café Central, Herrengasse, Wien, Austria","latitude":48.21042740000001,"longitude":16.3654339}},{"id":"108","title":"Cafe Central Vienna","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"מקור: היילייט של tair mordoch ממאסטר שף","category":"2"},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","className":"priority-2","category":"2","extendedProps":{"categoryId":"2"},"location":{"address":"Haas & Haas wine and delicatessen, Ertlgasse, Vienna, Austria","latitude":48.2101743,"longitude":16.373349}},{"id":"113","title":"Haas & Haas Tea House","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה באתר של אלעל.\n3 סוגי ארוחות בוקר שונות מהטובות בעיר.\nלברר\n\nStephansplatz 4","category":"2"},{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","className":"priority-0","category":"9"},{"id":"119","title":"Flex","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מועדון. המלצה באתר של אלעל. לברר.","category":"9"},{"id":"126","title":"The Loft","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","className":"priority-0","category":"2"},{"id":"126","title":"The Loft","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"2"},{"title":"Funky Monkey Bar","id":"129","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","className":"priority-0","extendedProps":{"categoryId":"9"}},{"title":"Funky Monkey Bar","id":"129","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9"},{"title":"Funky Monkey Bar","id":"131","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","extendedProps":{"categoryId":"9"},"className":"priority-0"},{"title":"Funky Monkey Bar","id":"131","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"דירוג 4.2/5 בגוגל\nנראה חמוד\nלברר אם יש עליו המלצות","categoryId":"9","category":"9","extendedProps":{"categoryId":"9"}},{"title":"The Loft","id":"133","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"9","extendedProps":{"categoryId":"9"},"className":"priority-0"},{"title":"The Loft","id":"133","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"קפה-בר-מועדון בשלושה מפלסים.\nהמלצה באתר של אלעל.\nלברר","category":"9","extendedProps":{"categoryId":"9"}},{"id":"135","title":"אוכל חדש","icon":"","duration":"01:00","priority":"1","preferredTime":"1","description":"","category":"2","className":"priority-1"},{"id":"135","title":"אוכל חדש","icon":"","duration":"01:00","priority":"1","preferredTime":"1","description":"","category":"2"},{"id":"138","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"138"},"duration":"00:30"},{"id":"142","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"142"},"duration":"00:30"},{"id":"147","title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","category":"16","className":"priority-0","allDay":false,"location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"extendedProps":{"title":"מלון NH Collection","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"16","location":{"address":"Hotel NH Collection Wien Zentrum, Mariahilfer Straße, Vienna, Austria","latitude":48.197888,"longitude":16.3485083},"id":"147"},"duration":"00:30"},{"id":"153","title":"פארק מים אוברלה - Oberlaa Therme","icon":"","duration":"02:30","priority":"1","preferredTime":"5","description":"פארק מים כמו התרמה\nhttps://www.vienna.co.il/Oberlaa_Therme.html\nמומלץ להגיע בערב כשאין ילדים","location":{"address":"Therme Wien, Kurbadstraße, Vienna, Austria","latitude":48.1437114,"longitude":16.4010266},"category":"19"},{"id":"155","title":"קניון פרנדורף","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"","location":{"address":"McArthurGlen Designer Outlet Parndorf, Designer-Outlet-Straße, Parndorf, Austria","latitude":47.975919,"longitude":16.851909},"category":"5","extendedProps":{"categoryId":"5"}},{"id":"158","title":"טיול יום לכפר הציורי האלשטאט Hallstat","icon":"","duration":"08:00","priority":"1","preferredTime":"0","description":"טיול יום עם רפאל המדריך הכי גבר שיש\n+43660262628\nקודם כל בן אדם, אחרי זה הוא מדריך בחסד עליון, מכיר טוב את המקום, דואג לדברים הקטנים, מסביר, כמובן עוצר לתמונות (הצגה), נוסע בבטיחות עם רכב מושקע ואיך לא דובר עברית.\nפורסם על ידי Haim Shem Tov בפייסבוק בוינה למטיילים","category":"19"},{"id":"162","title":"פאב 13 קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"״אני לא טיפוס שאוהב אלכוהול ולאורך השנים שתיתי אינספור קוקטיילים ומשקאות ולא התלהבתי, אבל המקום הזה הוא ואו - זה היה מטורף. הכל היה כ״כ טרי ואיכותי. מהמיץ שסחוט טרי במקום לאלכוהול שבו הוא משתמש״\nShay M Levy בוינה למטיילים","location":{"address":"Bar 13 Cocktails, Himmelpfortgasse, Vienna, Austria","latitude":48.20553530000001,"longitude":16.3736907},"category":"9"},{"id":"167","title":"Bestens Bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"בר קוקטיילים מעולה עם אוכל מושלם\nצ׳יזי נאצ׳וס ממש טעים\nועוד מנה שנקראת flamkuchen כמו פיצה על בצק דק דק אלוהי\nמחירים כמו בארץ 11-13 יורו לקוקטייל, אבל כל כך נהננו שהיינו פעמיים!\nקוקטייל אהוב במיוחד herbi וגם ginger stick שניהם חמצמצים וקלילים","location":{"address":"bestens. Cocktailbar, Burggasse, Vienna, Austria","latitude":48.2039763,"longitude":16.3543474},"category":"9"},{"id":"173","title":"Steirereck מסעדת מישלן","icon":"","duration":"01:00","priority":"1","preferredTime":"0","description":"מי שאוהב חוויה של אוכל פלצני, שירות מדהים, הכל סופר מיוחד, טעמים חדשים - מומלץ מאוד.\nיצאנו מפוצצים.\nמספיק לדעתי לקחת תפריט 4 מנות. מביאים מלא פינוקים מסביב על חשבון הבית אם זה מנות פתיחה, ביניים ופינוקי קינוחים...\nהתפריט לבד הוא 109 יורו לאדם, עם 2 כוסות יין, שתייה וטיפ יצאנו ב250 לזוג.\n(מתוך: פייסבוק)","location":{"address":"Steirereck, Am Heumarkt, Vienna, Austria","latitude":48.20445780000001,"longitude":16.3813958},"category":"2","extendedProps":{"categoryId":"2"}},{"id":"180","title":"בית קפה Kylo","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"בית קפה על נהר הדנובה עם ארוחות בוקר מגוונות וטעימות\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12789266-Reviews-Klyo-Vienna.html","location":{"address":"KLYO, Uraniastraße, Wien, Austria","latitude":48.2115613,"longitude":16.383796},"category":"2"},{"id":"188","title":"Café Gloriette - קפה בארמון שנבורן","icon":"","duration":"01:00","priority":"2","preferredTime":"1","description":"המלצה - שטרודל תפוחים","location":{"address":"Café Gloriette, Vienna, Austria","latitude":48.17823149999999,"longitude":16.3087308},"category":"2"},{"id":"197","title":"fenster cafe vienna","icon":"","duration":"01:00","priority":"1","preferredTime":"6","description":"קפה בתוך ופל (כן כן זה לא טעות)\nhttps://www.tripadvisor.com/Restaurant_Review-g190454-d12449255-Reviews-Fenster_Cafe-Vienna.html","location":{"address":"Fenster Café, Griechengasse, Vienna, Austria","latitude":48.2109524,"longitude":16.3770858},"category":"2"},{"id":"207","title":"Fabios מסעדה איטלקית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה איטלקית ברמה מאוד גבוהה והמחירים בהתאם. אנחנו הזמנו מלנזנה שהייתה מעולה, ניקוי עם חצילים ועגבניות וסלט קיסר (שהיה לו טעם של דגים כמו סלט קיסר אמיתי - אני פחות התחברתי)\nרצוי להזמין מקום מראש","location":{"address":"Fabios, Tuchlauben, Vienna, Austria","latitude":48.21000089999999,"longitude":16.3698188},"category":"2"},{"id":"218","title":"Josef Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"בר קוקטיילים חמוד וטעים","location":{"address":"Josef Cocktailbar, Sterngasse, Wien, Austria","latitude":48.2116854,"longitude":16.3737393},"category":"9"},{"id":"230","title":"Matiki Bar","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"בר קוקטיילים טעים, מיוחד ויפה, מומלץ","location":{"address":"Matiki Bar, Gardegasse, Wien, Austria","latitude":48.2044367,"longitude":16.3550225},"category":"9"},{"id":"243","title":"Lamee Rooftop","icon":"","duration":"01:00","priority":"2","preferredTime":"4","description":"רופטופ מהמם שמשקיף על וינה, קוקטיילים טעימים. מומלץ להגיע בשקיעה, רצוי להזמין מקום מראש","location":{"address":"Lamée Rooftop, Rotenturmstraße, Vienna, Austria","latitude":48.2102677,"longitude":16.3741269},"category":"9"},{"id":"257","title":"Mae Aurel בית קפה ביסטרו","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"מסעדה חדשה בוינה, בית קפה-ביסטרו מודרני, אכלנו ארוחת בוקר (למי שאוהב אגז בנדיקט - מומלץ בחום!)\nהמסעדה יפהפייה ואווירה נעימה, גם לארוחת צהריים או ערב.\nלברר","location":{"address":"Mae Aurel, Salzgries, Wien, Austria","latitude":48.2128087,"longitude":16.372889},"category":"19"},{"id":"272","title":"losteria","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"אם אתם בפארק פארטר בערב ומחפשים משהו לאכול (ולא בא לכם על האוכל שיש בתוך הפארק), ממש לידו יש מסעדה איטלקית מקסימה עם פיצות טובות וגדולות (אחת ל2 אנשים לגמרי מספיקה)","location":{"address":""},"category":"2"},{"id":"288","title":"Gruner Kakadu בר קוקטיילים","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"חוזרים מחר אבל חייבת לשתף בהמלצה שקיבלנו ממדריך של free walking tour, מקומי אמיתי, על בר בשם גרונר קקדו, בגדול בר עם מלא סגנונות קוקטיילים שווים ממש וגמישים לפי מה שתרצו, איך שמתיישבים מוציאים לך לטעום משהו אלכוהולי על חשבונם, וממשיכים לפנק תוך כדי הערב במשקאות חינם, ממש ברמה שאת הקוקטיילים שכן הזמנו היה לנו קשה לסיים\nשירות מקסים וויב מקומי ואחלה בילוי לילי 0 ממליצה ממש\nנמצא ברובע 1 במיקום יחסית מרכזי\n(המלצה מהפייסבוק - Zemer Shwartz)","location":{"address":"Grüner Kakadu, Marc-Aurel-Straße, Vienna, Austria","latitude":48.212321,"longitude":16.3737978},"category":"9"},{"id":"305","title":"שוק נאשמרקט בלילה","icon":"","duration":"01:00","priority":"2","preferredTime":"5","description":"לא הרבה יודעים אבל שוק הנאשמרקט התיירותי שהולכים אליו ביום, הופך לסצנת ברים פלורנטינית בלילה. אנחנו הגענו סביבות השעה 21:30-22:00 והייתה אווירה כיפית וקלילה, אל תטעו ותחשבו שהוא סגור, פשוט צריך להיכנס טיפה פנימה. מתאים למי שמחפש לשבת לבירה, הוא נסגר בערך בחצות.","location":{"address":"Naschmarkt, Wien, Austria","latitude":48.1984054,"longitude":16.3631165},"category":"9"},{"id":"323","title":"Sky Stefel Sky Bar","icon":"","duration":"01:00","priority":"0","preferredTime":"5","description":"רופטופ בר שיושב ברחוב הקניות מריה הילפר עם אווירה קלילה ונוף מהמם.\nבכלליות הסצנה של הרופטופים בוינה תפסה חזק ואפשר לראות עוד הרבה כאלה. עכשיו כשמתקרר לא בטוחה כמה זה רלוונטי וחלק מתחילים להיסגר.","location":{"address":""},"category":"9"},{"id":"325","title":"404 dont ask why bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"מסעדה איטלקית ממש מומלצת","location":{"address":"404 Dont ask why, Friedrichstraße, Wien, Austria","latitude":48.2000944,"longitude":16.3663115},"category":"9"},{"id":"327","title":"מסעדת truman&co המבורגר מושחת","icon":"","duration":"01:00","priority":"2","preferredTime":"0","description":"","location":{"address":"Truman & Co., Israel","longitude":34.9111665,"latitude":31.9869703},"category":"19","allDay":false,"className":"priority-2","extendedProps":{"id":"327","categoryId":"19","description":"","priority":"2","icon":"","preferredTime":"0","location":{"address":"Truman & Co., Israel","longitude":34.9111665,"latitude":31.9869703}}},{"id":"330","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","category":"11","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"11","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"category":"11"},"duration":"00:30"},{"id":"334","title":"בית","icon":"","duration":"01:00","priority":"0","preferredTime":"0","description":"להתארגן לטיסה","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414},"category":"16","allDay":false,"className":"priority-0","extendedProps":{"id":"334","categoryId":"16","description":"להתארגן לטיסה","priority":"0","icon":"","preferredTime":"0","location":{"address":"בן יהודה 164, תל אביב, Israel","longitude":34.7732708,"latitude":32.0867414}}},{"id":"336","title":"Funky Monkey Bar","icon":"","duration":"01:00","priority":"1","preferredTime":"5","description":"דירוג 4.2/5 בגוגל נראה חמוד לברר אם יש עליו המלצות","location":{"address":"Funky Monkey Bar, Sterngasse, Wien, Austria","latitude":48.21208300000001,"longitude":16.3723106},"category":"9","extendedProps":{"categoryId":"9"}},{"id":"339","title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","category":"19","className":"priority-0","allDay":false,"location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001},"extendedProps":{"title":"נתב״ג","icon":"","priority":"0","preferredTime":"0","description":"","categoryId":"19","location":{"address":"שדה תעופה בן גוריון/טרמינל 3, Ben Gurion Airport, Israel","latitude":32.0001535,"longitude":34.87053330000001}},"duration":"00:30"}]
