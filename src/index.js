import React, { useContext, useEffect, useRef } from 'react';
import { render } from 'react-dom';
import MainPage from './layouts/main-page/main-page';
import 'bootstrap/dist/css/bootstrap.css';
import './stylesheets/fonts.css';
import './stylesheets/colors.css';
import './stylesheets/buttons.scss';
import './stylesheets/app.scss';
import './stylesheets/rtl.scss';
import './stylesheets/fontawesome/css/font-awesome.css';
import './stylesheets/modals.scss';
import './stylesheets/mobile.responsive.scss';
import LandingPage from './layouts/landing-page/landing-page';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GettingStartedPage from './layouts/getting-started/getting-started-page';
import MyTrips from './layouts/my-trips/my-trips';
import TranslateService from './services/translate-service';
import { eventStoreContext } from './stores/events-store';
import ThemeExample from './layouts/theme-example/theme-example';
import { runInAction } from 'mobx';
import { getCoordinatesRangeKey, padTo2Digits } from './utils/utils';
import SweetAlert from 'react-bootstrap-sweetalert';
import { Observer } from 'mobx-react';
import RegisterPage from './layouts/register-page/register-page';
import LogoutPage from './layouts/logout-page/logout-page';
import { getToken, getUser } from './helpers/auth';
import axios from 'axios';
import LoginPage from './layouts/login-page/login-page';
import MobileLanguageSelectorPage from './layouts/language-selector/mobile-language-selector';
import AdminDashboard from './admin/layouts/dashboard/admin-dashboard';
import AdminManageDestinationItems from './admin/layouts/manage-destination/a-manage-destination';
import AManageItem from './admin/layouts/manage-item/a-manage-item';
import ReactModalService from './services/react-modal-service';
import TriplanSearch from './components/triplan-header/triplan-search/triplan-search';

const RootRouter = () => {
	const eventStore = useContext(eventStoreContext);
	document.title = TranslateService.translate(eventStore, 'APP.TITLE');

	document.addEventListener('keydown', (event) => {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			ReactModalService.openSearchModal();
		}
	});

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

	window.setManualLocation = (className = 'location-input', variableName = 'selectedLocation', eventStore) => {
		const address = document.querySelector(`.${className}`)?.value;
		window[variableName] = {
			address,
			latitude: undefined,
			longitude: undefined,
		};

		if (eventStore) {
			eventStore.modalValues[variableName] = undefined;
		}

		window.openingHours = undefined;
		const summaryDiv = document.getElementsByClassName('opening-hours-details');
		if (summaryDiv && summaryDiv.length > 0) {
			summaryDiv[0].innerHTML = window.renderOpeningHours();
		}
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
					let when = `${openingHours[day].end} - ${openingHours[day].start}`;
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

		return `
                <div class="opening-hours-details">${content}</div>
            `;
	};

	window.initLocationPicker = (
		className = 'location-input',
		variableName = 'selectedLocation',
		placeChangedCallback,
		eventStore
	) => {
		const autoCompleteRef = document.querySelector(`.${className}`);
		const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef);

		google.maps.event.addListener(autocomplete, 'place_changed', function () {
			let place = autocomplete.getPlace();

			window.openingHours = undefined;
			let openingHoursData = undefined;
			if (place.opening_hours && place.opening_hours.periods) {
				const opening_hours = place.opening_hours.periods;
				openingHoursData = {};

				const is247 = opening_hours.length === 1 && !opening_hours[0].close;

				['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].forEach((day, index) => {
					const period = opening_hours[index];
					if (period) {
						const start = is247
							? '00:00'
							: padTo2Digits(period.open.hours) + ':' + padTo2Digits(period.open.minutes);
						const end = is247
							? '00:00'
							: padTo2Digits(period.close.hours) + ':' + padTo2Digits(period.close.minutes);
						openingHoursData[day] = {
							start,
							end,
						};
					}
				});
				window.openingHours = openingHoursData;

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

	return (
		<>
			<BrowserRouter>
				<Routes>
					{/*<Route exact path='/' element={<PrivateRoute/>}>*/}
					{/*    <Route exact path='/' element={<LandingPage/>}/>*/}
					{/*<Route exact path="/loginold" element={getUser() == undefined ? <LoginPageOld /> : <LandingPage />} />*/}
					<Route exact path="/" element={getUser() == undefined ? <LoginPage /> : <LandingPage />} />
					<Route exact path="/home" element={<LandingPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/logout" element={<LogoutPage />} />
					<Route exact path="/getting-started" element={<GettingStartedPage />} />
					<Route exact path="/my-trips" element={<MyTrips />} />
					<Route path={'/plan/create/:tripName/:locale'} element={<MainPage createMode={true} />} />
					<Route path="/plan/:tripName/:locale" element={<MainPage />} />
					<Route path="/plan/:tripName/" element={<MainPage />} />
					<Route path="/plan" element={<MainPage />} />
					<Route path="/theme" element={<ThemeExample />} />
					<Route path="/language" element={<MobileLanguageSelectorPage />} />

					<Route path="/admin" element={<AdminDashboard />} />
					<Route path="/admin/places-tinder" element={<AdminDashboard />} />
					<Route path="/admin/destination/:destination" element={<AdminManageDestinationItems />} />
					<Route path="/admin/item/:id" element={<AManageItem />} />
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
			<div className="search-everywhere-container display-none">
				<TriplanSearch />
			</div>

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
