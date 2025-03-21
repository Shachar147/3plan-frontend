import React, {useContext, useEffect} from 'react';
import './landing-page.scss';
import {useNavigate} from 'react-router-dom';
import TranslateService from '../../services/translate-service';
import {eventStoreContext} from '../../stores/events-store';
import {observer} from 'mobx-react';
import {renderFooterLine} from '../../utils/ui-utils';
import Button, {ButtonFlavor} from '../../components/common/button/button';
import DataServices from '../../services/data-handlers/data-handler-base';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import {useHandleWindowResize} from '../../custom-hooks/use-window-size';
import {getCurrentUsername} from "../../utils/utils";
import {FeatureFlagsService} from "../../utils/feature-flags";
import {newDesignRootPath} from "../../v2/utils/consts";

const dataService = DataServices.LocalStorageService;
const LandingPage = () => {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

	useHandleWindowResize();

	useEffect(() => {
		document.querySelector('body').classList.remove('rtl');
		document.querySelector('body').classList.remove('ltr');
		document.querySelector('body').classList.add(eventStore.getCurrentDirection());
		dataService.setCalendarLocale(eventStore.calendarLocalCode);
	}, [eventStore.calendarLocalCode]);

	return (
		<div className="landing-page-layout landing-page">
			<TriplanHeaderWrapper />
			<div className="main-part">
				<div className="plan-your-trip-header main-font">
					{TranslateService.translate(eventStore, 'LANDING_PAGE.PLANNING_A_NEW')}
					<br />
					<div className="trip main-font-heavy">
						{TranslateService.translate(eventStore, 'LANDING_PAGE.TRIP')}
					</div>
				</div>
				<img
					className="logo-container"
					src={'/images/logo/new-logo.png'}
					style={{ width: '50%', minWidth: '150px', maxWidth: '200px' }}
				/>
				<div className="slogan main-font">
					<span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE1')}</span>
					<span>{TranslateService.translate(eventStore, 'LANDING_PAGE.SLOGAN.LINE2')}</span>
				</div>
				<div className="main-buttons">
					<Button
						text={TranslateService.translate(eventStore, 'LANDING_PAGE.START_NOW')}
						flavor={ButtonFlavor.primary}
						onClick={() => {
							navigate('/getting-started');
						}}
					/>
					<Button
						text={TranslateService.translate(eventStore, 'CHECK_OUT_EXISTING_TRIPS')}
						onClick={() => {
							navigate('/my-trips');
						}}
						flavor={ButtonFlavor.secondary}
						className="black"
					/>
				</div>
				<div>
					{FeatureFlagsService.isNewDesignEnabled() && <Button
						text="New site - Beta"
						onClick={() => {
							navigate(newDesignRootPath);
						}}
						flavor={ButtonFlavor.link}
						className="black text-decoration-underline margin-top-20"
					/>}
				</div>
			</div>
			{renderFooterLine(eventStore)}
		</div>
	);
};

export default observer(LandingPage);
