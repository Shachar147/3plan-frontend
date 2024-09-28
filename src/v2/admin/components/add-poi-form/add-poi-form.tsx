import React, {useContext, useState} from 'react';
import FileUploadApiService from "../../../services/file-upload-api-service";
import './add-poi-form.scss';
import Button, {ButtonFlavor} from "../../../../components/common/button/button";
import TranslateService from "../../../../services/translate-service";
import {eventStoreContext} from "../../../../stores/events-store";
import {Carousel} from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import {Image} from "../../../components/point-of-interest/point-of-interest";

function POIForm() {
    const eventStore = useContext(eventStoreContext);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePaths, setImagePaths] = useState<string[]>([]);
    const [renderCounter, setRenderCounter] = useState(0);

    // Sanitize POI name for file naming
    const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        } else {
            setImages([]);
        }

        const fileName = e.target.files.length == 0 ? TranslateService.translate(eventStore, 'NO_FILE_CHOSEN') : e.target.files.length > 1 ? TranslateService.translate(
            eventStore, 'X_FILES_CHOSEN', { X: e.target.files.length }
        ) : e.target.files[0].name;
        document.getElementById('file-name').innerText = fileName;
    };

    const handleImageProcessing = async () => {
        const sanitizedPOIName = sanitizeFileName(name);

        const fileUploadService = new FileUploadApiService();

        const promises = images.map((file, index) => {
            const extension = file.name.split('.').pop();
            return fileUploadService.uploadPhoto(file, `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`).finally((uploadedFile) => {
                return `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`;
            })
            // return `/images/pois/${sanitizedPOIName}-${index + 1}.${extension}`;
        });

        const paths = await Promise.all(promises);

        setImagePaths(paths);
    };

    async function handleSubmit(e) {
        try {
            e.preventDefault();
            e.stopPropagation();

            console.log("here");

            await handleImageProcessing(); // Set the image paths based on the POI name

            setRenderCounter(renderCounter + 1);

            console.log("there");

            // const poiData = {
            //     name,
            //     location,
            //     description,
            //     images: imagePaths,
            // };
            //
            // try {
            //     const response = await fetch('http://localhost:3001/api/pois', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify(poiData),
            //     });
            //
            //     if (response.ok) {
            //         alert('POI added successfully');
            //     } else {
            //         alert('Failed to add POI');
            //     }
            // } catch (error) {
            //     console.error('Error uploading POI:', error);
            // }
        } catch {

        }

        return false;
    }

    function renderPreview() {
        // @ts-ignore
        return (
            <div className="carousel-wrapper margin-bottom-5">
                <Carousel key={renderCounter} showThumbs={false} showIndicators={false} infiniteLoop={true}>
                    {imagePaths?.map((image, index) => (
                        <div key={`item-image-${index}`}>
                            <Image image={image} alt={`Image #${Number(index + 1)}`} key={index} idx={`item--idx-${index}`} isSmall />
                        </div>
                    ))}
                </Carousel>
            </div>
        )
    }

    return (
        <div className="add-poi-form-container">
            <div className="add-poi-form">
                <div>
                    <label>{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.NAME')}:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.LOCATION')}:</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION')}:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="flex-column gap-4">
                    <label>{TranslateService.translate(eventStore, 'MODALS.IMAGES')}:</label>
                    {imagePaths.length > 0 && renderPreview()}
                    <label className="file-label" htmlFor="file-upload">{TranslateService.translate(eventStore, 'CHOOSE_A_FILE')}</label>
                    <input type="file" id="file-upload" className="file-input" multiple onChange={handleImageUpload}/>
                    <span id="file-name">{TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')}</span>
                </div>
                <Button flavor={ButtonFlavor.primary} onClick={handleSubmit} text={TranslateService.translate(eventStore, 'MODALS.SAVE')} />
            </div>
        </div>
    );
}

export default POIForm;