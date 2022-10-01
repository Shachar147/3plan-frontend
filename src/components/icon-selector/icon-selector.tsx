import React, {useState} from 'react';
import { icons } from './icons';
import Select from "react-select";

export interface IconSelectorProps {

}
const IconSelector = (props: IconSelectorProps) => {
    const [selectedOption, setSelectedOptions] = useState();

    const optionsList = icons.map((icon) => ({
        value: icon.text,
        label: icon.icon
    }));

    const handleSelect = (data:any) => {
        setSelectedOptions(data);
    }

    return (
        <Select
            options={optionsList}
            placeholder="Select icon"
            value={selectedOption}
            onChange={handleSelect}
            isSearchable={true}
        />
    )
};

export default IconSelector;