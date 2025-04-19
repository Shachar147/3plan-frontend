import { fetchCitiesAndSetOptions } from '../components/destination-selector/destination-selector';
import { CityOrCountry } from '../components/destination-selector/destination-selector';

interface DestinationsByCountry {
	[countryName: string]: {
		countryCode: string;
		cities: string[];
	};
}

export function getDestinationsByCountry(): DestinationsByCountry {
	const allOptions = fetchCitiesAndSetOptions();
	const destinationsByCountry: DestinationsByCountry = {};

	// First, get all countries
	allOptions.forEach((option: CityOrCountry) => {
		if (option.type === 'country') {
			const countryName = option.label;
			const countryCode = option.flagClass.split('fi-')[1];
			destinationsByCountry[countryName] = {
				countryCode,
				cities: [],
			};
		}
	});

	// Then map cities to their countries
	allOptions.forEach((option: CityOrCountry) => {
		if (option.type === 'city') {
			const [city, country] = option.label.split(', ');
			if (destinationsByCountry[country]) {
				destinationsByCountry[country].cities.push(city);
			}
		}
	});

	return destinationsByCountry;
}

export function getCityCountry(cityName: string): string | null {
	const allOptions = fetchCitiesAndSetOptions();
	const cityOption = allOptions.find(
		(option: CityOrCountry) =>
			option.type === 'city' && option.label.toLowerCase().startsWith(cityName.toLowerCase() + ',')
	);

	if (cityOption) {
		return cityOption.label.split(', ')[1];
	}
	return null;
}
