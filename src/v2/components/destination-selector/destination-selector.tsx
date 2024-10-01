import React, {useState, useEffect, useMemo, useContext, useRef} from 'react';
import Select, { MultiValue } from 'react-select';
import 'flag-icons/css/flag-icons.min.css';
import './destination-selector.scss';
import { OptionType } from './types';
import TranslateService from "../../../services/translate-service";
import {eventStoreContext} from "../../../stores/events-store";
import countriesAndCities from "./countries-and-cities";

// List of popular cities with corresponding country codes
const popularCities = [
    { city: 'New York', countryCode: 'US', countryLabel: 'United States' },
    { city: 'Paris', countryCode: 'FR', countryLabel: 'France' },
    { city: 'London', countryCode: 'GB', countryLabel: 'United Kingdom' },
    { city: 'Tokyo', countryCode: 'JP', countryLabel: 'Japan' },
    { city: 'Dubai', countryCode: 'AE', countryLabel: 'United Arab Emirates' },
    { city: 'Sydney', countryCode: 'AU', countryLabel: 'Australia' },
    { city: 'Rome', countryCode: 'IT', countryLabel: 'Italy' },
    { city: 'Amsterdam', countryCode: 'NL', countryLabel: 'Netherlands' },
    { city: 'Berlin', countryCode: 'DE', countryLabel: 'Germany' },
    { city: 'Barcelona', countryCode: 'ES', countryLabel: 'Spain' },
    { city: 'Vienna', countryCode: 'AT', countryLabel: 'Austria' },
    { city: 'Venice', countryCode: 'IT', countryLabel: 'Italy' },
    { city: 'Prague', countryCode: 'CZ', countryLabel: 'Czech Republic' },
    { city: 'Athens', countryCode: 'GR', countryLabel: 'Greece' },
    { city: 'Florence', countryCode: 'IT', countryLabel: 'Italy' },
    { city: 'Tel Aviv', countryCode: 'IL', countryLabel: 'Israel' },
    { city: 'Stockholm', countryCode: 'SE', countryLabel: 'Sweden' },
    { city: 'Copenhagen', countryCode: 'DK', countryLabel: 'Denmark' },
    { city: 'Oslo', countryCode: 'NO', countryLabel: 'Norway' },
    { city: 'Madrid', countryCode: 'ES', countryLabel: 'Spain' },
    { city: 'Lisbon', countryCode: 'PT', countryLabel: 'Portugal' },
    { city: 'Budapest', countryCode: 'HU', countryLabel: 'Hungary' },
    { city: 'Warsaw', countryCode: 'PL', countryLabel: 'Poland' },
    { city: 'Brussels', countryCode: 'BE', countryLabel: 'Belgium' },
    { city: 'Zurich', countryCode: 'CH', countryLabel: 'Switzerland' },
    { city: 'Ibiza', countryCode: 'ES', countryLabel: 'Spain' },
    { city: 'Palma De Mallorca', countryCode: 'ES', countryLabel: 'Spain' },
    // Additional popular cities in Thailand
    { city: 'Bangkok', countryCode: 'TH', countryLabel: 'Thailand' },
    { city: 'Phuket', countryCode: 'TH', countryLabel: 'Thailand' },
    { city: 'Chiang Mai', countryCode: 'TH', countryLabel: 'Thailand' },
    { city: 'Ko Samui', countryCode: 'TH', countryLabel: 'Thailand' },
    { city: 'Ko Pha Ngan', countryCode: 'TH', countryLabel: 'Thailand' },
    { city: 'Krabi', countryCode: 'TH', countryLabel: 'Thailand' },
    // Additional popular places in Mexico
    { city: 'Tulum', countryCode: 'MX', countryLabel: 'Mexico' },
    { city: 'Bacalar', countryCode: 'MX', countryLabel: 'Mexico' },
    { city: 'Playa del Carmen', countryCode: 'MX', countryLabel: 'Mexico' },
    { city: 'Cancun', countryCode: 'MX', countryLabel: 'Mexico' },
    { city: 'Isla Mujeres', countryCode: 'MX', countryLabel: 'Mexico' },
];

interface DestinationSelectorProps {
    onChange: (selectedValues: string[]) => void;
    selectedDestinations?: string[]
    isSingle?: boolean
}

export interface CityOrCountry {
    "value": string,
    "label": string,
    "type": "country" | "city" | "island",
    "flagClass": string,
    "isPopular": boolean
}

// Function to fetch cities for each country and set options
const fetchCitiesAndSetOptions = (): CityOrCountry[] => {
    // const countries = countryList().getData();
    const allOptions: CityOrCountry[] = [];

    // Add popular cities to options
    popularCities.forEach(({ city, countryCode, countryLabel }) => {
        allOptions.push({
            value: city, // `${city}, ${countryLabel}`,
            label: `${city}, ${countryLabel}`,
            type: 'city',
            flagClass: `fi fi-${countryCode.toLowerCase()}`,
            isPopular: true,
        });
    });

    // @ts-ignore
    allOptions.push(...countriesAndCities);

    // const countries = allOptions.filter((c) => c.type == "country").map((c) => c.label);
    // let a = allOptions.filter((c) => c.type != "country").map((c) => c.label.split(', ')[1]);
    // a = [...Array.from(new Set(a))];
    // const missing: any[] = [];
    // a.forEach((opt) => {
    //     if (!countries.includes(opt)){
    //         console.log("missing: "+ opt);
    //         const similar = allOptions.find((c) => c.type != 'country' && c.label.includes(opt));
    //         if (similar) {
    //             similar.label = opt;
    //             similar.value = opt;
    //             similar.type = "country";
    //             missing.push(similar);
    //         } else {
    //             console.error("couldnt find " + opt);
    //         }
    //     }
    // })
    // console.log(missing);

    // countries.forEach((country) => {
    //
    //     // Check if popular city already exists in options
    //     const existingCity = allOptions.find(opt => opt.label === `${country.label}`);
    //
    //     if (!existingCity) {
    //         allOptions.push({
    //             value: country.label,
    //             label: country.label,
    //             type: 'country',
    //             flagClass: `fi fi-${country.value.toLowerCase()}`,
    //             isPopular: popularCities.some(pc => pc.countryLabel === country.label),
    //         });
    //     }
    //
    //     const cities = getCities(country.label);
    //
    //     // Sort cities based on popularity (popularCities first)
    //     cities.sort((a, b) => {
    //         if (popularCities.some(pc => pc.city === a)) return -1;
    //         if (popularCities.some(pc => pc.city === b)) return 1;
    //         return 0;
    //     });
    //
    //     cities.forEach((city) => {
    //         // Check if popular city already exists in options
    //         const existingCity = allOptions.find(opt => opt.label === `${city}, ${country.label}`);
    //
    //         if (!existingCity) {
    //             allOptions.push({
    //                 value: city, // `${city}, ${country.label}`,
    //                 label: `${city}, ${country.label}`,
    //                 type: 'city',
    //                 flagClass: `fi fi-${country.value.toLowerCase()}`,
    //                 isPopular: popularCities.some(pc => pc.city === city),
    //             });
    //         }
    //     });
    // });

    // @ts-ignore
    return allOptions;
};

function DestinationSelector(props: DestinationSelectorProps) {
    const prevSelectedDestinations = useRef<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<MultiValue<OptionType>>([]);
    const [options, setOptions] = useState<OptionType[]>([]);

    const eventStore = useContext(eventStoreContext);

    const allOptions = useMemo<OptionType[]>(() => fetchCitiesAndSetOptions(), []);

    useEffect(() => {
        if (props.selectedDestinations) {
            if (allOptions.length > 0 && JSON.stringify(prevSelectedDestinations.current) != JSON.stringify(props.selectedDestinations)) {
                prevSelectedDestinations.current = props.selectedDestinations;
                const optionsToSelect = allOptions.filter((o) => props.selectedDestinations.includes(o.value));

                setSelectedOptions(optionsToSelect)
            }
        }
    }, [props.selectedDestinations, allOptions])

    // Fetch cities and set options on component mount
    useEffect(() => {

        const citiesByCountry: any = {};
        const popularOptions: any[] = [];
        allOptions.forEach((option) => {
            citiesByCountry[option.flagClass!] ||= [];
            if (option.isPopular) {
                popularOptions.push(option);
            }
            else if (citiesByCountry[option.flagClass!].length < 5) {
                citiesByCountry[option.flagClass!].push(option);
            }
        })

        setOptions([...popularOptions, ...Object.values(citiesByCountry).flat()]);
    }, [allOptions]);

    const handleInputChange = (inputValue: string) => {
        // Filter options based on input
        const filteredOptions = allOptions.filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );

        // @ts-ignore
        setOptions(filteredOptions.slice(0, Math.min(allOptions.length, 300)));
    };

    const handleChange = (selected: MultiValue<OptionType>) => {
        // since the whole code depdends on that this component is multiselect.
        if (props.isSingle && selected) {
            selected = [selected];
        }
        setSelectedOptions(selected || []);
        props.onChange((selected || []).map((i) => i.value));
    };

    return (
        <div className="destination-selector-container">
            <Select
                isMulti={!props.isSingle}
                isClearable
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                onInputChange={handleInputChange}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={TranslateService.translate(eventStore, 'DESTINATION_SELECTOR.PLACEHOLDER')}
                formatOptionLabel={(option: OptionType) => (
                    <div className="option-label">
                        <span className={option.flagClass} />
                        {option.label}
                        {option.isPopular && (
                            <i className="fa fa-star triplan-orange-color" title={TranslateService.translate(eventStore, 'DESTINATION_SELECTOR.POPULAR_DESTINATION')} />
                        )}
                    </div>
                )}
            />
            <div className="selected-chips">
                {selectedOptions.map((option, index) => (
                    <div className="chip" key={index}>
                        <span className={option.flagClass} />
                        &nbsp;{option.value.split(',')[0]} {/* Display only city name */}
                    </div>
                ))}
            </div>
        </div>
    );
}

export { fetchCitiesAndSetOptions };
export default DestinationSelector;
