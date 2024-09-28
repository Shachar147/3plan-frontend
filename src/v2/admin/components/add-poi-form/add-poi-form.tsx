import React, { useContext, useState } from 'react';
import FileUploadApiService from "../../../services/file-upload-api-service";
import './add-poi-form.scss';
import Button, { ButtonFlavor } from "../../../../components/common/button/button";
import TranslateService from "../../../../services/translate-service";
import { eventStoreContext } from "../../../../stores/events-store";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Image } from "../../../components/point-of-interest/point-of-interest";
import {ReactModalRenderHelper} from "../../../../services/react-modal-service";
import {getDefaultCategories} from "../../../../utils/defaults";

function POIForm() {
    const eventStore = useContext(eventStoreContext);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
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
        images: [] as File[],
        imagePaths: [] as string[],
    });
    const [renderCounter, setRenderCounter] = useState(0);

    const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData({ ...formData, images: Array.from(e.target.files) });
        } else {
            setFormData({ ...formData, images: [] });
        }

        const fileName = e.target.files.length === 0
            ? TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')
            : e.target.files.length > 1
                ? TranslateService.translate(eventStore, 'X_FILES_CHOSEN', { X: e.target.files.length })
                : e.target.files[0].name;

        document.getElementById('file-name').innerText = fileName;
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
            if (Number(value) < 0){
                value = undefined;
                e.target.value = undefined;
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
            updatedFormData = { ...formData, [name]: value };
        }
        console.log("hereeee", updatedFormData);

        setFormData(updatedFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    {formData.imagePaths.map((image, index) => (
                        <div key={`item-image-${index}`}>
                            <Image image={image} alt={`Image #${index + 1}`} key={index} idx={`item--idx-${index}`} isSmall />
                        </div>
                    ))}
                </Carousel>
            </div>
        );
    }

    const fields = [
        { name: 'more_info', label: TranslateService.translate(eventStore, 'SOURCE_OR_LINK'), type: 'text', isLink: true },
        { name: 'name', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.NAME'), type: 'text' },
        { name: 'location', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.LOCATION'), type: 'text' },
        { name: 'description', label: TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION'), type: 'textarea' },
        { name: 'category', label: TranslateService.translate(eventStore, 'TEMPLATE.CATEGORY'), type: 'category-selector' },
        // { name: 'rate.quantity', label: 'Rate Quantity', type: 'number' },
        // { name: 'rate.rating', label: 'Rate Rating (Out of 5)', type: 'number', max: 5, min: -1 },
        { name: 'price', label: 'Price', type: 'number' },
        { name: 'currency', label: 'Currency', type: 'text' },
    ];

    return (
        <div className="add-poi-form-container">
            <div className="add-poi-form">
                {fields.map(({ name, label, type, max, isLink }) => (
                    <div key={name}>
                        <label>{label}:</label>
                        {type === 'textarea' ? (
                            <textarea name={name} value={formData[name]} onChange={handleChange} required />
                        ) :
                        type === 'category-selector' ? (
                            ReactModalRenderHelper.renderSelector(
                                eventStore,
                                'category',
                                {
                                    name,
                                    value: formData[name],
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
                        ) :
                        (
                            <input type={type} name={name} value={formData[name]} onChange={(e) => {
                                if (isLink && e.target.value.length > 0 && !(e.target.value.startsWith("http://") || e.target.value.startsWith("https://"))){
                                    return false;
                                }
                                handleChange(e);
                                return true;
                            }} max={max} required={type !== 'text'} />
                        )}
                    </div>
                ))}
                <div className="flex-column gap-4">
                    <label>{TranslateService.translate(eventStore, 'MODALS.IMAGES')}:</label>
                    {formData.imagePaths.length > 0 && renderPreview()}
                    <label className="file-label" htmlFor="file-upload">{TranslateService.translate(eventStore, 'CHOOSE_A_FILE')}</label>
                    <input type="file" id="file-upload" className="file-input" multiple onChange={handleImageUpload} />
                    <span id="file-name">{TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')}</span>
                </div>
                <Button flavor={ButtonFlavor.primary} onClick={handleSubmit} text={TranslateService.translate(eventStore, 'MODALS.SAVE')} />
            </div>
        </div>
    );
}

export default POIForm;