import React, { useContext, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import { feedStoreContext } from '../../stores/feed-view-store';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { SavedCollection } from '../../utils/interfaces';
import PointOfInterest from '../../components/point-of-interest/point-of-interest';
import { rootStoreContext } from '../../stores/root-store';
import { exploreTabId, mainPageContentTabLsKey } from '../../utils/consts';
import { getCityCountry } from '../../utils/destination-utils';
import './saved-collections-tab.scss';

declare const $: any; // Add jQuery type declaration

function SavedCollectionsTab() {
	const rootStore = useContext(rootStoreContext);
	const eventStore = useContext(eventStoreContext);
	const feedStore = useContext(feedStoreContext);
	const [isGroupedByCountry, setIsGroupedByCountry] = useState(false);

	useEffect(() => {
		$(document).on('click', '.navigate-to-explore', () => {
			navigateToExploreTab();
		});
	}, []);

	// Group collections by country
	const collectionsByCountry = useMemo(() => {
		const grouped: { [country: string]: SavedCollection[] } = {};

		feedStore.savedCollections.forEach((collection) => {
			const country = getCityCountry(collection.destination);
			if (country) {
				if (!grouped[country]) {
					grouped[country] = [];
				}
				grouped[country].push(collection);
			} else {
				// If no country found, use the destination as is
				if (!grouped[collection.destination]) {
					grouped[collection.destination] = [];
				}
				grouped[collection.destination].push(collection);
			}
		});

		return grouped;
	}, [feedStore.savedCollections]);

	// Calculate total items for each country
	const countryTotalItems = useMemo(() => {
		const totals: { [country: string]: number } = {};
		Object.entries(collectionsByCountry).forEach(([country, collections]) => {
			totals[country] = collections.reduce((sum, collection) => sum + collection.items.length, 0);
		});
		return totals;
	}, [collectionsByCountry]);

	function renderCollection(collection: SavedCollection) {
		const classList = getClasses('align-items-center', eventStore.isHebrew ? 'flex-row-reverse' : 'flex-row');

		const idxToDetails = {};

		let item: any = collection.items?.[0]?.fullDetails ?? {};

		collection.items?.forEach((i, idx) => (idxToDetails[idx] = i.fullDetails));

		item = {
			...item,
			collectionId: collection.id,
			images: collection.items?.map((i) => i.fullDetails.images?.[0]),
			name: collection.name,
			destination: collection.destination,
			category: 'SAVED_COLLECTION_PREFIX',
			rate: undefined,
			isSystemRecommendation: undefined,
			location: undefined,
			more_info: undefined,
			source: undefined,
			description: TranslateService.translate(eventStore, 'SAVED_COLLECTION.ITEMS', {
				X: collection.items.length,
			}),
			idxToDetails,
			imagesNames: collection.items?.map((i) => i.fullDetails.name),
		};

		return (
			<div key={item.id} className={classList}>
				<PointOfInterest key={item.id} item={item} eventStore={eventStore} mainFeed savedCollection />
			</div>
		);
	}

	function navigateToExploreTab() {
		localStorage.setItem(mainPageContentTabLsKey, exploreTabId);
		window.location.hash = exploreTabId;
		rootStore.triggerTabsReRender();
		rootStore.triggerHeaderReRender();
	}

	function renderNoSavedCollectionsPlaceholder() {
		return (
			<div className="my-trips-actionbar width-100-percents align-items-center">
				<hr className="width-100-percents margin-bottom-0" />
				<img src="/images/saved-collection.jpg" width="200" />
				<div className="flex-column gap-8 align-items-center">
					<h3>{TranslateService.translate(eventStore, 'NO_SAVED_COLLECTIONS')}</h3>
					<span
						className="white-space-pre-line"
						dangerouslySetInnerHTML={{
							__html: TranslateService.translate(eventStore, 'NO_SAVED_COLLECTIONS.DESCRIPTION'),
						}}
					/>
				</div>
				<br />
				<br />
				<br />
				<br />
				<hr className="width-100-percents margin-top-0" />
			</div>
		);
	}

	function renderCountrySection(country: string, collections: SavedCollection[]) {
		return (
			<div key={country} className="country-section">
				<h3 className="country-title">
					{country} ({countryTotalItems[country]})
				</h3>
				<div className="saved-collections flex-row justify-content-center flex-wrap-wrap align-items-start">
					{collections.sort((a, b) => b.items.length - a.items.length).map(renderCollection)}
				</div>
			</div>
		);
	}

	function renderCollections() {
		if (!isGroupedByCountry) {
			return (
				<div className="saved-collections flex-row justify-content-center flex-wrap-wrap align-items-start">
					{feedStore.savedCollections.sort((a, b) => b.items.length - a.items.length).map(renderCollection)}
				</div>
			);
		}

		// Sort countries by total items count
		const sortedCountries = Object.entries(collectionsByCountry).sort(
			([countryA], [countryB]) => countryTotalItems[countryB] - countryTotalItems[countryA]
		);

		return (
			<div className="countries-container">
				{sortedCountries.map(([country, collections]) => renderCountrySection(country, collections))}
			</div>
		);
	}

	return (
		<div
			className="flex-row justify-content-center flex-wrap-wrap align-items-start"
			key={feedStore.savedCollections.length}
		>
			<div className="flex-column margin-top-10 width-100-percents">
				<h2 className="main-feed-header width-100-percents">
					{TranslateService.translate(eventStore, 'SAVED_COLLECTIONS.TITLE')}
				</h2>
				{feedStore.savedCollections.length == 0 ? (
					renderNoSavedCollectionsPlaceholder()
				) : (
					<>
						<span className="main-feed-description white-space-pre-wrap text-align-start">
							{TranslateService.translate(eventStore, 'SAVED_COLLECTIONS.DESCRIPTION')}
						</span>
						<div className="group-toggle">
							<label className="toggle-label">
								<input
									type="checkbox"
									checked={isGroupedByCountry}
									onChange={(e) => setIsGroupedByCountry(e.target.checked)}
								/>
								{TranslateService.translate(eventStore, 'SAVED_COLLECTIONS.GROUP_BY_COUNTRY')}
							</label>
						</div>
						{renderCollections()}
					</>
				)}
			</div>
		</div>
	);
}
export default observer(SavedCollectionsTab);
