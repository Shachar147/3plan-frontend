import React, {useContext, useEffect, useRef, useState} from "react";
import {eventStoreContext} from "../../../../stores/events-store";
import {Carousel} from "react-responsive-carousel";
import {Image} from "../../../components/point-of-interest/point-of-interest";
import TranslateService from "../../../../services/translate-service";
import {observer} from "mobx-react";
import ToggleButton from "../../../../components/toggle-button/toggle-button";
import {getClasses} from "../../../../utils/utils";

interface ImageUploadProps {
    renderCounter: number;
    formData: Record<string, any>;
    setFormData: (formData: Record<string, any>) => void;
    setRenderCounter: (counter: number) => void;
    dataSource?: 'url' | 'device';
    initialImages?: string[];
}
function ImageUpload(props: ImageUploadProps){
    const eventStore = useContext(eventStoreContext);
    const isChangedByProps = useRef(false);
    const currentIdx = useRef(0);
    let [fileNames, setFileNames] = useState([]);
    const [dataSource, setDataSource] = useState<'url'|'device'>(props.dataSource ?? 'device');
    const [previewUrls, setPreviewUrls] = useState([]);

    const { renderCounter, setFormData, formData, setRenderCounter } = props;

    useEffect(() => {

        if (props.initialImages?.length) {
            const images = props.initialImages;
            setPreviewUrls(images);

            const names = [];
            for (let i = 1; i <= images.length; i++) {
                names.push(`file ${i}`);
            }

            setFileNames(names);
            setFormData({...formData, images});
            currentIdx.current = 0
            setRenderCounter(renderCounter + 1);
        }

    }, [props.initialImages])

    useEffect(() => {
        isChangedByProps.current = true;
        setDataSource(props.dataSource);
    }, [props.dataSource])

    useEffect(() => {
        if (!isChangedByProps.current) {
            handleImageRemoval();
        }
    }, [dataSource])

    function renderPreview() {
        return (
            <div className="carousel-wrapper margin-bottom-5" key={renderCounter}>
                <Carousel key={renderCounter} showThumbs={false} showIndicators={false} infiniteLoop={true} onChange={(idx) => onViewIdxChange(idx)}>
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

    const onViewIdxChange = (idx) => { currentIdx.current = idx; };

    const handleImageRemoval = (idx: number = undefined) => {
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
        onViewIdxChange(0);
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
        if (e.target.files) {
            const uploadedFiles = Array.from(e.target.files);

            const newImages = [
                ...formData.images,
                ...uploadedFiles
            ]

            setFormData({ ...formData, images: newImages });

            // Create object URLs for the uploaded files
            const urls = uploadedFiles.map(file => URL.createObjectURL(file));
            fileNames = [
                ...fileNames,
                ...uploadedFiles.map((f) => f.name)
            ]
            setFileNames(fileNames);
            setPreviewUrls([
                ...previewUrls,
                ...urls
            ]);

        } else {
            handleImageRemoval();
        }

        updateChosenFileText();

        // const fileName = e.target.files.length === 0
        //     ? TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')
        //     : e.target.files.length > 1
        //         ? TranslateService.translate(eventStore, 'X_FILES_CHOSEN', { X: e.target.files.length })
        //         : e.target.files[0].name;
        //
        // document.getElementById('file-name').innerText = fileName;

        setRenderCounter(renderCounter + 1);
    };

    function renderDataSourceSelector() {
        const options = [
            {
                key: 'device',
                name: TranslateService.translate(eventStore, 'UPLOAD_FROM_YOUR_DEVICE'),
            },
            {
                key: 'url',
                name: TranslateService.translate(eventStore, 'UPLOAD_FROM_URL'),
            },
        ];

        return (
            <div className="margin-bottom-10">
                <ToggleButton value={dataSource} onChange={(d: 'url' | 'device') => {
                    isChangedByProps.current = false;
                    setDataSource(d);
                }} options={options} customStyle="white" />
            </div>
        );
    }

    function renderFileUpload(){
        if (dataSource === 'device') {
            return (
                <input type="file" id="file-upload" className="file-input" multiple onChange={handleImageUpload} />
            )
        } else {
            return (
                <textarea placeholder={TranslateService.translate(eventStore, 'MODALS.IMAGES_PLACEHOLDER')} value={previewUrls.join("\n")} onChange={(e) => {
                    const images = e.target.value.split('\n');
                    setPreviewUrls(images);

                    const names = [];
                    for (let i = 1; i<= images.length; i++){
                        names.push(`file ${i}`);
                    }
                    setFileNames(names);
                    setFormData({ ...formData, images });
                    currentIdx.current = 0
                    setRenderCounter(renderCounter + 1);
                }} />
            )
        }
    }

    return (
        <div className="flex-column gap-4">
            {renderDataSourceSelector()}
            {previewUrls.length > 0 && renderPreview()}
            {dataSource === 'device' && <div className="flex-row gap-8">
                <label className="file-label" htmlFor="file-upload">{TranslateService.translate(eventStore, previewUrls.length > 0 ? 'ADD_FILES' : 'CHOOSE_A_FILE')}</label>
                {previewUrls.length > 0 && <label className="file-label remove" onClick={() => handleImageRemoval(undefined)}>{TranslateService.translate(eventStore, 'REMOVE_FILES')}</label>}
                {previewUrls.length > 0 && <label className="file-label remove" onClick={() => handleImageRemoval(currentIdx.current)}>{TranslateService.translate(eventStore, 'REMOVE_FILE')}</label>}
            </div>}
            {renderFileUpload()}
            <span id="file-name" className={getClasses(dataSource !== 'device' && 'display-none')}>{TranslateService.translate(eventStore, 'NO_FILE_CHOSEN')}</span>
        </div>
    )
}

export default observer(ImageUpload);