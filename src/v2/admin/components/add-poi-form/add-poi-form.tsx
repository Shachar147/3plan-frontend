import React, {useContext, useEffect, useRef, useState} from 'react';
import FileUploadApiService from "../../../services/file-upload-api-service";
import './add-poi-form.scss';
import Button, { ButtonFlavor } from "../../../../components/common/button/button";
import TranslateService from "../../../../services/translate-service";
import { eventStoreContext } from "../../../../stores/events-store";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Image } from "../../../components/point-of-interest/point-of-interest";
import ReactModalService, {ReactModalRenderHelper} from "../../../../services/react-modal-service";
import {getDefaultCategoriesExtended} from "../../../../utils/defaults";
import LocationInput from "../../../../components/inputs/location-input/location-input";
import {getDurationInMs} from "../../../../utils/time-utils";
import AdminAddPoiApiService from "../../services/add-poi-api-service";
import DestinationSelector, {fetchCitiesAndSetOptions} from "../../../components/destination-selector/destination-selector";
import {runInAction} from "mobx";
import SelectInput from "../../../../components/inputs/select-input/select-input";
import {getClasses} from "../../../../utils/utils";

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

function POIForm() {
    const eventStore = useContext(eventStoreContext);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPictures, setIsUploadingPictures] = useState(false);
    const uploadedPhotos = useRef<number>(0);
    const [savingText, setSavingText] = useState<string | undefined>(undefined);

    const fields = [
        { name: 'location', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.LOCATION'), type: 'location-selector', isRequired: true },
        { name: 'more_info', label: TranslateService.translate(eventStore, 'SOURCE_OR_LINK'), type: 'text', isLink: true, placeholderKey: 'LINKS_ONLY', isRequired: true },
        { name: 'name', label: TranslateService.translate(eventStore, 'EVENT_NAME'), type: 'text', isRequired: true },
        { name: 'destination', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESTINATION'), type: 'destination-selector', isRequired: true },
        { name: 'duration', label: TranslateService.translate(eventStore, 'MODALS.DURATION'), type: 'text', isRequired: true},
        { name: 'images', label: TranslateService.translate(eventStore, 'MODALS.IMAGES'), type: 'image-upload', isRequired: true},
        { name: 'description', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION'), type: 'textarea', isRequired: true },
        { name: 'category', label: TranslateService.translate(eventStore, 'TEMPLATE.CATEGORY'), type: 'category-selector' },
        // { name: 'rate.quantity', label: 'Rate Quantity', type: 'number' },
        // { name: 'rate.rating', label: 'Rate Rating (Out of 5)', type: 'number', max: 5, min: -1 },
        { name: 'price', label: TranslateService.translate(eventStore, 'MODALS.PRICE'), type: 'number' },
        { name: 'currency', label: TranslateService.translate(eventStore, 'MODALS.CURRENCY'), type: 'currency-selector' },
    ];

    const [previewUrls, setPreviewUrls] = useState([]);
    const [fileNames, setFileNames] = useState([]);
    const currentIdx = useRef(0);
    const [formData, setFormData] = useState({
        name: undefined, // required
        location: undefined, // required
        duration: '01:00',
        description: undefined,
        source: 'System',
        more_info: undefined,
        category: 'CATEGORY.GENERAL',
        rate: {
            rating: 5
        },
        price: undefined,
        currency: undefined,
        images: [] as File[], // required
        imagePaths: [] as string[],
        isVerified: true,
        isSystemRecommendation: true,
        destination: undefined,
    });
    const [renderCounter, setRenderCounter] = useState(0);

    useEffect(() => {
        // so the auto-find-category once Location changes will work
        const categories = getDefaultCategoriesExtended(eventStore);
        runInAction(() => {
            eventStore.categories = categories;
        })

    }, [])

    const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    };

    const handleImageRemoval = (idx: number = undefined) => {
        if (isSaving) {
            return;
        }

        if (idx != undefined) {
            formData.images.splice(idx, 1);
            setFormData({ ...formData });
            previewUrls.splice(idx, 1);
            setPreviewUrls(previewUrls);
            fileNames.splice(idx, 1);
            setFileNames(fileNames);

        } else {
            setFormData({ ...formData, images: [] });
            setPreviewUrls([]);
            fileNames.splice(0,fileNames.length);
            setFileNames([]);
        }

        updateChosenFileText();

        setRenderCounter(renderCounter + 1);
        currentIdx.current = 0;
    }

    const updateChosenFileText = () => {
        const fileName = fileNames.length === 0
            ? TranslateService.translate(eventStore, 'NO_FILE_CHOSEN') :
            fileNames.length > 1
                ? TranslateService.translate(eventStore, 'X_FILES_CHOSEN', { X: fileNames.length }) :
                fileNames[0];

        document.getElementById('file-name').innerText = fileName;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isSaving) {
            return;
        }
        if (e.target.files) {
            const uploadedFiles = Array.from(e.target.files);

            setFormData({ ...formData, images: uploadedFiles });

            // Create object URLs for the uploaded files
            const urls = uploadedFiles.map(file => URL.createObjectURL(file));
            setFileNames(uploadedFiles.map((f) => f.name));
            setPreviewUrls(urls);

        } else {
            handleImageRemoval();
        }

        const fileName = e.target.files.length === 0
            ? TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')
            : e.target.files.length > 1
                ? TranslateService.translate(eventStore, 'X_FILES_CHOSEN', { X: e.target.files.length })
                : e.target.files[0].name;

        document.getElementById('file-name').innerText = fileName;

        setRenderCounter(renderCounter + 1);
    };

    const handleImageProcessing = async () => {
        const sanitizedPOIName = sanitizeFileName(formData.name);
        const fileUploadService = new FileUploadApiService();

        const promises = formData.images.map((file, index) => {
            const extension = file.name.split('.').pop();
            const localPrefix = window.location.href.includes("localhost") ? "local-" : "";
            return fileUploadService.uploadPhoto(file, `/images/pois/${localPrefix}${sanitizedPOIName}-${index + 1}.${extension}`)
                .then(photo => {
                    // Increment uploadedPhotos.current
                    uploadedPhotos.current += 1;
                    return photo; // Return the photo as the result
                });
        });

        const paths = await Promise.all(promises);

        // console.log("hereeee", { paths });
        setFormData({ ...formData, imagePaths: paths });
        return paths;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        if (name == 'price' || name == 'rate'){
            if (value == undefined || Number(value) < 0){
                value = undefined;
                e.target.value = undefined;
            }
        }
        if (name == 'location') {
            if (!value?.latitude || !value?.longitude) {
                value = undefined;
            } else {
                if (!formData.more_info) {
                    // if (!formData.name?.length) {
                    formData.name = eventStore.modalValues['name'];
                    // }
                    // if (!formData.destination) {
                    formData.destination = fetchCitiesAndSetOptions().filter((x) => x.type == 'country').find((x) =>
                        (value.address ?? "").toLowerCase().includes(x.value.toLowerCase())
                    )?.value
                    // }

                    // if (!formData.more_info) {
                    // formData.more_info = eventStore.modalValues['more-info'];
                    // }

                    const foundCategory = eventStore.modalValues['category']?.label && !eventStore.modalValues['category']?.label.includes(TranslateService.translate(eventStore, 'CATEGORY.GENERAL'));
                    if (foundCategory) {
                        formData.category = eventStore.modalValues['category']?.label;
                        // renderCounter += 1;
                        // alert("found Category" + formData.category);
                    } else {
                        const cities = fetchCitiesAndSetOptions().filter((x) => x.type == 'city');
                        const islands = fetchCitiesAndSetOptions().filter((x) => x.type == 'island');

                        if (cities.find((c) => c.value.toLowerCase() == formData.name.toLowerCase())) {
                            // alert("city!");
                            formData.category = "CATEGORY.CITIES";
                            // renderCounter += 1
                        }
                        else if (islands.find((c) => c.value.toLowerCase() == formData.name.toLowerCase())) {
                            // alert("island!");
                            formData.category = "CATEGORY.ISLANDS";
                            // renderCounter += 1
                        }
                    }
                    if (formData.category == "CATEGORY.HOTELS" || formData.category.includes(TranslateService.translate(eventStore, 'CATEGORY.HOTELS'))) {
                        formData.duration = "120:00"  // 5 days
                    } else if (formData.duration == "120:00") {
                        formData.duration = "01:00"; // reset back to default
                    }

                    /*
                    const images = eventStore.modalValues['images']?.split("\n") ?? [];
                    formData.images = images
                    setPreviewUrls(images);
                    */

                    if (!formData.description) {
                        // formData.description = eventStore.modalValues['description'];
                    }
                }
            }
        }
        let updatedFormData;
        
        if (name.startsWith('rate')) {
            const rateField = name.split('.')[1]; // e.g., 'quantity' or 'rating'
            if (Number(value) < 0){
                updatedFormData ={
                    ...formData,
                    rate: undefined
                };
            } else {
                updatedFormData = {
                    ...formData, rate: {
                        quantity: 999999,
                        [rateField]: Number(value)
                    }
                };
            }
        } else {
            if (value == "") {
                value = undefined;
            }
            updatedFormData = { ...formData, [name]: value };
        }

        // console.log("hereee", updatedFormData);
        setFormData(updatedFormData);
    };

    function validateBeforeSubmit(){
        let isOk = true;
        for (let i = 0; i < fields.length; i++){
            const field = fields[i];

            const hasValues = field.name == 'location' ? !!formData[field.name] : (formData[field.name]?.length ?? 0) > 0;

            if (field.isRequired && !hasValues){
                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.ERROR.TITLE',
                    'PLEASE_FILL_IN_X_BEFORE_YOU_PROCEED',
                    'error',
                    {
                        X: field.label
                    }
                );
                isOk = false;
                break;
            }
        }

        if (formData['duration'].split(':').length != 2 || !getDurationInMs(formData['duration'])) {
            ReactModalService.internal.alertMessage(
                eventStore,
                'MODALS.ERROR.TITLE',
                'DURATION_IS_INVALID',
                'error',
            );
            isOk = false;
        }

        if (formData['price'] && !formData['currency']) {
            ReactModalService.internal.alertMessage(
                eventStore,
                'MODALS.ERROR.TITLE',
                'PLEASE_FILL_IN_X_BEFORE_YOU_PROCEED',
                'error',
                {
                    X: fields.find((f) => f.name == 'currency')!.label
                }
            );
            isOk = false;
        }

        // remove currency if no price was set.
        if (!formData['price']){
            formData['currency'] = undefined;
        }

        return isOk;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        setIsSaving(true);
        uploadedPhotos.current = 0;

        e.preventDefault();

        if (!validateBeforeSubmit()){
            return false;
        }

        try {
            setIsUploadingPictures(true);

            const interval = setInterval(() => {
                setSavingText(getSavingText())
            }, 200);

            const images = await handleImageProcessing(); // Process images first
            setIsUploadingPictures(false);

            setTimeout(() => {
                setSavingText(getSavingText());
            }, 1000);

            // console.log({images});
            clearInterval(interval);

            const poiData = {
                ...formData,
                images,
            };


            const response = await new AdminAddPoiApiService().addPoi(poiData);
            setIsSaving(false);

            if (response.totalUpdated) {
                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.CREATE.TITLE',
                    'POI_UPDATED_SUCCESSFULLY',
                    'success'
                );
            } else if (response.totalAdded) {
                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.CREATE.TITLE',
                    'POI_ADDED_SUCCESSFULLY',
                    'success'
                );
            } else {
                ReactModalService.internal.alertMessage(
                    eventStore,
                    'MODALS.ERROR.TITLE',
                    'FAILED_TO_ADD_POI',
                    'error'
                );
            }
        } catch (error) {
            console.error('Error uploading POI:', error);
            ReactModalService.internal.openOopsErrorModal(eventStore);
        }
        setIsSaving(false);
    };

    function renderPreview() {
        return (
            <div className="carousel-wrapper margin-bottom-5" key={renderCounter}>
                <Carousel key={renderCounter} showThumbs={false} showIndicators={false} infiniteLoop={true} onChange={(idx) => {
                    currentIdx.current = idx;
                }}>
                    {/*{formData.imagePaths.map((image, index) => (*/}
                    {previewUrls.map((image, index) => (
                        <div key={`item-image-${index}`}>
                            <Image image={image} alt={`Image #${index + 1}`} key={index} idx={`item--idx-${index}`} isSmall />
                        </div>
                    ))}
                </Carousel>
            </div>
        );
    }

    function renderInput({ type, name, max, isLink, placeholderKey}: { type: string, name: string, max?: number, isLink?: boolean, placeholderKey?: string }){
        if (type == 'textarea'){
            return (
                <textarea disabled={isSaving} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined} required />
            )
        }

        if (type == 'image-upload') {
            return (
                <div className="flex-column gap-4">
                    {/*{formData.imagePaths.length > 0 && renderPreview()}*/}
                    {previewUrls.length > 0 && renderPreview()}
                    <div className="flex-row gap-8">
                        <label className={getClasses("file-label", isSaving && 'disabled')} htmlFor="file-upload">{TranslateService.translate(eventStore, previewUrls.length > 0 ? 'CHANGE_FILES' : 'CHOOSE_A_FILE')}</label>
                        {previewUrls.length > 0 && <label className="file-label remove" onClick={() => handleImageRemoval(undefined)}>{TranslateService.translate(eventStore, 'REMOVE_FILES')}</label>}
                        {previewUrls.length > 0 && <label className="file-label remove" onClick={() => handleImageRemoval(currentIdx.current)}>{TranslateService.translate(eventStore, 'REMOVE_FILE')}</label>}
                    </div>
                    <input disabled={isSaving} type="file" id="file-upload" className="file-input" multiple onChange={handleImageUpload} />
                    <span id="file-name">{TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')}</span>
                </div>
            )
        }

        if (type == 'currency-selector') {
            return (
                ReactModalRenderHelper.renderCurrencySelector(
                    eventStore,
                    'currency',
                    {
                        name,
                        value: formData[name],
                        readOnly: isSaving,
                        // @ts-ignore
                        onChange: (data) => handleChange({
                            target: {
                                name,
                                value: data?.value?.toUpperCase()
                            }
                        }),
                        placeholderKey: 'MODALS.CURRENCY',
                    },
                    eventStore.modalValuesRefs['currency']
                )
            );
        }

        if (type == 'destination-selector') {
            return (
                <DestinationSelector isDisabled={isSaving} selectedDestinations={formData.destination ? [formData.destination] : undefined} isSingle onChange={(destinations: string[]) => {
                    handleChange({
                        target: {
                            name,
                            value: destinations?.[0]
                        }
                    })
                }} />
            )
        }

        if (type == 'location-selector') {
            const initLocation = () => {
                // @ts-ignore
                window.initLocationPicker('location-input', 'selectedLocation', () => {
                    handleChange({
                        target:{
                            name,
                            value: window['selectedLocation']
                        }
                    })
                }, eventStore, true);
            };

            const setManualLocation = () => {
                // @ts-ignore
                window.setManualLocation('location-input', 'selectedLocation', eventStore);
                handleChange({
                    target:{
                        name,
                        value: window['selectedLocation']
                    }
                })
            };

            return (
                <LocationInput
                    // id={extra.id}
                    className="location-input"
                    ref={eventStore.modalValuesRefs['location']}
                    modalValueName="location"
                    onClick={initLocation}
                    onKeyUp={setManualLocation}
                    placeholder={TranslateService.translate(eventStore, placeholderKey ?? 'MODALS.LOCATION.PLACEHOLDER')}
                    // placeholderKey={extra.placeholderKey}
                    autoComplete="off"
                    readOnly={isSaving}
                    disabled={isSaving}
                    // showOnMapLink={extra.readOnly}
                    // eventId={extra.eventId}
                />
            )
        }

        if (type === 'category-selector'){
            return (
                <div key={renderCounter}>
                    <CategorySelector isDisabled={isSaving} name={name} value={formData[name]} placeholderKey={placeholderKey} onChange={(e) => handleChange(e)} />
                </div>
            )
        }

        return (
            <input disabled={isSaving} readOnly={isSaving} type={type} name={name} placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined} value={formData[name]} onChange={(e) => {
                if (isLink && e.target.value.length > 0 && !(e.target.value.startsWith("http://") || e.target.value.startsWith("https://"))){
                    return false;
                }
                handleChange(e);
                return true;
            }} max={max} required={type !== 'text'} />
        )
    }

    function renderLabel(label: string, isRequired?: boolean) {
        return (
            <label>{label}:{isRequired && <span className="red-color margin-inline-start-3">*</span>}</label>
        )
    }

    function getSavingText(){
        if (!isSaving) {
            return null;
        }
        if (isUploadingPictures) {
            return (
                TranslateService.translate(eventStore, 'UPLOADING_PHOTOS_X_OF_Y', {
                    X: uploadedPhotos.current + 1,
                    Y: formData.images.length
                })
            )
        }
        return TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING');
    }

    return (
        <div className="add-poi-form-container">
            <div className="add-poi-form">
                {fields.map((field) => (
                    <div key={field.name}>
                        {renderLabel(field.label, field.isRequired)}
                        {renderInput(field)}
                    </div>
                ))}
                {savingText != undefined ? <span>{savingText}</span> : undefined}
                <Button isLoading={isSaving} tooltip={isSaving ? TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING') : undefined} flavor={ButtonFlavor.primary} onClick={handleSubmit} text={TranslateService.translate(eventStore, isSaving ? 'SAVING' : 'MODALS.SAVE')} />
            </div>
        </div>
    );
}

export default POIForm;