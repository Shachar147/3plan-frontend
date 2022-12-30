import React, {useEffect, useMemo, useState} from 'react';
import {observer} from "mobx-react";
import {EventStore} from "../../../../stores/events-store";
import placesData from './data';
import SelectInput, {SelectInputOption} from "../../../../components/inputs/select-input/select-input";
import './place-tinder.scss';
import TranslateService from "../../../../services/translate-service";
// @ts-ignore
import ImageGallery from 'react-image-gallery';
import '../../../../stylesheets/react-image-gallery.scss';

interface PlacesTinderProps {
    eventStore: EventStore;
}

function PlacesTinder({ eventStore }: PlacesTinderProps){

    function shuffle(array: any[]) {
        let currentIndex = array.length,  randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    const [currIdx, setCurrIdx] = useState(0);
    const [destination, setDestination] = useState<string|null>(null)
    const placesDataMap: Record<string, any[]> = useMemo(() => placesData, []);
    const [placesList, setPlacesList] = useState<any[]>([]);

    useEffect(() => {

        if (destination != null) {
            const arr = shuffle(placesDataMap[destination]);
            setPlacesList(arr);

            document.getElementsByClassName("places-tinder-modal")[0].className += ' selected-destination';
        }

    }, [destination])

    let currentPlace;
    if (destination && placesList.length > 0) {
        currentPlace = placesList[currIdx];
    }

    function formatDescription(description: string) {
        // replace \n with brs
        description = description.replace(/\n/g, "<br>");

        // add links
        description = description.replace(/(http:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>").replace(/(https:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>");

        // console.log("after", description);

        return description;
    }

    return (
        <div className={"places-tinder flex-column gap-10 justify-content-center"}>
            <SelectInput
                options={Object.keys(placesDataMap).map((x: string) => ({ "value": x, "label": TranslateService.translate(eventStore,x) } as SelectInputOption))}
                placeholderKey={"PLACES_TINDER_PLACEHOLDER"}
                modalValueName={"FLYING_TO"}
                onChange={(data: any) => {
                    setDestination(data.value);
                }}
            />
            {currentPlace && (
                <div className={"flex-col gap-10"} style={{ maxWidth: 500 }}>
                    {currentPlace.tinder?.images && (
                        <ImageGallery items={currentPlace.tinder.images.map((x: string) => ({ original: x, thumbnail: x }))} />
                    )}
                    <b>{currentPlace?.title}</b>
                    {currentPlace.description && (
                        <div style={{ opacity: 0.6 }} dangerouslySetInnerHTML={{ __html: formatDescription(currentPlace.description)}} />
                    )}
                    {currentPlace.tinder?.more_info && (
                        <div>
                            <a target={"_blank"} className={"cursor-pointer"} style={{ opacity: 0.6 }} href={currentPlace.tinder.more_info}>למידע נוסף</a>
                        </div>
                    )}
                    <div />
                    <div className={"flex-row gap-5 justify-content-center"}>
                        <a className={"cursor-pointer"} onClick={() => { setCurrIdx(currIdx+1)}}>אהבתי!</a> |
                        <a className={"cursor-pointer"} onClick={() => { setCurrIdx(currIdx+1)}}>אולי</a> |
                        <a className={"cursor-pointer"} onClick={() => { setCurrIdx(currIdx+1)}}>לא אהבתי</a>
                    </div>
                </div>
            )}
            {/*test - {placesData.length}*/}
        </div>
    )
}

export default observer(PlacesTinder);