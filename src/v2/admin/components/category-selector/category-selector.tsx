import React, {useContext, useEffect} from "react";
import {eventStoreContext} from "../../../../stores/events-store";
import {getDefaultCategoriesExtended} from "../../../../utils/defaults";
import TranslateService from "../../../../services/translate-service";
import {runInAction} from "mobx";
import SelectInput from "../../../../components/inputs/select-input/select-input";
import {observer} from "mobx-react";

function CategorySelector(props: {
    name: string,
    value: string,
    placeholderKey: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    isDisabled?: boolean
}){
    const eventStore = useContext(eventStoreContext);

    const allOptions = getDefaultCategoriesExtended(eventStore);
    const selectOptions = allOptions.sort((a, b) => a.id - b.id)
        .map((x, index) => ({
            value: x.id.toString(),
            label: x.icon ? `${x.icon} ${x.title}` : x.title,
        }));

    // const _value = useMemo(() => {
    //     return selectOptions.find((o) => o.label.includes(TranslateService.translate(eventStore, props.value)))?.value;
    // }, [props.value])

    // alert("before:" + props.value);
    const foundCategory = selectOptions.find((o) => o.label.includes(TranslateService.translate(eventStore, props.value)));
    const _value = foundCategory?.value;
    // alert("after:" + _value);

    useEffect(() => {
        runInAction(() => {
            eventStore.modalValues['category'] = foundCategory;
        })
    }, [_value])

    return (
        <SelectInput
            ref={eventStore.modalValuesRefs['category']}
            readOnly={props.isDisabled}
            name={"category"}
            options={selectOptions}
            // value={extra.value != undefined ? extra.options.find((o) => o.value == extra.value) : undefined}
            value={props.value}
            placeholderKey={props.placeholderKey}
            modalValueName={'category'}
            // maxMenuHeight={extra.maxMenuHeight}
            // removeDefaultClass={extra.removeDefaultClass}
            onChange={(data) => props.onChange({
                target: {
                    name: props.name,
                    value: data ? allOptions.find((c) => c.id == data.value)?.titleKey : undefined // 'CATEGORY.GENERAL'
                }
            })}
            // onClear={extra.onClear}
            // isClearable={extra.isClearable ?? true}
            // wrapperClassName={wrapperClassName}
        />
    )
}

export default observer(CategorySelector);