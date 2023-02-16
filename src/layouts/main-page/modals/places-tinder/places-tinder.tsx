import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import { EventStore } from '../../../../stores/events-store';
import placesData from './data';
import SelectInput, { SelectInputOption } from '../../../../components/inputs/select-input/select-input';
import './place-tinder.scss';
import TranslateService from '../../../../services/translate-service';
// @ts-ignore
// import ImageGallery from 'react-image-gallery';
import '../../../../stylesheets/react-image-gallery.scss';
import Button, { ButtonFlavor } from '../../../../components/common/button/button';
import ReactModalService from '../../../../services/react-modal-service';
import { TriplanPriority } from '../../../../utils/enums';
import { getClasses } from '../../../../utils/utils';

// @ts-ignore
import Slider from 'react-slick';
import { TriplanTinderApiService } from '../../../../admin/services/triplan-tinder-api-service';
import { observable, runInAction } from 'mobx';
import { TinderItem } from '../../../../admin/helpers/interfaces';

interface PlacesTinderProps {
	eventStore: EventStore;
	destination?: string | null;
}

function PlacesTinder(props: PlacesTinderProps) {
	function shuffle(array: any[]) {
		let currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle.
		while (currentIndex != 0) {
			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	}

	const { eventStore } = props;

	const [currIdx, setCurrIdx] = useState(0);
	const [destination, setDestination] = useState<string | null>(props.destination || null);
	// const placesDataMap: Record<string, any[]> = useMemo(() => placesData, []);

	const [hasInit, setHasInit] = useState(false);
	const [placesDataMap, setPlacesDataMap] = useState<Record<string, any[]>>({});
	const [placesList, setPlacesList] = useState<any[]>([]);
	const [dislikedList, setDislikedList] = useState<any[]>([]);

	useEffect(() => {
		TriplanTinderApiService.getPlacesByDestination().then((results) => {
			runInAction(() => {
				setPlacesDataMap(results?.data);
				setHasInit(true);
			});
		});
	}, []);

	const existingTitles = useMemo(() => {
		return eventStore.allEvents?.map((p) => p.title) ?? [];
	}, [eventStore.allEvents, eventStore.isLoading]);

	const existingLocations = useMemo(() => {
		return eventStore.allEvents?.filter((p) => p.location).map((p) => JSON.stringify(p.location)) ?? [];
	}, [eventStore.allEvents, eventStore.isLoading]);

	// todo move to server (?)
	const lsKey = 'triplan-places-tinder-disliked-list';
	useEffect(() => {
		if (!localStorage.getItem(lsKey)) {
			localStorage.setItem(lsKey, '[]');
		}
		setDislikedList(JSON.parse(localStorage.getItem(lsKey)!));
	}, []);

	useEffect(() => {
		if (destination != null) {
			// filter out disliked names
			const arr = shuffle(placesDataMap[destination]).filter(filterOutDisliked).filter(filterOutAlreadyExisting);
			setPlacesList(arr);
			setCurrIdx(0);

			document.getElementsByClassName('places-tinder-modal')[0].className +=
				' selected-destination fullscreen-modal';
		}
	}, [destination]);

	let currentPlace: any;
	if (destination && placesList.length > 0) {
		if (currIdx <= placesList.length) {
			currentPlace = placesList[currIdx];
		}
	}

	function filterOutDisliked(p: any) {
		const dislikedListNames = dislikedList.map((p) => p.title);
		return dislikedListNames.indexOf(p.title) === -1;
	}

	function filterOutAlreadyExisting(p: any) {
		if (existingTitles.indexOf(p.title) !== -1) return false;
		if (p.location) {
			if (existingLocations.indexOf(JSON.stringify(p.location)) !== -1) return false;
		}
		return true;
	}

	function formatDescription(description: string) {
		// replace \n with brs
		description = description.replace(/\n/g, '<br>');

		// add links
		description = description
			.replace(/(http:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>")
			.replace(/(https:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>");

		// console.log("after", description);

		return description;
	}

	function like() {
		const existingCategory = eventStore.categories.filter((c) => c.title === currentPlace['category']);

		currentPlace['priority'] = TriplanPriority.unset;

		let categoryId: number;
		if (existingCategory.length > 0) {
			categoryId = existingCategory[0].id;
		} else {
			categoryId = eventStore.createCategoryId();
			eventStore.setCategories([
				...eventStore.categories,
				{
					id: categoryId,
					title: currentPlace['category'],
					icon: '',
				},
			]);
		}

		let description = currentPlace.description || '';
		if ((currentPlace.tinder || currentPlace).more_info) {
			if (description !== '') description += '\n-----\n';
			description += `${TranslateService.translate(eventStore, 'MORE_INFO')}:\n${
				(currentPlace.tinder || currentPlace).more_info
			}`;
		}

		const initialData = {
			...currentPlace,
			description,
			images: (currentPlace.tinder || currentPlace).images.join('\n'),
		};

		ReactModalService.openAddSidebarEventModal(eventStore, categoryId, initialData, true);
		setCurrIdx(currIdx + 1);
	}

	function dislike() {
		dislikedList.push(currentPlace);
		setDislikedList(dislikedList);
		localStorage.setItem(lsKey, JSON.stringify(dislikedList));
		setCurrIdx(currIdx + 1);
	}

	function maybe() {
		setCurrIdx(currIdx + 1);
	}

	function renderPlaceholders() {
		if (destination && placesList.length === 0) {
			return TranslateService.translate(eventStore, 'PLACES_TINDER.NO_PLACES_TO_SUGGEST');
		} else if (destination && currIdx >= placesList.length) {
			return TranslateService.translate(eventStore, 'PLACES_TINDER.NO_MORE_PLACES_TO_SUGGEST');
		}
	}

	function goBack() {
		if (currIdx > 0) {
			setCurrIdx(currIdx - 1);
		}
	}

	function goNext() {
		if (currIdx + 1 < placesList.length) {
			setCurrIdx(currIdx + 1);
		}
	}

	function renderNavigation() {
		if (destination && placesList && placesList.length > 0) {
			return (
				<div className="flex-row space-between margin-top-10">
					<a onClick={goBack} className={getClasses(currIdx === 0 ? 'disabled' : 'cursor-pointer')}>
						{TranslateService.translate(eventStore, 'NAVIGATION.BACK')}
					</a>
					<div>{currIdx + 1 > placesList.length ? '' : `${currIdx + 1}/${placesList.length}`}</div>
					<a
						onClick={goNext}
						className={getClasses(currIdx + 1 >= placesList.length ? 'disabled' : 'cursor-pointer')}
					>
						{TranslateService.translate(eventStore, 'NAVIGATION.NEXT')}
					</a>
				</div>
			);
		}
	}

	const sliderSettings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		width: 300,
	};

	if (!hasInit) {
		return <div>{TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}</div>;
	}

	const images = (currentPlace?.tinder || currentPlace)?.images;

	return (
		<div className={'places-tinder flex-column gap-10 justify-content-center bright-scrollbar'}>
			<SelectInput
				options={Object.keys(placesDataMap).map(
					(x: string) => ({ value: x, label: TranslateService.translate(eventStore, x) } as SelectInputOption)
				)}
				placeholderKey={'PLACES_TINDER_PLACEHOLDER'}
				modalValueName={'FLYING_TO'}
				onChange={(data: any) => {
					setDestination(data.value);
				}}
			/>
			{renderNavigation()}
			{renderPlaceholders()}
			{currentPlace && (
				<div className={'flex-col gap-10 justify-content-center align-items-center'} style={{ maxWidth: 500 }}>
					{images && (
						<Slider {...sliderSettings}>
							{images.map((image: string) => (
								<img
									className="slider-image"
									style={{
										width: 300,
										height: 150,
									}}
									alt={''}
									src={image}
								/>
							))}
						</Slider>
					)}
					{/*<ImageGallery items={currentPlace.tinder.images.map((x: string) => ({ original: x, thumbnail: x }))} />*/}
					<b>{currentPlace?.title}</b>
					{currentPlace.description && (
						<div
							style={{ opacity: 0.6, wordBreak: 'break-all', maxHeight: '400px', overflowY: 'scroll' }}
							className={'bright-scrollbar'}
							dangerouslySetInnerHTML={{ __html: formatDescription(currentPlace.description) }}
						/>
					)}
					{(currentPlace.tinder || currentPlace)?.more_info && (
						<div>
							<a
								target={'_blank'}
								className={'cursor-pointer'}
								style={{ opacity: 0.6 }}
								href={(currentPlace.tinder || currentPlace).more_info}
							>
								{/*todo complete - lokalise*/}
								למידע נוסף
							</a>
						</div>
					)}
					<div />
					<div className={'flex-row gap-20 justify-content-center'}>
						<Button
							flavor={ButtonFlavor.primary}
							text={TranslateService.translate(eventStore, 'PLACES_TINDER.LIKE')}
							onClick={like}
						/>
						<Button
							flavor={ButtonFlavor.link}
							text={TranslateService.translate(eventStore, 'PLACES_TINDER.MAYBE')}
							onClick={maybe}
						/>
						<Button
							flavor={ButtonFlavor.primary}
							className={'red'}
							text={TranslateService.translate(eventStore, 'PLACES_TINDER.DISLIKE')}
							onClick={dislike}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default observer(PlacesTinder);
