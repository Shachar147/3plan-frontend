import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataServices } from '../../services/data-handlers/data-handler-base';
import ReactModalService from '../../services/react-modal-service';
import { eventStoreContext } from '../../stores/events-store';
import { runInAction } from 'mobx';
import LoadingComponent from '../../components/loading/loading-component';
import TranslateService from '../../services/translate-service';
import { getCurrentUsername, LOADER_DETAILS } from '../../utils/utils';
import LogHistoryService from '../../services/data-handlers/log-history-service';
import { TripActions } from '../../utils/interfaces';

function InviteLink() {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

	const loaderDetails = LOADER_DETAILS();

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const token = searchParams.get('token');

	// Try to use the invite link. if it's working, redirect user to the trip page.
	// otherwise - show error message.
	// if the same user that did the invite try to use it, simply redirect him.
	useEffect(() => {
		if (!token) {
			return;
		}
		DataServices.DBService.useInviteLink(eventStore, token).then((response) => {
			const trip = response.data;
			const tripName = trip.name;

			runInAction(() => {
				// manually set loading before redirect to the page to prevent a bug of
				// glimpse view of the previous trip before updating to this one.
				eventStore.isLoading = true;
				eventStore.setTripName(tripName);
			});

			// log history - used invite link to join
			eventStore.tripId = trip.id;
			LogHistoryService.logHistory(eventStore, TripActions.usedShareTripLink, {});

			navigate('/plan/' + tripName, {});
		});
	}, [token]);

	return (
		<LoadingComponent
			title={TranslateService.translate(eventStore, 'LOADING_PAGE.TITLE')}
			message={TranslateService.translate(eventStore, 'LOADING_TRIP_PLACEHOLDER')}
			loaderDetails={loaderDetails}
		/>
	);
}

export default InviteLink;
