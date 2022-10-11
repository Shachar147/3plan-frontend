import React, {useContext, useState} from 'react';
import { icons } from './icons';
import Select from "react-select";
import {eventStoreContext} from "../../stores/events-store";
import TranslateService from "../../services/translate-service";
import './icon-selector.scss';
import {SELECT_STYLE} from "../../utils/ui-utils";

export interface IconSelectorProps {
    id?: string,
    name?: string,
    value?: string,
    onChange?: (data: any) => void
}
const IconSelector = (props: IconSelectorProps) => {
    const [selectedOption, setSelectedOptions] = useState(props.value);
    const eventStore = useContext(eventStoreContext);

    const optionsList = icons.map((icon) => ({
        value: icon.text,
        label: icon.icon
    }));

    const handleSelect = (data:any) => {
        setSelectedOptions(data);

        if (props.onChange){
            props.onChange(data);
        }
    }

    return (
        <div className={"icon-selector"}>
            <Select
                isClearable
                isSearchable
                id={props.id}
                name={props.name}
                options={optionsList}
                placeholder={TranslateService.translate(eventStore, 'SELECT_ICON_PLACEHOLDER')}
                value={selectedOption}
                onChange={handleSelect}
                maxMenuHeight={42 * 3}
                styles={SELECT_STYLE}
            />
        </div>
    )
};

export default IconSelector;