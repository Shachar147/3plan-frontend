import React, { useContext, useState } from 'react';
import FileUploadApiService from "../../../services/file-upload-api-service";
import './add-poi-form.scss';
import Button, { ButtonFlavor } from "../../../../components/common/button/button";
import TranslateService from "../../../../services/translate-service";
import { eventStoreContext } from "../../../../stores/events-store";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Image } from "../../../components/point-of-interest/point-of-interest";
import ReactModalService, {ReactModalRenderHelper} from "../../../../services/react-modal-service";
import {getDefaultCategories} from "../../../../utils/defaults";
import LocationInput from "../../../../components/inputs/location-input/location-input";
import {getDurationInMs} from "../../../../utils/time-utils";

function POIForm() {
    const eventStore = useContext(eventStoreContext);

    const fields = [
        { name: 'more_info', label: TranslateService.translate(eventStore, 'SOURCE_OR_LINK'), type: 'text', isLink: true, placeholderKey: 'LINKS_ONLY' },
        { name: 'name', label: TranslateService.translate(eventStore, 'EVENT_NAME'), type: 'text', isRequired: true },
        { name: 'location', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.LOCATION'), type: 'location-selector', isRequired: true },
        { name: 'duration', label: TranslateService.translate(eventStore, 'MODALS.DURATION'), type: 'text', isRequired: true},
        { name: 'images', label: TranslateService.translate(eventStore, 'MODALS.IMAGES'), type: 'image-upload', isRequired: true},
        { name: 'description', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION'), type: 'textarea' },
        { name: 'category', label: TranslateService.translate(eventStore, 'TEMPLATE.CATEGORY'), type: 'category-selector' },
        // { name: 'rate.quantity', label: 'Rate Quantity', type: 'number' },
        // { name: 'rate.rating', label: 'Rate Rating (Out of 5)', type: 'number', max: 5, min: -1 },
        { name: 'price', label: TranslateService.translate(eventStore, 'MODALS.PRICE'), type: 'number' },
        { name: 'currency', label: TranslateService.translate(eventStore, 'MODALS.CURRENCY'), type: 'currency-selector' },
    ];

    const [previewUrls, setPreviewUrls] = useState([]);
    const [formData, setFormData] = useState({
        name: undefined, // required
        location: undefined, // required
        duration: '01:00',
        description: '',
        source: 'System',
        more_info: '',
        category: 'CATEGORY.GENERAL',
        rate: {
            rating: 5,
            quantity: 999999
        },
        price: undefined,
        currency: '',
        images: [] as File[], // required
        imagePaths: [] as string[],
        isVerified: true,
        isSystemRecommendation: true,
    });
    const [renderCounter, setRenderCounter] = useState(0);

    const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    };

    const handleImageRemoval = () => {
        setFormData({ ...formData, images: [] });
        setPreviewUrls([]);
        const fileName = TranslateService.translate(eventStore, 'NO_FILE_CHOSEN');
        document.getElementById('file-name').innerText = fileName;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const uploadedFiles = Array.from(e.target.files);

            setFormData({ ...formData, images: uploadedFiles });

            // Create object URLs for the uploaded files
            const urls = uploadedFiles.map(file => URL.createObjectURL(file));
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
            return fileUploadService.uploadPhoto(file, `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`)
                .then(() => `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`);
        });

        const paths = await Promise.all(promises);
        setFormData({ ...formData, imagePaths: paths });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        if (name == 'price' || name == 'rate'){
            if (value == undefined || Number(value) < 0){
                value = undefined;
                e.target.value = undefined;
            }
        }
        if (name == 'location' && (!value?.latitude || !value?.longitude)) {
            value = undefined;
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

        console.log("hereee", updatedFormData);
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
        } else {
            alert(getDurationInMs(formData['duration']));
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
            await handleImageProcessing(); // Process images first

            const poiData = {
                ...formData,
                images: formData.imagePaths,
            };

            const response = await fetch('http://localhost:3001/api/pois', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(poiData),
            });

            if (response.ok) {
                alert('POI added successfully');
            } else {
                alert('Failed to add POI');
            }
        } catch (error) {
            console.error('Error uploading POI:', error);
        }
    };

    function renderPreview() {
        return (
            <div className="carousel-wrapper margin-bottom-5" key={renderCounter}>
                <Carousel key={renderCounter} showThumbs={false} showIndicators={false} infiniteLoop={true}>
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
                <textarea name={name} value={formData[name]} onChange={handleChange} placeholder={placeholderKey ? TranslateService.translate(eventStore, placeholderKey) : undefined} required />
            )
        }

        if (type == 'image-upload') {
            return (
                <div className="flex-column gap-4">
                    {/*{formData.imagePaths.length > 0 && renderPreview()}*/}
                    {previewUrls.length > 0 && renderPreview()}
                    <div className="flex-row gap-8">
                        <label className="file-label" htmlFor="file-upload">{TranslateService.translate(eventStore, previewUrls.length > 0 ? 'CHANGE_FILES' : 'CHOOSE_A_FILE')}</label>
                        {previewUrls.length > 0 && <label className="file-label remove" onClick={handleImageRemoval}>{TranslateService.translate(eventStore, 'REMOVE_FILES')}</label>}
                    </div>
                    <input type="file" id="file-upload" className="file-input" multiple onChange={handleImageUpload} />
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
                }, eventStore);
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
                ReactModalRenderHelper.renderSelector(
                    eventStore,
                    'category',
                    {
                        name,
                        value: formData[name],
                        placeholderKey,
                        // @ts-ignore
                        onChange: (data) => handleChange({
                            target: {
                                name,
                                value: data ? getDefaultCategories(eventStore).find((c) => c.id == data.value)?.titleKey : 'CATEGORY.GENERAL'
                            }
                        })
                    },
                    // { placeholderKey: 'SELECT_CATEGORY_PLACEHOLDER' },
                    // undefined,
                    getDefaultCategories(eventStore).sort((a, b) => a.id - b.id)
                        .map((x, index) => ({
                            value: x.id.toString(),
                            label: x.icon ? `${x.icon} ${x.title}` : x.title,
                        }))
                )
            );
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