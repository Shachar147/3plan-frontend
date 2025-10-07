import React, { useContext } from 'react';
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

function FeatureRow({ images, title, description }: { images: string[]; title: string; description: string }) {
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
				<div className="opacity-80" dangerouslySetInnerHTML={{ __html: description }} />
			</div>
		</div>
	);
}

function WhatsNewPage() {
	const eventStore = useContext(eventStoreContext);

	const releaseNotes = useAsyncMemo(async () => await new ReleaseNotesApiService().list(), []);

	function renderContent() {
		if (!releaseNotes || releaseNotes.loading) {
			return <span>{TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}</span>;
		}

		return (
			<>
				{releaseNotes.data.map((feature) => (
					<FeatureRow
						images={feature.imageUrls ?? []}
						title={eventStore.isHebrew ? feature.hebrewTitle : feature.englishTitle}
						description={eventStore.isHebrew ? feature.hebrewDescription : feature.englishDescription}
					/>
				))}
			</>
		);
	}

	return (
		<div className="triplan-main-page-container flex-column">
			<TriplanHeaderBanner withHr />
			<div className="whats-new-container container padding-20 flex-column gap-24">
				<h2 className="margin-0 whats-new-title">
					{TranslateService.translate(eventStore, 'WHATS_NEW.TITLE')}
				</h2>
				{renderContent()}
			</div>
			<TriplanFooter />
			<ScrollToTopButton />
		</div>
	);
}

export default observer(WhatsNewPage);
