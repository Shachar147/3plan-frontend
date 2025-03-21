import React, { useEffect, useRef, useState } from 'react';
import './location-picker.css';
import { getClasses } from '../../utils/utils';
import { LocationData } from '../../utils/interfaces';
const validIcon = 'images/map-pin.svg';

const invalidIcon = 'images/map-pin-missing.svg';

interface LocationPickerProps {
	className?: string;
	locationPlaceholder: string;
	locationData: LocationData;
	setLocationData: (locationData?: LocationData) => void;
	supportLinkAsLocation?: boolean;
	locationIcon?: string;
	isDisabled?: boolean;
	allowCoordinates?: boolean;
}

const LocationPicker = (props: LocationPickerProps) => {
	const locationDefaultVal = props.locationData && props.locationData.address && (props.locationData.address || '');
	const isDisabled = props.isDisabled != undefined ? props.isDisabled : false;
	const [location, setLocation] = useState<string>(locationDefaultVal); // for display only
	const [locationData, setLocationDataState] = useState<LocationData | undefined>(props.locationData); // the actual data

	const autoCompleteRef = useRef<HTMLInputElement>(null);
	let autoCompleteListener: any, autoCompleteObj: any;

	useEffect(() => {
		initLocationAutoComplete();
		initPlaceChangedEventListener();

		return () => {
			// try catch in case the user does not have internet access.
			// in that case we still want location picker to be rendered, but simply without the google autocomplete.
			try {
				// @ts-ignore
				window.google.maps.event.removeListener(autoCompleteListener);
			} catch (error) {}
		};
	}, []);

	useEffect(() => {
		const locationAddress = props.locationData && props.locationData.address && (props.locationData.address || '');
		setLocation(locationAddress);
		setLocationDataState(props.locationData);
	}, [props.locationData]);

	function initLocationAutoComplete() {
		if (autoCompleteRef.current)
			// try catch in case the user does not have internet access.
			// in that case we still want location picker to be rendered, but simply without the google autocomplete.
			try {
				// @ts-ignore
				autoCompleteObj = new window.google.maps.places.Autocomplete(autoCompleteRef.current);
			} catch (error) {}
	}

	function populateLocationData() {
		let address = locationData ? locationData.address : '',
			longitude: number | undefined,
			latitude: number | undefined;

		const inputValue = autoCompleteRef.current?.value;
		const place = autoCompleteObj.getPlace();
		if (place) {
			address = inputValue || place.formatted_address;
			longitude = place.geometry.location.lng();
			latitude = place.geometry.location.lat();
		}

		setLocation(address);
		setLocationData({
			address,
			longitude,
			latitude,
		});
	}

	function setLocationData(newLocationData?: LocationData) {
		// update the state of this component
		setLocationDataState(newLocationData);

		// calling callback function whenever this state changes.
		props.setLocationData(newLocationData);
	}

	function initPlaceChangedEventListener() {
		// try catch in case the user does not have internet access.
		// in that case we still want location picker to be rendered, but simply without the google autocomplete.
		try {
			// @ts-ignore
			autoCompleteListener = window.google.maps.event.addListener(
				autoCompleteObj,
				'place_changed',
				populateLocationData
			);
		} catch (error) {}
	}

	function getLocationIcon(): JSX.Element {
		const haveLocationCoordinates = locationData && locationData.longitude && locationData.latitude;

		if (haveLocationCoordinates) {
			return <img src={props.locationIcon || validIcon} alt="" className="location-indicator"></img>;
		}

		// if (props.supportLinkAsLocation && locationData?.address) {
		// 	const link = linkify.find(locationData?.address);
		// 	if (link && link.length) {
		// 		return (
		// 			<ConnecteamTooltip tooltip={Translate.t('LOCATION_INPUT.LINK_INDICATOR')} className="width-200">
		// 				<img src={linkIcon} className="location-indicator" />
		// 			</ConnecteamTooltip>
		// 		);
		// 	}
		// }

		const tooltip = 'Location Coordinates not available';

		return <img src={invalidIcon} title={tooltip} alt={tooltip} className="location-indicator" />;
	}

	function onInputChange(address: string) {
		// set location (to update input value)
		setLocation(address);

		// set location data
		// if address is empty, we should update locationData to None.
		let newLocationData =
			address && address !== ''
				? {
						address,
						longitude: undefined,
						latitude: undefined,
				  }
				: undefined;

		// if (props.allowCoordinates && newLocationData != undefined) {
		// 	try {
		// 		const validator = new CoordinatesValidator();
		// 		if (validator.isValid(address)) {
		// 			const position = new Coordinates(address);
		// 			const latitude = position.getLatitude();
		// 			const longitude = position.getLongitude();
		// 			if (latitude != null && longitude != null) {
		// 				newLocationData = {
		// 					address,
		// 					longitude,
		// 					latitude,
		// 				};
		// 			}
		// 		}
		// 	} catch (e) {}
		// }
		setLocationData(newLocationData);
	}

	const containerClassName = getClasses('location-picker-container', isDisabled && 'disabled');
	return (
		<div className={containerClassName}>
			<input
				ref={autoCompleteRef}
				type="text"
				className={getClasses('location-input', props.className)}
				value={location}
				onChange={(e) => onInputChange(e.target.value)}
				autoComplete="off"
				placeholder={props.locationPlaceholder ? props.locationPlaceholder : ''}
				disabled={isDisabled}
			/>
			{getLocationIcon()}
		</div>
	);
};

export default LocationPicker;
