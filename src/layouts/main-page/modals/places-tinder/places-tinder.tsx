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
import Button, {ButtonFlavor} from "../../../../components/common/button/button";
import ReactModalService from "../../../../services/react-modal-service";
import {TriplanPriority} from "../../../../utils/enums";

interface PlacesTinderProps {
    eventStore: EventStore;
    destination?: string | null;
}

function PlacesTinder(props: PlacesTinderProps){

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

    const { eventStore } = props;

    const [currIdx, setCurrIdx] = useState(0);
    const [destination, setDestination] = useState<string|null>(props.destination || null)
    const placesDataMap: Record<string, any[]> = useMemo(() => placesData, []);
    const [placesList, setPlacesList] = useState<any[]>([]);
    const [dislikedList, setDislikedList] = useState<any[]>([]);

    const lsKey = "triplan-places-tinder-disliked-list";
    useEffect(() => {
        if (!localStorage.getItem(lsKey)){
            localStorage.setItem(lsKey, '[]');
        }
        setDislikedList(JSON.parse(localStorage.getItem(lsKey)!));
    }, [])

    useEffect(() => {

        if (destination != null) {
            const dislikedListNames = dislikedList.map((p) => p.title);
            const arr = shuffle(placesDataMap[destination]).filter((p) => dislikedListNames.indexOf(p.title) === -1);
            setPlacesList(arr);
            setCurrIdx(0);

            document.getElementsByClassName("places-tinder-modal")[0].className += ' selected-destination';
        }

    }, [destination])

    let currentPlace: any;
    if (destination && placesList.length > 0) {
        if (currIdx <= placesList.length) {
            currentPlace = placesList[currIdx];
        }
    }

    function formatDescription(description: string) {
        // replace \n with brs
        description = description.replace(/\n/g, "<br>");

        // add links
        description = description.replace(/(http:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>").replace(/(https:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>");

        // console.log("after", description);

        return description;
    }

    function like(){
        const existingCategory = eventStore.categories.filter((c) => c.title === currentPlace["category"]);

        currentPlace["priority"] = TriplanPriority.unset;

        let categoryId: number;
        if (existingCategory.length > 0) {
            categoryId = existingCategory[0].id;
        } else {
            categoryId = eventStore.createCategoryId();
            eventStore.setCategories([
                ...eventStore.categories,
                {
                    id: categoryId,
                    title: currentPlace["category"],
                    icon: ""
                },
            ]);
        }

        ReactModalService.openAddSidebarEventModal(eventStore, categoryId, currentPlace, true);
        setCurrIdx(currIdx+1)
    }

    function dislike(){
        dislikedList.push(currentPlace);
        setDislikedList(dislikedList);
        localStorage.setItem(lsKey, JSON.stringify(dislikedList));
        setCurrIdx(currIdx+1);
    }

    function maybe(){
        setCurrIdx(currIdx+1)
    }

    function renderPlaceholders(){
        if (destination && placesList.length === 0) {
            return TranslateService.translate(eventStore, 'PLACES_TINDER.NO_PLACES_TO_SUGGEST');
        }
        else if (destination && currIdx >= placesList.length) {
            return TranslateService.translate(eventStore, 'PLACES_TINDER.NO_MORE_PLACES_TO_SUGGEST')
        }
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
            {renderPlaceholders()}
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
                    <div className={"flex-row gap-20 justify-content-center"}>
                        <Button flavor={ButtonFlavor.primary} text={TranslateService.translate(eventStore, "PLACES_TINDER.LIKE")} onClick={like} />
                        <Button flavor={ButtonFlavor.secondary} text={TranslateService.translate(eventStore, "PLACES_TINDER.MAYBE")} onClick={maybe} />
                        <Button flavor={ButtonFlavor.primary} className={"red"} text={TranslateService.translate(eventStore, "PLACES_TINDER.DISLIKE")} onClick={dislike} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default observer(PlacesTinder);