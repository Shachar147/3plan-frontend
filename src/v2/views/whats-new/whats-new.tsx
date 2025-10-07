import React, { useContext, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import TriplanHeaderBanner from '../../components/triplan-header-banner/triplan-header-banner';
import TriplanFooter from '../../components/triplan-footer/triplan-footer';
import ScrollToTopButton from '../../components/scroll-top/scroll-top';
import { eventStoreContext } from '../../../stores/events-store';
import TranslateService from '../../../services/translate-service';
import { getClasses } from '../../../utils/utils';
import './whats-new.scss';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import ReleaseNotesApiService from '../../services/release-notes-api-service';
import useAsyncMemo from '../../../custom-hooks/use-async-memo';
import { TabData } from '../../utils/interfaces';
import TabMenu from '../../../components/common/tabs-menu/tabs-menu';

function FeatureRow({
	images,
	title,
	description,
	howToUse,
}: {
	images: string[];
	title: string;
	description: string;
	howToUse?: string;
}) {
	const eventStore = useContext(eventStoreContext);
	const isHebrew = eventStore.isHebrew;

	return (
		<div
			className={getClasses(
				'whats-new-row gap-16 align-items-start',
				!eventStore.isMobile ? (isHebrew ? 'flex-row-reverse' : 'flex-row') : 'flex-col'
			)}
		>
			<div className="whats-new-image-gallery">
				<Carousel showThumbs={false} infiniteLoop swipeable emulateTouch>
					{images.map((src, idx) => (
						<div key={idx}>
							<img className="whats-new-image" src={src} />
						</div>
					))}
				</Carousel>
			</div>
			<div className={getClasses('whats-new-text flex-column gap-8', eventStore.isMobile && 'padding-inline-16')}>
				<h3 className="margin-0">{title}</h3>
				<div dangerouslySetInnerHTML={{ __html: description }} />
				{howToUse && (
					<div className="opacity-0-6 white-space-pre-line" dangerouslySetInnerHTML={{ __html: howToUse }} />
				)}
			</div>
		</div>
	);
}

function WhatsNewPage() {
	const eventStore = useContext(eventStoreContext);

	const whatsNewTabId = 'whats-new-tab';
	const tabs: TabData[] = getTabs();
	const tabIdToIdx = useMemo<Record<string, number>>(getTabIdToIndexMapping, [tabs]);
	const activeTab = whatsNewTabId;
	const [activeTabIdx, setActiveTabIdx] = useState(tabIdToIdx[activeTab]);

	function getTabIdToIndexMapping() {
		const toReturn = {};
		tabs.forEach((tab, idx) => {
			toReturn[tab.id] = idx;
		});
		return toReturn;
	}

	const releaseNotes = useAsyncMemo(async () => await new ReleaseNotesApiService().list(), []);

	function getTabs(): TabData[] {
		return [
			{
				id: whatsNewTabId,
				order: 0,
				name: TranslateService.translate(eventStore, 'WHATS_NEW.TITLE'),
				icon: 'fa-bolt',
				render: () => renderContent(),
			},
		];
	}

	function renderContent() {
		if (!releaseNotes || releaseNotes.loading) {
			return <span>{TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}</span>;
		}

		return (
			<div className="flex-column gap-16 padding-top-24">
				{releaseNotes.data.map((feature) => (
					<FeatureRow
						images={feature.imageUrls ?? []}
						title={eventStore.isHebrew ? feature.hebrewTitle : feature.englishTitle}
						description={eventStore.isHebrew ? feature.hebrewDescription : feature.englishDescription}
						howToUse={eventStore.isHebrew ? feature.hebrewHowToUse : feature.englishHowToUse}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="triplan-main-page-container flex-column">
			<TriplanHeaderBanner />
			<div
				className={getClasses(
					'triplan-header-banner-footer',
					eventStore.isMobile && activeTabIdx === tabs.length - 1 && 'padding-inline-end-10'
				)}
				// key={rootStore.tabMenuReRenderCounter}
			>
				<TabMenu
					activeTab={activeTab}
					tabs={tabs}
					onChange={(tabId) => {
						// setActiveTabIdx(tabIdToIdx[tabId]);
						// rootStore.triggerHeaderReRender();
						// window.location.hash = tabId;
					}}
				/>
			</div>
			{/* <div className="whats-new-container container padding-20 flex-column gap-24">
				<h2 className="margin-0 whats-new-title">
					{TranslateService.translate(eventStore, 'WHATS_NEW.TITLE')}
				</h2>
				{renderContent()}
			</div> */}
			<TriplanFooter />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(WhatsNewPage);
