import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { feedStoreContext } from '../../stores/feed-view-store';
import { getClasses } from '../../../utils/utils';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { SavedCollection } from '../../utils/interfaces';
import PointOfInterest from '../../components/point-of-interest/point-of-interest';
import { rootStoreContext } from '../../stores/root-store';
import { exploreTabId, mainPageContentTabLsKey } from '../../utils/consts';
import './saved-collections-tab.scss';

function SavedCollectionsTab() {
	const rootStore = useContext(rootStoreContext);
	const eventStore = useContext(eventStoreContext);
	const feedStore = useContext(feedStoreContext);

	useEffect(() => {
		$(document).on('click', '.navigate-to-explore', () => {
			navigateToExploreTab();
		});
	}, []);

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
					{/*<img src="/images/saved-collection-example.png" width="200" style={{ marginTop: 20 }} />*/}
				</div>
				<br />
				<br />
				<br />
				<br />
				<hr className="width-100-percents margin-top-0" />
			</div>
		);
	}

	return (
		<div
			className="flex-row justify-content-center flex-wrap-wrap align-items-start"
			key={feedStore.savedCollections.length}
		>
			{
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
							<div className="saved-collections flex-row justify-content-center flex-wrap-wrap align-items-start">
								{feedStore.savedCollections
									.sort((a, b) => b.items.length - a.items.length)
									.map(renderCollection)}
							</div>
						</>
					)}
				</div>
			}
		</div>
	);
}
export default observer(SavedCollectionsTab);
