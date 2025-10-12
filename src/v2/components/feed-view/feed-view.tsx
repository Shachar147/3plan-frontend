import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import PointOfInterest, { PointOfInterestShimmering } from '../point-of-interest/point-of-interest';
import { EventStore, eventStoreContext, hideSuggestionsLsKey } from '../../../stores/events-store';
import FeedViewApiService, { allSources } from '../../services/feed-view-api-service';
import CategoryFilter from '../category-filter/category-filter';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import './feed-view.scss';
import LazyLoadComponent from '../lazy-load-component/lazy-load-component';
import DestinationSelector from '../destination-selector/destination-selector';
import Button, { ButtonFlavor } from '../../../components/common/button/button';
import { feedStoreContext } from '../../stores/feed-view-store';
import { runInAction } from 'mobx';
import ReactModalService from '../../../services/react-modal-service';
import { FeatureFlagsService } from '../../../utils/feature-flags';
import { getParameterFromHash } from '../../utils/utils';

interface FeedViewProps {
	eventStore: EventStore;
	mainFeed?: boolean;
	searchKeyword?: string;
	viewItemId?: number;
	filterByDestination?: boolean;
	suggestionsMode?: boolean;
	withHideSuggestionsButton?: boolean;
	onlySystemRecommendations?: boolean; // only stuff I recommend
}

const cacheThreshold = 300;
const MAX_PAGES_WITH_EMPTY_FILTER_RESULTS = 8;

function SelectDestinationPlaceholder() {
	const eventStore = useContext(eventStoreContext);
	const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

	return (
		<div
			className={getClasses(
				'width-100-percents text-align-center flex-align-items-center justify-content-center flex-column gap-8',
				eventStore.getCurrentDirection() === 'rtl' && 'direction-rtl'
			)}
		>
			{TranslateService.translate(eventStore, 'FEED_VIEW.FEED_IS_EMPTY_NO_DESTINATIONS.SELECT')}
			<DestinationSelector onChange={setSelectedDestinations} />
			<Button
				flavor={ButtonFlavor.primary}
				disabled={!selectedDestinations?.length || eventStore.isTripLocked || !eventStore.canWrite}
				text={TranslateService.translate(eventStore, 'UPDATE_TRIP')}
				onClick={() =>
					eventStore.dataService
						.setDestinations(selectedDestinations, eventStore.tripName)
						.then(() => window.location.reload())
				}
			/>
		</div>
	);
}

const FeedView = ({
	eventStore,
	mainFeed,
	searchKeyword,
	viewItemId,
	filterByDestination,
	suggestionsMode,
	withHideSuggestionsButton,
	onlySystemRecommendations,
}: FeedViewProps) => {
	const currentPage = useRef(1);
	const emptyResultsCountPerCategory = useRef({});
	const prevPageTotalResults = useRef(0);
	const feedStore = useContext(feedStoreContext);
	const apiService = useMemo(() => new FeedViewApiService(), []);
	const haveNoDestinations =
		eventStore.destinations == '[]' || eventStore.destinations?.[0] == '[]' || eventStore.destinations?.length == 0;

	filterByDestination = filterByDestination || !!getParameterFromHash('d');

	// for editing items
	const [isEditMode, setIsEditMode] = useState<Record<number, boolean>>({});

	useEffect(() => {
		if (suggestionsMode) {
			fetchItems(1, (isLoading) => {});
		}
	}, [suggestionsMode]);

	useEffect(() => {
		if (feedStore.savedCollections.length == 0) {
			feedStore.getSavedCollections();
		}
	}, []);

	useEffect(() => {
		const fetchCounts = async () => {
			if (haveNoDestinations) {
				feedStore.setIsLoading(false);
				return;
			}
			const countsPromises = eventStore.destinations.map((destination) =>
				apiService.getCount(destination, onlySystemRecommendations)
			);
			const countsResults = await Promise.all(countsPromises);

			const newSourceCounts = {};
			countsResults.forEach((counts, index) => {
				newSourceCounts[eventStore.destinations[index]] = counts;
			});

			feedStore.setSourceCounts(newSourceCounts);
			feedStore.setIsLoading(false);
		};

		if (mainFeed || searchKeyword || viewItemId) {
			feedStore.setIsLoading(false);
		} else {
			fetchCounts();
		}
	}, [apiService, eventStore.destinations]);

	// Function to filter duplicates based on name, url, source combination
	const filterUniqueItems = (items) => {
		const seen = new Map();
		return items.filter((item) => {
			const key = item.name + item.url + item.source;
			return seen.has(key) ? false : seen.set(key, true);
		});
	};

	const fetchItems = async (page, setLoading) => {
		currentPage.current = page;
		prevPageTotalResults.current = feedStore.filteredItems.length;

		if (
			feedStore.selectedCategory &&
			(emptyResultsCountPerCategory.current[feedStore.selectedCategory] ?? 0) >
				MAX_PAGES_WITH_EMPTY_FILTER_RESULTS
		) {
			feedStore.setAllReachedEnd(true);
			return;
		} else {
			feedStore.setAllReachedEnd(false);
		}

		setLoading(true);
		const newItems = [];
		let _reachedEndPerDestination = feedStore.reachedEndPerDestination ?? {};

		if (mainFeed) {
			if (eventStore.isMobile) {
				if (feedStore.allReachedEnd) {
					return;
				}
				const response = await apiService.getMainFeedItems(page, onlySystemRecommendations);
				newItems.push(...response.results);
				feedStore.setAllReachedEnd(response.isFinished);
			} else {
				if (page > 1 || feedStore.items.length) {
					return;
				}
				const destination = 'MainFeed';
				const responses = await Promise.all([
					apiService.getMainFeedItems(undefined, onlySystemRecommendations),
				]);

				responses.forEach((response) => {
					newItems.push(...response.results);
					response.isFinished = true;
					feedStore.setFinishedSources([...feedStore.finishedSources, response.source]);
				});

				_reachedEndPerDestination[destination] = true;
				feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
			}
		} else if (viewItemId) {
			if (page > 1) {
				return;
			}

			const destination = viewItemId.toString();
			eventStore.destinations = [destination];

			const item = await apiService.getItemById(viewItemId);
			newItems.push(item);
			feedStore.setFinishedSources(['Locale']);
			_reachedEndPerDestination[destination] = true;
			feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
		} else if (searchKeyword) {
			// const destination = searchKeyword;
			// eventStore.destinations = [destination];
			//
			// if (feedStore.finishedSources.includes("Local")) {
			//     return;
			// }
			//
			// const response = await apiService.getSearchResults(searchKeyword, page);
			// newItems.push(...response.results);
			// if (response.isFinished) {
			//     runInAction(() => {
			//         feedStore.allReachedEnd = true;
			//     })
			// }

			const destination = searchKeyword;

			const sources = allSources.filter(
				(source) =>
					(source === 'Local' || (feedStore.sourceCounts[destination]?.[source] ?? 0) < cacheThreshold) &&
					!feedStore.finishedSources.includes(source)
			);

			if (sources.length === 0) {
				// If no sources left for this destination, continue to the next destination
				feedStore.setReachedEndPerDestination({
					...feedStore.reachedEndPerDestination,
					[destination]: true,
				});
			}

			let allFinished = false;
			if (destination != '[]') {
				const responses = await Promise.all(
					sources.map((source) =>
						source === 'Local'
							? apiService.getSearchResults(destination, page, filterByDestination)
							: apiService.getItems(source, destination, page)
					)
				);

				responses.forEach((response) => {
					newItems.push(...response.results);
					if (response.isFinished) {
						feedStore.setFinishedSources([...feedStore.finishedSources, response.source]);
					}
				});

				// Check if items are finished for this destination
				allFinished = responses?.filter((response) => response.isFinished)?.length === responses.length;
			}

			if (allFinished) {
				_reachedEndPerDestination[destination] = true;
				feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
			}
		} else {
			for (const destination of eventStore.destinations) {
				const sources = (onlySystemRecommendations ? ['Local'] : allSources).filter(
					(source) =>
						(source === 'Local' || (feedStore.sourceCounts[destination]?.[source] ?? 0) < cacheThreshold) &&
						!feedStore.finishedSources.includes(source)
				);

				if (sources.length === 0) {
					// If no sources left for this destination, continue to the next destination
					feedStore.setReachedEndPerDestination({
						...feedStore.reachedEndPerDestination,
						[destination]: true,
					});
				}

				let allFinished = false;
				if (destination != '[]') {
					const responses = await Promise.all(
						sources.map((source) =>
							apiService.getItems(source, destination, page, onlySystemRecommendations)
						)
					);

					responses.forEach((response) => {
						newItems.push(...response.results);
						if (response.isFinished) {
							feedStore.setFinishedSources([...feedStore.finishedSources, response.source]);
						}
					});

					// Check if items are finished for this destination
					allFinished = responses?.every((response) => response.isFinished);
				}

				if (allFinished) {
					_reachedEndPerDestination[destination] = true;
					feedStore.setReachedEndPerDestination(_reachedEndPerDestination);
				}
			}
		}

		let uniqueNewItems = filterUniqueItems(newItems);
		uniqueNewItems = uniqueNewItems.sort((a, b) => {
			// First, sort by isSystemRecommendation (true values first)
			if (a.isSystemRecommendation !== b.isSystemRecommendation) {
				return a.isSystemRecommendation ? -1 : 1;
			}

			// Then, sort by rate?.rating in descending order
			return (b.rate?.rating || 0) - (a.rate?.rating || 0);
		});

		if (viewItemId) {
			feedStore.items = [];
		}

		if (mainFeed && feedStore.items.length > 0 && !eventStore.isMobile) {
			uniqueNewItems = [];
		}
		feedStore.setItems(filterUniqueItems([...feedStore.items, ...uniqueNewItems]));
		handleCategoryChange(feedStore.selectedCategory);

		const uniqueCategories = Array.from(new Set(uniqueNewItems.map((item) => item.category || 'CATEGORY.GENERAL')));
		feedStore.setCategories([...new Set([...feedStore.categories, ...uniqueCategories])]);

		// Check if all destinations have reached the end
		const allReachedEndNow = eventStore.destinations?.every((dest) => _reachedEndPerDestination[dest]);
		feedStore.setReachedEndForDestinations(allReachedEndNow);

		setLoading(false);
	};

	const handleCategoryChange = (category) => {
		feedStore.setSelectedCategory(category);
	};

	// useEffect to update allReachedEnd state based on reachedEndForDestinations and other conditions
	useEffect(() => {
		const allSourcesFinished = allSources?.every((source) => feedStore.finishedSources.includes(source));

		if ((searchKeyword || feedStore.reachedEndForDestinations) && allSourcesFinished) {
			feedStore.setAllReachedEnd(true);
		} else {
			feedStore.setAllReachedEnd(false);
		}
	}, [feedStore.reachedEndForDestinations, feedStore.finishedSources]);

	function renderShowingResultsText() {
		const isFiltering = feedStore.items.length !== feedStore.filteredItems.length;

		// if (!eventStore.destinations?.length || eventStore.destinations == '[]') {
		//     return;
		// }

		return (
			<div
				className={getClasses(
					'flex-1-1-0 min-width-max-content gap-4',
					eventStore.getCurrentDirection() === 'rtl' && 'direction-rtl'
				)}
			>
				{/*<span>{TranslateService.translate(eventStore, "FEED_VIEW.EXPLORING", {*/}
				{/*    destinations: eventStore.destinations?.join(", ") || "-"*/}
				{/*})}</span>*/}
				{isFiltering && (
					<span className="width-100-percents text-align-end">
						{TranslateService.translate(eventStore, 'SHOWING_X_FROM_Y', {
							0: feedStore.filteredItems.length,
							1: feedStore.items.length,
						})}
					</span>
				)}
			</div>
		);
	}

	function renderCategoryFilter() {
		if (!feedStore.categories || feedStore.categories.length == 0) {
			return null;
		}
		if (viewItemId) {
			return null;
		}
		if (mainFeed) {
			return null;
		}
		if (haveNoDestinations) {
			return null;
		}
		return (
			<div
				className={getClasses(
					'feed-view-filter-bar width-100-percents justify-content-space-between',
					eventStore.isHebrew ? 'hebrew-mode flex-row' : 'flex-row'
				)}
			>
				<CategoryFilter
					categories={feedStore.categories}
					onFilterChange={(category) => handleCategoryChange(category)}
				/>
				{renderShowingResultsText()}
			</div>
		);
	}

	async function onPoiRenamed(poiId: number, oldName: string, newName: string) {
		if (newName.length == 0) {
			return;
		}
		if (oldName != newName) {
			const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
				name: newName,
			});

			if (updatedResponse.name != newName) {
				ReactModalService.internal.openOopsErrorModal(eventStore);
			} else {
				runInAction(() => {
					feedStore.items.find((s) => s.id == poiId).name = updatedResponse.name;
				});

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.CREATE.TITLE',
					'POI_UPDATED_SUCCESSFULLY',
					'success'
				);
			}
		}
		setIsEditMode({
			...isEditMode,
			[poiId]: false,
		});
	}

	async function onPoiCategoryChanged(poiId: number, oldCategory: string, newCategory: string) {
		if (newCategory.length == 0) {
			return;
		}
		if (oldCategory != newCategory) {
			const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
				category: newCategory,
			});
			if (updatedResponse.category != newCategory) {
				ReactModalService.internal.openOopsErrorModal(eventStore);
			} else {
				runInAction(() => {
					const found = feedStore.systemRecommendations.find((s) => s.id == poiId);
					if (found) {
						found.category = updatedResponse.category;
					}
				});

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.CREATE.TITLE',
					'POI_UPDATED_SUCCESSFULLY',
					'success'
				);
			}
		}
		setIsEditMode({
			...isEditMode,
			[poiId]: false,
		});
	}

	async function onPoiDescriptionChanged(poiId: number, oldDescription: string, newDescription: string) {
		if (newDescription.length == 0) {
			return;
		}
		if (oldDescription != newDescription) {
			const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
				description: newDescription,
			});
			if (updatedResponse.description != newDescription) {
				ReactModalService.internal.openOopsErrorModal(eventStore);
			} else {
				runInAction(() => {
					feedStore.items.find((s) => s.id == poiId).description = updatedResponse.description;
				});

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.CREATE.TITLE',
					'POI_UPDATED_SUCCESSFULLY',
					'success'
				);
			}
		}
		setIsEditMode({
			...isEditMode,
			[poiId]: false,
		});
	}

	async function onPoiDestinationsChanged(poiId: number, oldDestinations: string, newDestinations: string) {
		if (newDestinations.length == 0) {
			return;
		}
		if (oldDestinations != newDestinations) {
			const updatedResponse = await new FeedViewApiService().updatePoi(poiId, {
				destination: newDestinations,
			});
			if (updatedResponse.destination != newDestinations) {
				ReactModalService.internal.openOopsErrorModal(eventStore);
			} else {
				runInAction(() => {
					const found = feedStore.systemRecommendations.find((s) => s.id == poiId);
					if (found) {
						found.destination = updatedResponse.destination;
					}

					const found2 = feedStore.items.find((s) => s.id == poiId);
					if (found2) {
						found2.destination = updatedResponse.destination;
					}
				});

				ReactModalService.internal.alertMessage(
					eventStore,
					'MODALS.CREATE.TITLE',
					'POI_UPDATED_SUCCESSFULLY',
					'success'
				);
			}
		}
		setIsEditMode({
			...isEditMode,
			[poiId]: false,
		});
	}

	function renderPageTitle() {
		const key = suggestionsMode ? 'SUGGESTIONS_SIDEBAR_TITLE' : 'TOP_PICKS';

		return (
			<div className={getClasses('flex-column width-100-percents', !suggestionsMode && 'align-items-center')}>
				<div className="flex-row justify-content-center width-100-percents padding-inline-end-10">
					<h3 className="main-feed-header justify-content-space-between width-100-percents">
						<span>{TranslateService.translate(eventStore, key)}</span>
					</h3>
					{withHideSuggestionsButton && (
						<Button
							flavor={ButtonFlavor.link}
							text="x"
							onClick={() => {
								runInAction(() => {
									eventStore.clickedHideSuggestions = true;
								});
								localStorage.setItem(hideSuggestionsLsKey, '1');
							}}
						/>
					)}
				</div>
				{!suggestionsMode && (
					<span
						className="main-feed-description text-align-start"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'MAIN_PAGE_FEED_VIEW.DESCRIPTION'),
						}}
					/>
				)}
			</div>
		);
	}

	function renderItems() {
		const classList = getClasses(
			'align-items-center',
			!mainFeed && !searchKeyword && 'width-100-percents',
			eventStore.isHebrew ? 'flex-row-reverse' : 'flex-row'
		);

		if (mainFeed) {
			return (
				<div className="flex-column margin-top-10">
					{renderPageTitle()}
					<div className="flex-row justify-content-center flex-wrap-wrap align-items-start">
						{feedStore.filteredItems.map((item, idx) => (
							<div key={item.id} className={classList}>
								<PointOfInterest
									key={item.id}
									item={item}
									eventStore={eventStore}
									mainFeed={mainFeed}
									isSearchResult={!!searchKeyword}
									isViewItem={!!viewItemId}
									onLabelClick={() => {
										FeatureFlagsService.isDeleteEnabled() &&
											setIsEditMode({
												...isEditMode,
												[item.id]: !!!isEditMode[item.id],
											});
									}}
									isEditMode={
										!FeatureFlagsService.isDeleteEnabled() ? false : isEditMode[item.id] ?? false
									}
									onEditSave={(newName: string) => {
										if (!FeatureFlagsService.isDeleteEnabled()) {
											return;
										}
										onPoiRenamed(item.id, item.name, newName);
									}}
									onEditDescriptionSave={(newDescription: string) => {
										if (!FeatureFlagsService.isDeleteEnabled()) {
											return;
										}
										onPoiDescriptionChanged(item.id, item.description, newDescription);
									}}
									onEditCategorySave={(newCategory: string) => {
										if (!FeatureFlagsService.isDeleteEnabled()) {
											return;
										}
										onPoiCategoryChanged(item.id, item.description, newCategory);
									}}
									onEditDestinationsSave={(newDestinations: string[]) => {
										if (!FeatureFlagsService.isDeleteEnabled()) {
											return;
										}
										onPoiDestinationsChanged(item.id, item.destination, newDestinations.join(','));
									}}
									onClick={
										FeatureFlagsService.isDeleteEnabled()
											? async () => {
													await new FeedViewApiService().deletePoi(item.id);
													runInAction(() => {
														feedStore.items = feedStore.items.filter(
															(s) => s.id != item.id
														);
													});
											  }
											: undefined
									}
									onClickText={
										FeatureFlagsService.isDeleteEnabled()
											? TranslateService.translate(eventStore, 'DELETE')
											: undefined
									}
									onClickIcon="fa-times"
									isSmall={suggestionsMode}
									suggestionsMode
								/>
							</div>
						))}
					</div>
				</div>
			);
		}

		if (feedStore.filteredItems.length == prevPageTotalResults.current && feedStore.selectedCategory.length) {
			emptyResultsCountPerCategory.current[feedStore.selectedCategory] ||= 0;
			emptyResultsCountPerCategory.current[feedStore.selectedCategory] += 1;
			prevPageTotalResults.current = feedStore.filteredItems.length;
		} else {
			emptyResultsCountPerCategory.current[feedStore.selectedCategory] = 0;
		}

		return feedStore.filteredItems
			.filter((i) => {
				if (suggestionsMode) {
					const foundByName = eventStore.allEventsComputed.find((e) => e.title == i.name);
					// if (foundByName) {
					//     console.log("hereeee", i.name, toJS(foundByName), toJS(foundByName?.location), toJS(i.location));
					// }
					const foundByLocation = eventStore.allEventsComputed.find(
						(e) =>
							e.location?.latitude == i.location?.latitude &&
							e.location?.longitude == i.location?.longitude
					);
					// if (foundByLocation){
					//     console.log("thereeee", i.name, toJS(foundByLocation.location), toJS(i.location));
					// }

					const shouldRender = !foundByLocation && !foundByName;
					// console.log("should render - ", i.name, shouldRender)
					return shouldRender;
				}
				return true;
			})
			.map((item, idx) => (
				<div key={item.id} className={classList}>
					{!eventStore.isMobile && !suggestionsMode && <span className="poi-idx">{idx + 1}</span>}
					<PointOfInterest
						key={item.id}
						item={item}
						eventStore={eventStore}
						mainFeed={mainFeed}
						isSearchResult={!!searchKeyword}
						isViewItem={!!viewItemId}
						onLabelClick={() => {
							FeatureFlagsService.isDeleteEnabled() &&
								setIsEditMode({
									...isEditMode,
									[item.id]: !!!isEditMode[item.id],
								});
						}}
						isEditMode={!FeatureFlagsService.isDeleteEnabled() ? false : isEditMode[item.id] ?? false}
						onEditSave={(newName: string) => {
							if (!FeatureFlagsService.isDeleteEnabled()) {
								return;
							}
							onPoiRenamed(item.id, item.name, newName);
						}}
						onEditDescriptionSave={(newDescription: string) => {
							if (!FeatureFlagsService.isDeleteEnabled()) {
								return;
							}
							onPoiDescriptionChanged(item.id, item.description, newDescription);
						}}
						onEditCategorySave={(newCategory: string) => {
							if (!FeatureFlagsService.isDeleteEnabled()) {
								return;
							}
							onPoiCategoryChanged(item.id, item.description, newCategory);
						}}
						onEditDestinationsSave={(newDestinations: string[]) => {
							if (!FeatureFlagsService.isDeleteEnabled()) {
								return;
							}
							onPoiDestinationsChanged(item.id, item.destination, newDestinations.join(','));
						}}
						onClick={
							FeatureFlagsService.isDeleteEnabled()
								? async () => {
										await new FeedViewApiService().deletePoi(item.id);
										runInAction(() => {
											feedStore.items = feedStore.items.filter((s) => s.id != item.id);
										});
								  }
								: undefined
						}
						onClickText={
							FeatureFlagsService.isDeleteEnabled()
								? TranslateService.translate(eventStore, 'DELETE')
								: undefined
						}
						onClickIcon="fa-times"
						isSmall={suggestionsMode}
						suggestionsMode
					/>
				</div>
			));
	}

	function isFiltered() {
		return feedStore.selectedCategory != '';
	}

	function renderReachedEnd() {
		if (viewItemId) {
			return null;
		}
		if (!feedStore.allReachedEnd) {
			return null;
		}
		if (isFiltered() && feedStore.filteredItems.length == 0) {
			return (
				<div className="width-100-percents text-align-center margin-top-20">
					{TranslateService.translate(eventStore, 'NO_RESULTS_TRY_DIFFERENT_CATEGORY')}
				</div>
			);
			// return null;
		}

		return (
			<div className="width-100-percents text-align-center margin-top-20">
				{TranslateService.translate(
					eventStore,
					feedStore.items.length == 0 ? 'MAP.VISIBLE_ITEMS.NO_SEARCH_RESULTS' : 'NO_MORE_ITEMS'
				)}
			</div>
		);
	}

	function renderSelectDestinationPlaceholder() {
		if (viewItemId) {
			return null;
		}
		if (haveNoDestinations) {
			return <SelectDestinationPlaceholder />;
		}
	}

	function renderFeedContent() {
		return (
			<div
				className={getClasses(
					!mainFeed && 'flex-column',
					'gap-4 width-100-percents',
					searchKeyword && !eventStore.isMobile && 'padding-inline-100'
				)}
			>
				{!suggestionsMode && renderCategoryFilter()}
				{suggestionsMode && renderPageTitle()}
				{renderItems()}
				{!suggestionsMode && renderReachedEnd()}
				{!suggestionsMode && renderSelectDestinationPlaceholder()}
			</div>
		);
	}

	function renderLoadingPlaceholder() {
		const isSmall = suggestionsMode || mainFeed || eventStore.isMobile;

		// to prevent situation of showing shimmering while there are no results.
		if (feedStore.allReachedEnd) {
			return null;
		}

		return (
			<div
				className={getClasses(
					'text-div width-100-percents',
					mainFeed ? 'text-align-start margin-top-10' : 'text-align-center'
				)}
			>
				{(mainFeed || suggestionsMode) && renderPageTitle()}
				{!mainFeed && !suggestionsMode && (
					<span className="height-60">{TranslateService.translate(eventStore, 'LOADING_TRIPS.TEXT')}</span>
				)}
				<div
					className={getClasses(
						isSmall ? 'flex-row justify-content-center flex-wrap-wrap align-items-start' : 'flex-column',
						'gap-4'
					)}
				>
					{Array.from({ length: suggestionsMode ? 1 : eventStore.isMobile ? 3 : 12 }).map((_, index) => (
						<PointOfInterestShimmering key={index} isSmall={isSmall} />
					))}
				</div>
			</div>
		);
	}

	const [debouncePlaceholder, setDebouncePlaceholder] = useState(true);
	useEffect(() => {
		// make shimmering appear for at least X seconds
		setTimeout(() => {
			setDebouncePlaceholder(false);
		}, 1000);
	}, []);

	if (suggestionsMode) {
		if (feedStore.isLoading && !haveNoDestinations) {
			return renderLoadingPlaceholder();
		}

		if (!haveNoDestinations && (feedStore.items.length == 0 || debouncePlaceholder)) {
			return renderLoadingPlaceholder();
		}

		return renderFeedContent();
	}

	return feedStore.isLoading && !haveNoDestinations ? (
		renderLoadingPlaceholder()
	) : (
		<LazyLoadComponent
			className="feed-view bright-scrollbar"
			disableLoader={(mainFeed && !eventStore.isMobile) || viewItemId}
			fetchData={(page, setLoading) => fetchItems(page, setLoading)}
			isLoading={feedStore.isLoading}
			isReachedEnd={feedStore.allReachedEnd}
		>
			{!haveNoDestinations && (feedStore.items.length == 0 || debouncePlaceholder) && renderLoadingPlaceholder()}
			{renderFeedContent()}
		</LazyLoadComponent>
	);
};

export default observer(FeedView);
