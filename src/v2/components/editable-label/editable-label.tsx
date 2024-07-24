import {observer} from "mobx-react";
import React, {useContext, useState} from "react";
import TextInput from "../../../components/inputs/text-input/text-input";
import TranslateService from "../../../services/translate-service";
import Button from "../../../components/common/button/button";
import {eventStoreContext} from "../../../stores/events-store";

interface EditableLabelProps {
    name: string;
    value: string;
    isEditMode: boolean;
    onEditSave: (newValue: string) => void;
    placeholder?: string;
}
function EditableLabel(props: EditableLabelProps){
    const eventStore = useContext(eventStoreContext);
    const { name, isEditMode } = props;
    const [value, setValue] = useState(props.value);

    if (isEditMode) {
        return (
            <div className="flex-row gap-3 align-items-center width-100-percents">
                <TextInput
                    modalValueName={name}
                    type="text"
                    name="trip-name"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}
                    placeholder={props.placeholder}
                />
                <Button
                    flavor="link"
                    text=""
                    icon="fa-save"
                    tooltip={TranslateService.translate(eventStore, 'MODALS.SAVE')}
                    onClick={() => {
                        props.onEditSave(value);
                    }}
                />
            </div>
        )
    }
    return <>{value}</>
}

export default observer(EditableLabel);