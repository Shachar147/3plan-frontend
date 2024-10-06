import React, {useContext, useEffect, useRef, useState} from 'react';
import FileUploadApiService from "../../../services/file-upload-api-service";
import './add-poi-form.scss';
import Button, { ButtonFlavor } from "../../../../components/common/button/button";
import TranslateService from "../../../../services/translate-service";
import { eventStoreContext } from "../../../../stores/events-store";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import ReactModalService, {ReactModalRenderHelper} from "../../../../services/react-modal-service";
import {getDefaultCategoriesExtended} from "../../../../utils/defaults";
import LocationInput from "../../../../components/inputs/location-input/location-input";
import {getDurationInMs} from "../../../../utils/time-utils";
import AdminPoiApiService from "../../services/add-poi-api-service";
import DestinationSelector, {fetchCitiesAndSetOptions} from "../../../components/destination-selector/destination-selector";
import {runInAction} from "mobx";
import ImageUpload from "./image-upload";
import CategorySelector from "./category-selector";


function POIForm() {
    const eventStore = useContext(eventStoreContext);

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

    const imageDataSource = useRef<'device'|'url'>('device');
    const initialImages = useRef<string[]>([]);
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

    const handleImageProcessing = async () => {
        const sanitizedPOIName = sanitizeFileName(formData.name);
        const fileUploadService = new FileUploadApiService();

        const promises = formData.images.map((file, index) => {
            const extension = file.name.split('.').pop();
            return fileUploadService.uploadPhoto(file, `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`);
        });

        const paths = await Promise.all(promises);
        // console.log("hereeee", { paths });
        setFormData({ ...formData, imagePaths: paths });
        return paths;
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                    if (formData.category == "CATEGORY.CITIES" || formData.category == "CATEGORY.ISLANDS" || formData.category.includes(TranslateService.translate(eventStore, 'CATEGORY.CITIES')) || formData.category.includes(TranslateService.translate(eventStore, 'CATEGORY.ISLANDS'))) {
                        formData.duration = "24:00"  // 1 day
                    }
                    else if (formData.category == "CATEGORY.HOTELS" || formData.category.includes(TranslateService.translate(eventStore, 'CATEGORY.HOTELS'))) {
                        formData.duration = "120:00"  // 5 days
                    } else if (formData.duration == "120:00" || formData.duration == "24:00") {
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

        if (name === 'more_info' && value?.includes("http")) {
            const response = await new AdminPoiApiService().extractInfo(value);
            if (response?.images && response.images?.length > 0 && response.images?.[0] != null) {
                imageDataSource.current = 'url';
                initialImages.current = response.images;
            }
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
        e.preventDefault();

        if (!validateBeforeSubmit()){
            return false;
        }

        try {
            const images = await handleImageProcessing(); // Process images first
            // console.log({images});

            const poiData = {
                ...formData,
                images,
            };


            const response = await new AdminPoiApiService().addPoi(poiData);

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
    };

    function renderInput({ type, name, max, isLink, placeholderKey}: { type: string, name: string, max?: number, isLink?: boolean, placeholderKey?: string }){
        if (type == 'textarea'){
            return (
                <textarea name={name} value={formData[name]} onChange={handleChange} placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined} required />
            )
        }

        if (type == 'image-upload') {
            return (
                <ImageUpload dataSource={imageDataSource.current} setRenderCounter={setRenderCounter} initialImages={initialImages.current} renderCounter={renderCounter} formData={formData} setFormData={setFormData} />
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
                        placeholderKey,
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
                <DestinationSelector selectedDestinations={formData.destination ? [formData.destination] : undefined} isSingle onChange={(destinations: string[]) => {
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
                    readOnly={false}
                    disabled={false}
                    // showOnMapLink={extra.readOnly}
                    // eventId={extra.eventId}
                />
            )
        }

        if (type === 'category-selector'){
            return (
                <div key={renderCounter}>
                    <CategorySelector name={name} value={formData[name]} placeholderKey={placeholderKey} onChange={(e) => handleChange(e)} />
                </div>
            )
        }

        return (
            <input type={type} name={name} placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined} value={formData[name]} onChange={(e) => {
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

    return (
        <div className="add-poi-form-container">
            <div className="add-poi-form">
                {fields.map((field) => (
                    <div key={field.name}>
                        {renderLabel(field.label, field.isRequired)}
                        {renderInput(field)}
                    </div>
                ))}
                <Button flavor={ButtonFlavor.primary} onClick={handleSubmit} text={TranslateService.translate(eventStore, 'MODALS.SAVE')} />
            </div>
        </div>
    );
}

export default POIForm;