import {observer} from "mobx-react";
import React, {useContext, useState} from "react";
import TextInput from "../../../components/inputs/text-input/text-input";
import TranslateService from "../../../services/translate-service";
import Button from "../../../components/common/button/button";
import {eventStoreContext} from "../../../stores/events-store";
import './editable-label.scss';

interface EditableLabelProps {
    name: string;
    value: string;
    isEditMode: boolean;
    onEditSave: (newValue: string) => void;
    placeholder?: string;
    overridePreview?: string;
    onLabelClick?: () => void;
    inputType?: 'text' | 'textarea' | 'number' | 'password';
    onCancelClick?: () => void;
}
function EditableLabel(props: EditableLabelProps){
    const eventStore = useContext(eventStoreContext);
    const { name, isEditMode } = props;
    const [value, setValue] = useState(props.value);

    if (isEditMode) {
        return (
            <div className="flex-row gap-3 align-items-center width-100-percents">
                {props.inputType == 'textarea' ? (
                        <textarea
                            name={name}
                            className="editable-label-textarea bright-scrollbar"
                            rows={4}
                            value={value}
                            onChange={(e) => {
                                eventStore.modalValues[name] = e.target.value;
                                setValue(e.target.value);
                            }}
                            placeholder={props.placeholder}
                        />
                ) :
                <TextInput
                    modalValueName={name}
                    type={props.inputType ?? "text"}
                    name="trip-name"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}
                    placeholder={props.placeholder}
                />}
                <Button
                    flavor="link"
                    text=""
                    icon="fa-save"
                    tooltip={TranslateService.translate(eventStore, 'MODALS.SAVE')}
                    onClick={() => {
                        props.onEditSave(value);
                    }}
                />
                {props.onCancelClick && <Button
                    flavor="link"
                    text=""
                    icon="fa-times"
                    tooltip={TranslateService.translate(eventStore, 'MODALS.CANCEL')}
                    onClick={() => {
                        props.onCancelClick();
                    }}
                />}
            </div>
        )
    }
    return <span className="white-space-pre-line" onClick={() => props.onLabelClick?.()}>{props.overridePreview ?? value}</span>
}

export default observer(EditableLabel);